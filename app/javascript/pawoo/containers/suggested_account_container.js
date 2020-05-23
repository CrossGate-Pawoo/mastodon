import { connect } from 'react-redux';
import { defineMessages, injectIntl, FormattedMessage } from 'react-intl';
import { List as ImmutableList } from 'immutable';
import { makeGetSuggestedAccount } from '../selectors';
import { openModal } from 'mastodon/actions/modal';
import SuggestedAccount from '../components/suggested_account';
import PawooGA from '../actions/ga';
import {
  followAccount,
  unfollowAccount,
} from 'mastodon/actions/accounts';
import { unfollowModal } from 'mastodon/initial_state';

const pawooGaCategory = 'SuggestedAccount';

const messages = defineMessages({
  unfollowConfirm: { id: 'confirmations.unfollow.confirm', defaultMessage: 'Unfollow' },
});

const makeMapStateToProps = () => {
  const getAccount = makeGetSuggestedAccount();

  const mapStateToProps = (state, props) => ({
    account: getAccount(state, props.id),
  });

  return mapStateToProps;
};

const mapDispatchToProps = (dispatch, { intl }) => ({
  onFollow (account) {
    if (account.getIn(['relationship', 'following']) || account.getIn(['relationship', 'requested'])) {
      if (unfollowModal) {
        dispatch(openModal('CONFIRM', {
          message: <FormattedMessage id='confirmations.unfollow.message' defaultMessage='Are you sure you want to unfollow {name}?' values={{ name: <strong>@{account.get('acct')}</strong> }} />,
          confirm: intl.formatMessage(messages.unfollowConfirm),
          onConfirm: () => {
            PawooGA.event({ eventCategory: pawooGaCategory, eventAction: 'Unollow', eventLabel: account.get('id') });
            dispatch(unfollowAccount(account.get('id')));
          },
        }));
      } else {
        PawooGA.event({ eventCategory: pawooGaCategory, eventAction: 'Unollow', eventLabel: account.get('id') });
        dispatch(unfollowAccount(account.get('id')));
      }
    } else {
      PawooGA.event({ eventCategory: pawooGaCategory, eventAction: 'Follow', eventLabel: account.get('id') });
      dispatch(followAccount(account.get('id')));
    }
  },

  onOpenMedia (media) {
    if (media.get('type') === 'video') {
      dispatch(openModal('VIDEO', { media, time: 0 }));
    } else {
      dispatch(openModal('MEDIA', { media: ImmutableList([media]), index: 0 }));
    }
  },
});

export default injectIntl(connect(makeMapStateToProps, mapDispatchToProps)(SuggestedAccount));
