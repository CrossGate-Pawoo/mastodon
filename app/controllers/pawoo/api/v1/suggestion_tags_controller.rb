# frozen_string_literal: true

class Pawoo::Api::V1::SuggestionTagsController < Api::BaseController
  respond_to :json

  DEFAULT_SUGGESTION_LIMIT = 30

  def index
    type = params[:type].presence || :normal
    raise Mastodon::ValidationError unless SuggestionTag.suggestion_types.include?(type)

    limit = limit_param(DEFAULT_SUGGESTION_LIMIT)
    @suggestion_tags = SuggestionTag.where(suggestion_type: type).order(:order).limit(limit)
    render json: @suggestion_tags, each_serializer: Pawoo::REST::SuggestionTagSerializer
  end
end
