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
const latin = readLocale('la');
const tokens = value => [...value.matchAll(
  /__[A-Za-z0-9_]+__|%[0-9$]*[A-Za-z]|%{[A-Za-z0-9]+}|{{[A-Za-z0-9]+}}/g,
)].map(([token]) => token).sort();
const tags = value => [...value.matchAll(/<\/?[A-Za-z][^>]*>/g)]
  .map(([tag]) => tag).sort();

const fillResult = spawnSync(process.execPath, [
  path.join(root, 'releases/translations/fill-translations.mjs'),
  '--completed-catalog', '--list',
  'la',
], { cwd: root, encoding: 'utf8' });
assert.equal(fillResult.status, 0, fillResult.stderr);
assert.equal(Object.keys(JSON.parse(fillResult.stdout)).length, 0,
  'every actionable Latin value stays translated');

assert.deepEqual(Object.keys(latin), Object.keys(english),
  'Latin key order follows the English source');
for (const [key, value] of Object.entries(latin)) {
  assert.deepEqual(tokens(value), tokens(english[key]),
    `${key}: locale-wide placeholder inventory`);
  assert.deepEqual(tags(value), tags(english[key]),
    `${key}: locale-wide HTML tag inventory`);
}

assert.equal(latin.board, 'Tabula');
assert.equal(latin.card, 'Charta');
assert.equal(latin.list, 'Index');
assert.equal(latin.save, 'Serva');
assert.equal(latin.search, 'Quaere');
assert.deepEqual(tokens(latin['activity-changedTitle']), ['%s', '%s']);
assert.deepEqual(tokens(latin['act-deleteCard']),
  ['__board__', '__card__', '__list__', '__swimlane__']);
assert.deepEqual(tokens(latin['restore-list-swimlanes-done']),
  ['__remaining__', '__restored__']);

console.log('latinTranslationProgress: historical catalog and reviewed additions passed');

const cardLinkKeys = ["attach-card", "attachCardPopup-title", "attach-card-hint", "attached-card-unavailable", "detach-card", "attach-card-self", "attach-card-limit", "attach-card-not-found", "board-announcement", "board-announcement-enabled", "board-view-calendar-mode", "custom-field-links", "custom-field-links-hint", "custom-field-links-none", "custom-field-link-unavailable", "custom-field-link-fields", "custom-field-link-no-fields", "custom-field-link-inactive", "custom-field-unlink", "custom-field-link-target", "custom-field-link-direction", "custom-field-link-both", "custom-field-link-send", "custom-field-link-sends", "custom-field-link-receives", "custom-field-link-add", "field-link-self", "field-link-limit", "field-link-archived", "field-link-invalid", "field-link-not-found", "field-link-not-allowed", "cardCustomFieldLinksPopup-title", "cards-use-list-color"];
for (const key of cardLinkKeys) {
  assert.notEqual(latin[key], english[key], key);
  assert.deepEqual(tokens(latin[key]), tokens(english[key]), key);
}
assert.equal(latin['attach-card'], latin['attachCardPopup-title']);
assert.match(latin['custom-field-links-hint'], /eiusdem nominis et generis.*una tantum charta.*non mutantur/);
assert.match(latin['custom-field-link-both'], /In utramque partem/);
assert.match(latin['custom-field-link-send'], /In unam partem.*ad chartam principalem/);
assert.notEqual(latin['custom-field-link-sends'], latin['custom-field-link-receives']);
assert.match(latin['custom-field-link-inactive'], /recensere iam non potest.*aut charta in tabulario/);
assert.match(latin['field-link-not-allowed'], /Utramque chartam/);
assert.match(latin['field-link-self'], /sibi ipsi.*non potest/);
for (const key of ['link-card', 'linkCardPopup-title']) assert.doesNotMatch(latin[key], /^Latine:/);

const importGuideKeys = ["import-board-instruction-opml", "import-board-instruction-orgmode", "import-board-instruction-meistertask", "import-board-instruction-obsidian", "import-board-instruction-linear", "import-board-instruction-ticktick", "import-board-instruction-clickup", "import-board-instruction-nullboard", "import-board-instruction-kanri", "import-board-instruction-pivotal", "import-board-instruction-tasksorg", "import-board-instruction-monday", "import-board-instruction-trello"];
for (const key of importGuideKeys) {
  assert.notEqual(latin[key], english[key], key);
  assert.deepEqual(tokens(latin[key]), tokens(english[key]), key);
  assert.doesNotMatch(latin[key], /^Latine:/);
}
assert.match(latin['import-board-instruction-opml'], /summi gradus.*indices.*subiecta.*chartae.*inferiorum graduum.*indices probationis/);
for (const name of ['TODO', 'DONE', 'SCHEDULED', 'DEADLINE', 'CLOSED']) assert.ok(latin['import-board-instruction-orgmode'].includes(name));
for (const format of ['meistertask', 'tasksorg']) assert.match(latin[`import-board-instruction-${format}`], /perfecta diem perfectionis servant/);
for (const format of ['nullboard', 'kanri']) assert.match(latin[`import-board-instruction-${format}`], /prima tabula importatur/);
assert.match(latin['import-board-instruction-nullboard'], /prima linea.*titulus.*cetera descriptio.*titellum raw/);
assert.match(latin['import-board-instruction-clickup'], /omnibus columnis.*indices ClickUp fiunt semitae/);
assert.match(latin['import-board-instruction-monday'], /aliae columnae fiunt campi proprii.*renovationes fiunt commentaria/);
for (const name of ['Menu', 'More', 'Print and Export', 'Export JSON']) assert.ok(latin['import-board-instruction-trello'].includes(name));
