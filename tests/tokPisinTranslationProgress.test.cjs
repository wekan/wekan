const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const fillScript = path.join(root, 'releases/translations/fill-translations.mjs');
const result = spawnSync(process.execPath, [fillScript, '--list', 'tpi'], {
  cwd: root,
  encoding: 'utf8',
});
assert.equal(result.status, 0, result.stderr);
assert.equal(Object.keys(JSON.parse(result.stdout)).length, 0);

const english = JSON.parse(fs.readFileSync(path.join(root, 'imports/i18n/data/en.i18n.json'), 'utf8'));
const tokPisin = JSON.parse(fs.readFileSync(path.join(root, 'imports/i18n/data/tpi.i18n.json'), 'utf8'));
const tokens = value => [...value.matchAll(/__[A-Za-z0-9]+__|%\d*\$?[A-Za-z]|%\{[A-Za-z0-9]+\}|{{[A-Za-z0-9]+}}/g)]
  .map(([token]) => token).sort();
const tags = value => [...value.matchAll(/<\/?[A-Za-z][^>]*>/g)].map(([tag]) => tag).sort();

for (const [key, value] of Object.entries(tokPisin)) {
  assert.deepEqual(tokens(value), tokens(english[key]), key);
  assert.deepEqual(tags(value), tags(english[key]), key);
}

assert.equal(tokPisin.accept, 'Kisim');
assert.match(tokPisin['act-deleteCard'], /Rausim pinis kat/);
assert.match(tokPisin['archive-permanent-delete-disabled-hint'], /edmin panel/i);
assert.match(tokPisin['archive-permanent-delete-disabled-hint'], /rausim olgeta/i);
