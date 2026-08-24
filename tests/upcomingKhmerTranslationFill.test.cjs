'use strict';
const assert = require('assert');
const childProcess = require('child_process');
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const node = process.execPath;
const fill = path.join(ROOT, 'releases/translations/fill-translations.mjs');
for (const language of ['km-KH', 'km', 'km_KH']) {
  const remaining = JSON.parse(childProcess.execFileSync(node,
    [fill, '--list', language], { cwd: ROOT, encoding: 'utf8' }));
  assert.deepStrictEqual(remaining, {});
  const translated = JSON.parse(fs.readFileSync(path.join(ROOT,
    'imports/i18n/data', `${language}.i18n.json`), 'utf8'));
  for (const key of ['no-boards-selected', 'enable-permanent-delete', 'Wave']) {
    assert.match(translated[key], /[\u1780-\u17ff]/u);
    assert.doesNotMatch(translated[key], /You did not|Enable permanent|Wait Spinner/);
  }
}
console.log('upcomingKhmerTranslationFill: 21 tests passed');
