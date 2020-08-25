# frozen_string_literal: true

class HomeFeed < Feed
  def initialize(account)
    @type    = :home
    @id      = account.id
    @account = account
  end

  def get(limit, max_id = nil, since_id = nil, min_id = nil)
    if redis.exists("account:#{@account.id}:regeneration")
      # When searching in ascending order, limit the search range because the search range is wide and takes a very long time.
      # In the case of min_id, it is searched from oldest to newest,
      # and it can be expected that the search range is not wide,
      # so wait and see without limiting
      max_id = max_id&.to_i
      since_id = since_id&.to_i
      limited_since_id = FeedManager.instance.calc_since_id(max_id)
      fixed_since_id = if since_id.nil? || since_id < limited_since_id
                         limited_since_id
                       else
                         since_id
                       end

      from_database(limit, max_id, fixed_since_id, min_id)
    else
      super
    end
  end

  private

  def from_database(limit, max_id, since_id, min_id)
    Status.as_home_timeline(@account)
          .paginate_by_id(limit, max_id: max_id, since_id: since_id, min_id: min_id)
          .reject { |status| FeedManager.instance.filter?(:home, status, @account.id) }
  end
end
