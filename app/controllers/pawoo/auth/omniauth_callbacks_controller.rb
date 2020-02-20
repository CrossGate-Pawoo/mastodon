# frozen_string_literal: true

class Pawoo::Auth::OmniauthCallbacksController < Devise::OmniauthCallbacksController
  include Devise::Controllers::Rememberable
  include Pawoo::WithRedisSessionStore
  include Localized

  def pixiv
    data = request.env['omniauth.auth']

    if signed_in?(:user)
      oauth_authentication = current_user.oauth_authentications.find_or_initialize_by(
        provider: data[:provider],
        uid: data[:uid]
      )

      if oauth_authentication.persisted?
        if current_user.initial_password_usage
          if can_update_email?(data)
            current_user.skip_reconfirmation!
            if current_user.update(email: data['info']['email'])
              flash[:notice] = t('oauth_authentications.successfully_synchronization')
            else
              flash[:alert] = current_user.errors.full_messages.first
            end
          else
            flash[:alert] = t('oauth_authentications.failed_synchronization')
          end
        end
      elsif oauth_authentication.save
        enqueue_fetch_pixiv_follows_worker(oauth_authentication, data)
        flash[:notice] = t('oauth_authentications.successfully_linked')
      else
        flash[:alert] = oauth_authentication.errors.full_messages.first
      end

      after_sign_in_for current_user
    else
      oauth_authentication = OauthAuthentication.find_by(provider: data.provider, uid: data.uid)

      if oauth_authentication
        enqueue_fetch_pixiv_follows_worker(oauth_authentication, data)

        user = oauth_authentication.user
        if user.otp_required_for_login?
          session[:otp_user_id] = user.id
          self.resource = user
          render 'auth/sessions/two_factor', layout: 'auth'
        else
          sign_in(user)
          remember_me(user)

          after_sign_in_for user
        end
      else
        store_omniauth_auth
        redirect_to new_user_oauth_registration_path
      end
    end
  end

  private

  def after_sign_in_for(user)
    redirect_to after_sign_in_path_for(user)
  end

  def enqueue_fetch_pixiv_follows_worker(oauth_authentication, data)
    FetchPixivFollowsWorker.perform_async(
      oauth_authentication.id,
      *data['credentials'].values_at('token', 'refresh_token', 'expires_at')
    )
  end

  def can_update_email?(omniauth_auth)
    return false unless omniauth_auth['extra']['raw_info']['is_mail_authorized']

    Pawoo::OauthEmailAddressChecker.can_copy?(omniauth_auth['info']['email'])
  end

  def store_omniauth_auth
    pawoo_redis_session_store('devise.omniauth') do |redis|
      redis.setex('auth', 15.minutes, request.env['omniauth.auth'].to_json)
    end
  end

  def after_sign_in_path_for(_resource)
    last_url = stored_location_for(:user)

    if last_url == about_path
      root_path
    else
      last_url || root_path
    end
  end
end
