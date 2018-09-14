import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import ImmutablePropTypes from 'react-immutable-proptypes';
import ImmutablePureComponent from 'react-immutable-pure-component';
import Immutable from 'immutable';
import { defineMessages, injectIntl } from 'react-intl';
import { openModal } from '../../mastodon/actions/modal';
import {
  reblog,
  favourite,
  unreblog,
  unfavourite,
} from '../../mastodon/actions/interactions';
import { blacklistGallery } from '../actions/galleries';
import { makeGetStatus } from '../../mastodon/selectors';
import Permalink from '../../mastodon/components/permalink';
import Avatar from '../../mastodon/components/avatar';
import Timestamp from '../../mastodon/components/timestamp';
import DisplayName from '../../mastodon/components/display_name';
import StatusContent from '../../mastodon/components/status_content';
import IconButton from '../../mastodon/components/icon_button';
import MediaGallery from '../../mastodon/components/media_gallery';
import Video from '../../mastodon/features/video';
import { me, boostModal } from '../../mastodon/initial_state';

const messages = defineMessages({
  reblog: { id: 'status.reblog', defaultMessage: 'Boost' },
  favourite: { id: 'status.favourite', defaultMessage: 'Favourite' },
  blacklist: { id: 'pawoo.gallery.status.blacklist', defaultMessage: 'ブラックリストに追加' },
  cannot_reblog: { id: 'status.cannot_reblog', defaultMessage: 'This post cannot be boosted' },
});

const makeMapStateToProps = () => {
  const getStatus = makeGetStatus();

  const mapStateToProps = (state, props) => ({
    status: getStatus(state, props.id),
    isAdmin: state.getIn(['meta', 'is_user_admin']),
  });

  return mapStateToProps;
};

const mapDispatchToProps = (dispatch) => ({
  onModalReblog (status) {
    dispatch(reblog(status));
  },

  onReblog (status, e) {
    if (status.get('reblogged')) {
      dispatch(unreblog(status));
    } else {
      if (e.shiftKey || !boostModal) {
        this.onModalReblog(status);
      } else {
        dispatch(openModal('BOOST', { status, onReblog: this.onModalReblog }));
      }
    }
  },

  onFavourite (status) {
    if (status.get('favourited')) {
      dispatch(unfavourite(status));
    } else {
      dispatch(favourite(status));
    }
  },

  onBlacklist (tag, status) {
    dispatch(blacklistGallery(tag, status));
  },

  onOpenMedia (media, index) {
    dispatch(openModal('MEDIA', { media, index }));
  },

  onOpenVideo (media, time) {
    dispatch(openModal('VIDEO', { media, time }));
  },
});

@injectIntl
@connect(makeMapStateToProps, mapDispatchToProps)
export default class GalleryItem extends ImmutablePureComponent {

  static propTypes = {
    intl: PropTypes.object.isRequired,
    tag: PropTypes.string.isRequired,
    status: ImmutablePropTypes.map,
    isAdmin: PropTypes.bool.isRequired,
    onFavourite: PropTypes.func,
    onReblog: PropTypes.func,
    onBlacklist: PropTypes.func,
    onOpenMedia: PropTypes.func,
    onOpenVideo: PropTypes.func,
  };

  handleFavouriteClick = () => {
    this.props.onFavourite(this.props.status);
  }

  handleReblogClick = (e) => {
    this.props.onReblog(this.props.status, e);
  }

  handleBlacklistClick = () => {
    this.props.onBlacklist(this.props.tag, this.props.status);
  }

  renderMedia () {
    const { status } = this.props;
    let media = null;
    let attachments = status.get('media_attachments');

    if (attachments.size === 0 && status.getIn(['pixiv_cards'], Immutable.List()).size > 0) {
      attachments = status.get('pixiv_cards').map(card => {
        return Immutable.fromJS({
          id: Math.random().toString(),
          preview_url: card.get('image_url'),
          remote_url: '',
          text_url: card.get('url'),
          type: 'image',
          url: card.get('image_url'),
        });
      });
    }

    if (attachments.size > 0) {
      if (attachments.some(item => item.get('type') === 'unknown')) {
      } else if (attachments.getIn([0, 'type']) === 'video') {
        const video = attachments.first();

        media = (
          <Video
            preview={video.get('preview_url')}
            src={video.get('url')}
            height={229}
            inline
            sensitive={status.get('sensitive')}
            onOpenVideo={this.handleOpenVideo}
          />
        );
      } else {
        media = (
          <MediaGallery media={attachments} sensitive={status.get('sensitive')} onOpenMedia={this.props.onOpenMedia} pawooScale='100%' pawooVertical />
        );
      }
    }

    return media;
  }

  render () {
    const { status, isAdmin, intl } = this.props;
    const account = status.get('account');
    const publicStatus = ['public', 'unlisted'].includes(status.get('visibility'));
    let reblogIcon = 'retweet';

    if (status.get('visibility') === 'direct') {
      reblogIcon = 'envelope';
    } else if (status.get('visibility') === 'private') {
      reblogIcon = 'lock';
    }


    return (
      <div className='pawoo-gallery-item'>
        <div className='pawoo-gallery-item__wrapper'>
          <div className='pawoo-gallery-item__header'>
            <div className='account'>
              <Permalink key={account.get('id')} className='account__display-name' href={account.get('url')} to={`/accounts/${account.get('id')}`}>
                <div className='account__avatar-wrapper'><Avatar account={account} size={36} /></div>
                <DisplayName account={account} />
              </Permalink>
            </div>

            <a href={status.get('url')} className='status__time' target='_blank' rel='noopener'>
              <Timestamp timestamp={status.get('created_at')} />
            </a>
          </div>
          <div className='pawoo-gallery-item__body'>
            {this.renderMedia()}
          </div>
          <StatusContent status={status} onClick={this.handleClick} expanded={!status.get('hidden')} onExpandedToggle={this.handleExpandedToggle} />
          {me && (
            <div className='pawoo-gallery-item__actions'>
              <IconButton className='status__action-bar-button' disabled={!publicStatus} active={status.get('reblogged')} pressed={status.get('reblogged')} title={!publicStatus ? intl.formatMessage(messages.cannot_reblog) : intl.formatMessage(messages.reblog)} icon={reblogIcon} onClick={this.handleReblogClick} />
              <IconButton className='status__action-bar-button star-icon' animate active={status.get('favourited')} pressed={status.get('favourited')} title={intl.formatMessage(messages.favourite)} icon='star' onClick={this.handleFavouriteClick} />
              {isAdmin && (
                <IconButton className='status__action-bar-button ban-icon' title={intl.formatMessage(messages.blacklist)} icon='ban' onClick={this.handleBlacklistClick} />
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

}
