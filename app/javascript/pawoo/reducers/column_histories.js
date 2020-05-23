import Immutable from 'immutable';

import { COLUMN_ADD, COLUMN_REMOVE } from '../../mastodon/actions/columns';
import { COLUMN_HISTORY_PUSH, COLUMN_HISTORY_POP } from '../actions/column_histories';
import { STORE_HYDRATE } from '../../mastodon/actions/store';
// import { defaultColumns } from '../../mastodon/reducers/settings';

const initialState = Immutable.Map();

const addColumnHistory = (state, uuid, location) => {
  return state.set(uuid, Immutable.Stack([location]));
};

const removeColumnHistory = (state, uuid) => {
  return state.delete(uuid);
};

const pushColumnHistory = (state, column, location) => {
  return state.update(column.get('uuid'), history => history.push(location));
};

const popColumnHistory = (state, column) => {
  return state.update(column.get('uuid'), history => history.pop());
};

const hydrate = (state, hydratedState = null) => {
  state = hydratedState.reduce((map, item) => (
    map.set(item.get('uuid'), Immutable.Stack([item]))
  ), Immutable.Map());
  return state;
};

export default function column_histories(state = initialState, action) {
  switch (action.type) {
  case STORE_HYDRATE:
    return hydrate(state, action.state.getIn(['settings', 'columns']));
  case COLUMN_ADD:
    return addColumnHistory(state, action.uuid, Immutable.fromJS({ id: action.id, uuid: action.uuid, params: action.params }));
  case COLUMN_REMOVE:
    return removeColumnHistory(state, action.uuid);
  case COLUMN_HISTORY_PUSH:
    return pushColumnHistory(state, action.column, action.location);
  case COLUMN_HISTORY_POP:
    return popColumnHistory(state, action.column);
  default:
    return state;
  }
}
