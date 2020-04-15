# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Account, type: :model do
  describe 'validations' do
    it 'is invalid if display_name has a invalid characters' do
      account = Fabricate.build(:account)
      account.display_name = 'జ్ఞ‌ా'
      account.valid?
      expect(account).to model_have_error_on_field(:display_name)
    end

    it 'is invalid if note has a invalid characters' do
      account = Fabricate.build(:account)
      account.note = 'జ్ఞ‌ా'
      account.valid?
      expect(account).to model_have_error_on_field(:note)
    end
  end

  describe '#check_to_add_blacklisted_url' do
    let(:account) { Fabricate.create(:account, note: 'hoge') }

    context 'when note is not change' do
      it 'does not enqueue Pawoo::NotifySuspiciousAccountWorker' do
        expect(Pawoo::NotifySuspiciousAccountWorker).not_to receive(:perform_async)
        account.save!
      end
    end

    context 'when note is change' do
      before do
        account.note = new_note
      end

      context 'when new note includes blacklisted url' do
        let(:new_note) { 'hoge new note' }

        it 'does not enqueue Pawoo::NotifySuspiciousAccountWorker' do
          expect(Pawoo::NotifySuspiciousAccountWorker).not_to receive(:perform_async)
          account.save!
        end
      end

      context 'when new note includes blacklisted url' do
        let(:new_note) { 'hoge http://badoogirls.com' }

        it 'enqueues Pawoo::NotifySuspiciousAccountWorker' do
          expect(Pawoo::NotifySuspiciousAccountWorker).to receive(:perform_async).with(account.id, anything)
          account.save!
        end
      end
    end
  end

  describe '#statuses_count' do
    subject { Fabricate(:account) }

    it 'update statuses_count' do
      subject.statuses_count = 100
      subject.save
      expect(subject.statuses_count).to eq 100
      expect(subject.account_stat.statuses_count).to eq 100
    end

    it 'counts statuses' do
      Fabricate(:status, account: subject)
      Fabricate(:status, account: subject)
      expect(subject.statuses_count).to eq 2
      expect(subject.account_stat.statuses_count).to eq 2
    end

    it 'is copy and increment' do
      subject.update(statuses_count: 2)

      expect(subject.statuses_count).to eq 2
      Fabricate(:status, account: subject)

      expect(subject.statuses_count).to eq 3
      expect(subject.account_stat.statuses_count).to eq 3
    end

    it 'is decremented when status is removed' do
      status = Fabricate(:status, account: subject)
      expect(subject.statuses_count).to eq 1
      expect(subject.account_stat.statuses_count).to eq 1
      status.destroy
      expect(subject.statuses_count).to eq 0
      expect(subject.account_stat.statuses_count).to eq 0
    end

    it 'is copy and decremented when status is removed' do
      status = Fabricate(:status, account: subject)
      subject.update(statuses_count: 2)

      expect(subject.statuses_count).to eq 2
      status.destroy
      expect(subject.statuses_count).to eq 1
      expect(subject.account_stat.statuses_count).to eq 1
    end
  end
end
