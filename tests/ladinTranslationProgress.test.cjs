const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const readLocale = code => JSON.parse(fs.readFileSync(
  path.join(root, `imports/i18n/data/${code}.i18n.json`),
  'utf8',
));
const english = readLocale('en');
const ladin = readLocale('lld');
const tokens = value => [...value.matchAll(
  /__[A-Za-z0-9_]+__|%[0-9$]*[A-Za-z]|%{[A-Za-z0-9]+}|{{[A-Za-z0-9]+}}/g,
)].map(([token]) => token).sort();
const tags = value => [...value.matchAll(/<\/?[A-Za-z][^>]*>/g)]
  .map(([tag]) => tag).sort();

const fillResult = spawnSync(process.execPath, [
  path.join(root, 'releases/translations/fill-translations.mjs'),
  '--list',
  'lld',
], { cwd: root, encoding: 'utf8' });
assert.equal(fillResult.status, 0, fillResult.stderr);
assert.equal(Object.keys(JSON.parse(fillResult.stdout)).length, 0,
  'every actionable Ladin value stays translated');

assert.deepEqual(Object.keys(ladin), Object.keys(english),
  'Ladin key order follows the English source');
for (const [key, value] of Object.entries(ladin)) {
  assert.deepEqual(tokens(value), tokens(english[key]),
    `${key}: locale-wide placeholder inventory`);
  assert.deepEqual(tags(value), tags(english[key]),
    `${key}: locale-wide HTML tag inventory`);
}

assert.equal(ladin.board, 'Tofl');
assert.equal(ladin.card, 'Ciarta');
assert.equal(ladin.settings, 'Impostazions');
assert.equal(ladin.activities, 'Ativités');
assert.equal(ladin['cpu-cores-suffix'], 'nuclei');
assert.deepEqual(tokens(ladin['activity-changedTitle']), ['%s', '%s']);
assert.deepEqual(tokens(ladin['restore-list-swimlanes-done']),
  ['__remaining__', '__restored__']);

console.log('ladinTranslationProgress: complete locale passed');
