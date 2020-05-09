# frozen_string_literal: true

module PixivUrl
  module PixivTwitterImage
    EXPIRES_IN = 12.hours

    class << self
      def cache_or_fetch(url, force: false)
        return unless PixivUrl.valid_pixiv_url?(url)

        Rails.cache.fetch(cache_key(url), expires_in: EXPIRES_IN, force: force) do
          fetch_image_url(url)
        end
      end

      def cache_exists?(url)
        Rails.cache.exist?(cache_key(url))
      end

      private

      def cache_key(url)
        "#{self.class}:image_url:#{url}"
      end

      def fetch_image_url(url)
        html = nil
        html_charset = nil
        Request.new(:get, url).perform do |res|
          if res.code == 200 && res.mime_type == 'text/html'
            html = res.body_with_limit
            html_charset = res.charset
          end
        end
        return if html.nil?

        image_url = fetch_from_oembed(url, html) || attempt_opengraph(html, html_charset)
        return if image_url.blank? || !PixivUrl.valid_pixiv_image_url?(image_url)

        image_url
      end

      def fetch_from_oembed(url, html)
        embed = FetchOEmbedService.new.call(url, html: html)
        return if embed.nil? || embed[:type] != 'photo'

        embed[:url]
      end

      def attempt_opengraph(html, html_charset)
        detector = CharlockHolmes::EncodingDetector.new
        detector.strip_tags = true

        guess = detector.detect(html, html_charset)
        page  = Nokogiri::HTML(html, nil, guess&.fetch(:encoding, nil))

        meta_property(page, 'twitter:image') || meta_property(page, 'og:image')
      end

      def meta_property(page, property)
        page.at_xpath("//meta[@property=\"#{property}\"]")&.attribute('content')&.value || page.at_xpath("//meta[@name=\"#{property}\"]")&.attribute('content')&.value
      end
    end
  end
end
