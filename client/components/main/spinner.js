import Settings from '/models/settings';

Spinner = {
  getSpinnerTemplate() {
    return 'spinner' + this.getSpinnerName();
  },

  getSpinnerTemplateRaw() {
    return 'spinner' + this.getSpinnerName() + 'Raw';
  },

  currentSetting: new ReactiveVar(),

  currentSettings() {
    return this.currentSetting.get();
  },

  getSpinnerName() {
    let ret = 'Bounce';
    if (this.currentSettings()) {
      ret = this.currentSettings().spinnerName;
    }
    return ret;
  },

  getSpinnerNameLC() {
    return this.getSpinnerName().toLowerCase();
  },
}

Blaze.registerHelper('Spinner', Spinner);

Meteor.subscribe('setting', {
  onReady() {
    Spinner.currentSetting.set(Settings.findOne());
  },
});
