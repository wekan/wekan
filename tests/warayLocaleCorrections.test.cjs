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
  "drag-to-resize-sidebar",
  "drag-to-resize-left-menu",
  "checklist-ding-sound",
  "checklist-ding-sound-description",
  "default-on-public-board",
  "show-on-public-board",
  "default-on-private-board",
  "show-on-private-board",
  "roles-status",
  "roles-status-desc",
  "roles-status-invite",
  "roles-status-sees",
  "roles-status-write",
  "roles-status-manage",
  "roles-status-empty",
  "board-table-card-title-wrap-on",
  "board-table-card-title-wrap-off",
  "board-table-group-by-swimlane-on",
  "board-table-group-by-swimlane-off",
  "globalSearchViewChange-title",
  "globalSearchViewChangePopup-title",
  "operator-org",
  "predicate-projection",
  "dependency-icon",
  "location-latitude",
  "location-longitude",
  "board-activities",
  "securityReportTitle",
  "databaseReportTitle",
  "office-report-desc",
  "office-first-seen",
  "office-last-seen",
  "office-shared",
  "office-no-results",
  "api-report-desc",
  "api-first-called",
  "api-no-calls",
  "recovery-report-desc",
  "recovery-db",
  "recovery-no-events",
  "recovery-maintenance-title",
  "recovery-maintenance-note",
  "history-change-edited",
  "history-change-moved",
  "email-domain-allowed-to-invite",
  "edit-checklist-items-as-text",
  "editChecklistItemsAsTextPopup-title",
  "move-storage-fs",
  "card-id",
  "attachment-id",
  "gridfs-file-id",
  "s3-file-id",
  "mongodb-compact",
  "board-status",
  "board-status-loading-mode",
  "board-status-time-spent-total",
  "board-status-cards-with-time",
  "board-status-overtime-cards",
  "board-status-remaining-time-total",
  "uncheckAllItems",
  "hideCompletedSubtasks",
  "azure-blob-storage-description",
  "azure-connection-string",
  "gcs-storage-description",
  "cards-loading-auto",
  "backup-scope",
  "backup-scope-description",
  "theme-override-all-tenants",
  "backup-frequency-off",
  "gcs-project-id",
  "s3-endpoint",
  "filesystem-storage",
  "migration-delay-ms",
  "migration-detector",
  "migration-log",
  "migration-markers",
  "problems-summary-help",
  "problems-in-progress-help",
  "repair-broken-cards",
  "repair-broken-cards-done",
  "repair-broken-cards-done-unfixable",
  "restore-list-swimlanes-done",
  "integrityReportTitle",
  "export-swimlane",
  "export-list",
  "export-card-details",
  "card-number",
  "import-not-wekan-export",
  "globalSearch-instructions-operator-number",
  "import-board-source",
  "import-source-heading",
  "import-parts-instruction",
  "import-wekan-file",
  "sum-of-number-fields",
  "more-options",
  "sticky-list-headers",
  "twoFactorCode-submit",
  "sort-by-votes",
  "subtask-inherit-parent-labels",
  "list-sync-username-placeholder",
  "list-sync-last-synced-never",
  "board-view-monte-carlo",
  "blockly-CANNOT_DELETE_VARIABLE_PROCEDURE",
  "blockly-CHANGE_VALUE_TITLE",
  "blockly-CLEAN_UP",
  "blockly-CLOSE_BACKPACK",
  "blockly-COLLAPSED_WARNINGS_WARNING",
  "blockly-COLLAPSE_ALL",
  "blockly-COLLAPSE_BLOCK",
  "blockly-COLOUR_BLEND_COLOUR1",
  "blockly-COLOUR_BLEND_COLOUR2",
  "blockly-COLOUR_BLEND_RATIO",
  "blockly-COLOUR_BLEND_TITLE",
  "blockly-COLOUR_BLEND_TOOLTIP",
  "blockly-COLOUR_PICKER_TOOLTIP",
  "blockly-COLOUR_RANDOM_TITLE",
  "blockly-COLOUR_RANDOM_TOOLTIP",
  "blockly-COLOUR_RGB_BLUE",
  "blockly-COLOUR_RGB_GREEN",
  "blockly-COLOUR_RGB_RED",
  "blockly-COLOUR_RGB_TITLE",
  "blockly-COLOUR_RGB_TOOLTIP",
  "blockly-CONTROLS_FLOW_STATEMENTS_OPERATOR_BREAK",
  "blockly-CONTROLS_FLOW_STATEMENTS_OPERATOR_CONTINUE",
  "blockly-CONTROLS_FLOW_STATEMENTS_TOOLTIP_BREAK",
  "blockly-CONTROLS_FLOW_STATEMENTS_TOOLTIP_CONTINUE",
  "blockly-CONTROLS_FLOW_STATEMENTS_WARNING",
  "blockly-CONTROLS_FOREACH_TITLE",
  "blockly-CONTROLS_FOREACH_TOOLTIP",
  "blockly-CONTROLS_FOR_TITLE",
  "blockly-CONTROLS_FOR_TOOLTIP",
  "blockly-CONTROLS_IF_ELSEIF_TOOLTIP",
  "blockly-CONTROLS_IF_ELSE_TOOLTIP",
  "blockly-CONTROLS_IF_IF_TOOLTIP",
  "blockly-CONTROLS_IF_MSG_ELSE",
  "blockly-CONTROLS_IF_MSG_ELSEIF",
  "blockly-CONTROLS_IF_TOOLTIP_1",
  "blockly-CONTROLS_IF_TOOLTIP_2",
  "blockly-CONTROLS_IF_TOOLTIP_3",
  "blockly-CONTROLS_IF_TOOLTIP_4",
  "blockly-CONTROLS_REPEAT_TITLE",
  "blockly-CONTROLS_REPEAT_TOOLTIP",
  "blockly-CONTROLS_WHILEUNTIL_OPERATOR_UNTIL",
  "blockly-CONTROLS_WHILEUNTIL_OPERATOR_WHILE",
  "blockly-CONTROLS_WHILEUNTIL_TOOLTIP_UNTIL",
  "blockly-CONTROLS_WHILEUNTIL_TOOLTIP_WHILE",
  "blockly-COPY_ALL_TO_BACKPACK",
  "blockly-COPY_SHORTCUT",
  "blockly-COPY_TO_BACKPACK",
  "blockly-CURRENT_BLOCK_ANNOUNCEMENT",
  "blockly-CUT_SHORTCUT",
  "blockly-DELETE_ALL_BLOCKS",
  "blockly-DELETE_BLOCK",
  "blockly-DELETE_VARIABLE",
  "blockly-DELETE_VARIABLE_CONFIRMATION",
  "blockly-DELETE_X_BLOCKS",
  "blockly-DISABLE_BLOCK",
  "blockly-DUPLICATE_BLOCK",
  "blockly-DUPLICATE_COMMENT",
  "blockly-EDIT_BLOCK_CONTENTS",
  "blockly-EMPTY_BACKPACK",
  "blockly-ENABLE_BLOCK",
  "blockly-EXPAND_ALL",
  "blockly-EXPAND_BLOCK",
  "blockly-EXTERNAL_INPUTS",
  "blockly-FIELD_BITMAP_ARIA_VALUE",
  "blockly-FIELD_BITMAP_BUTTON_LABEL_CLEAR",
  "blockly-FIELD_BITMAP_BUTTON_LABEL_RANDOMIZE",
  "blockly-FIELD_BITMAP_PIXEL_LABEL",
  "blockly-FIELD_BITMAP_PIXEL_OFF",
  "blockly-FIELD_LABEL_EDIT_PREFIX",
  "blockly-FIELD_LABEL_EMPTY",
  "blockly-FIELD_LABEL_OPTION_INDEX",
  "blockly-FIELD_LABEL_VARIABLE",
  "blockly-FIELD_MULTILINEINPUT_FINISH_EDITING",
  "blockly-FIELD_MULTILINEINPUT_NEW_LINE",
  "blockly-HELP_PROMPT",
  "blockly-ICON_LABEL_COMMENT_CLOSED",
  "blockly-ICON_LABEL_COMMENT_OPEN",
  "blockly-ICON_LABEL_DEFAULT",
  "blockly-ICON_LABEL_MUTATOR_CLOSED",
  "blockly-ICON_LABEL_MUTATOR_OPEN",
  "blockly-ICON_LABEL_WARNING_CLOSED",
  "blockly-ICON_LABEL_WARNING_OPEN",
  "blockly-INLINE_INPUTS",
  "blockly-INPUT_LABEL_CONDITION",
  "blockly-INPUT_LABEL_CONDITION_A",
  "blockly-INPUT_LABEL_CONDITION_B",
  "blockly-INPUT_LABEL_EMPTY",
  "blockly-INPUT_LABEL_END_STATEMENT",
  "blockly-INPUT_LABEL_INDEX",
  "blockly-INPUT_LABEL_LISTS_CREATE_WITH_ITEM",
  "blockly-INPUT_LABEL_LISTS_DELIMITER",
  "blockly-INPUT_LABEL_LISTS_END_POSITION",
  "blockly-INPUT_LABEL_LISTS_LIST_FROM_TEXT",
  "blockly-INPUT_LABEL_LISTS_POSITION",
  "blockly-INPUT_LABEL_LISTS_REPEAT_ITEM",
  "blockly-INPUT_LABEL_LISTS_REPEAT_NUM",
  "blockly-INPUT_LABEL_LISTS_START_POSITION",
  "blockly-INPUT_LABEL_LISTS_TEXT_FROM_LIST",
  "blockly-INPUT_LABEL_LISTS_TO_CHANGE",
  "blockly-INPUT_LABEL_LISTS_TO_CHECK",
  "blockly-INPUT_LABEL_LISTS_VALUE_TO_SET",
  "blockly-INPUT_LABEL_LOOP_BY",
  "blockly-INPUT_LABEL_LOOP_FROM",
  "blockly-INPUT_LABEL_LOOP_LIST",
  "blockly-INPUT_LABEL_LOOP_TIMES",
  "blockly-INPUT_LABEL_LOOP_TO",
  "blockly-INPUT_LABEL_MATH_CHANGE_BY",
  "blockly-INPUT_LABEL_MATH_CONSTRAIN_VALUE",
  "blockly-INPUT_LABEL_MATH_DIVIDEND",
  "blockly-INPUT_LABEL_MATH_DIVISOR",
  "blockly-INPUT_LABEL_NUMBER",
  "blockly-INPUT_LABEL_NUMBER_A",
  "blockly-INPUT_LABEL_NUMBER_ATAN2_X",
  "blockly-INPUT_LABEL_NUMBER_ATAN2_Y",
  "blockly-INPUT_LABEL_NUMBER_B",
  "blockly-INPUT_LABEL_NUMBER_LIST",
  "blockly-INPUT_LABEL_NUMBER_MAX",
  "blockly-INPUT_LABEL_NUMBER_MIN",
  "blockly-INPUT_LABEL_NUMBER_TO_CHECK",
  "blockly-INPUT_LABEL_STATEMENT",
  "blockly-INPUT_LABEL_TEXT_APPEND",
  "blockly-INPUT_LABEL_TEXT_END_POSITION",
  "blockly-INPUT_LABEL_TEXT_JOIN_ITEM",
  "blockly-INPUT_LABEL_TEXT_POSITION",
  "blockly-INPUT_LABEL_TEXT_PROMPT_MESSAGE",
  "blockly-INPUT_LABEL_TEXT_START_POSITION",
  "blockly-INPUT_LABEL_TEXT_TO_CHANGE",
  "blockly-INPUT_LABEL_TEXT_TO_CHECK",
  "blockly-INPUT_LABEL_TEXT_TO_FIND",
  "blockly-INPUT_LABEL_TEXT_TO_REPLACE",
  "blockly-INPUT_LABEL_VALUE",
  "blockly-INPUT_LABEL_VALUE_A",
  "blockly-INPUT_LABEL_VALUE_B",
  "blockly-INPUT_LABEL_VARIABLES_SET",
  "blockly-KEYBOARD_NAV_BLOCK_NAVIGATION_HINT",
  "blockly-KEYBOARD_NAV_CONSTRAINED_MOVE_HINT",
  "blockly-KEYBOARD_NAV_COPIED_HINT",
  "blockly-KEYBOARD_NAV_CUT_HINT",
  "blockly-KEYBOARD_NAV_FLYOUT_LABEL_HINT",
  "blockly-KEYBOARD_NAV_UNCONSTRAINED_MOVE_HINT",
  "blockly-KEYBOARD_NAV_WORKSPACE_NAVIGATION_HINT",
  "blockly-LISTS_CREATE_EMPTY_TITLE",
  "blockly-LISTS_CREATE_EMPTY_TOOLTIP",
  "blockly-LISTS_CREATE_WITH_CONTAINER_TITLE_ADD",
  "blockly-LISTS_CREATE_WITH_CONTAINER_TOOLTIP",
  "blockly-LISTS_CREATE_WITH_INPUT_WITH",
  "blockly-LISTS_CREATE_WITH_ITEM_TOOLTIP",
  "blockly-LISTS_CREATE_WITH_TOOLTIP",
  "blockly-LISTS_GET_INDEX_FIRST",
  "blockly-LISTS_GET_INDEX_FROM_END",
  "blockly-LISTS_GET_INDEX_GET",
  "blockly-LISTS_GET_INDEX_GET_REMOVE",
  "blockly-LISTS_GET_INDEX_LAST",
  "blockly-LISTS_GET_INDEX_RANDOM",
  "blockly-LISTS_GET_INDEX_REMOVE",
  "blockly-LISTS_GET_INDEX_TOOLTIP_GET_FIRST",
  "blockly-LISTS_GET_INDEX_TOOLTIP_GET_FROM",
  "blockly-LISTS_GET_INDEX_TOOLTIP_GET_LAST",
  "blockly-LISTS_GET_INDEX_TOOLTIP_GET_RANDOM",
  "blockly-LISTS_GET_INDEX_TOOLTIP_GET_REMOVE_FIRST",
  "blockly-LISTS_GET_INDEX_TOOLTIP_GET_REMOVE_FROM",
  "blockly-LISTS_GET_INDEX_TOOLTIP_GET_REMOVE_LAST",
  "blockly-LISTS_GET_INDEX_TOOLTIP_GET_REMOVE_RANDOM",
  "blockly-LISTS_GET_INDEX_TOOLTIP_REMOVE_FIRST",
  "blockly-LISTS_GET_INDEX_TOOLTIP_REMOVE_FROM",
  "blockly-LISTS_GET_INDEX_TOOLTIP_REMOVE_LAST",
  "blockly-LISTS_GET_INDEX_TOOLTIP_REMOVE_RANDOM",
  "blockly-LISTS_GET_SUBLIST_END_FROM_END"
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
  for (const prefix of ['board-table-card-title-wrap', 'board-table-group-by-swimlane']) {
    assert.notEqual(waray[prefix + '-on'], waray[prefix + '-off']);
  }
  assert.match(waray['checklist-ding-sound-description'], /nakaparong/);
  assert.match(waray['roles-status-desc'], /Para la basahon/);
  assert.ok(waray['api-no-calls'].includes('WITH_API=true'));
  for (const version of ['IPv4', 'IPv6']) assert.ok(waray['office-report-desc'].includes(version));
  assert.match(waray['api-report-desc'], /diri gud usa nga linya para ha tagsa nga hangyo/);
  assert.notEqual(waray['office-first-seen'], waray['office-last-seen']);
  assert.notEqual(waray['history-change-edited'], waray['history-change-moved']);
  assert.match(waray['backup-scope-description'], /waray mga account.*waray mga setting/);
  assert.match(waray['backup-scope-description'], /nagsusurat la ha mga board nga gintatag-iya/);
  assert.match(waray['cards-loading-auto'], /para la ha dagko nga board/);
  assert.match(waray['repair-broken-cards-done-unfixable'], /waray board.*diri mahimo awtomatiko/);
  assert.match(waray['restore-list-swimlanes-done'], /__remaining__ diri naibalik/);
  assert.ok(waray['globalSearch-instructions-operator-number'].includes('`__operator_number__:<number>`'));
  assert.ok(waray['globalSearch-instructions-operator-number'].includes('*<number>*'));
  assert.ok(waray['import-wekan-file'].includes('.json o .zip'));
  assert.match(waray['import-parts-instruction'], /ginmarkahan la/);
  assert.notEqual(waray['blockly-CONTROLS_FLOW_STATEMENTS_OPERATOR_BREAK'], waray['blockly-CONTROLS_FLOW_STATEMENTS_OPERATOR_CONTINUE']);
  assert.match(waray['blockly-CONTROLS_FLOW_STATEMENTS_TOOLTIP_CONTINUE'], /Laktawi.*sunod/);
  assert.match(waray['blockly-CONTROLS_IF_TOOLTIP_4'], /Kon waray tinuod nga bili.*kataposan/);
  assert.ok(waray['blockly-COLOUR_BLEND_TOOLTIP'].includes('0.0 - 1.0'));
  assert.match(waray['blockly-COLOUR_RGB_TOOLTIP'], /0 ngan 100/);
  assert.match(waray['blockly-CONTROLS_WHILEUNTIL_TOOLTIP_UNTIL'], /Samtang diri tinuod/);
  assert.match(waray['blockly-CONTROLS_WHILEUNTIL_TOOLTIP_WHILE'], /Samtang tinuod/);
  for (const [a, b] of [['ENABLE_BLOCK', 'DISABLE_BLOCK'], ['EXPAND_BLOCK', 'COLLAPSE_BLOCK'], ['COPY_SHORTCUT', 'CUT_SHORTCUT']]) {
    assert.notEqual(waray['blockly-' + a], waray['blockly-' + b]);
  }
  assert.match(waray['blockly-FIELD_BITMAP_PIXEL_LABEL'], /laray %2, kolum %3/);
  for (const [a, b] of [['MATH_DIVIDEND', 'MATH_DIVISOR'], ['NUMBER_MAX', 'NUMBER_MIN'], ['NUMBER_ATAN2_X', 'NUMBER_ATAN2_Y'], ['TEXT_TO_FIND', 'TEXT_TO_REPLACE'], ['STATEMENT', 'VALUE']]) {
    assert.notEqual(waray['blockly-INPUT_LABEL_' + a], waray['blockly-INPUT_LABEL_' + b]);
  }
  assert.match(waray['blockly-KEYBOARD_NAV_UNCONSTRAINED_MOVE_HINT'], /Pugngi an %1.*%2 basi karawaton/);
  assert.notEqual(waray['blockly-KEYBOARD_NAV_COPIED_HINT'], waray['blockly-KEYBOARD_NAV_CUT_HINT']);
  for (const position of ['FIRST', 'FROM', 'LAST', 'RANDOM']) {
    const prefix = 'blockly-LISTS_GET_INDEX_TOOLTIP_';
    assert.match(waray[prefix + 'GET_' + position], /^Nagbabalik/);
    assert.doesNotMatch(waray[prefix + 'GET_' + position], /Nagtatanggal/);
    assert.match(waray[prefix + 'GET_REMOVE_' + position], /^Nagtatanggal ngan nagbabalik/);
    assert.match(waray[prefix + 'REMOVE_' + position], /^Nagtatanggal/);
    assert.doesNotMatch(waray[prefix + 'REMOVE_' + position], /nagbabalik/);
  }
  assert.ok(waray['blockly-LISTS_GET_INDEX_FROM_END'].includes('#'));
  for (const kind of ['COMMENT', 'WARNING']) {
    assert.match(waray['blockly-ICON_LABEL_' + kind + '_CLOSED'], /^Abrihi/);
    assert.match(waray['blockly-ICON_LABEL_' + kind + '_OPEN'], /^Isara/);
  }
  for (const [a, b] of [['CONDITION_A', 'CONDITION_B'], ['LISTS_START_POSITION', 'LISTS_END_POSITION'], ['LOOP_FROM', 'LOOP_TO'], ['LISTS_LIST_FROM_TEXT', 'LISTS_TEXT_FROM_LIST']]) {
    assert.notEqual(waray['blockly-INPUT_LABEL_' + a], waray['blockly-INPUT_LABEL_' + b]);
  }
  for (const [key, name] of [['gridfs-file-id', 'GridFS'], ['s3-file-id', 'S3'], ['azure-blob-storage-description', 'Microsoft Azure Blob Storage'], ['gcs-storage-description', 'Google Cloud Storage']]) {
    assert.ok(waray[key].includes(name), key);
  }
  for (const key of ['operator-org', 'predicate-projection']) {
    assert.doesNotMatch(waray[key], /\s|:/, key);
  }
  assert.notEqual(waray['due-days-left'], waray['due-days-overdue']);
  for (const kind of ['Swimlane', 'List']) {
    assert.notEqual(waray['export' + kind + 'Popup-title'], waray['import' + kind + 'Popup-title']);
  }
});
