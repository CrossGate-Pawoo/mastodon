import loadPolyfills from '../mastodon/load_polyfills';
import { start } from '../mastodon/common';

start();

function loaded() {
  const TimelineContainer = require('../mastodon/containers/timeline_container').default;
  const React             = require('react');
  const ReactDOM          = require('react-dom');
  const mountNode         = document.getElementById('mastodon-timeline');

  if (mountNode !== null) {
    const props = JSON.parse(mountNode.getAttribute('data-props'));
    ReactDOM.render(<TimelineContainer {...props} />, mountNode);
  }

  const pawooMountNode = document.getElementById('pawoo-community-timeline');
  if (pawooMountNode !== null) {
    const CommunityTimelineContainer = require('../pawoo/containers/standalone/timeline_container').default;
    const props = JSON.parse(pawooMountNode.getAttribute('data-props'));
    ReactDOM.render(<CommunityTimelineContainer {...props} />, pawooMountNode);
  }
}

function main() {
  const ready = require('../mastodon/ready').default;
  ready(loaded);
}

loadPolyfills().then(main).catch(error => {
  console.error(error);
});
