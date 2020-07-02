import React from 'react';
import banner from '../../pawoo/images/about/banner.png';

export default function TimelineBottomBanner() {
  return (
    <div className='pawoo-kyoa-home'>
      <a href='http://www.waffle1999.com/game/edensgrenze/' onClick={handleTBBClick}>
        <img alt='banner' src={banner} />
      </a>
    </div>
  );
};

export function handleTBBClick() {
  ga('send', 'event', 'TimelineBottomBanner', 'click', 'http://www.waffle1999.com/game/edensgrenze/');
};