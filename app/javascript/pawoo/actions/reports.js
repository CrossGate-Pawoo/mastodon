import api from 'mastodon/api';
import { openModal, closeModal } from 'mastodon/actions/modal';

export const PAWOO_REPORT_INIT   = 'PAWOO_REPORT_INIT';
export const PAWOO_REPORT_CANCEL = 'PAWOO_REPORT_CANCEL';

export const PAWOO_REPORT_SUBMIT_REQUEST = 'PAWOO_REPORT_SUBMIT_REQUEST';
export const PAWOO_REPORT_SUBMIT_SUCCESS = 'PAWOO_REPORT_SUBMIT_SUCCESS';
export const PAWOO_REPORT_SUBMIT_FAIL    = 'PAWOO_REPORT_SUBMIT_FAIL';

export const PAWOO_REPORT_STATUS_TOGGLE  = 'PAWOO_REPORT_STATUS_TOGGLE';
export const PAWOO_REPORT_COMMENT_CHANGE = 'PAWOO_REPORT_COMMENT_CHANGE';
export const PAWOO_REPORT_FORWARD_CHANGE = 'PAWOO_REPORT_FORWARD_CHANGE';
export const PAWOO_REPORT_TYPE_CHANGE    = 'PAWOO_REPORT_TYPE_CHANGE';

export function initReport(account, status) {
  return dispatch => {
    dispatch({
      type: PAWOO_REPORT_INIT,
      account,
      status,
    });

    dispatch(openModal('REPORT'));
  };
};

export function cancelReport() {
  return {
    type: PAWOO_REPORT_CANCEL,
  };
};

export function toggleStatusReport(statusId, checked) {
  return {
    type: PAWOO_REPORT_STATUS_TOGGLE,
    statusId,
    checked,
  };
};

export function changeReportType(reportType) {
  return {
    type: PAWOO_REPORT_TYPE_CHANGE,
    reportType,
  };
};

export function submitReport() {
  return (dispatch, getState) => {
    dispatch(submitReportRequest());

    api(getState).post('/api/v1/reports', {
      account_id: getState().getIn(['pawoo', 'reports', 'new', 'account_id']),
      status_ids: getState().getIn(['pawoo', 'reports', 'new', 'status_ids']),
      comment: getState().getIn(['pawoo', 'reports', 'new', 'comment']),
      forward: getState().getIn(['pawoo', 'reports', 'new', 'forward']),
      pawoo_report_type: getState().getIn(['pawoo', 'reports', 'new', 'report_type']),
    }).then(response => {
      dispatch(closeModal());
      dispatch(submitReportSuccess(response.data));
    }).catch(error => dispatch(submitReportFail(error)));
  };
};

export function submitReportRequest() {
  return {
    type: PAWOO_REPORT_SUBMIT_REQUEST,
  };
};

export function submitReportSuccess(report) {
  return {
    type: PAWOO_REPORT_SUBMIT_SUCCESS,
    report,
  };
};

export function submitReportFail(error) {
  return {
    type: PAWOO_REPORT_SUBMIT_FAIL,
    error,
  };
};

export function changeReportComment(comment) {
  return {
    type: PAWOO_REPORT_COMMENT_CHANGE,
    comment,
  };
};

export function changeReportForward(forward) {
  return {
    type: PAWOO_REPORT_FORWARD_CHANGE,
    forward,
  };
};
