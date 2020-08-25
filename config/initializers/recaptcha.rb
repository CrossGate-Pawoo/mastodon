# frozen_string_literal: true

Recaptcha.configure do |config|
  if Rails.env.production?
    config.site_key = ENV['RECAPTCHA_SITE_KEY']
    config.secret_key = ENV['RECAPTCHA_SECRET_KEY']
  else
    # test keys
    # https://developers.google.com/recaptcha/docs/faq#id-like-to-run-automated-tests-with-recaptcha.-what-should-i-do
    config.site_key = '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI'
    config.secret_key = '6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe'
  end
end
