# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Status, type: :model do
  describe 'validations' do
    it 'is invalid if text has a invalid characters' do
      account = Fabricate.build(:status)
      account.text = 'జ్ఞ‌ా'
      account.valid?
      expect(account).to model_have_error_on_field(:text)
    end

    it 'is invalid if spoiler_text has a invalid characters' do
      account = Fabricate.build(:status)
      account.spoiler_text = 'జ్ఞ‌ా'
      account.valid?
      expect(account).to model_have_error_on_field(:spoiler_text)
    end
  end
end
