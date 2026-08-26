const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const fillScript = path.join(root, 'releases/translations/fill-translations.mjs');
const result = spawnSync(process.execPath, [fillScript, '--list', 'kl'], {
  cwd: root,
  encoding: 'utf8',
});
assert.equal(result.status, 0, result.stderr);
const remaining = JSON.parse(result.stdout);
assert.equal(Object.keys(remaining).length, 2067);

const english = JSON.parse(fs.readFileSync(
  path.join(root, 'imports/i18n/data/en.i18n.json'), 'utf8'));
const greenlandic = JSON.parse(fs.readFileSync(
  path.join(root, 'imports/i18n/data/kl.i18n.json'), 'utf8'));
const tokens = (value) => [...value.matchAll(
  /__[A-Za-z0-9_]+__|%[A-Za-z]|%{[A-Za-z0-9]+}|{{[A-Za-z0-9]+}}/g)]
  .map(([token]) => token).sort();
const tags = (value) => [...value.matchAll(/<\/?[A-Za-z][^>]*>/g)]
  .map(([tag]) => tag).sort();

for (const [key, value] of Object.entries(greenlandic)) {
  if (value !== english[key]) {
    assert.deepEqual(tokens(value), tokens(english[key]), key);
  }
  assert.deepEqual(tags(value), tags(english[key]), key);
}

assert.equal(greenlandic.accept, 'Akueri');
assert.deepEqual(tokens(greenlandic['activity-changedTitle']), ['%s', '%s']);
assert.deepEqual(tokens(greenlandic['act-removeChecklistItem']),
  ['__board__', '__card__', '__checkList__', '__checklistItem__', '__list__',
    '__swimlane__']);
assert.match(greenlandic['act-createBoard'], /ilisarnaat/);
assert.equal(greenlandic.actions, 'Iliuutsit');
assert.deepEqual(tokens(greenlandic['act-moveCardToOtherBoard']),
  ['__board__', '__card__', '__list__', '__oldBoard__', '__oldList__',
    '__oldSwimlane__', '__swimlane__']);
assert.equal(greenlandic['workspace-settings'],
  'Suliffiup aaqqissugaanera');
