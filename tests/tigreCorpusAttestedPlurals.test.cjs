'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const read = code => JSON.parse(fs.readFileSync(path.join(root,
  'imports/i18n/data', `${code}.i18n.json`), 'utf8'));
const english = read('en');
const tigre = read('tig');
const tigrinya = read('ti');
const families = [
  { source: /\bfiles?\b/i, old: 'ፈይላት', new: 'ፋይላት' },
  { source: /\b(?:usernames|names)\b/i,
    old: 'ስሜታት', new: 'አስማይ' },
  { source: /\borganizations?\b/i,
    old: 'መነዘመታት', new: 'መነዘማት' },
];
for (const [key, value] of Object.entries(tigre)) {
  for (const family of families) {
    if (!family.source.test(english[key] || '')) continue;
    assert.ok(!value.includes(family.old),
      `${key}: provisional plural without corpus attestation`);
  }
}
assert.equal(tigre['uploading-files'], 'ፋይላት ይስቀሉ ኣለዉ');
assert.equal(tigre['uploading-files'], tigrinya['uploading-files'],
  'corpus-attested Tigre File plural may be shared with Tigrinya');
assert.equal(tigre['label-names'], 'አስማይ እሻረት');
assert.equal(tigre['organizations'], 'መነዘማት');
assert.match(tigre['backup-scope-description'], /ኵሎም መነዘማት/u);
assert.equal(tigre.file, 'ፈይል',
  'corpus-attested singular File stays distinct');
console.log('Tigre Files, Names and Organizations plurals reviewed.');
