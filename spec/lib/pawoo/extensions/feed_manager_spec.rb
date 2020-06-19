require 'rails_helper'

RSpec.describe FeedManager do
  before do |example|
    unless example.metadata[:skip_stub]
      stub_const 'FeedManager::MAX_ITEMS', 10
      stub_const 'FeedManager::REBLOG_FALLOFF', 4
    end
  end

  describe '#push_to_home' do
    it 'performs pushing updates into home timelines' do
      account1 = Fabricate(:account)
      account2 = Fabricate(:account)
      not_add_to_feed_account = Fabricate(:account)
      not_push_update_required_account = Fabricate(:account)
      accounts = [account1, account2, not_add_to_feed_account, not_push_update_required_account]
      status = Fabricate(:status)

      accounts.each do |account|
        next if account == not_push_update_required_account

        Redis.current.setex("subscribed:timeline:#{account.id}", 10, '1')
      end

      instance = FeedManager.instance

      expect(instance).to receive(:add_to_feed).with(:home, anything, status, anything).exactly(4).times do |_, account_id, _, _|
        account_id != not_add_to_feed_account.id
      end
      expect(instance).to receive(:trim).with(:home, anything).exactly(3).times
      expect(PushUpdateWorker).to receive(:perform_async).with([account1, account2].map(&:id), status.id, :home)

      instance.push_to_home(accounts, status)
    end
  end

  describe '#push_to_list' do
    it 'performs pushing updates into list timelines' do
      lists = [Fabricate(:list, account: Fabricate(:account)), Fabricate(:list, account: Fabricate(:account))]
      status = Fabricate(:status)

      list1 = Fabricate(:list, account: Fabricate(:account))
      list2 = Fabricate(:list, account: Fabricate(:account))
      not_add_to_feed_list = Fabricate(:list, account: Fabricate(:account))
      not_push_update_required_list = Fabricate(:list, account: Fabricate(:account))
      lists = [list1, list2, not_add_to_feed_list, not_push_update_required_list]
      status = Fabricate(:status)

      lists.each do |list|
        next if list == not_push_update_required_list

        Redis.current.setex("subscribed:timeline:list:#{list.id}", 10, '1')
      end

      instance = FeedManager.instance

      expect(instance).to receive(:add_to_feed).with(:list, anything, status, anything).exactly(4).times do |_, list_id, _, _|
        list_id != not_add_to_feed_list.id
      end
      expect(instance).to receive(:trim).with(:list, anything).exactly(3).times
      expect(PushUpdateWorker).to receive(:perform_async).with([list1, list2].map(&:id), status.id, :list)

      FeedManager.instance.push_to_list(lists, status)
    end
  end

  describe '#populate_feed' do
    it 'call #add_to_feed' do
      account = Fabricate(:account)
      Fabricate(:status, account: account, text: 'out of range', created_at: 1.month.ago)
      latest_status = Fabricate(:status, account: account, text: 'last', created_at: 1.week.ago)

      allow(FeedManager.instance).to receive(:add_to_feed).once
      allow(FeedManager.instance).to receive(:add_to_feed).with(:home, account, latest_status)

      FeedManager.instance.populate_feed(account)
    end
  end

  describe '#calc_since_id' do
    subject { FeedManager.instance.calc_since_id(base_id) }

    let(:account) { Fabricate(:account) }
    let(:base_id) { nil }

    context 'no base_id' do
      let!(:status1) { Fabricate(:status, account: account, created_at: (2.weeks + 1.day).ago) }
      let!(:status2) { Fabricate(:status, account: account, created_at: (2.weeks - 1.day).ago) }

      it { is_expected.to be_between(status1.id, status2.id)  }
    end

    context 'with base_id' do
      let!(:status1) { Fabricate(:status, account: account, created_at: (2.weeks + 2.day).ago) }
      let!(:status2) { Fabricate(:status, account: account, created_at: 2.weeks.ago) }
      let!(:status3) { Fabricate(:status, account: account, created_at: 1.day.ago) }
      let(:base_id) { status3.id }

      it { is_expected.to be_between(status1.id, status2.id)  }
    end
  end
end
