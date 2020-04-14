# frozen_string_literal: true

module AccountCounters
  extend ActiveSupport::Concern

  included do
    has_one :account_stat, inverse_of: :account
    after_save :save_account_stat
  end

  # delegate :statuses_count,
  #          :statuses_count=,
  #          :following_count,
  #          :following_count=,
  #          :followers_count,
  #          :followers_count=,
  #          :increment_count!,
  #          :decrement_count!,
  #          :last_status_at,
  #          to: :account_stat

  # TODO: 2.9.4アップデート時に消す
  def statuses_count=(value)
    super(value)
    account_stat.statuses_count = value
  end

  def following_count=(value)
    super(value)
    account_stat.following_count = value
  end

  def followers_count=(value)
    super(value)
    account_stat.followers_count = value
  end

  def account_stat
    super || build_account_stat
  end

  private

  def save_account_stat
    return unless account_stat&.changed?
    account_stat.save
  end
end
