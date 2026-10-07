const test = require('node:test');
const assert = require('node:assert/strict');
const waray = require('../imports/i18n/data/wa-RR.i18n.json');
const walloon = require('../imports/i18n/data/wa.i18n.json');
const english = require('../imports/i18n/data/en.i18n.json');
const correctedKeys = [
  "board-members-same-org-only",
  "board-members-same-team-only",
  "archive-permanent-delete-disabled-hint",
  "no-boards-selected",
  "select-only-one-board",
  "set-selected-unstarred",
  "unset-selected-home",
  "home-board-empty",
  "home-board-remove",
  "home-board-remove-confirm",
  "set-default-board-template",
  "unset-default-board-template",
  "add-existing-card-as-subtask",
  "convertChecklistItemToSubtask-title",
  "all-boards-hide",
  "public-boards",
  "board-creation-admin-only",
  "board-view-timeline-hint",
  "board-view-timeline-restore-confirm",
  "board-view-dashboard",
  "board-view-cumulative-flow",
  "board-view-throughput-histogram",
  "board-view-not-yet-implemented",
  "due-days-left",
  "due-days-overdue",
  "deleteBoardBackgroundPopup-title",
  "mapImportedMemberPopup-title",
  "exportSwimlanePopup-title",
  "exportListPopup-title",
  "exportChecklistPopup-title",
  "importSwimlanePopup-title",
  "importListPopup-title",
  "importCardPopup-title",
  "importBoardIntoPopup-title",
  "map-to-existing-user",
  "map-to-existing-user-search",
  "map-to-existing-user-not-member",
  "map-to-existing-user-no-results",
  "text-notes",
  "add-text-note"
];

test('Waray board controls replace Walloon prose while preserving source tokens', async () => {
  const { translationTokens } = await import('../releases/translations/placeholder-tokens.mjs');
  for (const key of correctedKeys) {
    assert.ok(waray[key]?.trim(), key);
    assert.notEqual(waray[key], english[key], key);
    assert.notEqual(waray[key], walloon[key], key);
    assert.doesNotMatch(waray[key], /tåvlea|djivêye|Tchoezixhoz|Radjouter|cåte|imådje/i, key);
    assert.deepEqual(translationTokens(waray[key]), translationTokens(english[key]), key);
  }
  assert.match(waray['home-board-remove-confirm'], /Diri matatanggal an board mismo/);
  assert.match(waray['board-view-timeline-restore-confirm'], /Waray matatanggal/);
  assert.notEqual(waray['due-days-left'], waray['due-days-overdue']);
  for (const kind of ['Swimlane', 'List']) {
    assert.notEqual(waray['export' + kind + 'Popup-title'], waray['import' + kind + 'Popup-title']);
  }
});
