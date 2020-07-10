import React from 'react';
import { defineMessages, injectIntl } from 'react-intl';
import ImmutablePropTypes from 'react-immutable-proptypes';
import PropTypes from 'prop-types';
import ImmutablePureComponent from 'react-immutable-pure-component';
import AutosuggestInput from 'mastodon/components/autosuggest_input';

const messages = defineMessages({
  hashtag_editor_placeholder: { id: 'pawoo.compose_form.hashtag_editor_placeholder', defaultMessage: 'Append tag (press enter to add)' },
});

const pawooGetHashtagWord = (value) => {
  if (!value) {
    return [null, null];
  }

  const trimmed = value.trim().replace(/#/g, '');
  if (!trimmed) {
    return [null, null];
  }

  return [1, '#' + trimmed];
};


export default @injectIntl
class HashtagEditor extends ImmutablePureComponent {

  static propTypes = {
    disabled: PropTypes.bool,
    onInsertHashtag: PropTypes.func.isRequired,
    onSuggestionsClearRequested: PropTypes.func.isRequired,
    onSuggestionsFetchRequested: PropTypes.func.isRequired,
    suggestions: ImmutablePropTypes.list,
    intl: PropTypes.object.isRequired,
  };

  state = {
    value: '',
  };

  handleChange = (e) => {
    this.setState({ value: e.target.value });
  }

  handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();

      const [, hashtag] = pawooGetHashtagWord(this.state.value);
      if (hashtag) {
        this.props.onInsertHashtag(hashtag);
        this.setState({ value: '' });
      }
    }
  }

  handleSuggestionSelected = (tokenStart, token, value) => {
    this.props.onInsertHashtag(value);
    this.setState({ value: '' });
  }

  render () {
    const { suggestions, disabled, intl } = this.props;
    const { value } = this.state;

    return (
      <div className='pawoo-hashtag-editor'>
        <AutosuggestInput
          pawooGetHashtagWord={pawooGetHashtagWord}
          placeholder={intl.formatMessage(messages.hashtag_editor_placeholder)}
          value={value}
          onChange={this.handleChange}
          onKeyDown={this.handleKeyDown}
          disabled={disabled}
          suggestions={suggestions}
          onSuggestionsFetchRequested={this.props.onSuggestionsFetchRequested}
          onSuggestionsClearRequested={this.props.onSuggestionsClearRequested}
          onSuggestionSelected={this.handleSuggestionSelected}
          className='pawoo-hastag-editor__input'
        />
        <i className='fa fa-fw fa-hashtag pawoo-hashtag-editor__icon' />
      </div>
    );
  }

}
