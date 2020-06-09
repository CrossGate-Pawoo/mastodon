import { fromJS } from 'immutable';
import { createSelector } from 'reselect';
import uuid from 'mastodon/uuid';
import { makeGetAccount } from 'mastodon/selectors';

const pages = fromJS({
  ONBOARDING: [
    { id: 'PAWOO_ONBOARDING', uuid: uuid(), params: {} },
  ],
  SUGGESTED_ACCOUNTS: [
    { id: 'COMPOSE', uuid: uuid(), params: {} },
    { id: 'PAWOO_SUGGESTED_ACCOUNTS', uuid: uuid(), params: {} },
  ],
});

const getAccountMediaAttachments = (state, id) => state.getIn(['pawoo', 'suggested_accounts', 'mediaAttachmentsMap', id], fromJS([]));

export const makeGetSuggestedAccount = () => {
  return createSelector([makeGetAccount(), getAccountMediaAttachments], (base, mediaAttachments) => {
    if (base === null) {
      return null;
    }

    return base.set('media_attachments', mediaAttachments);
  });
};

export function getColumns(state) {
  const page = state.getIn(['pawoo', 'page']);

  if (page === 'DEFAULT') {
    return state.getIn(['settings', 'columns']);
  }

  return pages.get(page);
}
