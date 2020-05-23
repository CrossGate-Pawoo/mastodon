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
import elephantUIPlane from '../../../images/elephant_ui_plane.svg';
import { mascot } from '../../initial_state';
import Icon from 'mastodon/components/icon';
import { setPage as pawooSetPage } from '../../../pawoo/actions/page';
import Announcements from '../../../pawoo/components/announcements';
import PawooWebTagLink from '../../../pawoo/components/web_tag_link';
import TrendTagsContainer from '../../../pawoo/containers/trend_tags_container';

const messages = defineMessages({
  start: { id: 'getting_started.heading', defaultMessage: 'Getting started' },
  home_timeline: { id: 'tabs_bar.home', defaultMessage: 'Home' },
  notifications: { id: 'tabs_bar.notifications', defaultMessage: 'Notifications' },
  suggested_accounts: { id: 'pawoo.column.suggested_accounts', defaultMessage: 'Active Users' },
  community: { id: 'navigation_bar.community_timeline', defaultMessage: 'Local timeline' },
  media: { id: 'pawoo.column.media', defaultMessage: 'Media timeline' },
  help: { id: 'pawoo.navigation_bar.help', defaultMessage: 'Help' },
  compose: { id: 'navigation_bar.compose', defaultMessage: 'Compose new toot' },
});

const mapStateToProps = (state, ownProps) => ({
  columns: state.getIn(['settings', 'columns']),
  showSearch: ownProps.multiColumn ? state.getIn(['search', 'submitted']) && !state.getIn(['search', 'hidden']) : ownProps.isSearchPage,
});

export default @connect(mapStateToProps)
@injectIntl
class Compose extends React.PureComponent {

  static propTypes = {
    dispatch: PropTypes.func.isRequired,
    columns: ImmutablePropTypes.list.isRequired,
    multiColumn: PropTypes.bool,
    showSearch: PropTypes.bool,
    isSearchPage: PropTypes.bool,
    intl: PropTypes.object.isRequired,
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
      const { columns } = this.props;
      header = (
        <nav className='drawer__header'>
          <Link to='/getting-started' className='drawer__tab' onClick={this.pawooHandleClick} title={intl.formatMessage(messages.start)} aria-label={intl.formatMessage(messages.start)}><Icon id='bars' fixedWidth /></Link>
          {!columns.some(column => column.get('id') === 'HOME') && (
            <Link to='/timelines/home' className='drawer__tab' onClick={this.pawooHandleClick} title={intl.formatMessage(messages.home_timeline)} aria-label={intl.formatMessage(messages.home_timeline)}><Icon id='home' fixedWidth /></Link>
          )}
          {!columns.some(column => column.get('id') === 'NOTIFICATIONS') && (
            <Link to='/notifications' className='drawer__tab' onClick={this.pawooHandleClick} title={intl.formatMessage(messages.notifications)} aria-label={intl.formatMessage(messages.notifications)}><Icon id='bell' fixedWidth /></Link>
          )}
          {!columns.some(column => column.get('id') === 'COMMUNITY') && (
            <Link to='/timelines/public/local' className='drawer__tab' onClick={this.pawooHandleClick} title={intl.formatMessage(messages.community)} aria-label={intl.formatMessage(messages.community)}><Icon id='users' fixedWidth /></Link>
          )}
          {!columns.some(column => column.get('id') === 'MEDIA') && columns.some(column => ['HOME', 'NOTIFICATIONS', 'COMMUNITY'].includes(column.get('id'))) && (
            <Link to='/timelines/public/media' className='drawer__tab' onClick={this.pawooHandleClick} title={intl.formatMessage(messages.media)} aria-label={intl.formatMessage(messages.media)}><Icon id='image' fixedWidth /></Link>
          )}
          <Link to='/suggested_accounts' className='drawer__tab' onClick={this.pawooHandleClick} title={intl.formatMessage(messages.suggested_accounts)} aria-label={intl.formatMessage(messages.suggested_accounts)}><Icon id='user-plus' fixedWidth /></Link>
          <a href='https://russelhelp.zendesk.com' target='_blank' rel='noopener' className='drawer__tab' title={intl.formatMessage(messages.help)} aria-label={intl.formatMessage(messages.help)}><Icon id='question-circle' fixedWidth /></a>
        </nav>
      );
    }

    return (
      <div className='drawer' role='region' aria-label={intl.formatMessage(messages.compose)}>
        {header}

        {(multiColumn || isSearchPage) && <SearchContainer /> }

        <div className='drawer__pager'>
          {!isSearchPage && <div className='drawer__inner' onFocus={this.onFocus}>
            <NavigationContainer onClose={this.onBlur} />

            <ComposeFormContainer pawooOnSubmit={this.pawooHandleSubmit} />

            <div className='pawoo-drawer-block'>
              <Announcements />
            </div>
            <div className='pawoo-drawer-block'>
              <TrendTagsContainer Tag={PawooWebTagLink} />
            </div>

            <div className='drawer__inner__mastodon'>
              <img alt='' draggable='false' ref={this.pawooSetRef} src={mascot || elephantUIPlane} />
            </div>
          </div>}

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
