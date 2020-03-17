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

  describe '.triadic_closures' do
    let!(:me) { Fabricate(:account) }
    let!(:friend) { Fabricate(:account) }
    let!(:friends_friend) { Fabricate(:account, statuses: [Fabricate(:status)]) }
    let!(:both_follow) { Fabricate(:account) }

    before do
      me.follow!(friend)
      friend.follow!(friends_friend)

      me.follow!(both_follow)
      friend.follow!(both_follow)
    end

    it 'finds accounts you dont follow which are followed by accounts you do follow' do
      expect(described_class.triadic_closures(me)).to eq [friends_friend]
    end

    it 'limits by 5 with offset 0 by defualt' do
      first_degree = 6.times.map { Fabricate(:account) }
      matches = 5.times.map { Fabricate(:account, statuses: [Fabricate(:status)]) }
      first_degree.each { |account| me.follow!(account) }
      matches.each do |match|
        first_degree.each { |account| account.follow!(match) }
        first_degree.shift
      end

      expect(described_class.triadic_closures(me)).to eq matches
    end

    it 'accepts arbitrary limits' do
      another_friend = Fabricate(:account)
      higher_friends_friend = Fabricate(:account, statuses: [Fabricate(:status)])
      me.follow!(another_friend)
      friend.follow!(higher_friends_friend)
      another_friend.follow!(higher_friends_friend)

      expect(described_class.triadic_closures(me, limit: 1)).to eq [higher_friends_friend]
    end

    it 'accepts arbitrary offset' do
      another_friend = Fabricate(:account)
      higher_friends_friend = Fabricate(:account, statuses: [Fabricate(:status)])
      me.follow!(another_friend)
      friend.follow!(higher_friends_friend)
      another_friend.follow!(higher_friends_friend)

      expect(described_class.triadic_closures(me, offset: 1)).to eq [friends_friend]
    end

    context 'when you block account' do
      before do
        me.block!(friends_friend)
      end

      it 'rejects blocked accounts' do
        expect(described_class.triadic_closures(me)).to be_empty
      end
    end

    context 'when you mute account' do
      before do
        me.mute!(friends_friend)
      end

      it 'rejects muted accounts' do
        expect(described_class.triadic_closures(me)).to be_empty
      end
    end
  end
end
