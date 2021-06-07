function getSpinnerName() {
  return 'Bounce'
}

Spinner = {
  getSpinnerTemplate() {
    return 'spinner' + getSpinnerName()
  },

  getSpinnerTemplateRaw() {
    return 'spinner' + getSpinnerName() + 'Raw';
  },

  spinnerName: getSpinnerName().toLowerCase(),
}

Blaze.registerHelper('Spinner', Spinner);
