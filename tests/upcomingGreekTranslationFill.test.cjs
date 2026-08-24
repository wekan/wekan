'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
for (const language of ['el', 'el-GR']) {
  const translated = JSON.parse(fs.readFileSync(path.join(ROOT,
    'imports/i18n/data', `${language}.i18n.json`), 'utf8'));
  for (const key of ['azure-connection-string', 'azure-container', 'backup',
    'gcs-project-id']) {
    assert.match(translated[key], /[\u0370-\u03ff]/u);
  }
  assert.notStrictEqual(translated.backup, 'Backup');
}
console.log('upcomingGreekTranslationFill: 10 tests passed');
