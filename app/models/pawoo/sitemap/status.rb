# frozen_string_literal: true

class Pawoo::Sitemap::Status < Pawoo::Sitemap
  REDIS_KEY = 'status_indexes'
  ALLOW_REBLOGS_COUNT = 5

  def self.page_count
    1
  end

  def query
    status_ids = read_from_cache

    ::Status.joins(:account).joins(:status_stat)
            .select('statuses.id')
            .select('statuses.updated_at')
            .select('accounts.username')
            .select('status_stats.reblogs_count')
            .where(id: status_ids)
            .merge(status_scope).merge(account_scope).merge(status_stats_scope)
            .order('status_stats.status_id DESC')
  end

  def prepare
    min_id = Mastodon::Snowflake.id_at(30.days.ago)
    status_ids = StatusStat.joins(status: :account)
                           .where('status_stats.status_id > ?', min_id)
                           .where('statuses.id > ?', min_id)
                           .merge(status_scope).merge(account_scope).merge(status_stats_scope)
                           .order('status_stats.status_id DESC')
                           .limit(SITEMAPINDEX_SIZE)
                           .pluck('status_stats.status_id')

    store_to_cache(status_ids)
  end

  private

  def status_scope
    ::Status.local.without_reblogs
            .where(visibility: [:public, :unlisted])
            .reorder(nil)
  end

  def status_stats_scope
    StatusStat.where('status_stats.reblogs_count >= ?', ALLOW_REBLOGS_COUNT)
  end

  def account_scope
    Account.local.where(suspended_at: nil)
  end
end
