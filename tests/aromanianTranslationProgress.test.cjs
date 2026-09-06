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
const aromanian = readLocale('rup');
const tokens = value => [...value.matchAll(
  /__[A-Za-z0-9_]+__|%[A-Za-z]|%\d+\$[A-Za-z]|%{[A-Za-z0-9]+}|{{[A-Za-z0-9]+}}/g,
)].map(([token]) => token).sort();
const tags = value => [...value.matchAll(/<\/?[A-Za-z][^>]*>/g)]
  .map(([tag]) => tag).sort();

const fillResult = spawnSync(process.execPath, [
  path.join(root, 'releases/translations/fill-translations.mjs'),
  '--list',
  'rup',
], { cwd: root, encoding: 'utf8' });
assert.equal(fillResult.status, 0, fillResult.stderr);
assert.equal(Object.keys(JSON.parse(fillResult.stdout)).length, 0,
  'Aromanian has no remaining English placeholders');
assert.deepEqual(Object.keys(aromanian), Object.keys(english),
  'Aromanian keys retain English source order');

for (const [key, value] of Object.entries(aromanian)) {
  assert.equal(typeof value, 'string', `${key}: Aromanian value is text`);
  assert.deepEqual(tokens(value), tokens(english[key]),
    `${key}: locale-wide placeholder inventory`);
  assert.deepEqual(tags(value), tags(english[key]),
    `${key}: locale-wide HTML tag inventory`);
}

assert.equal(aromanian.accept, 'Aceptã');
assert.equal(aromanian.cancel, 'Anuledz');
assert.equal(aromanian.search, 'Caftu');
assert.equal(aromanian.board, 'Tabelã');
assert.equal(aromanian.card, 'Cartã');
assert.equal(aromanian.password, 'Zbor di intrari');
assert.deepEqual(tokens(aromanian['act-deleteCard']),
  ['__board__', '__card__', '__list__', '__swimlane__']);

console.log('aromanianTranslationProgress: complete locale passed');
