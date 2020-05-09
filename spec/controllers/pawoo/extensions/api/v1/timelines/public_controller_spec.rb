# frozen_string_literal: true

require 'rails_helper'

describe Api::V1::Timelines::PublicController, type: :controller do
  describe 'GET #show' do
    context 'with media parameter' do
      it 'returns only media' do
        statuses = Fabricate.times(2, :status)
        Fabricate(:media_attachment, status: statuses[0], file: nil)

        get :show, params: { media: true }

        ids = body_as_json.pluck(:id)
        expect(ids).to include statuses[0].id.to_s
        expect(ids).not_to include statuses[1].id.to_s
      end

      it 'sets the path to the next page with media parameter' do
        statuses = Fabricate.times(2, :status)
        statuses.each { |status| Fabricate(:media_attachment, status: status, file: nil) }

        get :show, params: { media: true, since_id: statuses[0] }

        expect(response.headers['Link'].find_link(['rel', 'next']).href).to eq api_v1_timelines_public_url(max_id: statuses[1].id, media: true)
      end

      it 'sets the path to the previous page with media parameter' do
        statuses = Fabricate.times(2, :status)
        statuses.each { |status| Fabricate(:media_attachment, status: status, file: nil) }

        get :show, params: { media: true, max_id: statuses[1] }

        expect(response.headers['Link'].find_link(['rel', 'prev']).href).to eq api_v1_timelines_public_url(min_id: statuses[0].id, media: true)
      end
    end
  end
end
