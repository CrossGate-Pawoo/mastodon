# frozen_string_literal: true

module Pawoo::MediaAttachmentExtension
  extend ActiveSupport::Concern

  included do
    # Check for invalid characters
    validates :description, pawoo_crashed_unicode: true
  end
end
