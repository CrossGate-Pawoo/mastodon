# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Api::V1::ReportsController, type: :controller do
  render_views

  let(:user)  { Fabricate(:user, account: Fabricate(:account, username: 'alice')) }
  let(:token) { Fabricate(:accessible_access_token, resource_owner_id: user.id, scopes: 'read write') }

  before do
    allow(controller).to receive(:doorkeeper_token) { token }
  end

  describe 'POST #create' do
    let!(:status1) { Fabricate(:status) }
    let!(:status2) { Fabricate(:status) }
    let(:status_ids) { [status1.id, status2.id] }
    let(:pawoo_report_type) { nil }

    before do
      post :create, params: { status_ids: status_ids, account_id: user.account.id, comment: 'reasons', pawoo_report_type: pawoo_report_type }
    end

    subject { Report.find_by(comment: 'reasons') }

    context 'when the target status has not been dealt with yet' do
      it 'creates pawoo_report_targets' do
        expect(subject.pawoo_report_targets.count).to eq 2
        expect(subject.pawoo_report_targets.map(&:target)).to match_array [status1, status2]
        expect(subject.pawoo_report_targets.map(&:state)).to match ['unresolved', 'unresolved']
      end
    end

    context 'when the target status has been dealt with' do
      let(:status1) { Fabricate('Pawoo::ReportTarget', target: Fabricate(:status), state: :resolved).target }

      it 'creates pawoo_report_targets' do
        expect(subject.pawoo_report_targets.count).to eq 2
        expect(subject.pawoo_report_targets.find_by(target: status1).state).to eq 'resolved'
        expect(subject.pawoo_report_targets.find_by(target: status2).state).to eq 'unresolved'
      end
    end

    context 'when pawoo_report_type is null' do
      it 'creates a report' do
        expect(Report.find_by(comment: 'reasons').pawoo_report_type).to eq 'other'
        expect(Report.find_by(comment: 'reasons').action_taken).to be true
      end
    end

    context 'when pawoo_report_type is specified' do
      let(:pawoo_report_type) { Report.pawoo_report_types.keys.sample }

      it 'creates a report' do
        expect(subject.pawoo_report_type).to eq pawoo_report_type
      end
    end

    context 'when status_ids empty' do
      let(:status_ids) { [] }

      it 'creates a report' do
        expect(subject.action_taken).to be true
      end

      it 'creates pawoo_report_targets' do
        expect(subject.pawoo_report_targets.count).to eq 1
        expect(subject.pawoo_report_targets.first.target).to eq user.account
        expect(subject.pawoo_report_targets.first.state).to eq 'unresolved'
      end
    end
  end
end
