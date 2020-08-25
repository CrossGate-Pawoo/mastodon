export const PAWOO_EXTENSION_REPORT_TYPE_CHANGE = 'PAWOO_EXTENSION_REPORT_TYPE_CHANGE';

export function changeReportType(reportType) {
  return {
    type: PAWOO_EXTENSION_REPORT_TYPE_CHANGE,
    reportType,
  };
};
