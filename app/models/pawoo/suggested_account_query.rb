# rubocop:disable Lint/UselessAccessModifier
class Pawoo::SuggestedAccountQuery
  attr_reader :excluded_ids, :seed, :limit, :page_number

  def initialize
    @excluded_ids = []
    @seed = Random.new_seed
    @limit = 20
    @page_number = 0
  end

  def exclude_ids(ids)
    spawn(excluded_ids: (excluded_ids + ids).uniq)
  end

  def shuffle(seed)
    spawn(seed: seed)
  end

  def per(limit)
    spawn(limit: limit.to_i)
  end

  def page(page_number)
    spawn(page_number: page_number.to_i)
  end

  concerning :PotentialFriendshipQuery do
    included do
      attr_reader :account, :with_potential_friendship_limit
    end

    def with_potential_friendship(account, limit: 4)
      spawn(account: account, with_potential_friendship_limit: limit.to_i)
    end

    private

    def potential_friendship_account_ids
      return [] unless enable_potential_friendship_account_query?

      offset = with_potential_friendship_limit * page_number
      account_ids = PotentialFriendshipTracker.get(account.id, limit: with_potential_friendship_limit, offset: offset).map(&:id)
      account_ids = filter_by_last_status_at_and_searchable(account_ids)

      account_ids - excluded_ids
    end

    def enable_potential_friendship_account_query?
      with_potential_friendship_limit.to_i.positive? && account
    end
  end

  concerning :PixivFollowQuery do
    included do
      attr_reader :oauth_authentication, :with_pixiv_follows_limit
    end

    def with_pixiv_follows(oauth_authentication, limit: 4)
      spawn(oauth_authentication: oauth_authentication, with_pixiv_follows_limit: limit.to_i)
    end

    private

    def pixiv_following_account_ids
      return [] unless enable_pixiv_follows_query?

      account_ids = Rails.cache.fetch("pawoo:PopularAccountQuery:pixiv_following_account_ids:#{oauth_authentication.id}", expires_in: 1.hour) do
        uids = oauth_authentication.pixiv_follows.pluck(:target_pixiv_uid)
        ids = User.joins(:oauth_authentications)
                  .where(oauth_authentications: { provider: 'pixiv', uid: uids })
                  .pluck(:account_id)
        ids = filter_by_last_status_at_and_searchable(ids)
        # メディアを投稿しているユーザーだけを取り出すため、media_attachmentsとjoinする
        MediaAttachment.reorder(:account_id).where(account_id: ids).distinct(:account_id).pluck(:account_id)
      end

      shuffle_ids(account_ids) - excluded_ids
    end

    def enable_pixiv_follows_query?
      with_pixiv_follows_limit.to_i.positive? && oauth_authentication
    end
  end

  concerning :PopularAccountQuery do
    private

    def popular_account_ids
      account_ids = Rails.cache.fetch('pawoo:PopularAccountQuery:active_popular_account_ids', expires_in: 1.hour) do
        key = Pawoo::RefreshPopularAccountService::REDIS_KEY
        all_popular_account_ids = Redis.current.zrevrange(key, 0, -1).map(&:to_i)
        filter_by_last_status_at_and_searchable(all_popular_account_ids)
      end

      shuffle_ids(account_ids) - excluded_ids
    end
  end

  def all
    ids = []
    ids += pickup(pixiv_following_account_ids, limit: with_pixiv_follows_limit)
    ids += (potential_friendship_account_ids - ids)
    ids += pickup(popular_account_ids - ids, limit: limit - ids.length) # limitに達する数までidを取得する

    # sort_byにより、取得したAccountがidsの順番通りになるよう再度並び替える
    default_scoped.where(id: ids)
                  .preload(:oauth_authentications)
                  .limit(limit)
                  .sort_by { |account| ids.index(account.id) }
  end

  private

  def pickup(ids, limit: 0)
    offset = limit * page_number
    ids.slice(offset, limit) || []
  end

  def shuffle_ids(ids)
    ids.shuffle(random: Random.new(seed))
  end

  def filter_by_last_status_at_and_searchable(ids)
    AccountStat.joins(:account)
               .where(account_id: ids).where(AccountStat.arel_table[:last_status_at].gt(3.days.ago))
               .merge(default_scoped)
               .order(:account_id)
               .pluck(:account_id)
  end

  def spawn(variables)
    dup.tap do |instance|
      variables.each { |key, value| instance.instance_variable_set("@#{key}", value) }
    end
  end

  def default_scoped
    Account.searchable
  end
end
# rubocop:enable Lint/UselessAccessModifier
