import React from 'react';
import { connect } from 'react-redux';
import { matchPath } from 'react-router-dom';
import PropTypes from 'prop-types';
import Immutable from 'immutable';
import ImmutablePureComponent from 'react-immutable-pure-component';
import ImmutablePropTypes from 'react-immutable-proptypes';
import ScrollBehavior from 'scroll-behavior';

import BundleContainer from '../../mastodon/features/ui/containers/bundle_container';
import ColumnLoading from '../../mastodon/features/ui/components/column_loading';
import DrawerLoading from '../../mastodon/features/ui/components/drawer_loading';
import BundleColumnError from '../../mastodon/features/ui/components/bundle_column_error';
import { pushColumnHistory, popColumnHistory } from '../actions/column_histories';

import {
  Compose,
  Notifications,
  HomeTimeline,
  CommunityTimeline,
  PublicTimeline,
  HashtagTimeline,
  FavouritedStatuses,
  ListTimeline,
  MediaTimeline,
  SuggestionTags,
  Status,
  Reblogs,
  Favourites,
} from '../../mastodon/features/ui/util/async-components';
import * as PawooComponents from '../util/async-components';

const componentMap = {
  'COMPOSE': {
    component: Compose,
    match: null,
  },
  'HOME': {
    component: HomeTimeline,
    match: { path: '/timelines/home' },
  },
  'PUBLIC': {
    component: PublicTimeline,
    match: { path: '/timelines/public' },
  },
  'COMMUNITY': {
    component: CommunityTimeline,
    match: { path: '/timelines/public/local' },
  },
  'HASHTAG': {
    component: HashtagTimeline,
    match: { path: '/timelines/tag/:id' },
  },
  'LIST': {
    component: ListTimeline,
    match: { path: '/timelines/list/:id' },
  },
  'NOTIFICATIONS': {
    component: Notifications,
    match: { path: '/notifications' },
  },
  'FAVOURITES': {
    component: FavouritedStatuses,
    match: { path: '/favourites' },
  },
  'STATUS': {
    component: Status,
    match: { path: '/statuses/:statusId', exact: true },
  },
  'STATUS_REBLOGS': {
    component: Reblogs,
    match: { path: '/statuses/:statusId/reblogs' },
  },
  'STATUS_FAVOURITES': {
    component: Favourites,
    match: { path: '/statuses/:statusId/favourites' },
  },
  'MEDIA': {
    component: MediaTimeline,
    match: { path: '/timelines/public/media' },
  },
  'SUGGESTION_TAGS': {
    component: SuggestionTags,
    match: null,
  },
  'PAWOO_ONBOARDING': {
    component: PawooComponents.OnboardingPageContainer,
    match: null,
  },
  'PAWOO_SUGGESTED_ACCOUNTS': {
    component: PawooComponents.SuggestedAccountsPage,
    match: null,
  },
};

const columnStateKey = (columnId, locationId) => `@@columnScroll|${columnId}|${locationId}`;

class ColumnStateStorage {

  constructor(columnId) {
    this.columnId = columnId;
  }

  read(location) {
    const stateKey = this.getStateKey(location);
    const value = sessionStorage.getItem(stateKey);
    return JSON.parse(value);
  }

  save(location, key, value) {
    const stateKey = this.getStateKey(location);
    const storedValue = JSON.stringify(value);
    try {
      sessionStorage.setItem(stateKey, storedValue);
    } catch (e) {
      // [webkit-dev] DOM Storage and private browsing
      // https://lists.webkit.org/pipermail/webkit-dev/2009-May/007788.html
    }
  }

  getStateKey(location) {
    return columnStateKey(this.columnId, location.get('uuid'));
  }

}

const mapStateToProps = (state, props) => ({
  columnHistory: state.getIn(['pawoo', 'column_histories', props.column.get('uuid')], Immutable.Stack([props.column])),
  enableColumnHistory: state.getIn(['pawoo', 'page']) === 'DEFAULT',
});

const mapDispatchToProps = (dispatch, props) => ({
  pushColumnHistory: (id, params) => dispatch(pushColumnHistory(props.column, id, params)),
  popColumnHistory: () => dispatch(popColumnHistory(props.column)),
});

@connect(mapStateToProps, mapDispatchToProps)
export default class ColumnContainerWithHistory extends ImmutablePureComponent {

  static contextTypes = {
    router: PropTypes.object,
  };

  static propTypes = {
    column: ImmutablePropTypes.map.isRequired,
    columnHistory: ImmutablePropTypes.stack.isRequired,
    pushColumnHistory: PropTypes.func.isRequired,
    popColumnHistory: PropTypes.func.isRequired,
    enableColumnHistory: PropTypes.bool.isRequired,
  };

  static childContextTypes = {
    pawooIsColumnWithHistory: PropTypes.bool,
    pawooColumnLocationKey: PropTypes.string,
    pawooPushHistory: PropTypes.func,
    pawooPopHistory: PropTypes.func,
    scrollBehavior: PropTypes.object,
  };

  transitionHook = null;

  constructor(props, context) {
    super(props, context);

    this.scrollBehavior = new ScrollBehavior({
      addTransitionHook: this.handleHook,
      stateStorage: new ColumnStateStorage(this.props.column.get('uuid')),
      getCurrentLocation: () => this.props.columnHistory.first(),
      shouldUpdateScroll: this.shouldUpdateScroll,
    });

    this.scrollBehavior.updateScroll(null, this.props.columnHistory.first());
  }

  getChildContext() {
    return ({
      pawooIsColumnWithHistory: this.props.enableColumnHistory,
      pawooColumnLocationKey: this.props.columnHistory.first().get('uuid'),
      pawooPushHistory: this.pushHistory,
      pawooPopHistory: this.popHistory,
      scrollBehavior: this,
    });
  }

  componentWillUpdate(nextProps) {
    if (this.props.columnHistory.first().get('uuid') !== nextProps.columnHistory.first().get('uuid') && this.transitionHook) {
      this.transitionHook();
    }
  }

  componentDidUpdate(prevProps) {
    const prevScrollContext = prevProps.columnHistory.first().get('uuid');

    if (prevScrollContext === this.getScrollContext()) return;
    if (this.props.columnHistory.size < prevProps.columnHistory.size) {
      const columnId = this.props.column.get('uuid');
      const locationId = prevProps.columnHistory.first().get('uuid');
      sessionStorage.removeItem(columnStateKey(columnId, locationId));
    }

    this.scrollBehavior.updateScroll(prevScrollContext, this.getScrollContext());
  }

  componentWillUnmount() {
    this.scrollBehavior.stop();
  }

  pushHistory = (path, newColumn = false) => {
    if (newColumn || !this.props.enableColumnHistory) {
      this.context.router.history.push(path);
      return;
    }

    let match = null;
    const matchedId = Object.keys(componentMap).find((key) => {
      if (componentMap[key].match) {
        match = matchPath(path, componentMap[key].match);
        return match;
      } else {
        return null;
      }
    });

    if (match) {
      this.props.pushColumnHistory(matchedId, match.params);
    } else {
      this.context.router.history.push(path);
    }
  };

  popHistory = () => {
    if (this.props.enableColumnHistory) {
      this.props.popColumnHistory();
    } else if (window.history && window.history.length === 1) {
      this.context.router.history.push('/');
    } else {
      this.context.router.history.goBack();
    }
  }

  handleHook = (callback) => {
    this.transitionHook = callback;
    return () => {
      this.transitionHook = null;
    };
  };

  shouldUpdateScroll = () => {
    return true;
  };

  registerElement = (key, element, shouldUpdateScroll) => {
    this.scrollBehavior.registerElement(
      key, element, shouldUpdateScroll, this.getScrollContext(),
    );
  };

  unregisterElement = (key) => {
    this.scrollBehavior.unregisterElement(key);
  };

  getScrollContext = () => {
    return this.props.columnHistory.first().get('uuid');
  };

  renderLoading = columnId => () => {
    return columnId === 'COMPOSE' ? <DrawerLoading /> : <ColumnLoading />;
  };

  renderError = (props) => {
    return <BundleColumnError {...props} />;
  };

  render() {
    const { column, columnHistory } = this.props;
    const topColumn = columnHistory.first();
    const params = topColumn.get('params', null) === null ? null : topColumn.get('params').toJS();
    return (
      <BundleContainer
        fetchComponent={componentMap[topColumn.get('id')].component}
        loading={this.renderLoading(column.get('id'))} error={this.renderError}
      >
        {SpecificComponent => <SpecificComponent columnId={column.get('uuid')} params={params} multiColumn />}
      </BundleContainer>
    );
  }

}
