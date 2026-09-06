'use strict';

const assert = require('assert');
const childProcess = require('child_process');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const dataDir = path.join(root, 'imports/i18n/data');
const readJson = file => JSON.parse(fs.readFileSync(file, 'utf8'));
const english = readJson(path.join(dataDir, 'en.i18n.json'));
const englishKeys = Object.keys(english);
const locales = fs.readdirSync(dataDir)
  .filter(file => file.endsWith('.i18n.json'))
  .filter(file => !/^en(?:[-_]|\.)/.test(file))
  .sort();

const tokens = value => [...String(value).matchAll(
  /__[A-Za-z0-9_.]+__|%(?:\d+\$)?[A-Za-z%]/g,
)].map(match => match[0]).sort();

assert.strictEqual(locales.length, 234,
  'the completeness gate covers every registered non-English locale file');

for (const file of locales) {
  const locale = readJson(path.join(dataDir, file));
  assert.deepStrictEqual(Object.keys(locale), englishKeys,
    `${file}: keys and key order must match English`);

  for (const key of englishKeys) {
    assert.deepStrictEqual(tokens(locale[key]), tokens(english[key]),
      `${file}:${key}: placeholder inventory must match English`);
  }
}

const fillResult = childProcess.spawnSync(process.execPath, [
  path.join(root, 'releases/translations/fill-translations.mjs'),
  '--missing',
], { cwd: root, encoding: 'utf8' });
assert.strictEqual(fillResult.status, 0, fillResult.stderr);
const fillOutput = `${fillResult.stdout}${fillResult.stderr}`;
assert.match(fillOutput, /0 language\(s\) still have untranslated strings/,
  'every actionable non-English value is translated');

console.log(`allTranslationCompleteness: ${locales.length} locales passed`);
