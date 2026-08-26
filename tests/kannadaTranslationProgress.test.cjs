const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const fillScript = path.join(root, 'releases/translations/fill-translations.mjs');
const result = spawnSync(process.execPath, [fillScript, '--list', 'kn'], {
  cwd: root,
  encoding: 'utf8',
});
assert.equal(result.status, 0, result.stderr);
const remaining = JSON.parse(result.stdout);
assert.equal(Object.keys(remaining).length, 741);

const english = JSON.parse(fs.readFileSync(
  path.join(root, 'imports/i18n/data/en.i18n.json'), 'utf8'));
const kannada = JSON.parse(fs.readFileSync(
  path.join(root, 'imports/i18n/data/kn.i18n.json'), 'utf8'));
const tokens = (value) => [...value.matchAll(
  /__[A-Za-z0-9_]+__|%[A-Za-z]|%{[A-Za-z0-9]+}|{{[A-Za-z0-9]+}}/g)]
  .map(([token]) => token).sort();
const tags = (value) => [...value.matchAll(/<\/?[A-Za-z][^>]*>/g)]
  .map(([tag]) => tag).sort();

for (const [key, value] of Object.entries(kannada)) {
  if (value !== english[key]) {
    assert.deepEqual(tokens(value), tokens(english[key]), key);
  }
  assert.deepEqual(tags(value), tags(english[key]), key);
}

assert.equal(kannada.accept, 'ಸ್ವೀಕರಿಸಿ');
assert.deepEqual(tokens(kannada['activity-changedTitle']), ['%s', '%s']);
assert.deepEqual(tokens(kannada['act-removeChecklistItem']),
  ['__board__', '__card__', '__checkList__', '__checklistItem__', '__list__',
    '__swimlane__']);
assert.match(kannada['act-createBoard'], /ಫಲಕ/);
assert.equal(kannada['workspace-settings'], 'ಕಾರ್ಯಕ್ಷೇತ್ರದ ಸೆಟ್ಟಿಂಗ್‌ಗಳು');
assert.deepEqual(tokens(kannada['activity-checklist-completed-card']),
  ['__board__', '__card__', '__checklist__', '__list__', '__swimlane__']);
assert.equal(kannada['set-list-width'], 'ಅಗಲವನ್ನು ಹೊಂದಿಸಿ');
assert.equal(kannada['public-boards'], 'ಸಾರ್ವಜನಿಕ ಫಲಕಗಳು');
assert.deepEqual(tokens(kannada['and-n-other-card_plural']), ['__count__']);
assert.deepEqual(tokens(kannada['avatar-too-big']), ['__size__']);
assert.deepEqual(tags(kannada['board-private-info']),
  ['</strong>', '<strong>']);
assert.deepEqual(tokens(
  kannada['board-open-and-move-between-remaining-and-workspaces']),
  ['__workspaces__']);
assert.deepEqual(tags(kannada['board-public-info']),
  ['</strong>', '<strong>']);
assert.equal(kannada['vote-question'], 'ಮತದಾನದ ಪ್ರಶ್ನೆ');
assert.equal(kannada['map-to-existing-user-no-results'],
  'ಹೊಂದುವ ಬಳಕೆದಾರರು ಕಂಡುಬಂದಿಲ್ಲ.');
assert.equal(kannada['font-size-largest'], 'ಅತ್ಯಂತ ದೊಡ್ಡದು');
assert.equal(kannada['color-sky'], 'ಆಕಾಶ ನೀಲಿ');
assert.equal(kannada['read-only'], 'ಓದಲು ಮಾತ್ರ');
assert.deepEqual(tokens(kannada['email-enrollAccount-text']),
  ['__url__', '__user__']);
assert.deepEqual(tokens(kannada['email-invite-text']),
  ['__board__', '__inviter__', '__url__', '__user__']);
assert.equal(kannada['filter-overdue'], 'ಅವಧಿ ಮೀರಿದೆ');
assert.equal(kannada['filter-no-assignee'], 'ನಿಯೋಜಿತರಿಲ್ಲ');
assert.deepEqual(tokens(kannada['import-board-instruction-issues']),
  ['__endpoint__', '__sourceName__']);
assert.equal(kannada['import-trello-zip-failed'], '.zip ಆಮದು ವಿಫಲವಾಗಿದೆ.');
assert.deepEqual(tokens(kannada['leave-board-pop']), ['__boardTitle__']);
assert.equal(kannada['multi-selection'], 'ಬಹು-ಆಯ್ಕೆ');
assert.deepEqual(tokens(kannada['remove-member-pop']),
  ['__boardTitle__', '__name__', '__username__']);
assert.equal(kannada.overtime, 'ಹೆಚ್ಚುವರಿ ಸಮಯ');
assert.equal(kannada['upload-failed'], 'ಅಪ್‌ಲೋಡ್ ವಿಫಲವಾಗಿದೆ');
assert.deepEqual(tokens(kannada['email-invite-register-text']),
  ['__icode__', '__inviter__', '__url__', '__user__']);
assert.equal(kannada.Database, 'ದತ್ತಸಂಚಯ');
assert.equal(kannada['active-org'], 'ಸಕ್ರಿಯ ಸಂಸ್ಥೆ');
assert.deepEqual(tokens(kannada['default-subtasks-board']), ['__board__']);
assert.equal(kannada['r-board-rules'], 'ಫಲಕದ ನಿಯಮಗಳು');
assert.deepEqual(tokens(kannada['r-w-every-day-at']), ['__time__']);
assert.deepEqual(tokens(kannada['r-import-unmapped']), ['__count__']);
assert.equal(kannada['r-trigger'], 'ಪ್ರಚೋದಕ');
assert.equal(kannada['r-d-send-email'], 'ಇಮೇಲ್ ಕಳುಹಿಸಿ');
assert.equal(kannada['r-add-swimlane'], 'ಪಥ ಸೇರಿಸಿ');
assert.deepEqual(tokens(kannada['act-a-dueAt']),
  ['__card__', '__timeOldValue__', '__timeValue__']);
assert.deepEqual(tokens(kannada['act-atUserComment']),
  ['__board__', '__card__', '__comment__', '__list__', '__swimlane__']);
assert.equal(kannada.monday, 'ಸೋಮವಾರ');
assert.equal(kannada['shared-templates'], 'ಹಂಚಿದ ಟೆಂಪ್ಲೇಟ್‌ಗಳು');
assert.deepEqual(tokens(kannada['n-n-of-n-cards-found']),
  ['__end__', '__start__', '__total__']);
assert.deepEqual(tokens(kannada['operator-number-expected']),
  ['__operator__', '__value__']);
assert.equal(kannada['next-page'], 'ಮುಂದಿನ ಪುಟ');
assert.deepEqual(tokens(kannada['globalSearch-instructions-operator-hash']),
  ['__operator_label__', '__operator_label__', '__operator_label_abbrev__']);
assert.deepEqual(tokens(kannada['globalSearch-instructions-operator-due']),
  ['__operator_due__', '__operator_due__', '__predicate_overdue__']);
assert.deepEqual(tokens(kannada['globalSearch-instructions-operator-has']),
  ['__operator_has__', '__predicate_assignee__', '__predicate_attachment__',
    '__predicate_checklist__', '__predicate_description__', '__predicate_due__',
    '__predicate_end__', '__predicate_member__', '__predicate_start__']);
assert.deepEqual(tokens(kannada['globalSearch-instructions-notes-3-2']),
  ['__predicate_month__', '__predicate_quarter__', '__predicate_week__',
    '__predicate_year__']);
