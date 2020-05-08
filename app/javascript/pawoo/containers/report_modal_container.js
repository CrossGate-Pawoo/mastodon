import React from 'react';
import { connect } from 'react-redux';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';
import { OrderedSet } from 'immutable';
import ImmutablePureComponent from 'react-immutable-pure-component';
import Toggle from 'react-toggle';
import {
  changeReportComment,
  changeReportForward,
  submitReport,
  changeReportType,
} from '../actions/reports';
import { expandAccountTimeline } from '../../mastodon/actions/timelines';
import PropTypes from 'prop-types';
import ImmutablePropTypes from 'react-immutable-proptypes';
import { makeGetAccount } from '../../mastodon/selectors';
import StatusCheckBox from './report_check_box_container';
import Button from '../../mastodon/components/button';
import IconButton from '../../mastodon/components/icon_button';

const messages = defineMessages({
  close: { id: 'lightbox.close', defaultMessage: 'Close' },
  placeholder: { id: 'pawoo.report.placeholder', defaultMessage: 'Additional comments (required for other cases)' },
  submit: { id: 'report.submit', defaultMessage: 'Submit' },
  reportTitle: { id: 'pawoo.report.select.title', defaultMessage: 'Please select the reason for reporting' },
  donotlike: { id: 'pawoo.report.select.donotlike', defaultMessage: 'I do not like it' },
  nsfw: { id: 'pawoo.report.select.nsfw', defaultMessage: 'Incorrect NSFW setting' },
  spam: { id: 'pawoo.report.select.spam', defaultMessage: 'Spam' },
  reproduction: { id: 'pawoo.report.select.reproduction', defaultMessage: 'Unauthorized reproduction' },
  prohibited: { id: 'pawoo.report.select.prohibited', defaultMessage: 'Prohibited act' },
  other: { id: 'pawoo.report.select.other', defaultMessage: 'Other' },
});

const makeMapStateToProps = () => {
  const getAccount = makeGetAccount();

  const mapStateToProps = state => {
    const accountId = state.getIn(['pawoo', 'reports', 'new', 'account_id']);

    return {
      isSubmitting: state.getIn(['pawoo', 'reports', 'new', 'isSubmitting']),
      account: getAccount(state, accountId),
      comment: state.getIn(['pawoo', 'reports', 'new', 'comment']),
      forward: state.getIn(['pawoo', 'reports', 'new', 'forward']),
      reportType: state.getIn(['pawoo', 'reports', 'new', 'report_type']),
      statusIds: OrderedSet(state.getIn(['timelines', `account:${accountId}`, 'items'])).union(state.getIn(['pawoo', 'reports', 'new', 'status_ids'])),
    };
  };

  return mapStateToProps;
};

export default @injectIntl
@connect(makeMapStateToProps)
class ReportModal extends ImmutablePureComponent {

  static propTypes = {
    isSubmitting: PropTypes.bool,
    account: ImmutablePropTypes.map,
    statusIds: ImmutablePropTypes.orderedSet.isRequired,
    comment: PropTypes.string.isRequired,
    forward: PropTypes.bool,
    reportType: PropTypes.string,
    dispatch: PropTypes.func.isRequired,
    intl: PropTypes.object.isRequired,
  };

  options = ['donotlike', 'nsfw', 'spam', 'reproduction', 'prohibited', 'other'];

  handleCommentChange = e => {
    this.props.dispatch(changeReportComment(e.target.value));
  }

  handleForwardChange = e => {
    this.props.dispatch(changeReportForward(e.target.checked));
  }

  handleSubmit = () => {
    this.props.dispatch(submitReport());
  }

  componentDidMount () {
    this.props.dispatch(expandAccountTimeline(this.props.account.get('id')));
  }

  componentWillReceiveProps (nextProps) {
    if (this.props.account !== nextProps.account && nextProps.account) {
      this.props.dispatch(expandAccountTimeline(nextProps.account.get('id')));
    }
  }

  onToggle = (e) => {
    this.props.dispatch(changeReportType(e.target.getAttribute('name')));
  }

  isSendable() {
    const { comment, reportType } = this.props;

    return this.options.includes(reportType) && (reportType !== 'other' || comment.length > 0);
  }

  render () {
    const { account, comment, reportType, intl, statusIds, isSubmitting, forward, onClose } = this.props;

    if (!account) {
      return null;
    }

    const domain = account.get('acct').split('@')[1];

    return (
      <div className='modal-root__modal report-modal'>
        <div className='report-modal__target'>
          <IconButton className='media-modal__close' title={intl.formatMessage(messages.close)} icon='times' onClick={onClose} size={16} />
          <FormattedMessage id='report.target' defaultMessage='Report {target}' values={{ target: <strong>{account.get('acct')}</strong> }} />
        </div>

        <div className='report-modal__container'>
          <div className='report-modal__comment'>
            <div className='pawoo-extension-report-modal__type'>
              <div className='report__select'>
                <div className='report__select__title'>{intl.formatMessage(messages.reportTitle)}</div>
                {this.options.map(option => (
                  <div className='pawoo__report-modal__select-type' key={option}>
                    <div className='pawoo__report-modal__select-type-title'>
                      {intl.formatMessage(messages[option])}
                    </div>
                    <div className='pawoo__report-modal__select-type-toggle'>
                      <Toggle name={option} checked={option === reportType} onChange={this.onToggle} disabled={isSubmitting} />
                    </div>
                  </div>
                ))}
              </div>

              <p><FormattedMessage id='report.hint' defaultMessage='The report will be sent to your instance moderators. You can provide an explanation of why you are reporting this account below:' /></p>
              <textarea
                className='setting-text light'
                placeholder={intl.formatMessage(messages.placeholder)}
                value={comment}
                onChange={this.handleCommentChange}
                disabled={isSubmitting}
              />

              {domain && (
                <div>
                  <p><FormattedMessage id='report.forward_hint' defaultMessage='The account is from another server. Send an anonymized copy of the report there as well?' /></p>

                  <div className='setting-toggle'>
                    <Toggle id='report-forward' checked={forward} disabled={isSubmitting} onChange={this.handleForwardChange} />
                    <label htmlFor='report-forward' className='setting-toggle__label'><FormattedMessage id='report.forward' defaultMessage='Forward to {target}' values={{ target: domain }} /></label>
                  </div>
                </div>
              )}
            </div>

            <Button disabled={isSubmitting || !this.isSendable()} text={intl.formatMessage(messages.submit)} onClick={this.handleSubmit} />
          </div>

          <div className='report-modal__statuses'>
            <div>
              {statusIds.map(statusId => <StatusCheckBox id={statusId} key={statusId} disabled={isSubmitting} />)}
            </div>
          </div>
        </div>
      </div>
    );
  }

}
