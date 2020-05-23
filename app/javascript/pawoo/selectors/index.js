import { fromJS } from 'immutable';
import { createSelector } from 'reselect';
import uuid from 'mastodon/uuid';

const pages = fromJS({
  ONBOARDING: [
    { id: 'PAWOO_ONBOARDING', uuid: uuid(), params: {} },
  ],
  SUGGESTED_ACCOUNTS: [
    { id: 'COMPOSE', uuid: uuid(), params: {} },
    { id: 'PAWOO_SUGGESTED_ACCOUNTS', uuid: uuid(), params: {} },
  ],
});

const getAccountRelationship = (state, id) => state.getIn(['relationships', id], null);
const getAccountBase = (state, id) => state.getIn(['accounts', id], null);

export const makeGetSuggestedAccount = () => {
  return createSelector([getAccountBase, getAccountRelationship], (base, relationship) => {
    if (base === null) {
      return null;
    }

    return base.set('relationship', relationship);
  });
};

export function getColumns(state) {
  const page = state.getIn(['pawoo', 'page']);

  if (page === 'DEFAULT') {
    return state.getIn(['settings', 'columns']);
  }

  return pages.get(page);
}
