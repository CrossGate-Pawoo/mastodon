# frozen_string_literal: true

class Pawoo::CopyAccountStatWorker
  include Sidekiq::Worker

  sidekiq_options queue: 'pull', unique: :until_executed

  def perform(max_account_id)
    base_scope = Account.unscoped
    account_ids = base_scope.where(Account.arel_table[:id].lt(max_account_id))
                            .merge(base_scope.where(Account.arel_table[:statuses_count].gt(0))
                                             .or(base_scope.where(Account.arel_table[:following_count].gt(0)))
                                             .or(base_scope.where(Account.arel_table[:followers_count].gt(0))))
                            .order(id: :desc).limit(1000).pluck(:id)

    return if account_ids.blank?

    account_ids.each_slice(100).each do |ids|
      if supports_upsert?
        up_fast(ids)
      else
        up_slow(ids)
      end

      sleep 1
    end

    Pawoo::CopyAccountStatWorker.perform_async(account_ids.last)
  end

  private

  def supports_upsert?
    return @supports_upsert if defined?(@supports_upsert)

    version = ActiveRecord::Base.connection.select_one("SELECT current_setting('server_version_num') AS v")['v'].to_i
    @supports_upsert = version >= 90500
  end


  def up_fast(account_ids)
    ActiveRecord::Base.connection.execute <<-SQL.squish
      INSERT INTO account_stats (account_id, statuses_count, following_count, followers_count, created_at, updated_at)
      SELECT id, statuses_count, following_count, followers_count, created_at, updated_at
      FROM accounts
      WHERE id IN (#{account_ids.join(', ')})
      ON CONFLICT (account_id) DO UPDATE
      SET statuses_count = EXCLUDED.statuses_count, following_count = EXCLUDED.following_count, followers_count = EXCLUDED.followers_count
    SQL
  end

  def up_slow(account_ids)
    # We cannot use bulk INSERT or overarching transactions here because of possible
    # uniqueness violations that we need to skip over
    Account.unscoped.select('id, statuses_count, following_count, followers_count, created_at, updated_at').where(id: account_ids).find_each do |account|
      begin
        params = [[nil, account.id], [nil, account[:statuses_count]], [nil, account[:following_count]], [nil, account[:followers_count]], [nil, account.created_at], [nil, account.updated_at]]
        exec_insert('INSERT INTO account_stats (account_id, statuses_count, following_count, followers_count, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6)', nil, params)
      rescue ActiveRecord::RecordNotUnique
        next
      end
    end
  end
end
