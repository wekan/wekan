// The completed catalog predates newer features; keep its no-regression gate.
// Full translation work remains visible through fill-translations.mjs --list.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const readLocale = code => JSON.parse(fs.readFileSync(
  path.join(root, `imports/i18n/data/${code}.i18n.json`),
  'utf8',
));
const english = readLocale('en');
const hawaiian = readLocale('haw');
const tokens = value => [...value.matchAll(
  /__[A-Za-z0-9_]+__|%[0-9$]*[A-Za-z]|%{[A-Za-z0-9]+}|{{[A-Za-z0-9]+}}/g,
)].map(([token]) => token).sort();
const { translationTokens } = require('../releases/translations/placeholder-tokens.mjs');
const tags = value => [...value.matchAll(/<\/?[A-Za-z][^>]*>/g)]
  .map(([tag]) => tag).sort();

const fillResult = spawnSync(process.execPath, [
  path.join(root, 'releases/translations/fill-translations.mjs'),
  '--completed-catalog', '--list',
  'haw',
], { cwd: root, encoding: 'utf8' });
assert.equal(fillResult.status, 0, fillResult.stderr);
assert.equal(Object.keys(JSON.parse(fillResult.stdout)).length, 0,
  'every actionable Hawaiian value stays translated');

assert.deepEqual(Object.keys(hawaiian), Object.keys(english),
  'Hawaiian key order follows the English source');
for (const [key, value] of Object.entries(hawaiian)) {
  assert.deepEqual(translationTokens(value), translationTokens(english[key]),
    `${key}: locale-wide placeholder inventory`);
  assert.deepEqual(tags(value), tags(english[key]),
    `${key}: locale-wide HTML tag inventory`);
}

assert.equal(hawaiian.accept, 'ʻae');
assert.equal(hawaiian.actions, 'nā hana');
assert.equal(hawaiian.board, 'Papa');
assert.equal(hawaiian.card, 'Kāleka');
assert.equal(hawaiian.list, 'Papa inoa');
assert.equal(hawaiian.save, 'Mālama');
assert.equal(hawaiian.search, 'Huli');
assert.deepEqual(tokens(hawaiian['activity-changedTitle']), ['%s', '%s']);
assert.deepEqual(tokens(hawaiian['act-deleteCard']),
  ['__board__', '__card__', '__list__', '__swimlane__']);
assert.deepEqual(tokens(hawaiian['restore-list-swimlanes-done']),
  ['__remaining__', '__restored__']);

// Newer card-linking and import/export messages are outside the historic gate.
const recentKeys = [
  "attach-card",
  "attachCardPopup-title",
  "attach-card-hint",
  "attached-card-unavailable",
  "detach-card",
  "attach-card-self",
  "attach-card-limit",
  "attach-card-not-found",
  "board-announcement",
  "board-announcement-enabled",
  "board-view-calendar-mode",
  "custom-field-links",
  "custom-field-links-hint",
  "custom-field-links-none",
  "custom-field-link-unavailable",
  "custom-field-link-fields",
  "custom-field-link-no-fields",
  "custom-field-link-inactive",
  "custom-field-unlink",
  "custom-field-link-target",
  "custom-field-link-direction",
  "custom-field-link-both",
  "custom-field-link-send",
  "custom-field-link-sends",
  "custom-field-link-receives",
  "custom-field-link-add",
  "field-link-self",
  "field-link-limit",
  "field-link-archived",
  "field-link-invalid",
  "field-link-not-found",
  "field-link-not-allowed",
  "cardCustomFieldLinksPopup-title",
  "cards-use-list-color",
  "import-members-mode-heading",
  "import-members-mode-map",
  "import-members-mode-placeholder",
  "import-members-mode-me",
  "csv-mapping-title",
  "csv-mapping-description",
  "csv-mapping-not-in-file",
  "csv-mapping-column-number",
  "csv-mapping-list-missing",
  "csv-mapping-list-name",
  "csv-mapping-custom-fields",
  "csv-mapping-boards",
  "csv-mapping-skipped-sheets",
  "csv-mapping-title-required",
  "csv-mapping-list-required",
  "invalid-import-mapping",
  "import-many-boards",
  "import-many-boards-hint",
  "import-one-board-per-project",
  "import-one-board-per-project-hint",
  "import-many-progress",
  "import-many-results-heading",
  "import-many-imported",
  "export-all-boards",
  "export-selected-boards",
  "export-all-boards-hint",
  "exportAllBoardsPopup-title",
  "card-edit-custom-fields",
  "custom-field-delete-pop",
  "custom-field-currency",
  "custom-field-currency-option",
  "custom-field-dropdown-options",
  "custom-field-dropdown-options-placeholder",
  "custom-field-dropdown-unknown",
  "custom-field-number"
];
for (const key of recentKeys) {
  assert.ok(hawaiian[key].trim(), `${key}: nonempty Hawaiian text`);
  assert.notEqual(hawaiian[key], english[key], `${key}: no English fallback`);
}
assert.match(hawaiian['custom-field-link-sends'], /kēia kāleka i kēlā kāleka/);
assert.match(hawaiian['custom-field-link-receives'], /kēlā kāleka i kēia kāleka/);
assert.match(hawaiian['custom-field-links-hint'], /ʻAʻole hoʻololi ʻia/,
  'unmatched fields are explicitly left unchanged');
assert.match(hawaiian['field-link-not-allowed'], /nā kāleka ʻelua/,
  'editing permission is required on both cards');
assert.equal(hawaiian['custom-field-number'], 'Helu');
assert.equal(hawaiian['custom-field-currency'], 'Kālā');
assert.match(hawaiian['custom-field-dropdown-options-placeholder'], /Enter/);
assert.doesNotMatch(recentKeys.map(key => hawaiian[key]).join(' '),
  /kulalenakawa|opakionaka|unakanowana|numapela|palekaka|wilala/,
  'malformed seed words must not return');
assert.equal(hawaiian['csv-mapping-column-number'].replace('__number__', '3'), 'Kolamu 3');
assert.equal(hawaiian['import-many-progress']
  .replace('__done__', '2').replace('__total__', '5').replace('__name__', 'Papa'),
  'Ke hoʻokomo nei i 2 o 5: Papa');
console.log('hawaiianTranslationProgress: historic gate and card/import batch passed');

// Import instructions, delivery controls and the first Blockly control families.
const nextKeys = [
  "import-board-instruction-opml",
  "import-board-instruction-orgmode",
  "import-board-instruction-meistertask",
  "import-board-instruction-obsidian",
  "import-board-instruction-linear",
  "import-board-instruction-ticktick",
  "import-board-instruction-clickup",
  "import-board-instruction-nullboard",
  "import-board-instruction-kanri",
  "import-board-instruction-pivotal",
  "import-board-instruction-tasksorg",
  "import-board-instruction-monday",
  "import-board-instruction-superproductivity",
  "import-board-instruction-taiga",
  "import-board-instruction-vikunja",
  "import-board-instruction-quire",
  "import-board-instruction-wrike",
  "import-board-instruction-teamwork",
  "import-board-instruction-businessmap",
  "import-board-instruction-redmine",
  "import-board-instruction-notion",
  "import-board-instruction-plane",
  "external-link-rules",
  "external-link-rules-description",
  "external-link-identifier-aliases",
  "webhook-payload-heading",
  "webhook-payload-description",
  "webhook-payload-text",
  "webhook-payload-fields",
  "webhook-payload-field-standard",
  "webhook-payload-field-ids",
  "webhook-payload-field-names",
  "webhook-payload-field-links",
  "webhook-payload-field-actor",
  "webhook-payload-field-people",
  "webhook-payload-field-details",
  "webhook-hide-identity",
  "webhook-someone",
  "notification-delivery-layout",
  "notification-delivery-layout-classic",
  "notification-delivery-layout-clear",
  "notification-delivery-parts",
  "notification-delivery-part-board",
  "notification-delivery-part-actor",
  "notification-delivery-part-card",
  "notification-delivery-part-list",
  "notification-delivery-part-swimlane",
  "notification-delivery-part-details",
  "notification-delivery-part-dates",
  "notification-delivery-part-link",
  "notification-delivery-grouping",
  "notification-delivery-grouping-all",
  "notification-delivery-grouping-board",
  "notification-delivery-grouping-card",
  "notification-delivery-grouping-none",
  "notification-delivery-schedule",
  "notification-delivery-schedule-immediate",
  "notification-delivery-schedule-interval",
  "notification-delivery-schedule-daily",
  "notification-delivery-interval",
  "notification-delivery-minutes",
  "notification-delivery-quiet",
  "notification-delivery-quiet-from",
  "notification-delivery-quiet-clear",
  "notification-delivery-timezone",
  "notification-delivery-invalid",
  "notification-group-card",
  "notification-group-board",
  "read-only-field",
  "r-wrike-workflow",
  "r-wrike-workflow-note",
  "r-export-wrike-workflow",
  "r-import-wrike-workflow",
  "r-import-wrike-workflow-done",
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
  "import-file-label",
  "subtask-mark-done",
  "subtask-mark-not-done",
  "subtask-done-no-permission",
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
  "r-blocks-view",
  "r-blocks-help",
  "r-blocks-discard",
  "r-blocks-unavailable",
  "r-blocks-invalid",
  "r-blocks-conflict",
  "r-blocks-permission",
  "r-blocks-unsaved",
  "r-blocks-saved",
  "r-blocks-reload",
  "notification-delivery-daily-time",
  "notification-delivery-quiet-to"
];
for (const key of nextKeys) {
  assert.ok(hawaiian[key].trim(), `${key}: nonempty text`);
  assert.notEqual(hawaiian[key], english[key], `${key}: English prose cannot return`);
}
const importLiterals = {
  orgmode: ['TODO', 'DONE', 'SCHEDULED', 'DEADLINE', 'CLOSED'],
  meistertask: ['Export project', 'CSV'],
  obsidian: ['Markdown', '.md', 'Archive'],
  linear: ['Settings', 'Import / Export', 'Export data', 'CSV'],
  ticktick: ['Settings', 'Account', 'Backup & Import', 'CSV'],
  clickup: ['Settings', 'Imports / Exports', 'Export Items', 'List', 'Table', 'CSV'],
  nullboard: ['Export this board...', '.nbx', 'raw'],
  kanri: ['Import & Export', 'Export individual board', 'Export all data', '.json'],
  pivotal: ['MORE', 'Export CSV', 'Bulk Actions', 'Estimate', 'Story points'],
  tasksorg: ['Settings', 'Backups', 'Export tasks', '.json'],
  monday: ['More actions', 'Export board to Excel', '.xlsx', 'Status'],
  superproductivity: ['Sync & Backup', 'Export Data', 'sp-backup', '.json', 'To Do', 'In Progress', 'Backlog', 'Done'],
  taiga: ['Admin > Project > Export', '.json.gz', 'JSON'],
  vikunja: ['Data Export', '.zip', 'data.json'],
  quire: ['Export CSV'],
  wrike: ['.xlsx', 'Status', 'Key', 'Priority', 'Duration'],
  teamwork: ['Tasklist', 'Assign to', 'Estimated time', '.xlsx', '--', '##', '>>'],
  businessmap: ['Advanced Search', 'Configure results', 'Title', 'Column', 'Lane', 'Owner', 'Deadline'],
  redmine: ['Also available in: CSV', 'All columns', 'Description', 'My account', '% Done'],
  notion: ['•••', 'Markdown & CSV', '.zip', 'Status'],
  plane: ['Workspace Settings', 'Exports', 'JSON', 'CSV', 'Excel', '.zip'],
};
for (const [format, literals] of Object.entries(importLiterals)) {
  for (const literal of literals) assert.ok(hawaiian[`import-board-instruction-${format}`].includes(literal),
    `${format}: preserve external command/header ${literal}`);
}
for (const format of ['taiga', 'vikunja', 'notion']) {
  assert.match(hawaiian[`import-board-instruction-${format}`], /ʻAʻole hoʻokomo ʻia.*mea pili/,
    `${format}: attachments are explicitly excluded`);
}
assert.match(hawaiian['import-board-instruction-quire'], /ʻAʻohe manaʻo a me nā mea pili/);
assert.match(hawaiian['import-board-instruction-plane'], /ʻAʻohe wehewehe a me nā mea pili/);
for (const format of ['nullboard', 'kanri']) assert.match(
  hawaiian[`import-board-instruction-${format}`], /papa mua/, 'only the first board is imported');
assert.match(hawaiian['import-board-instruction-businessmap'], /ʻōlelo Pelekānia/);
assert.match(hawaiian['import-board-instruction-redmine'], /ʻōlelo Pelekānia/);
assert.match(hawaiian['external-link-rules-description'], /\[\{identifier\}:\{number\}\] = https:\/\/tracker\.example\.com\/\{identifier\}\/\{number\}/);
assert.match(hawaiian['external-link-identifier-aliases'], /TK=Task, IN=Incident/);
assert.match(hawaiian['ldap-sync-now-nothing'], /LDAP_BACKGROUND_SYNC_IMPORT_NEW_USERS.*LDAP_BACKGROUND_SYNC_KEEP_EXISTANT_USERS_UPDATED/);
assert.match(hawaiian['card-field-visibility-desc'], /ʻAʻole hoʻololi ʻia ka ʻikepili kāleka/);
assert.match(hawaiian['notification-delivery-quiet'], /kali a pau/);
assert.equal(hawaiian['notification-delivery-daily-time'], 'I ka hola');
assert.equal(hawaiian['notification-delivery-quiet-to'], 'A hiki i');
assert.match(hawaiian['webhook-hide-identity'], /^Mai hoʻokomo/);
assert.match(hawaiian['r-wrike-workflow-note'], /GET \/workflows/);
assert.match(hawaiian['r-wrike-workflow-note'], /Completed a i ʻole Cancelled.*Active a i ʻole Deferred/);
assert.match(hawaiian['blockly-CONTROLS_FLOW_STATEMENTS_TOOLTIP_BREAK'], /Puka i waho/);
assert.match(hawaiian['blockly-CONTROLS_FLOW_STATEMENTS_TOOLTIP_CONTINUE'], /hoʻomau i ka pōʻai aʻe/);
assert.match(hawaiian['blockly-CONTROLS_WHILEUNTIL_TOOLTIP_UNTIL'], /wahaheʻe/);
assert.match(hawaiian['blockly-CONTROLS_WHILEUNTIL_TOOLTIP_WHILE'], /ʻoiaʻiʻo/);
assert.match(hawaiian['blockly-COLOUR_RGB_TOOLTIP'], /0 a me 100/);
assert.match(hawaiian['blockly-COLOUR_BLEND_TOOLTIP'], /0\.0 - 1\.0/);
assert.equal(hawaiian['blockly-CONTROLS_REPEAT_TITLE'].replace('%1', '3'), 'hana hou 3 manawa');
assert.match(hawaiian['r-blocks-invalid'], /hoʻokahi wale nō/);
assert.match(hawaiian['r-blocks-permission'], /ʻae luna papa/);
console.log('hawaiianTranslationProgress: import, delivery and Blockly controls passed');

// Entire input, list and logic families, including aliases and short source
// words omitted from the fill report, must stay translated. URLs, hue values,
// empty affixes, the index symbol and the code literal null stay unchanged.
const blocklyFamilies = /^blockly-(?:FIELD_|ICON_|INPUT_LABEL_|KEYBOARD_NAV_|LISTS_|LOGIC_)/;
for (const [key, value] of Object.entries(english)) {
  if (!blocklyFamilies.test(key) || /(?:HELPURL|HUE)$/.test(key)
      || !value || ['blockly-LISTS_GET_INDEX_FROM_START', 'blockly-LOGIC_NULL'].includes(key)) continue;
  assert.ok(hawaiian[key].trim(), `${key}: translated family has nonempty text`);
  assert.notEqual(hawaiian[key], value, `${key}: prose, including short labels, stays translated`);
}
for (const suffix of ['FIRST', 'FROM', 'LAST', 'RANDOM']) {
  const get = hawaiian[`blockly-LISTS_GET_INDEX_TOOLTIP_GET_${suffix}`];
  const remove = hawaiian[`blockly-LISTS_GET_INDEX_TOOLTIP_REMOVE_${suffix}`];
  const both = hawaiian[`blockly-LISTS_GET_INDEX_TOOLTIP_GET_REMOVE_${suffix}`];
  assert.match(get, /^Hoʻihoʻi/);
  assert.doesNotMatch(get, /[Ww]ehe/, 'read-only getters do not claim removal');
  assert.match(remove, /^Wehe/);
  assert.doesNotMatch(remove, /hoʻihoʻi/, 'remove-only operations do not promise a return value');
  assert.match(both, /^Wehe a hoʻihoʻi/);
}
for (const key of ['LISTS_GET_SUBLIST_TOOLTIP', 'LISTS_REVERSE_TOOLTIP', 'LISTS_SORT_TOOLTIP']) {
  assert.match(hawaiian[`blockly-${key}`], /kope/, `${key}: operates on a copy`);
}
assert.match(hawaiian['blockly-LISTS_INDEX_FROM_END_TOOLTIP'], /hope/);
assert.match(hawaiian['blockly-LISTS_INDEX_FROM_START_TOOLTIP'], /mua/);
assert.equal(hawaiian['blockly-LISTS_GET_SUBLIST_END_FROM_START'], 'a i #');
assert.match(hawaiian['blockly-LISTS_GET_SUBLIST_END_FROM_END'], /mai ka hope/);
assert.match(hawaiian['blockly-LISTS_SORT_TYPE_IGNORECASE'], /hua nui.*hua liʻiliʻi/);
assert.match(hawaiian['blockly-LISTS_SPLIT_TOOLTIP_JOIN'], /^Hoʻohui/);
assert.match(hawaiian['blockly-LISTS_SPLIT_TOOLTIP_SPLIT'], /^Hoʻokaʻawale/);
assert.match(hawaiian['blockly-LISTS_INDEX_OF_TOOLTIP'], /%1 inā ʻaʻole i loaʻa/);
assert.match(hawaiian['blockly-LOGIC_OPERATION_TOOLTIP_AND'], /nā hoʻokomo ʻelua/);
assert.match(hawaiian['blockly-LOGIC_OPERATION_TOOLTIP_OR'], /ma ka liʻiliʻi hoʻokahi/);
assert.match(hawaiian['blockly-LOGIC_COMPARE_TOOLTIP_GTE'], /a i ʻole like lāua/);
assert.match(hawaiian['blockly-LOGIC_COMPARE_TOOLTIP_LTE'], /a i ʻole like lāua/);
assert.doesNotMatch(hawaiian['blockly-LOGIC_COMPARE_TOOLTIP_GT'], /like lāua/);
assert.doesNotMatch(hawaiian['blockly-LOGIC_COMPARE_TOOLTIP_LT'], /like lāua/);
for (const label of ['CONDITION', 'IF_TRUE', 'IF_FALSE']) {
  assert.ok(hawaiian['blockly-LOGIC_TERNARY_TOOLTIP'].includes(hawaiian[`blockly-LOGIC_TERNARY_${label}`]),
    `ternary help names the translated ${label} control`);
}
assert.equal(hawaiian['blockly-FIELD_BITMAP_PIXEL_ON'], 'ʻā');
assert.equal(hawaiian['blockly-FIELD_BITMAP_PIXEL_OFF'], 'pio');
assert.notEqual(hawaiian['blockly-INPUT_LABEL_MATH_DIVIDEND'], hawaiian['blockly-INPUT_LABEL_MATH_DIVISOR']);
assert.equal(hawaiian['blockly-KEYBOARD_NAV_COPIED_HINT'].replace('%1', 'Ctrl+V'),
  'Ua kope ʻia. Kaomi iā Ctrl+V e hoʻopili ai.');
assert.equal(hawaiian['blockly-LISTS_REPEAT_TITLE'].replace('%1', 'A').replace('%2', '3'),
  'hana i papa inoa me ka mea A i hana hou ʻia 3 manawa');
for (const key of ['CONTROLS_IF_MSG_IF', 'CONTROLS_REPEAT_INPUT_DO',
  'CONTROLS_FOREACH_INPUT_DO', 'CONTROLS_FOR_INPUT_DO', 'CONTROLS_IF_IF_TITLE_IF',
  'CONTROLS_IF_MSG_THEN', 'CONTROLS_WHILEUNTIL_INPUT_DO', 'PROCEDURES_DEFNORETURN_TITLE',
  'PROCEDURES_DEFRETURN_TITLE']) {
  assert.notEqual(hawaiian[`blockly-${key}`], english[`blockly-${key}`]);
}
console.log('hawaiianTranslationProgress: Blockly inputs, lists, logic and short labels passed');

// Math notation stays literal; explanatory math and procedure prose does not.
const mathNotation = new Map(Object.entries({
  'MATH_ADDITION_SYMBOL': '+', 'MATH_DIVISION_SYMBOL': '÷',
  'MATH_MULTIPLICATION_SYMBOL': '×', 'MATH_POWER_SYMBOL': '^',
  'MATH_SUBTRACTION_SYMBOL': '-', 'MATH_CONSTANT_E_ARIA': 'e',
  'MATH_CONSTANT_PI_ARIA': 'pi', 'MATH_TRIG_ACOS': 'acos',
  'MATH_TRIG_ASIN': 'asin', 'MATH_TRIG_ATAN': 'atan',
  'MATH_TRIG_COS': 'cos', 'MATH_TRIG_SIN': 'sin', 'MATH_TRIG_TAN': 'tan',
}).map(([key, value]) => [`blockly-${key}`, value]));
for (const [key, value] of Object.entries(english)) {
  if (!/^blockly-(MATH_|PROCEDURES_|SHORTCUTS_|SCREENREADER_)/.test(key)
      || /(?:HELPURL|HUE)$/.test(key) || !value) continue;
  if (mathNotation.has(key)) {
    assert.equal(value, mathNotation.get(key), `${key}: review changed source notation`);
    assert.equal(hawaiian[key], value, `${key}: retain code/math notation`);
  } else {
    assert.ok(hawaiian[key].trim());
    assert.notEqual(hawaiian[key], value, `${key}: no English prose fallback`);
  }
}
assert.match(hawaiian['blockly-MATH_RANDOM_FLOAT_TOOLTIP'], /0\.0 \(komo pū\).*1\.0 \(ʻaʻole komo\)/,
  'random fractions include zero and exclude one');
assert.match(hawaiian['blockly-MATH_RANDOM_INT_TOOLTIP'], /me nā palena pū/,
  'random integers include both bounds');
assert.match(hawaiian['blockly-MATH_CONSTRAIN_TOOLTIP'], /me nā palena pū/);
assert.match(hawaiian['blockly-MATH_ATAN2_TOOLTIP'], /\(X, Y\).*kēkelē.*-180 a i 180/);
for (const operation of ['COS', 'SIN', 'TAN']) assert.match(
  hawaiian[`blockly-MATH_TRIG_TOOLTIP_${operation}`], /kēkelē \(ʻaʻole radiana\)/);
for (const operation of ['ACOS', 'ASIN', 'ATAN']) assert.match(
  hawaiian[`blockly-MATH_TRIG_TOOLTIP_${operation}`], /huli/);
for (const literal of ['π (3.141…)', 'e (2.718…)', 'φ (1.618…)',
  'sqrt(2) (1.414…)', 'sqrt(½) (0.707…)', '∞']) {
  assert.ok(hawaiian['blockly-MATH_CONSTANT_TOOLTIP'].includes(literal), literal);
}
assert.match(hawaiian['blockly-MATH_SINGLE_TOOLTIP_LN'], /kumu e/);
assert.match(hawaiian['blockly-MATH_SINGLE_TOOLTIP_LOG10'], /kumu 10/);
assert.match(hawaiian['blockly-MATH_SINGLE_TOOLTIP_ABS'], /hōʻailona ʻole/);
assert.match(hawaiian['blockly-MATH_SINGLE_TOOLTIP_NEG'], /hōʻailona i hoʻohuli ʻia/);
assert.match(hawaiian['blockly-MATH_ONLIST_TOOLTIP_AVERAGE'], /ʻawelike/);
assert.match(hawaiian['blockly-MATH_ONLIST_TOOLTIP_MEDIAN'], /kūwaena/);
assert.match(hawaiian['blockly-MATH_ONLIST_TOOLTIP_MODE'], /pinepine loa/);
assert.equal(new Set(['AVERAGE', 'MEDIAN', 'MODE', 'STD_DEV'].map(
  key => hawaiian[`blockly-MATH_ONLIST_OPERATOR_${key}`])).size, 4);
assert.match(hawaiian['blockly-MATH_IS_PRIME'], /helu kumu/);
assert.match(hawaiian['blockly-MATH_IS_EVEN'], /kaulike/);
assert.match(hawaiian['blockly-MATH_IS_ODD'], /kauʻewa/);
assert.match(hawaiian['blockly-MATH_IS_DIVISIBLE_BY'], /koena ʻole/);
assert.match(hawaiian['blockly-PROCEDURES_DEFNORETURN_TOOLTIP'], /hopena puka ʻole/);
assert.doesNotMatch(hawaiian['blockly-PROCEDURES_DEFRETURN_TOOLTIP'], /ʻole/);
assert.match(hawaiian['blockly-PROCEDURES_CALLRETURN_TOOLTIP'], /hoʻohana i kona hopena/);
assert.doesNotMatch(hawaiian['blockly-PROCEDURES_CALLNORETURN_TOOLTIP'], /kona hopena/);
assert.match(hawaiian['blockly-PROCEDURES_CALL_DISABLED_DEF_WARNING'], /^ʻAʻole hiki.*hoʻopau ʻia/);
assert.match(hawaiian['blockly-PROCEDURES_IFRETURN_WARNING'], /loko wale nō/);
assert.match(hawaiian['blockly-SCREENREADER_MODE_DISABLED'], /Ua pio.*e hoʻā ai/);
assert.match(hawaiian['blockly-SCREENREADER_MODE_ENABLED'], /Ua ʻā.*e hoʻopau ai/);
for (const [direction, word] of Object.entries({ DOWN: 'lalo', UP: 'luna', LEFT: 'hema', RIGHT: 'ʻākau' })) {
  for (const action of ['MOVE', 'SCROLL']) assert.ok(
    hawaiian[`blockly-SHORTCUTS_${action}_${direction}`].includes(word), `${action} ${direction}`);
}
assert.equal(hawaiian['blockly-PROCEDURES_CREATE_DO'].replace('%1', 'hanaHou'), "Hana iā 'hanaHou'");
assert.equal(hawaiian['blockly-RENAME_VARIABLE'].replace('%1', 'x'), "Hoʻololi i ka inoa o ka mea loli 'x'");
console.log('hawaiianTranslationProgress: math, functions and screen-reader controls passed');

// Current coverage includes post-milestone keys and the pending queue.
const currentFill = spawnSync(process.execPath, [
  path.join(root, 'releases/translations/fill-translations.mjs'), '--list', 'haw',
], { cwd: root, encoding: 'utf8' });
assert.equal(currentFill.status, 0, currentFill.stderr);
assert.deepEqual(JSON.parse(currentFill.stdout), {}, 'Hawaiian current fill stays complete');
const keyboardLegends = {
  ALT_KEY: 'Alt', BACKSPACE_KEY: 'Backspace', CAPS_LOCK_KEY: 'Caps Lock',
  COMMAND_KEY: 'Command', CONTROL_KEY: 'Control', END_KEY: 'End',
  ENTER_KEY: 'Enter', ESCAPE: 'Escape', HOME_KEY: 'Home', INSERT_KEY: 'Insert',
  OPTION_KEY: 'Option', PAGE_DOWN_KEY: 'Page Down', PAGE_UP_KEY: 'Page Up',
  PAUSE_KEY: 'Pause', SHIFT_KEY: 'Shift', SPACE_KEY: 'Space', TAB_KEY: 'Tab',
};
const otherNotation = {
  CHROME_OS: 'ChromeOS', LINUX: 'Linux', MAC_OS: 'macOS', WINDOWS: 'Windows',
  DIALOG_OK: 'OK', LISTS_GET_INDEX_FROM_START: '#', LOGIC_NULL: 'null',
};
const blocklyInvariants = new Map([...mathNotation,
  ...Object.entries({ ...keyboardLegends, ...otherNotation })
    .map(([key, value]) => [`blockly-${key}`, value]),
]);
for (const [key, value] of Object.entries(english)) {
  if (!key.startsWith('blockly-') || !value || /(?:HELPURL|HUE)$/.test(key)) continue;
  if (blocklyInvariants.has(key)) {
    assert.equal(value, blocklyInvariants.get(key), `${key}: changed source requires review`);
    assert.equal(hawaiian[key], value);
  } else {
    assert.notEqual(hawaiian[key], value, `${key}: all Blockly prose, including short labels`);
  }
}
assert.equal(hawaiian['blockly-ANNOUNCE_MOVE_OF'], '%1 o %2');
assert.match(hawaiian['blockly-TEXT_CHANGECASE_TOOLTIP'], /kope/);
assert.match(hawaiian['blockly-TEXT_TRIM_TOOLTIP'], /kope/);
assert.match(hawaiian['blockly-TEXT_LENGTH_TOOLTIP'], /me nā hakahaka pū/);
assert.match(hawaiian['blockly-TEXT_REPLACE_TOOLTIP'], /nā wahi a pau/);
assert.match(hawaiian['blockly-TEXT_INDEXOF_TOOLTIP'], /%1 inā ʻaʻole i loaʻa/);
for (const key of ['TEXT_CHARAT_FROM_END', 'TEXT_GET_SUBSTRING_START_FROM_END', 'TEXT_GET_SUBSTRING_END_FROM_END']) {
  assert.match(hawaiian[`blockly-${key}`], /mai ka hope/);
}
for (const [key, word] of [['LEFT', 'hema'], ['RIGHT', 'ʻākau'], ['BOTH', 'ʻelua']]) {
  assert.ok(hawaiian[`blockly-TEXT_TRIM_OPERATOR_${key}`].includes(word));
}
for (const literal of ['Enter', 'Shift+Enter', 'Escape']) {
  assert.ok(hawaiian['blockly-WORKSPACE_SEARCH_INPUT_LABEL'].includes(literal));
}
assert.equal(hawaiian['blockly-WORKSPACE_CONTENTS_BLOCKS_ONE'].replace('%2',
  hawaiian['blockly-WORKSPACE_CONTENTS_COMMENTS_ONE']),
  'Hoʻokahi ahu palaka a me hoʻokahi manaʻo ma ke kahua hana.');
assert.equal(hawaiian['blockly-WORKSPACE_SEARCH_MATCH'].replace('%1', '2').replace('%2', '5').replace('%3', 'Kāleka'),
  'Mea like 2 o 5: Kāleka');
assert.match(hawaiian['scrum-report-help'], /ʻaʻole lākou he mau kuhi 0/);
for (const key of ['scrum-daily-observations-help', 'scrum-daily-observations-export-help']) {
  assert.match(hawaiian[key], /UTC/);
  assert.match(hawaiian[key], /ʻAʻole he 0 nā kuhi/);
  assert.match(hawaiian[key], /lā i loaʻa ʻole/);
}
assert.match(hawaiian['scrum-daily-truncated'], /366/);
assert.match(hawaiian['scrum-partial-report'], /komo wale nō nā kāleka i hāʻawi ʻia iā ʻoe/);
assert.match(hawaiian['scrum-import-card-on-another-board'], /waiho hoʻololi ʻole ʻia/);
assert.match(hawaiian['sync-conflict-hint'], /ʻAʻohe mea e hoʻouna ʻia i ka ʻōnaehana kumu/);
assert.match(hawaiian['sync-conflict-review-complete'], /ʻAʻole i holo.*holoʻokoʻa/);
assert.match(hawaiian['sync-conflict-archive-hint'], /ʻAʻole hoʻololi ʻia nā kāleka keiki/);
for (const key of ['sync-estimate-field-hint', 'sync-time-estimate-hint']) {
  assert.match(hawaiian[key], /waiwai kumu i loaʻa ʻole/);
  assert.match(hawaiian[key], /null/);
}
assert.match(hawaiian['sync-planning-hint'], /ʻaʻole loa wehe ka hoʻolikelike mua/);
assert.match(hawaiian['activity-recovery-cancel-confirm'], /ʻAʻole hiki ke hoʻomau hou ʻia/);
assert.match(hawaiian['activity-recovery-cancel-confirm'], /ʻAʻole hoʻihoʻi ʻia nā leka uila/);
assert.match(hawaiian['activity-recovery-source-unavailable'], /ʻAʻohe mea i hana hou ʻia/);
assert.match(hawaiian['stuck-sync-operation-discard-confirm'], /Noho nā hoʻololi.*ʻaʻole kākau ʻia ke koena/);
assert.match(hawaiian['stuck-sync-operation-replayable'], /ʻaʻole i hoʻolei ʻia/);
assert.match(hawaiian['interrupted-import-description'], /ʻAʻole hiki ke hoʻomau.*ʻaʻole mālama ʻia kona faila kumu/);
assert.match(hawaiian['interrupted-import-description'], /nā mea i hoʻohui ʻia ma hope pū/);
assert.match(hawaiian['interrupted-import-keep-confirm'], /ʻAʻohe mea e wehe ʻia/);
assert.match(hawaiian['interrupted-import-discard-confirm'], /Wehe paʻa ʻia/);
assert.match(hawaiian['interrupted-import-foreign-board'], /ʻaʻole i hoʻopā ʻia/);
assert.match(hawaiian['scrum-history-checkpoint-hint'], /ʻaʻohe mea ʻē aʻe i hoʻololi/);
assert.match(hawaiian['scrum-history-checkpoint-hint'], /ʻaʻole hoʻololi i kekahi moʻolelo/);
assert.match(hawaiian['login-setting-env-only'], /kikowaena wale nō.*heluhelu wale nō/);
console.log('hawaiianTranslationProgress: current fill, composed text, planning and recovery passed');
