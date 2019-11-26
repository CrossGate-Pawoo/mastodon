require 'rails_helper'

describe Pawoo::Form::OauthRegistration do
  describe '.from_omniauth_auth' do
    subject { Pawoo::Form::OauthRegistration.from_omniauth_auth(omniauth_auth) }

    let(:omniauth_auth) do
      Marshal.load(Marshal.dump(OmniAuth.config.mock_auth[:pixiv]))
    end

    context 'when email is for Sign In with Apple' do
      before do
        omniauth_auth['info']['email'] = SecureRandom.hex + '@privaterelay.appleid.com'
      end

      it { expect(subject.email).to be_blank }
    end

    context 'when email is not for Sign In with Apple' do
      it { expect(subject.email).not_to be_blank }
    end

    context 'when account is private user name' do
      before do
        omniauth_auth['info']['account'] = 'user_' + SecureRandom.hex
      end

      it { expect(subject.username).to be_blank }
    end

    context 'when account is not private user name' do
      it { expect(subject.username).not_to be_blank }
    end
  end

  describe '#email=' do
    subject { -> { form.email = email } }

    let(:form) { Pawoo::Form::OauthRegistration.new }
    let(:email) { Faker::Internet.email }

    before do
      form.email_confirmed = email_confirmed
      form.email = Faker::Internet.email
    end

    context 'when email_confirmed is false' do
      let(:email_confirmed) { false }

      it { is_expected.to change { form.email }.to(email) }
    end

    context 'when email_confirmed is true' do
      let(:email_confirmed) { true }

      it { is_expected.not_to change { form.email } }
    end
  end
end
