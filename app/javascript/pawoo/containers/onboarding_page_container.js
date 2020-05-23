import PropTypes from 'prop-types';
import React from 'react';
import { FormattedMessage } from 'react-intl';
import { connect } from 'react-redux';
import SuggestedAccountsContainer from '../containers/suggested_accounts_container';
import { setPage } from '../../pawoo/actions/page';
import { me, title } from 'mastodon/initial_state';

const mapStateToProps = state => ({
  acct: state.getIn(['accounts', me, 'acct']),
  domain: state.getIn(['meta', 'domain']),
});

export default @connect(mapStateToProps)
class OnboardingPage extends React.PureComponent {

  static propTypes = {
    acct: PropTypes.string.isRequired,
    domain: PropTypes.string.isRequired,
    dispatch: PropTypes.func.isRequired,
  }

  handleClick = () => {
    this.props.dispatch(setPage('DEFAULT'));
  }

  render () {
    return (
      <article className='column landing-page pawoo-onboarding-page'>
        <h1>
          <FormattedMessage
            id='pawoo.onboarding.heading'
            defaultMessage='Welcome to {site}!'
            values={{ site: title }}
          />
        </h1>
        <p>
          <FormattedMessage
            id='onboarding.page_one.full_handle'
            defaultMessage='Your full handle'
          />
          : <code>@{this.props.acct}@{this.props.domain}</code>
        </p>
        <p>
          <FormattedMessage
            id='pawoo.onboarding.description'
            defaultMessage='{site} is connected with other servers called Mastodon instances to be part of a larger social network. This handle will be used by those on such instances. Simply {acct} may be used by others on {site}.'
            values={{
              site: title,
              acct: <code>@{this.props.acct}</code>,
            }}
          />
        </p>
        <h2>
          <FormattedMessage
            id='pawoo.onboarding.suggested_accounts.heading'
            defaultMessage='Find people'
          />
        </h2>
        <p>
          <FormattedMessage
            id='pawoo.onboarding.suggested_accounts.description'
            defaultMessage='Follow people you like. This list is also available later as "Active Accounts."'
          />
        </p>
        <div className='pawoo-onboarding-page__suggested-accounts'>
          <SuggestedAccountsContainer
            scrollKey='pawoo_onboarding_page'
            trackScroll={false}
          />
        </div>
        <h2>
          <FormattedMessage
            id='pawoo.onboarding.start.heading'
            defaultMessage='Ready to get started?'
          />
        </h2>
        <button className='button' onClick={this.handleClick}>
          <FormattedMessage
            id='pawoo.onboarding.start.description'
            defaultMessage='Get started'
          />
        </button>
      </article>
    );
  }

}
