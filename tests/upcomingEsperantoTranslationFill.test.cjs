'use strict';
const assert = require('assert');
const childProcess = require('child_process');
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const node = process.execPath;
const fill = path.join(ROOT, 'releases/translations/fill-translations.mjs');
assert.deepStrictEqual(JSON.parse(childProcess.execFileSync(node,
  [fill, '--list', 'eo'], { cwd: ROOT, encoding: 'utf8' })), {});
const translated = JSON.parse(fs.readFileSync(path.join(ROOT,
  'imports/i18n/data/eo.i18n.json'), 'utf8'));
for (const key of ['no-boards-selected', 'office-report-desc', 'api-report-desc']) {
  assert.match(translated[key], /ĉ|ĝ|ĵ|ŝ|ŭ|tabul|ensalut|finpunkt/u);
  assert.doesNotMatch(translated[key], /You did not|Where people|Which REST/);
}
assert.match(translated['api-no-calls'], /WITH_API=true/);
console.log('upcomingEsperantoTranslationFill: 8 tests passed');
