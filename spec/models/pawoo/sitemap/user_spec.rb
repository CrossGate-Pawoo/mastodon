require 'rails_helper'

RSpec.describe Pawoo::Sitemap::User do
  before do
    stub_const 'Pawoo::Sitemap::SITEMAPINDEX_SIZE', 1
  end

  let!(:account) { Fabricate(:account, user: Fabricate(:user), followers_count: 10, statuses_count: 5) }
  let(:page) { account.user.id }

  describe '.prepare' do
    subject do
      -> { Pawoo::Sitemap::User.new(page).prepare }
    end

    it 'writes account id for sitemap' do
      subject.call
      expect(Rails.cache.read("pawoo:sitemap:user_indexes:#{page}").first).to eq account.id
    end
  end

  describe '.query' do
    subject do
      -> { Pawoo::Sitemap::User.new(page).query }
    end

    before do
      Rails.cache.write("pawoo:sitemap:user_indexes:#{page}", [account.id])
    end

    it 'writes account id for sitemap' do
      expect(subject.call.first.id).to eq account.id
    end
  end
end
