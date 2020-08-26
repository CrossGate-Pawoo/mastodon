# frozen_string_literal: true

require 'rails_helper'

describe Pawoo::Api::V1::SuggestedAccountsController, type: :controller do
  let(:user) { Fabricate(:user) }

  describe '#index' do
    subject { get :index }

    context 'without token' do
      it { is_expected.to have_http_status :unauthorized }
    end

    context 'with token' do
      before do
        allow(controller).to receive(:doorkeeper_token) do
          Fabricate(:accessible_access_token, resource_owner_id: user.id, scopes: 'follow')
        end
      end

      it { is_expected.to have_http_status :success }

      context 'with limit parameter' do
        subject { get :index, params: { limit: 1 } }

        it 'limits the number' do
          suggested_accounts = 2.times.map { Fabricate(:status).account }
          pairs = suggested_accounts.map { |account| [100, account.id] }
          Redis.current.zadd('pawoo:popular_account_ids', pairs)

          subject

          expect(body_as_json.size).to eq 1
        end
      end

      context 'with page parameter' do
        let(:suggested_accounts) { 2.times.map { Fabricate(:status).account } }

        before do
          pairs = suggested_accounts.map { |account| [100, account.id] }
          Redis.current.zadd('pawoo:popular_account_ids', pairs)

          get :index, params: { limit: 1, page: 1, seed: 0 }
        end

        it 'uses a certain offset' do
          expect(body_as_json.size).to eq 1
        end

        it 'adds pagination headers if necessary' do
          expect(response.headers['Link'].find_link(['rel', 'next']).href).to eq api_v1_suggested_accounts_url(page: 2, seed: 0)
          expect(response.headers['Link'].find_link(['rel', 'prev']).href).to eq api_v1_suggested_accounts_url(page: 0, seed: 0)
        end
      end

      it 'excludes followed accounts' do
        follow = Fabricate(:follow, account: user.account, target_account: Fabricate(:status).account)
        Redis.current.zadd('pawoo:popular_account_ids', [0, follow.target_account_id])

        get :index

        expect(body_as_json.pluck(:id)).not_to include follow.target_account_id.to_s
      end

      it 'excludes muted accounts' do
        mute = Fabricate(:mute, account: user.account, target_account: Fabricate(:status).account)
        Redis.current.zadd('pawoo:popular_account_ids', [0, mute.target_account_id])

        get :index

        expect(body_as_json.pluck(:id)).not_to include mute.target_account_id.to_s
      end

      it 'queries pixiv follows' do
        authentication = Fabricate(:oauth_authentication, provider: 'pixiv', user: user)
        suggested_authentication = Fabricate(:oauth_authentication, provider: 'pixiv')
        Fabricate(:media_attachment, account: suggested_authentication.user.account)
        Fabricate(:status, account: suggested_authentication.user.account)
        Fabricate(:pixiv_follow, oauth_authentication: authentication, target_pixiv_uid: suggested_authentication.uid)

        get :index

        expect(body_as_json.pluck(:id)).to include suggested_authentication.user.account_id.to_s
      end

      it 'queries potential friendship' do
        target_account = Fabricate(:status).account
        PotentialFriendshipTracker.record(user.account.id, target_account.id, :favourite)

        get :index

        expect(body_as_json.pluck(:id)).to include target_account.id.to_s
      end
    end
  end
end
