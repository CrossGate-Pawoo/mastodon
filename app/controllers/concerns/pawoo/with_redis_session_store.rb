module Pawoo::WithRedisSessionStore
  private

  def pawoo_redis_session_store(suffix)
    raise 'session_id is not found' unless pawoo_current_session_id

    redis = Redis::Namespace.new(['redis_session_store', pawoo_current_session_id, suffix].join(':'))
    yield(redis) if block_given?
    redis
  end

  def pawoo_current_session_id
    session.send(:load_for_write!) unless session.id
    session.id.public_id
  end
end
