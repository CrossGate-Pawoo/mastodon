import { Map as ImmutableMap, OrderedSet, fromJS } from 'immutable';
import {
  PAWOO_GALLERY_FETCH_SUCCESS,
  PAWOO_GALLERY_FETCH_FAIL,
  PAWOO_GALLERY_FETCH_REQUEST,
  PAWOO_GALLERY_EXPAND_REQUEST,
  PAWOO_GALLERY_EXPAND_SUCCESS,
  PAWOO_GALLERY_EXPAND_FAIL,
  PAWOO_GALLERY_BLACKLIST_SUCCESS,
} from '../actions/galleries';

const initialState = ImmutableMap();

const initialTimeline = ImmutableMap({
  isLoading: false,
  items: OrderedSet(),
  next: null,
});


export default function suggestedAccounts(state = initialState, action) {
  switch (action.type) {
  case PAWOO_GALLERY_FETCH_SUCCESS:
  case PAWOO_GALLERY_EXPAND_SUCCESS:
    return state.update(action.tag, initialTimeline, map => map.withMutations(mMap => {
      mMap.set('isLoading', false);
      mMap.set('next', action.next);

      const statuses = fromJS(action.statuses);
      if (!statuses.isEmpty()) {
        mMap.update('items', OrderedSet(), oldIds => {
          const newIds = statuses.map(status => status.get('id'));
          return oldIds.concat(newIds);
        });
      }
    }));
  case PAWOO_GALLERY_FETCH_REQUEST:
  case PAWOO_GALLERY_EXPAND_REQUEST:
    return state.setIn([action.tag, 'isLoading'], true);
  case PAWOO_GALLERY_FETCH_FAIL:
  case PAWOO_GALLERY_EXPAND_FAIL:
    return state.setIn([action.tag, 'isLoading'], false);
  case PAWOO_GALLERY_BLACKLIST_SUCCESS:
    return state.update(action.tag, initialTimeline, map => map.withMutations(mMap => {
      mMap.update('items', OrderedSet(), ids => ids.delete(action.statusId));
    }));
  default:
    return state;
  }
}
