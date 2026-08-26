const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const fillScript = path.join(root, 'releases/translations/fill-translations.mjs');
const result = spawnSync(process.execPath, [fillScript, '--list', 'ks'], {
  cwd: root,
  encoding: 'utf8',
});
assert.equal(result.status, 0, result.stderr);
const remaining = JSON.parse(result.stdout);
assert.equal(Object.keys(remaining).length, 1917);

const english = JSON.parse(fs.readFileSync(
  path.join(root, 'imports/i18n/data/en.i18n.json'), 'utf8'));
const kashmiri = JSON.parse(fs.readFileSync(
  path.join(root, 'imports/i18n/data/ks.i18n.json'), 'utf8'));
const tokens = (value) => [...value.matchAll(
  /__[A-Za-z0-9_]+__|%[A-Za-z]|%{[A-Za-z0-9]+}|{{[A-Za-z0-9]+}}/g)]
  .map(([token]) => token).sort();
const tags = (value) => [...value.matchAll(/<\/?[A-Za-z][^>]*>/g)]
  .map(([tag]) => tag).sort();

for (const [key, value] of Object.entries(kashmiri)) {
  if (value !== english[key]) {
    assert.deepEqual(tokens(value), tokens(english[key]), key);
  }
  assert.deepEqual(tags(value), tags(english[key]), key);
}

assert.equal(kashmiri.accept, 'قبول کریو');
assert.deepEqual(tokens(kashmiri['activity-changedTitle']), ['%s', '%s']);
assert.deepEqual(tokens(kashmiri['act-removeChecklistItem']),
  ['__board__', '__card__', '__checkList__', '__checklistItem__', '__list__',
    '__swimlane__']);
assert.match(kashmiri['act-createBoard'], /بنٲو/);
assert.deepEqual(tokens(kashmiri['act-moveCardToOtherBoard']),
  ['__board__', '__card__', '__list__', '__oldBoard__', '__oldList__',
    '__oldSwimlane__', '__swimlane__']);
assert.equal(kashmiri['workspace-settings'], 'کٲم جایہِ ترتیبات');
assert.deepEqual(tokens(kashmiri['activity-dueDate']), ['%s', '%s']);
assert.match(kashmiri['set-swimlane-height'], /وَتھ/);
assert.deepEqual(tokens(kashmiri['avatar-too-big']), ['__size__']);
assert.deepEqual(tags(kashmiri['board-private-info']),
  ['</strong>', '<strong>']);
assert.deepEqual(tokens(kashmiri['board-open-and-move-between-remaining-and-workspaces']),
  ['__workspaces__']);
assert.deepEqual(tags(kashmiri['board-public-info']),
  ['</strong>', '<strong>']);
