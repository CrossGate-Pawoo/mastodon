# frozen_string_literal: true

class Pawoo::Scheduler::TrendTagScheduler
  include Sidekiq::Worker

  def perform
    tag_names = Pawoo::TrendTagService.new.call
    logger.info(tag_names)
  end
end
