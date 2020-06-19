require 'rails_helper'

RSpec.describe PostStatusService, type: :service do
  subject { PostStatusService.new }

  it 'creates a new status with timelimit' do
    account = Fabricate(:account)
    text = 'test status update #exp1m'

    allow(RemovalWorker).to receive(:perform_in)
    status = subject.call(account, text: text)
    expect(RemovalWorker).to have_received(:perform_in).with(60, status.id)
  end
end
