require 'rails_helper'

RSpec.describe Pawoo::OauthEmailAddressChecker, type: :model do
  describe '.can_copy?' do
    subject { Pawoo::OauthEmailAddressChecker.can_copy?(email) }

    context 'when email is nil' do
      let(:email) { nil }

      it { is_expected.to be false }
    end

    context 'when email is invalid email address' do
      let(:email) { 'invalid' }

      it { is_expected.to be false }
    end

    context 'when email is valid email address' do
      context 'when email domain is for Sign In with Apple' do
        let(:email) { SecureRandom.hex + '@privaterelay.appleid.com' }

        it { is_expected.to be false }
      end

      context 'when other case' do
        let(:email) { Faker::Internet.email }

        it { is_expected.to be true }
      end
    end
  end
end
