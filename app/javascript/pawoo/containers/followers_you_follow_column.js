import React from 'react';
import ImmutablePropTypes from 'react-immutable-proptypes';
import Avatar from '../../mastodon/components/avatar';
import Permalink from '../../mastodon/components/permalink';
import ImmutablePureComponent from 'react-immutable-pure-component';
import { connect } from 'react-redux';
import { makeGetAccount } from '../../mastodon/selectors';
import ga from '../actions/ga';

const gaCategory = 'FollowersYouFollow';

const makeMapStateToProps = () => {
  const getAccount = makeGetAccount();

  const mapStateToProps = (state, props) => ({
    account: getAccount(state, props.accountId),
  });

  return mapStateToProps;
};

export default @connect(makeMapStateToProps)
class FollowersYouFollowColumn extends ImmutablePureComponent {

  static propTypes = {
    account: ImmutablePropTypes.map.isRequired,
  };

  handleAccountClick = () => {
    const { account } = this.props;

    ga.event({
      eventCategory: gaCategory,
      eventAction: 'ClickAccountIcon',
      eventLabel: account.get('id'),
    });
  }

  render() {
    const { account } = this.props;

    return (
      <div className='multi-column' title={account.get('acct')}>
        <Permalink key={account.get('id')} className='account__display-name' href={account.get('url')} to={`/accounts/${account.get('id')}`} onInterceptClick={this.handleAccountClick}>
          <div className='account__avatar-wrapper'><Avatar account={account} size={40} /></div>
        </Permalink>
      </div>
    );
  }

}
