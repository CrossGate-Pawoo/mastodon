# frozen_string_literal: true

class Api::V1::Statuses::ReblogsController < Api::BaseController
  include Authorization

  before_action -> { doorkeeper_authorize! :write }
  before_action :require_user!
  before_action :set_reblog

  respond_to :json

  def create
    @status = ReblogService.new.call(current_account, @reblog)
    render json: @status, serializer: REST::StatusSerializer
  end

  def destroy
    @status = current_account.statuses.find_by(reblog_of_id: @reblog.id)

    if @status
      authorize @status, :unreblog?
      # 論理削除はまだサポートしてない。忘れそうなのでコメントアウトで残しておく
      # @status.discard
      RemovalWorker.perform_async(@status.id)
    end

    render json: @reblog, serializer: REST::StatusSerializer, relationships: StatusRelationshipsPresenter.new([@status], current_account.id, reblogs_map: { @reblog.id => false })
  end

  private

  def set_reblog
    @reblog = Status.find(params[:status_id])
    authorize @reblog, :show?
  rescue Mastodon::NotPermittedError
    not_found
  end
end
