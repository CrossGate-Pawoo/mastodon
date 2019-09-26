# frozen_string_literal: true
# == Schema Information
#
# Table name: pixiv_cards
#
#  id        :bigint(8)        not null, primary key
#  url       :string           not null
#  image_url :string
#  status_id :bigint(8)        not null
#

class PixivCard < ApplicationRecord
  belongs_to :status

  before_validation :replace_image_url_scheme, if: :image_url?

  validates :url, presence: true
  validate :validate_image_url, if: :image_url?

  def fetch_image_url
    return unless url?

    self.image_url = PixivUrl::PixivTwitterImage.cache_or_fetch(url)
  end

  def to_hash_like_media_attachment
    {
      id: id.to_s,
      preview_url: image_url,
      remote_url: '',
      text_url: url,
      type: 'image',
      url: image_url,
    }
  end

  private

  def replace_image_url_scheme
    return unless PixivUrl.valid_twitter_image?(image_url)

    uri = Addressable::URI.parse(image_url)
    uri.scheme = 'https'
    self.image_url = uri.to_s
  end

  def validate_image_url
    errors.add(:image_url) unless PixivUrl.valid_twitter_image?(image_url)
  end
end
