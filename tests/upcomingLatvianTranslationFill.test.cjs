'use strict';
const assert = require('assert');
const childProcess = require('child_process');
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const node = process.execPath;
const fill = path.join(ROOT, 'releases/translations/fill-translations.mjs');
assert.deepStrictEqual(JSON.parse(childProcess.execFileSync(node,
  [fill, '--list', 'lv'], { cwd: ROOT, encoding: 'utf8' })), {});
const translated = JSON.parse(fs.readFileSync(path.join(ROOT,
  'imports/i18n/data/lv.i18n.json'), 'utf8'));
assert.strictEqual(translated.officeReportTitle, 'Biroji');
assert.match(translated['api-report-desc'], /galapunkt|bieži/);
assert.doesNotMatch(translated['office-no-results'], /Nobody|logged in/);
assert.match(translated['api-no-calls'], /WITH_API=true/);
console.log('upcomingLatvianTranslationFill: 5 tests passed');
