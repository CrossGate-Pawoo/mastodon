import { changeSetting, saveSettings } from './settings';
import PawooGA from '../../pawoo/actions/ga';

const pawooGaCategory = 'Onboarding';

export const INTRODUCTION_VERSION = 20181216044202;

export const closeOnboarding = () => dispatch => {
  dispatch(changeSetting(['introductionVersion'], INTRODUCTION_VERSION));
  dispatch(saveSettings());

  PawooGA.event({ eventCategory: pawooGaCategory, eventAction: 'Show' });
};
