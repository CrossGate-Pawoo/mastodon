# frozen_string_literal: true

class Pawoo::CopyStatusStatWorker
  include Sidekiq::Worker

  sidekiq_options queue: 'push', unique: :until_executed

  def perform(max_status_id)
    base_scope = Status.unscoped
    status_ids = base_scope.where(Status.arel_table[:id].lt(max_status_id))
                           .merge(base_scope.where(Status.arel_table[:reblogs_count].gt(0)).or(base_scope.where(Status.arel_table[:favourites_count].gt(0))))
                           .order(id: :desc).limit(1000).pluck(:id)

    return if status_ids.blank?

    status_ids.each_slice(100).each do |ids|
      if supports_upsert?
        up_fast(ids)
      else
        up_slow(ids)
      end

      sleep 1
    end

    Pawoo::CopyStatusStatWorker.perform_async(status_ids.last)
  end

  private

  def supports_upsert?
    return @supports_upsert if defined?(@supports_upsert)

    version = ActiveRecord::Base.connection.select_one("SELECT current_setting('server_version_num') AS v")['v'].to_i
    @supports_upsert = version >= 90500
  end

  def up_fast(status_ids)
    ActiveRecord::Base.connection.execute <<-SQL.squish
      INSERT INTO status_stats (status_id, reblogs_count, favourites_count, created_at, updated_at)
      SELECT id, reblogs_count, favourites_count, created_at, updated_at
      FROM statuses
      WHERE id IN (#{status_ids.join(', ')})
      ON CONFLICT (status_id) DO UPDATE
      SET reblogs_count = EXCLUDED.reblogs_count, favourites_count = EXCLUDED.favourites_count
    SQL
  end

  def up_slow(status_ids)
    # We cannot use bulk INSERT or overarching transactions here because of possible
    # uniqueness violations that we need to skip over
    Status.unscoped.select('id, reblogs_count, favourites_count, created_at, updated_at').where(id: status_ids).find_each do |status|
      begin
        params = [[nil, status.id], [nil, status.reblogs_count], [nil, status.favourites_count], [nil, status.created_at], [nil, status.updated_at]]
        exec_insert('INSERT INTO status_stats (status_id, reblogs_count, favourites_count, created_at, updated_at) VALUES ($1, $2, $3, $4, $5)', nil, params)
      rescue ActiveRecord::RecordNotUnique
        next
      end
    end
  end
end
