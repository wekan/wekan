Meteor.subscribe('setting');

import { ALLOWED_WAIT_SPINNERS } from '/config/const';

export class Spinner extends BlazeComponent {
  currentSettings() {
    return Settings.findOne();
  }

  getSpinnerName() {
    let ret = 'Bounce';
    let defaultWaitSpinner = Meteor.settings.public.WAIT_SPINNER;
    if (defaultWaitSpinner && ALLOWED_WAIT_SPINNERS.includes(defaultWaitSpinner)) {
      ret = defaultWaitSpinner;
    }
    let settings = this.currentSettings();

    if (settings && settings.spinnerName) {
      ret = settings.spinnerName;
    }
    return ret;
  }

  getSpinnerTemplate() {
    return 'spinner' + this.getSpinnerName().replace(/-/, '');
  }
}
