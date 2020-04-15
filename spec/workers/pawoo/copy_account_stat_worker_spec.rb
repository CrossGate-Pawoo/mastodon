# frozen_string_literal: true

require 'rails_helper'

describe Pawoo::CopyAccountStatWorker do
  describe 'perform' do
    subject { described_class.new.perform(max_account_id) }

    let!(:accounts) do
      [
        statuses_count_account,
        following_count_account,
        followers_count_account,
        no_count_account,
        already_exist_stat_account,
      ]
    end
    let(:statuses_count_account) { Fabricate(:account, statuses_count: 1) }
    let(:following_count_account) { Fabricate(:account, following_count: 1) }
    let(:followers_count_account) { Fabricate(:account, followers_count: 1) }
    let(:no_count_account) { Fabricate(:account) }
    let(:already_exist_stat_account) do
      Fabricate(:account, statuses_count: 1, following_count: 2, followers_count: 3).tap do |account|
        account.account_stat.update(statuses_count: 1, following_count: 1, followers_count: 1)
      end
    end

    around do |example|
      Sidekiq::Testing.fake! do
        example.run
      end
    end

    before do
      accounts.each do |account|
        if account != already_exist_stat_account
          account.account_stat.destroy!
          account.reload
        end
      end
    end

    context 'when remaining accounts exist' do
      let(:max_account_id) { accounts.max_by(&:id).id + 1 }

      it { expect { subject }.to change(AccountStat, :count).by(3) }

      it 'updates count' do
        subject
        aggregate_failures do
          expect(no_count_account.account_stat).to be_new_record
          expect(statuses_count_account.account_stat.statuses_count).to eq 1
          expect(following_count_account.account_stat.following_count).to eq 1
          expect(followers_count_account.account_stat.followers_count).to eq 1
          already_exist_stat_account.account_stat.reload
          expect(already_exist_stat_account.account_stat.statuses_count).to eq 1
          expect(already_exist_stat_account.account_stat.following_count).to eq 2
          expect(already_exist_stat_account.account_stat.followers_count).to eq 3
        end
      end

      it 'runs worker' do
        allow(Pawoo::CopyAccountStatWorker).to receive(:perform_async)
        subject
        expect(Pawoo::CopyAccountStatWorker).to have_received(:perform_async).with(accounts.min_by(&:id).id)
      end
    end

    context 'when no remaining accounts' do
      let(:max_account_id) { accounts.min_by(&:id).id }

      it { expect { subject }.to change(AccountStat, :count).by(0) }

      it 'does not run worker' do
        allow(Pawoo::CopyAccountStatWorker).to receive(:perform_async)
        subject
        expect(Pawoo::CopyAccountStatWorker).not_to have_received(:perform_async)
      end
    end
  end
end
