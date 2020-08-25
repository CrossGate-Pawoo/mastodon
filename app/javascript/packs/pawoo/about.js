import loadPolyfills from 'mastodon/load_polyfills';
import { start } from 'mastodon/common';

start();

function loaded() {
  const CommunityTimelineContainer = require('../../pawoo/containers/standalone/community_timeline_container').default;
  const React             = require('react');
  const ReactDOM          = require('react-dom');
  const mountNode         = document.getElementById('pawoo-community-timeline');

  if (mountNode !== null) {
    const props = JSON.parse(mountNode.getAttribute('data-props'));
    ReactDOM.render(<CommunityTimelineContainer {...props} />, mountNode);
  }


  (() => {
    // MSIE(IE11のみUAにMSIEを含まないのでTridentで検出)
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isMSIE = /MSIE/i.test(userAgent) || /Trident/i.test(userAgent);

    if (isMSIE) {
      alert('お使いのブラウザはサポートされていません。Microsoft Edge、Google Chromeなどをお試しください。');
    }
  })();
}

function main() {
  const ready = require('../../mastodon/ready').default;
  ready(loaded);
}

loadPolyfills().then(main).catch(error => {
  console.error(error);
});
