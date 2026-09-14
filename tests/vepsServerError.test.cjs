const assert = require('node:assert/strict');
const fs = require('node:fs');
const test = require('node:test');
test('Veps server error label uses the Veps error noun instead of Finnish prose', () => {
  const data = JSON.parse(fs.readFileSync('imports/i18n/data/ve-PP.i18n.json', 'utf8'));
  assert.equal(data['server-error'], 'Serveran viga');
  assert.doesNotMatch(data['server-error'], /palvelin|virhe/i);
  assert.match(data['server-error-troubleshooting'], /serveran.*viga/);
});
