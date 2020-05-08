import PropTypes from 'prop-types';
import React from 'react';
import { defineMessages, injectIntl } from 'react-intl';
import { connect } from 'react-redux';
import { Link, withRouter } from 'react-router-dom';
import { setPage } from '../actions/page';
import PawooUI from '../../pawoo/images/pawoo-ui.png';
import Column from '../../mastodon/features/ui/components/column';
import ColumnBackButton from '../../mastodon/components/column_back_button';
import ColumnBackButtonSlim from '../../mastodon/components/column_back_button_slim';
import SuggestedAccountsContainer from '../containers/suggested_accounts_container';

const messages = defineMessages({
  title: { id: 'pawoo.column.suggested_accounts', defaultMessage: 'Active Users' },
  goToLocalTimeline: { id: 'pawoo.suggested_accounts.go_to_local_timeline', defaultMessage: 'Go To Local Timeline' },
});

const buttonStyle = {
  display: 'block',
  lineHeight: 0,
  padding: '25px 0',
  fontSize: '16px',
};

export default @connect()
@injectIntl
@withRouter
class SuggestedAccountsColumn extends React.PureComponent {

  static propTypes = {
    dispatch: PropTypes.func.isRequired,
    history: PropTypes.object.isRequired,
    intl: PropTypes.object.isRequired,
    multiColumn: PropTypes.bool,
  };

  componentWillMount () {
    this.props.dispatch(setPage(this.props.multiColumn ? 'SUGGESTED_ACCOUNTS' : 'DEFAULT'));
  }

  componentWillReceiveProps ({ multiColumn }) {
    this.props.dispatch(setPage(multiColumn ? 'SUGGESTED_ACCOUNTS' : 'DEFAULT'));
  }

  componentWillUnmount () {
    if (this.props.history.action === 'POP') {
      this.props.dispatch(setPage('DEFAULT'));
    }
  }

  render () {
    return this.props.multiColumn ? (
      <div className='pawoo-suggested-accounts-column--page'>
        <div className='column'><ColumnBackButton /></div>
        <img alt='' src={PawooUI} />
      </div>
    ) : (
      <Column icon='user' active={false} heading={this.props.intl.formatMessage(messages.title)}>
        <ColumnBackButtonSlim />

        <div className='pawoo-suggested-accounts-column'>
          <div>
            <SuggestedAccountsContainer scrollKey='pawoo_suggested_accounts_column' trackScroll />
          </div>
        </div>

        <Link className='button' style={buttonStyle} to='/timelines/public/local'>
          {this.props.intl.formatMessage(messages.goToLocalTimeline)}
        </Link>
      </Column>
    );
  }

}
