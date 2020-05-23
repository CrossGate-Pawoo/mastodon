import api from 'mastodon/api';
import { importFetchedAccounts } from 'mastodon/actions/importer';

export const PAWOO_FOLLOWERS_YOU_FOLLOW_SUCCESS = 'PAWOO_FOLLOWERS_YOU_FOLLOW_SUCCESS';

export function fetchFollowersYouFollow(targetAccountId) {
  return (dispatch, getState) => {
    api(getState).get(`/api/v1/pawoo/followers_you_follow/${targetAccountId}`).then(response => {
      dispatch(importFetchedAccounts(response.data));
      dispatch(fetchFollowersYouFollowSuccess(targetAccountId, response.data.map(account => account.id)));
    }).catch(e => console.warn(e));
  };
};

export function fetchFollowersYouFollowSuccess(targetAccountId, accountIds) {
  return {
    type: PAWOO_FOLLOWERS_YOU_FOLLOW_SUCCESS,
    accountIds,
    targetAccountId,
  };
};
