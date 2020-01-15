# frozen_string_literal: true

require 'rails_helper'

RSpec.describe User, type: :model do
  describe 'callbacks' do
    describe 'destroy initial_password_usage' do
      subject do
        -> { user.update(password: password, password_confirmation: password) }
      end

      let(:password) { 'new password' }
      let!(:initial_password_usage) { Fabricate(:initial_password_usage) }
      let!(:user) { initial_password_usage.user }

      context 'on create' do
        it 'does not delete initial_password_usage' do
          user = Fabricate(:user).dup
          user.build_initial_password_usage
          user.assign_attributes(email: 'test@example.com', password: password, password_confirmation: password)
          user.update!(password: password, password_confirmation: password)
          expect(user.initial_password_usage.reload).to be_present
        end
      end

      context 'when user updates password' do
        it 'destroys initial_password_usage' do
          is_expected.to change {
            InitialPasswordUsage.where(id: initial_password_usage.id).exists?
          }.from(true).to(false)
        end
      end
    end
  end
end
