import classNames from 'classnames';
import React from 'react';
import ImmutablePropTypes from 'react-immutable-proptypes';
import PropTypes from 'prop-types';
import { defineMessages, injectIntl } from 'react-intl';

const messages = defineMessages({
  title: { id: 'pawoo.trend_tags.title', defaultMessage: 'Suggested tag' },
});

export default @injectIntl
class TrendTagsSection extends React.PureComponent {

  static propTypes = {
    Tag: PropTypes.func.isRequired,
    scrollable: PropTypes.bool,
    tags: ImmutablePropTypes.list.isRequired,
    refreshTrendTags: PropTypes.func,
    insertTagCompose: PropTypes.func,
    intl: PropTypes.object.isRequired,
  };

  componentDidMount () {
    if (this.props.refreshTrendTags) {
      this.props.refreshTrendTags();
      this.interval = setInterval(() => {
        this.props.refreshTrendTags();
      }, 1000 * 60 * 20);
    }
  }

  componentWillUnmount () {
    clearInterval(this.interval);
  }

  handleToggleClick = (e) => {
    const tag = e.currentTarget.getAttribute('data-tag');
    this.props.insertTagCompose(`#${tag}`);
  }

  render () {
    if (this.props.tags.size === 0) {
      return null;
    }

    const { intl, scrollable, Tag, tags, insertTagCompose } = this.props;
    return (
      <div className='trend-tags'>
        <div className='pawoo-subcolumn__header'>
          <i className='fa fa-line-chart pawoo-subcolumn__header__icon' aria-hidden='true' />
          <div className='pawoo-subcolumn__header__name'>
            {intl.formatMessage(messages.title)}
          </div>
        </div>
        <div className={classNames('suggestion-tags__body', { scrollable })} style={{ contain: 'none' }}>
          <ul>
            {tags.map(tag => (
              <li key={tag.get('name')}>
                <div className='suggestion-tags__content'>
                  <div className='suggestion-tags__name'>
                    <Tag tag={tag} />
                  </div>
                  <div className={`suggestion-tags__description ${tag.get('type') === 'suggestion' ? 'suggestion' : ''}`}>{tag.get('description')}</div>
                </div>
                {insertTagCompose && <button className='suggestion-tags__button' data-tag={tag.get('name')} onClick={this.handleToggleClick}><i className='fa fa-pencil' /></button>}
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  }

};
