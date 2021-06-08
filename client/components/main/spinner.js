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

(class extends Spinner {
}.register('spinner'));

(class extends Spinner {
  getSpinnerTemplateRaw() {
    let ret = super.getSpinnerTemplate() + 'Raw';
    return ret;
  }
}.register('spinnerRaw'));
