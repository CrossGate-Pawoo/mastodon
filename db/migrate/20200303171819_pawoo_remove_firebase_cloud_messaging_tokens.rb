# frozen_string_literal: true

class PawooRemoveFirebaseCloudMessagingTokens < ActiveRecord::Migration[5.2]
  disable_ddl_transaction!

  def up
    drop_table :firebase_cloud_messaging_tokens
  end

  def down
  end
end
