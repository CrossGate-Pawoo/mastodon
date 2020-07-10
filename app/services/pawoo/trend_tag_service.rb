# frozen_string_literal: true

class Pawoo::TrendTagService < BaseService
  SPAN = 60.minutes
  TREND_HISTORIES_KEY = 'trend_histories'
  TREND_LENGTH = 3
  HISTORY_COUNT = 3

  ACCOUNTS_COUNT_MIN = 3
  FAVOURITES_COUNT_MIN = 1
  REBLOGS_COUNT_MIN = 1

  IGNORE_TAG_NAMES = %w(pixiv r) # 完全一致するタグを除外する

  class TagScore
    include ActiveModel::Model

    attr_accessor :tag_id, :tag_name, :favourites_count, :reblogs_count, :accounts_count, :count

    def score
      favourites_count * 1 + reblogs_count * 3 + accounts_count * 30
    end

    def score_average
      score.to_f / count
    end

    def include_in_calculation?
      accounts_count >= ACCOUNTS_COUNT_MIN &&
        favourites_count >= FAVOURITES_COUNT_MIN &&
        reblogs_count >= REBLOGS_COUNT_MIN
    end

    def +(other)
      raise 'tag_id is not matched' unless tag_id == other.tag_id

      dup.tap do |dupped|
        %i(count favourites_count reblogs_count accounts_count).each do |key|
          value = public_send(key).to_i
          other_value = other.public_send(key)

          dupped.public_send("#{key}=", value + other_value)
        end
      end
    end
  end

  def call(time = Time.current)
    statuses = recent_public_statuses(time)
    current_tag_scores = build_tag_scores_from_statuses(statuses)
    lpush_current_tag_scores(current_tag_scores)

    # 履歴の数がHISTORY_COUNTより少ない場合はトレンドを出すことができないため、空配列を返す
    return [] if redis.llen(TREND_HISTORIES_KEY) + 1 < HISTORY_COUNT

    # historyから過去のcurrent_tag_scoresを取り出す
    tag_score_histories = redis.lrange(TREND_HISTORIES_KEY, 1, -1).map do |history_tag_score|
      JSON.parse(history_tag_score).map { |tag_score_attributes| TagScore.new(tag_score_attributes) }
    end

    # 現在のトレンドを計算する
    tag_scores = current_trend_tag_scores(current_tag_scores, tag_score_histories)
    tag_scores.map(&:tag_name).tap do |tag_names|
      Pawoo::TrendTag.update_trend_tags(tag_names)
    end
  end

  private

  # redisに新しいハッシュタグのスコア履歴を保存する
  def lpush_current_tag_scores(current_tag_scores)
    redis.lpush(TREND_HISTORIES_KEY, current_tag_scores.to_json)
    redis.ltrim(TREND_HISTORIES_KEY, 0, HISTORY_COUNT - 1)
  end

  # 現在のスコアからトレンドの配列を返します。
  # トレンドは過去のスコアの平均から現在のスコアがどれだけ伸びたかの伸び率で出します。
  # 伸び率が1.0以下のものはトレンドから除外されるため、トレンドが出ずに空配列が返ることもあります。
  def current_trend_tag_scores(current_tag_scores, tag_score_histories)
    by_tag_id = tag_score_histories.flatten.group_by { |tag_score| tag_score.tag_id.to_i }
    min_tag_score = TagScore.new(favourites_count: FAVOURITES_COUNT_MIN, reblogs_count: REBLOGS_COUNT_MIN, accounts_count: ACCOUNTS_COUNT_MIN)

    # 過去の値を合計する
    merged_tag_score_histories = by_tag_id.map { |tag_id, tag_scores| [tag_id, tag_scores.inject(&:+)] }.to_h

    # 過去スコアから現在スコアの伸び率を求める
    trend_tag_scores = current_tag_scores.map do |tag_score|
      history_tag_score = merged_tag_score_histories[tag_score.tag_id.to_i]
      next unless history_tag_score

      growth = tag_score.score.to_f / history_tag_score.score_average

      # すべての履歴に記録されているタグのみ候補として残す
      # scoreが最低ライン以上のタグを残す
      # 伸び率が1より大きいタグを残す
      next unless tag_score.score_average >= min_tag_score.score.to_f / tag_score.count
      next unless growth > 1

      [growth, tag_score]
    end

    trend_tag_scores.compact.sort_by { |growth, _| growth * -1 }.map { |_, tag_score| tag_score }
  end

  def build_tag_scores_from_statuses(statuses)
    trend_ng_words = TrendNgWord.pluck(:word)
    tag_statuses_map = Hash.new { |h, k| h[k] = [] }

    # tagでStatusをグルーピングする
    statuses.each do |status|
      # 本文がタグのみの投稿を弾く(タグのみで遊ぶ投稿への対策、内容のないものはトレンドとしてふさわしくない)
      next if status.text.remove(Tag::HASHTAG_RE).strip.empty?

      status.tags.each do |tag|
        # NGワードを含む ふさわしくないTagは弾く
        tag_name = tag.name.downcase
        next if IGNORE_TAG_NAMES.include?(tag_name) || trend_ng_words.any? { |ng_word| tag_name.include?(ng_word) }
        tag_statuses_map[tag].push(status)
      end
    end

    tag_statuses_map.map { |tag, tag_statuses|
      TagScore.new(
        count: 1,
        tag_id: tag.id,
        tag_name: tag.name,
        favourites_count: tag_statuses.sum(&:favourites_count),
        reblogs_count: tag_statuses.sum(&:reblogs_count),
        accounts_count: tag_statuses.uniq(&:account_id).size
      )
    }.select(&:include_in_calculation?)
  end

  def recent_public_statuses(time)
    # 全件探索は重いので雑に間引く
    time_from = time.ago(SPAN)
    min_id = Mastodon::Snowflake.id_at(time_from)
    max_id = Mastodon::Snowflake.id_at(time)

    recent_tags = Status.where(created_at: time_from..time).where(Status.arel_table[:id].gteq(min_id)).where(Status.arel_table[:id].lteq(max_id))
    recent_tags.local.with_public_visibility.joins(:tags).preload(:tags).distinct
  end

  def redis
    Redis.current
  end
end
