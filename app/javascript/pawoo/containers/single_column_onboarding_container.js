import PropTypes from 'prop-types';
import React from 'react';
import { FormattedMessage } from 'react-intl';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import { setPage } from '../actions/page';
import PawooUI from 'pawoo/images/pawoo-ui.png';
import { me, title } from 'mastodon/initial_state';

const mapStateToProps = state => ({
  acct: state.getIn(['accounts', me, 'acct']),
  domain: state.getIn(['meta', 'domain']),
});

export default @connect(mapStateToProps)
class SingleColumnOnboarding extends React.PureComponent {

  static propTypes = {
    acct: PropTypes.string.isRequired,
    domain: PropTypes.string.isRequired,
    dispatch: PropTypes.func.isRequired,
  };

  handleClick = () => {
    this.props.dispatch(setPage('DEFAULT'));
  };

  render () {
    return (
      <article className='column landing-page pawoo-single-column-onboarding'>
        <div className='pawoo-single-column-onboarding__text'>
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
          <Link className='button' onClick={this.handleClick} to='/suggested_accounts'>
            <FormattedMessage
              id='pawoo.onboarding.suggested_accounts.heading'
              defaultMessage='Find people'
            />
          </Link>
        </div>
        <img alt='' className='pawoo-single-column-onboarding__ui' src={PawooUI} />
      </article>
    );
  }

}
