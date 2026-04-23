import { getSpinnerTemplate } from '/client/lib/spinner';

Template.spinner.helpers({
  getSpinnerTemplate() {
    return getSpinnerTemplate();
  },
});

Template.spinnerRaw.helpers({
  getSpinnerTemplateRaw() {
    return getSpinnerTemplate() + 'Raw';
  },
});
