# frozen_string_literal: true

class ApplicationMailer < ActionMailer::Base
  layout 'mailer'

  # Just skip this, we dont want to perform the job again
  rescue_from('ActiveJob::DeserializationError') {}

  helper :application
  helper :instance

  protected

  def locale_for_account(account)
    I18n.with_locale(account.user_locale || I18n.default_locale) do
      yield
    end
  end
end
