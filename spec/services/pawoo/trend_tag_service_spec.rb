require 'rails_helper'

RSpec.describe Pawoo::TrendTagService do
  describe '#call' do
    let(:service) { described_class.new }
    let(:time) { Time.current }

    def statuses_with_tag(tag_name, times = 2, **new_attributes)
      tag = Tag.find_by(name: tag_name) || Fabricate(:tag, name: tag_name)

      attributes = {
        tags: [tag],
        visibility: 'public',
        created_at: time,
      }.merge(new_attributes)

      stat_attributes = {
        favourites_count: described_class::FAVOURITES_COUNT_MIN,
        reblogs_count: described_class::REBLOGS_COUNT_MIN,
        replies_count: 0,
      }

      Fabricate.times(times, :status, attributes).each do |status|
        Fabricate(:status_stat, status: status, **stat_attributes)
      end
    end

    def tag_score_histories
      Redis.current.lrange(described_class::TREND_HISTORIES_KEY, 0, -1)
    end

    before do
      # Clear redis values
      Redis.current.del(described_class::TREND_HISTORIES_KEY)
      Pawoo::TrendTag.update_trend_tags([])
    end

    context 'initial tag_score_histories' do
      let!(:statuses) { statuses_with_tag('hello', described_class::ACCOUNTS_COUNT_MIN, created_at: time - 1.minutes) }

      it 'returns empty array' do
        expect(service.call).to eq([])
      end

      it 'store current tag scores' do
        expect { subject.call }.to change { tag_score_histories.length
        }.from(0).to(1)
      end
    end

    context 'multi tag_score_histories' do
      let!(:statuses) { statuses_with_tag('hello', times, created_at: time - 1.minutes) }
      let(:tag) { statuses.first.tags.first }

      before do
        tag_score_history = [{ "count":1, "tag_id": tag.id, "tag_name": tag.name, "favourites_count": 3, "reblogs_count": 3, "accounts_count": 3 }]

        described_class::HISTORY_COUNT.times do
          Redis.current.lpush(described_class::TREND_HISTORIES_KEY, tag_score_history.to_json)
        end
      end

      context 'tag is not growing' do
        let(:times) { 1 }

        it 'returns empty array' do
          expect(service.call).to eq([])
        end
      end

      context 'tag is growing' do
        let(:times) { described_class::ACCOUNTS_COUNT_MIN + 10 }

        it 'returns empty array' do
          expect(service.call).to eq([tag.name])
        end
      end
    end
  end
end
