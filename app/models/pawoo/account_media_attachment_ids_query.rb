class Pawoo::AccountMediaAttachmentIdsQuery
  def initialize(account)
    @account = account
    @limit = 3
    @attachments_ids = []
  end

  def limit(limit_num)
    @limit = limit_num.to_i
    self
  end

  def call
    @attachments_ids += pinned_media_attachments.limit(@limit).pluck(:id)
    return @attachments_ids if @attachments_ids.size == @limit

    @attachments_ids += latest_popular_media_attachments.limit(@limit - @attachments_ids.size).pluck(:id)
    return @attachments_ids if @attachments_ids.size == @limit

    @attachments_ids += latest_media_attachments.limit(@limit - @attachments_ids.size).pluck(:id)
  end

  private

  # 固定トゥートのメディア
  def pinned_media_attachments
    base_query.joins(status: :status_pin).where(statuses: { status_pins: { account: @account } }).reorder(StatusPin.arel_table[:created_at].desc)
  end

  # 2週間以内で人気のメディア
  def latest_popular_media_attachments
    base_query.joins(status: :status_stat).where('media_attachments.status_id > ?', Mastodon::Snowflake.id_at(2.weeks.ago)).reorder(StatusStat.arel_table[:favourites_count].desc)
  end

  # 最新のメディア
  def latest_media_attachments
    base_query.reorder(Status.arel_table[:id].desc)
  end

  def base_query
    @account.media_attachments.joins(:status).where(statuses: { account: @account, sensitive: false, visibility: [:public, :unlisted] }).tap do |query|
      query.merge!(MediaAttachment.where.not(id: @attachments_ids)) if @attachments_ids.present? # 取得済みは除外
    end
  end
end
