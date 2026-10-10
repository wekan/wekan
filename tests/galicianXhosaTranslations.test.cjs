const { translationTokens: currentTokens } = require('../releases/translations/placeholder-tokens.mjs');
// The completed catalog predates newer features; keep its no-regression gate.
// Full translation work remains visible through fill-translations.mjs --list.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const fillScript = path.join(root, 'releases/translations/fill-translations.mjs');
const locales = {};
for (const language of ['gl', 'gl-ES', 'xh']) {
  const result = spawnSync(process.execPath, [fillScript, '--completed-catalog', '--list', language], {
    cwd: root,
    encoding: 'utf8',
  });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout, '{}\n');
  locales[language] = JSON.parse(
    fs.readFileSync(path.join(root, `imports/i18n/data/${language}.i18n.json`), 'utf8'),
  );
}

// Xhosa's current fill includes the newer feature and pending source keys.
const xhosaFill = spawnSync(process.execPath, [fillScript, '--list', 'xh'], {
  cwd: root,
  encoding: 'utf8',
});
assert.equal(xhosaFill.status, 0, xhosaFill.stderr);
assert.deepEqual(JSON.parse(xhosaFill.stdout), {}, 'Xhosa current fill remains complete');

for (const language of ['gl', 'gl-ES']) {
  assert.equal(locales[language]['select-none'], 'Non seleccionar ningún');
  assert.equal(locales[language].backup, 'Copia de seguranza');
}
assert.equal(locales.xh['select-none'], 'Ungakhethi nanye');
assert.match(locales.xh['font-preview-text'], /0123456789$/);

for (const locale of Object.values(locales)) {
  assert.match(locale['office-report-desc'], /IPv4.*IPv6/);
  assert.match(locale['api-no-calls'], /REST API.*WITH_API=true/);
}

(async () => {
  const { translationTokens } = await import('../releases/translations/placeholder-tokens.mjs');
  const source = JSON.parse(fs.readFileSync(path.join(root, 'imports/i18n/data/en.i18n.json'), 'utf8'));
  const locale = locales.xh;
  const keys = [
  "board-announcement",
  "board-announcement-enabled",
  "cards-use-list-color",
  "external-link-rules",
  "external-link-rules-description",
  "external-link-identifier-aliases",
  "read-only-field",
  "r-moved-forward",
  "r-moved-back",
  "r-assignee",
  "r-add-actinguser-assignee",
  "r-remove-all-assignees",
  "ldap-sync-now",
  "ldap-sync-now-done",
  "ldap-sync-now-error",
  "ldap-sync-now-nothing",
  "oauth-providers-allowed-email-domains",
  "card-field-visibility",
  "card-field-visibility-desc",
  "r-blocks-view",
  "r-blocks-help",
  "r-blocks-discard",
  "r-blocks-unavailable",
  "r-blocks-invalid",
  "r-blocks-conflict",
  "r-blocks-permission",
  "r-blocks-unsaved",
  "r-blocks-saved",
  "r-blocks-reload"
];
  keys.push(...[
  "board-view-product-backlog",
  "board-view-sprints",
  "board-view-sprint-report",
  "board-view-velocity",
  "scrum-settings",
  "scrum-product-owner",
  "scrum-master",
  "scrum-developers",
  "scrum-working-days",
  "scrum-enabled",
  "scrum-product-goal",
  "scrum-definition-of-done",
  "scrum-estimate-source",
  "scrum-estimate-unit",
  "scrum-completion-policy",
  "scrum-source-poker",
  "scrum-source-customField",
  "scrum-policy-dueComplete",
  "scrum-policy-doneLists",
  "scrum-sprints",
  "scrum-sprint",
  "scrum-start-sprint",
  "scrum-close-sprint",
  "scrum-cancel-sprint",
  "scrum-rollover-sprint",
  "scrum-cancel-reason",
  "scrum-product-backlog",
  "scrum-edit-sprint",
  "scrum-sprint-goal",
  "scrum-capacity"
]);
  keys.push(...[
  "scrum-new-sprint",
  "scrum-releases",
  "scrum-release",
  "scrum-release-scope",
  "scrum-releases-select-help",
  "scrum-select-sprint",
  "scrum-backlog",
  "scrum-backlog-help",
  "scrum-estimate",
  "scrum-backlog-rank",
  "scrum-issue-type",
  "scrum-acceptance-criteria",
  "scrum-events",
  "scrum-event-kind",
  "scrum-timebox",
  "scrum-notes",
  "scrum-event-planning",
  "scrum-event-daily",
  "scrum-event-review",
  "scrum-event-retrospective",
  "scrum-committed",
  "scrum-completed",
  "scrum-added",
  "scrum-removed",
  "scrum-incomplete",
  "scrum-no-closed-sprints",
  "scrum-report-help",
  "scrum-total",
  "scrum-state-planned",
  "scrum-state-active"
]);
  keys.push(...[
  "scrum-state-closed",
  "scrum-state-cancelled",
  "scrum-unknown-estimate",
  "scrum-confirm-close",
  "scrum-confirm-cancel",
  "scrum-past-sprints",
  "scrum-list-category",
  "scrum-swimlane-purpose",
  "scrum-category-backlog",
  "scrum-category-todo",
  "scrum-category-doing",
  "scrum-category-done",
  "scrum-partial-report",
  "scrum-state-released",
  "scrum-released-at",
  "scrum-follow-up-cards",
  "scrum-import-reference-omitted",
  "scrum-partial-snapshot",
  "scrum-resume-close",
  "scrum-daily-observations",
  "scrum-daily-observations-help",
  "scrum-daily-truncated",
  "scrum-daily-empty",
  "scrum-observed-scope"
]);
  keys.push(...[
  "scrum-daily-observations-export-help",
  "scrum-import-pending",
  "scrum-import-into-board",
  "scrum-import-into-board-hint",
  "scrum-import-preview",
  "scrum-import-choose-file",
  "scrum-import-invalid-file",
  "scrum-import-preview-sprints",
  "scrum-import-preview-releases",
  "scrum-import-preview-cards",
  "scrum-import-preview-nothing",
  "scrum-import-into-board-done",
  "scrum-import-card-not-matched",
  "scrum-import-card-ambiguous",
  "scrum-import-card-on-another-board",
  "scrum-import-record-ambiguous",
  "scrum-import-record-not-imported",
  "scrum-import-sprint-finished",
  "sync-conflict-heading",
  "sync-conflict-hint",
  "sync-conflict-local",
  "sync-conflict-keep-local"
]);
  keys.push(...[
  "sync-conflict-use-source",
  "sync-conflict-refresh",
  "sync-conflict-review-complete",
  "sync-conflict-duplicate",
  "sync-conflict-keep-mapping",
  "sync-conflict-detach",
  "sync-conflict-detach-hint",
  "sync-conflict-archive",
  "sync-conflict-archive-hint",
  "sync-conflict-keep-card-local",
  "sync-conflict-creation",
  "sync-conflict-creation-hint",
  "sync-conflict-create-replacement",
  "sync-preview-button",
  "sync-preview-heading",
  "sync-preview-saved",
  "sync-preview-unavailable",
  "sync-preview-blocked",
  "sync-preview-create",
  "sync-preview-update"
]);
  keys.push(...[
  "sync-preview-archive",
  "sync-preview-baseline",
  "sync-preview-truncated",
  "sync-preview-omissions",
  "sync-preview-scope",
  "sync-preview-excluded",
  "sync-preview-unmapped",
  "sync-preview-parser-warnings",
  "sync-preview-parser-unsupported",
  "sync-source-heading",
  "sync-source-scope",
  "sync-source-unmapped",
  "sync-source-excluded",
  "sync-source-converted",
  "sync-source-fallback",
  "sync-source-excluded-item",
  "sync-source-occurrences",
  "sync-source-truncated",
  "sync-source-omitted",
  "sync-report-button",
  "sync-report-retention",
  "sync-report-partial",
  "sync-report-unfinished",
  "sync-report-failed"
]);
  keys.push(...[
  "sync-report-completed",
  "sync-report-completed-with-warnings",
  "sync-report-skipped",
  "sync-report-review-only",
  "sync-report-unavailable",
  "sync-report-empty",
  "sync-recovery-heading",
  "sync-recovery-description",
  "sync-recovery-unavailable",
  "sync-recovery-all",
  "sync-estimate-field",
  "sync-estimate-field-hint",
  "email-failure-smtp-temporary",
  "email-failure-smtp-rejected",
  "email-failure-smtp-authentication",
  "email-failure-smtp-configuration",
  "email-failure-recipient-unavailable",
  "email-failure-delivery-unconfirmed",
  "email-failure-acknowledgement-failed",
  "email-failure-delivery-failed",
  "email-failure-retry-limit",
  "sync-original-time",
  "sync-remaining-time",
  "sync-time-estimate-hint",
  "sync-planning-sprint",
  "sync-planning-releases",
  "sync-planning-fields",
  "sync-planning-hint",
  "activity-recovery-heading",
  "activity-recovery-description",
  "activity-recovery-empty",
  "activity-recovery-unavailable",
  "activity-recovery-retry",
  "activity-recovery-retrying",
  "activity-recovery-status-pending"
]);
  keys.push(...[
  "activity-recovery-status-preparing",
  "activity-recovery-status-processing",
  "activity-recovery-status-missing",
  "activity-recovery-status-changed",
  "activity-recovery-status-invalid",
  "activity-recovery-status-inconsistent",
  "activity-recovery-busy",
  "activity-recovery-denied",
  "activity-recovery-source-unavailable",
  "activity-recovery-disabled",
  "activity-recovery-failed",
  "activity-recovery-pause",
  "activity-recovery-resume",
  "activity-recovery-paused",
  "activity-recovery-control-conflict",
  "activity-recovery-control-failed",
  "activity-recovery-status-cancelled",
  "activity-recovery-cancel",
  "activity-recovery-cancel-confirm",
  "rule-email-recovery-unavailable",
  "stuck-sync-operation-heading",
  "stuck-sync-operation-description",
  "stuck-sync-operation-list",
  "stuck-sync-operation-progress",
  "stuck-sync-operation-reason",
  "stuck-sync-operation-applied",
  "stuck-sync-operation-reason-scope-changed",
  "stuck-sync-operation-reason-access-denied",
  "stuck-sync-operation-reason-trigger-unknown",
  "stuck-sync-operation-reason-intent-missing",
  "stuck-sync-operation-reason-unknown",
  "stuck-sync-operation-replayable-now",
  "stuck-sync-operation-discard",
  "stuck-sync-operation-discard-confirm",
  "stuck-sync-operation-refresh",
  "stuck-sync-operation-empty",
  "stuck-sync-operation-truncated",
  "stuck-sync-operation-unavailable",
  "stuck-sync-operation-missing",
  "stuck-sync-operation-not-stuck"
]);
  keys.push(...[
  "stuck-sync-operation-replayable",
  "stuck-sync-operation-busy",
  "stuck-sync-operation-failed",
  "interrupted-import-heading",
  "interrupted-import-description",
  "interrupted-import-board",
  "interrupted-import-progress",
  "interrupted-import-created",
  "interrupted-import-source",
  "interrupted-import-state-stopped",
  "interrupted-import-state-failed",
  "interrupted-import-state-discarding",
  "interrupted-import-scrum",
  "interrupted-import-counts",
  "interrupted-import-no-board",
  "interrupted-import-keep",
  "interrupted-import-discard",
  "interrupted-import-keep-confirm",
  "interrupted-import-discard-confirm",
  "interrupted-import-refresh",
  "interrupted-import-empty",
  "interrupted-import-truncated",
  "interrupted-import-unavailable",
  "interrupted-import-missing",
  "interrupted-import-not-interrupted",
  "interrupted-import-foreign-board",
  "interrupted-import-scrum-busy",
  "interrupted-import-failed",
  "scrum-history-checkpoint-stuck",
  "scrum-history-checkpoint-counts",
  "scrum-history-checkpoint-hint",
  "scrum-history-checkpoint-rollback",
  "scrum-history-checkpoint-discard",
  "scrum-history-checkpoint-discard-confirm",
  "scrum-history-checkpoint-ask-admin"
]);
  keys.push(...[
  "login-setting-env-only",
  "blockly-ALT_KEY",
  "blockly-BACKSPACE_KEY",
  "blockly-CANNOT_DELETE_VARIABLE_PROCEDURE",
  "blockly-CAPS_LOCK_KEY",
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
  "blockly-COMMAND_KEY",
  "blockly-CONTEXT_MENU_KEY",
  "blockly-CONTROLS_FLOW_STATEMENTS_OPERATOR_BREAK",
  "blockly-CONTROLS_FLOW_STATEMENTS_OPERATOR_CONTINUE",
  "blockly-CONTROLS_FLOW_STATEMENTS_TOOLTIP_BREAK",
  "blockly-CONTROLS_FLOW_STATEMENTS_TOOLTIP_CONTINUE",
  "blockly-CONTROLS_FLOW_STATEMENTS_WARNING",
  "blockly-CONTROLS_FOREACH_TITLE",
  "blockly-CONTROLS_FOREACH_TOOLTIP",
  "blockly-CONTROLS_FOR_TITLE",
  "blockly-CONTROLS_FOR_TOOLTIP",
  "blockly-CONTROLS_IF_ELSEIF_TOOLTIP"
]);
  keys.push(...[
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
  "blockly-CONTROL_KEY",
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
  "blockly-END_KEY",
  "blockly-ENTER_KEY",
  "blockly-ESCAPE",
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
  "blockly-FIELD_LABEL_OPTION_INDEX"
]);
  keys.push(...[
  "blockly-FIELD_LABEL_VARIABLE",
  "blockly-FIELD_MULTILINEINPUT_FINISH_EDITING",
  "blockly-FIELD_MULTILINEINPUT_NEW_LINE",
  "blockly-HELP_PROMPT",
  "blockly-HOME_KEY",
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
  "blockly-INPUT_LABEL_MATH_DIVISOR"
]);
  keys.push(...[
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
  "blockly-INSERT_KEY",
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
  "blockly-LISTS_GET_INDEX_FIRST"
]);
  keys.push(...[
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
  "blockly-LISTS_GET_SUBLIST_END_FROM_END",
  "blockly-LISTS_GET_SUBLIST_END_LAST",
  "blockly-LISTS_GET_SUBLIST_START_FIRST",
  "blockly-LISTS_GET_SUBLIST_START_FROM_END",
  "blockly-LISTS_GET_SUBLIST_START_FROM_START",
  "blockly-LISTS_GET_SUBLIST_TOOLTIP",
  "blockly-LISTS_INDEX_FROM_END_TOOLTIP",
  "blockly-LISTS_INDEX_FROM_START_TOOLTIP",
  "blockly-LISTS_INDEX_OF_FIRST",
  "blockly-LISTS_INDEX_OF_LAST",
  "blockly-LISTS_INDEX_OF_TOOLTIP",
  "blockly-LISTS_INLIST",
  "blockly-LISTS_ISEMPTY_TITLE",
  "blockly-LISTS_ISEMPTY_TOOLTIP",
  "blockly-LISTS_LENGTH_TITLE",
  "blockly-LISTS_LENGTH_TOOLTIP",
  "blockly-LISTS_REPEAT_TITLE",
  "blockly-LISTS_REPEAT_TOOLTIP",
  "blockly-LISTS_REVERSE_MESSAGE0",
  "blockly-LISTS_REVERSE_TOOLTIP",
  "blockly-LISTS_SET_INDEX_INSERT",
  "blockly-LISTS_SET_INDEX_SET"
]);
  keys.push(...[
  "blockly-LISTS_SET_INDEX_TOOLTIP_INSERT_FIRST",
  "blockly-LISTS_SET_INDEX_TOOLTIP_INSERT_FROM",
  "blockly-LISTS_SET_INDEX_TOOLTIP_INSERT_LAST",
  "blockly-LISTS_SET_INDEX_TOOLTIP_INSERT_RANDOM",
  "blockly-LISTS_SET_INDEX_TOOLTIP_SET_FIRST",
  "blockly-LISTS_SET_INDEX_TOOLTIP_SET_FROM",
  "blockly-LISTS_SET_INDEX_TOOLTIP_SET_LAST",
  "blockly-LISTS_SET_INDEX_TOOLTIP_SET_RANDOM",
  "blockly-LISTS_SORT_ORDER_ASCENDING",
  "blockly-LISTS_SORT_ORDER_DESCENDING",
  "blockly-LISTS_SORT_TITLE",
  "blockly-LISTS_SORT_TOOLTIP",
  "blockly-LISTS_SORT_TYPE_IGNORECASE",
  "blockly-LISTS_SORT_TYPE_NUMERIC",
  "blockly-LISTS_SORT_TYPE_TEXT",
  "blockly-LISTS_SPLIT_LIST_FROM_TEXT",
  "blockly-LISTS_SPLIT_TEXT_FROM_LIST",
  "blockly-LISTS_SPLIT_TOOLTIP_JOIN",
  "blockly-LISTS_SPLIT_TOOLTIP_SPLIT",
  "blockly-LISTS_SPLIT_WITH_DELIMITER",
  "blockly-LOGIC_BOOLEAN_FALSE",
  "blockly-LOGIC_BOOLEAN_TOOLTIP",
  "blockly-LOGIC_BOOLEAN_TRUE",
  "blockly-LOGIC_COMPARE_EQ_ARIA",
  "blockly-LOGIC_COMPARE_GTE_ARIA",
  "blockly-LOGIC_COMPARE_GT_ARIA",
  "blockly-LOGIC_COMPARE_LTE_ARIA",
  "blockly-LOGIC_COMPARE_LT_ARIA",
  "blockly-LOGIC_COMPARE_NEQ_ARIA",
  "blockly-LOGIC_COMPARE_TOOLTIP_EQ",
  "blockly-LOGIC_COMPARE_TOOLTIP_GT",
  "blockly-LOGIC_COMPARE_TOOLTIP_GTE",
  "blockly-LOGIC_COMPARE_TOOLTIP_LT",
  "blockly-LOGIC_COMPARE_TOOLTIP_LTE",
  "blockly-LOGIC_COMPARE_TOOLTIP_NEQ"
]);
  keys.push(...[
  "blockly-LOGIC_NEGATE_TITLE",
  "blockly-LOGIC_NEGATE_TOOLTIP",
  "blockly-LOGIC_NULL_TOOLTIP",
  "blockly-LOGIC_OPERATION_AND",
  "blockly-LOGIC_OPERATION_TOOLTIP_AND",
  "blockly-LOGIC_OPERATION_TOOLTIP_OR",
  "blockly-LOGIC_TERNARY_CONDITION",
  "blockly-LOGIC_TERNARY_IF_FALSE",
  "blockly-LOGIC_TERNARY_IF_TRUE",
  "blockly-LOGIC_TERNARY_TOOLTIP",
  "blockly-MATH_ADDITION_SYMBOL_ARIA",
  "blockly-MATH_ARITHMETIC_TOOLTIP_ADD",
  "blockly-MATH_ARITHMETIC_TOOLTIP_DIVIDE",
  "blockly-MATH_ARITHMETIC_TOOLTIP_MINUS",
  "blockly-MATH_ARITHMETIC_TOOLTIP_MULTIPLY",
  "blockly-MATH_ARITHMETIC_TOOLTIP_POWER",
  "blockly-MATH_ATAN2_TITLE",
  "blockly-MATH_ATAN2_TOOLTIP",
  "blockly-MATH_CHANGE_TITLE",
  "blockly-MATH_CHANGE_TOOLTIP",
  "blockly-MATH_CONSTANT_GOLDEN_RATIO_ARIA",
  "blockly-MATH_CONSTANT_INFINITY_ARIA",
  "blockly-MATH_CONSTANT_SQRT1_2_ARIA",
  "blockly-MATH_CONSTANT_SQRT2_ARIA",
  "blockly-MATH_CONSTANT_TOOLTIP",
  "blockly-MATH_CONSTRAIN_TITLE",
  "blockly-MATH_CONSTRAIN_TOOLTIP",
  "blockly-MATH_DIVISION_SYMBOL_ARIA",
  "blockly-MATH_IS_DIVISIBLE_BY",
  "blockly-MATH_IS_EVEN"
]);
  keys.push(...[
  "blockly-MATH_IS_NEGATIVE",
  "blockly-MATH_IS_ODD",
  "blockly-MATH_IS_POSITIVE",
  "blockly-MATH_IS_PRIME",
  "blockly-MATH_IS_TOOLTIP",
  "blockly-MATH_IS_WHOLE",
  "blockly-MATH_MODULO_TITLE",
  "blockly-MATH_MODULO_TOOLTIP",
  "blockly-MATH_MULTIPLICATION_SYMBOL_ARIA",
  "blockly-MATH_NUMBER_TOOLTIP",
  "blockly-MATH_ONLIST_OPERATOR_AVERAGE",
  "blockly-MATH_ONLIST_OPERATOR_MAX",
  "blockly-MATH_ONLIST_OPERATOR_MAX_ARIA",
  "blockly-MATH_ONLIST_OPERATOR_MEDIAN",
  "blockly-MATH_ONLIST_OPERATOR_MIN",
  "blockly-MATH_ONLIST_OPERATOR_MIN_ARIA",
  "blockly-MATH_ONLIST_OPERATOR_MODE",
  "blockly-MATH_ONLIST_OPERATOR_RANDOM",
  "blockly-MATH_ONLIST_OPERATOR_STD_DEV",
  "blockly-MATH_ONLIST_OPERATOR_SUM",
  "blockly-MATH_ONLIST_TOOLTIP_AVERAGE",
  "blockly-MATH_ONLIST_TOOLTIP_MAX",
  "blockly-MATH_ONLIST_TOOLTIP_MEDIAN",
  "blockly-MATH_ONLIST_TOOLTIP_MIN",
  "blockly-MATH_ONLIST_TOOLTIP_MODE",
  "blockly-MATH_ONLIST_TOOLTIP_RANDOM",
  "blockly-MATH_ONLIST_TOOLTIP_STD_DEV",
  "blockly-MATH_ONLIST_TOOLTIP_SUM",
  "blockly-MATH_POWER_SYMBOL_ARIA",
  "blockly-MATH_RANDOM_FLOAT_TITLE_RANDOM",
  "blockly-MATH_RANDOM_FLOAT_TOOLTIP",
  "blockly-MATH_RANDOM_INT_TITLE",
  "blockly-MATH_RANDOM_INT_TOOLTIP",
  "blockly-MATH_ROUND_OPERATOR_ROUND",
  "blockly-MATH_ROUND_OPERATOR_ROUNDDOWN"
]);
  keys.push(...[
  "blockly-MATH_ROUND_OPERATOR_ROUNDUP",
  "blockly-MATH_ROUND_TOOLTIP",
  "blockly-MATH_SINGLE_OP_ABSOLUTE",
  "blockly-MATH_SINGLE_OP_ABSOLUTE_ARIA",
  "blockly-MATH_SINGLE_OP_EXP_ARIA",
  "blockly-MATH_SINGLE_OP_LN_ARIA",
  "blockly-MATH_SINGLE_OP_LOG10_ARIA",
  "blockly-MATH_SINGLE_OP_NEG_ARIA",
  "blockly-MATH_SINGLE_OP_POW10_ARIA",
  "blockly-MATH_SINGLE_OP_ROOT",
  "blockly-MATH_SINGLE_TOOLTIP_ABS",
  "blockly-MATH_SINGLE_TOOLTIP_EXP",
  "blockly-MATH_SINGLE_TOOLTIP_LN",
  "blockly-MATH_SINGLE_TOOLTIP_LOG10",
  "blockly-MATH_SINGLE_TOOLTIP_NEG",
  "blockly-MATH_SINGLE_TOOLTIP_POW10",
  "blockly-MATH_SINGLE_TOOLTIP_ROOT",
  "blockly-MATH_SUBTRACTION_SYMBOL_ARIA",
  "blockly-MATH_TRIG_ACOS_ARIA",
  "blockly-MATH_TRIG_ASIN_ARIA",
  "blockly-MATH_TRIG_ATAN_ARIA",
  "blockly-MATH_TRIG_COS_ARIA",
  "blockly-MATH_TRIG_SIN_ARIA",
  "blockly-MATH_TRIG_TAN_ARIA",
  "blockly-MATH_TRIG_TOOLTIP_ACOS",
  "blockly-MATH_TRIG_TOOLTIP_ASIN",
  "blockly-MATH_TRIG_TOOLTIP_ATAN",
  "blockly-MATH_TRIG_TOOLTIP_COS",
  "blockly-MATH_TRIG_TOOLTIP_SIN",
  "blockly-MATH_TRIG_TOOLTIP_TAN"
]);
  keys.push(...[
  "blockly-MINIMAP_ARIA_LABEL",
  "blockly-MOVE_BLOCK",
  "blockly-NEW_COLOUR_VARIABLE",
  "blockly-NEW_NUMBER_VARIABLE",
  "blockly-NEW_STRING_VARIABLE",
  "blockly-NEW_VARIABLE",
  "blockly-NEW_VARIABLE_TITLE",
  "blockly-NEW_VARIABLE_TYPE_TITLE",
  "blockly-NO_PARENT_ANNOUNCEMENT",
  "blockly-OPEN_BACKPACK",
  "blockly-OPEN_TRASH",
  "blockly-OPTION_KEY",
  "blockly-PAGE_DOWN_KEY",
  "blockly-PAGE_UP_KEY",
  "blockly-PARENT_BLOCKS_ANNOUNCEMENT",
  "blockly-PASTE_ALL_FROM_BACKPACK",
  "blockly-PASTE_SHORTCUT",
  "blockly-PAUSE_KEY",
  "blockly-PROCEDURES_ALLOW_STATEMENTS",
  "blockly-PROCEDURES_BEFORE_PARAMS",
  "blockly-PROCEDURES_CALLNORETURN_TOOLTIP",
  "blockly-PROCEDURES_CALLRETURN_TOOLTIP",
  "blockly-PROCEDURES_CALL_BEFORE_PARAMS",
  "blockly-PROCEDURES_CALL_DISABLED_DEF_WARNING",
  "blockly-PROCEDURES_CREATE_DO",
  "blockly-PROCEDURES_DEFNORETURN_COMMENT",
  "blockly-PROCEDURES_DEFNORETURN_PROCEDURE",
  "blockly-PROCEDURES_DEFNORETURN_TOOLTIP",
  "blockly-PROCEDURES_DEFRETURN_RETURN",
  "blockly-PROCEDURES_DEFRETURN_TOOLTIP",
  "blockly-PROCEDURES_DEF_DUPLICATE_WARNING",
  "blockly-PROCEDURES_HIGHLIGHT_DEF",
  "blockly-PROCEDURES_IFRETURN_TOOLTIP",
  "blockly-PROCEDURES_IFRETURN_WARNING",
  "blockly-PROCEDURES_MUTATORARG_TITLE"
]);
  keys.push(...[
  "blockly-PROCEDURES_MUTATORARG_TOOLTIP",
  "blockly-PROCEDURES_MUTATORCONTAINER_TITLE",
  "blockly-PROCEDURES_MUTATORCONTAINER_TOOLTIP",
  "blockly-REDO",
  "blockly-REMOVE_FROM_BACKPACK",
  "blockly-RENAME_VARIABLE",
  "blockly-RENAME_VARIABLE_TITLE",
  "blockly-RESET_ZOOM",
  "blockly-SCREENREADER_HINT",
  "blockly-SCREENREADER_MODE_DISABLED",
  "blockly-SCREENREADER_MODE_ENABLED",
  "blockly-SHIFT_KEY",
  "blockly-SHORTCUTS_ABORT_MOVE",
  "blockly-SHORTCUTS_CLEANUP",
  "blockly-SHORTCUTS_CODE_NAVIGATION",
  "blockly-SHORTCUTS_DISCONNECT",
  "blockly-SHORTCUTS_DUPLICATE",
  "blockly-SHORTCUTS_EDITING",
  "blockly-SHORTCUTS_ESCAPE",
  "blockly-SHORTCUTS_EXTENDED_INFORMATION",
  "blockly-SHORTCUTS_FINISH_MOVE",
  "blockly-SHORTCUTS_FOCUS_TOOLBOX",
  "blockly-SHORTCUTS_FOCUS_WORKSPACE",
  "blockly-SHORTCUTS_GENERAL",
  "blockly-SHORTCUTS_INFORMATION",
  "blockly-SHORTCUTS_JUMP_BLOCK_END",
  "blockly-SHORTCUTS_JUMP_BLOCK_START",
  "blockly-SHORTCUTS_JUMP_BOTTOM_STACK",
  "blockly-SHORTCUTS_JUMP_FIRST_BLOCK",
  "blockly-SHORTCUTS_JUMP_LAST_BLOCK",
  "blockly-SHORTCUTS_JUMP_NEXT_PAGE",
  "blockly-SHORTCUTS_JUMP_PREVIOUS_PAGE",
  "blockly-SHORTCUTS_JUMP_TOP_STACK",
  "blockly-SHORTCUTS_MOVE_DOWN",
  "blockly-SHORTCUTS_MOVE_LEFT",
  "blockly-SHORTCUTS_MOVE_RIGHT",
  "blockly-SHORTCUTS_MOVE_UP",
  "blockly-SHORTCUTS_NEXT_HEADING",
  "blockly-SHORTCUTS_NEXT_STACK",
  "blockly-SHORTCUTS_PERFORM_ACTION"
]);
  keys.push(...[
  "blockly-SHORTCUTS_PREVIOUS_HEADING",
  "blockly-SHORTCUTS_PREVIOUS_STACK",
  "blockly-SHORTCUTS_SCROLL_DOWN",
  "blockly-SHORTCUTS_SCROLL_LEFT",
  "blockly-SHORTCUTS_SCROLL_RIGHT",
  "blockly-SHORTCUTS_SCROLL_UP",
  "blockly-SHORTCUTS_SHOW_CONTEXT_MENU",
  "blockly-SHORTCUTS_SHOW_TOOLTIP",
  "blockly-SHORTCUTS_START_MOVE",
  "blockly-SHORTCUTS_START_MOVE_STACK",
  "blockly-SHORTCUTS_TOGGLE_SCREENREADER_MODE",
  "blockly-SPACE_KEY",
  "blockly-TAB_KEY",
  "blockly-TEXT_APPEND_TITLE",
  "blockly-TEXT_APPEND_TOOLTIP",
  "blockly-TEXT_CHANGECASE_OPERATOR_LOWERCASE",
  "blockly-TEXT_CHANGECASE_OPERATOR_TITLECASE",
  "blockly-TEXT_CHANGECASE_OPERATOR_UPPERCASE",
  "blockly-TEXT_CHANGECASE_TOOLTIP",
  "blockly-TEXT_CHARAT_FIRST",
  "blockly-TEXT_CHARAT_FROM_END",
  "blockly-TEXT_CHARAT_FROM_START",
  "blockly-TEXT_CHARAT_LAST",
  "blockly-TEXT_CHARAT_RANDOM",
  "blockly-TEXT_CHARAT_TITLE",
  "blockly-TEXT_CHARAT_TOOLTIP",
  "blockly-TEXT_COUNT_MESSAGE0",
  "blockly-TEXT_COUNT_TOOLTIP",
  "blockly-TEXT_CREATE_JOIN_ITEM_TOOLTIP",
  "blockly-TEXT_CREATE_JOIN_TITLE_JOIN",
  "blockly-TEXT_CREATE_JOIN_TOOLTIP",
  "blockly-TEXT_FROM_END_ARIA",
  "blockly-TEXT_FROM_START_ARIA",
  "blockly-TEXT_GET_SUBSTRING_END_FROM_END",
  "blockly-TEXT_GET_SUBSTRING_END_FROM_START",
  "blockly-TEXT_GET_SUBSTRING_END_LAST",
  "blockly-TEXT_GET_SUBSTRING_INPUT_IN_TEXT",
  "blockly-TEXT_GET_SUBSTRING_START_FIRST",
  "blockly-TEXT_GET_SUBSTRING_START_FROM_END",
  "blockly-TEXT_GET_SUBSTRING_START_FROM_START"
]);
  keys.push(...[
  "blockly-TEXT_GET_SUBSTRING_TOOLTIP",
  "blockly-TEXT_INDEXOF_OPERATOR_FIRST",
  "blockly-TEXT_INDEXOF_OPERATOR_LAST",
  "blockly-TEXT_INDEXOF_TITLE",
  "blockly-TEXT_INDEXOF_TOOLTIP",
  "blockly-TEXT_ISEMPTY_TITLE",
  "blockly-TEXT_ISEMPTY_TOOLTIP",
  "blockly-TEXT_JOIN_TITLE_CREATEWITH",
  "blockly-TEXT_JOIN_TOOLTIP",
  "blockly-TEXT_LENGTH_TITLE",
  "blockly-TEXT_LENGTH_TOOLTIP",
  "blockly-TEXT_PRINT_TITLE",
  "blockly-TEXT_PRINT_TOOLTIP",
  "blockly-TEXT_PROMPT_TOOLTIP_NUMBER",
  "blockly-TEXT_PROMPT_TOOLTIP_TEXT",
  "blockly-TEXT_PROMPT_TYPE_NUMBER",
  "blockly-TEXT_PROMPT_TYPE_TEXT",
  "blockly-TEXT_REPLACE_MESSAGE0",
  "blockly-TEXT_REPLACE_TOOLTIP",
  "blockly-TEXT_REVERSE_MESSAGE0",
  "blockly-TEXT_REVERSE_TOOLTIP",
  "blockly-TEXT_TEXT_TOOLTIP",
  "blockly-TEXT_TRIM_OPERATOR_BOTH",
  "blockly-TEXT_TRIM_OPERATOR_LEFT",
  "blockly-TEXT_TRIM_OPERATOR_RIGHT",
  "blockly-TEXT_TRIM_TOOLTIP",
  "blockly-TODAY",
  "blockly-UNDO",
  "blockly-UNKNOWN",
  "blockly-UNNAMED_KEY",
  "blockly-VARIABLES_DEFAULT_NAME",
  "blockly-VARIABLES_GET_CREATE_SET",
  "blockly-VARIABLES_GET_TOOLTIP",
  "blockly-VARIABLES_SET",
  "blockly-VARIABLES_SET_CREATE_GET",
  "blockly-VARIABLES_SET_TOOLTIP",
  "blockly-VARIABLE_ALREADY_EXISTS",
  "blockly-VARIABLE_ALREADY_EXISTS_FOR_ANOTHER_TYPE",
  "blockly-VARIABLE_ALREADY_EXISTS_FOR_A_PARAMETER",
  "blockly-WORKSPACE_COMMENT_DEFAULT_TEXT",
  "blockly-WORKSPACE_CONTENTS_BLOCKS_MANY",
  "blockly-WORKSPACE_CONTENTS_BLOCKS_ONE",
  "blockly-WORKSPACE_CONTENTS_BLOCKS_ZERO",
  "blockly-WORKSPACE_CONTENTS_COMMENTS_MANY",
  "blockly-WORKSPACE_CONTENTS_COMMENTS_ONE",
  "blockly-WORKSPACE_LABEL_1_STACK",
  "blockly-WORKSPACE_LABEL_FLYOUT_WORKSPACE",
  "blockly-WORKSPACE_LABEL_MANY_STACKS",
  "blockly-WORKSPACE_LABEL_MUTATOR_WORKSPACE",
  "blockly-WORKSPACE_LABEL_PLAIN",
  "blockly-WORKSPACE_SEARCH_CLOSE",
  "blockly-WORKSPACE_SEARCH_FIND_NEXT",
  "blockly-WORKSPACE_SEARCH_FIND_PREVIOUS",
  "blockly-WORKSPACE_SEARCH_INPUT_LABEL",
  "blockly-WORKSPACE_SEARCH_MATCH",
  "blockly-WORKSPACE_SEARCH_NO_MATCHES",
  "blockly-WORKSPACE_SEARCH_PLACEHOLDER",
  "blockly-ZOOM_TO_FIT_ARIA_LABEL",
  "blockly-CONTROLS_IF_ELSEIF_TITLE_ELSEIF",
  "blockly-CONTROLS_IF_ELSE_TITLE_ELSE",
  "blockly-LISTS_CREATE_WITH_ITEM_TITLE",
  "blockly-LISTS_GET_INDEX_INPUT_IN_LIST",
  "blockly-LISTS_GET_SUBLIST_INPUT_IN_LIST",
  "blockly-LISTS_INDEX_OF_INPUT_IN_LIST",
  "blockly-LISTS_SET_INDEX_INPUT_IN_LIST",
  "blockly-MATH_CHANGE_TITLE_ITEM",
  "blockly-PROCEDURES_DEFRETURN_COMMENT",
  "blockly-PROCEDURES_DEFRETURN_PROCEDURE",
  "blockly-TEXT_APPEND_VARIABLE",
  "blockly-TEXT_CREATE_JOIN_ITEM_TITLE_ITEM"
]);
  keys.push(...[
  "import-board-instruction-opml",
  "import-board-instruction-orgmode",
  "import-board-instruction-todoist",
  "import-board-instruction-planner",
  "import-board-instruction-meistertask",
  "import-board-instruction-obsidian",
  "import-board-instruction-linear",
  "import-board-instruction-ticktick"
]);
  keys.push(...[
  "import-board-instruction-clickup",
  "import-board-instruction-nullboard",
  "import-board-instruction-kanri",
  "import-board-instruction-pivotal",
  "import-board-instruction-tasksorg",
  "import-board-instruction-monday",
  "import-board-instruction-superproductivity",
  "import-board-instruction-taiga",
  "import-board-instruction-vikunja"
]);
  keys.push(...[
  "import-board-instruction-quire",
  "import-board-instruction-wrike",
  "import-board-instruction-teamwork",
  "import-board-instruction-businessmap",
  "import-board-instruction-redmine",
  "import-board-instruction-notion",
  "import-board-instruction-plane"
]);
  for (const key of keys) {
    assert.notEqual(locale[key], source[key], key);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(source[key]), key);
  }
  const links = 'external-link-rules-description';
  assert.deepEqual(locale[links].match(/\{(?:identifier|number)\}/g), source[links].match(/\{(?:identifier|number)\}/g));
  assert.ok(locale[links].includes('[{identifier}:{number}] = https://tracker.example.com/{identifier}/{number}'));
  for (const name of ['LDAP_BACKGROUND_SYNC_IMPORT_NEW_USERS', 'LDAP_BACKGROUND_SYNC_KEEP_EXISTANT_USERS_UPDATED']) assert.ok(locale['ldap-sync-now-nothing'].includes(name));
  assert.match(locale['read-only-field'], /ngabaphathi bebhodi kuphela/);
  assert.match(locale['r-blocks-invalid'], /esinye kuphela.*esinye/);
  assert.match(locale['r-blocks-conflict'], /Layisha kwakhona.*ngaphambi kokugcina/);
  assert.match(locale['card-field-visibility-desc'], /Akukho datha yekhadi.*etshintshayo/);
  assert.match(locale['scrum-start-sprint'], /^Qala/);
  assert.match(locale['scrum-close-sprint'], /^Vala/);
  assert.match(locale['scrum-cancel-sprint'], /^Rhoxisa/);
  assert.match(locale['scrum-rollover-sprint'], /ongagqitywanga/);
  assert.equal(locale['board-view-product-backlog'], locale['scrum-product-backlog']);
  assert.equal(locale['board-view-sprints'], locale['scrum-sprints']);
  assert.notEqual(locale['scrum-policy-dueComplete'], locale['scrum-policy-doneLists']);
  for (const literal of ['Ctrl', 'Cmd', 'Mac']) assert.ok(locale['scrum-releases-select-help'].includes(literal));
  assert.match(locale['scrum-report-help'], /lubalwa ngokwahlukeneyo.*asilulo uqikelelo olunguziro/);
  assert.match(locale['scrum-report-help'], /kuphela xa iiyunithi zoqikelelo nemigaqo zifana/);
  assert.notEqual(locale['scrum-completed'], locale['scrum-incomplete']);
  const totals = locale['scrum-total'].replace('__count__', '3').replace('__estimate__', '8').replace('__unknown__', '1');
  assert.match(totals, /3.*8.*1/);
  assert.doesNotMatch(totals, /__\w+__/);
  assert.match(locale['scrum-confirm-close'], /aya kuhanjiswa kwindawo ekhethiweyo/);
  assert.match(locale['scrum-confirm-cancel'], /ahlala eyinxalenye yayo ade abelwe/);
  assert.match(locale['scrum-partial-report'], /kuphela amakhadi owabelweyo ngoku/);
  assert.match(locale['scrum-daily-observations-help'], /UTC.*Iintsuku ezingekhoyo azifakwa/);
  assert.match(locale['scrum-daily-observations-help'], /akurekhodi lonke utshintsho/);
  assert.match(locale['scrum-daily-observations-help'], /olungaziwayo alunguziro/);
  assert.match(locale['scrum-daily-truncated'], /366/);
  const reference = locale['scrum-import-reference-omitted'].replace('__reference__', 'CARD-7');
  assert.ok(reference.includes('CARD-7'));
  assert.ok(!reference.includes('__reference__'));
  assert.match(locale['scrum-daily-observations-export-help'], /UTC.*iintsuku ezingekhoyo azifakwa/);
  assert.match(locale['scrum-import-into-board-hint'], /akuphindwa.*nge-ID/);
  assert.match(locale['scrum-import-card-on-another-board'], /lishiywe lingatshintshwanga/);
  assert.match(locale['scrum-import-sprint-finished'], /alihanjiswanga/);
  assert.match(locale['sync-conflict-hint'], /Akukho nto ithunyelwa kwinkqubo yomthombo/);
  const preview = locale['scrum-import-preview-cards'].replace('__updated__', '2').replace('__unchanged__', '3').replace('__unmatched__', '4');
  assert.match(preview, /2.*3.*4/);
  assert.doesNotMatch(preview, /__\w+__/);
  assert.match(locale['sync-conflict-review-complete'], /loluhlu lonke aluqhutywanga/);
  assert.match(locale['sync-conflict-detach-hint'], /Susa kuphela.*Umxholo wayo uhlala kwi-WeKan/);
  assert.match(locale['sync-conflict-archive-hint'], /Amakhadi angaphantsi awatshintshwa/);
  assert.match(locale['sync-conflict-creation-hint'], /lingatshintshwanga.*Ukuzama kwakhona kusebenzisa/);
  assert.match(locale['sync-preview-unavailable'], /Gcina.*ngaphambi/);
  assert.match(locale['sync-preview-blocked'], /Sombulula.*ngaphambi/);
  assert.match(locale['sync-preview-truncated'], /100/);
  assert.match(locale['sync-source-truncated'], /100.*afinyeziweyo/);
  assert.match(locale['sync-report-retention'], /20.*30/);
  assert.match(locale['sync-preview-scope'], /zisenokushiywa/);
  assert.match(locale['sync-source-scope'], /amaxabiso azo akaboniswa/);
  assert.match(locale['sync-report-partial'], /lutshintshe amanye amakhadi/);
  assert.match(locale['sync-report-partial'], /aziqhubeki.*zirhoxise/);
  assert.match(locale['sync-report-unfinished'], /isiphumo asibhalwanga/);
  assert.match(locale['sync-report-failed'], /kusenokubakho utshintsho/);
  assert.equal(locale['sync-preview-unmapped'], locale['sync-source-unmapped']);
  assert.equal(locale['sync-preview-excluded'], locale['sync-source-excluded']);
  assert.match(locale['sync-recovery-description'], /30.*ID/);
  assert.match(locale['sync-recovery-description'], /azikwazi ukuqhubeka.*ukurhoxisa/);
  assert.match(locale['sync-report-unavailable'], /imvume yokubhala kulo lonke uluhlu/);
  for (const key of ['sync-estimate-field-hint', 'sync-time-estimate-hint']) {
    assert.match(locale[key], /Jira/);
    assert.match(locale[key], /angekhoyo.*awahoywa/);
    assert.match(locale[key], /null.*licima/);
  }
  assert.match(locale['sync-time-estimate-hint'], /enye kuphela/);
  assert.match(locale['sync-planning-hint'], /kuphela.*Scrum.*ivuliwe/);
  assert.match(locale['sync-planning-hint'], /kuqala nge-ID.*emva koko.*ngegama/);
  assert.match(locale['sync-planning-hint'], /lokuqala aluze lususe/);
  assert.match(locale['activity-recovery-description'], /akuze kudale umsebenzi kwakhona/);
  assert.match(locale['email-failure-delivery-unconfirmed'], /phonononga phambi/);
  assert.notEqual(locale['email-failure-smtp-temporary'], locale['email-failure-smtp-rejected']);
  assert.match(locale['activity-recovery-source-unavailable'], /Akukho nto idalwe kwakhona/);
  assert.match(locale['activity-recovery-failed'], /osalindileyo ugciniwe/);
  assert.match(locale['activity-recovery-cancel-confirm'], /ngokusisigxina.*akunakuphinda.*azibuyiswa/);
  assert.notEqual(locale['activity-recovery-pause'], locale['activity-recovery-cancel']);
  assert.notEqual(locale['activity-recovery-pause'], locale['activity-recovery-resume']);
  assert.match(locale['stuck-sync-operation-description'], /luyahlala.*aluze lubhalwe.*luthelekisa/);
  assert.match(locale['stuck-sync-operation-discard-confirm'], /luyahlala.*aluze lubhalwe/);
  assert.match(locale['stuck-sync-operation-replayable-now'], /kuzi?gqiba.*ayinakulahlwa/);
  assert.match(locale['stuck-sync-operation-not-stuck'], /ayinakulahlwa/);
  assert.match(locale['stuck-sync-operation-truncated'], /50/);
  const appliedChanges = locale['stuck-sync-operation-applied']
    .replace('__applied__', '3').replace('__total__', '9');
  assert.match(appliedChanges, /3.*9/);
  assert.doesNotMatch(appliedChanges, /__/);
  assert.match(locale['interrupted-import-description'], /akunakuqhubeka.*ayigcinwa/);
  assert.match(locale['interrupted-import-description'], /nayo yonke into.*eyongezwe/);
  assert.match(locale['interrupted-import-keep-confirm'], /Akukho nto isuswayo/);
  assert.match(locale['interrupted-import-discard-confirm'], /nayo yonke into.*ngokusisigxina/);
  assert.match(locale['interrupted-import-foreign-board'], /ayichukunyiswanga/);
  assert.match(locale['interrupted-import-truncated'], /50/);
  assert.match(locale['scrum-history-checkpoint-hint'], /kuphela.*kungekho mntu wumbi/);
  assert.match(locale['scrum-history-checkpoint-hint'], /akutshintshi zingxelo/);
  for (const key of ['interrupted-import-counts', 'interrupted-import-scrum', 'scrum-history-checkpoint-counts']) {
    const tokens = translationTokens(source[key]);
    let rendered = locale[key];
    tokens.forEach((token, index) => { rendered = rendered.replace(token, String(index + 1)); });
    assert.doesNotMatch(rendered, /__/);
    tokens.forEach((token, index) => { assert.ok(rendered.includes(String(index + 1))); });
  }
  assert.match(locale['login-setting-env-only'], /kuphela.*yeseva.*zifundwe kuphela/);
  assert.match(locale['blockly-COLOUR_BLEND_TOOLTIP'], /0\.0 - 1\.0/);
  assert.match(locale['blockly-COLOUR_RGB_TOOLTIP'], /0.*100/);
  assert.match(locale['blockly-CONTROLS_FLOW_STATEMENTS_WARNING'], /kuphela ngaphakathi komjikelo/);
  assert.notEqual(locale['blockly-CONTROLS_FLOW_STATEMENTS_OPERATOR_BREAK'], locale['blockly-CONTROLS_FLOW_STATEMENTS_OPERATOR_CONTINUE']);
  for (const name of ['ALT', 'BACKSPACE', 'CAPS_LOCK', 'COMMAND']) {
    assert.ok(locale[`blockly-${name}_KEY`].includes(source[`blockly-${name}_KEY`]));
  }
  const loopTitle = locale['blockly-CONTROLS_FOR_TITLE']
    .replace('%1', 'counter').replace('%2', '2').replace('%3', '8').replace('%4', '2');
  assert.match(loopTitle, /counter.*2.*8.*2/);
  assert.doesNotMatch(loopTitle, /%[1-4]/);
  assert.match(locale['blockly-CONTROLS_WHILEUNTIL_TOOLTIP_UNTIL'], /libubuxoki/);
  assert.match(locale['blockly-CONTROLS_WHILEUNTIL_TOOLTIP_WHILE'], /liyinyaniso/);
  assert.match(locale['blockly-CONTROLS_IF_TOOLTIP_4'], /akukho xabiso liyinyaniso.*yokugqibela/);
  assert.notEqual(locale['blockly-DISABLE_BLOCK'], locale['blockly-ENABLE_BLOCK']);
  assert.notEqual(locale['blockly-COPY_SHORTCUT'], locale['blockly-CUT_SHORTCUT']);
  for (const key of ['blockly-CONTROL_KEY', 'blockly-END_KEY', 'blockly-ENTER_KEY', 'blockly-ESCAPE']) {
    assert.ok(locale[key].includes(source[key]));
  }
  const bitmapLabel = locale['blockly-FIELD_BITMAP_PIXEL_LABEL']
    .replace('%1', 'pixel').replace('%2', '4').replace('%3', '7');
  assert.match(bitmapLabel, /pixel.*4.*7/);
  assert.doesNotMatch(bitmapLabel, /%[123]/);
  const deleteVariable = locale['blockly-DELETE_VARIABLE_CONFIRMATION']
    .replace('%1', '6').replace('%2', 'counter');
  assert.match(deleteVariable, /6.*counter/);
  assert.doesNotMatch(deleteVariable, /%[12]/);
  for (const kind of ['COMMENT', 'WARNING']) {
    assert.match(locale[`blockly-ICON_LABEL_${kind}_CLOSED`], /^Vula /);
    assert.match(locale[`blockly-ICON_LABEL_${kind}_OPEN`], /^Vala /);
  }
  assert.notEqual(locale['blockly-INPUT_LABEL_LISTS_START_POSITION'], locale['blockly-INPUT_LABEL_LISTS_END_POSITION']);
  assert.notEqual(locale['blockly-INPUT_LABEL_MATH_DIVIDEND'], locale['blockly-INPUT_LABEL_MATH_DIVISOR']);
  assert.equal(locale['blockly-INPUT_LABEL_LISTS_REPEAT_NUM'], locale['blockly-INPUT_LABEL_LOOP_TIMES']);
  assert.match(locale['blockly-HOME_KEY'], /Home/);
  const keyboardHelp = locale['blockly-HELP_PROMPT'].replace('%1', 'F1');
  assert.match(keyboardHelp, /F1/);
  assert.doesNotMatch(keyboardHelp, /%1/);
  assert.match(locale['blockly-INPUT_LABEL_NUMBER_ATAN2_X'], /x$/);
  assert.match(locale['blockly-INPUT_LABEL_NUMBER_ATAN2_Y'], /y$/);
  assert.notEqual(locale['blockly-INPUT_LABEL_NUMBER_MAX'], locale['blockly-INPUT_LABEL_NUMBER_MIN']);
  assert.notEqual(locale['blockly-KEYBOARD_NAV_COPIED_HINT'], locale['blockly-KEYBOARD_NAV_CUT_HINT']);
  assert.equal(locale['blockly-INPUT_LABEL_TEXT_START_POSITION'], locale['blockly-INPUT_LABEL_LISTS_START_POSITION']);
  assert.equal(locale['blockly-INPUT_LABEL_TEXT_END_POSITION'], locale['blockly-INPUT_LABEL_LISTS_END_POSITION']);
  assert.match(locale['blockly-LISTS_CREATE_EMPTY_TOOLTIP'], /0.*olungenazingxelo/);
  assert.match(locale['blockly-INSERT_KEY'], /Insert/);
  const freeMovement = locale['blockly-KEYBOARD_NAV_UNCONSTRAINED_MOVE_HINT']
    .replace('%1', 'Shift').replace('%2', 'Enter');
  assert.match(freeMovement, /Shift.*Enter/);
  assert.doesNotMatch(freeMovement, /%[12]/);
  for (const position of ['FIRST', 'FROM', 'LAST', 'RANDOM']) {
    assert.match(locale[`blockly-LISTS_GET_INDEX_TOOLTIP_GET_${position}`], /^Ibuyisela/);
    assert.match(locale[`blockly-LISTS_GET_INDEX_TOOLTIP_REMOVE_${position}`], /^Isusa/);
    assert.doesNotMatch(locale[`blockly-LISTS_GET_INDEX_TOOLTIP_REMOVE_${position}`], /ibuyisele/);
    assert.match(locale[`blockly-LISTS_GET_INDEX_TOOLTIP_GET_REMOVE_${position}`], /^Isusa ize ibuyisele/);
  }
  assert.match(locale['blockly-LISTS_GET_SUBLIST_TOOLTIP'], /ikopi/);
  assert.match(locale['blockly-LISTS_REVERSE_TOOLTIP'], /lwekopi/);
  assert.match(locale['blockly-LISTS_INDEX_OF_TOOLTIP'], /%1.*ayifunyanwanga/);
  const repeatedItem = locale['blockly-LISTS_REPEAT_TITLE'].replace('%1', 'item').replace('%2', '5');
  assert.match(repeatedItem, /item.*5/);
  assert.doesNotMatch(repeatedItem, /%[12]/);
  assert.match(locale['blockly-LISTS_SORT_TOOLTIP'], /ikopi/);
  assert.notEqual(locale['blockly-LISTS_SORT_ORDER_ASCENDING'], locale['blockly-LISTS_SORT_ORDER_DESCENDING']);
  for (const position of ['FIRST', 'FROM', 'LAST', 'RANDOM']) {
    assert.match(locale[`blockly-LISTS_SET_INDEX_TOOLTIP_SET_${position}`], /^Iseta/);
    assert.doesNotMatch(locale[`blockly-LISTS_SET_INDEX_TOOLTIP_INSERT_${position}`], /^Iseta/);
  }
  for (const operator of ['GTE', 'LTE']) {
    assert.match(locale[`blockly-LOGIC_COMPARE_TOOLTIP_${operator}`], /okanye lilingana/);
  }
  for (const operator of ['GT', 'LT']) {
    assert.doesNotMatch(locale[`blockly-LOGIC_COMPARE_TOOLTIP_${operator}`], /lilingana/);
  }
  assert.match(locale['blockly-LOGIC_COMPARE_TOOLTIP_EQ'], /ayalingana/);
  assert.match(locale['blockly-LOGIC_COMPARE_TOOLTIP_NEQ'], /awalingani/);
  assert.notEqual(locale['blockly-LOGIC_BOOLEAN_FALSE'], locale['blockly-LOGIC_BOOLEAN_TRUE']);
  const sortTitle = locale['blockly-LISTS_SORT_TITLE'].replace('%1', 'numeric').replace('%2', 'ascending').replace('%3', 'items');
  assert.match(sortTitle, /numeric.*ascending.*items/);
  assert.doesNotMatch(sortTitle, /%[123]/);
  assert.match(locale['blockly-LOGIC_OPERATION_TOOLTIP_AND'], /omabini/);
  assert.match(locale['blockly-LOGIC_OPERATION_TOOLTIP_OR'], /ubuncinane elinye/);
  for (const suffix of ['CONDITION', 'IF_TRUE', 'IF_FALSE']) {
    assert.ok(locale['blockly-LOGIC_TERNARY_TOOLTIP'].includes(locale[`blockly-LOGIC_TERNARY_${suffix}`]));
  }
  assert.match(locale['blockly-LOGIC_NULL_TOOLTIP'], /null/);
  assert.match(locale['blockly-MATH_ATAN2_TOOLTIP'], /\(X, Y\).* -180.* 180/);
  assert.match(locale['blockly-MATH_CONSTRAIN_TOOLTIP'], /kuquka imida/);
  for (const literal of ['π (3.141…)', 'e (2.718…)', 'φ (1.618…)', 'sqrt(2) (1.414…)', 'sqrt(½) (0.707…)', '∞']) {
    assert.ok(locale['blockly-MATH_CONSTANT_TOOLTIP'].includes(literal));
  }
  const constrainedValue = locale['blockly-MATH_CONSTRAIN_TITLE'].replace('%1', 'value').replace('%2', '0').replace('%3', '10');
  assert.match(constrainedValue, /value.*0.*10/);
  assert.doesNotMatch(constrainedValue, /%[123]/);
  assert.match(locale['blockly-MATH_IS_NEGATIVE'], /lingaphantsi.*0/);
  assert.match(locale['blockly-MATH_IS_POSITIVE'], /lingaphezulu.*0/);
  assert.match(locale['blockly-MATH_IS_PRIME'], /kuphela.*1.*ngokwalo.*elikhulu/);
  assert.notEqual(locale['blockly-MATH_IS_ODD'], locale['blockly-MATH_IS_EVEN']);
  assert.match(locale['blockly-MATH_RANDOM_FLOAT_TOOLTIP'], /0\.0 \(uqukiwe\).*1\.0 \(akaqukwanga\)/);
  assert.match(locale['blockly-MATH_RANDOM_INT_TOOLTIP'], /kuquka imida/);
  assert.match(locale['blockly-MATH_ONLIST_TOOLTIP_MODE'], /uluhlu lwezona/);
  assert.notEqual(locale['blockly-MATH_ONLIST_OPERATOR_AVERAGE'], locale['blockly-MATH_ONLIST_OPERATOR_MEDIAN']);
  const remainderTitle = locale['blockly-MATH_MODULO_TITLE'].replace('%1', '7').replace('%2', '3');
  assert.match(remainderTitle, /7 ÷ 3/);
  assert.doesNotMatch(remainderTitle, /%[12]/);
  assert.notEqual(locale['blockly-MATH_ROUND_OPERATOR_ROUNDUP'], locale['blockly-MATH_ROUND_OPERATOR_ROUNDDOWN']);
  assert.match(locale['blockly-MATH_SINGLE_TOOLTIP_LOG10'], /esiseko esingu-10/);
  assert.match(locale['blockly-MATH_SINGLE_TOOLTIP_EXP'], /u-e.*kwigunya/);
  assert.match(locale['blockly-MATH_SINGLE_TOOLTIP_POW10'], /u-10.*kwigunya/);
  assert.match(locale['blockly-MATH_SINGLE_TOOLTIP_NEG'], /oluchaseneyo/);
  for (const operation of ['COS', 'SIN', 'TAN']) {
    assert.match(locale[`blockly-MATH_TRIG_TOOLTIP_${operation}`], /ngeedigri \(hayi ngeeradiyani\)/);
    assert.notEqual(locale[`blockly-MATH_TRIG_${operation}_ARIA`], locale[`blockly-MATH_TRIG_A${operation}_ARIA`]);
  }
  for (const key of ['OPTION', 'PAGE_DOWN', 'PAGE_UP', 'PAUSE']) {
    assert.ok(locale[`blockly-${key}_KEY`].includes(source[`blockly-${key}_KEY`]));
  }
  assert.match(locale['blockly-PROCEDURES_DEFNORETURN_TOOLTIP'], /ongenasiphumo/);
  assert.match(locale['blockly-PROCEDURES_DEFRETURN_TOOLTIP'], /onesiphumo/);
  assert.match(locale['blockly-PROCEDURES_CALLRETURN_TOOLTIP'], /usebenzise isiphumo/);
  assert.match(locale['blockly-PROCEDURES_CALL_DISABLED_DEF_WARNING'], /Akunakuqhutywa.*ayisebenzi/);
  assert.match(locale['blockly-PROCEDURES_IFRETURN_WARNING'], /kuphela ngaphakathi/);
  assert.equal(locale['blockly-PROCEDURES_BEFORE_PARAMS'], locale['blockly-PROCEDURES_CALL_BEFORE_PARAMS']);
  const functionCall = locale['blockly-PROCEDURES_CALLRETURN_TOOLTIP'].replace('%1', 'calculateTotal');
  assert.match(functionCall, /calculateTotal/);
  assert.doesNotMatch(functionCall, /%1/);
  assert.match(locale['blockly-SCREENREADER_MODE_DISABLED'], /ivaliwe.*uyivule/);
  assert.match(locale['blockly-SCREENREADER_MODE_ENABLED'], /ivuliwe.*uyivale/);
  assert.match(locale['blockly-SHIFT_KEY'], /Shift/);
  for (const [left, right] of [['MOVE_DOWN', 'MOVE_UP'], ['MOVE_LEFT', 'MOVE_RIGHT'], ['JUMP_BLOCK_START', 'JUMP_BLOCK_END'], ['JUMP_NEXT_PAGE', 'JUMP_PREVIOUS_PAGE'], ['ABORT_MOVE', 'FINISH_MOVE']]) {
    assert.notEqual(locale[`blockly-SHORTCUTS_${left}`], locale[`blockly-SHORTCUTS_${right}`]);
  }
  const renamePrompt = locale['blockly-RENAME_VARIABLE_TITLE'].replace('%1', 'counter');
  assert.match(renamePrompt, /counter/);
  assert.doesNotMatch(renamePrompt, /%1/);
  assert.match(locale['blockly-TEXT_CHANGECASE_TOOLTIP'], /ikopi/);
  assert.match(locale['blockly-TEXT_APPEND_TOOLTIP'], /ekupheleni/);
  for (const key of ['SPACE', 'TAB']) assert.ok(locale[`blockly-${key}_KEY`].includes(source[`blockly-${key}_KEY`]));
  for (const key of ['TEXT_CHARAT_FROM_END', 'TEXT_GET_SUBSTRING_END_FROM_END', 'TEXT_GET_SUBSTRING_START_FROM_END']) {
    assert.match(locale[`blockly-${key}`], /#.*ekupheleni/);
  }
  for (const [left, right] of [['SCROLL_DOWN', 'SCROLL_UP'], ['SCROLL_LEFT', 'SCROLL_RIGHT'], ['PREVIOUS_HEADING', 'NEXT_HEADING']]) {
    assert.notEqual(locale[`blockly-SHORTCUTS_${left}`], locale[`blockly-SHORTCUTS_${right}`]);
  }
  const textCount = locale['blockly-TEXT_COUNT_MESSAGE0'].replace('%1', 'needle').replace('%2', 'haystack');
  assert.match(textCount, /needle.*haystack/);
  assert.doesNotMatch(textCount, /%[12]/);
  assert.match(locale['blockly-TEXT_LENGTH_TOOLTIP'], /kuquka izithuba/);
  assert.match(locale['blockly-TEXT_REPLACE_TOOLTIP'], /konke ukuvela/);
  assert.match(locale['blockly-TEXT_INDEXOF_TOOLTIP'], /%1.*awufunyanwanga/);
  assert.match(locale['blockly-TEXT_TRIM_TOOLTIP'], /ikopi/);
  for (const key of ['Enter', 'Shift+Enter', 'Escape']) assert.ok(locale['blockly-WORKSPACE_SEARCH_INPUT_LABEL'].includes(key));
  for (const key of ['blockly-WORKSPACE_CONTENTS_COMMENTS_MANY', 'blockly-WORKSPACE_CONTENTS_COMMENTS_ONE']) assert.ok(locale[key].startsWith(' '));
  const workspaceSummary = locale['blockly-WORKSPACE_CONTENTS_BLOCKS_MANY']
    .replace('%1', '3').replace('%2', locale['blockly-WORKSPACE_CONTENTS_COMMENTS_MANY'].replace('%1', '5'));
  assert.match(workspaceSummary, /3.*5/);
  assert.doesNotMatch(workspaceSummary, /%[12]/);
  const searchMatch = locale['blockly-WORKSPACE_SEARCH_MATCH'].replace('%1', '2').replace('%2', '8').replace('%3', 'block');
  assert.match(searchMatch, /2.*8.*block/);
  assert.doesNotMatch(searchMatch, /%[123]/);
  assert.equal(locale['blockly-PROCEDURES_DEFRETURN_COMMENT'], locale['blockly-PROCEDURES_DEFNORETURN_COMMENT']);
  assert.equal(locale['blockly-CONTROLS_IF_ELSE_TITLE_ELSE'], locale['blockly-CONTROLS_IF_MSG_ELSE']);
  for (const literal of ['TODO', 'DONE', 'SCHEDULED', 'DEADLINE', 'CLOSED']) assert.ok(locale['import-board-instruction-orgmode'].includes(literal));
  for (const literal of ['Export plan to Excel', '.xlsx', 'Progress', 'Priority', 'Completed By']) assert.ok(locale['import-board-instruction-planner'].includes(literal));
  for (const literal of ['Export as a template', '@labels', 'p1', 'p3']) assert.ok(locale['import-board-instruction-todoist'].includes(literal));
  assert.match(locale['import-board-instruction-meistertask'], /igcina umhla wayo wokugqitywa/);
  assert.match(locale['import-board-instruction-obsidian'], /Archive.*agcinwe kwindawo yogcino/);
  assert.match(locale['import-board-instruction-ticktick'], /Uluhlu ngalunye.*yindlela yokuqubha/);
  for (const format of ['nullboard', 'kanri']) assert.match(locale[`import-board-instruction-${format}`], /ibhodi yokuqala/);
  for (const format of ['taiga', 'vikunja']) assert.match(locale[`import-board-instruction-${format}`], /Izincamathelisi azingeniswa/);
  assert.match(locale['import-board-instruction-tasksorg'], /igcina umhla wayo wokugqitywa/);
  assert.match(locale['import-board-instruction-pivotal'], /Estimate.*Story points/);
  assert.match(locale['import-board-instruction-monday'], /zigcina iindawo zazo/);
  for (const literal of ['sp-backup', '.json', 'To Do', 'In Progress', 'Backlog', 'Done']) assert.ok(locale['import-board-instruction-superproductivity'].includes(literal));
  assert.match(locale['import-board-instruction-quire'], /Izimvo nezincamathelisi azikho/);
  assert.match(locale['import-board-instruction-notion'], /Ubudlelwane, imifanekiso nezincamathelisi azingeniswa/);
  assert.match(locale['import-board-instruction-plane'], /akunazo iinkcazo okanye izincamathelisi/);
  assert.match(locale['import-board-instruction-businessmap'], /qala.*ngesiNgesi/);
  assert.match(locale['import-board-instruction-redmine'], /sisiNgesi.*My account.*ngaphambi/);
  for (const literal of ['--', '##', '>>', 'Complete', 'Estimated time']) assert.ok(locale['import-board-instruction-teamwork'].includes(literal));
  const error = locale['ldap-sync-now-error'].replace('%s', 'E_LDAP');
  assert.ok(error.includes('E_LDAP'));
  assert.ok(!error.includes('%s'));
  console.log('Xhosa settings: variables, literals, restrictions and rendered errors passed');
})().catch(error => { console.error(error); process.exitCode = 1; });

// New features, including the short At/To labels omitted by ordinary reports.
const xhosaCurrent = locales.xh;
const currentSource = JSON.parse(fs.readFileSync(path.join(root, 'imports/i18n/data/en.i18n.json'), 'utf8'));
assert.deepEqual(Object.keys(xhosaCurrent), Object.keys(currentSource));
for (const [key, value] of Object.entries(currentSource)) {
  assert.deepEqual(currentTokens(xhosaCurrent[key]), currentTokens(value), `${key}: all Xhosa source tokens`);
}
assert.match(xhosaCurrent['custom-field-links-hint'], /enegama nohlobo olufanayo/);
assert.match(xhosaCurrent['custom-field-links-hint'], /kwikhadi elinye kuphela ishiywa ingatshintshwanga/);
assert.match(xhosaCurrent['custom-field-link-sends'], /kweli khadi.*kwelo khadi/);
assert.match(xhosaCurrent['custom-field-link-receives'], /kwelo khadi.*kweli khadi/);
assert.match(xhosaCurrent['custom-field-link-inactive'], /akasakwazi ukuhlela omabini amakhadi, okanye elinye ikhadi ligciniwe kuvimba/);
assert.match(xhosaCurrent['field-link-not-allowed'], /nemvume yokuhlela omabini amakhadi/);
assert.match(xhosaCurrent['attach-card-self'], /alinakuncanyathiselwa kulo ngokwalo/);
assert.match(xhosaCurrent['attached-card-unavailable'], /ongenakukulibona/);
assert.match(xhosaCurrent['import-many-boards-hint'], /ngaphandle kokudibanisa amalungu/);
assert.match(xhosaCurrent['import-many-boards-hint'], /ngokwayo.*iba yibhodi enye/);
assert.match(xhosaCurrent['import-many-boards-hint'], /endaweni yommandla ongasentla/);
assert.match(xhosaCurrent['webhook-hide-identity'], /Shiya igama lam ngaphandle/);
assert.match(xhosaCurrent['subtask-mark-not-done'], /njengongagqitywanga/);
assert.match(xhosaCurrent['subtask-done-no-permission'], /^Awunako ukutshintsha/);
for (const literal of ['Active', 'Completed', 'Deferred', 'Cancelled', 'GET /workflows', 'JSON']) {
  assert.ok(xhosaCurrent['r-wrike-workflow-note'].includes(literal), literal);
}
assert.match(xhosaCurrent['r-wrike-workflow-note'], /Imithetho yeWrike yokuzisebenzela ayinakuthunyelwa ngaphandle/);
assert.equal(xhosaCurrent['notification-delivery-daily-time'], 'Ngexesha');
assert.equal(xhosaCurrent['notification-delivery-quiet-to'], 'Kude kube');
assert.match(xhosaCurrent['notification-delivery-quiet'], /linda de ziphele/);
assert.equal(xhosaCurrent['custom-fields'], 'Imimandla elungiselelweyo');
assert.equal(xhosaCurrent['card-edit-custom-fields'], xhosaCurrent['cardCustomFieldsPopup-title']);
assert.match(xhosaCurrent['card-edit-custom-fields'], /imimandla elungiselelweyo/);
assert.doesNotMatch(xhosaCurrent['card-edit-custom-fields'], /yesiko/);
assert.equal(xhosaCurrent.swimlane, 'Umzila wokuqubha');
assert.equal(xhosaCurrent.swimlane, xhosaCurrent['notification-delivery-part-swimlane']);
console.log('Xhosa current links, delivery, source tokens and field/lane terminology pass.');

assert.equal(locales.xh['import-members-mode-me'], 'Sebenzisa mna endaweni yabo bonke');
