import PropTypes from 'prop-types';
import React from 'react';
import { pawooAddListener, pawooRemoveListener } from '../../mastodon/actions/streaming';
import ColumnHeader from '../../mastodon/components/column_header';

// TODO: 削除
export default class AnimatedTimelineColumnHeader extends React.PureComponent {

  static propTypes = {
    timelineId: PropTypes.string,
  };

  listener = null;

  componentDidUpdate ({ timelineId }) {
    if (this.listener && timelineId !== this.props.timelineId) {
      pawooRemoveListener(timelineId, this.listener);
      pawooAddListener(this.props.timelineId, this.listener);
    }
  }

  componentWillUnmount () {
    pawooRemoveListener(this.props.timelineId, this.listener);
  }

  setIconRef = c => {
    pawooRemoveListener(this.props.timelineId, this.listener);

    if (c === null) {
      return;
    }

    this.listener = () => {
      c.classList.remove('pawoo-extension-column-header__icon--animation');

      // Trigger layout
      c.offsetWidth; // eslint-disable-line no-unused-expressions

      c.classList.add('pawoo-extension-column-header__icon--animation');
    };

    pawooAddListener(this.props.timelineId, this.listener);
  };

  render () {
    return <ColumnHeader pawooIconRef={this.setIconRef} {...this.props} />;
  }

}
