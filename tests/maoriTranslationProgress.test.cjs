const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const fillScript = path.join(root, 'releases/translations/fill-translations.mjs');
const result = spawnSync(process.execPath, [fillScript, '--list', 'mi'], {
  cwd: root,
  encoding: 'utf8',
});
assert.equal(result.status, 0, result.stderr);
const remaining = JSON.parse(result.stdout);
assert.equal(Object.keys(remaining).length, 2067);

const english = JSON.parse(fs.readFileSync(
  path.join(root, 'imports/i18n/data/en.i18n.json'), 'utf8'));
const maori = JSON.parse(fs.readFileSync(
  path.join(root, 'imports/i18n/data/mi.i18n.json'), 'utf8'));
const tokens = (value) => [...value.matchAll(
  /__[A-Za-z0-9_]+__|%[A-Za-z]|%{[A-Za-z0-9]+}|{{[A-Za-z0-9]+}}/g)]
  .map(([token]) => token).sort();
const tags = (value) => [...value.matchAll(/<\/?[A-Za-z][^>]*>/g)]
  .map(([tag]) => tag).sort();

for (const [key, value] of Object.entries(maori)) {
  if (value !== english[key]) {
    assert.deepEqual(tokens(value), tokens(english[key]), key);
  }
  assert.deepEqual(tags(value), tags(english[key]), key);
}

assert.equal(maori.accept, 'Whakaae');
assert.deepEqual(tokens(maori['activity-changedTitle']), ['%s', '%s']);
assert.deepEqual(tokens(maori['act-deleteCard']),
  ['__board__', '__card__', '__list__', '__swimlane__']);
assert.match(maori['board-members-same-org-only'], /Whakahaere/);
assert.match(maori['board-members-same-team-only'], /Tīma/);
assert.deepEqual(tokens(maori['due-date-changed-times']), ['%s']);
assert.deepEqual(tokens(maori['act-removeChecklistItem']),
  ['__board__', '__card__', '__checkList__', '__checklistItem__', '__list__',
    '__swimlane__']);
assert.match(maori['act-addAttachment'], /āpitihanga/);
assert.match(maori['act-addChecklist'], /rārangi arowhai/);
assert.match(maori['act-createCustomField'], /āpure ritenga/);
assert.match(maori['act-archivedBoard'], /Pūranga/);
assert.deepEqual(tokens(maori['act-moveCardToOtherBoard']),
  ['__board__', '__card__', '__list__', '__oldBoard__', '__oldList__',
    '__oldSwimlane__', '__swimlane__']);
assert.deepEqual(tokens(maori['activity-imported']), ['%s', '%s', '%s']);
assert.deepEqual(tokens(maori['activity-checklist-completed-card']),
  ['__board__', '__card__', '__checklist__', '__list__', '__swimlane__']);
assert.equal(maori['allboards.workspaces'], 'Ngā mokowāmahi');
assert.match(maori['allboards.edit-workspace-icon'], /markdown/);
