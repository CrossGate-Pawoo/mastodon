import React from 'react';
import PropTypes from 'prop-types';
import ImmutablePropTypes from 'react-immutable-proptypes';
import Toggle from 'react-toggle';
import Immutable, { Set as ImmutableSet } from 'immutable';
import { connect } from 'react-redux';
import noop from 'lodash/noop';
import StatusContent from 'mastodon/components/status_content';
import { MediaGallery, Video } from 'mastodon/features/ui/util/async-components';
import Bundle from 'mastodon/features/ui/components/bundle';
import { toggleStatusReport } from '../actions/reports';

const mapStateToProps = (state, { id }) => ({
  status: state.getIn(['statuses', id]),
  checked: state.getIn(['pawoo', 'reports', 'new', 'status_ids'], ImmutableSet()).includes(id),
});

const mapDispatchToProps = (dispatch, { id }) => ({

  onToggle (e) {
    dispatch(toggleStatusReport(id, e.target.checked));
  },

});

export default @connect(mapStateToProps, mapDispatchToProps)
class StatusCheckBox extends React.PureComponent {

  static propTypes = {
    status: ImmutablePropTypes.map.isRequired,
    checked: PropTypes.bool,
    onToggle: PropTypes.func.isRequired,
    disabled: PropTypes.bool,
  };

  render () {
    const { status, checked, onToggle, disabled } = this.props;
    let media;

    if (status.get('reblog')) {
      return null;
    }

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

      } else if (attachments.first().get('type') === 'video') {
        const video = attachments.first();

        media = (
          <Bundle fetchComponent={Video} loading={this.renderLoadingVideoPlayer} >
            {Component => (
              <Component
                preview={video.get('preview_url')}
                src={video.get('url')}
                height={200}
                sensitive={status.get('sensitive')}
                onOpenVideo={noop}
              />
            )}
          </Bundle>
        );
      } else {
        media = (
          <Bundle fetchComponent={MediaGallery} loading={this.renderLoadingMediaGallery} >
            {Component => <Component media={attachments} sensitive={status.get('sensitive')} pawooScale='200px' onOpenMedia={noop} />}
          </Bundle>
        );
      }
    }


    return (
      <div className='status-check-box'>
        <div className='pawoo__status-check-box__status'>
          <StatusContent status={status} />
          {media}
        </div>

        <div className='status-check-box-toggle'>
          <Toggle checked={checked} onChange={onToggle} disabled={disabled} />
        </div>
      </div>
    );
  }

}
