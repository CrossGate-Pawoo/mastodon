import { List as ImmutableList } from 'immutable';
import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import StatusListContainer from '../../ui/containers/status_list_container';
import { expandCommunityTimeline } from '../../../actions/timelines';
import Column from '../../../components/column';
import { injectIntl } from 'react-intl';
import { connectCommunityStream } from '../../../actions/streaming';
import initialState from '../../../initial_state';

import ColumnHeader from '../../../../pawoo/components/animated_timeline_column_header';
import pawooLogo from '../../../../pawoo/images/logo_elephant.png';

const mapStateToProps = state => ({
  pawooStatusCount: state.getIn(['timelines', 'community', 'items'], ImmutableList()).count(),
});

@connect(mapStateToProps)
@injectIntl
export default class CommunityTimelineContainer extends React.PureComponent {

  static propTypes = {
    dispatch: PropTypes.func.isRequired,
    intl: PropTypes.object.isRequired,
    pawooStatusCount: PropTypes.number.isRequired,
  };

  handleHeaderClick = () => {
    this.column.scrollTop();
  }

  setRef = c => {
    this.column = c;
  }

  componentDidMount () {
    const { dispatch } = this.props;

    dispatch(expandCommunityTimeline());
    this.disconnect = dispatch(connectCommunityStream());
  }

  componentWillUnmount () {
    if (this.disconnect) {
      this.disconnect();
      this.disconnect = null;
    }
  }

  handleLoadMore = maxId => {
    this.props.dispatch(expandCommunityTimeline({ maxId }));
  }

  render () {
    const { intl } = this.props;

    return (
      <Column ref={this.setRef}>
        <ColumnHeader
          title={(
            <div className='pawoo-extension-standalone-community'>
              <img src={pawooLogo} />
              \ {intl.formatNumber(initialState.pawoo.user_count)}人が、{intl.formatNumber(initialState.pawoo.status_count + this.props.pawooStatusCount)}回パウってます /
            </div>
          )}
          onClick={this.handleHeaderClick}
          timelineId='community'
        />

        <StatusListContainer
          timelineId='community'
          onLoadMore={this.handleLoadMore}
          scrollKey='standalone_public_timeline'
          trackScroll={false}
          pawooMediaScale='230px'
        />
      </Column>
    );
  }

}
