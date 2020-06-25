require 'rails_helper'

RSpec.describe Pawoo::MaintenanceImage do
  describe 'validation' do
    let(:instance) { described_class.new }

    it 'is required attributes' do
      instance.valid?

      expect(instance.errors).to be_added(:id, :blank)
                            .and be_added(:statuses, :blank)
                            .and be_added(:images, :blank)
    end
  end

  context 'Class Methods' do
    describe '.mappings' do
      subject { described_class.mappings }
      it { is_expected.to be_a(Array).and all(be_valid) }

      it 'should be unique ids' do
        ids = subject.map(&:id)
        expect(ids).to contain_exactly(*ids.uniq)
      end
    end
  end
end
