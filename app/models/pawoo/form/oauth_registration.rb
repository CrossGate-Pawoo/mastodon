# frozen_string_literal: true

class Pawoo::Form::OauthRegistration
  include ActiveModel::Model
  include TypeAttributes

  PRIVATE_USER_NAME_PREFIX = 'user_'

  attr_accessor :user, :oauth_authentication, :avatar, :email_confirmed, :locale
  attr_accessor :provider, :uid
  type_attribute :email, :string
  type_attribute :username, :string
  type_attribute :display_name, :string
  type_attribute :note, :string

  validate :validate_user

  class << self
    def from_omniauth_auth(omniauth_auth)
      case omniauth_auth['provider']
      when 'pixiv'
        email = omniauth_auth['info']['email']
        email = nil unless Pawoo::OauthEmailAddressChecker.can_copy?(email)
        new(
          provider: 'pixiv',
          uid: omniauth_auth['uid'],
          email_confirmed: omniauth_auth['extra']['raw_info']['is_mail_authorized'],
          email: email,
          username: normalize_username(omniauth_auth['info']['account']),
          display_name: omniauth_auth['info']['nickname'],
          note: omniauth_auth['extra']['raw_info']['profile']['introduction'],
          avatar: omniauth_auth['info']['avatar']
        )
      else
        new
      end
    end

    private

    # Normalize username for format validator of Account#username
    def normalize_username(string)
      username = string.to_s.tr('-', '_').remove(/[^a-z0-9_]/i, '')
      username unless username.start_with?(PRIVATE_USER_NAME_PREFIX)
    end
  end

  def email_confirmed?
    email.present? && email_confirmed
  end

  def email=(value)
    @email = value unless email_confirmed?
  end

  def save
    return false if invalid?

    attributes = user_attributes
    attributes[:account_attributes].merge!(avatar: fetch_pixiv_avatar(avatar))
    self.user = User.new(attributes)

    ApplicationRecord.transaction do
      user.skip_confirmation_notification! if email_confirmed?
      self.oauth_authentication = user.oauth_authentications.build(provider: provider, uid: uid)
      user.save! && user.create_initial_password_usage! && oauth_authentication.save!
    end

    true
  rescue ActiveRecord::RecordInvalid
    false
  end

  private

  def fetch_pixiv_avatar(url)
    image = OpenURI.open_uri(url, 'Referer' => "https://#{Rails.configuration.x.local_domain}")
    account = Account.new(avatar: image)
    account.valid?
    account.avatar unless account.errors.key?(:avatar)
  rescue
    nil
  end

  def validate_user
    self.user = User.new(user_attributes)
    return if user.valid?

    user.errors.messages.each do |key, messages|
      case key
      when :email
        messages.each { |message| errors.add(:email, message) }
      when :'account.username'
        messages.each { |message| errors.add(:username, message) }
      when :'account.display_name'
        messages.each { |message| errors.add(:display_name, message) }
      when :'account.note'
        messages.each { |message| errors.add(:note, message) }
      end
    end
  end

  def user_attributes
    password = SecureRandom.base64
    confirmed_at = Time.current if email_confirmed?

    {
      email: email,
      locale: locale,
      password: password,
      password_confirmation: password,
      confirmed_at: confirmed_at,
      account_attributes: {
        username: username,
        display_name: display_name,
        note: note
      }
    }
  end
end
