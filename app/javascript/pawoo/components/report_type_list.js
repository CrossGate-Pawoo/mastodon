import React from 'react';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';
import ImmutablePureComponent from 'react-immutable-pure-component';
import Toggle from 'react-toggle';
import PropTypes from 'prop-types';

const messages = defineMessages({
  donotlike: { id: 'pawoo.report.select.donotlike', defaultMessage: 'I do not like it' },
  nsfw: { id: 'pawoo.report.select.nsfw', defaultMessage: 'Incorrect NSFW setting' },
  spam: { id: 'pawoo.report.select.spam', defaultMessage: 'Spam' },
  reproduction: { id: 'pawoo.report.select.reproduction', defaultMessage: 'Unauthorized reproduction' },
  prohibited: { id: 'pawoo.report.select.prohibited', defaultMessage: 'Prohibited act' },
  other: { id: 'pawoo.report.select.other', defaultMessage: 'Other' },
});

const reportTypes = ['donotlike', 'nsfw', 'spam', 'reproduction', 'prohibited', 'other'];

export default @injectIntl
class ReportTypeList extends ImmutablePureComponent {

  static propTypes = {
    pawooReportType: PropTypes.string,
    onToggle: PropTypes.func.isRequired,
    disabled: PropTypes.bool,
    intl: PropTypes.object.isRequired,
  };

  handleToggle = (e) => {
    this.props.onToggle(e.target.getAttribute('name'));
  }

  render () {
    const { pawooReportType, intl, disabled } = this.props;

    return (
      <div className='pawoo-report-type-list'>
        <p>
          <FormattedMessage id='pawoo.report.select.title' defaultMessage='Please select the reason for reporting' />
        </p>
        <div className='pawoo-report-type-list__items'>
          {reportTypes.map(reportType => (
            <div className='pawoo-report-type-list__item' key={reportType}>
              <div className='pawoo-report-type-list__type-name'>
                {intl.formatMessage(messages[reportType])}
              </div>
              <div className='pawoo-report-type-list__toggle'>
                <Toggle name={reportType} checked={reportType === pawooReportType} onChange={this.handleToggle} disabled={disabled} />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

}
