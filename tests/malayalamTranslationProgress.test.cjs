const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const fillScript = path.join(root,
  'releases/translations/fill-translations.mjs');
const result = spawnSync(process.execPath, [fillScript, '--list', 'ml'], {
  cwd: root,
  encoding: 'utf8',
});
assert.equal(result.status, 0, result.stderr);
const remaining = JSON.parse(result.stdout);
assert.equal(Object.keys(remaining).length, 1817);

const english = JSON.parse(fs.readFileSync(
  path.join(root, 'imports/i18n/data/en.i18n.json'), 'utf8'));
const malayalam = JSON.parse(fs.readFileSync(
  path.join(root, 'imports/i18n/data/ml.i18n.json'), 'utf8'));
const tokens = (value) => [...value.matchAll(
  /__[A-Za-z0-9_]+__|%[A-Za-z]|%{[A-Za-z0-9]+}|{{[A-Za-z0-9]+}}/g)]
  .map(([token]) => token).sort();
const tags = (value) => [...value.matchAll(/<\/?[A-Za-z][^>]*>/g)]
  .map(([tag]) => tag).sort();

for (const [key, value] of Object.entries(malayalam)) {
  if (value !== english[key]) {
    assert.deepEqual(tokens(value), tokens(english[key]), key);
  }
  assert.deepEqual(tags(value), tags(english[key]), key);
}

assert.equal(malayalam.accept, 'സ്വീകരിക്കുക');
assert.match(malayalam.accept, /[\u0D00-\u0D7F]/);
assert.deepEqual(tokens(malayalam['activity-changedTitle']), ['%s', '%s']);
assert.deepEqual(tokens(malayalam['act-deleteCard']),
  ['__board__', '__card__', '__list__', '__swimlane__']);
assert.match(malayalam['board-members-same-org-only'], /സംഘടന/);
assert.match(malayalam['board-members-same-team-only'], /ടീമ/);
assert.deepEqual(tokens(malayalam['act-removeChecklistItem']),
  ['__board__', '__card__', '__checkList__', '__checklistItem__', '__list__',
    '__swimlane__']);
assert.deepEqual(tokens(malayalam['act-setCustomField']),
  ['__board__', '__card__', '__customFieldValue__', '__customField__',
    '__list__', '__swimlane__']);
assert.match(malayalam['act-archivedBoard'], /ആർക്കൈവ/);
assert.deepEqual(tokens(malayalam['act-moveCardToOtherBoard']),
  ['__board__', '__card__', '__list__', '__oldBoard__', '__oldList__',
    '__oldSwimlane__', '__swimlane__']);
assert.deepEqual(tokens(malayalam['activity-imported']),
  ['%s', '%s', '%s']);
assert.deepEqual(tokens(malayalam['activity-checklist-completed-card']),
  ['__board__', '__card__', '__checklist__', '__list__', '__swimlane__']);
assert.equal(malayalam['allboards.workspaces'], 'പ്രവർത്തനസ്ഥലങ്ങൾ');
assert.match(malayalam['allboards.edit-workspace-icon'], /markdown/);
assert.equal(malayalam['workspaceActionsPopup-title'],
  'പ്രവർത്തനസ്ഥല ക്രമീകരണങ്ങൾ');
assert.deepEqual(tokens(malayalam['activity-dueDate']), ['%s', '%s']);
assert.match(malayalam['list-width-error-message'], /270/);
assert.match(malayalam['set-list-width-value'], /പിക്സൽ/);
assert.match(malayalam['set-swimlane-height-value'], /പിക്സൽ/);
assert.equal(malayalam['add-checklist'], 'ചെക്ക്‌ലിസ്റ്റ് ചേർക്കുക');
assert.deepEqual(tokens(malayalam['and-n-other-card']), ['__count__']);
assert.deepEqual(tokens(malayalam['and-n-other-card_plural']), ['__count__']);
assert.deepEqual(tokens(malayalam['avatar-too-big']), ['__size__']);
assert.match(malayalam['board-background-image-url'], /URL/);
assert.deepEqual(tokens(malayalam['board-nb-stars']), ['%s']);
assert.deepEqual(tags(malayalam['board-private-info']),
  ['</strong>', '<strong>']);
assert.deepEqual(tags(malayalam['board-public-info']),
  ['</strong>', '<strong>']);
assert.deepEqual(tokens(
  malayalam['board-open-and-move-between-remaining-and-workspaces']),
['__workspaces__']);
assert.match(malayalam['enter-zoom-level'], /50-300%/);
assert.deepEqual(tokens(malayalam['card-comments-title']), ['%s']);
assert.equal(malayalam['card-edit-custom-fields'],
  'ഇഷ്ടാനുസൃത ഫീൽഡുകൾ തിരുത്തുക');
assert.match(malayalam['cardStartPlanningPokerPopup-title'],
  /Planning Poker/);
assert.match(malayalam['editPokerEndDatePopup-title'], /Planning Poker/);
assert.equal(malayalam['importDependenciesPopup-title'],
  'ആശ്രിതത്വങ്ങൾ ഇറക്കുമതി ചെയ്യുക');
assert.equal(malayalam['exportChecklistPopup-title'],
  'ചെക്ക്‌ലിസ്റ്റ് കയറ്റുമതി ചെയ്യുക');
assert.equal(malayalam['importSwimlanePopup-title'],
  'സ്വിംലെയിൻ ഇറക്കുമതി ചെയ്യുക');
assert.match(malayalam.casSignIn, /CAS/);
assert.equal(malayalam['cardType-linkedBoard'], 'ബന്ധിപ്പിച്ച ബോർഡ്');
assert.match(malayalam['map-to-existing-user-desc'],
  /കാർഡുകളും.*അഭിപ്രായങ്ങളും.*പ്രവർത്തനവും/);
assert.equal(malayalam['map-to-existing-user-no-results'],
  'പൊരുത്തപ്പെടുന്ന ഉപയോക്താക്കളെ കണ്ടെത്തിയില്ല.');
assert.match(malayalam['font-preview-text'], /0123456789/);
