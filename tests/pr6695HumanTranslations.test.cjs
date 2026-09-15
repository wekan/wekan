'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.join(__dirname, '..');
const source = JSON.parse(fs.readFileSync(path.join(root, 'imports/i18n/data/en.i18n.json')));
// These are the values replaced by the human Transifex translations in PR #6695.
// Keep the superseded values as negative fixtures so newer human edits remain valid.
const superseded = JSON.parse(fs.readFileSync(
  path.join(root, 'releases/translations/pr6695-superseded-translations.json')));
const tempRoot = path.join(root, '.tools/tmp/pr6695-human-translations');
fs.mkdirSync(tempRoot, { recursive: true });

const counts = { 'zh-Hant': 252, 'zh-TW': 138 };
for (const [locale, expectedCount] of Object.entries(counts)) {
  const old = superseded[locale];
  const keys = Object.keys(old);
  assert.equal(keys.length, expectedCount, `${locale}: complete PR key set`);
  const current = JSON.parse(fs.readFileSync(
    path.join(root, `imports/i18n/data/${locale}.i18n.json`)));
  for (const key of keys) {
    assert.notEqual(current[key], old[key], `${locale}:${key} reverted to the superseded value`);
    assert.notEqual(current[key], source[key], `${locale}:${key} lost its human translation`);
  }

  const fixture = fs.mkdtempSync(path.join(tempRoot, `${locale}-`));
  try {
    const dataDir = path.join(fixture, 'imports/i18n/data');
    fs.mkdirSync(dataDir, { recursive: true });
    fs.writeFileSync(path.join(dataDir, 'en.i18n.json'), JSON.stringify(source));
    fs.writeFileSync(path.join(dataDir, `${locale}.i18n.json`), JSON.stringify(current));
    const fill = path.join(root, 'releases/translations/fill-translations.mjs');
    const listed = spawnSync(process.execPath, [fill, '--list', locale],
      { cwd: fixture, encoding: 'utf8' });
    assert.equal(listed.status, 0, listed.stderr);
    const offered = JSON.parse(listed.stdout);
    for (const key of keys) assert.equal(key in offered, false, `${locale}:${key} offered for machine filling`);

    const proposals = path.join(fixture, 'machine-proposals.json');
    fs.writeFileSync(proposals, JSON.stringify(old));
    const applied = spawnSync(process.execPath, [fill, '--apply', locale, proposals],
      { cwd: fixture, encoding: 'utf8' });
    assert.equal(applied.status, 0, applied.stderr);
    const after = JSON.parse(fs.readFileSync(path.join(dataDir, `${locale}.i18n.json`)));
    for (const key of keys) assert.equal(after[key], current[key], `${locale}:${key} overwritten by a fill`);
  } finally {
    fs.rmSync(fixture, { recursive: true, force: true });
  }
}

console.log('PR #6695: all 390 human Chinese translations remain protected from machine fills');
