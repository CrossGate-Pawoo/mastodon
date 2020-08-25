import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import ImmutablePropTypes from 'react-immutable-proptypes';
import { debounce } from 'lodash';
import { List as ImmutableList } from 'immutable';
import {
  fetchSuggestedAccounts,
  expandSuggestedAccounts,
} from '../actions/suggested_accounts';
import ScrollableList from 'mastodon/components/scrollable_list';
import SuggestedAccountContainer from './suggested_account_container';

const mapStateToProps = (state) => ({
  accountIds: state.getIn(['pawoo', 'suggested_accounts', 'items'], ImmutableList()),
  hasMore: !!state.getIn(['pawoo', 'suggested_accounts', 'next']),
  isLoading: state.getIn(['pawoo', 'suggested_accounts', 'isLoading'], true),
});

export default @connect(mapStateToProps)
class SuggestedAccounts extends React.PureComponent {

  static propTypes = {
    dispatch: PropTypes.func.isRequired,
    accountIds: ImmutablePropTypes.list,
    hasMore: PropTypes.bool.isRequired,
    isLoading: PropTypes.bool.isRequired,
  };

  componentDidMount () {
    const { accountIds, hasMore } = this.props;

    if (accountIds.size === 0 && !hasMore) {
      this.props.dispatch(fetchSuggestedAccounts());
    }
  }

  handleLoadMore = debounce(() => {
    this.props.dispatch(expandSuggestedAccounts());
  }, 300, { leading: true });

  render () {
    const { accountIds, hasMore, isLoading, ...props } = this.props;
    let scrollableContent = null;

    if (isLoading && this.scrollableContent) {
      scrollableContent = this.scrollableContent;
    } else if (accountIds.size > 0 || hasMore) {
      scrollableContent = accountIds.map((id) => (
        <SuggestedAccountContainer key={id} id={id} />
      ));
    } else {
      scrollableContent = null;
    }

    return (
      <div className='pawoo-suggested-accounts'>
        <ScrollableList
          {...props}
          isLoading={isLoading}
          hasMore={hasMore}
          onLoadMore={this.handleLoadMore}
        >
          {scrollableContent}
        </ScrollableList>
      </div>
    );
  }

}
