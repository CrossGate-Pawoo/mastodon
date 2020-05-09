class Pawoo::OauthRegistrationsController < DeviseController
  include Devise::Controllers::Rememberable
  include Pawoo::WithRedisSessionStore

  before_action :require_omniauth_auth
  before_action :require_no_authentication
  before_action :set_oauth_registration

  def new; end

  def create
    @oauth_registration.assign_attributes(oauth_registration_params)

    if @oauth_registration.save
      user = @oauth_registration.user
      sign_in(user)
      remember_me(user)

      BootstrapTimelineWorker.perform_async(user.account_id)
      FetchPixivFollowsWorker.perform_async(
        @oauth_registration.oauth_authentication.id,
        *omniauth_auth['credentials'].values_at('token', 'refresh_token', 'expires_at')
      )

      redirect_to after_sign_in_path_for(user)
    elsif @oauth_registration.user.errors.added?(:email, :taken, value: @oauth_registration.user.email) && @oauth_registration.email_confirmed?
      redirect_to new_user_session_path, alert: t('.already_registered')
    else
      render :new, status: :unprocessable_entity
    end
  end

  private

  def set_oauth_registration
    @oauth_registration = Pawoo::Form::OauthRegistration.from_omniauth_auth(omniauth_auth)
  end

  def require_omniauth_auth
    redirect_to root_path, alert: t('devise.failure.timeout') unless omniauth_auth
  end

  def omniauth_auth
    @omniauth_auth ||= JSON.parse(pawoo_redis_session_store('devise.omniauth').get('auth'))
  rescue TypeError, JSON::ParserError
    nil
  end

  def oauth_registration_params
    params.require(:pawoo_form_oauth_registration).permit(
      :email, :username, :display_name, :note, :agreement
    ).merge(locale: I18n.locale)
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
