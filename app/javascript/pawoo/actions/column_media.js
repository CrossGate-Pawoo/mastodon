export const COLUMN_MEDIA_RESIZE = 'PAWOO_COLUMN_MEDIA_RESIZE';

export function resizeColumnMedia(single) {
  return (dispatch, getState) => dispatch({
    type: COLUMN_MEDIA_RESIZE,
    columnCount: getState().getIn(['settings', 'columns']).count(),
    defaultPage: getState().getIn(['pawoo', 'page']) === 'DEFAULT',
    single,
    window: { innerWidth, innerHeight },
  });
}
