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
const tongan = readLocale('to');
const tokens = value => [...value.matchAll(
  /__[A-Za-z0-9_]+__|%[A-Za-z]|%{[A-Za-z0-9]+}|{{[A-Za-z0-9]+}}/g,
)].map(([token]) => token).sort();
const tags = value => [...value.matchAll(/<\/?[A-Za-z][^>]*>/g)]
  .map(([tag]) => tag).sort();

const fillResult = spawnSync(process.execPath, [
  path.join(root, 'releases/translations/fill-translations.mjs'),
  '--list',
  'to',
], { cwd: root, encoding: 'utf8' });
assert.equal(fillResult.status, 0, fillResult.stderr);
assert.equal(Object.keys(JSON.parse(fillResult.stdout)).length, 0,
  'Tongan has no remaining English placeholders');

for (const [key, value] of Object.entries(tongan)) {
  assert.deepEqual(tokens(value), tokens(english[key]),
    `${key}: locale-wide placeholder inventory`);
  assert.deepEqual(tags(value), tags(english[key]),
    `${key}: locale-wide HTML tag inventory`);
}

assert.equal(tongan.accept, 'Tali');
assert.equal(tongan.cancel, 'Fakataʻeʻaonga');
assert.equal(tongan.save, 'Tauhi');
assert.equal(tongan.search, 'Kumi');
assert.equal(tongan.yes, 'ʻIo');
assert.equal(tongan.no, 'ʻIkai');
assert.equal(tongan.board, 'Papa');
assert.equal(tongan.card, 'Kaati');
assert.equal(tongan.password, 'Lea fufū');
assert.deepEqual(tokens(tongan['activity-changedTitle']), ['%s', '%s']);
assert.deepEqual(tokens(tongan['act-deleteCard']),
  ['__board__', '__card__', '__list__', '__swimlane__']);

console.log('tonganTranslationProgress: all placeholders resolved');
