import Rails from 'rails-ujs';

import { start as pawooStart } from '../pawoo/common';

export function start() {
  require('font-awesome/css/font-awesome.css');
  require.context('../images/', true);

  pawooStart();

  try {
    Rails.start();
  } catch (e) {
    // If called twice
  }
};
