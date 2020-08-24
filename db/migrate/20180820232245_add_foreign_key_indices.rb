# frozen_string_literal: true

class AddForeignKeyIndices < ActiveRecord::Migration[5.2]
  disable_ddl_transaction!

  def change
    # already exist [:target_account_id, :id] (SEE: db/migrate/20180109204141_add_index_on_follow_account_id_id.rb)
    # add_index :follows, :target_account_id, algorithm: :concurrently
    add_index :blocks, :target_account_id, algorithm: :concurrently
    add_index :mutes, :target_account_id, algorithm: :concurrently
    add_index :notifications, :from_account_id, algorithm: :concurrently
    add_index :accounts, :moved_to_account_id, algorithm: :concurrently
    add_index :statuses, :in_reply_to_account_id, algorithm: :concurrently
    add_index :session_activations, :access_token_id, algorithm: :concurrently
    add_index :oauth_access_grants, :resource_owner_id, algorithm: :concurrently
  end
end
