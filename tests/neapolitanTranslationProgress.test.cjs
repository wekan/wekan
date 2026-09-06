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
const neapolitan = readLocale('nap');
const tokens = value => [...value.matchAll(
  /__[A-Za-z0-9_]+__|%[0-9$]*[A-Za-z]|%{[A-Za-z0-9]+}|{{[A-Za-z0-9]+}}/g,
)].map(([token]) => token).sort();
const tags = value => [...value.matchAll(/<\/?[A-Za-z][^>]*>/g)]
  .map(([tag]) => tag).sort();

const fillResult = spawnSync(process.execPath, [
  path.join(root, 'releases/translations/fill-translations.mjs'),
  '--list',
  'nap',
], { cwd: root, encoding: 'utf8' });
assert.equal(fillResult.status, 0, fillResult.stderr);
assert.equal(Object.keys(JSON.parse(fillResult.stdout)).length, 0,
  'every actionable Neapolitan value stays translated');

assert.deepEqual(Object.keys(neapolitan), Object.keys(english),
  'Neapolitan key order follows the English source');
for (const [key, value] of Object.entries(neapolitan)) {
  assert.deepEqual(tokens(value), tokens(english[key]),
    `${key}: locale-wide placeholder inventory`);
  assert.deepEqual(tags(value), tags(english[key]),
    `${key}: locale-wide HTML tag inventory`);
}

assert.equal(neapolitan.board, 'Tavula');
assert.equal(neapolitan.card, 'Carta');
assert.equal(neapolitan.settings, 'Mpustaziune');
assert.equal(neapolitan.save, 'Sarvà');
assert.equal(neapolitan.delete, 'Scancellà');
assert.deepEqual(tokens(neapolitan['activity-changedTitle']), ['%s', '%s']);
assert.deepEqual(tokens(neapolitan['act-deleteCard']),
  ['__board__', '__card__', '__list__', '__swimlane__']);
assert.deepEqual(tokens(neapolitan['restore-list-swimlanes-done']),
  ['__remaining__', '__restored__']);

console.log('neapolitanTranslationProgress: complete locale passed');
