const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const fillScript = path.join(root, 'releases/translations/fill-translations.mjs');
const result = spawnSync(process.execPath, [fillScript, '--list', 'ee'], {
  cwd: root,
  encoding: 'utf8',
});
assert.equal(result.status, 0, result.stderr);
const remaining = JSON.parse(result.stdout);
assert.equal(Object.keys(remaining).length, 2016);

const english = JSON.parse(
  fs.readFileSync(path.join(root, 'imports/i18n/data/en.i18n.json'), 'utf8'),
);
const ewe = JSON.parse(
  fs.readFileSync(path.join(root, 'imports/i18n/data/ee.i18n.json'), 'utf8'),
);
const tokens = (value) =>
  [
    ...value.matchAll(
      /__[A-Za-z0-9_]+__|%[A-Za-z]|%{[A-Za-z0-9]+}|{{[A-Za-z0-9]+}}/g,
    ),
  ]
    .map(([token]) => token)
    .sort();
const tags = (value) =>
  [...value.matchAll(/<\/?[A-Za-z][^>]*>/g)]
    .map(([tag]) => tag)
    .sort();

for (const [key, value] of Object.entries(ewe)) {
  if (value !== english[key]) {
    assert.deepEqual(tokens(value), tokens(english[key]), key);
  }
  assert.deepEqual(tags(value), tags(english[key]), key);
}

assert.equal(ewe.accept, 'Lɔ̃ ɖe edzi');
assert.deepEqual(tokens(ewe['activity-changedTitle']), ['%s', '%s']);
assert.deepEqual(tokens(ewe['act-deleteCard']), [
  '__board__',
  '__card__',
  '__list__',
  '__swimlane__',
]);
assert.deepEqual(tokens(ewe['act-removeChecklistItem']), [
  '__board__',
  '__card__',
  '__checkList__',
  '__checklistItem__',
  '__list__',
  '__swimlane__',
]);
assert.match(ewe['act-createBoard'], /kpekpeɖeŋu/);
assert.match(ewe['act-addComment'], /nyaŋuɖoɖo/);
assert.deepEqual(tokens(ewe['act-moveCard']), [
  '__board__',
  '__card__',
  '__list__',
  '__oldList__',
  '__oldSwimlane__',
  '__swimlane__',
]);
assert.deepEqual(tokens(ewe['act-moveCardToOtherBoard']), [
  '__board__',
  '__card__',
  '__list__',
  '__oldBoard__',
  '__oldList__',
  '__oldSwimlane__',
  '__swimlane__',
]);
assert.deepEqual(tokens(ewe['activity-imported']), ['%s', '%s', '%s']);
assert.deepEqual(tokens(ewe['activity-checklist-completed-card']), [
  '__board__',
  '__card__',
  '__checklist__',
  '__list__',
  '__swimlane__',
]);
assert.match(ewe['allboards.edit-workspace-icon'], /markdown/);
assert.deepEqual(tokens(ewe['activity-dueDate']), ['%s', '%s']);
assert.match(ewe['list-width-error-message'], /270/);
assert.match(ewe['set-swimlane-height'], /tsiƒuƒu/);
assert.match(ewe['convertChecklistItemToCardPopup-title'], /kaɖi/);
