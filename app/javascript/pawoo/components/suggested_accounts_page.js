import PropTypes from 'prop-types';
import React from 'react';
import { defineMessages, injectIntl } from 'react-intl';
import Column from 'mastodon/features/ui/components/column';
import SuggestedAccountsContainer from '../containers/suggested_accounts_container';

const messages = defineMessages({
  title: { id: 'pawoo.column.suggested_accounts', defaultMessage: 'Active Users' },
});

function SuggestedAccountsPage({ intl }) {
  return (
    <Column
      icon='user'
      active={false}
      heading={intl.formatMessage(messages.title)}
      pawooClassName='pawoo-suggested-accounts-page'
    >
      <div className='pawoo-suggested-accounts-page__suggested-accounts'>
        <SuggestedAccountsContainer scrollKey='suggested_accounts_page' trackScroll={false} />
      </div>
    </Column>
  );
}

SuggestedAccountsPage.propTypes = {
  intl: PropTypes.object.isRequired,
};

export default injectIntl(SuggestedAccountsPage);
