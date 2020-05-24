require 'rails_helper'

RSpec.describe PixivUrl do
  describe '#valid_pixiv_url?' do
    context 'given pixiv url' do
      it 'returns true' do
        %w(
          https://www.pixiv.net/member_illust.php?mode=medium&illust_id=1
          https://www.pixiv.net/novel/show.php?id=1
          https://www.pixiv.net/member_illust.php?id=1
          https://www.pixiv.net/artworks/1
          https://www.pixiv.net/en/artworks/1
        ).each do |url|
          is_expected.to be_valid_pixiv_url(url)
        end
      end
    end

    context 'given invalid url' do
      it 'returns false' do
        %w(
          https://www.pixiv.net/?url=https://www.pixiv.net/users/1
        ).each do |url|
          is_expected.to_not be_valid_pixiv_url(url)
        end
      end

      it 'returns false' do
        %w(
          https://factory.pixiv.net/
          https://www.pixiv.net/
          https://touch.pixiv.net/
          https://novel.pixiv.net/
          https://example.com
        ).each do |url|
          is_expected.to_not be_valid_pixiv_url(url)
        end
      end
    end
  end

  describe '#valid_pixiv_image_url?' do
    context 'given pixiv url' do
      it 'returns true' do
        %w(
          https://i.pximg.net/i_wanna_🍺
          https://embed.pixiv.net/i_wanna_🍶
        ).each do |url|
          is_expected.to be_valid_pixiv_image_url(url)
        end
      end
    end

    context 'given invalid url' do
      it 'returns false' do
        is_expected.to_not be_valid_pixiv_image_url('https://www.pixiv.net/')
      end
    end
  end
end
