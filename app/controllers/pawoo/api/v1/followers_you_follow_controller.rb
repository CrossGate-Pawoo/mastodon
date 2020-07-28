# frozen_string_literal: true

class Pawoo::Api::V1::FollowersYouFollowController < Api::BaseController
  before_action -> { doorkeeper_authorize! :read }
  before_action :require_user!
  respond_to :json

  def show
    target_account = Account.find(params[:account_id])
    current_account_id = current_account.id
    return render json: [] if target_account.id == current_account_id || target_account.user_hides_network?

    target_followers = Follow.where(target_account_id: target_account.id).select(:account_id)
    @followers_you_follow = Follow.where(account_id: current_account_id, target_account_id: target_followers).preload(target_account: :oauth_authentications).limit(30)
    render json: @followers_you_follow.map(&:target_account), each_serializer: ::REST::AccountSerializer
  end
end
