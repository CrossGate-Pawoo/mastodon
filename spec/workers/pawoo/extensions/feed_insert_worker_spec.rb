# frozen_string_literal: true

require 'rails_helper'

describe FeedInsertWorker do
  subject { described_class.new }

  describe 'perform' do
    let(:followers) { [follower1, follower2, filtered_follower] }
    let(:follower1) { Fabricate(:account) }
    let(:follower2) { Fabricate(:account) }
    let(:filtered_follower) { Fabricate(:account) }
    let(:status) { Fabricate(:status) }
    let(:feed_manager_instance) do
      double(push_to_home: nil, push_to_list: nil, filter?: nil)
    end

    before do
      allow(FeedManager).to receive(:instance).and_return(feed_manager_instance)
      allow(feed_manager_instance).to receive(:filter?) do |_, _, follower_id|
        follower_id == filtered_follower.id
      end
    end

    context 'when type is home' do
      it 'push only unfiltered followers' do
        result = subject.perform(status.id, followers.map(&:id))

        expect(result).to be_nil
        expect(feed_manager_instance).to have_received(:push_to_home).with([follower1, follower2], status)
      end
    end

    context 'when type is list' do
      let(:lists) { [list1, list2, filtered_list] }
      let(:list1) { Fabricate(:list, account: follower1) }
      let(:list2) { Fabricate(:list, account: follower2) }
      let(:filtered_list) { Fabricate(:list, account: filtered_follower) }

      it 'push only unfiltered followers' do
        result = subject.perform(status.id, lists.map(&:id), :list)

        expect(result).to be_nil
        expect(feed_manager_instance).to have_received(:push_to_list).with([list1, list2], status)
      end
    end
  end
end
