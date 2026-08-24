'use strict';
const assert = require('assert');
const childProcess = require('child_process');
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const node = process.execPath;
const fill = path.join(ROOT, 'releases/translations/fill-translations.mjs');
for (const language of ['pt-PT', 'pt', 'pt_PT']) {
  const remaining = JSON.parse(childProcess.execFileSync(node,
    [fill, '--list', language], { cwd: ROOT, encoding: 'utf8' }));
  assert.deepStrictEqual(remaining, {});
  const translated = JSON.parse(fs.readFileSync(path.join(ROOT,
    'imports/i18n/data', `${language}.i18n.json`), 'utf8'));
  assert.strictEqual(translated.officeReportTitle, 'Escritórios');
  assert.match(translated['api-report-desc'], /pontos finais|frequência/);
  assert.doesNotMatch(translated['office-no-results'], /Nobody|logged in/);
  assert.match(translated['api-no-calls'], /WITH_API=true/);
}
console.log('upcomingPortugueseTranslationFill: 15 tests passed');
