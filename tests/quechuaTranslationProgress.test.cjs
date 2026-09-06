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
const quechua = readLocale('qu');
const tokens = value => [...value.matchAll(
  /__[A-Za-z0-9_]+__|%[A-Za-z]|%{[A-Za-z0-9]+}|{{[A-Za-z0-9]+}}/g,
)].map(([token]) => token).sort();
const tags = value => [...value.matchAll(/<\/?[A-Za-z][^>]*>/g)]
  .map(([tag]) => tag).sort();

const fillResult = spawnSync(process.execPath, [
  path.join(root, 'releases/translations/fill-translations.mjs'),
  '--list',
  'qu',
], { cwd: root, encoding: 'utf8' });
assert.equal(fillResult.status, 0, fillResult.stderr);
assert.equal(Object.keys(JSON.parse(fillResult.stdout)).length, 0,
  'every actionable Quechua value stays translated');

assert.deepEqual(Object.keys(quechua), Object.keys(english),
  'Quechua keys and their order match English');
for (const [key, value] of Object.entries(quechua)) {
  assert.deepEqual(tokens(value), tokens(english[key]),
    `${key}: locale-wide placeholder inventory`);
  assert.deepEqual(tags(value), tags(english[key]),
    `${key}: locale-wide HTML tag inventory`);
}

assert.equal(quechua.accept, 'Kay willaymi: Chaskiy');
assert.equal(quechua.settings, 'Allichaykuna');
assert.match(quechua['act-deleteCard'], /Qullusqa Tarjeta/);
assert.deepEqual(tokens(quechua['act-deleteCard']),
  ['__board__', '__card__', '__list__', '__swimlane__']);

console.log('quechuaTranslationProgress: complete locale passed');
