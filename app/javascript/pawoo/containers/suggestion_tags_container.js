import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import ImmutablePropTypes from 'react-immutable-proptypes';
import Link from 'react-router-dom/Link';
import { refreshSuggestionTags } from 'pawoo/actions/suggestion_tags';
import { ScrollContainer } from 'react-router-scroll-4';
import { defineMessages, injectIntl } from 'react-intl';
import Column from 'mastodon/components/column';
import ColumnHeader from 'mastodon/components/column_header';
import ColumnBackButton from 'mastodon/components/column_back_button';
import MissingIndicator from 'mastodon/components/missing_indicator';
import { addColumn, removeColumn, moveColumn } from 'mastodon/actions/columns';
import { insertTagCompose } from 'pawoo/actions/extensions/compose';


const mapStateToProps = (state, props) => ({
  tags: state.getIn(['pawoo', 'suggestion_tags', props.params.type]),
});

const messages = defineMessages({
  normal: { id: 'pawoo.suggestion_tags.normal', defaultMessage: 'Suggested tags' },
  comiket: { id: 'pawoo.suggestion_tags.comiket', defaultMessage: 'Comiket tags' },
});

class SuggestionTags extends React.PureComponent {

  static propTypes = {
    intl: PropTypes.object.isRequired,
    dispatch: PropTypes.func.isRequired,
    tags: ImmutablePropTypes.list,
    columnId: PropTypes.string,
    multiColumn: PropTypes.bool,
    params: PropTypes.object.isRequired,
  };

  componentDidMount () {
    this.startPolling();
  }

  componentDidUpdate (prevProps) {
    if (prevProps.params.type !== this.props.params.type) {
      this.startPolling();
    }
  }

  componentWillUnmount () {
    clearInterval(this.interval);
  }

  handlePin = () => {
    const { columnId, dispatch, params } = this.props;

    if (columnId) {
      dispatch(removeColumn(columnId));
    } else {
      dispatch(addColumn('SUGGESTION_TAGS', { type: params.type }));
    }
  }

  handleMove = (dir) => {
    const { columnId, dispatch } = this.props;
    dispatch(moveColumn(columnId, dir));
  }

  handleHeaderClick = () => {
    this.column.scrollTop();
  }

  handleButtonClick = (e) => {
    const tag = e.currentTarget.getAttribute('data-tag');
    this.props.dispatch(insertTagCompose(`#${tag}`));
  }

  startPolling () {
    const { params, dispatch } = this.props;

    if (this.interval) {
      clearInterval(this.interval);
    }

    if (messages[params.type]) {
      dispatch(refreshSuggestionTags(params.type));
      this.interval = setInterval(() => {
        dispatch(refreshSuggestionTags(params.type));
      }, 1000 * 60 * 60);
    }
  }

  setRef = c => {
    this.column = c;
  }

  render () {
    const { intl, columnId, multiColumn, params, tags } = this.props;
    const pinned = !!columnId;
    const message = messages[params.type];

    if (!message) {
      return (
        <Column>
          <ColumnBackButton />
          <MissingIndicator />
        </Column>
      );
    }

    return (
      <Column ref={this.setRef}>
        <ColumnHeader
          icon='tag'
          active={false}
          title={intl.formatMessage(message)}
          onPin={this.handlePin}
          onMove={this.handleMove}
          onClick={this.handleHeaderClick}
          pinned={pinned}
          multiColumn={multiColumn}
        />

        <ScrollContainer scrollKey={`suggestion_tags-${columnId}`}>
          <div className='scrollable suggestion-tags__body'>
            <ul>
              {tags && tags.map(tag => (
                <li key={tag.get('name')}>
                  <div className='suggestion-tags__content'>
                    <Link className='suggestion-tags__name' to={`/timelines/tag/${tag.get('name')}`}>
                      #{tag.get('name')}
                    </Link>
                    <div className='suggestion-tags__description suggestion'>{tag.get('description')}</div>
                  </div>
                  <button className='suggestion-tags__button' data-tag={tag.get('name')} onClick={this.handleButtonClick}><i className='fa fa-pencil' /></button>
                </li>
              ))}
            </ul>
          </div>
        </ScrollContainer>
      </Column>
    );
  }

}

export default connect(mapStateToProps)(injectIntl(SuggestionTags));
