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
const aymara = readLocale('ay');
const tokens = value => [...value.matchAll(
  /__[A-Za-z0-9_]+__|%[A-Za-z]|%{[A-Za-z0-9]+}|{{[A-Za-z0-9]+}}/g,
)].map(([token]) => token).sort();
const tags = value => [...value.matchAll(/<\/?[A-Za-z][^>]*>/g)]
  .map(([tag]) => tag).sort();

const fillResult = spawnSync(process.execPath, [
  path.join(root, 'releases/translations/fill-translations.mjs'),
  '--list',
  'ay',
], { cwd: root, encoding: 'utf8' });
assert.equal(fillResult.status, 0, fillResult.stderr);
assert.equal(Object.keys(JSON.parse(fillResult.stdout)).length, 0,
  'every actionable Aymara value stays translated');

for (const [key, value] of Object.entries(aymara)) {
  if (value !== english[key]) {
    assert.deepEqual(tokens(value), tokens(english[key]),
      `${key}: locale-wide placeholder inventory`);
  }
  assert.deepEqual(tags(value), tags(english[key]),
    `${key}: locale-wide HTML tag inventory`);
}

assert.equal(aymara.accept, 'Iyaw saña');
assert.equal(aymara.settings, 'Wakichawinaka');
assert.deepEqual(tokens(aymara['activity-changedTitle']), ['%s', '%s']);
assert.deepEqual(tokens(aymara['act-deleteCard']),
  ['__board__', '__card__', '__list__', '__swimlane__']);
assert.match(aymara['act-deleteCard'], /tarjeta/);
assert.match(aymara['act-deleteCard'], /pirqa/);
assert.match(aymara['board-members-same-team-only'], /tama/);
assert.match(aymara['import-wekan-file'], /anqäxat apaniña/);
assert.match(aymara['import-wekan-file'], /qillqa-wayaqa/);

console.log('aymaraTranslationProgress: complete locale passed');
