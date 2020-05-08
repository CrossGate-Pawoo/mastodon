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
import PawooGA from '../actions/ga';
import columnComponentMap from '../column_component_map';

const columnStateKey = (columnId, locationId) => `@@columnScroll|${columnId}|${locationId}`;
const pawooGaCategory = 'ColumnHistory';

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
  multiColumn: state.getIn(['settings', 'pawoo', 'multiColumn']),
});

const mapDispatchToProps = (dispatch, props) => ({
  pushColumnHistory: (id, params) => dispatch(pushColumnHistory(props.column, id, params)),
  popColumnHistory: () => dispatch(popColumnHistory(props.column)),
});

export default @connect(mapStateToProps, mapDispatchToProps)
class ColumnContainerWithHistory extends ImmutablePureComponent {

  static contextTypes = {
    router: PropTypes.object,
  };

  static propTypes = {
    column: ImmutablePropTypes.map.isRequired,
    columnHistory: ImmutablePropTypes.stack.isRequired,
    pushColumnHistory: PropTypes.func.isRequired,
    popColumnHistory: PropTypes.func.isRequired,
    enableColumnHistory: PropTypes.bool.isRequired,
    multiColumn: PropTypes.bool,
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
      try {
        sessionStorage.removeItem(columnStateKey(columnId, locationId));
      } catch (e) {
      }
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
    const matchedId = Object.keys(columnComponentMap).find((key) => {
      if (columnComponentMap[key].match) {
        match = matchPath(path, columnComponentMap[key].match);
        return match;
      } else {
        return null;
      }
    });

    if (match) {
      PawooGA.event({ eventCategory: pawooGaCategory, eventAction: 'pushHistory', eventLabel: path });
      this.props.pushColumnHistory(matchedId, match.params);
    } else {
      this.context.router.history.push(path);
    }
  };

  popHistory = () => {
    if (this.props.enableColumnHistory) {
      PawooGA.event({ eventCategory: pawooGaCategory, eventAction: 'popHistory' });
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

  getPawooProps = () => {
    return Immutable.Map({
      collapsed: false,
      multiColumn: this.props.multiColumn,
      onCollapse: null,
      onExpand: null,
    });
  };

  getScrollContext = () => {
    return this.props.columnHistory.first().get('uuid');
  };

  renderLoading = columnId => () => {
    return columnId === 'COMPOSE' ? <DrawerLoading /> : <ColumnLoading pawoo={this.getPawooProps()} />;
  };

  renderError = (props) => {
    return <BundleColumnError {...props} />;
  };

  render() {
    const { column, columnHistory } = this.props;
    const topColumn = columnHistory.first();
    const params = topColumn.get('params', null) === null ? null : topColumn.get('params').toJS();
    const other  = params && params.other ? params.other : {};

    return (
      <BundleContainer
        fetchComponent={columnComponentMap[topColumn.get('id')].component}
        loading={this.renderLoading(column.get('id'))} error={this.renderError}
      >
        {SpecificComponent => <SpecificComponent columnId={column.get('uuid')} params={params} multiColumn pawoo={this.getPawooProps()} {...other} />}
      </BundleContainer>
    );
  }

}
