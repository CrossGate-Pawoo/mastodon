# frozen_string_literal: true

require 'rails_helper'

describe ApplicationHelper, type: :helper do
  describe 'title' do
    subject { helper.title }

    context 'when it is production and the host name is "ap-staging002"' do
      before do
        allow(Rails.env).to receive(:production?).and_return(true)
        allow(Socket).to receive(:gethostname).and_return('ap-staging002')
      end

      it { is_expected.to eq 'Pawoo (Staging)' }
    end
  end
end
