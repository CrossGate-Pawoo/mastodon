# frozen_string_literal: true

require 'rails_helper'

describe ApplicationHelper, type: :helper do
  describe 'title' do
    subject { helper.title }

    context 'when ENV["PAWOO_STAGING"] is set' do
      before do
        allow(ENV).to receive(:[]).with('PAWOO_STAGING').and_return('true')
      end

      it { is_expected.to eq 'Pawoo (Staging)' }
    end
  end
end
