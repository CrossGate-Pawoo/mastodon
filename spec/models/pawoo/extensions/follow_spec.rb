# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Follow, type: :model do
  describe 'account stat' do
    subject { Fabricate(:account) }

    let(:alice) { Fabricate(:account, username: 'alice') }
    let(:bob)   { Fabricate(:account, username: 'bob') }

    context 'following_count' do
      it 'update following_count' do
        subject.following_count = 100
        subject.save
        expect(subject.following_count).to eq 100
        expect(subject.account_stat.following_count).to eq 100
      end

      it 'increment following_count' do
        Follow.create!(account: subject, target_account: alice)
        Follow.create!(account: subject, target_account: bob)
        expect(subject.following_count).to eq 2
        expect(subject.account_stat.following_count).to eq 2
      end

      it 'is copy and increment following_count' do
        subject.update(following_count: 2)

        expect(subject.following_count).to eq 2
        Follow.create!(account: subject, target_account: alice)

        expect(subject.following_count).to eq 3
        expect(subject.account_stat.following_count).to eq 3
      end

      it 'is decremented following_count when follow is removed' do
        follow = Follow.create!(account: subject, target_account: alice)
        expect(subject.following_count).to eq 1
        expect(subject.account_stat.following_count).to eq 1
        follow.destroy
        expect(subject.following_count).to eq 0
        expect(subject.account_stat.following_count).to eq 0
      end

      it 'is copy and decremented following_count when follow is removed' do
        follow = Follow.create!(account: subject, target_account: alice)
        subject.update(following_count: 2)

        expect(subject.following_count).to eq 2
        follow.destroy
        expect(subject.following_count).to eq 1
        expect(subject.account_stat.following_count).to eq 1
      end
    end

    context 'followers_count' do
      it 'update followers_count' do
        subject.followers_count = 100
        subject.save
        expect(subject.followers_count).to eq 100
        expect(subject.account_stat.followers_count).to eq 100
      end

      it 'increment followers_count' do
        Follow.create!(account: alice, target_account: subject)
        Follow.create!(account: bob, target_account: subject)
        expect(subject.followers_count).to eq 2
        expect(subject.account_stat.followers_count).to eq 2
      end

      it 'is copy and increment followers_count' do
        subject.update(followers_count: 2)

        expect(subject.followers_count).to eq 2
        Follow.create!(account: alice, target_account: subject)

        expect(subject.followers_count).to eq 3
        expect(subject.account_stat.followers_count).to eq 3
      end

      it 'is decremented followers_count when follow is removed' do
        follow = Follow.create!(account: alice, target_account: subject)
        expect(subject.followers_count).to eq 1
        expect(subject.account_stat.followers_count).to eq 1
        follow.destroy
        expect(subject.followers_count).to eq 0
        expect(subject.account_stat.followers_count).to eq 0
      end

      it 'is copy and decremented followers_count when follow is removed' do
        follow = Follow.create!(account: alice, target_account: subject)
        subject.update(followers_count: 2)

        expect(subject.followers_count).to eq 2
        follow.destroy
        expect(subject.followers_count).to eq 1
        expect(subject.account_stat.followers_count).to eq 1
      end
    end
  end
end
