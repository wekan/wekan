const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const locale = code => JSON.parse(fs.readFileSync(path.join(root, 'imports/i18n/data/' + code + '.i18n.json'), 'utf8'));
const tigre = locale('tig');
const tigrinya = locale('ti');
const reviewed = {
  "board-view-timeline": "መስመር ወቅት",
  "board-view-cycle-time": "ናይ ዑደት ወቅት",
  "board-view-lead-time": "ናይ ምብጻሕ ወቅት",
  "OS_Uptime": "ወቅት ስራሕ OS",
  "backup-time": "ወቅት (HH:MM)",
  "backup-datetime": "ዕለትን ወቅትን",
  "estimated-time-remaining": "ግምታዊ ዝተረፈ ወቅት",
  "filter-dates-label": "እብ ዕለት ኣጻሪ",
  "r-schedule-on-date": "ዲብ ዕለት",
  "r-schedule-at-time": "ዲብ ሰዓት"
};
for (const [key, value] of Object.entries(reviewed)) {
  assert.equal(tigre[key], value, key + ': exact reviewed Tigre value');
  assert.notEqual(tigre[key], tigrinya[key], key + ': Tigrinya seed removed');
}
for (const key of ["board-view-timeline","board-view-cycle-time","board-view-lead-time","OS_Uptime","backup-time","backup-datetime","estimated-time-remaining"]) {
  assert.match(tigre[key], /ወቅት/, key + ': corpus-attested Time');
  assert.doesNotMatch(tigre[key], /ግዜ/, key + ': Tigrinya Time removed');
}
assert.match(tigre['filter-dates-label'], /^እብ ዕለት/, 'Tigre by-date phrase');
assert.equal(tigre['r-schedule-on-date'], 'ዲብ ዕለት');
assert.equal(tigre['r-schedule-at-time'], 'ዲብ ሰዓት');
console.log('Tigre date and time terms: ' + Object.keys(reviewed).length);
