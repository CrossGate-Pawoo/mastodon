import React, { Component } from 'react';
import PropTypes from 'prop-types';
import PawooGA from 'pawoo/actions/ga';

const gaTracker = (WrappedComponent, prefix = '') => {

  const HOC = class extends Component {

    static propTypes = {
      location: PropTypes.object,
    };

    componentWillReceiveProps(nextProps) {
      const currentPage = this.props.location.pathname;
      const nextPage = nextProps.location.pathname;

      if (currentPage !== nextPage) {
        PawooGA.trackPage(`${prefix}${nextPage}`);
      }
    }

    render() {
      return <WrappedComponent {...this.props} />;
    }

  };

  return HOC;
};

export default gaTracker;
