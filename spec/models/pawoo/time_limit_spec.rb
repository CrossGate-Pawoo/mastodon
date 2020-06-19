require 'rails_helper'

describe Pawoo::TimeLimit do
  describe '.from_status' do
    subject { described_class.from_status(status)&.to_duration }

    let(:normal_tag) { Fabricate(:tag, name: "normal") }
    let(:exp1_tag) { Fabricate(:tag, name: "exp1m") }
    let(:exp10_tag) { Fabricate(:tag, name: "exp10m") }

    context 'when status has timelimit tag' do
      let(:tags) { [normal_tag, exp1_tag, exp10_tag] }

      context 'when status is local' do
        let(:status) { Fabricate(:status, tags: tags) }

        it { is_expected.to eq(1.minute) }
      end

      context 'when status is remote' do
        let(:status) { Fabricate(:status, tags: tags, local: false, account: Fabricate(:account, domain: 'pawoo.net')) }

        it { is_expected.to be_nil }
      end

      context 'when status is reblog' do
        let(:status) {  Fabricate(:status, reblog: Fabricate(:status, tags: tags)) }

        it { is_expected.to eq(1.minute) }
      end
    end

    context 'when status does not have timelimit tag' do
      let(:tags) { [normal_tag] }
      let(:status) { Fabricate(:status, tags: tags) }

      it { is_expected.to be_nil }
    end
  end

  describe '#valid?' do
    context 'valid tag_name' do
      it 'returns true' do
        result = described_class.new('exp1m').valid?
        expect(result).to be true
      end
    end

    context 'invalid tag_name' do
      it 'returns false' do
        result = described_class.new('10m').valid?
        expect(result).to be false
      end
      it 'returns false' do
        result = described_class.new('exp10s').valid?
        expect(result).to be false
      end
    end

    context 'invalid time' do
      it 'returns false' do
        result = described_class.new('exp8d').valid?
        expect(result).to be false
      end

      it 'returns false' do
        result = described_class.new("exp#{24 * 8}h").valid?
        expect(result).to be false
      end
    end
  end

  describe '#to_duration' do
    context 'valid tag_name' do
      it 'returns positive numeric' do
        result = described_class.new('exp1m').to_duration
        expect(result.positive?).to be true
      end
    end

    context 'invalid tag_name' do
      it 'returns 0' do
        result = described_class.new('10m').to_duration
        expect(result).to be 0
      end
      it 'returns 0' do
        result = described_class.new('exp10s').to_duration
        expect(result).to be 0
      end
    end
  end
end
