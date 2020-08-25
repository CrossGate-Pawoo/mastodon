# frozen_string_literal: true

class Pawoo::REST::SuggestionTagSerializer < ActiveModel::Serializer
  include RoutingHelper

  attributes :name, :url, :type, :description

  def url
    tag_url(object.name)
  end

  def type
    object.suggestion_type
  end
end
