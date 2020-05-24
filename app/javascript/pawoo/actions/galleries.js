import api, { getLinks } from 'mastodon/api';
import { importFetchedStatuses } from 'mastodon/actions/importer';

export const PAWOO_GALLERY_FETCH_REQUEST = 'PAWOO_GALLERY_FETCH_REQUEST';
export const PAWOO_GALLERY_FETCH_SUCCESS = 'PAWOO_GALLERY_FETCH_SUCCESS';
export const PAWOO_GALLERY_FETCH_FAIL = 'PAWOO_GALLERY_FAIL';
export const PAWOO_GALLERY_EXPAND_REQUEST = 'PAWOO_GALLERY_EXPAND_REQUEST';
export const PAWOO_GALLERY_EXPAND_SUCCESS = 'PAWOO_GALLERY_EXPAND_SUCCESS';
export const PAWOO_GALLERY_EXPAND_FAIL = 'PAWOO_GALLERY_EXPAND_FAIL';
export const PAWOO_GALLERY_BLACKLIST_SUCCESS = 'PAWOO_GALLERY_BLACKLIST_SUCCESS';
export const PAWOO_GALLERY_BLACKLIST_FAIL = 'PAWOO_GALLERY_BLACKLIST_FAIL';

export function fetchGallery(tag) {
  return (dispatch, getState) => {
    dispatch(fetchGalleryRequest(tag));

    api(getState).get(`/api/v1/pawoo/galleries/${tag}`).then(response => {
      const next = getLinks(response).refs.find(link => link.rel === 'next');
      dispatch(importFetchedStatuses(response.data));
      dispatch(fetchGallerySuccess(tag, response.data, next ? next.uri : null));
    }).catch(error => {
      dispatch(fetchGalleryFail(tag, error));
    });
  };
};


export function fetchGalleryRequest(tag) {
  return { type: PAWOO_GALLERY_FETCH_REQUEST, tag };
};

export function fetchGallerySuccess(tag, statuses, next) {
  return {
    type: PAWOO_GALLERY_FETCH_SUCCESS,
    tag,
    statuses,
    next,
  };
};

export function fetchGalleryFail(tag, error) {
  return {
    type: PAWOO_GALLERY_FETCH_FAIL,
    tag,
    error,
  };
};

export function expandGallery(tag) {
  return (dispatch, getState) => {
    const url = getState().getIn(['pawoo', 'galleries', tag, 'next']);

    if (!url) {
      return;
    }

    dispatch(expandGalleryRequest(tag));

    api(getState).get(url).then(response => {
      const next = getLinks(response).refs.find(link => link.rel === 'next');
      dispatch(importFetchedStatuses(response.data));
      dispatch(expandGallerySuccess(tag, response.data, next ? next.uri : null));
    }).catch(error => {
      dispatch(expandGalleryFail(tag, error));
    });
  };
};


export function expandGalleryRequest(tag) {
  return { type: PAWOO_GALLERY_EXPAND_REQUEST, tag };
};

export function expandGallerySuccess(tag, statuses, next) {
  return {
    type: PAWOO_GALLERY_EXPAND_SUCCESS,
    tag,
    statuses,
    next,
  };
};

export function expandGalleryFail(tag, error) {
  return {
    type: PAWOO_GALLERY_EXPAND_FAIL,
    tag,
    error,
  };
};


export function blacklistGallery(tag, statusId) {
  return (dispatch, getState) => {
    api(getState).put(`/api/v1/pawoo/galleries/${tag}/blacklist/${statusId}`).then(() => {
      dispatch(blacklistGallerySuccess(tag, statusId));
    }).catch(error => {
      dispatch(blacklistGalleryFail(tag, error));
    });
  };
}

export function blacklistGallerySuccess(tag, statusId) {
  return {
    type: PAWOO_GALLERY_BLACKLIST_SUCCESS,
    tag,
    statusId,
  };
};

export function blacklistGalleryFail(tag, error) {
  return {
    type: PAWOO_GALLERY_BLACKLIST_FAIL,
    tag,
    error,
  };
};
