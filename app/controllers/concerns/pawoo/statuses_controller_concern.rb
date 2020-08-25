# frozen_string_literal: true

module Pawoo::StatusesControllerConcern
  extend ActiveSupport::Concern

  included do
    helper_method :pawoo_schema
  end

  def pawoo_schema
    ActiveModelSerializers::SerializableResource.new(
      Pawoo::Schema::StatusPagePresenter.new(account: @account, status: @status),
      serializer: Pawoo::Schema::StatusBreadcrumbListSerializer
    )
  end
end
