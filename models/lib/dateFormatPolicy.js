const DATE_FORMATS = ['YYYY-MM-DD', 'DD-MM-YYYY', 'MM-DD-YYYY'];

function resolveDateFormat(preferred, setting) {
  if (setting?.hideDateFormat) {
    return DATE_FORMATS.includes(setting.globalDateFormat)
      ? setting.globalDateFormat : DATE_FORMATS[0];
  }
  return preferred || DATE_FORMATS[0];
}

module.exports = { DATE_FORMATS, resolveDateFormat };
