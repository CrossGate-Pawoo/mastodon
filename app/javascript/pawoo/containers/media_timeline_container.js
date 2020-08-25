import React from 'react';
import { connect } from 'react-redux';
import { defineMessages, injectIntl, FormattedMessage } from 'react-intl';
import PropTypes from 'prop-types';
import StatusListContainer from 'mastodon/features/ui/containers/status_list_container';
import Column from 'mastodon/components/column';
import ColumnHeader from 'mastodon/components/column_header';
import { expandCommunityTimeline } from 'mastodon/actions/timelines';
import { addColumn, removeColumn, moveColumn } from 'mastodon/actions/columns';
import { connectCommunityStream } from 'mastodon/actions/streaming';
import PawooTimelineBottomBanner from 'pawoo/components/timeline_bottom_banner';

const messages = defineMessages({
  title: { id: 'pawoo.column.media', defaultMessage: 'Media timeline' },
});

const mapStateToProps = (state) => ({
  hasUnread: state.getIn(['timelines', 'community:media', 'unread']) > 0,
});

export default @connect(mapStateToProps)
@injectIntl
class MediaTimeline extends React.PureComponent {

  static propTypes = {
    dispatch: PropTypes.func.isRequired,
    shouldUpdateScroll: PropTypes.func,
    columnId: PropTypes.string,
    intl: PropTypes.object.isRequired,
    hasUnread: PropTypes.bool,
    multiColumn: PropTypes.bool,
  };

  handlePin = () => {
    const { columnId, dispatch } = this.props;

    if (columnId) {
      dispatch(removeColumn(columnId));
    } else {
      dispatch(addColumn('MEDIA', {}));
    }
  }

  handleMove = (dir) => {
    const { columnId, dispatch } = this.props;
    dispatch(moveColumn(columnId, dir));
  }

  handleHeaderClick = () => {
    this.column.scrollTop();
  }

  componentDidMount () {
    const { dispatch } = this.props;

    dispatch(expandCommunityTimeline({ onlyMedia: true }));
    this.disconnect = dispatch(connectCommunityStream({ onlyMedia: true }));
  }

  componentWillUnmount () {
    if (this.disconnect) {
      this.disconnect();
      this.disconnect = null;
    }
  }

  setRef = c => {
    this.column = c;
  }

  handleLoadMore = maxId => {
    const { dispatch } = this.props;

    dispatch(expandCommunityTimeline({ maxId, onlyMedia: true }));
  }

  render () {
    const { intl, shouldUpdateScroll, hasUnread, columnId, multiColumn } = this.props;
    const pinned = !!columnId;

    return (
      <Column ref={this.setRef} label={intl.formatMessage(messages.title)}>
        <ColumnHeader
          icon='image'
          active={hasUnread}
          title={intl.formatMessage(messages.title)}
          onPin={this.handlePin}
          onMove={this.handleMove}
          onClick={this.handleHeaderClick}
          pinned={pinned}
          multiColumn={multiColumn}
        />

        <StatusListContainer
          trackScroll={!pinned}
          scrollKey={`media_timeline-${columnId}`}
          timelineId='community:media'
          onLoadMore={this.handleLoadMore}
          emptyMessage={<FormattedMessage id='empty_column.community' defaultMessage='The local timeline is empty. Write something publicly to get the ball rolling!' />}
          shouldUpdateScroll={shouldUpdateScroll}
        />

        <PawooTimelineBottomBanner />
      </Column>
    );
  }

}
