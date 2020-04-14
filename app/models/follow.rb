# frozen_string_literal: true
# == Schema Information
#
# Table name: follows
#
#  id                :bigint(8)        not null, primary key
#  created_at        :datetime         not null
#  updated_at        :datetime         not null
#  account_id        :bigint(8)        not null
#  target_account_id :bigint(8)        not null
#  show_reblogs      :boolean          default(TRUE), not null
#  uri               :string
#

class Follow < ApplicationRecord
  include Paginable
  include RelationshipCacheable

  belongs_to :account, counter_cache: :following_count

  belongs_to :target_account,
             class_name: 'Account',
             counter_cache: :followers_count

  has_one :notification, as: :activity, dependent: :destroy

  validates :account_id, uniqueness: { scope: :target_account_id }
  validates_with FollowLimitValidator, on: :create

  scope :recent, -> { reorder(id: :desc) }

  def local?
    false # Force uri_for to use uri attribute
  end

  before_validation :set_uri, only: :create
  after_create :increment_cache_counters
  after_destroy :decrement_cache_counters

  private

  def set_uri
    self.uri = ActivityPub::TagManager.instance.generate_uri_for(self) if uri.nil?
  end

  def increment_cache_counters
    account&.account_stat&.increment_count!(:following_count)
    target_account&.account_stat&.increment_count!(:followers_count)
  end

  def decrement_cache_counters
    account&.account_stat&.decrement_count!(:following_count)
    target_account&.account_stat&.decrement_count!(:followers_count)
  end
end
