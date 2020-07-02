import React from 'react';
import banner from '../../pawoo/images/about/banner.png';
import PawooGA from '../actions/ga';

const pawooGaCategory = 'TimelineBottomBanner';

export default function TimelineBottomBanner() {
  return (
    <div className='pawoo-kyoa-home'>
      <a href='http://www.waffle1999.com/game/edensgrenze/' onClick={handleTBBClick}>
        <img alt='banner' src={banner} />
      </a>
    </div>
  );
};

function handleTBBClick() {
  PawooGA.event({ eventCategory: pawooGaCategory, eventAction: 'click', eventLabel: 'http://www.waffle1999.com/game/edensgrenze/' });
};
