# frozen_string_literal: true

class Pawoo::RefreshPopularAccountService
  ACTIVE_ACCOUNT_DURATION = 2.weeks
  RECENT_MEDIA_DURATION = 1.month
  REDIS_KEY = 'pawoo:popular_account_ids'
  MIN_SCORE = 50
  MIN_RECENT_STATUS_COUNT = 4

  def initialize
    @accounts_infomations = {}
  end

  def call
    load_active_accounts
    load_pixiv_followers_count
    load_latest_media_statuses

    popular_account_tuples = []
    @accounts_infomations.each do |account_id, info|
      score = calc_score(info)
      popular_account_tuples << [score, account_id] if score > MIN_SCORE
    end
    store_to_redis(popular_account_tuples)
  end

  private

  def load_active_accounts
    exclude_account_usernames = (Setting.bootstrap_timeline_accounts || '').split(',').map { |str| str.strip.gsub(/\A@/, '') }
    base_account_query = Account.local.where.not(username: exclude_account_usernames).where(suspended_at: nil, silenced_at: nil)

    min_status_id = Mastodon::Snowflake.id_at(ACTIVE_ACCOUNT_DURATION.ago)
    active_account_ids = Status.group(:account_id).local.without_reblogs
                               .where('id > ?', min_status_id).where(visibility: [:public, :unlisted])
                               .having('count(id) >= ?', MIN_RECENT_STATUS_COUNT).reorder(nil).pluck(:account_id)

    active_account_ids.each_slice(1000) do |account_ids|
      base_account_query.where(id: account_ids).preload(:oauth_authentications).each do |account|
        @accounts_infomations[account.id] = {
          account: account,
          pixiv_uid: account.oauth_authentications&.first&.uid&.to_i,
          media_statuses: [],
          pixiv_followers_count: 0,
        }
      end
    end
  end

  def load_pixiv_followers_count
    pixiv_uids = @accounts_infomations.map { |_, info| info[:pixiv_uid] }.compact
    pixiv_followers_count_of = PixivFollow.where(target_pixiv_uid: pixiv_uids).group(:target_pixiv_uid).count
    @accounts_infomations.each_value do |info|
      info[:pixiv_followers_count] = pixiv_followers_count_of[info[:pixiv_uid]] || 0
    end
  end

  def load_latest_media_statuses
    account_ids = @accounts_infomations.map { |_, info| info[:account].id }
    min_status_id = Mastodon::Snowflake.id_at(RECENT_MEDIA_DURATION.ago)

    media_attached_status_ids = MediaAttachment.attached.where(account_id: account_ids).where('media_attachments.status_id > ?', min_status_id).reorder(nil).distinct(:status_id).pluck(:status_id)
    media_attached_status_ids.each_slice(1000) do |status_ids|
      Status.where(id: status_ids, visibility: [:public, :unlisted]).each do |status|
        @accounts_infomations[status.account_id][:media_statuses] << status
      end
    end
  end

  def calc_score(info)
    info[:pixiv_followers_count] + info[:media_statuses].reduce(0) { |sum, status| sum + status.favourites_count + status.reblogs_count }
  end

  def store_to_redis(popular_account_tuples)
    new_popular_account_ids = popular_account_tuples.map { |tuple| tuple[1] }
    old_popular_account_ids = redis.zrange(REDIS_KEY, 0, -1).map(&:to_i) - new_popular_account_ids

    redis.zadd(REDIS_KEY, popular_account_tuples) if popular_account_tuples.present?
    redis.zrem(REDIS_KEY, old_popular_account_ids) if old_popular_account_ids.present?
  end

  def redis
    Redis.current
  end
end
