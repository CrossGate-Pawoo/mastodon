import escapeTextContentForBrowser from 'escape-html';
import Immutable from 'immutable';
import PropTypes from 'prop-types';
import React, { PureComponent, Fragment } from 'react';
import ReactDOM from 'react-dom';
import { FormattedMessage, IntlProvider, addLocaleData } from 'react-intl';
import { List as ImmutableList } from 'immutable';
import emojify from '../../../mastodon/features/emoji/emoji';
import { getLocale } from '../../../mastodon/locales';
import PublicTagLink from '../../components/public_tag_link';
import SuggestedAccount from '../../components/suggested_account';
import TrendTags from '../../components/trend_tags';
import ModalRoot from '../../../mastodon/components/modal_root';
import MediaModal from '../../../mastodon/features/ui/components/media_modal';

const { localeData, messages } = getLocale();

addLocaleData(localeData);

export default class StandaloneSuggestionTagsContainer extends PureComponent {

  static propTypes = {
    locale: PropTypes.string.isRequired,
    accounts: PropTypes.array.isRequired,
    tags: PropTypes.array.isRequired,
  };

  state = {
    media: null,
  }

  componentWillMount () {
    this.modalContent = document.createElement('div');
    document.body.appendChild(this.modalContent);
  }

  handleOpenMedia = (media) => {
    document.body.classList.add('media-standalone__body');
    this.setState({ media: ImmutableList([media]) });
  }

  handleCloseMedia = () => {
    document.body.classList.remove('media-standalone__body');
    this.setState({ media: null });
  }

  render () {
    const { locale, accounts, tags } = this.props;

    accounts.forEach(account => {
      account.display_name_html = emojify(escapeTextContentForBrowser(account.display_name));
    });

    return (
      <IntlProvider locale={locale} messages={messages}>
        <Fragment>
          <section>
            <h1 className='pawoo-subcolumn__header'>
              <i
                className='fa fa-user-plus pawoo-subcolumn__header__icon'
                role='presentation'
              />
              <FormattedMessage
                id='pawoo.column.suggested_accounts'
                defaultMessage='Active Users'
              />
            </h1>
            <ul className='pawoo-subcolumn--suggested-accounts__body'>
              {accounts.map(account => (
                <li key={account.id}>
                  <SuggestedAccount
                    account={Immutable.fromJS(account)}
                    onOpenMedia={this.handleOpenMedia}
                    target=''
                  />
                </li>
              ))}
            </ul>
          </section>
          <TrendTags tags={Immutable.fromJS(tags)} Tag={PublicTagLink} />
          {this.state.media && ReactDOM.createPortal((
            <ModalRoot onClose={this.handleCloseMedia}>
              {this.state.media && (
                <MediaModal
                  media={this.state.media}
                  index={0}
                  time={0}
                  onClose={this.handleCloseMedia}
                />
              )}
            </ModalRoot>
          ), this.modalContent)}
        </Fragment>
      </IntlProvider>
    );
  }

}
