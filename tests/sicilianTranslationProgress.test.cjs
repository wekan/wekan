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
const sicilian = readLocale('scn');
const tokens = value => [...value.matchAll(
  /__[A-Za-z0-9_]+__|%[0-9$]*[A-Za-z]|%{[A-Za-z0-9]+}|{{[A-Za-z0-9]+}}/g,
)].map(([token]) => token).sort();
const tags = value => [...value.matchAll(/<\/?[A-Za-z][^>]*>/g)]
  .map(([tag]) => tag).sort();

const fillResult = spawnSync(process.execPath, [
  path.join(root, 'releases/translations/fill-translations.mjs'),
  '--list',
  'scn',
], { cwd: root, encoding: 'utf8' });
assert.equal(fillResult.status, 0, fillResult.stderr);
assert.equal(Object.keys(JSON.parse(fillResult.stdout)).length, 0,
  'every actionable Sicilian value stays translated');

assert.deepEqual(Object.keys(sicilian), Object.keys(english),
  'Sicilian key order follows the English source');
for (const [key, value] of Object.entries(sicilian)) {
  assert.deepEqual(tokens(value), tokens(english[key]),
    `${key}: locale-wide placeholder inventory`);
  assert.deepEqual(tags(value), tags(english[key]),
    `${key}: locale-wide HTML tag inventory`);
}

assert.equal(sicilian.board, 'Tavula');
assert.equal(sicilian.card, 'Carta');
assert.equal(sicilian.settings, 'Mpustazzioni');
assert.equal(sicilian.save, 'Sarvari');
assert.equal(sicilian.delete, 'Cancillari');
assert.equal(sicilian['act-deleteCard'],
  'carta __card__ cancellata dâ lista __list__ ntâ swimlane __swimlane__ ntâ tàvula __board__');
assert.deepEqual(tokens(sicilian['activity-changedTitle']), ['%s', '%s']);
assert.deepEqual(tokens(sicilian['restore-list-swimlanes-done']),
  ['__remaining__', '__restored__']);

console.log('sicilianTranslationProgress: complete locale passed');
