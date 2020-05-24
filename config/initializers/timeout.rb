require 'goldfinger'

module Goldfinger
  class Request
    module ShortTimeout
      private

      def http_client
        # original
        # HTTP.timeout(:per_operation, write: 60, connect: 20, read: 60).follow

        HTTP.timeout(:per_operation, write: 2, connect: 2, read: 2).follow
      end
    end

    prepend(ShortTimeout)
  end
end

if Rails.env.production?
  Rails.application.config.middleware.insert_before Rack::Runtime, Rack::Timeout, service_timeout: 30
end
