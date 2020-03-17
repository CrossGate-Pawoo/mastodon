# frozen_string_literal: true

module Pawoo::UserExtension
  extend ActiveSupport::Concern

  included do
    has_many :oauth_authentications, dependent: :destroy
    has_one :initial_password_usage, dependent: :destroy

    after_update :delete_initial_password_usage, if: :saved_change_to_encrypted_password?
  end

  private

  def delete_initial_password_usage
    initial_password_usage&.destroy!
  end
end
