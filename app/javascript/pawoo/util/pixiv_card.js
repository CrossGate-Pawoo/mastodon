import Immutable from 'immutable';

export function convertToMediaAttachmentsFromPixivCards(status) {
  return status.get('pixiv_cards', Immutable.List()).map(card => {
    return Immutable.fromJS({
      id: Math.random().toString(),
      preview_url: card.get('image_url'),
      remote_url: '',
      text_url: card.get('url'),
      type: 'image',
      url: card.get('image_url'),
    });
  });
}

