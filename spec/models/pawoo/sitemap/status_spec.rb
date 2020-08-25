require 'rails_helper'

RSpec.describe Pawoo::Sitemap::Status do
  let!(:status) do
    Fabricate(:status).tap do |status|
      Fabricate(:status_stat, status: status, reblogs_count: 5, replies_count: 0, favourites_count: 0)
    end
  end
  let(:page) { 1 }

  describe '.prepare' do
    subject do
      -> { Pawoo::Sitemap::Status.new(page).prepare }
    end

    it 'writes status id for sitemap' do
      subject.call
      expect(Rails.cache.read("pawoo:sitemap:status_indexes:#{page}").first).to eq status.id
    end
  end

  describe '.query' do
    subject { Pawoo::Sitemap::Status.new(page).query }

    before do
      Rails.cache.write("pawoo:sitemap:status_indexes:#{page}", [status.id])
    end

    it 'writes status id for sitemap' do
      expect(subject.first.id).to eq status.id
    end
  end
end
