const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const fillScript = path.join(root, 'releases/translations/fill-translations.mjs');
const result = spawnSync(process.execPath, [fillScript, '--list', 'ff'], {
  cwd: root,
  encoding: 'utf8',
});
assert.equal(result.status, 0, result.stderr);
const remaining = JSON.parse(result.stdout);
// This decreases by exactly one for every directly filled placeholder. Keeping
// the count explicit makes a skipped or oversized batch visible while the full
// token and tag inventory checks below protect the translated values.
assert.equal(Object.keys(remaining).length, 617);

const english = JSON.parse(
  fs.readFileSync(path.join(root, 'imports/i18n/data/en.i18n.json'), 'utf8'),
);
const fulah = JSON.parse(
  fs.readFileSync(path.join(root, 'imports/i18n/data/ff.i18n.json'), 'utf8'),
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

for (const [key, value] of Object.entries(fulah)) {
  if (value !== english[key]) {
    assert.deepEqual(tokens(value), tokens(english[key]), key);
  }
  assert.deepEqual(tags(value), tags(english[key]), key);
}

assert.equal(fulah.accept, 'Jaɓ');
assert.deepEqual(tokens(fulah['activity-changedTitle']), ['%s', '%s']);
assert.deepEqual(tokens(fulah['act-deleteCard']), [
  '__board__',
  '__card__',
  '__list__',
  '__swimlane__',
]);
assert.deepEqual(tokens(fulah['act-removeChecklistItem']), [
  '__board__',
  '__card__',
  '__checkList__',
  '__checklistItem__',
  '__list__',
  '__swimlane__',
]);
assert.match(fulah['act-createBoard'], /alluwal/);
assert.match(fulah['act-addComment'], /yowre/);
assert.deepEqual(tokens(fulah['act-moveCardToOtherBoard']), [
  '__board__',
  '__card__',
  '__list__',
  '__oldBoard__',
  '__oldList__',
  '__oldSwimlane__',
  '__swimlane__',
]);
assert.deepEqual(tokens(fulah['activity-imported']), ['%s', '%s', '%s']);
assert.deepEqual(tokens(fulah['activity-checklist-completed-card']), [
  '__board__',
  '__card__',
  '__checklist__',
  '__list__',
  '__swimlane__',
]);
assert.match(fulah['allboards.add-workspace'], /nokku golle/);
assert.match(fulah['allboards.edit-workspace-icon'], /markdown/);
