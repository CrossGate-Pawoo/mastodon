# frozen_string_literal: true
require 'sidekiq-scheduler'

class Pawoo::Scheduler::CacheCountScheduler
  include Sidekiq::Worker

  sidekiq_options unique: :until_executed, retry: 0

  def perform
    instance_presenter = InstancePresenter.new
    instance_presenter.user_count(pawoo_fetch_force: true)
    instance_presenter.status_count(pawoo_fetch_force: true)
    instance_presenter.domain_count(pawoo_fetch_force: true)
  end
end
