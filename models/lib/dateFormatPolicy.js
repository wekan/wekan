const DATE_FORMATS = ['YYYY-MM-DD', 'DD-MM-YYYY', 'MM-DD-YYYY',
  'YYYY-MM-DD-date-only', 'DD-MM-YYYY-date-only', 'MM-DD-YYYY-date-only'];

// hideDateFormat is the persisted legacy name for enabling the global default.
function resolveDateFormat(preferred, setting, board, memberOverride = false) {
  if (memberOverride && DATE_FORMATS.includes(preferred)) return preferred;
  if (board?.dateFormatOverride && DATE_FORMATS.includes(board.dateFormat)) return board.dateFormat;
  if (setting?.hideDateFormat && DATE_FORMATS.includes(setting.globalDateFormat)) return setting.globalDateFormat;
  return DATE_FORMATS[0];
}

module.exports = { DATE_FORMATS, resolveDateFormat };
