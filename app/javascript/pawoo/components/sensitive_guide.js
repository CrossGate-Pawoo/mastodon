import React from 'react';
import PropTypes from 'prop-types';
import { injectIntl, defineMessages } from 'react-intl';

const messages = defineMessages({
  message: { id: 'pawoo.compose_form.sensitive_message', defaultMessage: '* Please mark media as sensitive if the media you are trying to post is erotic content' },
});

class SensitiveGuide extends React.PureComponent {

  static propTypes = {
    visible: PropTypes.bool,
    intl: PropTypes.object.isRequired,
  };

  render () {
    const { intl } = this.props;

    return (
      <div className='pawoo-sensitive-guide'>
        {intl.formatMessage(messages.message)}
      </div>
    );
  }

};

export default injectIntl(SensitiveGuide);
