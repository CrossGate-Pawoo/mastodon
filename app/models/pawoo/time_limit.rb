# frozen_string_literal: true

class Pawoo::TimeLimit
  TIME_LIMIT_RE = /^exp(?<value>\d+)(?<unit>[mhd])$/.freeze
  VALID_DURATION = (1.minute..7.days).freeze

  def self.from_status(status)
    return unless status

    status = status.reblog if status.reblog?
    return unless status.local?
    return unless status.tags

    status.tags.map { |tag| new(tag.name) }.find(&:valid?)
  end

  def self.enabled?(status)
    from_status(status).present?
  end

  def initialize(name)
    @name = name
  end

  def valid?
    VALID_DURATION.include?(to_duration)
  end

  def to_duration
    matched = @name.match(TIME_LIMIT_RE)
    return 0 unless matched

    case matched[:unit]
    when 'm'
      matched[:value].to_i.minutes
    when 'h'
      matched[:value].to_i.hours
    when 'd'
      matched[:value].to_i.days
    else
      0
    end
  end
end
