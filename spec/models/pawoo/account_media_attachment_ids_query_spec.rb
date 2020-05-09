require 'rails_helper'

RSpec.describe Pawoo::AccountMediaAttachmentIdsQuery do
  subject { Pawoo::AccountMediaAttachmentIdsQuery.new(account).limit(3).call }

  let(:account) { Fabricate(:account) }
  let(:latest_public_status) { Fabricate(:status, account: account, created_at: 1.minutes.ago, visibility: :public) }
  let(:latest_unlisted_status) { Fabricate(:status, account: account, created_at: 2.minutes.ago, visibility: :unlisted) }
  let(:old_status) { Fabricate(:status, account: account, created_at: 1.month.ago, visibility: :public) }
  let(:old_status2) { Fabricate(:status, account: account, created_at: 2.month.ago, visibility: :public) }
  let(:old_statuses) { [old_status, old_status2] }

  before do
    media_statuses.sort_by(&:created_at).each do |status|
      Fabricate(:media_attachment, account: account, status: status, created_at: status.created_at)
    end
  end

  context 'not covered statuses' do
    let(:sensitive_status) { Fabricate(:status, account: account, created_at: 1.minutes.ago, sensitive: true) }
    let(:private_status) { Fabricate(:status, account: account, created_at: 1.minutes.ago, visibility: :private) }
    let(:direct_status) { Fabricate(:status, account: account, created_at: 1.minutes.ago, visibility: :direct) }
    let(:media_statuses) { [sensitive_status, private_status, direct_status] }

    it 'does not include media of sensitive_status' do
      expect(subject).not_to include sensitive_status.media_attachments.first.id
    end

    it 'does not include media of private_status' do
      expect(subject).not_to include private_status.media_attachments.first.id
    end

    it 'does not include media of direct_status' do
      expect(subject).not_to include direct_status.media_attachments.first.id
    end
  end

  context 'when pinned status exists' do
    let(:pinned_status1) { Fabricate(:status_pin, account: account, created_at: 1.minutes.ago).status }
    let(:pinned_status2) { Fabricate(:status_pin, account: account, created_at: 2.minutes.ago).status }
    let(:media_statuses) { [ *pinned_statuses, *old_statuses, latest_public_status, latest_unlisted_status] }

    context 'when there are many pinned statuses' do
      let(:pinned_status3) { Fabricate(:status_pin, account: account, created_at: 3.minutes.ago).status }
      let(:pinned_status4) { Fabricate(:status_pin, account: account, created_at: 4.minutes.ago).status }
      let(:pinned_statuses) { [pinned_status1, pinned_status2, pinned_status3, pinned_status4] }

      it { expect(subject.size).to eq 3 }
      it 'includes media of latest pinned status preferentially' do
        expect(subject).to match [pinned_status1, pinned_status2, pinned_status3].map { |status| status.media_attachments.first.id }
      end
    end

    context 'when there are less pinned statuses' do
      let(:pinned_statuses) { [pinned_status1, pinned_status2] }
      let!(:favourite) { Fabricate(:favourite, status: latest_public_status) }

      it { expect(subject.size).to eq 3 }
      it 'includes media of pinned status preferentially' do
        expect(subject).to include(*([pinned_status1, pinned_status2].map { |status| status.media_attachments.first.id }))
      end
      it 'includes media of latest popular status' do
        expect(subject).to include latest_public_status.media_attachments.first.id
      end
    end
  end

  context 'when pinned status does not exist' do
    let(:media_statuses) { [*old_statuses, *popular_statuses, latest_public_status] }

    context 'when there are many latest popular statuses' do
      let(:popular_statuses) { 3.times.map { Fabricate(:favourite, status: Fabricate(:status, account: account)).status } }

      it { expect(subject.size).to eq 3 }
      it 'includes media of latest popular status preferentially' do
        expect(subject).to match_array(popular_statuses.map { |status| status.media_attachments.first.id })
      end
    end

    context 'when there are less latest popular statuses' do
      let(:popular_statuses) { [popular_status] }
      let(:popular_status) { Fabricate(:favourite, status: Fabricate(:status, account: account)).status }

      it { expect(subject.size).to eq 3 }
      it 'includes media of latest status preferentially' do
        expect(subject).to include(*([popular_status, latest_public_status].map { |status| status.media_attachments.first.id }))
      end
      it 'includes media of old_status' do
        expect(subject).to include old_status.media_attachments.first.id
      end
    end
  end

  context 'when pinned status and latest popular status do not exist' do
    let(:media_statuses) { [old_status, old_status2] }

    it { expect(subject.size).to eq 2 }
    it 'includes media of old_status' do
      expect(subject).to include(*[old_status.media_attachments.first.id, old_status2.media_attachments.first.id])
    end
  end
end
