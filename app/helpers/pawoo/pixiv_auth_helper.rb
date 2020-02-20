# frozen_string_literal: true

module Pawoo
  module PixivAuthHelper
    def pawoo_pixiv_auth_url
      login_params = { view_type: 'page', source: 'pawoo', return_to: user_pixiv_omniauth_authorize_url }
      "#{Rails.configuration.x.accounts_pixiv_url}/login?#{login_params.to_query}"
    end
  end
end
