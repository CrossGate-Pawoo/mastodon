# frozen_string_literal: true

class Pawoo::Sitemap::User < Pawoo::Sitemap
  REDIS_KEY = 'user_indexes'
  ALLOW_FOLLOWERS_COUNT = 10
  ALLOW_STATUS_COUNT    = 5

  def self.page_count
    (::User.maximum(:id) / SITEMAPINDEX_SIZE) + 1
  end

  def query
    account_ids = read_from_cache

    Account.where(id: account_ids).merge(account_scope)
  end

  def prepare
    account_ids = ::User.joins(:account)
                        .where('users.id > ?', min_id)
                        .where('users.id <= ?', max_id)
                        .merge(account_scope)
                        .pluck(:account_id)

    store_to_cache(account_ids)
  end

  private

  def min_id
    (page.to_i - 1) * SITEMAPINDEX_SIZE
  end

  def max_id
    min_id + SITEMAPINDEX_SIZE
  end

  def account_scope
    Account.local.where(suspended_at: nil)
  end

  def account_stat_scope
    AccountStat.where('account_stats.followers_count >= ?', ALLOW_FOLLOWERS_COUNT)
               .where('account_stats.statuses_count >= ?', ALLOW_STATUS_COUNT)
  end
end
