# frozen_string_literal: true

require 'rails_helper'

describe Pawoo::Scheduler::CacheCountScheduler do
  describe 'perform' do
    subject { described_class.new.perform }

    let(:instance_presenter) { InstancePresenter.new }

    before do
      Rails.cache.write 'user_count', 123
      Rails.cache.write 'local_status_count', 234
      Rails.cache.write 'distinct_domain_count', 345

      Fabricate(:status)
      Fabricate(:user)
      Fabricate(:account, domain: 'example.com')
    end

    it do
      expect(instance_presenter.user_count).to eq(123)
      expect(instance_presenter.status_count).to eq(234)
      expect(instance_presenter.domain_count).to eq(345)
      subject
      expect(instance_presenter.user_count).to eq(1)
      expect(instance_presenter.status_count).to eq(1)
      expect(instance_presenter.domain_count).to eq(1)
    end
  end
end
