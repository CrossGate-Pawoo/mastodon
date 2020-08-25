# frozen_string_literal: true

module Pawoo::StatusExtension
  extend ActiveSupport::Concern

  included do
    has_one :status_pin, dependent: :destroy # used in Pawoo::AccountMediaAttachmentIdsQuery
    has_many :pixiv_cards, dependent: :destroy
    has_many :gallery_blacklisted_statuses, dependent: :destroy, class_name: 'Pawoo::GalleryBlacklistedStatus'

    # Check for invalid characters
    validates :text, pawoo_crashed_unicode: true
    validates :spoiler_text, pawoo_crashed_unicode: true
  end
end
