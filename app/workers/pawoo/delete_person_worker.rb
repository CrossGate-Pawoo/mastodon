# frozen_string_literal: true

# TODO: 削除する
class Pawoo::DeletePersonWorker
  include Sidekiq::Worker

  sidekiq_options queue: 'pull'

  def perform(account_id)
    account = Account.find_by(id: account_id)
    return if account.nil?

    SuspendAccountService.new.call(account)
    account.destroy!
  end
end
