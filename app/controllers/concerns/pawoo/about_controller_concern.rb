# frozen_string_literal: true

module Pawoo::AboutControllerConcern
  extend ActiveSupport::Concern

  included do
    before_action :set_body_classes, only: [:show]
    before_action :set_initial_state_json, only: [:show]
  end

  private

  def set_body_classes
    @body_classes = 'pawoo-about-body'
  end

  def set_initial_state_json
    serializable_resource = ActiveModelSerializers::SerializableResource.new(InitialStatePresenter.new(initial_state_params), serializer: InitialStateSerializer)
    @initial_state_json   = serializable_resource.to_json
  end

  def initial_state_params
    {
      settings: { known_fediverse: Setting.show_known_fediverse_at_about_page },
      token: current_session&.token,
      pawoo: {
        user_count: @instance_presenter.user_count,
        status_count: @instance_presenter.status_count,
      },
    }
  end
end
