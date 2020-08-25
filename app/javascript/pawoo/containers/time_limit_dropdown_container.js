import { connect } from 'react-redux';
import TimeLimitDropdown from '../components/time_limit_dropdown';
import { openModal, closeModal } from 'mastodon/actions/modal';
import { isUserTouching } from 'mastodon/is_mobile';

const mapStateToProps = state => ({
  isModalOpen: state.get('modal').modalType === 'ACTIONS',
});

const mapDispatchToProps = dispatch => ({
  isUserTouching,
  onModalOpen: props => dispatch(openModal('ACTIONS', props)),
  onModalClose: () => dispatch(closeModal()),
});

export default connect(mapStateToProps, mapDispatchToProps)(TimeLimitDropdown);
