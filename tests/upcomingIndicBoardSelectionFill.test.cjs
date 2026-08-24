'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const cases = [
  ['gu-IN', /[\u0a80-\u0aff]/u], ['or_IN', /[\u0b00-\u0b7f]/u],
  ['pa', /[\u0a00-\u0a7f]/u], ['te-IN', /[\u0c00-\u0c7f]/u],
];
const keys = ['archive-permanent-delete-disabled-hint', 'no-boards-selected',
  'select-only-one-board', 'unset-selected-home', 'enable-permanent-delete',
  'enable-permanent-delete-description', 'select-none'];
for (const [language, script] of cases) {
  const translated = JSON.parse(fs.readFileSync(path.join(ROOT,
    'imports/i18n/data', `${language}.i18n.json`), 'utf8'));
  for (const key of keys) {
    assert.match(translated[key], script, `${language}:${key} uses target script`);
    assert.doesNotMatch(translated[key], /You did not|Please select|Enable permanent/);
  }
}
console.log('upcomingIndicBoardSelectionFill: 56 tests passed');
