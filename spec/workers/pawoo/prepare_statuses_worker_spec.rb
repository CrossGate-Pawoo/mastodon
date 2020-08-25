# frozen_string_literal: true

require 'rails_helper'

describe Pawoo::Sitemap::PrepareStatusesWorker do
  subject { described_class.new }

  around do |example|
    Sidekiq::Testing.fake! do
      example.run
    end
  end

  let(:page) { 1 }
  let(:sitemap) { double }
  let(:continuously_key) { nil }

  describe 'perform' do
    it 'prepares sitemap' do
      allow(Pawoo::Sitemap::Status).to receive(:new).and_return(sitemap)
      allow(sitemap).to receive(:prepare)

      subject.perform(page, continuously_key)

      expect(Pawoo::Sitemap::Status).to have_received(:new).with(1)
      expect(sitemap).to have_received(:prepare)
    end
  end
end
