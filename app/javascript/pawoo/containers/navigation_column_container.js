import Immutable from 'immutable';
import PropTypes from 'prop-types';
import React from 'react';
import ImmutablePropTypes from 'react-immutable-proptypes';
import ImmutablePureComponent from 'react-immutable-pure-component';
import { defineMessages, injectIntl } from 'react-intl';
import { connect } from 'react-redux';
import TrendTagsContainer from './trend_tags_container';
import Announcements from '../components/announcements';
import WebTagLink from '../components/web_tag_link';
import columnComponentMap from '../column_component_map';
import { changeSetting } from '../../mastodon/actions/settings';
import ColumnLoading from '../../mastodon/features/ui/components/column_loading';
import BundleColumnError from '../../mastodon/features/ui/components/bundle_column_error';
import BundleContainer from '../../mastodon/features/ui/containers/bundle_container';

const mapStateToProps = state => ({
  columns: state.getIn(['settings', 'columns']).filterNot(column => column.get('id') === 'COMPOSE'),
  multiColumn: state.getIn(['settings', 'pawoo', 'multiColumn']),
  window: state.getIn(['settings', 'pawoo', 'window']),
});

const messages = defineMessages({
  expand: { id: 'pawoo.expand', defaultMessage: 'Expand' },
});

@injectIntl
class ExpandButton extends ImmutablePureComponent {

  static propTypes = {
    expanded: PropTypes.bool,
    onExpand: PropTypes.func.isRequired,
    intl: PropTypes.object.isRequired,
  };

  render () {
    return this.props.expanded || (
      <div className='pawoo-navigation-column__subcolumns__button'>
        <button onClick={this.props.onExpand}>
          <i
            aria-label={this.props.intl.formatMessage(messages.expand)}
            className='fa fa-angle-double-down'
          />
        </button>
      </div>
    );
  }

}

class Subcolumn extends ImmutablePureComponent {

  static propTypes = {
    column: ImmutablePropTypes.map.isRequired,
    onCollapse: PropTypes.func.isRequired,
    onExpand: PropTypes.func.isRequired,
    expanded: PropTypes.bool,
    multiColumn: PropTypes.bool,
  };

  getPawooProps () {
    return Immutable.Map({
      collapsed: !this.props.expanded,
      multiColumn: this.props.multiColumn,
      onCollapse: this.handleCollapse,
      onExpand: this.handleExpand,
    });
  }

  handleCollapse = () => {
    this.props.onCollapse(this.props.column.get('uuid'));
  }

  handleExpand = () => {
    this.props.onExpand(this.props.column.get('uuid'));
  }

  renderLoading = () => {
    return <ColumnLoading pawoo={this.getPawooProps()} />;
  };

  renderError = (props) => {
    return <BundleColumnError {...props} />;
  }

  render () {
    const params = this.props.column.get('params', null) === null ? null : this.props.column.get('params').toJS();

    return (
      <div className={this.props.expanded ? 'pawoo-navigation-column__subcolumns__expanded' : null}>
        <div className='pawoo-navigation-column__subcolumns__body'>
          <BundleContainer
            key={this.props.column.get('uuid')}
            fetchComponent={columnComponentMap[this.props.column.get('id')].component}
            loading={this.renderLoading}
            error={this.renderError}
          >
            {SpecificComponent => (
              <SpecificComponent
                columnId={this.props.column.get('uuid')}
                params={params}
                multiColumn
                pawoo={this.getPawooProps()}
              />
            )}
          </BundleContainer>
        </div>
        <ExpandButton expanded={this.props.expanded} onExpand={this.handleExpand} />
      </div>
    );
  }

}

class TrendTagsSubcolumn extends ImmutablePureComponent {

  static propTypes= {
    onCollapse: PropTypes.func.isRequired,
    onExpand: PropTypes.func.isRequired,
    expanded: PropTypes.bool,
  };

  handleCollapse = () => {
    this.props.onCollapse('TREND_TAGS');
  }

  handleExpand = () => {
    this.props.onExpand('TREND_TAGS');
  }

  render () {
    return (
      <div className={this.props.expanded ? 'pawoo-navigation-column__subcolumns__expanded' : null}>
        <div className='column pawoo-navigation-column__subcolumns__body'>
          <TrendTagsContainer Tag={WebTagLink} scrollable />
        </div>
        <ExpandButton expanded={this.props.expanded} onExpand={this.handleExpand} />
      </div>
    );
  }

}

export default @connect(mapStateToProps)
class NavigationColumn extends ImmutablePureComponent {

  static propTypes = {
    columns: ImmutablePropTypes.list.isRequired,
    dispatch: PropTypes.func.isRequired,
    multiColumn: PropTypes.bool,
    window: PropTypes.string,
  };

  handleCollapse = uuid => {
    if (uuid === this.props.window) {
      this.props.dispatch(changeSetting(['pawoo', 'window'], null));
    }
  }

  handleExpand = uuid => {
    this.props.dispatch(changeSetting(['pawoo', 'window'], uuid));
  }

  render () {
    return (
      <div className='pawoo-navigation-column'>
        <div className='pawoo-navigation-column__subcolumns'>
          {this.props.columns.map(column => (
            <Subcolumn
              key={column.get('uuid')}
              column={column}
              expanded={this.props.window === column.get('uuid')}
              multiColumn={this.props.multiColumn}
              onCollapse={this.handleCollapse}
              onExpand={this.handleExpand}
            />
          ))}
          <TrendTagsSubcolumn
            expanded={this.props.window === 'TREND_TAGS'}
            onCollapse={this.handleCollapse}
            onExpand={this.handleExpand}
          />
        </div>
        <div className='column' style={{ flex: '0 auto' }}>
          <Announcements />
        </div>
      </div>
    );
  }

}
