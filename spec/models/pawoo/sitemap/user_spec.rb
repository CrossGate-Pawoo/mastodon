require 'rails_helper'

RSpec.describe Pawoo::Sitemap::User do
  before do
    stub_const 'Pawoo::Sitemap::SITEMAPINDEX_SIZE', 5
  end

  let!(:account) { Fabricate(:account, user: Fabricate(:user), followers_count: 10, statuses_count: 5) }
  let(:page) { (account.user.id - 1) / Pawoo::Sitemap::SITEMAPINDEX_SIZE + 1 }

  describe '.prepare' do
    subject do
      -> { Pawoo::Sitemap::User.new(page).prepare }
    end

    let!(:not_target_account) { Fabricate(:account, user: Fabricate(:user)) }

    it 'writes account id for sitemap' do
      subject.call
      expect(Rails.cache.read("pawoo:sitemap:user_indexes:#{page}")).to eq [account.id]
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
      expect(subject.call.map(&:id)).to eq [account.id]
    end
  end
end
