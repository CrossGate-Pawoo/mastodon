# frozen_string_literal: true

require 'rails_helper'

RSpec.describe StatusPinValidator, type: :validator do
  describe '#validate' do
    before do
      allow(pin.errors).to receive(:add)
      subject.validate(pin)
    end

    let(:pin) { Fabricate.build(:status_pin, status: status, account: status.account) }

    context 'when status has time limit tag' do
      let(:tag) { Fabricate(:tag, name: 'exp1d') }
      let(:status) { Fabricate(:status, tags: [tag], local: true, visibility: :public) }

      it 'calls errors.add' do
        expect(pin.errors).to have_received(:add).with(:base, I18n.t('pawoo.extensions.statuses.pin_errors.time_limit'))
      end
    end
  end
end
