'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const dataDir = path.join(root, 'imports/i18n/data');
const en = JSON.parse(fs.readFileSync(path.join(dataDir, 'en.i18n.json'), 'utf8'));
const zgh = JSON.parse(fs.readFileSync(path.join(dataDir, 'zgh.i18n.json'), 'utf8'));
const buttonFiles = [
  'client/components/users/userHeader.jade',
  'client/components/swimlanes/swimlaneHeader.jade',
  'client/components/sidebar/sidebar.jade',
  'client/components/sidebar/sidebarFilters.jade',
  'client/components/cards/cardDetails.jade',
  'client/components/lists/listHeader.jade',
];

assert.equal(en['remove-btn'], 'Remove');
assert.equal(en['remove-background-image'], 'Remove Background Image');
assert.equal(en['unset-color'], 'Unset');
assert.equal(zgh['unset-color'], zgh['cloud-secret-none'].slice(1, -1));
assert.match(zgh['unset-color'], /[\u2d30-\u2d7f]/u);
assert.doesNotMatch(zgh['unset-color'], /[\u0600-\u06ff]/u);
for (const name of fs.readdirSync(dataDir).filter(file => file.endsWith('.i18n.json'))) {
  const locale = JSON.parse(fs.readFileSync(path.join(dataDir, name), 'utf8'));
  for (const key of ['remove-btn', 'remove-background-image', 'unset-color']) {
    assert.equal(typeof locale[key], 'string', `${name}: ${key} translated/inventory present`);
  }
}
for (const file of buttonFiles) {
  const source = fs.readFileSync(path.join(root, file), 'utf8');
  assert.doesNotMatch(source, /\{\{_ 'unset-color'\}\}/,
    `${file}: removal button must not use status key`);
  if (file === 'client/components/sidebar/sidebar.jade') {
    assert.match(source, /js-remove-background-image[^\n]*\{\{_ 'remove-background-image'\}\}/);
  } else {
    assert.match(source, /(?:js-remove-color|js-reset-text-color)[^\n]*\{\{_ 'remove-btn'\}\}/);
  }
}
const settings = fs.readFileSync(path.join(root, 'client/components/settings/settingBody.js'), 'utf8');
assert.match(settings, /TAPi18n\.__\('unset-color'\)/,
  'unset status still uses its translated status key');
console.log('translationUnsetActionContexts: all locale inventories and UI action/status split verified');
