const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const fillScript = path.join(root, 'releases/translations/fill-translations.mjs');
const result = spawnSync(process.execPath, [fillScript, '--list', 'ht'], {
  cwd: root,
  encoding: 'utf8',
});
assert.equal(result.status, 0, result.stderr);
const remaining = JSON.parse(result.stdout);
assert.equal(Object.keys(remaining).length, 2017);

const english = JSON.parse(fs.readFileSync(path.join(root, 'imports/i18n/data/en.i18n.json'), 'utf8'));
const creole = JSON.parse(fs.readFileSync(path.join(root, 'imports/i18n/data/ht.i18n.json'), 'utf8'));
const tokens = (value) => [...value.matchAll(/__[A-Za-z0-9_]+__|%[A-Za-z]|%{[A-Za-z0-9]+}|{{[A-Za-z0-9]+}}/g)].map(([token]) => token).sort();
const tags = (value) => [...value.matchAll(/<\/?[A-Za-z][^>]*>/g)].map(([tag]) => tag).sort();

for (const [key, value] of Object.entries(creole)) {
  if (value !== english[key]) assert.deepEqual(tokens(value), tokens(english[key]), key);
  assert.deepEqual(tags(value), tags(english[key]), key);
}

assert.equal(creole.accept, 'Aksepte');
assert.match(creole['act-createBoard'], /tablo/i);
assert.match(creole['act-createCard'], /kat/i);
assert.deepEqual(tokens(creole['act-setCustomField']),
  ['__board__', '__card__', '__customFieldValue__', '__customField__', '__list__', '__swimlane__']);
assert.deepEqual(tokens(creole['act-moveCard']),
  ['__board__', '__card__', '__list__', '__oldList__', '__oldSwimlane__', '__swimlane__']);
assert.equal(creole['allboards.workspaces'], 'Espas travay');
assert.equal(creole['home-board-badge'], 'Tablo Akèy (ouvri apre koneksyon)');
assert.equal(creole['set-list-width-value'], 'Lajè lis (piksèl)');
