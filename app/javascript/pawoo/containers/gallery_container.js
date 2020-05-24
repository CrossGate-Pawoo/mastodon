import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import ImmutablePropTypes from 'react-immutable-proptypes';
import { debounce } from 'lodash';
import { List as ImmutableList } from 'immutable';
import Masonry from 'react-masonry-infinite';
import { defineMessages, injectIntl } from 'react-intl';
import {
  fetchGallery,
  expandGallery,
} from '../actions/galleries';
import DetailedStatusContainer from 'mastodon/features/status/containers/detailed_status_container';
import LoadingIndicator from 'mastodon/components/loading_indicator';
import IconButton from 'mastodon/components/icon_button';
import { isStaff } from 'mastodon/initial_state';
import { blacklistGallery } from '../actions/galleries';

const messages = defineMessages({
  blacklist: { id: 'pawoo.gallery.status.blacklist', defaultMessage: 'ブラックリストに追加' },
});

const mapStateToProps = (state, props) => ({
  statusIds: state.getIn(['pawoo', 'galleries', props.tag, 'items'], ImmutableList()).toList(),
  hasMore: !!state.getIn(['pawoo', 'galleries', props.tag, 'next']),
  isLoading: state.getIn(['pawoo', 'galleries', props.tag, 'isLoading'], true),
});

export default @connect(mapStateToProps)
@injectIntl
class Gallery extends React.PureComponent {

  static propTypes = {
    intl: PropTypes.object.isRequired,
    dispatch: PropTypes.func.isRequired,
    tag: PropTypes.string.isRequired,
    statusIds: ImmutablePropTypes.list,
    hasMore: PropTypes.bool.isRequired,
    isLoading: PropTypes.bool.isRequired,
  };

  componentDidMount () {
    const { tag, statusIds, hasMore } = this.props;

    if (statusIds.size === 0 && !hasMore) {
      this.props.dispatch(fetchGallery(tag));
    }
  }

  handleLoadMore = () => {
    const { dispatch, tag, isLoading } = this.props;

    if (isLoading) {
      return;
    }

    dispatch(expandGallery(tag));
  }

  setRef = c => {
    this.masonry = c;
  }

  handleHeightChange = debounce(() => {
    if (!this.masonry) {
      return;
    }

    this.masonry.forcePack();
  }, 50)

  createHandleBlacklistClick = (statusId) => {
    const { dispatch, tag } = this.props;

    return () => dispatch(blacklistGallery(tag, statusId));
  }

  render () {
    const { statusIds, hasMore, isLoading, intl } = this.props;

    const sizes = [
      { columns: 1, gutter: 0 },
      { mq: '415px', columns: 1, gutter: 10 },
      { mq: '640px', columns: 2, gutter: 10 },
      { mq: '960px', columns: 3, gutter: 10 },
      { mq: '1255px', columns: 3, gutter: 10 },
    ];

    const loader = (isLoading && statusIds.isEmpty()) ? <LoadingIndicator key={0} /> : undefined;

    return (
      <Masonry ref={this.setRef} className='statuses-grid' hasMore={hasMore} loadMore={this.handleLoadMore} sizes={sizes} loader={loader}>
        {statusIds.map(statusId => (
          <div className='statuses-grid__item' key={statusId}>
            <DetailedStatusContainer
              id={statusId}
              compact
              measureHeight
              onHeightChange={this.handleHeightChange}
              pawooMediaScale='100%'
            />
            {isStaff && (
              <IconButton className='pawoo-blacklist-icon' size={14} title={intl.formatMessage(messages.blacklist)} icon='ban' onClick={this.createHandleBlacklistClick(statusId)} />
            )}
          </div>
        )).toArray()}
      </Masonry>
    );
  }

}
