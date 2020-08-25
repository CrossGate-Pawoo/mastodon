import React, { Fragment } from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import PropTypes from 'prop-types';
import configureStore from 'mastodon/store/configureStore';
import { hydrateStore } from 'mastodon/actions/store';
import { IntlProvider, addLocaleData } from 'react-intl';
import { getLocale } from 'mastodon/locales';
import ModalContainer from 'mastodon/features/ui/containers/modal_container';
import initialState from 'mastodon/initial_state';
import GalleryContainer from '../gallery_container';

const { localeData, messages } = getLocale();
addLocaleData(localeData);

const store = configureStore();

if (initialState) {
  store.dispatch(hydrateStore(initialState));
}

export default class StandaloneGalleryContainer extends React.PureComponent {

  static propTypes = {
    locale: PropTypes.string.isRequired,
    tag: PropTypes.string,
  };

  render () {
    const { locale, tag } = this.props;

    return (
      <IntlProvider locale={locale} messages={messages}>
        <Provider store={store}>
          <Fragment>
            <GalleryContainer tag={tag} />
            {ReactDOM.createPortal(
              <ModalContainer />,
              document.getElementById('modal-container'),
            )}
          </Fragment>
        </Provider>
      </IntlProvider>
    );
  }

}
