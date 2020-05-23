import { connect } from 'react-redux';
import ColumnsArea from '../components/columns_area';
import { getColumns } from '../../../../pawoo/selectors';

const mapStateToProps = state => ({
  columns: getColumns(state),
  isModalOpen: !!state.get('modal').modalType,
  pawooPage: state.getIn(['pawoo', 'page']),
});

export default connect(mapStateToProps, null, null, { forwardRef: true })(ColumnsArea);
