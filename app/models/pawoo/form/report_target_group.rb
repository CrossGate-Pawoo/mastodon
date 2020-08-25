# frozen_string_literal: true

class Pawoo::Form::ReportTargetGroup
  include ActiveModel::Model

  attr_accessor :report_target_groups_params, :current_account, :state_param

  def save
    @report_target_groups_of = report_target_groups_params.values.group_by { |report_target_group| report_target_group[:action] }
    @resolved_report_target_groups = []
    @additional_resolved_report_targets = []
    @action_logs = []

    ApplicationRecord.transaction do
      process_no_problem
      prosess_pending
      prosess_set_nsfw
      prosess_delete_status
      prosess_silence_account
      prosess_suspend_account

      change_report_state(@resolved_report_target_groups, :resolved)
      Pawoo::ReportTarget.where(id: @additional_resolved_report_targets.map(&:id).uniq).update_all(state: :resolved) if @additional_resolved_report_targets.present?

      save_log_actions!
    end

    post_prosess_suspend_account

    true
  rescue ActiveRecord::RecordInvalid
    false
  end

  private

  def change_report_state(report_target_groups, state)
    pawoo_report_target_ids = report_target_groups.map { |report_target_group| report_target_group[:report_targets] }.flatten
    Pawoo::ReportTarget.where(id: pawoo_report_target_ids).update_all(state: state) if pawoo_report_target_ids.present?
  end

  def build_log_action(action, **more_attributes)
    Admin::ActionLog.new(account: current_account, action: "pawoo_report_target_#{action}", **more_attributes)
  end

  def save_log_actions!
    Admin::ActionLog.import! @action_logs if @action_logs.present?
  end

  def process_no_problem
    report_target_groups = @report_target_groups_of['no_problem']
    return if report_target_groups.blank?

    @resolved_report_target_groups += report_target_groups
    @action_logs += report_target_groups.map do |report_target_group|
      build_log_action('no_problem', target_type: report_target_group[:target_type], target_id: report_target_group[:target_id])
    end
  end

  def prosess_pending
    report_target_groups = @report_target_groups_of['change_to_pending']
    return if report_target_groups.blank?

    change_report_state(report_target_groups, :pending)
    @action_logs += report_target_groups.map do |report_target_group|
      build_log_action('change_to_pending', target_type: report_target_group[:target_type], target_id: report_target_group[:target_id])
    end
  end

  def prosess_set_nsfw
    report_target_groups = filter_by_type(@report_target_groups_of['set_nsfw'], 'Status')
    return if report_target_groups.blank?

    target_statuses = Status.where(id: extract_target_ids(report_target_groups)).select(:id)
    target_statuses.update_all(sensitive: true)

    @resolved_report_target_groups += report_target_groups
    @action_logs += target_statuses.map do |target_status|
      build_log_action('set_nsfw', target: target_status)
    end
  end

  def prosess_delete_status
    report_target_groups = filter_by_type(@report_target_groups_of['delete'], 'Status')
    return if report_target_groups.blank?

    # 削除前のデータをログに記録するため、select(:id)しない
    target_statuses = Status.where(id: extract_target_ids(report_target_groups))
    @action_logs += target_statuses.map do |target_status|
      # RemovalWorkerを実行する前に手動でrecorded_changesを設定
      build_log_action('delete', target: target_status, recorded_changes: target_status.attributes)
    end

    target_statuses.each do |status|
      RemovalWorker.perform_async(status.id)
    end
    @resolved_report_target_groups += report_target_groups
  end

  def prosess_silence_account
    report_target_groups = @report_target_groups_of['silence']
    return if report_target_groups.blank?

    target_accounts = Account.where(id: extract_account_ids(report_target_groups)).select(:id)
    target_accounts.update_all(silenced_at: Time.now.utc)

    target_account_ids = target_accounts.map(&:id)
    @additional_resolved_report_targets += Pawoo::ReportTarget.where(state: state_param, target_type: 'Account', target_id: target_account_ids)
    @additional_resolved_report_targets += Pawoo::ReportTarget.where(state: state_param).filter_status_by_account(target_account_ids)

    @resolved_report_target_groups += report_target_groups
    @action_logs += target_accounts.map do |target_account|
      build_log_action('silence', target: target_account)
    end
  end

  def prosess_suspend_account
    report_target_groups = @report_target_groups_of['suspend']
    return if report_target_groups.blank?

    @suspend_target_accounts = Account.where(id: extract_account_ids(report_target_groups)).select(:id)
    target_account_ids = @suspend_target_accounts.map(&:id)
    @additional_resolved_report_targets += Pawoo::ReportTarget.where(state: state_param, target_type: 'Account', target_id: target_account_ids)
    @additional_resolved_report_targets += Pawoo::ReportTarget.where(state: state_param).filter_status_by_account(target_account_ids)

    @resolved_report_target_groups += report_target_groups
    @action_logs += @suspend_target_accounts.map do |target_account|
      build_log_action('suspend', target: target_account)
    end
  end

  def post_prosess_suspend_account
    return unless @suspend_target_accounts

    @suspend_target_accounts.each do |account|
      Admin::SuspensionWorker.perform_async(account.id)
    end
  end

  def extract_account_ids(report_target_groups)
    status_target = filter_by_type(report_target_groups, 'Status')
    account_target = filter_by_type(report_target_groups, 'Account')

    account_ids = []
    account_ids += Status.where(id: extract_target_ids(status_target)).pluck(:account_id)
    account_ids += extract_target_ids(account_target).map(&:to_i)
    account_ids.uniq
  end

  def filter_by_type(report_target_groups, type)
    report_target_groups&.select { |report_target_group| report_target_group[:target_type] == type }
  end

  def extract_target_ids(report_target_groups)
    report_target_groups.map { |report_target_group| report_target_group[:target_id] }
  end
end
