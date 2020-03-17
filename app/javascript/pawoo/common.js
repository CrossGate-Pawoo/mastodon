import GA from './actions/ga';
import loadPolyfills from '../mastodon/load_polyfills';

function main() {
  const ready = require('../mastodon/ready').default;
  ready(() => {
    GA.trackPage(window.location.pathname);
    GA.startHeartbeat();
  });
}

export function start() {
  require.context('./images/', true);

  loadPolyfills().then(main).catch(error => {
    console.error(error);
  });
}
