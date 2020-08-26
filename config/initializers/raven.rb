# frozen_string_literal: true

Raven.configure do |config|
  config.dsn = ENV['PAWOO_SENTRY_RAILS']

  # Sentry通知を有効にしたいRAILS_ENV
  config.environments = %w[production staging]
  config.current_environment = 'staging' if ENV['PAWOO_STAGING'].present?

  config.async = ->(event) {
    Thread.new { Raven.send_event(event) }
  }

  # Sentryに送信したくないエラー
  config.excluded_exceptions += %w[
    ActionController::InvalidAuthenticityToken
    ActionController::BadRequest
    ActionController::UnknownFormat
    ActionController::ParameterMissing
    ActiveRecord::RecordNotUnique
    Mastodon::UnexpectedResponseError
    Mastodon::RaceConditionError
    Mastodon::HostValidationError
  ]

  config.should_capture = ->(message_or_exc) do
    PawooShouldCaptureChecker.should_capture(Raven::Context.current, message_or_exc)
  end
end

module PawooShouldCaptureChecker
  NETWORK_EXCEPTIONS = %w[
    HTTP::StateError
    HTTP::TimeoutError
    HTTP::ConnectionError
    HTTP::Redirector::TooManyRedirectsError
    HTTP::Redirector::EndlessRedirectError
    HTTP::Request::UnsupportedSchemeError
    OpenSSL::SSL::SSLError
    Stoplight::Error::RedLight
    Net::OpenTimeout
    Net::ReadTimeout
    Errno::ECONNRESET
  ].freeze

  NETWORK_WORKERS = %w[
    FetchReplyWorker
    LinkCrawlWorker
    ProcessingWorker
    ThreadResolveWorker
    NotificationWorker
    Import::RelationshipWorker
    Web::PushNotificationWorker
  ].freeze

  NETWORK_CONTROLLERS_OR_CONCERNS = %w[
    RemoteFollowController
    AuthorizeFollowsController
    RemoteInteractionController
    SignatureVerification
  ].freeze

  IGNORE_WORKER_ERRORS = {
    'ActivityPub::ProcessingWorker' => ['ActiveRecord::RecordInvalid'],
    'LinkCrawlWorker' => ['ActiveRecord::RecordInvalid'],
  }.freeze

  IGNORE_JOB_ERRORS = {
    'ActionMailer::DeliveryJob' => ['ActiveJob::DeserializationError']
  }.freeze

  IGNORE_CONTROLLER_ERRORS = {
    'MediaProxyController' => ['ActiveRecord::RecordInvalid'],
  }.freeze

  IGNORE_RECORD_INVALID_MESSAGES = [
    'includes invalid characters',
    'You cannot follow more than 5000 people',
    'Uri has already been taken',
  ].freeze

  class << self
    def should_capture(context, message_or_exc)
      return true unless message_or_exc.is_a? Exception

      exception_name = message_or_exc.class.name
      return false if ignore_by_record_invalid_message(exception_name, message_or_exc.message)
      return false if ignore_by_sidekiq(context, exception_name)
      return false if ignore_by_controller(context, exception_name)

      true
    end

    private

    def ignore_by_record_invalid_message(exception_name, message)
      return false if exception_name != 'ActiveRecord::RecordInvalid'

      IGNORE_RECORD_INVALID_MESSAGES.any? do |ignore_message|
        message.end_with?(ignore_message)
      end
    end

    def ignore_by_sidekiq(context, exception_name)
      sidekiq = context.extra.dig(:sidekiq)
      return false unless sidekiq

      worker_class = sidekiq.dig('class')
      return true if IGNORE_WORKER_ERRORS[worker_class]&.include?(exception_name)

      # ActivityPub or Pubsubhubbub or 通信が頻繁に発生するWorkerではネットワーク系の例外を無視
      if worker_class.start_with?('ActivityPub::') || worker_class.start_with?('Pubsubhubbub::') || NETWORK_WORKERS.include?(worker_class)
        return true if NETWORK_EXCEPTIONS.include?(exception_name)
      end

      # ActiveJob
      if worker_class == 'ActiveJob::QueueAdapters::SidekiqAdapter::JobWrapper'
        return true if IGNORE_JOB_ERRORS[sidekiq.dig('wrapped')]&.include?(exception_name)
      end

      false
    end

    def ignore_by_controller(context, exception_name)
      controller_class = context.rack_env&.dig('action_controller.instance')&.class
      return false unless controller_class

      return true if IGNORE_CONTROLLER_ERRORS[controller_class.name]&.include?(exception_name)

      # SignatureVerificationがincludeされているコントローラ or 通信が頻繁に発生するコントローラではネットワーク系のエラーを無視
      if controller_class.ancestors.any? { |klass| NETWORK_CONTROLLERS_OR_CONCERNS.include?(klass.name) }
        return true if NETWORK_EXCEPTIONS.include?(exception_name)
      end

      false
    end
  end
end
