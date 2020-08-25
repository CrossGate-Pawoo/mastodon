# frozen_string_literal: true

class Pawoo::Sitemap
  attr_reader :page

  SITEMAPINDEX_SIZE = 10_000

  def self.page_count
    raise 'please override'
  end

  def initialize(page)
    @page = page
  end

  def cached?
    Rails.cache.exist?(redis_key)
  end

  def redis_key
    "pawoo:sitemap:#{self.class::REDIS_KEY}:#{page}"
  end

  def read_from_cache
    Rails.cache.read(redis_key)
  end

  def store_to_cache(ids)
    Rails.cache.write(redis_key, ids, expires_in: 2.days)
  end
end
