# frozen_string_literal: true

class Pawoo::Api::V1::TrendTagsController < Api::BaseController
  respond_to :json

  def index
    limit_size = params[:limit] || 5
    limit = limit_size.to_i.clamp(0, 10)

    @trend_tags = Pawoo::TrendTag.find_tags(limit)
    render json: @trend_tags, each_serializer: Pawoo::REST::TrendTagSerializer
  end
end
