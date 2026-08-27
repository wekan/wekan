const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const fillScript = path.join(root, 'releases/translations/fill-translations.mjs');
const result = spawnSync(process.execPath, [fillScript, '--list', 'kw'], {
  cwd: root,
  encoding: 'utf8',
});
assert.equal(result.status, 0, result.stderr);
const remaining = JSON.parse(result.stdout);
assert.equal(Object.keys(remaining).length, 1767);

const english = JSON.parse(fs.readFileSync(
  path.join(root, 'imports/i18n/data/en.i18n.json'), 'utf8'));
const cornish = JSON.parse(fs.readFileSync(
  path.join(root, 'imports/i18n/data/kw.i18n.json'), 'utf8'));
const tokens = (value) => [...value.matchAll(
  /__[A-Za-z0-9_]+__|%[A-Za-z]|%{[A-Za-z0-9]+}|{{[A-Za-z0-9]+}}/g)]
  .map(([token]) => token).sort();
const tags = (value) => [...value.matchAll(/<\/?[A-Za-z][^>]*>/g)]
  .map(([tag]) => tag).sort();

for (const [key, value] of Object.entries(cornish)) {
  if (value !== english[key]) {
    assert.deepEqual(tokens(value), tokens(english[key]), key);
  }
  assert.deepEqual(tags(value), tags(english[key]), key);
}

assert.equal(cornish.accept, 'Degemer');
assert.deepEqual(tokens(cornish['activity-changedTitle']), ['%s', '%s']);
assert.deepEqual(tokens(cornish['act-deleteCard']),
  ['__board__', '__card__', '__list__', '__swimlane__']);
assert.deepEqual(tokens(cornish['act-removeChecklistItem']),
  ['__board__', '__card__', '__checkList__', '__checklistItem__', '__list__',
    '__swimlane__']);
assert.match(cornish['act-createBoard'], /estyllen/);
assert.match(cornish['act-createCard'], /karten.*rol.*hyns.*estyllen/);
assert.match(cornish['act-addAttachment'], /stagell/);
assert.match(cornish['act-addChecklist'], /rol checkya/);
assert.match(cornish['act-addComment'], /kampoellys/);
assert.match(cornish['act-archivedBoard'], /kovskrifva/);
assert.deepEqual(tokens(cornish['act-moveCardToOtherBoard']),
  ['__board__', '__card__', '__list__', '__oldBoard__', '__oldList__',
    '__oldSwimlane__', '__swimlane__']);
assert.deepEqual(tokens(cornish['activity-added']), ['%s', '%s']);
assert.deepEqual(tokens(cornish['activity-checklist-completed-card']),
  ['__board__', '__card__', '__checklist__', '__list__', '__swimlane__']);
assert.equal(cornish['allboards.workspaces'], 'Leow ober');
assert.match(cornish['allboards.edit-workspace-icon'], /markdown/);
assert.match(cornish['archive-permanent-delete-disabled-hint'],
  /Admin Panel.*Problems.*Delete/);
assert.match(cornish['archive-permanent-delete-disabled-hint'],
  /Enable permanent delete for Global Admin/);
assert.deepEqual(tokens(cornish['activity-dueDate']), ['%s', '%s']);
assert.match(cornish['list-width-error-message'], /270/);
assert.match(cornish['set-swimlane-height-value'], /picselow/);
assert.equal(cornish['add-checklist'], 'Keworra rol checkya');
assert.equal(cornish['add-members'], 'Keworra eseli');
assert.deepEqual(tokens(cornish['and-n-other-card']), ['__count__']);
assert.deepEqual(tokens(cornish['and-n-other-card_plural']), ['__count__']);
assert.deepEqual(tokens(cornish['avatar-too-big']), ['__size__']);
assert.deepEqual(tokens(cornish['board-nb-stars']), ['%s']);
assert.deepEqual(tags(cornish['board-private-info']),
  ['</strong>', '<strong>']);
assert.match(cornish['board-private-info'], /privedh/);
assert.deepEqual(tags(cornish['board-public-info']),
  ['</strong>', '<strong>']);
assert.match(cornish['board-public-info'], /poblek/);
assert.deepEqual(tokens(
  cornish['board-open-and-move-between-remaining-and-workspaces']),
['__workspaces__']);
assert.match(cornish['enter-zoom-level'], /50-300%/);
assert.deepEqual(tokens(cornish['card-comments-title']), ['%s']);
assert.equal(cornish['card-edit-custom-fields'], 'Chanjya meys a-vusur');
assert.equal(cornish['vote-question'], 'Govynn votya');
assert.match(cornish['cardStartPlanningPokerPopup-title'], /Planning Poker/);
assert.match(cornish['editPokerEndDatePopup-title'], /Planning Poker/);
assert.equal(cornish['importDependenciesPopup-title'],
  'Ynperthi omgemmysow');
assert.equal(cornish['exportChecklistPopup-title'],
  'Esperthi rol checkya');
assert.equal(cornish['importSwimlanePopup-title'], 'Ynperthi hyns');
assert.match(cornish.casSignIn, /CAS/);
assert.equal(cornish['cardType-linkedBoard'], 'Estyllen gelmys');
assert.match(cornish['map-to-existing-user-desc'],
  /usyer gwir.*kartennow.*kampoellyansow.*gwrythres/);
assert.match(cornish['font-preview-text'], /0123456789/);
assert.equal(cornish['changeLanguagePopup-title'], 'Chanjya yeth');
assert.equal(cornish['changePermissionsPopup-title'], 'Chanjya grontyow');
assert.equal(cornish['auto-list-width'], 'Ledander awtomatek an rol');
assert.match(cornish['card-aging-days'], /3/);
assert.equal(cornish['move-card-up'], 'Gwaya karten yn-bann');
assert.equal(cornish['close-dialog'], 'Degea keskows');
assert.equal(cornish['color-indigo'], 'glas indigo');
assert.equal(cornish['color-magenta'], 'rudh magenta');
assert.equal(cornish['color-sky'], 'ebron');
