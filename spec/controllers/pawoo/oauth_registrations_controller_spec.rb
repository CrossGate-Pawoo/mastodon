require 'rails_helper'

RSpec.describe Pawoo::OauthRegistrationsController, type: :controller do
  let(:auth) { OmniAuth.config.mock_auth[:pixiv] }
  before { request.env['devise.mapping'] = Devise.mappings[:user] }

  def cache
    cache_key = "redis_session_store:#{session.id}:devise.omniauth:auth"
    Redis.current.set(cache_key, auth.to_json)

    stub_request(:get, auth['info']['avatar'])
      .with(headers: { 'Referer' => "https://#{Rails.configuration.x.local_domain}" })
      .to_return(status: 200, body: File.read('spec/fixtures/files/attachment.jpg'))
  end

  around do |example|
    Sidekiq::Testing.fake! do
      example.run
    end
  end

  shared_examples 'cache miss' do
    context 'missing cache' do
      it { is_expected.to redirect_to(root_path) }

      it 'alerts cache miss' do
        subject
        expect(flash[:alert]).to eq I18n.t('devise.failure.timeout')
      end
    end
  end

  describe 'GET #new' do
    subject { get :new }

    context 'hit cache of pixiv oauth' do
      before { cache }
      it { is_expected.to have_http_status(:success) }
    end

    include_examples 'cache miss'
  end

  describe 'POST #create' do
    subject { post :create, params: { pawoo_form_oauth_registration: attributes } }
    let(:attributes) { { username: 'username', display_name: 'testuser_account', note: 'introduction' } }

    context 'hit cache of pixiv oauth' do
      before do
        cache
        allow(BootstrapTimelineWorker).to receive(:perform_async)
        allow(FetchPixivFollowsWorker).to receive(:perform_async)
      end

      it 'creates user' do
        subject
        expect(Account.joins(:user).where(attributes)).to exist
      end

      it 'creates OauthAuthentication' do
        subject
        expect(OauthAuthentication.joins(:user).where(users: { email: auth.info.email })).to exist
      end

      it 'queues up bootstrapping of home timeline' do
        subject
        user = User.find_by(email: auth.info.email)
        expect(BootstrapTimelineWorker).to have_received(:perform_async).with(user.account_id)
      end

      it 'logs the user in' do
        subject
        expect(controller.current_user).to eq User.find_by(email: auth.info.email)
      end

      it 'remembers the user' do
        subject
        user = User.find_by(email: auth.info.email)
        expect(user.remember_created_at).to be_present
      end

      it 'enqueues pixiv follows fetch' do
        subject
        oauth_authentication = User.find_by(email: auth.info.email).oauth_authentications.first
        expect(FetchPixivFollowsWorker).to have_received(:perform_async).with(oauth_authentication.id, *auth['credentials'].values_at('token', 'refresh_token', 'expires_at'))
      end

      context 'when is_mail_authorized is false' do
        let(:auth) do
          Marshal.load(Marshal.dump(OmniAuth.config.mock_auth[:pixiv])).tap do |mock_auth|
            mock_auth['extra']['raw_info']['is_mail_authorized'] = false
          end
        end

        it "doesn't log the user in" do
          subject
          expect(controller.current_user).to be_nil
        end

        context 'when the email is duplicated' do
          let!(:unlinked_user) { Fabricate(:user, email: auth.info.email) }

          it { is_expected.not_to redirect_to new_user_session_path }
        end
      end

      context 'when the email is duplicated' do
        let!(:unlinked_user) { Fabricate(:user, email: auth.info.email) }

        it { is_expected.to redirect_to new_user_session_path }

        it 'makes alert' do
          subject
          expect(flash[:alert]).to eq I18n.t('pawoo.oauth_registrations.already_registered')
        end
      end

      context 'when the username is duplicated' do
        let(:account) { Fabricate(:account, username: attributes[:username]) }
        let!(:unlinked_user) { Fabricate(:user, email: "other-#{auth.info.email}", account: account) }

        it { is_expected.to render_template(:new) }
      end

      context 'when the profile is different from pixiv' do
        let(:attributes) { { username: 'custom_username', display_name: 'custom_testuser_account', note: 'custom_introduction' } }

        it 'creates user' do
          subject
          expect(Account.joins(:user).where(attributes)).to exist
        end
      end

      context 'when before path is about_path' do
        it 'redirects to root_path' do
          controller.store_location_for(:user, about_path)
          is_expected.to redirect_to root_path
        end
      end

      context 'when before path is not about_path' do
        it 'redirects to the path for the user after signing in' do
          controller.store_location_for(:user, '/path/after/sign/in')
          is_expected.to redirect_to '/path/after/sign/in'
        end
      end
    end

    include_examples 'cache miss'
  end
end
