# frozen_string_literal: true

module Pawoo::AccountsControllerConcern
  extend ActiveSupport::Concern

  included do
    helper_method :pawoo_next_url, :pawoo_prev_url, :pawoo_schema, :pawoo_pagination?
  end

  private

  def pawoo_filtered_status_page(params, page_size)
    filtered_statuses.page(params[:page]).per(page_size).without_count
  end

  def pawoo_pagination?
    params[:min_id].blank? && params[:max_id].blank?
  end

  def pawoo_current_page
    params[:page].blank? ? 1 : params[:page].to_i
  end

  def pawoo_next_url
    next_page = pawoo_current_page + 1

    if media_requested?
      short_account_media_url(@account, page: next_page)
    elsif replies_requested?
      short_account_with_replies_url(@account, page: next_page)
    else
      short_account_url(@account, page: next_page)
    end
  end

  def pawoo_prev_url
    prev_page = pawoo_current_page - 1
    prev_page = nil if prev_page == 1

    if media_requested?
      short_account_media_url(@account, page: prev_page)
    elsif replies_requested?
      short_account_with_replies_url(@account, page: prev_page)
    else
      short_account_url(@account, page: prev_page)
    end
  end

  def pawoo_schema
    presenter = Pawoo::Schema::AccountPagePresenter.new(
      account: @account,
      statuses: pawoo_current_page == 1 ? @pinned_statuses + @statuses : @statuses
    )

    [
      ActiveModelSerializers::SerializableResource.new(
        presenter,
        serializer: Pawoo::Schema::AccountBreadcrumbListSerializer
      ),

      ActiveModelSerializers::SerializableResource.new(
        presenter,
        serializer: Pawoo::Schema::AccountItemListSerializer
      ),
    ]
  end
end
