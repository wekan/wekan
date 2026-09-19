const DATE_FORMATS = ['YYYY-MM-DD', 'DD-MM-YYYY', 'MM-DD-YYYY',
  'YYYY-MM-DD-date-only', 'DD-MM-YYYY-date-only', 'MM-DD-YYYY-date-only'];

function resolveDateFormat(preferred, setting) {
  if (setting?.hideDateFormat) {
    return DATE_FORMATS.includes(setting.globalDateFormat)
      ? setting.globalDateFormat : DATE_FORMATS[0];
  }
  return DATE_FORMATS.includes(preferred) ? preferred : DATE_FORMATS[0];
}

module.exports = { DATE_FORMATS, resolveDateFormat };
