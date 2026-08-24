'use strict';
const assert = require('assert');
const childProcess = require('child_process');
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const node = process.execPath;
const fill = path.join(ROOT, 'releases/translations/fill-translations.mjs');
const remaining = JSON.parse(childProcess.execFileSync(node,
  [fill, '--list', 'th'], { cwd: ROOT, encoding: 'utf8' }));
assert.deepStrictEqual(remaining, {});
const translated = JSON.parse(fs.readFileSync(path.join(ROOT,
  'imports/i18n/data/th.i18n.json'), 'utf8'));
for (const key of ['no-boards-selected', 'office-report-desc', 'api-report-desc']) {
  assert.match(translated[key], /[\u0e00-\u0e7f]/u);
  assert.doesNotMatch(translated[key], /You did not|Where people|Which REST/);
}
assert.match(translated['api-no-calls'], /WITH_API=true/);
console.log('upcomingThaiTranslationFill: 8 tests passed');
