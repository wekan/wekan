const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const readLocale = code => JSON.parse(fs.readFileSync(
  path.join(root, `imports/i18n/data/${code}.i18n.json`), 'utf8',
));
const english = readLocale('en');
const romansh = readLocale('rm');
const tokens = value => [...value.matchAll(
  /__[A-Za-z0-9_]+__|%[0-9$]*[A-Za-z]|%{[A-Za-z0-9]+}|{{[A-Za-z0-9]+}}/g,
)].map(([token]) => token).sort();
const tags = value => [...value.matchAll(/<\/?[A-Za-z][^>]*>/g)]
  .map(([tag]) => tag).sort();

const fillResult = spawnSync(process.execPath, [
  path.join(root, 'releases/translations/fill-translations.mjs'), '--list', 'rm',
], { cwd: root, encoding: 'utf8' });
assert.equal(fillResult.status, 0, fillResult.stderr);
assert.equal(Object.keys(JSON.parse(fillResult.stdout)).length, 0,
  'every actionable Romansh value stays translated');
assert.deepEqual(Object.keys(romansh), Object.keys(english),
  'Romansh key order follows the English source');
for (const [key, value] of Object.entries(romansh)) {
  assert.deepEqual(tokens(value), tokens(english[key]), `${key}: placeholder inventory`);
  assert.deepEqual(tags(value), tags(english[key]), `${key}: HTML tag inventory`);
}

assert.equal(romansh.board, 'Tabella');
assert.equal(romansh.card, 'Carta');
assert.equal(romansh.list, 'Glista');
assert.equal(romansh.settings, 'Parameters');
assert.equal(romansh.delete, 'Stizzar');
assert.equal(romansh['enable-permanent-delete'],
  'Activar la stizzada permanenta per l’administratur global');
assert.deepEqual(tokens(romansh['restore-list-swimlanes-done']),
  ['__remaining__', '__restored__']);

console.log('romanshTranslationProgress: complete locale passed');
