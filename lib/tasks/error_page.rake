# frozen_string_literal: true

namespace :error_page do
  desc 'Generate static error pages'
  task generate: :environment do
    ErrorPageGenerator.new(
      status_codes: [403, 410, 422, 500, 503],
      locales: I18n.available_locales,
      public_path: Rails.application.paths['public'].existent.first
    ).generate
  end

  Rake::Task['assets:precompile'].enhance do
    Rake::Task['error_page:generate'].invoke if ENV['CI'] != 'true' # temporary workaround for avoiding https://circleci.com/gh/pixiv/pawoo/2267 error
  end

  class ErrorPageGenerator
    attr_accessor :status_codes, :locales, :public_path

    def initialize(status_codes: [], locales: [], public_path:)
      @status_codes = status_codes
      @locales = locales
      @public_path = public_path

      raise 'public path is not found' unless @public_path
    end

    def generate
      status_codes.each do |status_code|
        locales.each do |locale|
          html = I18n.with_locale(locale) do
            ApplicationController.renderer.render(layout: 'error', template: "errors/#{status_code}", locale: locale, status: status_code)
          end

          write_template(File.join(public_path, "#{status_code}.#{locale}.html"), html)

          # default localeの場合は、localeのsuffixがないファイルも用意する
          write_template(File.join(public_path, "#{status_code}.html"), html) if locale == I18n.default_locale
        end
      end
    end

    private

    def write_template(path, html)
      Rails.logger.debug("Write error page: #{path}")
      File.write(path, html)
    end
  end
end
