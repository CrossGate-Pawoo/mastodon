# frozen_string_literal: true

class Pawoo::Api::V1::GalleriesController < Api::BaseController
  respond_to :json

  DEFAULT_SUGGESTION_LIMIT = 30

  def show
    @gallery = Pawoo::Gallery.joins(:tag).find_by!(tags: { name: params[:tag].downcase })
    if !@gallery.published? && !current_user&.admin?
      raise ActiveRecord::RecordNotFound
    end

    limit = limit_param(DEFAULT_SUGGESTION_LIMIT)

    @statuses = cache_collection(@gallery.filtered_statuses(limit, params[:max_id], params[:since_id]), Status)

    insert_pagination_headers

    render json: @statuses, each_serializer: ::REST::StatusSerializer, relationships: StatusRelationshipsPresenter.new(@statuses, current_user&.account_id)
  end

  private

  def insert_pagination_headers
    set_pagination_headers(next_path, prev_path)
  end

  def pagination_params(core_params)
    params.slice(:limit).permit(:limit).merge(core_params)
  end

  def next_path
    api_v1_pawoo_gallery_url pagination_params(max_id: @statuses.last.id) if @statuses.present?
  end

  def prev_path
    api_v1_pawoo_gallery_url pagination_params(since_id: @statuses.first.id) if @statuses.present?
  end
end
