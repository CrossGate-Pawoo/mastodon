import api from 'mastodon/api';

const requestedImageCaches = [];
export function requestImageCache(url) {
  return function (dispatch, getState) {
    // pixiv image cache
    if (requestedImageCaches.indexOf(url) === -1) {
      requestedImageCaches.push(url);
      const data = new FormData();
      data.append('url', url);
      api(getState).post('/api/v1/pixiv_twitter_images', data).catch(() => {
        requestedImageCaches.splice(requestedImageCaches.indexOf(url), 1);
      });
    }
  };
}
