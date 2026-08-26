const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const fillScript = path.join(root, 'releases/translations/fill-translations.mjs');
const result = spawnSync(process.execPath, [fillScript, '--list', 'kok'], {
  cwd: root,
  encoding: 'utf8',
});
assert.equal(result.status, 0, result.stderr);
const remaining = JSON.parse(result.stdout);
assert.equal(Object.keys(remaining).length, 742);

const english = JSON.parse(fs.readFileSync(
  path.join(root, 'imports/i18n/data/en.i18n.json'), 'utf8'));
const konkani = JSON.parse(fs.readFileSync(
  path.join(root, 'imports/i18n/data/kok.i18n.json'), 'utf8'));
const tokens = (value) => [...value.matchAll(
  /__[A-Za-z0-9_]+__|%[A-Za-z]|%{[A-Za-z0-9]+}|{{[A-Za-z0-9]+}}/g)]
  .map(([token]) => token).sort();
const tags = (value) => [...value.matchAll(/<\/?[A-Za-z][^>]*>/g)]
  .map(([tag]) => tag).sort();

for (const [key, value] of Object.entries(konkani)) {
  if (value !== english[key]) {
    assert.deepEqual(tokens(value), tokens(english[key]), key);
  }
  assert.deepEqual(tags(value), tags(english[key]), key);
}

assert.equal(konkani.accept, 'स्वीकारात');
assert.deepEqual(tokens(konkani['activity-changedTitle']), ['%s', '%s']);
assert.deepEqual(tokens(konkani['act-removeChecklistItem']),
  ['__board__', '__card__', '__checkList__', '__checklistItem__', '__list__',
    '__swimlane__']);
assert.match(konkani['act-createBoard'], /फळो/);
assert.equal(konkani['workspace-settings'], 'कार्यस्थळ मांडावळ');
assert.deepEqual(tokens(konkani['activity-checklist-completed-card']),
  ['__board__', '__card__', '__checklist__', '__list__', '__swimlane__']);
assert.equal(konkani['set-list-width'], 'रुंदाय थारायात');
assert.equal(konkani['add-members'], 'वांगडी जोडात');
assert.equal(konkani['public-boards'], 'भौशीक फळे');
assert.deepEqual(tokens(konkani['and-n-other-card_plural']), ['__count__']);
assert.deepEqual(tokens(konkani['avatar-too-big']), ['__size__']);
assert.deepEqual(tags(konkani['board-private-info']),
  ['</strong>', '<strong>']);
assert.deepEqual(tokens(
  konkani['board-open-and-move-between-remaining-and-workspaces']),
  ['__workspaces__']);
assert.equal(konkani['card-edit-members'], 'वांगडी संपादित करात');
assert.equal(konkani['vote-question'], 'मतदानाचो प्रस्न');
assert.equal(konkani['importCardPopup-title'], 'कार्ड आयात करात');
assert.equal(konkani['map-to-existing-user-no-results'],
  'जुळपी वापरपी मेळ्ळे ना.');
assert.equal(konkani['font-size-largest'], 'सगळ्यांत व्हड');
assert.equal(konkani['move-card-up'], 'कार्ड वयर व्हरात');
assert.equal(konkani['color-sky'], 'आकाशी');
assert.equal(konkani['read-only'], 'फकत वाचप');
assert.equal(konkani['custom-field-number'], 'क्रमांक');
assert.deepEqual(tokens(konkani['email-enrollAccount-text']),
  ['__url__', '__user__']);
assert.deepEqual(tokens(konkani['email-invite-text']),
  ['__board__', '__inviter__', '__url__', '__user__']);
assert.deepEqual(tokens(konkani['email-resetPassword-text']),
  ['__url__', '__user__']);
assert.equal(konkani['filter-overdue'], 'वेळ सरली');
assert.equal(konkani['filter-no-assignee'], 'नेमिल्लो कोणूच ना');
assert.deepEqual(tokens(konkani['import-board-instruction-issues']),
  ['__endpoint__', '__sourceName__']);
assert.equal(konkani['trello-import-progress'], 'आयात प्रगती');
assert.deepEqual(tokens(konkani['leave-board-pop']), ['__boardTitle__']);
assert.equal(konkani['calendar'], 'दिनदर्शिका');
assert.equal(konkani['multi-selection'], 'जायती निवड');
assert.deepEqual(tokens(konkani['remove-member-pop']),
  ['__boardTitle__', '__name__', '__username__']);
assert.deepEqual(tags(konkani['page-maybe-private']),
  ["</a>", "<a href='%s'>"]);
assert.equal(konkani.overtime, 'जादा वेळ');
assert.equal(konkani['upload-failed'], 'अपलोड असफळ');
assert.equal(konkani['attachment-limit-mode-unlimited'], 'अमर्याद');
assert.equal(konkani.registration, 'नोंदणी');
assert.deepEqual(tokens(konkani['email-invite-register-text']),
  ['__icode__', '__inviter__', '__url__', '__user__']);
assert.equal(konkani.Database, 'म्हायतीकोश');
assert.equal(konkani['active-org'], 'सक्रिय संस्था');
assert.equal(konkani['OS_Uptime'], 'OS चालू वेळ');
assert.deepEqual(tokens(konkani['default-subtasks-board']), ['__board__']);
assert.equal(konkani['r-board-rules'], 'फळो नेम');
assert.deepEqual(tokens(konkani['activity-set-customfield']),
  ['%s', '%s', '%s']);
assert.deepEqual(tokens(konkani['r-w-every-day-at']), ['__time__']);
assert.deepEqual(tokens(konkani['r-import-done']), ['__count__']);
assert.deepEqual(tokens(konkani['r-import-unmapped']), ['__count__']);
assert.equal(konkani['r-trigger'], 'चालक');
assert.equal(konkani['r-move-card-to'], 'कार्ड हांगा व्हरात');
assert.equal(konkani['r-d-send-email'], 'ईमेल धाडात');
assert.equal(konkani['r-add-swimlane'], 'मार्ग जोडात');
assert.equal(konkani['authentication-method'], 'प्रमाणीकरण पद्दत');
assert.deepEqual(tokens(konkani['act-a-dueAt']),
  ['__card__', '__timeOldValue__', '__timeValue__']);
assert.deepEqual(tokens(konkani['act-atUserComment']),
  ['__board__', '__card__', '__comment__', '__list__', '__swimlane__']);
assert.deepEqual(tags(konkani['add-custom-html-after-body-start']),
  ['<body>']);
assert.equal(konkani.roles, 'भूमिक्यो');
assert.equal(konkani.monday, 'सोमार');
assert.equal(konkani['shared-templates'], 'सामायिक नमुने');
assert.deepEqual(tokens(konkani['board-title-not-found']), ['%s']);
assert.deepEqual(tokens(konkani['n-n-of-n-cards-found']),
  ['__end__', '__start__', '__total__']);
assert.equal(konkani['operator-board'], 'फळो');
assert.deepEqual(tokens(konkani['operator-number-expected']),
  ['__operator__', '__value__']);
assert.deepEqual(tokens(konkani['globalSearch-instructions-operator-hash']),
  ['__operator_label__', '__operator_label__', '__operator_label_abbrev__']);
assert.deepEqual(tokens(konkani['globalSearch-instructions-operator-due']),
  ['__operator_due__', '__operator_due__', '__predicate_overdue__']);
assert.deepEqual(tokens(konkani['globalSearch-instructions-operator-has']),
  ['__operator_has__', '__predicate_assignee__', '__predicate_attachment__',
    '__predicate_checklist__', '__predicate_description__', '__predicate_due__',
    '__predicate_end__', '__predicate_member__', '__predicate_start__']);
