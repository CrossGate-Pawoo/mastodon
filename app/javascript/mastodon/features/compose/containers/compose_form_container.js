import { connect } from 'react-redux';
import ComposeForm from '../components/compose_form';
import {
  changeCompose,
  submitCompose,
  clearComposeSuggestions,
  fetchComposeSuggestions,
  selectComposeSuggestion,
  changeComposeSpoilerText,
  insertEmojiCompose,
  uploadCompose,
} from '../../../actions/compose';
import {
  insertTagCompose,
} from '../../../../pawoo/actions/extensions/compose';
import { requestImageCache } from '../../../../pawoo/actions/pixiv_twitter_images';
import PawooGA from '../../../../pawoo/actions/ga';

const pawooGaCategory = 'Compose';

const mapStateToProps = state => ({
  text: state.getIn(['compose', 'text']),
  suggestions: state.getIn(['compose', 'suggestions']),
  spoiler: state.getIn(['compose', 'spoiler']),
  spoilerText: state.getIn(['compose', 'spoiler_text']),
  privacy: state.getIn(['compose', 'privacy']),
  focusDate: state.getIn(['compose', 'focusDate']),
  caretPosition: state.getIn(['compose', 'caretPosition']),
  preselectDate: state.getIn(['compose', 'preselectDate']),
  isSubmitting: state.getIn(['compose', 'is_submitting']),
  isChangingUpload: state.getIn(['compose', 'is_changing_upload']),
  isUploading: state.getIn(['compose', 'is_uploading']),
  showSearch: state.getIn(['search', 'submitted']) && !state.getIn(['search', 'hidden']),
  anyMedia: state.getIn(['compose', 'media_attachments']).size > 0,
  pawooKeepCaretPosition: state.getIn(['compose', 'pawooKeepCaretPosition']),
});

const mapDispatchToProps = (dispatch, { pawooOnSubmit }) => ({

  onChange (text) {
    dispatch(changeCompose(text));
    const pattern = /(https?:\/\/www\.pixiv\.net\/(((?:member_illust|novel\/show)\.php[^\n\s]+)|(en\/)?(artworks\/\d+)))/gm;
    if (pattern.test(text)) {
      text.match(pattern).forEach(url => {
        dispatch(requestImageCache(url));
      });
    }
  },

  onSubmit (router) {
    dispatch(submitCompose(router));

    if (pawooOnSubmit) {
      pawooOnSubmit();
    }
  },

  onClearSuggestions () {
    dispatch(clearComposeSuggestions());
  },

  onFetchSuggestions (token) {
    dispatch(fetchComposeSuggestions(token));
  },

  onSuggestionSelected (position, token, suggestion, path) {
    dispatch(selectComposeSuggestion(position, token, suggestion, path));
  },

  onChangeSpoilerText (checked) {
    dispatch(changeComposeSpoilerText(checked));
  },

  onPaste (files) {
    dispatch(uploadCompose(files));
  },

  onPickEmoji (position, data, needsSpace) {
    PawooGA.event({ eventCategory: pawooGaCategory, eventAction: 'PickEmoji' });
    dispatch(insertEmojiCompose(position, data, needsSpace));
  },

  onSelectTimeLimit (tag) {
    PawooGA.event({ eventCategory: pawooGaCategory, eventAction: 'SelectTimeLimit' });
    dispatch(insertTagCompose(tag));
  },

  onInsertHashtag (tag) {
    PawooGA.event({ eventCategory: pawooGaCategory, eventAction: 'InsertHashtag' });
    dispatch(insertTagCompose(tag));
  },

});

export default connect(mapStateToProps, mapDispatchToProps)(ComposeForm);
