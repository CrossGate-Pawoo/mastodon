# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Status, type: :model do
  describe 'validations' do
    it 'is invalid if text has a invalid characters' do
      account = Fabricate.build(:status)
      account.text = 'జ్ఞ‌ా'
      account.valid?
      expect(account).to model_have_error_on_field(:text)
    end

    it 'is invalid if spoiler_text has a invalid characters' do
      account = Fabricate.build(:status)
      account.spoiler_text = 'జ్ఞ‌ా'
      account.valid?
      expect(account).to model_have_error_on_field(:spoiler_text)
    end
  end

  describe 'instance methods' do
    let(:alice) { Fabricate(:account, username: 'alice') }
    let(:bob)   { Fabricate(:account, username: 'bob') }
    let(:other) { Fabricate(:status, account: bob, text: 'Skulls for the skull god! The enemy\'s gates are sideways!') }

    subject { Fabricate(:status, account: alice) }

    describe '#reblogs_count' do
      it 'is copy and increment' do
        subject.update(reblogs_count: 2)
        Fabricate(:status, account: alice, reblog: subject)

        expect(subject.reblogs_count).to eq 3
        expect(subject.status_stat.reblogs_count).to eq 3
      end

      it 'is the number of reblogs' do
        Fabricate(:status, account: bob, reblog: subject)
        Fabricate(:status, account: alice, reblog: subject)

        expect(subject.reblogs_count).to eq 2
        expect(subject.status_stat.reblogs_count).to eq 2
      end

      it 'is decremented when reblog is removed' do
        reblog = Fabricate(:status, account: bob, reblog: subject)
        expect(subject.reblogs_count).to eq 1
        expect(subject.status_stat.reblogs_count).to eq 1
        reblog.destroy
        expect(subject.reblogs_count).to eq 0
        expect(subject.status_stat.reblogs_count).to eq 0
      end
    end

    describe '#replies_count' do
      it 'is the number of replies' do
        reply = Fabricate(:status, account: bob, thread: subject)
        expect(subject.status_stat.replies_count).to eq 1
      end

      it 'is decremented when reply is removed' do
        reply = Fabricate(:status, account: bob, thread: subject)
        expect(subject.status_stat.replies_count).to eq 1
        reply.destroy
        expect(subject.status_stat.replies_count).to eq 0
      end
    end

    describe '#favourites_count' do
      it 'is copy and increment' do
        subject.update(favourites_count: 2)
        Fabricate(:favourite, account: alice, status: subject)

        expect(subject.favourites_count).to eq 3
        expect(subject.status_stat.favourites_count).to eq 3
      end

      it 'is the number of favorites' do
        Fabricate(:favourite, account: bob, status: subject)
        Fabricate(:favourite, account: alice, status: subject)

        expect(subject.favourites_count).to eq 2
        expect(subject.status_stat.favourites_count).to eq 2
      end

      it 'is decremented when favourite is removed' do
        favourite = Fabricate(:favourite, account: bob, status: subject)
        expect(subject.favourites_count).to eq 1
        expect(subject.status_stat.favourites_count).to eq 1
        favourite.destroy
        expect(subject.favourites_count).to eq 0
        expect(subject.status_stat.favourites_count).to eq 0
      end
    end
  end
end
