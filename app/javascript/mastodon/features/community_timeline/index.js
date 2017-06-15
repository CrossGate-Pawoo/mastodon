import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import StatusListContainer from '../ui/containers/status_list_container';
import Column from '../../components/column';
import ColumnHeader from '../../components/column_header';
import {
  refreshCommunityTimeline,
  expandCommunityTimeline,
  updateTimeline,
  deleteFromTimelines,
  connectTimeline,
  disconnectTimeline,
} from '../../actions/timelines';
import { addColumn, removeColumn, moveColumn } from '../../actions/columns';
import { defineMessages, injectIntl, FormattedMessage } from 'react-intl';
import ColumnBackButtonSlim from '../../components/column_back_button_slim';
import ColumnSettingsContainer from './containers/column_settings_container';
import createStream from '../../stream';

const messages = defineMessages({
  title: { id: 'column.community', defaultMessage: 'Local timeline' },
});

const mapStateToProps = state => ({
  hasUnread: state.getIn(['timelines', 'community', 'unread']) > 0,
  streamingAPIBaseURL: state.getIn(['meta', 'streaming_api_base_url']),
  accessToken: state.getIn(['meta', 'access_token']),
});

class CommunityTimeline extends React.PureComponent {

  static propTypes = {
    dispatch: PropTypes.func.isRequired,
    columnId: PropTypes.string,
    intl: PropTypes.object.isRequired,
    streamingAPIBaseURL: PropTypes.string.isRequired,
    accessToken: PropTypes.string.isRequired,
    hasUnread: PropTypes.bool,
<<<<<<< HEAD
    standalone: PropTypes.bool,
  };

  static defaultProps = {
    standalone: false,
=======
    multiColumn: PropTypes.bool,
>>>>>>> 947887f261f74f84312327a5265553e8f16655fe
  };

  handlePin = () => {
    const { columnId, dispatch } = this.props;

    if (columnId) {
      dispatch(removeColumn(columnId));
    } else {
      dispatch(addColumn('COMMUNITY', {}));
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
    const { dispatch, streamingAPIBaseURL, accessToken, standalone } = this.props;

    dispatch(refreshCommunityTimeline());

    if (typeof this._subscription !== 'undefined') {
      return;
    }

<<<<<<< HEAD
    if (!standalone) {
      subscription = createStream(streamingAPIBaseURL, accessToken, 'public:local', {

        connected () {
          dispatch(connectTimeline('community'));
        },

        reconnected () {
          dispatch(connectTimeline('community'));
        },

        disconnected () {
          dispatch(disconnectTimeline('community'));
        },

        received (data) {
          switch(data.event) {
          case 'update':
            dispatch(updateTimeline('community', JSON.parse(data.payload)));
            break;
          case 'delete':
            dispatch(deleteFromTimelines(data.payload));
            break;
          }
        },
      });
    } else {
      this.interval = setInterval(() => {
        dispatch(refreshTimeline('community'));
      }, 2000);
    }
  }

  componentWillUnmount () {
    // if (typeof subscription !== 'undefined') {
    //   subscription.close();
    //   subscription = null;
    // }
    clearInterval(this.interval);
  }

  render () {
    let heading;
    const { intl, hasUnread, standalone } = this.props;

    if (standalone) {
      heading = (
        <div style={{ display: 'inline-block', verticalAlign: 'top' }}>
          <div>Pawooのローカルタイムライン</div>
          <div style={{ fontSize: '12px' }}>投稿をリアルタイムに流しています</div>
        </div>
      );
    } else {
      heading = intl.formatMessage(messages.title);
    }

    return (
      <Column icon='users' active={hasUnread} heading={heading}>
        {!standalone && <ColumnBackButtonSlim />}

        <StatusListContainer {...this.props} scrollKey='community_timeline' type='community' emptyMessage={<FormattedMessage id='empty_column.community' defaultMessage='The local timeline is empty. Write something publicly to get the ball rolling!' />} />
=======
    this._subscription = createStream(streamingAPIBaseURL, accessToken, 'public:local', {

      connected () {
        dispatch(connectTimeline('community'));
      },

      reconnected () {
        dispatch(connectTimeline('community'));
      },

      disconnected () {
        dispatch(disconnectTimeline('community'));
      },

      received (data) {
        switch(data.event) {
        case 'update':
          dispatch(updateTimeline('community', JSON.parse(data.payload)));
          break;
        case 'delete':
          dispatch(deleteFromTimelines(data.payload));
          break;
        }
      },

    });
  }

  componentWillUnmount () {
    if (typeof this._subscription !== 'undefined') {
      this._subscription.close();
      this._subscription = null;
    }
  }

  setRef = c => {
    this.column = c;
  }

  handleLoadMore = () => {
    this.props.dispatch(expandCommunityTimeline());
  }

  render () {
    const { intl, hasUnread, columnId, multiColumn } = this.props;
    const pinned = !!columnId;

    return (
      <Column ref={this.setRef}>
        <ColumnHeader
          icon='users'
          active={hasUnread}
          title={intl.formatMessage(messages.title)}
          onPin={this.handlePin}
          onMove={this.handleMove}
          onClick={this.handleHeaderClick}
          pinned={pinned}
          multiColumn={multiColumn}
        >
          <ColumnSettingsContainer />
        </ColumnHeader>

        <StatusListContainer
          trackScroll={!pinned}
          scrollKey={`community_timeline-${columnId}`}
          timelineId='community'
          loadMore={this.handleLoadMore}
          emptyMessage={<FormattedMessage id='empty_column.community' defaultMessage='The local timeline is empty. Write something publicly to get the ball rolling!' />}
        />
>>>>>>> 947887f261f74f84312327a5265553e8f16655fe
      </Column>
    );
  }

}

export default connect(mapStateToProps)(injectIntl(CommunityTimeline));
