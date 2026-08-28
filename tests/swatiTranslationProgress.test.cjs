'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const readLanguage = code => JSON.parse(fs.readFileSync(
  path.join(root, 'imports/i18n/data', `${code}.i18n.json`),
  'utf8',
));
const english = readLanguage('en');
const swati = readLanguage('ss');
const tokenPattern = /__[^\s]+?__|%(?:\d+\$)?[A-Za-z]/g;
const tokens = value => (value.match(tokenPattern) || []).sort();
const tags = value => [...value.matchAll(/<\/?[A-Za-z][^>]*>/g)]
  .map(([tag]) => tag).sort();

const result = spawnSync(process.execPath,
  [path.join(root, 'releases/translations/fill-translations.mjs'),
    '--list', 'ss'], { cwd: root, encoding: 'utf8' });
assert.equal(result.status, 0, result.stderr);
assert.equal(Object.keys(JSON.parse(result.stdout)).length, 0,
  'Swati must have no English placeholders left');

for (const [key, value] of Object.entries(swati)) {
  assert.deepEqual(tokens(value), tokens(english[key]), `${key}: placeholder inventory`);
  assert.deepEqual(tags(value), tags(english[key]), `${key}: HTML tag inventory`);
}

assert.equal(swati.accept, 'Yemukela');
assert.match(swati['act-createBoard'], /libhodi/);
assert.match(swati['act-createCard'], /likhadi/);
assert.match(swati['act-createList'], /luhlu/);
assert.match(swati['act-addChecklist'], /luhlu lwekuhlola/);
assert.equal(swati['changeLanguagePopup-title'], 'Shintja Lulwimi');
assert.equal(swati.menu, 'Imenyu');
assert.equal(swati['what-to-do'], 'Ufuna kwentani?');
assert.equal(swati['signupPopup-title'], 'Dala I-akhawunti');

// Swati and Zulu share the Latin script, so a script check cannot distinguish
// them. Pin the Swati vocabulary in the newly completed migration/settings
// tail and reject characteristic Zulu forms in that same direct-fill batch.
const completedTail = [
  swati['database-migration-description'],
  swati['cards-loading-description'],
  swati['disable-all-import-description'],
  swati['migration-progress-note'],
  swati['repair-broken-cards-done-unfixable'],
].join('\n');
assert.match(completedTail, /tfutsela|futsi|emafayela|libhodi|likhadi|umsebentisi/i);
assert.doesNotMatch(completedTail,
  /ukuthutha|futhi|amafayela|\bibhodi\b|\bikhadi\b|umsebenzisi|khetha/i);

console.log('Swati translation completion checks passed.');
