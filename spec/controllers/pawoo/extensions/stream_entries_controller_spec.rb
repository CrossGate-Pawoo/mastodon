# frozen_string_literal: true

require 'rails_helper'

describe StreamEntriesController, type: :controller do
  describe 'GET #show' do
    let(:entry) { Fabricate(:stream_entry, account: status.account, activity: status) }

    context 'if the activity type is status' do
      let(:status) { Fabricate(:status) }
      subject { get :show, params: { account_username: entry.account.username, id: entry } }
      it { is_expected.to redirect_to short_account_status_url(entry.account, entry.status) }
    end

    context 'the duration is set' do
      let(:tag) { Fabricate(:tag, name: 'exp1d') }
      let(:status) { Fabricate(:status, tags: [tag]) }

      subject { get :show, format: :atom, params: { account_username: entry.account.username, id: entry } }

      it { is_expected.to have_http_status :not_found }
    end
  end
end
