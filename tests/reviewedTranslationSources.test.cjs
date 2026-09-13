'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const tempRoot = path.join(root, '.tools/tmp/node-suite-repairs');
fs.mkdirSync(tempRoot, { recursive: true });
const fixture = fs.mkdtempSync(path.join(tempRoot, 'reviewed-'));
const write = (file, value) => {
  const target = path.join(fixture, file);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, JSON.stringify(value));
};
const run = args => {
  const result = spawnSync(process.execPath,
    [path.join(root, 'releases/translations/fill-translations.mjs'), ...args],
    { cwd: fixture, encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  return result.stdout;
};
try {
  const source = { info: 'Version', sentence: 'Please wait', changed: 'New source' };
  write('imports/i18n/data/en.i18n.json', source);
  write('imports/i18n/data/fur.i18n.json', source);
  write('imports/i18n/data/fi.i18n.json', source);
  write('releases/translations/audited-reviews.json', [
    { locale: 'fur', key: 'info', value: 'Version' },
    { locale: 'fur', key: 'changed', value: 'Old source' },
  ]);
  assert.deepEqual(JSON.parse(run(['--list', 'fur'])),
    { sentence: 'Please wait', changed: 'New source' },
    'only exact reviewed source matches are protected');
  assert.deepEqual(JSON.parse(run(['--list', 'fi'])), source,
    'a shared term in one locale must not hide another locale’s missing text');
  write('fill.json', { info: 'Replacement', sentence: 'Spiete', changed: 'Gnove font' });
  run(['--apply', 'fur', path.join(fixture, 'fill.json')]);
  assert.deepEqual(JSON.parse(fs.readFileSync(
    path.join(fixture, 'imports/i18n/data/fur.i18n.json'), 'utf8')),
  { info: 'Version', sentence: 'Spiete', changed: 'Gnove font' },
  'filling preserves reviewed shared terms while repairing actual placeholders');
} finally {
  fs.rmSync(fixture, { recursive: true, force: true });
}
console.log('reviewedTranslationSources: locale isolation, stale review rejection and safe filling passed');
