import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import ImmutablePropTypes from 'react-immutable-proptypes';
import { throttle } from 'lodash';
import { List as ImmutableList } from 'immutable';
import Masonry from 'react-masonry-component';
import {
  fetchGallery,
  expandGallery,
} from '../actions/galleries';
import GalleryItemContainer from './gallery_item_container';

const mapStateToProps = (state, props) => ({
  statusIds: state.getIn(['pawoo', 'galleries', props.tag, 'items'], ImmutableList()).toList(),
  hasMore: !!state.getIn(['pawoo', 'galleries', props.tag, 'next']),
  isLoading: state.getIn(['pawoo', 'galleries', props.tag, 'isLoading'], true),
});

export default @connect(mapStateToProps)
class Gallery extends React.PureComponent {

  static propTypes = {
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

    document.addEventListener('scroll', this.handleScroll);
  }

  componentWillUnmount () {
    document.removeEventListener('scroll', this.handleScroll);
  }

  handleScroll = throttle(() => {
    if (document.body.scrollHeight - window.pageYOffset - window.innerHeight < 400) {
      if (this.props.hasMore && !this.props.isLoading) {
        this.props.dispatch(expandGallery(this.props.tag));
      }
    }
  }, 300, {
    trailing: true,
  });

  render () {
    const { statusIds, tag, hasMore, isLoading } = this.props;

    let scrollableContent = null;

    if (isLoading && this.scrollableContent) {
      scrollableContent = this.scrollableContent;
    } else if (statusIds.size > 0 || hasMore) {
      scrollableContent = statusIds.map((id) => (
        <GalleryItemContainer key={id} id={id} tag={tag}  />
      ));
    } else {
      scrollableContent = null;
    }

    this.scrollableContent = scrollableContent;

    return (
      <Masonry options={{ transitionDuration: 0 }} >
        {scrollableContent}
      </Masonry>
    );
  }

}
