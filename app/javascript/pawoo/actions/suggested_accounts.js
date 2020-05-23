import api, { getLinks } from 'mastodon/api';
import { fetchRelationships } from 'mastodon/actions/accounts';
import { importFetchedAccounts } from 'mastodon/actions/importer';

export const SUGGESTED_ACCOUNTS_FETCH_REQUEST = 'SUGGESTED_ACCOUNTS_FETCH_REQUEST';
export const SUGGESTED_ACCOUNTS_FETCH_SUCCESS = 'SUGGESTED_ACCOUNTS_FETCH_SUCCESS';
export const SUGGESTED_ACCOUNTS_FETCH_FAIL = 'SUGGESTED_ACCOUNTS_FAIL';
export const SUGGESTED_ACCOUNTS_EXPAND_REQUEST = 'SUGGESTED_ACCOUNTS_EXPAND_REQUEST';
export const SUGGESTED_ACCOUNTS_EXPAND_SUCCESS = 'SUGGESTED_ACCOUNTS_EXPAND_SUCCESS';
export const SUGGESTED_ACCOUNTS_EXPAND_FAIL = 'SUGGESTED_ACCOUNTS_EXPAND_FAIL';

export function fetchSuggestedAccounts() {
  return (dispatch, getState) => {
    dispatch(fetchSuggestedAccountsRequest());

    api(getState).get('/api/v1/suggested_accounts').then(response => {
      const next = getLinks(response).refs.find(link => link.rel === 'next');
      dispatch(importFetchedAccounts(response.data));
      dispatch(fetchSuggestedAccountsSuccess(response.data, next ? next.uri : null));
      dispatch(fetchRelationships(response.data.map(item => item.id)));
    }).catch(error => {
      dispatch(fetchSuggestedAccountsFail(error));
    });
  };
};

export function fetchSuggestedAccountsRequest() {
  return { type: SUGGESTED_ACCOUNTS_FETCH_REQUEST };
};

export function fetchSuggestedAccountsSuccess(accounts, next) {
  return {
    type: SUGGESTED_ACCOUNTS_FETCH_SUCCESS,
    accounts,
    next,
  };
};

export function fetchSuggestedAccountsFail(error) {
  return {
    type: SUGGESTED_ACCOUNTS_FETCH_FAIL,
    error,
  };
};

export function expandSuggestedAccounts() {
  return (dispatch, getState) => {
    const url = getState().getIn(['pawoo', 'suggested_accounts', 'next']);

    if (url === null) {
      return;
    }

    dispatch(expandSuggestedAccountsRequest());

    api(getState).get(url).then(response => {
      const next = getLinks(response).refs.find(link => link.rel === 'next');

      dispatch(importFetchedAccounts(response.data));
      dispatch(expandSuggestedAccountsSuccess(response.data, next ? next.uri : null));
      dispatch(fetchRelationships(response.data.map(item => item.id)));
    }).catch(error => {
      dispatch(expandSuggestedAccountsFail(error));
    });
  };
};

export function expandSuggestedAccountsRequest() {
  return { type: SUGGESTED_ACCOUNTS_EXPAND_REQUEST };
};

export function expandSuggestedAccountsSuccess(accounts, next) {
  return {
    type: SUGGESTED_ACCOUNTS_EXPAND_SUCCESS,
    accounts,
    next,
  };
};

export function expandSuggestedAccountsFail(error) {
  return {
    type: SUGGESTED_ACCOUNTS_EXPAND_FAIL,
    error,
  };
};
