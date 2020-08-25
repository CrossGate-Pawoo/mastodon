import { connect } from 'react-redux';
import ColumnHeader from 'mastodon/components/column_header';

const mapStateToProps = state => ({
  pawooExpanded: state.getIn(['settings', 'pawoo', 'expanded']),
});

export default connect(mapStateToProps)(ColumnHeader);
