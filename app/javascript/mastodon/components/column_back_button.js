import React from 'react';
import { FormattedMessage } from 'react-intl';
import PropTypes from 'prop-types';
import Icon from 'mastodon/components/icon';

export default class ColumnBackButton extends React.PureComponent {

  static contextTypes = {
    router: PropTypes.object,
    pawooPopHistory: PropTypes.func,
  };

  handleClick = () => {
    this.context.pawooPopHistory();
  }

  render () {
    return (
      <button onClick={this.handleClick} className='column-back-button'>
        <Icon id='chevron-left' className='column-back-button__icon' fixedWidth />
        <FormattedMessage id='column_back_button.label' defaultMessage='Back' />
      </button>
    );
  }

}
