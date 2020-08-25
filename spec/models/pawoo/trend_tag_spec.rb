require 'rails_helper'

RSpec.describe Pawoo::TrendTag, type: :model do
  describe '.find_tags' do
    subject { Pawoo::TrendTag.find_tags(limit) }

    before do
      allow(Pawoo::TrendTag).to receive(:trend_tags).and_return([expected_trend_tag])
    end

    let(:limit) { 3 }
    let!(:suggestion_tag) { Fabricate(:suggestion_tag, tag: tag, description: tag_description) }
    let(:tag) { Fabricate(:tag, name: tag_name) }
    let(:tag_name) { 'suggested_ngword_test' }
    let(:tag_description) { 'this tag is ngword_test' }

    let(:expected_trend_tag) { Pawoo::TrendTag.new(name: trend_tag_name, description: '', tag_type: 'trend') }
    let(:trend_tag_name) { 'trend_ngword_test' }

    context 'ng trend tag does not exist' do
      it 'includes trend tag and suggestion tag' do
        is_expected.to match([
          have_attributes(name: expected_trend_tag.name, description: expected_trend_tag.description),
          have_attributes(name: tag.name, description: tag_description)
        ])
      end
    end

    context 'ng trend tag exists' do
      let!(:trend_ng_word) { Fabricate(:trend_ng_word, word: 'ngword') }

      it 'includes suggestion tag' do
        is_expected.to match([
          have_attributes(name: tag.name, description: tag_description),
        ])
      end

      it 'does not include trend tag' do
        is_expected.not_to match([
          have_attributes(name: expected_trend_tag.name, description: expected_trend_tag.description)
        ])
      end
    end
  end
end
