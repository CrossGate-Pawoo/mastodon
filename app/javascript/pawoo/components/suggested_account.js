import React from 'react';
import ImmutablePropTypes from 'react-immutable-proptypes';
import PropTypes from 'prop-types';
import Avatar from 'mastodon/components/avatar';
import DisplayName from 'mastodon/components/display_name';
import Permalink from 'mastodon/components/permalink';
import IconButton from 'mastodon/components/icon_button';
import { defineMessages, injectIntl } from 'react-intl';
import { me } from 'mastodon/initial_state';
import SuggestedAccountMedia from './suggested_account_media';
import ga from '../actions/ga';

const gaCategory = 'SuggestedAccount';

const messages = defineMessages({
  follow: { id: 'account.follow', defaultMessage: 'Follow' },
  unfollow: { id: 'account.unfollow', defaultMessage: 'Unfollow' },
  requested: { id: 'account.requested', defaultMessage: 'Awaiting approval' },
  unblock: { id: 'account.unblock', defaultMessage: 'Unblock @{name}' },
  unmute: { id: 'account.unmute', defaultMessage: 'Unmute @{name}' },
});

export default @injectIntl
class SuggestedAccount extends React.PureComponent {

  static propTypes = {
    account: ImmutablePropTypes.map.isRequired,
    onFollow: PropTypes.func,
    onOpenMedia: PropTypes.func.isRequired,
    intl: PropTypes.object.isRequired,
    target: PropTypes.string,
  };

  handleFollow = () => {
    this.props.onFollow(this.props.account);
  }

  handleAccountClick = () => {
    const { account } = this.props;

    ga.event({
      eventCategory: gaCategory,
      eventAction: 'ClickAccount',
      eventLabel: account.get('id'),
    });
  }

  renderLoadingMediaGallery = () => {
    return <div className='media_gallery' style={{ height: 132 }} />;
  }

  renderLoadingVideoPlayer = () => {
    return <div className='media-spoiler-video' style={{ height: 132 }} />;
  }

  render () {
    const { account, onOpenMedia, intl, target, onFollow } = this.props;

    if (!account) {
      return <div />;
    }

    let buttons;

    if (account.get('id') !== me && account.get('relationship', null) !== null) {
      const following = account.getIn(['relationship', 'following']);
      const requested = account.getIn(['relationship', 'requested']);
      const blocking  = account.getIn(['relationship', 'blocking']);
      const muting  = account.getIn(['relationship', 'muting']);

      // NOTE: blocking/mutingはそもそもロードされないはず
      if (requested) {
        buttons = onFollow && <IconButton active icon='hourglass' title={intl.formatMessage(messages.requested)} onClick={this.handleFollow} />;
      } else if (blocking) {
        buttons = <IconButton active icon='unlock-alt' title={intl.formatMessage(messages.unblock, { name: account.get('username') })} onClick={this.handleBlock} />;
      } else if (muting) {
        buttons = <IconButton active icon='volume-up' title={intl.formatMessage(messages.unmute, { name: account.get('username') })} onClick={this.handleMute} />;
      } else {
        buttons = onFollow && <IconButton icon={following ? 'user-times' : 'user-plus'} title={intl.formatMessage(following ? messages.unfollow : messages.follow)} onClick={this.handleFollow} active={following} />;
      }
    }

    return (
      <div className='account suggested_account'>
        <div className='account__wrapper'>
          <Permalink key={account.get('id')} className='account__display-name' href={account.get('url')} to={`/accounts/${account.get('id')}`} target={target} onInterceptClick={this.handleAccountClick}>
            <div className='account__avatar-wrapper'><Avatar account={account} size={36} /></div>
            <DisplayName account={account} />
          </Permalink>

          <div className='account__relationship'>
            {buttons}
          </div>
        </div>

        <SuggestedAccountMedia account={account} onOpenMedia={onOpenMedia} />
      </div>
    );
  }

}
