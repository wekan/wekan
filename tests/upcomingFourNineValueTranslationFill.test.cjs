'use strict';
const assert = require('assert');
const childProcess = require('child_process');
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const node = process.execPath;
const fill = path.join(ROOT, 'releases/translations/fill-translations.mjs');
const cases = [['bg', /[\u0400-\u04ff]/u], ['fa-IR', /[\u0600-\u06ff]/u],
  ['fa', /[\u0600-\u06ff]/u], ['mk', /[\u0400-\u04ff]/u]];
for (const [language, script] of cases) {
  const remaining = JSON.parse(childProcess.execFileSync(node,
    [fill, '--list', language], { cwd: ROOT, encoding: 'utf8' }));
  assert.deepStrictEqual(remaining, {});
  const translated = JSON.parse(fs.readFileSync(path.join(ROOT,
    'imports/i18n/data', `${language}.i18n.json`), 'utf8'));
  assert.match(translated['no-boards-selected'], script);
  assert.doesNotMatch(translated['enable-permanent-delete-description'],
    /Allow Global Admins|Enabling this setting/);
}
console.log('upcomingFourNineValueTranslationFill: 12 tests passed');
