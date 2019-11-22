# frozen_string_literal: true

module Pawoo::OauthEmailAddressChecker
  DOMAIN_FOR_SIGN_IN_WITH_APPLE = 'privaterelay.appleid.com'

  def self.can_copy?(email)
    domain = Mail::Address.new(email).domain
    return false unless domain
    return false if domain == DOMAIN_FOR_SIGN_IN_WITH_APPLE

    true
  end
end
