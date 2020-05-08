# frozen_string_literal: true

require 'rails_helper'

describe Pawoo::CopyStatusStatWorker do
  describe 'perform' do
    subject { described_class.new.perform(max_status_id) }

    let!(:statuses) do
      [
        exist_fav_and_no_boost_status,
        no_fav_and_exist_boost_status,
        exist_fav_and_exist_boost_status,
        no_fav_and_no_boost_status,
        already_exist_stat_status,
      ]
    end
    let(:exist_fav_and_no_boost_status) { Fabricate(:status, favourites_count: 1) }
    let(:no_fav_and_exist_boost_status) { Fabricate(:status, reblogs_count: 1) }
    let(:exist_fav_and_exist_boost_status) { Fabricate(:status, favourites_count: 1, reblogs_count: 1) }
    let(:no_fav_and_no_boost_status) { Fabricate(:status) }
    let(:already_exist_stat_status) { Fabricate(:status_stat, status: Fabricate(:status, favourites_count: 1, reblogs_count: 2), favourites_count: 1, reblogs_count: 1, replies_count: 3).status }

    around do |example|
      Sidekiq::Testing.fake! do
        example.run
      end
    end

    context 'when remaining statuses exist' do
      let(:max_status_id) { statuses.max_by(&:id).id + 1 }

      it { expect { subject }.to change(StatusStat, :count).by(3) }

      it 'updates count' do
        subject
        aggregate_failures do
          expect(no_fav_and_no_boost_status.status_stat).to be_nil
          expect(exist_fav_and_no_boost_status.status_stat.favourites_count).to eq 1
          expect(no_fav_and_exist_boost_status.status_stat.reblogs_count).to eq 1
          expect(exist_fav_and_exist_boost_status.status_stat.favourites_count).to eq 1
          expect(exist_fav_and_exist_boost_status.status_stat.reblogs_count).to eq 1
          already_exist_stat_status.status_stat.reload
          expect(already_exist_stat_status.status_stat.favourites_count).to eq 1
          expect(already_exist_stat_status.status_stat.reblogs_count).to eq 2
          expect(already_exist_stat_status.status_stat.replies_count).to eq 3
        end
      end

      it 'runs worker' do
        allow(Pawoo::CopyStatusStatWorker).to receive(:perform_async)
        subject
        expect(Pawoo::CopyStatusStatWorker).to have_received(:perform_async).with(statuses.min_by(&:id).id)
      end
    end

    context 'when no remaining statuses' do
      let(:max_status_id) { statuses.min_by(&:id).id }

      it { expect { subject }.to change(StatusStat, :count).by(0) }

      it 'does not run worker' do
        allow(Pawoo::CopyStatusStatWorker).to receive(:perform_async)
        subject
        expect(Pawoo::CopyStatusStatWorker).not_to have_received(:perform_async)
      end
    end
  end
end
