# frozen_string_literal: true

class Pawoo::MaintenanceImage
  include ActiveModel::Model

  attr_accessor :id, :statuses, :images

  validates :id, :statuses, :images, presence: true

  def self.mappings
    @mappings ||= YAML.load_file(Rails.root.join('data', 'maintenance_images.yml')).map { |attributes| new(attributes) }
  end
end
