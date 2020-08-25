import React from 'react';
import ImmutablePropTypes from 'react-immutable-proptypes';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { autoPlayGif } from 'mastodon/initial_state';
import { isIOS } from 'mastodon/is_mobile';
import ga from '../actions/ga';

const gaCategory = 'SuggestedAccount';

class Item extends React.PureComponent {

  static contextTypes = {
    router: PropTypes.object,
  };

  static propTypes = {
    account: ImmutablePropTypes.map.isRequired,
    attachment: ImmutablePropTypes.map.isRequired,
    index: PropTypes.number.isRequired,
    size: PropTypes.number.isRequired,
    onOpenMedia: PropTypes.func.isRequired,
  };

  static defaultProps = {
    index: 0,
    size: 1,
  };

  handleMouseEnter = (e) => {
    if (this.hoverToPlay()) {
      e.target.play();
    }
  }

  handleMouseLeave = (e) => {
    if (this.hoverToPlay()) {
      e.target.pause();
      e.target.currentTime = 0;
    }
  }

  hoverToPlay () {
    const { attachment } = this.props;
    return !autoPlayGif && attachment.get('type') === 'gifv';
  }

  handleOpenMedia = (e) => {
    const { account, attachment, onOpenMedia } = this.props;

    ga.event({
      eventCategory: gaCategory,
      eventAction: ['video', 'audio'].includes(attachment.get('type')) ? 'OpenVideo' : 'OpenMedia',
      eventLabel: account.get('id'),
    });

    if (e.button === 0) {
      e.preventDefault();
      onOpenMedia(attachment);
    }

    e.stopPropagation();
  }

  render () {
    const { attachment, size } = this.props;

    let width  = (100 - (size - 1)) / size;
    let thumbnail = '';

    if (attachment.get('type') === 'image') {
      const previewUrl = attachment.get('preview_url');
      const previewWidth = attachment.getIn(['meta', 'small', 'width']);

      const originalUrl = attachment.get('url');
      const originalWidth = attachment.getIn(['meta', 'original', 'width']);

      const hasSize = typeof originalWidth === 'number' && typeof previewWidth === 'number';

      const srcSet = hasSize ? `${originalUrl} ${originalWidth}w, ${previewUrl} ${previewWidth}w` : null;
      const sizes = hasSize ? `(min-width: 1025px) ${320 * (width / 100)}px, ${width}vw` : null;

      thumbnail = (
        <a
          className={'media-gallery__item-thumbnail'}
          href={attachment.get('remote_url') || originalUrl}
          onClick={this.handleOpenMedia}
          target='_blank'
        >
          <img src={previewUrl} srcSet={srcSet} sizes={sizes} alt={attachment.get('description')} title={attachment.get('description')} />
        </a>
      );
    } else if (attachment.get('type') === 'gifv') {
      const autoPlay = !isIOS() && autoPlayGif;

      thumbnail = (
        <div className={classNames('media-gallery__gifv', { autoplay: autoPlay })}>
          <video
            className='media-gallery__item-gifv-thumbnail'
            aria-label={attachment.get('description')}
            role='application'
            src={attachment.get('url')}
            onClick={this.handleOpenMedia}
            onMouseEnter={this.handleMouseEnter}
            onMouseLeave={this.handleMouseLeave}
            autoPlay={autoPlay}
            loop
            muted
          />

          <span className='media-gallery__gifv__label'>GIF</span>
        </div>
      );
    } else if (attachment.get('type') === 'video') {
      const previewUrl = attachment.get('preview_url');
      const previewWidth = attachment.getIn(['meta', 'small', 'width']);

      const srcSet = `${previewUrl} ${previewWidth}w`;
      const sizes = `(min-width: 1025px) ${320 * (width / 100)}px, ${width}vw`;

      thumbnail = (
        <a
          className={'media-gallery__item-thumbnail pawoo-video-thumbnail'}
          href={attachment.get('url')}
          onClick={this.handleOpenMedia}
          target='_blank'
        >
          <img src={previewUrl} srcSet={srcSet} sizes={sizes} alt={attachment.get('description')} title={attachment.get('description')} />
          <i className='fa fa-fw fa-play-circle' />
        </a>
      );
    } else if (attachment.get('type') === 'audio') {
      thumbnail = (
        <a
          className={'media-gallery__item-thumbnail pawoo-video-thumbnail'}
          href={attachment.get('url')}
          onClick={this.handleOpenMedia}
          target='_blank'
          alt={attachment.get('description')}
          title={attachment.get('description')}
        >
          <i className='fa fa-fw fa-play-circle' />
        </a>
      );
    }

    return (
      <div
        className='media-gallery__item' key={attachment.get('id')}
      >
        {thumbnail}
      </div>
    );
  }

}

export default class SuggestedAccountMedia extends React.PureComponent {

  static propTypes = {
    account: ImmutablePropTypes.map.isRequired,
    onOpenMedia: PropTypes.func.isRequired,
  };

  render () {
    const { account, onOpenMedia } = this.props;
    const mediaAttachments = account.get('media_attachments');

    if (mediaAttachments.size === 0) {
      return null;
    }

    return (
      <div className='suggested_account_media'>
        {mediaAttachments.map((attachment, i) => (
          <Item account={account} attachment={attachment} key={attachment.get('id')} index={i} size={mediaAttachments.size} onOpenMedia={onOpenMedia} />
        ))}
      </div>
    );
  }

}
