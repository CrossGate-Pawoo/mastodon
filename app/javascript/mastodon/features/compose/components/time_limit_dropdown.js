import React from 'react';
import PropTypes from 'prop-types';
import { injectIntl, defineMessages } from 'react-intl';
import IconButton from '../../../components/icon_button';
import Overlay from 'react-overlays/lib/Overlay';
import Motion from '../../ui/util/optional_motion';
import spring from 'react-motion/lib/spring';
import detectPassiveEvents from 'detect-passive-events';
import classNames from 'classnames';

const messages = defineMessages({
  days: { id: 'pawoo.time_limit.days', defaultMessage: '{days, number} {days, plural, one {day} other {days}} later' },
  hours: { id: 'pawoo.time_limit.hours', defaultMessage: '{hours, number} {hours, plural, one {hour} other {hours}} later' },
  minutes: { id: 'pawoo.time_limit.minutes', defaultMessage: '{minutes, number} {minutes, plural, one {minute} other {minutes}} later' },
  select_time_limit: { id: 'pawoo.time_limit.select_time_limit', defaultMessage: 'Specify the time of automatic disappearance (Beta)' },
  time_limit_note: { id: 'pawoo.time_limit.time_limit_note', defaultMessage: 'Note: If specified, it will not be delivered to external instances.' },
});

const listenerOptions = detectPassiveEvents.hasSupport ? { passive: true } : false;

@injectIntl
class TimeLimitHeader extends React.PureComponent {

  static propTypes = {
    intl: PropTypes.object.isRequired,
  };

  render () {
    const { intl } = this.props;

    return (
      <div className='time-limit-dropdown__header'>
        <strong>{intl.formatMessage(messages.select_time_limit)}</strong>
        <div className='time-limit-dropdown__header_note'>
          <strong>{intl.formatMessage(messages.time_limit_note)}</strong>
        </div>
      </div>
    );
  }

}


class TimeLimitDropdownMenu extends React.PureComponent {

  static propTypes = {
    style: PropTypes.object,
    items: PropTypes.array.isRequired,
    onClose: PropTypes.func.isRequired,
    onChange: PropTypes.func.isRequired,
  };

  handleDocumentClick = e => {
    if (this.node && !this.node.contains(e.target)) {
      this.props.onClose();
    }
  }

  handleClick = e => {
    if (e.key === 'Escape') {
      this.props.onClose();
    } else if (!e.key || e.key === 'Enter') {
      const value = e.currentTarget.getAttribute('data-value');

      e.preventDefault();

      this.props.onClose();
      this.props.onChange(value);
    }
  }

  componentDidMount () {
    document.addEventListener('click', this.handleDocumentClick, false);
    document.addEventListener('touchend', this.handleDocumentClick, listenerOptions);
  }

  componentWillUnmount () {
    document.removeEventListener('click', this.handleDocumentClick, false);
    document.removeEventListener('touchend', this.handleDocumentClick, listenerOptions);
  }

  setRef = c => {
    this.node = c;
  }

  render () {
    const { style, items } = this.props;

    return (
      <Motion defaultStyle={{ opacity: 0, scaleX: 0.85, scaleY: 0.75 }} style={{ opacity: spring(1, { damping: 35, stiffness: 400 }), scaleX: spring(1, { damping: 35, stiffness: 400 }), scaleY: spring(1, { damping: 35, stiffness: 400 }) }}>
        {({ opacity, scaleX, scaleY }) => (
          <div className='time-limit-dropdown__dropdown' style={{ ...style, opacity: opacity, transform: `scale(${scaleX}, ${scaleY})` }} ref={this.setRef}>
            <TimeLimitHeader />
            <div className='time-limit-dropdown__options'>
              {items.map(item => (
                <div role='button' tabIndex='0' key={item.value} data-value={item.value} onKeyDown={this.handleClick} onClick={this.handleClick} className='time-limit-dropdown__option'>
                  <div className='time-limit-dropdown__option__content'>
                    <strong>{item.text}</strong>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Motion>
    );
  }

}

@injectIntl
export default class TimeLimitDropdown extends React.PureComponent {

  static propTypes = {
    isUserTouching: PropTypes.func,
    isModalOpen: PropTypes.bool.isRequired,
    onModalOpen: PropTypes.func,
    onModalClose: PropTypes.func,
    onSelectTimeLimit: PropTypes.func.isRequired,
    intl: PropTypes.object.isRequired,
  };

  state = {
    open: false,
  };

  handleToggle = () => {
    if (this.props.isUserTouching()) {
      if (this.state.open) {
        this.props.onModalClose();
      } else {
        this.props.onModalOpen({
          header: <TimeLimitHeader />,
          actions: this.options,
          onClick: this.handleModalActionClick,
        });
      }
    } else {
      this.setState({ open: !this.state.open });
    }
  }

  handleModalActionClick = (e) => {
    e.preventDefault();

    const { value } = this.options[e.currentTarget.getAttribute('data-index')];

    this.props.onModalClose();
    this.props.onSelectTimeLimit(value);
  }

  handleKeyDown = e => {
    switch(e.key) {
    case 'Enter':
      this.handleToggle();
      break;
    case 'Escape':
      this.handleClose();
      break;
    }
  }

  handleClose = () => {
    this.setState({ open: false });
  }

  handleChange = value => {
    this.props.onSelectTimeLimit(value);
  }

  componentWillMount () {
    const { intl: { formatMessage } } = this.props;

    this.options = [
      { value: '#exp1m', text: formatMessage(messages.minutes, { minutes: 1 }) },
      { value: '#exp10m', text: formatMessage(messages.minutes, { minutes: 10 }) },
      { value: '#exp1h', text: formatMessage(messages.hours, { hours: 1 }) },
      { value: '#exp12h', text: formatMessage(messages.hours, { hours: 12 }) },
      { value: '#exp1d', text: formatMessage(messages.days, { days: 1 }) },
      { value: '#exp7d', text: formatMessage(messages.days, { days: 7 }) },
    ];

  }

  render () {
    const { intl } = this.props;
    const { open } = this.state;

    return (
      <div className={classNames('time-limit-dropdown', { active: open })} onKeyDown={this.handleKeyDown}>
        <div className='time-limit-dropdown__value'>
          <IconButton
            className='time-limit-dropdown__value-icon'
            icon='clock-o'
            title={intl.formatMessage(messages.select_time_limit)}
            size={24}
            expanded={open}
            active={open}
            inverted
            onClick={this.handleToggle}
            style={{ height: null, lineHeight: '27px' }}
          />
        </div>

        <Overlay show={open} placement='bottom' target={this}>
          <TimeLimitDropdownMenu
            items={this.options}
            onClose={this.handleClose}
            onChange={this.handleChange}
          />
        </Overlay>
      </div>
    );
  }

}
