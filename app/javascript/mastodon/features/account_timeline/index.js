import React from 'react';
import { connect } from 'react-redux';
import ImmutablePropTypes from 'react-immutable-proptypes';
import PropTypes from 'prop-types';
import { fetchAccount } from '../../actions/accounts';
import { refreshAccountTimeline, expandAccountTimeline } from '../../actions/timelines';
import { refreshPinnedStatusTimeline } from '../../../pawoo/actions/extensions/timelines';
import StatusList from '../../components/status_list';
import LoadingIndicator from '../../components/loading_indicator';
import Column from '../ui/components/column';
import HeaderContainer from './containers/header_container';
import ColumnBackButton from '../../components/column_back_button';
import { List as ImmutableList } from 'immutable';
import ImmutablePureComponent from 'react-immutable-pure-component';

const mapStateToProps = (state, props) => ({
  statusIds: state.getIn(['timelines', `account:${props.params.accountId}`, 'items'], ImmutableList()),
  isLoading: state.getIn(['timelines', `account:${props.params.accountId}`, 'isLoading']),
  hasMore: !!state.getIn(['timelines', `account:${props.params.accountId}`, 'next']),
  pinnedStatusIds: state.getIn(['timelines', `account:${props.params.accountId}:pinned_status`, 'items'], ImmutableList()),
});

@connect(mapStateToProps)
export default class AccountTimeline extends ImmutablePureComponent {

  static propTypes = {
    params: PropTypes.object.isRequired,
    dispatch: PropTypes.func.isRequired,
    statusIds: ImmutablePropTypes.list,
    isLoading: PropTypes.bool,
    hasMore: PropTypes.bool,
    pinnedStatusIds: ImmutablePropTypes.list,
  };

  componentWillMount () {
    this.props.dispatch(fetchAccount(this.props.params.accountId));
    this.props.dispatch(refreshPinnedStatusTimeline(this.props.params.accountId));
    this.props.dispatch(refreshAccountTimeline(this.props.params.accountId));
  }

  componentWillReceiveProps (nextProps) {
    if (nextProps.params.accountId !== this.props.params.accountId && nextProps.params.accountId) {
      this.props.dispatch(fetchAccount(nextProps.params.accountId));
      this.props.dispatch(refreshPinnedStatusTimeline(nextProps.params.accountId));
      this.props.dispatch(refreshAccountTimeline(nextProps.params.accountId));
    }
  }

  handleScrollToBottom = () => {
    if (!this.props.isLoading && this.props.hasMore) {
      this.props.dispatch(expandAccountTimeline(this.props.params.accountId));
    }
  }

  render () {
    const { statusIds, isLoading, hasMore, pinnedStatusIds } = this.props;

    if (!statusIds && isLoading) {
      return (
        <Column>
          <LoadingIndicator />
        </Column>
      );
    }

    const uniqueStatusIds = pinnedStatusIds.concat(statusIds).toOrderedSet().toList();

    return (
      <Column>
        <ColumnBackButton />

        <StatusList
          prepend={<HeaderContainer accountId={this.props.params.accountId} />}
          scrollKey='account_timeline'
          statusIds={uniqueStatusIds}
          isLoading={isLoading}
          hasMore={hasMore}
          onScrollToBottom={this.handleScrollToBottom}
          displayPinned
        />
      </Column>
    );
  }

}
