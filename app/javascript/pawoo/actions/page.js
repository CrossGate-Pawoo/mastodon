export const PAGE_SET = 'PAWOO_PAGE_SET';

export function setPage(page) {
  return dispatch => {
    dispatch({ type: PAGE_SET, page });
  };
}
