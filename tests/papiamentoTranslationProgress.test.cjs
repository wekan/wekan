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
const papiamento = readLocale('pap');
const tokens = value => [...value.matchAll(
  /__[A-Za-z0-9_]+__|%[0-9$]*[A-Za-z]|%{[A-Za-z0-9]+}|{{[A-Za-z0-9]+}}/g,
)].map(([token]) => token).sort();
const tags = value => [...value.matchAll(/<\/?[A-Za-z][^>]*>/g)]
  .map(([tag]) => tag).sort();

const fillResult = spawnSync(process.execPath, [
  path.join(root, 'releases/translations/fill-translations.mjs'),
  '--list',
  'pap',
], { cwd: root, encoding: 'utf8' });
assert.equal(fillResult.status, 0, fillResult.stderr);
assert.equal(Object.keys(JSON.parse(fillResult.stdout)).length, 0,
  'every actionable Papiamento value stays translated');

assert.deepEqual(Object.keys(papiamento), Object.keys(english),
  'Papiamento key order follows the English source');
for (const [key, value] of Object.entries(papiamento)) {
  assert.deepEqual(tokens(value), tokens(english[key]),
    `${key}: locale-wide placeholder inventory`);
  assert.deepEqual(tags(value), tags(english[key]),
    `${key}: locale-wide HTML tag inventory`);
}

assert.equal(papiamento.board, 'Tabla');
assert.equal(papiamento.card, 'Karchi');
assert.equal(papiamento.settings, 'Konfigurashon');
assert.equal(papiamento.download, 'Deskargá');
assert.equal(papiamento['select-none'], 'No selektá niun');
assert.deepEqual(tokens(papiamento['activity-changedTitle']), ['%s', '%s']);
assert.deepEqual(tokens(papiamento['act-deleteCard']),
  ['__board__', '__card__', '__list__', '__swimlane__']);
assert.deepEqual(tokens(papiamento['restore-list-swimlanes-done']),
  ['__remaining__', '__restored__']);

console.log('papiamentoTranslationProgress: complete locale passed');
