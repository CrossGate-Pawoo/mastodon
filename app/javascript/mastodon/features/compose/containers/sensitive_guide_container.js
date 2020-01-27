import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { Motion, spring } from 'react-motion';
import { injectIntl, defineMessages } from 'react-intl';

const messages = defineMessages({
  message: { id: 'pawoo.compose_form.sensitive_message', defaultMessage: 'Please be sure to click on the eye icon and set NSFW if the image you are trying to post is erotic content' },
});

const mapStateToProps = state => ({
  visible: state.getIn(['compose', 'media_attachments']).size > 0,
});

class SensitiveGuide extends React.PureComponent {

  static propTypes = {
    visible: PropTypes.bool,
    intl: PropTypes.object.isRequired,
  };

  render () {
    const { visible, intl } = this.props;

    return (
      <Motion defaultStyle={{ scale: 0.87 }} style={{ scale: spring(visible ? 1 : 0.87, { stiffness: 200, damping: 10 }) }}>
        {({ scale }) => (
          <div style={{ display: visible ? 'block' : 'none', paddingTop: 10, transform: `translateZ(0) scale(${scale})` }}>
            <div style={{ padding: 10, boxShadow: 'inset 0 0 0 1px white', borderRadius: 4 }}>
              {intl.formatMessage(messages.message)}
            </div>
          </div>
        )}
      </Motion>
    );
  }

};

export default connect(mapStateToProps)(injectIntl(SensitiveGuide));
