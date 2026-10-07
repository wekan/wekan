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
  "blockly-LISTS_SET_INDEX_SET",
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
  "blockly-LOGIC_COMPARE_TOOLTIP_NEQ",
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
  "blockly-MATH_IS_EVEN",
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
  "blockly-MATH_ROUND_OPERATOR_ROUNDDOWN",
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
  "blockly-MATH_TRIG_TOOLTIP_TAN",
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
  "blockly-PARENT_BLOCKS_ANNOUNCEMENT",
  "blockly-PASTE_ALL_FROM_BACKPACK",
  "blockly-PASTE_SHORTCUT",
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
  "blockly-PROCEDURES_MUTATORARG_TITLE",
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
  "blockly-SHORTCUTS_PERFORM_ACTION",
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
  "blockly-SHORTCUTS_TOGGLE_SCREENREADER_MODE"
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
  assert.match(waray['blockly-LISTS_INDEX_OF_TOOLTIP'], /%1 kon waray mabilngi/);
  assert.match(waray['blockly-LISTS_REVERSE_TOOLTIP'], /kopya han lista/);
  assert.match(waray['blockly-LISTS_GET_SUBLIST_TOOLTIP'], /kopya/);
  assert.match(waray['blockly-LISTS_SORT_TOOLTIP'], /kopya/);
  assert.match(waray['blockly-LOGIC_OPERATION_TOOLTIP_AND'], /tinuod an duha/);
  assert.match(waray['blockly-LOGIC_OPERATION_TOOLTIP_OR'], /bisan usa/);
  assert.match(waray['blockly-MATH_CONSTRAIN_TOOLTIP'], /upod an mga utlanan mismo/);
  assert.match(waray['blockly-MATH_ATAN2_TOOLTIP'], /-180 tubtob 180/);
  assert.match(waray['blockly-MATH_IS_NEGATIVE'], /mas guti.*sero/);
  assert.match(waray['blockly-MATH_IS_POSITIVE'], /mas dako.*sero/);
  assert.ok(waray['blockly-MATH_MODULO_TITLE'].includes('%1 ÷ %2'));
  assert.match(waray['blockly-MATH_RANDOM_FLOAT_TOOLTIP'], /0\.0 \(upod\).*1\.0 \(diri upod\)/);
  assert.match(waray['blockly-MATH_RANDOM_INT_TOOLTIP'], /upod an duha nga utlanan mismo/);
  assert.match(waray['blockly-MATH_ROUND_OPERATOR_ROUNDDOWN'], /tipaubos/);
  assert.match(waray['blockly-MATH_ROUND_OPERATOR_ROUNDUP'], /tipaigbaw/);
  assert.match(waray['blockly-MATH_SINGLE_OP_LOG10_ARIA'], /base nga 10/);
  assert.match(waray['blockly-MATH_SINGLE_TOOLTIP_NEG'], /positibo nagigin negatibo.*negatibo nagigin positibo/);
  for (const op of ['COS', 'SIN', 'TAN']) {
    assert.match(waray['blockly-MATH_TRIG_TOOLTIP_' + op], /grado \(diri radian\)/);
    assert.match(waray['blockly-MATH_TRIG_A' + op + '_ARIA'], /^baliktad/);
  }
  assert.match(waray['blockly-PROCEDURES_DEFNORETURN_TOOLTIP'], /waray ibinabalik/);
  assert.match(waray['blockly-PROCEDURES_DEFRETURN_TOOLTIP'], /may ibinabalik/);
  assert.match(waray['blockly-PROCEDURES_IFRETURN_WARNING'], /la ha sulod han depinisyon/);
  assert.match(waray['blockly-PROCEDURES_CALL_DISABLED_DEF_WARNING'], /diri aktibo an bloke han depinisyon/);
  assert.match(waray['blockly-RENAME_VARIABLE_TITLE'], /ngatanan/);
  assert.match(waray['blockly-SCREENREADER_MODE_DISABLED'], /^Naka-off.*basi i-on/);
  assert.match(waray['blockly-SCREENREADER_MODE_ENABLED'], /^Naka-on.*basi i-off/);
  for (const [direction, wording] of [['DOWN', 'tipaubos'], ['UP', 'tipaigbaw'], ['LEFT', 'ha wala'], ['RIGHT', 'ha tuo']]) {
    assert.ok(waray['blockly-SHORTCUTS_MOVE_' + direction].includes(wording));
    assert.ok(waray['blockly-SHORTCUTS_SCROLL_' + direction].includes(wording));
    assert.match(waray['blockly-SHORTCUTS_SCROLL_' + direction], /nakikita nga bahin/);
  }
  for (const [a, b] of [['ABORT_MOVE', 'FINISH_MOVE'], ['JUMP_BLOCK_START', 'JUMP_BLOCK_END'], ['JUMP_FIRST_BLOCK', 'JUMP_LAST_BLOCK'], ['JUMP_TOP_STACK', 'JUMP_BOTTOM_STACK'], ['NEXT_HEADING', 'PREVIOUS_HEADING'], ['NEXT_STACK', 'PREVIOUS_STACK']]) {
    assert.notEqual(waray['blockly-SHORTCUTS_' + a], waray['blockly-SHORTCUTS_' + b]);
  }
  const statistics = ['AVERAGE', 'MEDIAN', 'MODE', 'STD_DEV', 'SUM'].map(s => waray['blockly-MATH_ONLIST_OPERATOR_' + s]);
  assert.equal(new Set(statistics).size, statistics.length);
  assert.match(waray['blockly-MATH_ONLIST_TOOLTIP_MODE'], /lista han mga butang/);
  for (const notation of ['π (3.141…)', 'e (2.718…)', 'φ (1.618…)', 'sqrt(2) (1.414…)', 'sqrt(½) (0.707…)', '∞']) {
    assert.ok(waray['blockly-MATH_CONSTANT_TOOLTIP'].includes(notation), notation);
  }
  for (const comparison of ['GT', 'LT']) {
    assert.doesNotMatch(waray['blockly-LOGIC_COMPARE_' + comparison + '_ARIA'], /katugbang/);
    assert.match(waray['blockly-LOGIC_COMPARE_' + comparison + 'E_ARIA'], /o katugbang/);
  }
  assert.match(waray['blockly-LOGIC_NEGATE_TOOLTIP'], /tinuod kon diri tinuod.*diri tinuod kon tinuod/);
  assert.notEqual(waray['blockly-LISTS_SORT_ORDER_ASCENDING'], waray['blockly-LISTS_SORT_ORDER_DESCENDING']);
  for (const position of ['FIRST', 'FROM', 'LAST', 'RANDOM']) {
    const prefix = 'blockly-LISTS_SET_INDEX_TOOLTIP_';
    assert.notEqual(waray[prefix + 'INSERT_' + position], waray[prefix + 'SET_' + position]);
    assert.match(waray[prefix + 'SET_' + position], /^Nagtatakda han bili/);
  }
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
