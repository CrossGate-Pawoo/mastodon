# frozen_string_literal: true

require 'rails_helper'

describe Pawoo::Sitemap::StatusIndexesController, type: :controller do
  before do
    stub_const 'Pawoo::Sitemap::SITEMAPINDEX_SIZE', 1
  end

  let!(:status) do
    Fabricate(:status).tap do |status|
      Fabricate(:status_stat, status: status, reblogs_count: 5, favourites_count: 0, replies_count: 0)
    end
  end

  describe 'GET #index' do
    it 'renders sitemap' do
      get :index, format: 'xml'

      expect(response).to have_http_status(:success)
    end
  end

  describe 'GET #show' do
    let(:page) { status.stream_entry.id }

    it 'renders sitemap' do
      get :show, params: { page: page }, format: 'xml'

      expect(response).to have_http_status(:success)
    end
  end
end
