import { List as ImmutableList, Map as ImmutableMap, fromJS } from 'immutable';
import {
  SUGGESTED_ACCOUNTS_FETCH_REQUEST,
  SUGGESTED_ACCOUNTS_FETCH_SUCCESS,
  SUGGESTED_ACCOUNTS_FETCH_FAIL,
  SUGGESTED_ACCOUNTS_EXPAND_REQUEST,
  SUGGESTED_ACCOUNTS_EXPAND_SUCCESS,
  SUGGESTED_ACCOUNTS_EXPAND_FAIL,
} from '../actions/suggested_accounts';

const initialState = ImmutableMap({
  isLoading: true,
  next: null,
  items: ImmutableList(),
  mediaAttachmentsMap: ImmutableMap({}),
});

export default function suggestedAccounts(state = initialState, action) {
  switch (action.type) {
  case SUGGESTED_ACCOUNTS_FETCH_SUCCESS:
  case SUGGESTED_ACCOUNTS_EXPAND_SUCCESS:
    return state.withMutations(map => {
      map.set('next', action.next);
      map.update('items', list => list.push(...action.accounts.map(item => item.id)).toOrderedSet().toList());
      for (const account of action.accounts) {
        map.setIn(['mediaAttachmentsMap', account.id], fromJS(account.media_attachments));
      }
      map.set('isLoading', false);
    });
  case SUGGESTED_ACCOUNTS_FETCH_REQUEST:
  case SUGGESTED_ACCOUNTS_EXPAND_REQUEST:
    return state.set('isLoading', true);
  case SUGGESTED_ACCOUNTS_FETCH_FAIL:
  case SUGGESTED_ACCOUNTS_EXPAND_FAIL:
    return state.set('isLoading', false);
  default:
    return state;
  }
}
