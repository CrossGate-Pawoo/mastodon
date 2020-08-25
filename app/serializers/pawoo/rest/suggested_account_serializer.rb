# frozen_string_literal: true

class Pawoo::REST::SuggestedAccountSerializer < REST::AccountSerializer
  has_many :media_attachments, serializer: REST::MediaAttachmentSerializer

  def media_attachments
    instance_options[:media_attachments_of][object.id] || []
  end
end
