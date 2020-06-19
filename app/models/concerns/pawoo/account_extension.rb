# frozen_string_literal: true

module Pawoo::AccountExtension
  extend ActiveSupport::Concern

  BLACKLIST_URLS = %w(
    http://badoogirls.com
  ).freeze

  included do
    has_many :oauth_authentications, through: :user

    # Check for invalid characters
    validates :display_name, pawoo_crashed_unicode: true
    validates :note, pawoo_crashed_unicode: true

    after_save :check_to_add_blacklisted_url

    class << self
      def filter_by_time(ids, time_begin = 3.days.ago)
        sql = <<-SQL.squish
          SELECT accounts.id
          FROM accounts
          WHERE accounts.id IN (:ids)
          AND suspended_at IS NULL
          AND silenced_at IS NULL
          AND (SELECT created_at FROM statuses WHERE statuses.account_id = accounts.id ORDER BY statuses.id DESC LIMIT 1) > :time_begin
        SQL

        find_by_sql([sql, {ids: ids, time_begin: time_begin}]).map(&:id)
      end
    end
  end

  def bootstrap_timeline?
    local? && (Setting.bootstrap_timeline_accounts || '').split(',').map { |str| str.strip.gsub(/\A@/, '') }.include?(username)
  end

  private

  def check_to_add_blacklisted_url
    return unless saved_change_to_note?
    return unless local?
    return unless BLACKLIST_URLS.any? { |blacklist_url| note.include?(blacklist_url) }

    Pawoo::NotifySuspiciousAccountWorker.perform_async(id, 'プロフィールに怪しいURLが設定された')
  end
end
