import React from 'react';
import ImmutablePureComponent from 'react-immutable-pure-component';
import sakura from '../../pawoo/images/about/sakura2.png';

export default class TimelineBottomBanner extends ImmutablePureComponent {

  render () {
    return (
        <div className='pawoo-kyoa-home'>
          <a href='https://senki1999.com/furuyoni_digital/'>
            <img alt='sakura' src={sakura} />
          </a>
        </div>
    );
  }

}
