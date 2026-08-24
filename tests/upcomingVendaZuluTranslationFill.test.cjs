'use strict';
const assert = require('assert');
const childProcess = require('child_process');
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const node = process.execPath;
const fill = path.join(ROOT, 'releases/translations/fill-translations.mjs');
const read = language => JSON.parse(fs.readFileSync(path.join(ROOT,
  'imports/i18n/data', `${language}.i18n.json`), 'utf8'));
for (const language of ['ve-CC', 've-PP', 've', 'zu-ZA', 'zu']) {
  assert.deepStrictEqual(JSON.parse(childProcess.execFileSync(node,
    [fill, '--list', language], { cwd: ROOT, encoding: 'utf8' })), {});
  const translated = read(language);
  assert.doesNotMatch(translated['office-report-desc'], /Where people log in/);
  assert.match(translated['api-no-calls'], /WITH_API=true/);
}
const venda = read('ve')['no-boards-selected'];
const zulu = read('zu')['no-boards-selected'];
assert.match(venda, /A no ngo|bodo/);
assert.match(zulu, /Awukhethanga|ibhodi/);
assert.notStrictEqual(venda, zulu);
console.log('upcomingVendaZuluTranslationFill: 18 tests passed');
