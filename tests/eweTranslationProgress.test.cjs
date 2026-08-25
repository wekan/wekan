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
assert.equal(Object.keys(remaining).length, 1316);

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
assert.deepEqual(tokens(ewe['and-n-other-card']), ['__count__']);
assert.deepEqual(tokens(ewe['avatar-too-big']), ['__size__']);
assert.deepEqual(tokens(ewe['board-nb-stars']), ['%s']);
assert.deepEqual(tags(ewe['board-private-info']), [
  '</strong>',
  '<strong>',
]);
assert.match(ewe['board-background-image-url'], /URL/);
assert.deepEqual(tags(ewe['board-public-info']), [
  '</strong>',
  '<strong>',
]);
assert.deepEqual(tokens(ewe['board-open-and-move-between-remaining-and-workspaces']), [
  '__workspaces__',
]);
assert.match(ewe['enter-zoom-level'], /50-300%/);
assert.deepEqual(tokens(ewe['card-comments-title']), ['%s']);
assert.match(ewe['cardStartPlanningPokerPopup-title'], /Planning Poker/);
assert.match(ewe['editPokerEndDatePopup-title'], /Planning Poker/);
assert.match(ewe['importSwimlanePopup-title'], /tsiƒuƒu/);
assert.match(ewe['importCardPopup-title'], /kaɖi/);
assert.match(ewe.casSignIn, /CAS/);
assert.match(ewe['font-preview-text'], /0123456789/);
assert.match(ewe['map-to-existing-user-search'], /email/);
assert.match(ewe['card-aging-days'], /3/);
assert.match(ewe['color-black'], /yibɔ/);
assert.match(ewe['color-green'], /amaɖi/);
assert.match(ewe['color-red'], /dzĩ/);
assert.match(ewe['copyManyCardsPopup-instructions'], /JSON/);
assert.doesNotThrow(() => JSON.parse(ewe['copyManyCardsPopup-format']));
assert.match(ewe['custom-field-dropdown-options-placeholder'], /enter/);
assert.match(ewe['edit-wip-limit'], /WIP/);
assert.deepEqual(tokens(ewe['email-invite-text']), [
  '__board__',
  '__inviter__',
  '__url__',
  '__user__',
]);
assert.match(ewe['error-json-malformed'], /JSON/);
assert.match(ewe['error-csv-schema'], /CSV.*TSV/);
assert.match(ewe['error-import-empty-board'], /WeKan/);
assert.match(ewe['export-card-pdf'], /PDF/);
assert.match(ewe['export-card-excel'], /Excel/);
assert.match(ewe['export-card-excel-no-disk-space'], /Excel.*disk/);
assert.match(ewe['advanced-filter-description'], /== != <= >= && \|\| \( \)/);
assert.match(ewe['advanced-filter-description'], /F1 == \/Tes\.\*\/i/);
assert.deepEqual(tokens(ewe['import-board-instruction-issues']), [
  '__endpoint__',
  '__sourceName__',
]);
assert.match(ewe['import-board-instruction-excel'], /WeKan.*\.xlsx.*Excel/);
assert.match(ewe['import-trello-json-file-hint'], /Trello API key.*token/);
assert.match(ewe['trello-api-key'], /Trello API key.*https:\/\/trello\.com\/app-key/);
assert.match(ewe['trello-api-token'], /Trello API token.*API key/);
assert.match(ewe['invalid-year'], /2026/);
assert.deepEqual(tokens(ewe['label-default']), ['%s']);
assert.deepEqual(tokens(ewe['leave-board-pop']), ['__boardTitle__']);
assert.match(ewe['listImportCardPopup-title'], /Trello/);
assert.match(ewe['listImportCardsTsvPopup-title'], /Excel CSV\/TSV/);
assert.deepEqual(tokens(ewe['page-maybe-private']), ['%s']);
assert.deepEqual(tags(ewe['page-maybe-private']), [
  '</a>',
  "<a href='%s'>",
]);
assert.deepEqual(tokens(ewe['remove-member-pop']), [
  '__boardTitle__',
  '__name__',
  '__username__',
]);
assert.match(ewe['public-desc'], /Google/);
assert.match(ewe['setWipLimitPopup-title'], /WIP/);
assert.match(ewe['toggle-assignees'], /1-9/);
assert.match(ewe['toggle-labels'], /1-9/);
assert.match(ewe['custom-top-left-corner-logo-height'], /27/);
assert.match(ewe['automatic-linked-url-schemes'], /URL.*URL/);
assert.match(ewe['attachment-transfer-limits-title'], /API/);
assert.match(ewe['api-upload-limit-label'], /API/);
assert.match(ewe['smtp-tls-description'], /TLS.*SMTP/);
assert.deepEqual(tokens(ewe['email-invite-register-text']), [
  '__icode__',
  '__inviter__',
  '__url__',
  '__user__',
]);
assert.match(ewe.Node_version, /Node/);
assert.match(ewe.Meteor_version, /Meteor/);
