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
  "add-text-note",
  "edit-text-note",
  "delete-text-note",
  "text-note-delete-pop",
  "cardTextNoteEditPopup-title",
  "cardTextNoteDeletePopup-title",
  "click-to-star-page",
  "click-to-unstar-page",
  "enable-permanent-delete",
  "enable-permanent-delete-description",
  "error-watch-disabled",
  "filter-label-excluded",
  "text-contains-trigger-label",
  "text-contains-trigger-description",
  "import-board-instruction-markdown",
  "import-excel-file",
  "import-timeout",
  "label-text-overridden",
  "orgAdminsPopup-title",
  "menu",
  "moveCardPopup-leave-link-at-origin",
  "multi-selection-off",
  "normal",
  "starred-pages",
  "star-item",
  "starred-lists",
  "starred-cards",
  "no-starred-items",
  "flow-add-interruption",
  "flow-interruptions",
  "pomodoro-break",
  "external-link-pattern",
  "external-link-pattern-description",
  "external-link-pattern-url",
  "email-templates-invite-vars-hint",
  "email-templates-activity-vars-hint",
  "Database",
  "Database_commit",
  "FerretDB_commit",
  "Reactivity_mode",
  "DDP_transport",
  "admin-only-field",
  "org-tenant",
  "org-domains",
  "org-domains-description",
  "error-org-domain-taken",
  "org-admins",
  "org-admins-description",
  "org-admin",
  "card-field-order",
  "card-field-order-move-up",
  "card-field-order-move-down",
  "r-rule-title-required",
  "r-toggle-rule-enabled",
  "r-list-view",
  "r-workspace",
  "r-when-a-card-matches-advanced-filter",
  "r-when-a-card-title-or-description-contains",
  "r-add-actinguser-member",
  "r-email-vars-hint",
  "ldap-test-connection",
  "oauth-providers-title",
  "oauth-providers-hint",
  "oauth-providers-login-style",
  "oauth-providers-merge-existing-users",
  "oauth-account-conflict",
  "sign-in-with",
  "passwordless-enabled",
  "passwordless-hint",
  "passwordless-login",
  "passwordless-code-sent",
  "passwordless-enter-code",
  "passwordless-sign-in",
  "card-counter-list",
  "board-member-list",
  "clone-board-without-cards",
  "lock-list-width-resize",
  "lock-swimlane-height-resize",
  "same-width-for-all-lists",
  "toggle-header-icons-collapsed",
  "drag-to-resize-sidebar"
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
  assert.match(waray['enable-permanent-delete-description'], /diri nagtatanggal/);
  for (const syntax of ['## ', '- [ ]', '- [x]']) {
    assert.ok(waray['import-board-instruction-markdown'].includes(syntax), syntax);
  }
  assert.match(waray['import-board-instruction-markdown'], /waray mga checkbox/);
  assert.notEqual(waray['click-to-star-page'], waray['click-to-unstar-page']);
  for (const key of ['external-link-pattern-url', 'email-templates-invite-vars-hint', 'email-templates-activity-vars-hint', 'r-email-vars-hint']) {
    const braces = value => value.match(/\{[a-zA-Z]+\}/g) || [];
    assert.deepEqual(braces(waray[key]), braces(english[key]), key);
  }
  assert.ok(waray['org-domains-description'].includes('MULTITENANCY=true'));
  assert.match(waray['org-admins-description'], /Diri gud.*Admin.*diri gud/);
  assert.notEqual(waray['card-field-order-move-up'], waray['card-field-order-move-down']);
  assert.ok(waray['oauth-providers-hint'].includes('OAUTH_*_ENABLED'));
  assert.match(waray['oauth-providers-hint'], /diri gud ipinapakita/);
  for (const setting of ['MAIL_URL', 'PASSWORDLESS_ENABLED']) {
    assert.ok(waray['passwordless-hint'].includes(setting), setting);
  }
  assert.match(waray['passwordless-enabled'], /makausa la/);
  assert.notEqual(waray['passwordless-login'], waray['passwordless-code-sent']);
  assert.notEqual(waray['due-days-left'], waray['due-days-overdue']);
  for (const kind of ['Swimlane', 'List']) {
    assert.notEqual(waray['export' + kind + 'Popup-title'], waray['import' + kind + 'Popup-title']);
  }
});
