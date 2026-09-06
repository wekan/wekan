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
const hawaiian = readLocale('haw');
const tokens = value => [...value.matchAll(
  /__[A-Za-z0-9_]+__|%[0-9$]*[A-Za-z]|%{[A-Za-z0-9]+}|{{[A-Za-z0-9]+}}/g,
)].map(([token]) => token).sort();
const tags = value => [...value.matchAll(/<\/?[A-Za-z][^>]*>/g)]
  .map(([tag]) => tag).sort();

const fillResult = spawnSync(process.execPath, [
  path.join(root, 'releases/translations/fill-translations.mjs'),
  '--list',
  'haw',
], { cwd: root, encoding: 'utf8' });
assert.equal(fillResult.status, 0, fillResult.stderr);
assert.equal(Object.keys(JSON.parse(fillResult.stdout)).length, 0,
  'every actionable Hawaiian value stays translated');

assert.deepEqual(Object.keys(hawaiian), Object.keys(english),
  'Hawaiian key order follows the English source');
for (const [key, value] of Object.entries(hawaiian)) {
  assert.deepEqual(tokens(value), tokens(english[key]),
    `${key}: locale-wide placeholder inventory`);
  assert.deepEqual(tags(value), tags(english[key]),
    `${key}: locale-wide HTML tag inventory`);
}

assert.equal(hawaiian.accept, 'ʻae');
assert.equal(hawaiian.actions, 'nā hana');
assert.equal(hawaiian.board, 'Papa');
assert.equal(hawaiian.card, 'Kāleka');
assert.equal(hawaiian.list, 'Papa inoa');
assert.equal(hawaiian.save, 'Mālama');
assert.equal(hawaiian.search, 'Huli');
assert.deepEqual(tokens(hawaiian['activity-changedTitle']), ['%s', '%s']);
assert.deepEqual(tokens(hawaiian['act-deleteCard']),
  ['__board__', '__card__', '__list__', '__swimlane__']);
assert.deepEqual(tokens(hawaiian['restore-list-swimlanes-done']),
  ['__remaining__', '__restored__']);

console.log('hawaiianTranslationProgress: complete locale passed');
