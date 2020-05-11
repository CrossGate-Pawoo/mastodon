# frozen_string_literal: true

class Pawoo::Api::V1::Accounts::PinnedStatusesController < Api::BaseController
  before_action -> { authorize_if_got_token! :read, :'read:statuses' }
  before_action :set_account

  respond_to :json

  def index
    statuses = pinned_scope.paginate_by_id(limit_param(DEFAULT_STATUSES_LIMIT), params_slice(:max_id, :since_id, :min_id))
    @statuses = cache_collection(statuses, Status)

    render json: @statuses, each_serializer: REST::StatusSerializer, relationships: StatusRelationshipsPresenter.new(@statuses, current_user&.account_id), pawoo_from_pinned_statuses: true
  end

  private

  def pinned_scope
    return Status.none if @account.blocking?(current_account)

    @account.pinned_statuses
  end

  def set_account
    @account = Account.find(params[:account_id])
  end
end
