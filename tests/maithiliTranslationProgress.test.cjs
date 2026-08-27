const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const fillScript = path.join(root, 'releases/translations/fill-translations.mjs');
const result = spawnSync(process.execPath, [fillScript, '--list', 'mai'], {
  cwd: root,
  encoding: 'utf8',
});
assert.equal(result.status, 0, result.stderr);
const remaining = JSON.parse(result.stdout);
assert.equal(Object.keys(remaining).length, 1767);

const english = JSON.parse(fs.readFileSync(
  path.join(root, 'imports/i18n/data/en.i18n.json'), 'utf8'));
const maithili = JSON.parse(fs.readFileSync(
  path.join(root, 'imports/i18n/data/mai.i18n.json'), 'utf8'));
const tokens = (value) => [...value.matchAll(
  /__[A-Za-z0-9_]+__|%[A-Za-z]|%{[A-Za-z0-9]+}|{{[A-Za-z0-9]+}}/g)]
  .map(([token]) => token).sort();
const tags = (value) => [...value.matchAll(/<\/?[A-Za-z][^>]*>/g)]
  .map(([tag]) => tag).sort();

for (const [key, value] of Object.entries(maithili)) {
  if (value !== english[key]) {
    assert.deepEqual(tokens(value), tokens(english[key]), key);
  }
  assert.deepEqual(tags(value), tags(english[key]), key);
}

assert.equal(maithili.accept, 'स्वीकार करू');
assert.deepEqual(tokens(maithili['activity-changedTitle']), ['%s', '%s']);
assert.deepEqual(tokens(maithili['act-deleteCard']),
  ['__board__', '__card__', '__list__', '__swimlane__']);
assert.deepEqual(tokens(maithili['act-removeChecklistItem']),
  ['__board__', '__card__', '__checkList__', '__checklistItem__', '__list__',
    '__swimlane__']);
assert.match(maithili['board-members-same-org-only'], /संगठन/);
assert.match(maithili['board-members-same-team-only'], /टीम/);
assert.deepEqual(tokens(maithili['due-date-changed-times']), ['%s']);
assert.match(maithili['act-addAttachment'], /संलग्नक/);
assert.match(maithili['act-addChecklist'], /जाँचसूची/);
assert.match(maithili['act-addComment'], /टिप्पणी/);
assert.match(maithili['act-createCustomField'], /अनुकूलित क्षेत्र/);
assert.match(maithili['act-archivedBoard'], /संग्रह/);
assert.deepEqual(tokens(maithili['act-moveCardToOtherBoard']),
  ['__board__', '__card__', '__list__', '__oldBoard__', '__oldList__',
    '__oldSwimlane__', '__swimlane__']);
assert.deepEqual(tokens(maithili['activity-imported']), ['%s', '%s', '%s']);
assert.deepEqual(tokens(maithili['activity-checklist-completed-card']),
  ['__board__', '__card__', '__checklist__', '__list__', '__swimlane__']);
assert.match(maithili['activity-subtask-added'], /उपकार्य/);
assert.match(maithili['activity-editComment'], /टिप्पणी/);
assert.equal(maithili['allboards.workspaces'], 'कार्यस्थान');
assert.match(maithili['allboards.edit-workspace-icon'], /markdown/);
assert.equal(maithili['workspaceActionsPopup-title'], 'कार्यस्थान सेटिंग');
assert.deepEqual(tokens(maithili['activity-dueDate']), ['%s', '%s']);
assert.match(maithili['list-width-error-message'], /270/);
assert.match(maithili['set-list-width-value'], /पिक्सेल/);
assert.match(maithili['set-swimlane-height-value'], /पिक्सेल/);
assert.equal(maithili['add-checklist'], 'जाँचसूची जोड़ू');
assert.deepEqual(tokens(maithili['and-n-other-card']), ['__count__']);
assert.deepEqual(tokens(maithili['and-n-other-card_plural']), ['__count__']);
assert.deepEqual(tokens(maithili['avatar-too-big']), ['__size__']);
assert.deepEqual(tokens(maithili['board-nb-stars']), ['%s']);
assert.match(maithili['board-background-image-url'], /URL/);
assert.deepEqual(tags(maithili['board-private-info']),
  ['</strong>', '<strong>']);
assert.deepEqual(tags(maithili['board-public-info']),
  ['</strong>', '<strong>']);
assert.deepEqual(tokens(
  maithili['board-open-and-move-between-remaining-and-workspaces']),
['__workspaces__']);
assert.match(maithili['enter-zoom-level'], /50-300%/);
assert.deepEqual(tokens(maithili['card-comments-title']), ['%s']);
assert.equal(maithili['card-edit-custom-fields'],
  'अनुकूलित क्षेत्र संपादित करू');
assert.match(maithili['cardStartPlanningPokerPopup-title'], /Planning Poker/);
assert.match(maithili['editPokerEndDatePopup-title'], /Planning Poker/);
assert.equal(maithili['importDependenciesPopup-title'],
  'निर्भरता आयात करू');
assert.equal(maithili['exportChecklistPopup-title'],
  'जाँचसूची निर्यात करू');
assert.equal(maithili['importSwimlanePopup-title'], 'स्विमलेन आयात करू');
assert.match(maithili.casSignIn, /CAS/);
assert.equal(maithili['cardType-linkedBoard'], 'जुड़ल बोर्ड');
assert.match(maithili['map-to-existing-user-desc'],
  /कार्ड.*टिप्पणी.*गतिविधि/);
assert.equal(maithili['map-to-existing-user-no-results'],
  'मिलैत उपयोगकर्ता नहि भेटल।');
assert.match(maithili['font-preview-text'], /0123456789/);
assert.equal(maithili['auto-list-width'], 'स्वचालित सूची चौड़ाइ');
assert.match(maithili['card-aging-days'], /3/);
assert.equal(maithili['move-card-up'], 'कार्ड ऊपर लऽ जाउ');
assert.equal(maithili['color-red'], 'लाल');
assert.equal(maithili['color-silver'], 'चानी');
