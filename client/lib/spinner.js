Meteor.subscribe('setting');

export class Spinner extends BlazeComponent {
  currentSettings() {
    return Settings.findOne();
  }

  getSpinnerName() {
    let ret = 'Bounce';
    let settings = this.currentSettings();

    if (settings && settings.spinnerName) {
      ret = settings.spinnerName;
    }
    return ret;
  }

  getSpinnerTemplate() {
    return 'spinner' + this.getSpinnerName();
  }
}
