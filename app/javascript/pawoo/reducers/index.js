import { combineReducers } from 'redux-immutable';
import page from './page';
import suggested_accounts from './suggested_accounts';
import suggestion_tags from './suggestion_tags';
import trend_tags from './trend_tags';
import followers_you_follow from './followers_you_follow';
import galleries from './galleries';

const reducers = {
  page,
  suggested_accounts,
  suggestion_tags,
  trend_tags,
  followers_you_follow,
  galleries,
};

export default combineReducers(reducers);
