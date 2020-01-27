import classNames from 'classnames';
import React from 'react';
import ComposeFormContainer from './containers/compose_form_container';
import NavigationContainer from './containers/navigation_container';
import PropTypes from 'prop-types';
import ImmutablePropTypes from 'react-immutable-proptypes';
import { connect } from 'react-redux';
import { mountCompose, unmountCompose } from '../../actions/compose';
import { Link } from 'react-router-dom';
import { injectIntl, defineMessages } from 'react-intl';
import SearchContainer from './containers/search_container';
import Motion from '../ui/util/optional_motion';
import spring from 'react-motion/lib/spring';
import SearchResultsContainer from './containers/search_results_container';
import { changeComposing } from '../../actions/compose';
import { setPage as pawooSetPage } from '../../../pawoo/actions/page';
import Announcements from '../../../pawoo/components/announcements';
import PawooWebTagLink from '../../../pawoo/components/web_tag_link';
import TrendTagsContainer from '../../../pawoo/containers/trend_tags_container';
import elephantUIPlane from '../../../pawoo/images/pawoo-ui.png';

const messages = defineMessages({
  start: { id: 'getting_started.heading', defaultMessage: 'Getting started' },
  home_timeline: { id: 'tabs_bar.home', defaultMessage: 'Home' },
  notifications: { id: 'tabs_bar.notifications', defaultMessage: 'Notifications' },
  suggested_accounts: { id: 'pawoo.column.suggested_accounts', defaultMessage: 'Active Users' },
  community: { id: 'navigation_bar.community_timeline', defaultMessage: 'Local timeline' },
  media: { id: 'pawoo.column.media', defaultMessage: 'Media timeline' },
  help: { id: 'pawoo.navigation_bar.help', defaultMessage: 'Help' },
});

const mapStateToProps = (state, ownProps) => ({
  columns: state.getIn(['settings', 'columns']),
  showSearch: ownProps.multiColumn ? state.getIn(['search', 'submitted']) && !state.getIn(['search', 'hidden']) : ownProps.isSearchPage,
  pawooHasUnreadNotifications: state.getIn(['notifications', 'unread']) > 0,
  pawooMultiColumn: state.getIn(['settings', 'pawoo', 'multiColumn']),
});

@connect(mapStateToProps)
@injectIntl
export default class Compose extends React.PureComponent {

  static propTypes = {
    dispatch: PropTypes.func.isRequired,
    columns: ImmutablePropTypes.list.isRequired,
    multiColumn: PropTypes.bool,
    showSearch: PropTypes.bool,
    isSearchPage: PropTypes.bool,
    intl: PropTypes.object.isRequired,
    pawooHasUnreadNotifications: PropTypes.bool,
    pawooMultiColumn: PropTypes.bool,
  };

  pawooRef = null;

  componentDidMount () {
    const { isSearchPage } = this.props;

    if (!isSearchPage) {
      this.props.dispatch(mountCompose());
    }
  }

  componentWillUnmount () {
    const { isSearchPage } = this.props;

    if (!isSearchPage) {
      this.props.dispatch(unmountCompose());
    }
  }

  onFocus = () => {
    this.props.dispatch(changeComposing(true));
  }

  onBlur = () => {
    this.props.dispatch(changeComposing(false));
  }

  pawooHandleClick = () => {
    this.props.dispatch(pawooSetPage('DEFAULT'));
  }

  pawooHandleSubmit = () => {
    if (this.pawooRef) {
      this.pawooRef.classList.remove('pawoo-extension-drawer__inner__mastodon--animation');

      // Trigger layout
      this.pawooRef.offsetWidth; // eslint-disable-line no-unused-expressions

      this.pawooRef.classList.add('pawoo-extension-drawer__inner__mastodon--animation');
    }
  };

  pawooSetRef = c => {
    this.pawooRef = c;
  };

  render () {
    const { multiColumn, showSearch, isSearchPage, intl } = this.props;

    let header = '';

    if (multiColumn) {
      const { columns, pawooHasUnreadNotifications } = this.props;
      header = (
        <nav className='drawer__header'>
          <Link to='/getting-started' className='drawer__tab' onClick={this.pawooHandleClick} title={intl.formatMessage(messages.start)} aria-label={intl.formatMessage(messages.start)}><i role='img' className='fa fa-fw fa-asterisk' /></Link>
          {!columns.some(column => column.get('id') === 'HOME') && (
            <Link to='/timelines/home' className='drawer__tab' onClick={this.pawooHandleClick} title={intl.formatMessage(messages.home_timeline)} aria-label={intl.formatMessage(messages.home_timeline)}><i role='img' className='fa fa-fw fa-home' /></Link>
          )}
          {!columns.some(column => column.get('id') === 'NOTIFICATIONS') && (
            <Link to='/notifications' className={classNames('drawer__tab', { 'pawoo-extension-drawer__tab--unread': pawooHasUnreadNotifications })} onClick={this.pawooHandleClick} title={intl.formatMessage(messages.notifications)} aria-label={intl.formatMessage(messages.notifications)}><i role='img' className='fa fa-fw fa-bell' /></Link>
          )}
          {!columns.some(column => column.get('id') === 'COMMUNITY') && (
            <Link to='/timelines/public/local' className='drawer__tab' onClick={this.pawooHandleClick} title={intl.formatMessage(messages.community)} aria-label={intl.formatMessage(messages.community)}><i role='img' className='fa fa-fw fa-users' /></Link>
          )}
          {!columns.some(column => column.get('id') === 'MEDIA') && columns.some(column => ['HOME', 'NOTIFICATIONS', 'COMMUNITY'].includes(column.get('id'))) && (
            <Link to='/timelines/public/media' className='drawer__tab' onClick={this.pawooHandleClick} title={intl.formatMessage(messages.media)} aria-label={intl.formatMessage(messages.media)}><i role='img' className='fa fa-fw fa-image' /></Link>
          )}
          <Link to='/suggested_accounts' className='drawer__tab' onClick={this.pawooHandleClick} title={intl.formatMessage(messages.suggested_accounts)} aria-label={intl.formatMessage(messages.suggested_accounts)}><i role='img' className='fa fa-fw fa-user-plus' /></Link>
          <a href='https://russelhelp.zendesk.com' target='_blank' rel='noopener' className='drawer__tab' title={intl.formatMessage(messages.help)} aria-label={intl.formatMessage(messages.help)}><i role='img' className='fa fa-fw fa-question-circle' /></a>
        </nav>
      );
    }

    return (
      <div className='drawer'>
        {header}

        {(multiColumn || isSearchPage) && <SearchContainer /> }

        <div className='drawer__pager'>
          <div className='drawer__inner' onFocus={this.onFocus}>
            <NavigationContainer onClose={this.onBlur} />
            <ComposeFormContainer pawooOnSubmit={this.pawooHandleSubmit} />

            {(!multiColumn || this.props.pawooMultiColumn) && (
              <React.Fragment>
                <div style={{ marginBottom: '10px' }}><Announcements /></div>
                <div className='drawer__block'>
                  <TrendTagsContainer Tag={PawooWebTagLink} />
                </div>
              </React.Fragment>
            )}

            {multiColumn && (
              <div className='pawoo-extension-drawer__inner__mastodon drawer__inner__mastodon'>
                <img alt='' draggable='false' ref={this.pawooSetRef} src={elephantUIPlane} />
              </div>
            )}
          </div>

          <Motion defaultStyle={{ x: isSearchPage ? 0 : -100 }} style={{ x: spring(showSearch || isSearchPage ? 0 : -100, { stiffness: 210, damping: 20 }) }}>
            {({ x }) => (
              <div className='drawer__inner darker' style={{ transform: `translateX(${x}%)`, visibility: x === -100 ? 'hidden' : 'visible' }}>
                <SearchResultsContainer />
              </div>
            )}
          </Motion>
        </div>
      </div>
    );
  }

}
