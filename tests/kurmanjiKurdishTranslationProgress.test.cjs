const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const fillScript = path.join(root, 'releases/translations/fill-translations.mjs');
const result = spawnSync(process.execPath, [fillScript, '--list', 'ku'], {
  cwd: root,
  encoding: 'utf8',
});
assert.equal(result.status, 0, result.stderr);
const remaining = JSON.parse(result.stdout);
assert.equal(Object.keys(remaining).length, 1917);

const english = JSON.parse(fs.readFileSync(
  path.join(root, 'imports/i18n/data/en.i18n.json'), 'utf8'));
const kurmanji = JSON.parse(fs.readFileSync(
  path.join(root, 'imports/i18n/data/ku.i18n.json'), 'utf8'));
const tokens = (value) => [...value.matchAll(
  /__[A-Za-z0-9_]+__|%[A-Za-z]|%{[A-Za-z0-9]+}|{{[A-Za-z0-9]+}}/g)]
  .map(([token]) => token).sort();
const tags = (value) => [...value.matchAll(/<\/?[A-Za-z][^>]*>/g)]
  .map(([tag]) => tag).sort();

for (const [key, value] of Object.entries(kurmanji)) {
  if (value !== english[key]) {
    assert.deepEqual(tokens(value), tokens(english[key]), key);
  }
  assert.deepEqual(tags(value), tags(english[key]), key);
}

assert.equal(kurmanji.accept, 'Bipejirîne');
assert.deepEqual(tokens(kurmanji['activity-changedTitle']), ['%s', '%s']);
assert.deepEqual(tokens(kurmanji['act-deleteCard']),
  ['__board__', '__card__', '__list__', '__swimlane__']);
assert.match(kurmanji['board-members-same-org-only'], /rêxistin/);
assert.match(kurmanji['board-members-same-team-only'], /tîm/);
assert.deepEqual(tokens(kurmanji['act-removeChecklistItem']),
  ['__board__', '__card__', '__checkList__', '__checklistItem__', '__list__',
    '__swimlane__']);
assert.deepEqual(tokens(kurmanji['act-setCustomField']),
  ['__board__', '__card__', '__customFieldValue__', '__customField__',
    '__list__', '__swimlane__']);
assert.match(kurmanji['act-archivedSwimlane'], /Rêça.*arşîvê/);
assert.deepEqual(tokens(kurmanji['act-moveCardToOtherBoard']),
  ['__board__', '__card__', '__list__', '__oldBoard__', '__oldList__',
    '__oldSwimlane__', '__swimlane__']);
assert.deepEqual(tokens(kurmanji['activity-imported']), ['%s', '%s', '%s']);
assert.deepEqual(tokens(kurmanji['activity-checked-item']), ['%s', '%s', '%s']);
assert.deepEqual(tokens(kurmanji['activity-checklist-completed-card']),
  ['__board__', '__card__', '__checklist__', '__list__', '__swimlane__']);
assert.equal(kurmanji['allboards.workspaces'], 'Cihên xebatê');
assert.match(kurmanji['allboards.edit-workspace-icon'], /markdown/);
assert.match(kurmanji['archive-permanent-delete-disabled-hint'],
  /Panela rêveber.*Rêveberê Giştî/);
assert.match(kurmanji['home-board-empty'], /yek depo/);
assert.deepEqual(tokens(kurmanji['activity-dueDate']), ['%s', '%s']);
assert.match(kurmanji['list-width-error-message'], /270/);
assert.equal(kurmanji['set-swimlane-height'],
  'Bilindahiya rêçê saz bike');
assert.match(kurmanji['keyboard-shortcuts-enabled'], /klavyeyê/);
assert.deepEqual(tokens(kurmanji['and-n-other-card']), ['__count__']);
assert.deepEqual(tokens(kurmanji['avatar-too-big']), ['__size__']);
assert.deepEqual(tokens(kurmanji['board-nb-stars']), ['%s']);
assert.deepEqual(tags(kurmanji['board-private-info']),
  ['</strong>', '<strong>']);
assert.match(kurmanji['board-private-info'], /taybet/);
assert.equal(kurmanji['public-boards'], 'Depoyên giştî');
assert.deepEqual(tags(kurmanji['board-public-info']),
  ['</strong>', '<strong>']);
assert.deepEqual(tokens(
  kurmanji['board-open-and-move-between-remaining-and-workspaces']),
['__workspaces__']);
assert.match(kurmanji['enter-zoom-level'], /50-300%/);
assert.deepEqual(tokens(kurmanji['card-comments-title']), ['%s']);
assert.match(kurmanji['swimlane-archive-suggest'], /rêç.*arşîv/);
assert.equal(kurmanji['board-view-table'], 'Tablo');
