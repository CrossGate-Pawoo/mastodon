require 'rails_helper'

RSpec.describe Pawoo::Auth::OmniauthCallbacksController, type: :controller do
  render_views

  before do
    request.env['devise.mapping'] = Devise.mappings[:user]
    @request.env['omniauth.auth'] = auth
    raise 'do not need patch' unless session.id.is_a? String
    session.id = Rack::Session::SessionId.new(session.id)
end

  let(:auth) { Marshal.load(Marshal.dump(OmniAuth.config.mock_auth[provider])) }

  describe 'GET #pixiv' do
    subject { get :pixiv }

    let(:provider) { :pixiv }

    let(:strategy) do
      omniauth = Devise.omniauth_configs[:pixiv]
      omniauth.strategy_class.new(nil, *omniauth.args)
    end

    before do
      body = {
        "status": "success",
        "response": [],
        "count": 1,
        "pagination": {
          "previous": nil,
          "next": nil,
        }
      }

      stub_request(:get, "#{strategy.client.site}/v1/me/favorite-users.json?count=300&page=1")
        .to_return(
          status: 200,
          body: body.to_json,
          headers: { 'content-type' => 'application/json' }
        )
    end

    context 'user has already signed in and oauth is linked with user' do
      before do
        sign_in(user)
      end

      let!(:oauth_authentication) do
        Fabricate(:oauth_authentication, provider: 'pixiv', uid: @request.env['omniauth.auth'].uid)
      end

      let!(:user) { Fabricate(:user) }

      context 'the linked user is current_user' do
        let!(:oauth_authentication) { Fabricate(:oauth_authentication, uid: auth.uid, provider: auth.provider, user: user) }

        context 'current_user does not have initial_password_usage' do
          it "dosen't synchronize email address" do
            expect{ subject }.not_to change {
              controller.current_user.reload.email
            }.from(user.email)
          end
        end

        context 'current_user has initial_password_usage' do
          let(:user) { Fabricate(:user, initial_password_usage: Fabricate(:initial_password_usage)) }

          context 'with a permitted email address' do
            context 'when email is not confirmed' do
              before do
                auth['extra']['raw_info']['is_mail_authorized'] = false
              end

              it 'does not synchronize email address' do
                expect{ subject }.not_to change {
                  user.reload.email
                }.from(user.email)
              end

              it 'flashes a alert' do
                subject
                expect(flash[:alert]).to be_present
              end
            end

            context 'when email is for Sign In with Apple' do
              before do
                auth['info']['email'] = SecureRandom.hex + '@privaterelay.appleid.com'
              end

              it 'does not synchronize email address' do
                expect{ subject }.not_to change {
                  user.reload.email
                }.from(user.email)
              end

              it 'flashes a alert' do
                subject
                expect(flash[:alert]).to be_present
              end
            end

            context 'when valid case' do
              it 'skips reconfirmation' do
                subject
                expect(user.reload).to be_confirmed
              end

              it 'synchronize email address' do
                expect{ subject }.to change {
                  user.reload.email
                }.from(user.email).to(auth['info']['email'])
              end

              it 'flashes a notice' do
                subject
                expect(flash[:notice]).to be_present
              end
            end
          end

          context 'with an email address not permitted' do
            before { Fabricate(:user, email: auth['info']['email']) }

            it 'fails to update' do
              expect { subject }.not_to change {
                controller.current_user.reload.email
              }.from(user.email)
            end

            it 'flashes an alert' do
              subject
              expect(flash[:alert]).to be_present
            end
          end
        end
      end

      context 'the linked user is not current_user' do
        it 'fails to update' do
          expect { subject }.to_not change {
            [OauthAuthentication.count, oauth_authentication.reload.attributes]
          }
        end

        it 'flashes an alert' do
          subject
          expect(flash[:alert]).to be_present
        end
      end
    end

    context 'user has already signed in and oauth is not linked with user' do
      before do
        sign_in(user)
      end

      let!(:user) { Fabricate(:user) }

      it 'creates oauth_authentication' do
        expect{ subject }.to change {
          user.oauth_authentications.count
        }.from(0).to(1)
      end

      it 'flashes an notice' do
        subject
        expect(flash[:notice]).to be_present
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

    context 'user is not signed in and oauth is linked with user' do
      let!(:oauth_authentication) { Fabricate(:oauth_authentication, uid: auth.uid, provider: auth.provider) }

      context 'two factor auth is enabled' do
        before do
          oauth_authentication.user.update!(otp_required_for_login: true)
        end

        it { is_expected.to render_template('auth/sessions/two_factor') }
      end

      context 'two factor auth is disabled' do
        it 'lets linked user sign in' do
          expect{ subject }.to change {
            controller.current_user
          }.from(nil).to(oauth_authentication.user)
        end

        it 'remembers the user' do
          subject
          expect(oauth_authentication.user.reload.remember_created_at).to be_present
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

        context 'when user has not confirmed' do
          before do
            oauth_authentication.user.update!(confirmed_at: nil)
          end

          it "doesn't log the user in" do
            subject
            expect(controller.current_user).to be_nil
          end
        end
      end

      it 'follows a local account if queued' do
        followee = Fabricate(:account, domain: nil, username: 'followee')
        get :pixiv, session: { 'pawoo.follow': 'followee' }
        expect(oauth_authentication.user.account.following?(followee)).to eq true
      end

      it 'enqueues pixiv follows fetch' do
        Sidekiq::Testing.fake! do
          subject
          expect(FetchPixivFollowsWorker).to have_enqueued_sidekiq_job oauth_authentication.id, *auth['credentials'].values_at('token', 'refresh_token', 'expires_at')
        end
      end
    end

    context 'user is not signed in and oauth is not linked with user' do
      it 'stores auth' do
        subject
        cache_key = "redis_session_store:#{session.id.public_id}:devise.omniauth:auth"
        expect(Redis.current.exists(cache_key)).to be true
      end

      it { is_expected.to redirect_to(new_user_oauth_registration_path) }
    end

    it 'deletes follow queue' do
      get :pixiv, session: { 'pawoo.follow': 'followee' }
      expect(session).not_to have_key 'pawoo.follow'
    end
  end
end
