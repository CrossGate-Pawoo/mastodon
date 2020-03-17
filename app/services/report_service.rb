# frozen_string_literal: true

class ReportService < BaseService
  include Payloadable

  def call(source_account, target_account, options = {})
    @source_account = source_account
    @target_account = target_account
    @status_ids     = options.delete(:status_ids) || []
    @comment        = options.delete(:comment) || ''
    @options        = options

    create_report!

    # 管理者権限を持つ全てのアカウントにメールが送信されるため一旦無効化
    # notify_staff!
    pawoo_enqueue_notify_report_worker

    forward_to_origin! if !@target_account.local? && ActiveModel::Type::Boolean.new.cast(@options[:forward])

    @report
  end

  private

  def create_report!
    @report = @source_account.reports.create!(
      target_account: @target_account,
      status_ids: @status_ids,
      comment: @comment,
      uri: @options[:uri],
      action_taken: true,
      pawoo_report_type: @options[:pawoo_report_type],
      pawoo_report_targets: pawoo_report_targets
    )
  end

  def notify_staff!
    return if @report.unresolved_siblings?

    User.staff.includes(:account).each do |u|
      next unless u.allows_report_emails?
      AdminMailer.new_report(u.account, @report).deliver_later
    end
  end

  def pawoo_enqueue_notify_report_worker
    return unless @report.pawoo_report_type == 'spam'

    Pawoo::NotifyReportWorker.perform_async(@report.id)
  end

  def forward_to_origin!
    ActivityPub::DeliveryWorker.perform_async(
      payload,
      some_local_account.id,
      @target_account.inbox_url
    )
  end

  def payload
    Oj.dump(serialize_payload(@report, ActivityPub::FlagSerializer, account: some_local_account))
  end

  def some_local_account
    @some_local_account ||= Account.representative
  end

  def pawoo_report_targets
    return [] if @options[:pawoo_report_type].to_s == 'donotlike'

    if @status_ids.blank?
      if @target_account.suspended?
        return []
      else
        return [Pawoo::ReportTarget.new(target: @target_account)]
      end
    end

    status_ids = Status.joins(:account).where(id: @status_ids).merge(Account.where(suspended: false)).pluck(:id)
    resolved_target_ids = Pawoo::ReportTarget.where(state: :resolved, target_type: 'Status', target_id: status_ids).distinct(:target_id).pluck(:target_id)
    status_ids -= resolved_target_ids

    if @options[:pawoo_report_type].to_s == 'nsfw'
      nsfw_status_ids = Status.where(sensitive: true, id: status_ids).pluck(:id)
      status_ids -= nsfw_status_ids
    end

    status_ids.map do |status_id|
      Pawoo::ReportTarget.new(target_type: 'Status', target_id: status_id, state: :unresolved)
    end
  end
end
