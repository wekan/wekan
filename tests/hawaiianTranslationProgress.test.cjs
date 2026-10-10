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
  assert.deepEqual(tokens(value), tokens(english[key]),
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
