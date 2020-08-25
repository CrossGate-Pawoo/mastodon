# frozen_string_literal: true

class Pawoo::Sitemap::PrepareStatusesWorker
  include Sidekiq::Worker

  sidekiq_options queue: 'pull', unique: :until_executed, retry: 0

  def perform(_page, _continuously_key = nil)
    # 1ページしか対応してない
    Pawoo::Sitemap::Status.new(1).prepare
  end
end
