'use strict';
const assert = require('assert');
const childProcess = require('child_process');
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const node = process.execPath;
const fill = path.join(ROOT, 'releases/translations/fill-translations.mjs');
const cases = [
  ['be', /[\u0400-\u04ff]/u], ['hy', /[\u0530-\u058f]/u],
  ['ka', /[\u10a0-\u10ff]/u], ['mn', /[\u0400-\u04ff]/u],
  ['sr', /[\u0400-\u04ff]/u], ['ta', /[\u0b80-\u0bff]/u],
];
for (const [language, script] of cases) {
  const remaining = JSON.parse(childProcess.execFileSync(node,
    [fill, '--list', language], { cwd: ROOT, encoding: 'utf8' }));
  assert.deepStrictEqual(remaining, {}, `${language} has no translatable English values`);
  const translated = JSON.parse(fs.readFileSync(path.join(ROOT,
    'imports/i18n/data', `${language}.i18n.json`), 'utf8'));
  assert.match(translated['no-boards-selected'], script);
  assert.doesNotMatch(translated['enable-permanent-delete-description'],
    /Allow Global Admins|Enabling this setting/);
}
console.log('upcomingSixLocaleTranslationFill: 18 tests passed');
