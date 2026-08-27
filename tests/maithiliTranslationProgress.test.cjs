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
assert.equal(Object.keys(remaining).length, 1367);

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
assert.equal(maithili['color-white'], 'उज्जर');
assert.equal(maithili['read-only'], 'केवल पढ़ू');
assert.equal(maithili.worker, 'कार्यकर्ता');
const bulkCardExample = JSON.parse(maithili['copyManyCardsPopup-format']);
assert.deepEqual(Object.keys(bulkCardExample[0]), ['title', 'description']);
assert.equal(maithili['custom-field-number'], 'संख्या');
assert.match(maithili['edit-wip-limit'], /WIP/);
assert.deepEqual(tokens(maithili['email-enrollAccount-text']),
  ['__url__', '__user__']);
assert.deepEqual(tokens(maithili['email-invite-text']),
  ['__board__', '__inviter__', '__url__', '__user__']);
assert.deepEqual(tokens(maithili['email-verifyEmail-text']),
  ['__url__', '__user__']);
assert.match(maithili['error-import-empty-board'], /WeKan/);
assert.equal(maithili['export-card-pdf'], 'कार्ड PDF मे निर्यात करू');
assert.match(maithili['export-card-excel-fields'], /Excel/);
assert.equal(maithili['filter-due-tomorrow'], 'काल्हि नियत');
assert.equal(maithili['filter-no-member'], 'कोनो सदस्य नहि');
assert.match(maithili['advanced-filter-description'],
  /== != <= >= && \|\| \( \).*Field1 == Value1.*'Field 1' == 'Value 1'.*Field1 == I\\'m.*F1 == V1 \|\| F1 == V2.*F1 == \/Tes\.\*\/i/);
assert.deepEqual(tokens(maithili['import-board-instruction-issues']),
  ['__endpoint__', '__sourceName__']);
assert.match(maithili['import-board-instruction-openproject'],
  /GET \/api\/v3\/work_packages/);
assert.match(maithili['import-board-instruction-jira'],
  /GET \/rest\/api\/2\/search.*automationRules/);
assert.match(maithili['import-excel-file'], /\.xlsx/);
assert.match(maithili['trello-api-key'],
  /https:\/\/trello\.com\/app-key/);
assert.match(maithili['trello-api-import-desc'], /Trello API/);
assert.match(maithili['invalid-year'], /2026/);
assert.deepEqual(tokens(maithili['label-default']), ['%s']);
assert.deepEqual(tokens(maithili['leave-board-pop']), ['__boardTitle__']);
assert.match(maithili['listImportCardPopup-title'], /Trello/);
assert.match(maithili['listImportCardsTsvPopup-title'], /Excel CSV\/TSV/);
assert.equal(maithili.normal, 'सामान्य');
assert.equal(maithili['multi-selection'], 'बहु-चयन');
assert.deepEqual(tokens(maithili['page-maybe-private']), ['%s']);
assert.deepEqual(tags(maithili['page-maybe-private']),
  ["</a>", "<a href='%s'>"]);
assert.deepEqual(tokens(maithili['remove-member-pop']),
  ['__boardTitle__', '__name__', '__username__']);
assert.match(maithili['sandstorm-remove-member-warning'], /WeKan.*Sandstorm/);
assert.match(maithili['setWipLimitPopup-title'], /WIP/);
assert.match(maithili['toggle-assignees'], /1-9/);
assert.match(maithili['custom-top-left-corner-logo-height'], /27/);
assert.match(maithili['automatic-linked-url-schemes'], /URL.*URL/);
assert.match(maithili['wipLimitErrorPopup-dialog-pt1'], /WIP/);
assert.equal(maithili['board-templates-swimlane'], 'बोर्ड नमूना');
