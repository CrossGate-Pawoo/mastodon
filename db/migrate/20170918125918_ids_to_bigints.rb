require Rails.root.join('lib', 'mastodon', 'migration_helpers')

class IdsToBigints < ActiveRecord::Migration[5.1]
  include Mastodon::MigrationHelpers

  disable_ddl_transaction!

  INCLUDED_COLUMNS = [
    [:account_domain_blocks, :account_id],
    [:account_domain_blocks, :id],
    [:accounts, :id],
    [:blocks, :id],
    [:blocks, :account_id],
    [:conversation_mutes, :account_id],
    [:conversation_mutes, :id],
    [:domain_blocks, :id],
    [:favourites, :account_id],
    [:follow_requests, :account_id],
    [:follows, :account_id],
    [:imports, :account_id],
    [:imports, :id],
    [:media_attachments, :account_id],
    [:media_attachments, :id],
    [:mentions, :account_id],
    [:mentions, :id],
    [:mutes, :account_id],
    [:notifications, :account_id],
    [:oauth_access_grants, :application_id],
    [:oauth_access_grants, :id],
    [:oauth_access_grants, :resource_owner_id],
    [:oauth_access_tokens, :application_id],
    [:oauth_access_tokens, :id],
    [:oauth_access_tokens, :resource_owner_id],
    [:oauth_applications, :id],
    [:oauth_applications, :owner_id],
    [:reports, :account_id],
    [:reports, :action_taken_by_account_id],
    [:reports, :id],
    [:reports, :target_account_id],
    [:session_activations, :access_token_id],
    [:session_activations, :user_id],
    [:session_activations, :web_push_subscription_id],
    [:settings, :id],
    [:settings, :thing_id],
    [:statuses, :account_id],
    [:statuses, :application_id],
    [:statuses, :in_reply_to_account_id],
    [:stream_entries, :id],
    [:subscriptions, :account_id],
    [:subscriptions, :id],
    [:tags, :id],
    [:users, :account_id],
    [:users, :id],
    [:web_settings, :id],
    [:web_settings, :user_id],
    [:firebase_cloud_messaging_tokens, :id],
    [:firebase_cloud_messaging_tokens, :user_id],
    [:initial_password_usages, :id],
    [:initial_password_usages, :user_id],
    [:oauth_authentications, :id],
    [:oauth_authentications, :user_id],
    [:pixiv_cards, :id],
    [:pixiv_cards, :status_id],
    [:pixiv_follows, :id],
    [:pixiv_follows, :oauth_authentication_id],
    [:suggestion_tags, :id],
    [:suggestion_tags, :tag_id],
    [:trend_ng_words, :id],
  ]
  INCLUDED_COLUMNS << [:deprecated_preview_cards, :id] if table_exists?(:deprecated_preview_cards)

  def migrate_column_stage1(to_type)
    show_warning

    ordered_columns.each do |column_parts|
      table, column = column_parts

      # Skip this if we're resuming and already did this one.
      next if column_for(table, column).sql_type == to_type.to_s

      change_column_type_concurrently table, column, to_type, skip_changing_null: true
    end
  end

  def migrate_column_stage2(to_type)
    show_warning

    ordered_columns.each do |column_parts|
      table, column = column_parts

      # Skip this if we're resuming and already did this one.
      next if column_for(table, column).sql_type == to_type.to_s

      temp_column = rename_column_name(column)
      change_column_null(table, temp_column, false) unless column_for(table, column).null
    end
  end

  def migrate_column_stage3(to_type)
    show_warning

    ordered_columns.each do |column_parts|
      table, column = column_parts

      # Skip this if we're resuming and already did this one.
      next if column_for(table, column).sql_type == to_type.to_s

      cleanup_concurrent_column_type_change table, column
    end
  end

  def show_warning
    return if Rails.env.test?

    # Print out a warning that this will probably take a while.
    say ''
    say 'WARNING: This migration may take a *long* time for large instances'
    say 'It will *not* lock tables for any significant time, but it may run'
    say 'for a very long time. We will pause for 10 seconds to allow you to'
    say 'interrupt this migration if you are not ready.'
    say ''
    say 'This migration has some sections that can be safely interrupted'
    say 'and restarted later, and will tell you when those are occurring.'
    say ''
    say 'For more information, see https://github.com/tootsuite/mastodon/pull/5088'

    10.downto(1) do |i|
      say "Continuing in #{i} second#{i == 1 ? '' : 's'}...", true
      sleep 1
    end
  end

  def ordered_columns
    tables = INCLUDED_COLUMNS.map(&:first).uniq
    table_sizes = {}

    # Sort tables by their size
    tables.each do |table|
      table_sizes[table] = estimate_rows_in_table(table)
    end

    INCLUDED_COLUMNS.sort_by do |col_parts|
      [-table_sizes[col_parts.first], col_parts.last]
    end
  end

  def up
    migrate_column_stage1(:bigint)
  end

  def down
    migrate_column_stage3(:integer)
  end
end
