require 'rails_helper'

describe Pawoo::Form::ReportTargetGroup do
  let!(:form) { Pawoo::Form::ReportTargetGroup.new(report_target_groups_params: report_target_groups_params, current_account: account, state_param: :unresolved) }
  let(:account) { Fabricate(:account) }
  let(:target_account1) { Fabricate(:account) }
  let(:target_account2) { Fabricate(:account) }
  let(:target_status1) { Fabricate(:status) }
  let(:target_status2) { Fabricate(:status) }
  let(:account_report1) { Fabricate(:report, action_taken: true, pawoo_report_targets: [Pawoo::ReportTarget.new(target: target_account1)]) }
  let(:account_report2) { Fabricate(:report, action_taken: true, pawoo_report_targets: [Pawoo::ReportTarget.new(target: target_account2)]) }
  let(:account_report3) { Fabricate(:report, action_taken: true, pawoo_report_targets: [Pawoo::ReportTarget.new(target: target_account2)]) }
  let(:status_report1) { Fabricate(:report, action_taken: true, pawoo_report_targets: [Pawoo::ReportTarget.new(target: target_status1), Pawoo::ReportTarget.new(target: target_status2)]) }
  let(:status_report2) { Fabricate(:report, action_taken: true, pawoo_report_targets: [Pawoo::ReportTarget.new(target: target_status2)]) }

  let(:report_targets_account1) { [account_report1.pawoo_report_targets[0].id] }
  let(:report_targets_account2) { [account_report2.pawoo_report_targets[0].id, account_report3.pawoo_report_targets[0].id] }
  let(:report_targets_status1) { [status_report1.pawoo_report_targets.find { |pawoo_report_target| pawoo_report_target.target == target_status1 }.id] }
  let(:report_targets_status2) do
    [status_report2.pawoo_report_targets[0].id, status_report1.pawoo_report_targets.find { |pawoo_report_target| pawoo_report_target.target == target_status2 }.id]
  end
  let(:report_target_groups_params_for_account) do
    {
      "Account_#{target_account1.id}": { action: action, target_type: 'Account', target_id: target_account1.id, report_targets: report_targets_account1 },
      "Account_#{target_account2.id}": { action: action, target_type: 'Account', target_id: target_account2.id, report_targets: report_targets_account2 },
    }
  end
  let(:report_target_groups_params_for_status) do
    {
      "Status_#{target_status1.id}": { action: action, target_type: 'Status', target_id: target_status1.id, report_targets: report_targets_status1 },
      "Status_#{target_status2.id}": { action: action, target_type: 'Status', target_id: target_status2.id, report_targets: report_targets_status2 },
    }
  end


  describe 'with no_problem action' do
    let(:action) { 'no_problem' }
    let(:report_target_groups_params) { { **report_target_groups_params_for_account, **report_target_groups_params_for_status } }
    let(:report_target_ids) { [*report_targets_account1, *report_targets_account2, *report_targets_status1, *report_targets_status2] }

    it { expect(form.save).to be true }
    it { expect { form.save }.to change { Admin::ActionLog.where(action: 'pawoo_report_target_no_problem', target: [target_account1, target_account2, target_status1, target_status2]).count }.by(4) }
    it { expect { form.save }.to change { Pawoo::ReportTarget.where(id: report_target_ids).pluck(:state) }.from(6.times.map {'unresolved' }).to(6.times.map {'resolved' }) }
  end

  describe 'with change_to_pending action' do
    let(:action) { 'change_to_pending' }
    let(:report_target_groups_params) { { **report_target_groups_params_for_account, **report_target_groups_params_for_status } }
    let(:report_target_ids) { [*report_targets_account1, *report_targets_account2, *report_targets_status1, *report_targets_status2] }

    it { expect(form.save).to be true }
    it { expect { form.save }.to change { Admin::ActionLog.where(action: 'pawoo_report_target_change_to_pending', target: [target_account1, target_account2, target_status1, target_status2]).count }.by(4) }
    it { expect { form.save }.to change { Pawoo::ReportTarget.where(id: report_target_ids).pluck(:state) }.from(6.times.map {'unresolved' }).to(6.times.map {'pending' }) }
  end

  describe 'with set_nsfw action' do
    let(:action) { 'set_nsfw' }

    context 'when target type is status' do
      let(:report_target_groups_params) { report_target_groups_params_for_status }
      let(:report_target_ids) { [*report_targets_status1, *report_targets_status2] }

      it { expect(form.save).to be true }
      it { expect { form.save }.to change { Admin::ActionLog.where(action: 'pawoo_report_target_set_nsfw', target: [target_status1, target_status2]).count }.by(2) }
      it { expect { form.save }.to change { Pawoo::ReportTarget.where(id: report_target_ids).pluck(:state) }.from(3.times.map {'unresolved' }).to(3.times.map {'resolved' }) }
      it { expect { form.save }.to change { target_status1.reload.sensitive }.from(false).to(true) }
      it { expect { form.save }.to change { target_status2.reload.sensitive }.from(false).to(true) }
    end

    context 'when target type is account' do
      let(:report_target_groups_params) { report_target_groups_params_for_account }
      let(:report_target_ids) { [*report_targets_account1, *report_targets_account2] }

      it { expect(form.save).to be true }
      it { expect { form.save }.not_to change { Admin::ActionLog.where(action: 'pawoo_report_target_set_nsfw').count } }
      it { expect { form.save }.not_to change { Pawoo::ReportTarget.where(id: report_target_ids).pluck(:state) } }
    end
  end

  describe 'with delete_status action' do
    let(:action) { 'delete' }

    before do
      allow(RemovalWorker).to receive(:perform_async)
    end

    context 'when target type is status' do
      let(:report_target_groups_params) { report_target_groups_params_for_status }
      let(:report_target_ids) { [*report_targets_status1, *report_targets_status2] }

      it { expect(form.save).to be true }
      it { expect { form.save }.to change { Admin::ActionLog.where(action: 'pawoo_report_target_delete', target: [target_status1, target_status2]).count }.by(2) }
      it { expect { form.save }.to change { Pawoo::ReportTarget.where(id: report_target_ids).pluck(:state) }.from(3.times.map {'unresolved' }).to(3.times.map {'resolved' }) }
      it 'call RemovalWorker' do
        form.save
        expect(RemovalWorker).to have_received(:perform_async).with(target_status1.id)
        expect(RemovalWorker).to have_received(:perform_async).with(target_status2.id)
      end
    end

    context 'when target type is account' do
      let(:report_target_groups_params) { report_target_groups_params_for_account }
      let(:report_target_ids) { [*report_targets_account1, *report_targets_account2] }

      it { expect(form.save).to be true }
      it { expect { form.save }.not_to change { Admin::ActionLog.where(action: 'pawoo_report_target_delete', target: [target_account1, target_account2]).count } }
      it { expect { form.save }.not_to change { Pawoo::ReportTarget.where(id: report_target_ids).pluck(:state) } }
      it 'do not call RemovalWorker' do
        form.save
        expect(RemovalWorker).not_to have_received(:perform_async)
      end
    end
  end

  describe 'with silence_account action' do
    let(:action) { 'silence' }
    let!(:other_report_targets) do
      [
        Fabricate(:report, action_taken: true, pawoo_report_targets: [Pawoo::ReportTarget.new(target: Fabricate(:status, account: target_account))]).pawoo_report_targets.first,
        Fabricate(:report, action_taken: true, pawoo_report_targets: [Pawoo::ReportTarget.new(target: target_account)]).pawoo_report_targets.first,
      ]
    end

    context 'when target type is status' do
      let(:report_target_groups_params) { report_target_groups_params_for_status }
      let(:report_target_ids) { [*report_targets_status1, *report_targets_status2] }
      let(:target_account) { target_status1.account }

      it { expect(form.save).to be true }
      it { expect { form.save }.to change { Admin::ActionLog.where(action: 'pawoo_report_target_silence', target: [target_status1, target_status2].map(&:account)).count }.by(2) }
      it { expect { form.save }.to change { Pawoo::ReportTarget.where(id: report_target_ids).pluck(:state) }.from(3.times.map {'unresolved' }).to(3.times.map {'resolved' }) }
      it { expect { form.save }.to change { Pawoo::ReportTarget.where(id: other_report_targets.map(&:id)).pluck(:state) }.from(2.times.map {'unresolved' }).to(2.times.map {'resolved' }) }
      it { expect { form.save }.to change { Account.where(id: [target_status1.account.id, target_status2.account.id]).map(&:silenced?) }.from([false, false]).to([true, true]) }
    end

    context 'when target type is account' do
      let(:report_target_groups_params) { report_target_groups_params_for_account }
      let(:report_target_ids) { [*report_targets_account1, *report_targets_account2] }
      let(:target_account) { target_account1 }

      it { expect(form.save).to be true }
      it { expect { form.save }.to change { Admin::ActionLog.where(action: 'pawoo_report_target_silence', target: [target_account1, target_account2]).count }.by(2) }
      it { expect { form.save }.to change { Pawoo::ReportTarget.where(id: report_target_ids).pluck(:state) }.from(3.times.map {'unresolved' }).to(3.times.map {'resolved' }) }
      it { expect { form.save }.to change { Pawoo::ReportTarget.where(id: other_report_targets.map(&:id)).pluck(:state) }.from(2.times.map {'unresolved' }).to(2.times.map {'resolved' }) }
      it { expect { form.save }.to change { Account.where(id: [target_account1.id, target_account2.id]).map(&:silenced?) }.from([false, false]).to([true, true]) }
    end
  end

  describe 'with suspend_account action' do
    let(:action) { 'suspend' }
    let!(:other_report_targets) do
      [
        Fabricate(:report, action_taken: true, pawoo_report_targets: [Pawoo::ReportTarget.new(target: Fabricate(:status, account: target_account))]).pawoo_report_targets.first,
        Fabricate(:report, action_taken: true, pawoo_report_targets: [Pawoo::ReportTarget.new(target: target_account)]).pawoo_report_targets.first,
      ]
    end

    before do
      allow(Admin::SuspensionWorker).to receive(:perform_async)
    end

    context 'when target type is status' do
      let(:report_target_groups_params) { report_target_groups_params_for_status }
      let(:report_target_ids) { [*report_targets_status1, *report_targets_status2] }
      let!(:account_report_target_ids) { [*report_targets_account1, *report_targets_account2] }
      let(:target_account) { target_status1.account }

      it { expect(form.save).to be true }
      it { expect { form.save }.to change { Admin::ActionLog.where(action: 'pawoo_report_target_suspend', target: [target_status1, target_status2].map(&:account)).count }.by(2) }
      it { expect { form.save }.to change { Pawoo::ReportTarget.where(id: report_target_ids).pluck(:state) }.from(3.times.map {'unresolved' }).to(3.times.map {'resolved' }) }
      it { expect { form.save }.to change { Pawoo::ReportTarget.where(id: other_report_targets.map(&:id)).pluck(:state) }.from(2.times.map {'unresolved' }).to(2.times.map {'resolved' }) }
      it 'call Admin::SuspensionWorker' do
        form.save
        expect(Admin::SuspensionWorker).to have_received(:perform_async).with(target_status1.account.id)
        expect(Admin::SuspensionWorker).to have_received(:perform_async).with(target_status2.account.id)
      end
    end

    context 'when target type is account' do
      let(:report_target_groups_params) { report_target_groups_params_for_account }
      let(:report_target_ids) { [*report_targets_account1, *report_targets_account2] }
      let(:target_account) { target_account1 }

      it { expect(form.save).to be true }
      it { expect { form.save }.to change { Admin::ActionLog.where(action: 'pawoo_report_target_suspend', target: [target_account1, target_account2]).count }.by(2) }
      it { expect { form.save }.to change { Pawoo::ReportTarget.where(id: report_target_ids).pluck(:state) }.from(3.times.map {'unresolved' }).to(3.times.map {'resolved' }) }
      it { expect { form.save }.to change { Pawoo::ReportTarget.where(id: other_report_targets.map(&:id)).pluck(:state) }.from(2.times.map {'unresolved' }).to(2.times.map {'resolved' }) }
      it 'call Admin::SuspensionWorker' do
        form.save
        expect(Admin::SuspensionWorker).to have_received(:perform_async).with(target_account1.id)
        expect(Admin::SuspensionWorker).to have_received(:perform_async).with(target_account2.id)
      end
    end
  end

  describe 'with multiple action' do
    let(:report_target_groups_params) do
      {
        "Account_#{target_account1.id}": { action: 'no_problem', target_type: 'Account', target_id: target_account1.id, report_targets: report_targets_account1 },
        "Account_#{target_account2.id}": { action: 'change_to_pending', target_type: 'Account', target_id: target_account2.id, report_targets: report_targets_account2 },
        "Status_#{target_status1.id}": { action: 'set_nsfw', target_type: 'Status', target_id: target_status1.id, report_targets: report_targets_status1 },
        "Status_#{target_status2.id}": { action: 'silence', target_type: 'Status', target_id: target_status2.id, report_targets: report_targets_status2 },
      }
    end
    let(:resolved_report_target_ids) { [*report_targets_account1, *report_targets_status1, *report_targets_status2] }

    it { expect(form.save).to be true }
    it { expect { form.save }.to change { Admin::ActionLog.where(action: 'pawoo_report_target_no_problem', target: target_account1).count }.by(1) }
    it { expect { form.save }.to change { Admin::ActionLog.where(action: 'pawoo_report_target_change_to_pending', target: target_account2).count }.by(1) }
    it { expect { form.save }.to change { Admin::ActionLog.where(action: 'pawoo_report_target_set_nsfw', target: target_status1).count }.by(1) }
    it { expect { form.save }.to change { Admin::ActionLog.where(action: 'pawoo_report_target_silence', target: target_status2.account).count }.by(1) }
    it { expect { form.save }.to change { Pawoo::ReportTarget.where(id: resolved_report_target_ids).pluck(:state) }.from(4.times.map {'unresolved' }).to(4.times.map {'resolved' }) }
    it { expect { form.save }.to change { Pawoo::ReportTarget.where(id: report_targets_account2).pluck(:state) }.from(2.times.map {'unresolved' }).to(2.times.map {'pending' }) }
    it { expect { form.save }.to change { target_status1.reload.sensitive }.from(false).to(true) }
    it { expect { form.save }.to change { target_status2.account.reload.silenced? }.from(false).to(true) }
  end
end
