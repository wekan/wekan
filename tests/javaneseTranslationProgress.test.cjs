const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const fillScript = path.join(root, 'releases/translations/fill-translations.mjs');
const result = spawnSync(process.execPath, [fillScript, '--list', 'jv'], {
  cwd: root,
  encoding: 'utf8',
});
assert.equal(result.status, 0, result.stderr);
const remaining = JSON.parse(result.stdout);
assert.equal(Object.keys(remaining).length, 0);

const english = JSON.parse(fs.readFileSync(
  path.join(root, 'imports/i18n/data/en.i18n.json'), 'utf8'));
const javanese = JSON.parse(fs.readFileSync(
  path.join(root, 'imports/i18n/data/jv.i18n.json'), 'utf8'));
const tokens = (value) => [...value.matchAll(
  /__[A-Za-z0-9_]+__|%[A-Za-z]|%{[A-Za-z0-9]+}|{{[A-Za-z0-9]+}}/g)]
  .map(([token]) => token).sort();
const { translationTokens } = require('../releases/translations/placeholder-tokens.mjs');
const tags = (value) => [...value.matchAll(/<\/?[A-Za-z][^>]*>/g)]
  .map(([tag]) => tag).sort();

assert.deepEqual(Object.keys(javanese), Object.keys(english));
for (const [key, value] of Object.entries(javanese)) {
  assert.deepEqual(translationTokens(value), translationTokens(english[key]), key);
  if (value !== english[key]) {
    assert.deepEqual(tokens(value), tokens(english[key]), key);
  }
  assert.deepEqual(tags(value), tags(english[key]), key);
}

assert.equal(javanese.accept, 'Tampani');
assert.deepEqual(tokens(javanese['activity-changedTitle']), ['%s', '%s']);
assert.deepEqual(tokens(javanese['act-removeChecklistItem']),
  ['__board__', '__card__', '__checkList__', '__checklistItem__', '__list__',
    '__swimlane__']);
assert.match(javanese['act-addAttachment'], /lampiran/);
assert.match(javanese['act-createBoard'], /papan/);
assert.deepEqual(tokens(javanese['act-moveCardToOtherBoard']),
  ['__board__', '__card__', '__list__', '__oldBoard__', '__oldList__',
    '__oldSwimlane__', '__swimlane__']);
assert.equal(javanese['allboards.workspaces'], 'Ruang kerja');
assert.equal(javanese['sandstorm-storage-item'], 'Panyimpenan');
assert.match(javanese['render-links-as-plain-text-description'], /<a href>/);
assert.equal(javanese['backup-done'], 'Serep rampung');
assert.equal(javanese['backup-schedule'], 'Serep terjadwal');
assert.equal(javanese['gcs-bucket'], 'Wadhah');
assert.match(javanese['cloud-connection-success'], /kasil/);
assert.equal(javanese['all-migrations'], 'Kabeh Migrasi');
assert.match(javanese['migration-stopped'], /kasil/);
assert.equal(javanese['board-migrations'], 'Migrasi Papan');
assert.equal(javanese['lost-cards'], 'Kertu Ilang');
assert.equal(javanese['migration-progress-status'], 'Kahanan');
assert.match(javanese['migrations-admin-only'], /administrator papan/);
assert.equal(javanese['step-fix-attachment-urls'], 'Ndandani URL Lampiran');
assert.equal(javanese['cpu-usage'], 'Panggunaan CPU');
assert.equal(javanese['job-queue'], 'Antrean Tugas');
assert.equal(javanese['memory-usage'], 'Panggunaan Memori');
assert.match(javanese['migration-batch-size-description'], /1-100/);
assert.equal(javanese['unmigrated-boards'], 'Papan Sing Durung Dimigrasikake');
assert.equal(javanese.server, 'Peladen');
assert.deepEqual(tokens(javanese['repair-broken-cards-done']), ['__fixed__']);
assert.deepEqual(tokens(javanese['repair-broken-cards-done-unfixable']),
  ['__fixed__', '__unfixable__']);
assert.equal(javanese['event-detail'], 'Rincian');
assert.deepEqual(tokens(javanese['globalSearch-instructions-operator-number']),
  ['__operator_number__']);
assert.deepEqual(tags(javanese['globalSearch-instructions-operator-number']),
  ['<number>', '<number>']);
assert.equal(javanese['workspace-settings'], 'Setelan Ruang Kerja');
assert.equal(javanese['home-board-badge'],
  'Papan Ngarep (dibukak sawise mlebu)');
assert.match(javanese['list-width-error-message'], /wilangan wutuh paling ora 200 piksel/);
assert.doesNotMatch(javanese['list-width-error-message'], /270/);
assert.equal(javanese['add-checklist'], 'Tambah Dhaptar Priksa');
assert.deepEqual(tokens(javanese['avatar-too-big']), ['__size__']);
assert.deepEqual(tags(javanese['board-private-info']),
  ['</strong>', '<strong>']);
assert.equal(javanese['board-not-found'], 'Papan ora ditemokake');
assert.deepEqual(tags(javanese['board-public-info']),
  ['</strong>', '<strong>']);
assert.deepEqual(tokens(
  javanese['board-open-and-move-between-remaining-and-workspaces']),
['__workspaces__']);
assert.equal(javanese['card-due'], 'Tenggat');
assert.match(javanese['card-edit-planning-poker'], /Planning Poker/);
assert.equal(javanese['addBoardOrgPopup-title'], 'Tambah Organisasi');
assert.equal(javanese['importSwimlanePopup-title'], 'Impor swimlane');
assert.equal(javanese['userPopup-title'], 'Anggota');
assert.equal(javanese['map-to-existing-user-no-results'],
  'Ora ana pangguna sing cocog.');
assert.match(javanese['font-preview-text'], /0123456789/);
assert.equal(javanese['auto-list-width'], 'Ambane dhaptar otomatis');
assert.equal(javanese['move-card-up'], 'Pindhah kertu munggah');
assert.equal(javanese['color-red'], 'abang');
assert.equal(javanese['read-only'], 'Mung Waca');
assert.equal(javanese.worker, 'Buruh');
assert.equal(javanese['custom-field-number'], 'Wilangan');
assert.equal(javanese['date-format'], 'Format Tanggal');
assert.deepEqual(tokens(javanese['email-invite-text']),
  ['__board__', '__inviter__', '__url__', '__user__']);
assert.equal(javanese['error-list-doesNotExist'], 'Dhaptar iki ora ana');
assert.equal(javanese['export-card-pdf'], 'Ekspor kertu menyang PDF');
assert.equal(javanese['filter-due-tomorrow'], 'Tenggat sesuk');
assert.equal(javanese['filter-no-member'], 'Tanpa anggota');
assert.equal(javanese['advanced-filter-label'], 'Saringan Lanjut');
assert.deepEqual(tokens(javanese['import-board-instruction-issues']),
  ['__endpoint__', '__sourceName__']);
assert.equal(javanese['import-trello-failed'], 'Impor saka Trello gagal.');
assert.match(javanese['trello-api-key'], /https:\/\/trello.com\/app-key/);
assert.equal(javanese['importMapMembersAddPopup-title'], 'Pilih anggota');
assert.deepEqual(tokens(javanese['label-default']), ['%s']);
assert.deepEqual(tokens(javanese['leave-board-pop']), ['__boardTitle__']);
assert.equal(javanese.calendar, 'Tanggalan');
assert.equal(javanese['multi-selection'], 'Pilihan Akeh');
assert.deepEqual(tokens(javanese['page-maybe-private']), ['%s']);
assert.deepEqual(tags(javanese['page-maybe-private']),
  ['</a>', "<a href='%s'>"]);
assert.deepEqual(tokens(javanese['remove-member-pop']),
  ['__boardTitle__', '__name__', '__username__']);
assert.equal(javanese.team, 'Tim Kerja');
assert.equal(javanese['upload-completed'], 'Unggahan rampung');
assert.equal(javanese['welcome-board'], 'Papan Sugeng Rawuh');
assert.equal(javanese['attachment-limit-mode-unlimited'], 'Tanpa wates');
assert.deepEqual(tokens(javanese['email-invite-register-text']),
  ['__icode__', '__inviter__', '__url__', '__user__']);
assert.equal(javanese.Database, 'Basis data');
assert.match(javanese.Reactivity_order, /METEOR_REACTIVITY_ORDER/);
assert.equal(javanese.OS_Cpus, 'Cacah CPU OS');
assert.match(javanese['org-domains-description'], /MULTITENANCY=true/);
assert.deepEqual(tokens(javanese['default-subtasks-board']), ['__board__']);
assert.equal(javanese['attachment-count'], 'Cacah lampiran');
assert.deepEqual(tokens(javanese['activity-added-label']), ['%s', '%s']);
assert.deepEqual(tokens(javanese['activity-set-customfield']),
  ['%s', '%s', '%s']);
assert.deepEqual(tokens(javanese['r-w-every-day-at']), ['__time__']);
assert.deepEqual(tokens(javanese['r-import-done']), ['__count__']);
assert.deepEqual(tokens(javanese['r-import-unmapped']), ['__count__']);
assert.equal(javanese['r-schedule-weekday'], 'Saben dina kerja (Sen–Jum)');
assert.equal(javanese['r-mark-complete'], 'Tandhani kertu rampung');
assert.equal(javanese['r-unarchive'], 'Balekake saka Arsip');
assert.equal(javanese['r-check-all'], 'Centhang kabeh');
assert.equal(javanese['r-d-move-to-top-gen'],
  'Pindhah kertu menyang ndhuwur dhaptare');
assert.equal(javanese['r-create-card'], 'Gawe kertu anyar');
assert.match(javanese['r-items-list'], /item1,item2,item3/);
assert.equal(javanese['custom-head-manifest-content'],
  'Isi manifest web kustom (JSON)');
assert.deepEqual(tags(javanese['add-custom-html-after-body-start']), ['<body>']);
assert.deepEqual(tokens(javanese['act-a-dueAt']),
  ['__card__', '__timeOldValue__', '__timeValue__']);
assert.deepEqual(tokens(javanese['act-atUserComment']),
  ['__board__', '__card__', '__comment__', '__list__', '__swimlane__']);
assert.match(javanese['submit-on-enter-description'], /Shift\+Enter/);
assert.equal(javanese['roles-status-sees-assigned'], 'Mung sing ditugasake');
assert.equal(javanese.monday, 'Senin');
assert.equal(javanese['create-task'], 'Gawe Tugas');
assert.equal(javanese['globalSearchViewChange-choice-me'], 'Kertu kula');
assert.deepEqual(tokens(javanese['board-title-not-found']), ['%s']);
assert.deepEqual(tokens(javanese['n-n-of-n-cards-found']),
  ['__end__', '__start__', '__total__']);
assert.equal(javanese['operator-board'], 'papan');
assert.equal(javanese['predicate-overdue'], 'kliwat-tenggat');
assert.deepEqual(tokens(javanese['operator-number-expected']),
  ['__operator__', '__value__']);
assert.deepEqual(tags(javanese['globalSearch-instructions-operator-board']),
  ['<title>', '<title>']);
assert.deepEqual(tokens(javanese['globalSearch-instructions-operator-has']),
  ['__operator_has__', '__predicate_assignee__', '__predicate_attachment__',
    '__predicate_checklist__', '__predicate_description__', '__predicate_due__',
    '__predicate_end__', '__predicate_member__', '__predicate_start__']);
assert.deepEqual(tokens(javanese['import-dependencies-done']),
  ['__imported__', '__unmatched__']);
assert.deepEqual(tokens(javanese['background-too-big']), ['{{size}}']);
assert.equal(javanese['location-open-map'], 'Bukak ing peta');
assert.deepEqual(tokens(javanese['custom-field-stringtemplate-format']),
  ['%{value}']);
assert.match(javanese['server-error-troubleshooting'],
  /sudo snap logs wekan\.wekan/);
assert.match(javanese['office-report-desc'], /IPv4.*IPv6/);
assert.match(javanese['api-no-calls'], /WITH_API=true/);
assert.equal(javanese['recovery-db'], 'Basis data');
assert.equal(javanese['ticket-number'], 'Nomer Tiket');
assert.match(javanese.Node_heap_malloced_memory, /malloc/);
assert.equal(javanese.legalNotice, 'pawarta hukum');
assert.equal(javanese['attachment-move-storage-gridfs'],
  'Pindhah lampiran menyang GridFS');
assert.equal(javanese['attachment-repair-broken'], 'Ora ditemokake');
assert.match(javanese['mongodb-compact-description'], /MongoDB GridFS/);
assert.equal(javanese['gridfs-file-id'], 'ID Berkas GridFS');
assert.deepEqual(tokens(javanese['drag-board-to-workspace']), ['__workspaces__']);
assert.match(javanese['show-week-of-year'], /ISO 8601/);
assert.equal(javanese.accessibility, 'Aksesibilitas');
assert.equal(javanese['accounts-lockout-failed-attempts'], 'Upaya Gagal');
assert.equal(javanese['accounts-lockout-unlock-all'], 'Bukak Kabeh Kunci');
assert.equal(javanese['board-backup-scheduled'],
  'Serep papan kasil dijadwalake');
assert.deepEqual(tokens(javanese['database-migration-confirm']), ['__db__']);
assert.match(javanese['database-migration-description'], /WEKAN_FERRETDB_URL/);
assert.equal(javanese['sandstorm-migration-success'], 'Kasil');

// Additional date and archival filters.
{
  const assert = require('node:assert/strict');
  const fs = require('node:fs');
  const path = require('node:path');
  const { translationTokens } = require('../releases/translations/placeholder-tokens.mjs');
  const root = path.resolve(__dirname, '..');
  const read = code => JSON.parse(fs.readFileSync(path.join(root, 'imports/i18n/data', code + '.i18n.json'), 'utf8'));
  const en = read('en'), locale = read('jv');
  assert.deepEqual(Object.keys(locale), Object.keys(en));
  for (const key of ["auto-archive-days", "auto-archive-off", "auto-archive-hint", "filter-recency-any", "filter-recency-day", "filter-recency-week", "filter-recency-month", "filter-recency-older", "filter-movement-range", "filter-date-range-field", "filter-date-range-from", "filter-date-range-to", "filter-date-range-missing", "filter-date-range-list-entry", "filter-date-range-invalid", "filter-due-any", "filter-due-previous-week", "filter-due-next-month", "filter-column-age", "filter-column-age-disabled", "filter-column-age-days", "filter-column-age-hint", "advanced-filter-card-dates-hint", "import-board-instruction-leo", "instance", "instance-desc", "board-instance-info", "automatic-linked-url-schemes-hint", "other-parent-cards", "add-parent-card", "remove-parent-card", "r-when-card-date", "r-trigger-vars-hint", "r-insert-variable", "r-vars-people-hint", "r-rule-any-trigger-help", "r-add-trigger-to-rule", "r-add-action-to-rule", "r-remove-rule-part", "notification-activity-heading", "notification-activity-description", "notification-activity-labels", "notification-activity-members", "notification-activity-assignees", "notification-activity-comments", "notification-activity-moves", "notification-activity-dates", "notification-activity-checklists", "notification-activity-attachments", "notification-activity-customFields", "notification-activity-archive", "notification-activity-created", "due-reminder-heading", "due-reminder-days-label", "due-reminder-off", "due-reminder-webhook", "due-reminder-invalid", "due-reminder-saved", "dependency-type-duplicates", "dependency-type-is-duplicated-by", "custom-field-stringtemplate-context-hint", "filter-presets", "filter-preset-choose", "filter-preset-name", "filter-preset-save", "filter-preset-replace-hint", "filter-preset-saved", "filter-preset-applied", "filter-preset-deleted", "filter-preset-error", "filter-card-text-label", "import-report-heading", "import-report-description", "import-report-open-board", "draggable", "board-view-map", "map-view-empty", "map-view-upload", "map-view-remove-image", "map-view-unplaced", "map-view-place-hint", "map-view-all-placed", "blockly-ADD_COMMENT", "blockly-ANNOUNCE_CANT_SCROLL_FURTHER", "blockly-ANNOUNCE_MOVE_AFTER", "blockly-ANNOUNCE_MOVE_AROUND", "blockly-ANNOUNCE_MOVE_BEFORE", "blockly-ANNOUNCE_MOVE_CANCELED", "blockly-ANNOUNCE_MOVE_INSIDE", "blockly-ANNOUNCE_MOVE_TO", "blockly-ANNOUNCE_MOVE_WORKSPACE", "blockly-ANNOUNCE_SCROLLED_DOWN", "blockly-ANNOUNCE_SCROLLED_LEFT", "blockly-ANNOUNCE_SCROLLED_RIGHT", "blockly-ANNOUNCE_SCROLLED_UP", "blockly-ARIA_LABEL_ADD_ELSE_IF", "blockly-ARIA_LABEL_ADD_INPUT", "blockly-ARIA_LABEL_ADD_LIST_ITEM", "blockly-ARIA_LABEL_ADD_TEXT", "blockly-ARIA_LABEL_BUTTON", "blockly-ARIA_LABEL_COMMENT_COLLAPSE", "blockly-ARIA_LABEL_COMMENT_EXPAND", "blockly-ARIA_LABEL_FIELD_ANGLE", "blockly-ARIA_LABEL_REMOVE_ELSE_IF", "blockly-ARIA_LABEL_REMOVE_INPUT", "blockly-ARIA_LABEL_REMOVE_LIST_ITEM", "blockly-ARIA_LABEL_REMOVE_TEXT", "blockly-ARIA_LABEL_TRASH_EMPTY", "blockly-ARIA_TYPE_FIELD_ANGLE", "blockly-ARIA_TYPE_FIELD_BITMAP", "blockly-ARIA_TYPE_FIELD_CHECKBOX", "blockly-ARIA_TYPE_FIELD_COLOUR", "blockly-ARIA_TYPE_FIELD_DATE", "blockly-ARIA_TYPE_FIELD_DROPDOWN", "blockly-ARIA_TYPE_FIELD_GRID", "blockly-ARIA_TYPE_FIELD_IMAGE", "blockly-ARIA_TYPE_FIELD_INPUT", "blockly-ARIA_TYPE_FIELD_TEXT_INPUT_ARGUMENT", "blockly-ARIA_TYPE_FIELD_TEXT_INPUT_PROCEDURE", "blockly-BLOCK_LABEL_BEGIN_PREFIX", "blockly-BLOCK_LABEL_BEGIN_STACK", "blockly-BLOCK_LABEL_COLLAPSED", "blockly-BLOCK_LABEL_CONTAINER", "blockly-BLOCK_LABEL_DISABLED", "blockly-BLOCK_LABEL_HAS_BRANCHES", "blockly-BLOCK_LABEL_HAS_INPUT", "blockly-BLOCK_LABEL_HAS_INPUTS", "blockly-BLOCK_LABEL_REPLACEABLE", "blockly-BLOCK_LABEL_STACK_BLOCKS", "blockly-BLOCK_LABEL_STATEMENT", "blockly-BLOCK_LABEL_TOOLBOX_CATEGORY", "blockly-BLOCK_LABEL_VALUE", "blockly-BUBBLE_LABEL_COMMENT", "blockly-BUBBLE_LABEL_DEFAULT", "blockly-BUBBLE_LABEL_WARNING", "blockly-CANNOT_DELETE_VARIABLE_PROCEDURE", "blockly-CHANGE_VALUE_TITLE", "blockly-CLEAN_UP", "blockly-CLOSE_BACKPACK", "blockly-COLLAPSED_WARNINGS_WARNING", "blockly-COLLAPSE_ALL", "blockly-COLLAPSE_BLOCK", "blockly-COLOUR_BLEND_COLOUR1", "blockly-COLOUR_BLEND_COLOUR2", "blockly-COLOUR_BLEND_RATIO", "blockly-COLOUR_BLEND_TITLE", "blockly-COLOUR_BLEND_TOOLTIP", "blockly-COLOUR_PICKER_TOOLTIP", "blockly-COLOUR_RANDOM_TITLE", "blockly-COLOUR_RANDOM_TOOLTIP", "blockly-COLOUR_RGB_BLUE", "blockly-COLOUR_RGB_GREEN", "blockly-COLOUR_RGB_RED", "blockly-COLOUR_RGB_TITLE", "blockly-COLOUR_RGB_TOOLTIP", "blockly-CONTROLS_FLOW_STATEMENTS_OPERATOR_BREAK", "blockly-CONTROLS_FLOW_STATEMENTS_OPERATOR_CONTINUE", "blockly-CONTROLS_FLOW_STATEMENTS_TOOLTIP_BREAK", "blockly-CONTROLS_FLOW_STATEMENTS_TOOLTIP_CONTINUE", "blockly-CONTROLS_FLOW_STATEMENTS_WARNING", "blockly-CONTROLS_FOREACH_TITLE", "blockly-CONTROLS_FOREACH_TOOLTIP", "blockly-CONTROLS_FOR_TITLE", "blockly-CONTROLS_FOR_TOOLTIP", "blockly-CONTROLS_IF_ELSEIF_TOOLTIP", "blockly-CONTROLS_IF_ELSE_TOOLTIP", "blockly-CONTROLS_IF_IF_TOOLTIP", "blockly-CONTROLS_IF_MSG_ELSE", "blockly-CONTROLS_IF_MSG_ELSEIF", "blockly-CONTROLS_IF_TOOLTIP_1", "blockly-CONTROLS_IF_TOOLTIP_2", "blockly-CONTROLS_IF_TOOLTIP_3", "blockly-CONTROLS_IF_TOOLTIP_4", "blockly-CONTROLS_REPEAT_TITLE", "blockly-CONTROLS_REPEAT_TOOLTIP", "blockly-CONTROLS_WHILEUNTIL_OPERATOR_UNTIL", "blockly-CONTROLS_WHILEUNTIL_OPERATOR_WHILE", "blockly-CONTROLS_WHILEUNTIL_TOOLTIP_UNTIL", "blockly-CONTROLS_WHILEUNTIL_TOOLTIP_WHILE", "blockly-COPY_ALL_TO_BACKPACK", "blockly-COPY_SHORTCUT", "blockly-COPY_TO_BACKPACK", "blockly-CURRENT_BLOCK_ANNOUNCEMENT", "blockly-CUT_SHORTCUT", "blockly-DELETE_ALL_BLOCKS", "blockly-DELETE_BLOCK", "blockly-DELETE_VARIABLE", "blockly-DELETE_VARIABLE_CONFIRMATION", "blockly-DELETE_X_BLOCKS", "blockly-DISABLE_BLOCK", "blockly-DUPLICATE_BLOCK", "blockly-DUPLICATE_COMMENT", "blockly-EDIT_BLOCK_CONTENTS", "blockly-EMPTY_BACKPACK", "blockly-ENABLE_BLOCK", "blockly-EXPAND_ALL", "blockly-EXPAND_BLOCK", "blockly-EXTERNAL_INPUTS", "blockly-FIELD_BITMAP_ARIA_VALUE", "blockly-FIELD_BITMAP_BUTTON_LABEL_CLEAR", "blockly-FIELD_BITMAP_BUTTON_LABEL_RANDOMIZE", "blockly-FIELD_BITMAP_PIXEL_LABEL", "blockly-FIELD_BITMAP_PIXEL_OFF", "blockly-FIELD_LABEL_EDIT_PREFIX", "blockly-FIELD_LABEL_EMPTY", "blockly-FIELD_LABEL_OPTION_INDEX", "blockly-FIELD_LABEL_VARIABLE", "blockly-FIELD_MULTILINEINPUT_FINISH_EDITING", "blockly-FIELD_MULTILINEINPUT_NEW_LINE", "blockly-HELP_PROMPT", "blockly-ICON_LABEL_COMMENT_CLOSED", "blockly-ICON_LABEL_COMMENT_OPEN", "blockly-ICON_LABEL_DEFAULT", "blockly-ICON_LABEL_MUTATOR_CLOSED", "blockly-ICON_LABEL_MUTATOR_OPEN", "blockly-ICON_LABEL_WARNING_CLOSED", "blockly-ICON_LABEL_WARNING_OPEN", "blockly-INLINE_INPUTS", "blockly-INPUT_LABEL_CONDITION", "blockly-INPUT_LABEL_CONDITION_A", "blockly-INPUT_LABEL_CONDITION_B", "blockly-INPUT_LABEL_EMPTY", "blockly-INPUT_LABEL_END_STATEMENT", "blockly-INPUT_LABEL_INDEX", "blockly-INPUT_LABEL_LISTS_CREATE_WITH_ITEM", "blockly-INPUT_LABEL_LISTS_DELIMITER", "blockly-INPUT_LABEL_LISTS_END_POSITION", "blockly-INPUT_LABEL_LISTS_LIST_FROM_TEXT", "blockly-INPUT_LABEL_LISTS_POSITION", "blockly-INPUT_LABEL_LISTS_REPEAT_ITEM", "blockly-INPUT_LABEL_LISTS_REPEAT_NUM", "blockly-INPUT_LABEL_LISTS_START_POSITION", "blockly-INPUT_LABEL_LISTS_TEXT_FROM_LIST", "blockly-INPUT_LABEL_LISTS_TO_CHANGE", "blockly-INPUT_LABEL_LISTS_TO_CHECK", "blockly-INPUT_LABEL_LISTS_VALUE_TO_SET", "blockly-INPUT_LABEL_LOOP_BY", "blockly-INPUT_LABEL_LOOP_FROM", "blockly-INPUT_LABEL_LOOP_LIST", "blockly-INPUT_LABEL_LOOP_TIMES", "blockly-INPUT_LABEL_LOOP_TO", "blockly-INPUT_LABEL_MATH_CHANGE_BY", "blockly-INPUT_LABEL_MATH_CONSTRAIN_VALUE", "blockly-INPUT_LABEL_MATH_DIVIDEND", "blockly-INPUT_LABEL_MATH_DIVISOR", "blockly-INPUT_LABEL_NUMBER", "blockly-INPUT_LABEL_NUMBER_A", "blockly-INPUT_LABEL_NUMBER_ATAN2_X", "blockly-INPUT_LABEL_NUMBER_ATAN2_Y", "blockly-INPUT_LABEL_NUMBER_B", "blockly-INPUT_LABEL_NUMBER_LIST", "blockly-INPUT_LABEL_NUMBER_MAX", "blockly-INPUT_LABEL_NUMBER_MIN", "blockly-INPUT_LABEL_NUMBER_TO_CHECK", "blockly-INPUT_LABEL_STATEMENT", "blockly-INPUT_LABEL_TEXT_APPEND", "blockly-INPUT_LABEL_TEXT_END_POSITION", "blockly-INPUT_LABEL_TEXT_JOIN_ITEM", "blockly-INPUT_LABEL_TEXT_POSITION", "blockly-INPUT_LABEL_TEXT_PROMPT_MESSAGE", "blockly-INPUT_LABEL_TEXT_START_POSITION", "blockly-INPUT_LABEL_TEXT_TO_CHANGE", "blockly-INPUT_LABEL_TEXT_TO_CHECK", "blockly-INPUT_LABEL_TEXT_TO_FIND", "blockly-INPUT_LABEL_TEXT_TO_REPLACE", "blockly-INPUT_LABEL_VALUE", "blockly-INPUT_LABEL_VALUE_A", "blockly-INPUT_LABEL_VALUE_B", "blockly-INPUT_LABEL_VARIABLES_SET", "blockly-KEYBOARD_NAV_BLOCK_NAVIGATION_HINT", "blockly-KEYBOARD_NAV_CONSTRAINED_MOVE_HINT", "blockly-KEYBOARD_NAV_COPIED_HINT", "blockly-KEYBOARD_NAV_CUT_HINT", "blockly-KEYBOARD_NAV_FLYOUT_LABEL_HINT", "blockly-KEYBOARD_NAV_UNCONSTRAINED_MOVE_HINT", "blockly-KEYBOARD_NAV_WORKSPACE_NAVIGATION_HINT", "blockly-LISTS_CREATE_EMPTY_TITLE", "blockly-LISTS_CREATE_EMPTY_TOOLTIP", "blockly-LISTS_CREATE_WITH_CONTAINER_TITLE_ADD", "blockly-LISTS_CREATE_WITH_CONTAINER_TOOLTIP", "blockly-LISTS_CREATE_WITH_INPUT_WITH", "blockly-LISTS_CREATE_WITH_ITEM_TOOLTIP", "blockly-LISTS_CREATE_WITH_TOOLTIP", "blockly-LISTS_GET_INDEX_FIRST", "blockly-LISTS_GET_INDEX_FROM_END", "blockly-LISTS_GET_INDEX_GET", "blockly-LISTS_GET_INDEX_GET_REMOVE", "blockly-LISTS_GET_INDEX_LAST", "blockly-LISTS_GET_INDEX_RANDOM", "blockly-LISTS_GET_INDEX_REMOVE", "blockly-LISTS_GET_INDEX_TOOLTIP_GET_FIRST", "blockly-LISTS_GET_INDEX_TOOLTIP_GET_FROM", "blockly-LISTS_GET_INDEX_TOOLTIP_GET_LAST", "blockly-LISTS_GET_INDEX_TOOLTIP_GET_RANDOM", "blockly-LISTS_GET_INDEX_TOOLTIP_GET_REMOVE_FIRST", "blockly-LISTS_GET_INDEX_TOOLTIP_GET_REMOVE_FROM", "blockly-LISTS_GET_INDEX_TOOLTIP_GET_REMOVE_LAST", "blockly-LISTS_GET_INDEX_TOOLTIP_GET_REMOVE_RANDOM", "blockly-LISTS_GET_INDEX_TOOLTIP_REMOVE_FIRST", "blockly-LISTS_GET_INDEX_TOOLTIP_REMOVE_FROM", "blockly-LISTS_GET_INDEX_TOOLTIP_REMOVE_LAST", "blockly-LISTS_GET_INDEX_TOOLTIP_REMOVE_RANDOM", "blockly-LISTS_GET_SUBLIST_END_FROM_END", "blockly-LISTS_GET_SUBLIST_END_LAST", "blockly-LISTS_GET_SUBLIST_START_FIRST", "blockly-LISTS_GET_SUBLIST_START_FROM_END", "blockly-LISTS_GET_SUBLIST_START_FROM_START", "blockly-LISTS_GET_SUBLIST_TOOLTIP", "blockly-LISTS_INDEX_FROM_END_TOOLTIP", "blockly-LISTS_INDEX_FROM_START_TOOLTIP", "blockly-LISTS_INDEX_OF_FIRST", "blockly-LISTS_INDEX_OF_LAST", "blockly-LISTS_INDEX_OF_TOOLTIP", "blockly-LISTS_INLIST", "blockly-LISTS_ISEMPTY_TITLE", "blockly-LISTS_ISEMPTY_TOOLTIP", "blockly-LISTS_LENGTH_TITLE", "blockly-LISTS_LENGTH_TOOLTIP", "blockly-LISTS_REPEAT_TITLE", "blockly-LISTS_REPEAT_TOOLTIP", "blockly-LISTS_REVERSE_MESSAGE0", "blockly-LISTS_REVERSE_TOOLTIP", "blockly-LISTS_SET_INDEX_INSERT", "blockly-LISTS_SET_INDEX_SET", "blockly-LISTS_SET_INDEX_TOOLTIP_INSERT_FIRST", "blockly-LISTS_SET_INDEX_TOOLTIP_INSERT_FROM", "blockly-LISTS_SET_INDEX_TOOLTIP_INSERT_LAST", "blockly-LISTS_SET_INDEX_TOOLTIP_INSERT_RANDOM", "blockly-LISTS_SET_INDEX_TOOLTIP_SET_FIRST", "blockly-LISTS_SET_INDEX_TOOLTIP_SET_FROM", "blockly-LISTS_SET_INDEX_TOOLTIP_SET_LAST", "blockly-LISTS_SET_INDEX_TOOLTIP_SET_RANDOM", "blockly-LISTS_SORT_ORDER_ASCENDING", "blockly-LISTS_SORT_ORDER_DESCENDING", "blockly-LISTS_SORT_TITLE", "blockly-LISTS_SORT_TOOLTIP", "blockly-LISTS_SORT_TYPE_IGNORECASE", "blockly-LISTS_SORT_TYPE_NUMERIC", "blockly-LISTS_SORT_TYPE_TEXT", "blockly-LISTS_SPLIT_LIST_FROM_TEXT", "blockly-LISTS_SPLIT_TEXT_FROM_LIST", "blockly-LISTS_SPLIT_TOOLTIP_JOIN", "blockly-LISTS_SPLIT_TOOLTIP_SPLIT", "blockly-LISTS_SPLIT_WITH_DELIMITER", "blockly-LOGIC_BOOLEAN_FALSE", "blockly-LOGIC_BOOLEAN_TOOLTIP", "blockly-LOGIC_BOOLEAN_TRUE", "blockly-LOGIC_COMPARE_EQ_ARIA", "blockly-LOGIC_COMPARE_GTE_ARIA", "blockly-LOGIC_COMPARE_GT_ARIA", "blockly-LOGIC_COMPARE_LTE_ARIA", "blockly-LOGIC_COMPARE_LT_ARIA", "blockly-LOGIC_COMPARE_NEQ_ARIA", "blockly-LOGIC_COMPARE_TOOLTIP_EQ", "blockly-LOGIC_COMPARE_TOOLTIP_GT", "blockly-LOGIC_COMPARE_TOOLTIP_GTE", "blockly-LOGIC_COMPARE_TOOLTIP_LT", "blockly-LOGIC_COMPARE_TOOLTIP_LTE", "blockly-LOGIC_COMPARE_TOOLTIP_NEQ", "blockly-LOGIC_NEGATE_TITLE", "blockly-LOGIC_NEGATE_TOOLTIP", "blockly-LOGIC_NULL_TOOLTIP", "blockly-LOGIC_OPERATION_AND", "blockly-LOGIC_OPERATION_TOOLTIP_AND", "blockly-LOGIC_OPERATION_TOOLTIP_OR", "blockly-LOGIC_TERNARY_CONDITION", "blockly-LOGIC_TERNARY_IF_FALSE", "blockly-LOGIC_TERNARY_IF_TRUE", "blockly-LOGIC_TERNARY_TOOLTIP", "blockly-MATH_ADDITION_SYMBOL_ARIA", "blockly-MATH_ARITHMETIC_TOOLTIP_ADD", "blockly-MATH_ARITHMETIC_TOOLTIP_DIVIDE", "blockly-MATH_ARITHMETIC_TOOLTIP_MINUS", "blockly-MATH_ARITHMETIC_TOOLTIP_MULTIPLY", "blockly-MATH_ARITHMETIC_TOOLTIP_POWER", "blockly-MATH_ATAN2_TITLE", "blockly-MATH_ATAN2_TOOLTIP", "blockly-MATH_CHANGE_TITLE", "blockly-MATH_CHANGE_TOOLTIP", "blockly-MATH_CONSTANT_GOLDEN_RATIO_ARIA", "blockly-MATH_CONSTANT_INFINITY_ARIA", "blockly-MATH_CONSTANT_SQRT1_2_ARIA", "blockly-MATH_CONSTANT_SQRT2_ARIA", "blockly-MATH_CONSTANT_TOOLTIP", "blockly-MATH_CONSTRAIN_TITLE", "blockly-MATH_CONSTRAIN_TOOLTIP", "blockly-MATH_DIVISION_SYMBOL_ARIA", "blockly-MATH_IS_DIVISIBLE_BY", "blockly-MATH_IS_EVEN", "blockly-MATH_IS_NEGATIVE", "blockly-MATH_IS_ODD", "blockly-MATH_IS_POSITIVE", "blockly-MATH_IS_PRIME", "blockly-MATH_IS_TOOLTIP", "blockly-MATH_IS_WHOLE", "blockly-MATH_MODULO_TITLE", "blockly-MATH_MODULO_TOOLTIP", "blockly-MATH_MULTIPLICATION_SYMBOL_ARIA", "blockly-MATH_NUMBER_TOOLTIP", "blockly-MATH_ONLIST_OPERATOR_AVERAGE", "blockly-MATH_ONLIST_OPERATOR_MAX", "blockly-MATH_ONLIST_OPERATOR_MAX_ARIA", "blockly-MATH_ONLIST_OPERATOR_MEDIAN", "blockly-MATH_ONLIST_OPERATOR_MIN", "blockly-MATH_ONLIST_OPERATOR_MIN_ARIA", "blockly-MATH_ONLIST_OPERATOR_MODE", "blockly-MATH_ONLIST_OPERATOR_RANDOM", "blockly-MATH_ONLIST_OPERATOR_STD_DEV", "blockly-MATH_ONLIST_OPERATOR_SUM", "blockly-MATH_ONLIST_TOOLTIP_AVERAGE", "blockly-MATH_ONLIST_TOOLTIP_MAX", "blockly-MATH_ONLIST_TOOLTIP_MEDIAN", "blockly-MATH_ONLIST_TOOLTIP_MIN", "blockly-MATH_ONLIST_TOOLTIP_MODE", "blockly-MATH_ONLIST_TOOLTIP_RANDOM", "blockly-MATH_ONLIST_TOOLTIP_STD_DEV", "blockly-MATH_ONLIST_TOOLTIP_SUM", "blockly-MATH_POWER_SYMBOL_ARIA", "blockly-MATH_RANDOM_FLOAT_TITLE_RANDOM", "blockly-MATH_RANDOM_FLOAT_TOOLTIP", "blockly-MATH_RANDOM_INT_TITLE", "blockly-MATH_RANDOM_INT_TOOLTIP", "blockly-MATH_ROUND_OPERATOR_ROUND", "blockly-MATH_ROUND_OPERATOR_ROUNDDOWN", "blockly-MATH_ROUND_OPERATOR_ROUNDUP", "blockly-MATH_ROUND_TOOLTIP", "blockly-MATH_SINGLE_OP_ABSOLUTE", "blockly-MATH_SINGLE_OP_ABSOLUTE_ARIA", "blockly-MATH_SINGLE_OP_EXP_ARIA", "blockly-MATH_SINGLE_OP_LN_ARIA", "blockly-MATH_SINGLE_OP_LOG10_ARIA", "blockly-MATH_SINGLE_OP_NEG_ARIA", "blockly-MATH_SINGLE_OP_POW10_ARIA", "blockly-MATH_SINGLE_OP_ROOT", "blockly-MATH_SINGLE_TOOLTIP_ABS", "blockly-MATH_SINGLE_TOOLTIP_EXP", "blockly-MATH_SINGLE_TOOLTIP_LN", "blockly-MATH_SINGLE_TOOLTIP_LOG10", "blockly-MATH_SINGLE_TOOLTIP_NEG", "blockly-MATH_SINGLE_TOOLTIP_POW10", "blockly-MATH_SINGLE_TOOLTIP_ROOT", "blockly-MATH_SUBTRACTION_SYMBOL_ARIA", "blockly-MATH_TRIG_ACOS_ARIA", "blockly-MATH_TRIG_ASIN_ARIA", "blockly-MATH_TRIG_ATAN_ARIA", "blockly-MATH_TRIG_COS_ARIA", "blockly-MATH_TRIG_SIN_ARIA", "blockly-MATH_TRIG_TAN_ARIA", "blockly-MATH_TRIG_TOOLTIP_ACOS", "blockly-MATH_TRIG_TOOLTIP_ASIN", "blockly-MATH_TRIG_TOOLTIP_ATAN", "blockly-MATH_TRIG_TOOLTIP_COS", "blockly-MATH_TRIG_TOOLTIP_SIN", "blockly-MATH_TRIG_TOOLTIP_TAN", "blockly-MINIMAP_ARIA_LABEL", "blockly-MOVE_BLOCK", "blockly-NEW_COLOUR_VARIABLE", "blockly-NEW_NUMBER_VARIABLE", "blockly-NEW_STRING_VARIABLE", "blockly-NEW_VARIABLE", "blockly-NEW_VARIABLE_TITLE", "blockly-NEW_VARIABLE_TYPE_TITLE", "blockly-NO_PARENT_ANNOUNCEMENT", "blockly-OPEN_BACKPACK", "blockly-OPEN_TRASH", "blockly-PARENT_BLOCKS_ANNOUNCEMENT", "blockly-PASTE_ALL_FROM_BACKPACK", "blockly-PASTE_SHORTCUT", "blockly-PROCEDURES_ALLOW_STATEMENTS", "blockly-PROCEDURES_BEFORE_PARAMS", "blockly-PROCEDURES_CALLNORETURN_TOOLTIP", "blockly-PROCEDURES_CALLRETURN_TOOLTIP", "blockly-PROCEDURES_CALL_BEFORE_PARAMS", "blockly-PROCEDURES_CALL_DISABLED_DEF_WARNING", "blockly-PROCEDURES_CREATE_DO", "blockly-PROCEDURES_DEFNORETURN_COMMENT", "blockly-PROCEDURES_DEFNORETURN_PROCEDURE", "blockly-PROCEDURES_DEFNORETURN_TOOLTIP", "blockly-PROCEDURES_DEFRETURN_RETURN", "blockly-PROCEDURES_DEFRETURN_TOOLTIP", "blockly-PROCEDURES_DEF_DUPLICATE_WARNING", "blockly-PROCEDURES_HIGHLIGHT_DEF", "blockly-PROCEDURES_IFRETURN_TOOLTIP", "blockly-PROCEDURES_IFRETURN_WARNING", "blockly-PROCEDURES_MUTATORARG_TITLE", "blockly-PROCEDURES_MUTATORARG_TOOLTIP", "blockly-PROCEDURES_MUTATORCONTAINER_TITLE", "blockly-PROCEDURES_MUTATORCONTAINER_TOOLTIP", "blockly-REDO", "blockly-REMOVE_COMMENT", "blockly-REMOVE_FROM_BACKPACK", "blockly-RENAME_VARIABLE", "blockly-RENAME_VARIABLE_TITLE", "blockly-RESET_ZOOM", "blockly-SCREENREADER_HINT", "blockly-SCREENREADER_MODE_DISABLED", "blockly-SCREENREADER_MODE_ENABLED", "blockly-SHORTCUTS_ABORT_MOVE", "blockly-SHORTCUTS_CLEANUP", "blockly-SHORTCUTS_CODE_NAVIGATION", "blockly-SHORTCUTS_DISCONNECT", "blockly-SHORTCUTS_DUPLICATE", "blockly-SHORTCUTS_EDITING", "blockly-SHORTCUTS_ESCAPE", "blockly-SHORTCUTS_EXTENDED_INFORMATION", "blockly-SHORTCUTS_FINISH_MOVE", "blockly-SHORTCUTS_FOCUS_TOOLBOX", "blockly-SHORTCUTS_FOCUS_WORKSPACE", "blockly-SHORTCUTS_GENERAL", "blockly-SHORTCUTS_INFORMATION", "blockly-SHORTCUTS_JUMP_BLOCK_END", "blockly-SHORTCUTS_JUMP_BLOCK_START", "blockly-SHORTCUTS_JUMP_BOTTOM_STACK", "blockly-SHORTCUTS_JUMP_FIRST_BLOCK", "blockly-SHORTCUTS_JUMP_LAST_BLOCK", "blockly-SHORTCUTS_JUMP_NEXT_PAGE", "blockly-SHORTCUTS_JUMP_PREVIOUS_PAGE", "blockly-SHORTCUTS_JUMP_TOP_STACK", "blockly-SHORTCUTS_MOVE_DOWN", "blockly-SHORTCUTS_MOVE_LEFT", "blockly-SHORTCUTS_MOVE_RIGHT", "blockly-SHORTCUTS_MOVE_UP", "blockly-SHORTCUTS_NEXT_HEADING", "blockly-SHORTCUTS_NEXT_STACK", "blockly-SHORTCUTS_PERFORM_ACTION", "blockly-SHORTCUTS_PREVIOUS_HEADING", "blockly-SHORTCUTS_PREVIOUS_STACK", "blockly-SHORTCUTS_SCROLL_DOWN", "blockly-SHORTCUTS_SCROLL_LEFT", "blockly-SHORTCUTS_SCROLL_RIGHT", "blockly-SHORTCUTS_SCROLL_UP", "blockly-SHORTCUTS_SHOW_CONTEXT_MENU", "blockly-SHORTCUTS_SHOW_TOOLTIP", "blockly-SHORTCUTS_START_MOVE", "blockly-SHORTCUTS_START_MOVE_STACK", "blockly-SHORTCUTS_TOGGLE_SCREENREADER_MODE", "blockly-TEXT_APPEND_TITLE", "blockly-TEXT_APPEND_TOOLTIP", "blockly-TEXT_CHANGECASE_OPERATOR_LOWERCASE", "blockly-TEXT_CHANGECASE_OPERATOR_TITLECASE", "blockly-TEXT_CHANGECASE_OPERATOR_UPPERCASE", "blockly-TEXT_CHANGECASE_TOOLTIP", "blockly-TEXT_CHARAT_FIRST", "blockly-TEXT_CHARAT_FROM_END", "blockly-TEXT_CHARAT_FROM_START", "blockly-TEXT_CHARAT_LAST", "blockly-TEXT_CHARAT_RANDOM", "blockly-TEXT_CHARAT_TITLE", "blockly-TEXT_CHARAT_TOOLTIP", "blockly-TEXT_COUNT_MESSAGE0", "blockly-TEXT_COUNT_TOOLTIP", "blockly-TEXT_CREATE_JOIN_ITEM_TOOLTIP", "blockly-TEXT_CREATE_JOIN_TITLE_JOIN", "blockly-TEXT_CREATE_JOIN_TOOLTIP", "blockly-TEXT_FROM_END_ARIA", "blockly-TEXT_FROM_START_ARIA", "blockly-TEXT_GET_SUBSTRING_END_FROM_END", "blockly-TEXT_GET_SUBSTRING_END_FROM_START", "blockly-TEXT_GET_SUBSTRING_END_LAST", "blockly-TEXT_GET_SUBSTRING_INPUT_IN_TEXT", "blockly-TEXT_GET_SUBSTRING_START_FIRST", "blockly-TEXT_GET_SUBSTRING_START_FROM_END", "blockly-TEXT_GET_SUBSTRING_START_FROM_START", "blockly-TEXT_GET_SUBSTRING_TOOLTIP", "blockly-TEXT_INDEXOF_OPERATOR_FIRST", "blockly-TEXT_INDEXOF_OPERATOR_LAST", "blockly-TEXT_INDEXOF_TITLE", "blockly-TEXT_INDEXOF_TOOLTIP", "blockly-TEXT_ISEMPTY_TITLE", "blockly-TEXT_ISEMPTY_TOOLTIP", "blockly-TEXT_JOIN_TITLE_CREATEWITH", "blockly-TEXT_JOIN_TOOLTIP", "blockly-TEXT_LENGTH_TITLE", "blockly-TEXT_LENGTH_TOOLTIP", "blockly-TEXT_PRINT_TITLE", "blockly-TEXT_PRINT_TOOLTIP", "blockly-TEXT_PROMPT_TOOLTIP_NUMBER", "blockly-TEXT_PROMPT_TOOLTIP_TEXT", "blockly-TEXT_PROMPT_TYPE_NUMBER", "blockly-TEXT_PROMPT_TYPE_TEXT", "blockly-TEXT_REPLACE_MESSAGE0", "blockly-TEXT_REPLACE_TOOLTIP", "blockly-TEXT_REVERSE_MESSAGE0", "blockly-TEXT_REVERSE_TOOLTIP", "blockly-TEXT_TEXT_TOOLTIP", "blockly-TEXT_TRIM_OPERATOR_BOTH", "blockly-TEXT_TRIM_OPERATOR_LEFT", "blockly-TEXT_TRIM_OPERATOR_RIGHT", "blockly-TEXT_TRIM_TOOLTIP", "blockly-TODAY", "blockly-UNDO", "blockly-UNKNOWN", "blockly-UNNAMED_KEY", "blockly-VARIABLES_DEFAULT_NAME", "blockly-VARIABLES_GET_CREATE_SET", "blockly-VARIABLES_GET_TOOLTIP", "blockly-VARIABLES_SET", "blockly-VARIABLES_SET_CREATE_GET", "blockly-VARIABLES_SET_TOOLTIP", "blockly-VARIABLE_ALREADY_EXISTS", "blockly-VARIABLE_ALREADY_EXISTS_FOR_ANOTHER_TYPE", "blockly-VARIABLE_ALREADY_EXISTS_FOR_A_PARAMETER", "blockly-WORKSPACE_COMMENT_DEFAULT_TEXT", "blockly-WORKSPACE_CONTENTS_BLOCKS_MANY", "blockly-WORKSPACE_CONTENTS_BLOCKS_ONE", "blockly-WORKSPACE_CONTENTS_BLOCKS_ZERO", "blockly-WORKSPACE_CONTENTS_COMMENTS_MANY", "blockly-WORKSPACE_CONTENTS_COMMENTS_ONE", "blockly-WORKSPACE_LABEL_1_STACK", "blockly-WORKSPACE_LABEL_FLYOUT_WORKSPACE", "blockly-WORKSPACE_LABEL_MANY_STACKS", "blockly-WORKSPACE_LABEL_MUTATOR_WORKSPACE", "blockly-WORKSPACE_LABEL_PLAIN", "blockly-WORKSPACE_SEARCH_CLOSE", "blockly-WORKSPACE_SEARCH_FIND_NEXT", "blockly-WORKSPACE_SEARCH_FIND_PREVIOUS", "blockly-WORKSPACE_SEARCH_INPUT_LABEL", "blockly-WORKSPACE_SEARCH_MATCH", "blockly-WORKSPACE_SEARCH_NO_MATCHES", "blockly-WORKSPACE_SEARCH_PLACEHOLDER", "blockly-ZOOM_TO_FIT_ARIA_LABEL", "blockly-CONTROLS_IF_ELSEIF_TITLE_ELSEIF", "blockly-CONTROLS_IF_ELSE_TITLE_ELSE", "blockly-LISTS_CREATE_WITH_ITEM_TITLE", "blockly-LISTS_GET_INDEX_INPUT_IN_LIST", "blockly-LISTS_GET_SUBLIST_INPUT_IN_LIST", "blockly-LISTS_INDEX_OF_INPUT_IN_LIST", "blockly-LISTS_SET_INDEX_INPUT_IN_LIST", "blockly-MATH_CHANGE_TITLE_ITEM", "blockly-PROCEDURES_DEFRETURN_COMMENT", "blockly-PROCEDURES_DEFRETURN_PROCEDURE", "blockly-TEXT_APPEND_VARIABLE", "blockly-TEXT_CREATE_JOIN_ITEM_TITLE_ITEM", "r-blocks-view", "r-blocks-help", "r-blocks-discard", "r-blocks-unavailable", "r-blocks-invalid", "r-blocks-conflict", "r-blocks-permission", "r-blocks-unsaved", "r-blocks-saved", "r-blocks-reload", "board-view-product-backlog", "board-view-sprints", "board-view-sprint-report", "board-view-velocity", "scrum-settings", "scrum-product-owner", "scrum-master", "scrum-developers", "scrum-working-days", "scrum-enabled", "scrum-product-goal", "scrum-definition-of-done", "scrum-estimate-source", "scrum-estimate-unit", "scrum-completion-policy", "scrum-source-poker", "scrum-source-customField", "scrum-policy-dueComplete", "scrum-policy-doneLists", "scrum-sprints", "scrum-sprint", "scrum-start-sprint", "scrum-close-sprint", "scrum-cancel-sprint", "scrum-rollover-sprint", "scrum-cancel-reason", "scrum-product-backlog", "scrum-edit-sprint", "scrum-sprint-goal", "scrum-capacity", "scrum-new-sprint", "scrum-releases", "scrum-release", "scrum-select-sprint", "scrum-backlog", "scrum-backlog-help", "scrum-estimate", "scrum-backlog-rank", "scrum-issue-type", "scrum-acceptance-criteria", "scrum-events", "scrum-event-kind", "scrum-timebox", "scrum-notes", "scrum-event-planning", "scrum-event-daily", "scrum-event-review", "scrum-event-retrospective", "scrum-committed", "scrum-completed", "scrum-added", "scrum-removed", "scrum-incomplete", "scrum-no-closed-sprints", "scrum-report-help", "scrum-total", "scrum-state-planned", "scrum-state-active", "scrum-state-closed", "scrum-state-cancelled", "scrum-unknown-estimate", "scrum-confirm-close", "scrum-confirm-cancel", "scrum-past-sprints", "scrum-list-category", "scrum-swimlane-purpose", "scrum-category-backlog", "scrum-category-todo", "scrum-category-doing", "scrum-category-done", "scrum-partial-report", "scrum-state-released", "scrum-released-at", "scrum-follow-up-cards", "scrum-import-reference-omitted", "scrum-partial-snapshot", "scrum-resume-close", "scrum-daily-observations", "scrum-daily-observations-help", "scrum-daily-truncated", "scrum-daily-empty", "scrum-observed-scope", "scrum-daily-observations-export-help", "scrum-import-pending", "sync-conflict-heading", "sync-conflict-hint", "sync-conflict-local", "sync-conflict-keep-local", "sync-conflict-use-source", "sync-conflict-refresh", "sync-conflict-review-complete", "sync-conflict-duplicate", "sync-conflict-keep-mapping", "sync-conflict-detach", "sync-conflict-detach-hint", "sync-conflict-archive", "sync-conflict-archive-hint", "sync-conflict-keep-card-local", "sync-conflict-creation", "sync-conflict-creation-hint", "sync-conflict-create-replacement", "sync-preview-button", "sync-preview-heading", "sync-preview-saved", "sync-preview-unavailable", "sync-preview-blocked", "sync-preview-create", "sync-preview-update", "sync-preview-archive", "sync-preview-baseline", "sync-preview-truncated", "sync-preview-omissions", "sync-preview-scope", "sync-preview-excluded", "sync-preview-unmapped", "sync-preview-parser-warnings", "sync-preview-parser-unsupported", "sync-source-heading", "sync-source-scope", "sync-source-unmapped", "sync-source-excluded", "sync-source-converted", "sync-source-fallback", "sync-source-excluded-item", "sync-source-occurrences", "sync-source-truncated", "sync-source-omitted", "sync-report-button", "sync-report-retention", "sync-report-partial", "sync-report-unfinished", "sync-report-failed", "sync-report-completed", "sync-report-completed-with-warnings", "sync-report-skipped", "sync-report-review-only", "sync-report-unavailable", "sync-report-empty", "sync-recovery-heading", "sync-recovery-description", "sync-recovery-unavailable", "sync-recovery-all", "sync-estimate-field", "sync-estimate-field-hint", "email-recovery-heading", "email-recovery-description", "email-recovery-saving", "email-recovery-queued", "email-recovery-retrying", "email-recovery-attempts", "email-recovery-oldest", "email-recovery-next", "email-recovery-changed", "email-recovery-pause", "email-recovery-resume", "email-recovery-cancel", "email-recovery-paused", "email-recovery-pending", "email-recovery-empty", "email-recovery-unavailable", "email-recovery-busy", "email-recovery-failed", "email-recovery-superseded", "email-recovery-confirm-cancel", "email-recovery-attention", "email-recovery-stopped", "email-recovery-retry", "email-failure-smtp-temporary", "email-failure-smtp-rejected", "email-failure-smtp-authentication", "email-failure-smtp-configuration", "email-failure-recipient-unavailable", "email-failure-delivery-unconfirmed", "email-failure-acknowledgement-failed", "email-failure-delivery-failed", "email-failure-retry-limit", "sync-original-time", "sync-remaining-time", "sync-time-estimate-hint", "activity-recovery-heading", "activity-recovery-description", "activity-recovery-empty", "activity-recovery-unavailable", "activity-recovery-retry", "activity-recovery-retrying", "activity-recovery-status-pending", "activity-recovery-status-preparing", "activity-recovery-status-processing", "activity-recovery-status-missing", "activity-recovery-status-changed", "activity-recovery-status-invalid", "activity-recovery-status-inconsistent", "activity-recovery-busy", "activity-recovery-denied", "activity-recovery-source-unavailable", "activity-recovery-disabled", "activity-recovery-failed", "activity-recovery-pause", "activity-recovery-resume", "activity-recovery-paused", "activity-recovery-control-conflict", "activity-recovery-control-failed", "activity-recovery-status-cancelled", "activity-recovery-cancel", "activity-recovery-cancel-confirm", "rule-email-recovery-heading", "rule-email-recovery-description", "rule-email-recovery-all", "rule-email-recovery-unconfirmed", "rule-email-recovery-sent", "rule-email-recovery-invalid", "rule-email-recovery-identifiers", "rule-email-recovery-started", "rule-email-recovery-finished", "rule-email-recovery-empty", "rule-email-recovery-unavailable", "saml-login-not-started", "move-selection-before", "move-selection-after", "history-request-pending-undo", "history-request-pending-redo", "history-request-hint", "history-request-retry", "history-request-forget"]) {
    assert.ok(locale[key]?.trim(), key);
    assert.notEqual(locale[key], en[key], key);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(en[key]), key);
    assert.deepEqual(locale[key].match(/%?\{[^}]+\}/g), en[key].match(/%?\{[^}]+\}/g), key);
  }
  assert.match(locale['auto-archive-hint'], /cithakan ora tau diarsipake/);
  assert.match(locale['filter-column-age-hint'], /ora dingerteni tetep katon/);
  assert.match(locale['filter-column-age-hint'], /ora miwiti maneh/);
  console.log('Javanese filter batch: key order, placeholders and restrictions passed');
}
