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

const nextImportGuideKeys = ["import-board-instruction-superproductivity", "import-board-instruction-taiga", "import-board-instruction-vikunja", "import-board-instruction-quire", "import-board-instruction-wrike", "import-board-instruction-teamwork", "import-board-instruction-businessmap", "import-board-instruction-redmine", "import-board-instruction-notion", "import-board-instruction-plane"];
for (const key of nextImportGuideKeys) {
  assert.notEqual(latin[key], english[key], key);
  assert.deepEqual(tokens(latin[key]), tokens(english[key]), key);
}
for (const format of ['taiga', 'vikunja']) assert.match(latin[`import-board-instruction-${format}`], /Adiuncta non importantur/);
assert.match(latin['import-board-instruction-quire'], /Commentaria et adiuncta.*non sunt/);
assert.match(latin['import-board-instruction-notion'], /prima columna.*relatio importationis.*Relationes, imagines et adiuncta non importantur/);
assert.match(latin['import-board-instruction-plane'], /descriptiones aut adiuncta non continet.*non importantur/);
for (const marker of ['-', '#', '>', '--', '##', '>>']) assert.ok(latin['import-board-instruction-teamwork'].includes(marker));
assert.match(latin['import-board-instruction-businessmap'], /nominibus Anglicis.*ordine capitum.*in Anglicum muta/);
assert.match(latin['import-board-instruction-redmine'], /ante exportationem in My account linguam Anglicam elige/);
assert.match(latin['import-board-instruction-taiga'], /[.]json[.]gz decomprime/);
assert.match(latin['import-board-instruction-superproductivity'], /opera in tabulario posita fiunt chartae in tabulario positae/);

const mappingKeys = ["import-members-mode-heading", "import-members-mode-map", "import-members-mode-placeholder", "import-members-mode-me", "csv-mapping-title", "csv-mapping-description", "csv-mapping-not-in-file", "csv-mapping-column-number", "csv-mapping-list-missing", "csv-mapping-list-name", "csv-mapping-custom-fields", "csv-mapping-boards", "csv-mapping-skipped-sheets", "csv-mapping-title-required", "csv-mapping-list-required", "invalid-import-mapping", "import-many-boards", "import-many-boards-hint", "import-one-board-per-project", "import-one-board-per-project-hint", "import-many-progress", "import-many-results-heading", "import-many-imported", "export-all-boards", "export-selected-boards", "export-all-boards-hint", "exportAllBoardsPopup-title", "exportToTrelloPopup-title", "trello-export-desc", "trello-export-include-attachments", "trello-export-start", "trello-export-open-board", "trello-export-warnings", "sandstorm-trello-access-needed", "sandstorm-allow-trello-access"];
for (const key of mappingKeys) {
  assert.notEqual(latin[key], english[key], key);
  assert.deepEqual(tokens(latin[key]), tokens(english[key]), key);
}
assert.equal(latin['export-all-boards'], latin['exportAllBoardsPopup-title']);
assert.equal(latin['trello-export-start'], latin['exportToTrelloPopup-title']);
assert.ok(latin['csv-mapping-description'].includes(latin['csv-mapping-not-in-file']));
assert.match(latin['import-members-mode-placeholder'], /propriis nominibus.*postea cum veris usoribus/);
assert.match(latin['import-many-boards-hint'], /sine coniunctione membrorum.*ipse una exportatio.*una tabula.*loco campi superioris/);
assert.match(latin['import-one-board-per-project-hint'], /necessitudines inter illas tabulas.*relatione importationis/);
assert.match(latin['export-all-boards-hint'], /quas exportare potes.*unus liber.*ceterae formae.*[.]zip/);
assert.match(latin['trello-export-desc'], /Swimlane: ….*rursus in semitas/);
assert.match(latin['sandstorm-trello-access-needed'], /nullum proprium accessum.*Primum permitte/);

const notificationKeys = ["sandstorm-trello-access-granted", "sandstorm-forget-access", "sandstorm-trello-save-label", "external-link-rules", "external-link-rules-description", "external-link-identifier-aliases", "webhook-payload-heading", "webhook-payload-description", "webhook-payload-text", "webhook-payload-fields", "webhook-payload-field-standard", "webhook-payload-field-ids", "webhook-payload-field-names", "webhook-payload-field-links", "webhook-payload-field-actor", "webhook-payload-field-people", "webhook-payload-field-details", "webhook-hide-identity", "webhook-someone", "notification-delivery-layout-classic", "notification-delivery-layout-clear", "notification-delivery-parts", "notification-delivery-part-board", "notification-delivery-part-actor", "notification-delivery-part-card", "notification-delivery-part-details", "notification-delivery-part-dates", "notification-delivery-part-link", "notification-delivery-grouping", "notification-delivery-grouping-all", "notification-delivery-grouping-board", "notification-delivery-grouping-card", "notification-delivery-grouping-none", "notification-delivery-schedule", "notification-delivery-schedule-immediate", "notification-delivery-schedule-interval", "notification-delivery-schedule-daily", "notification-delivery-interval", "notification-delivery-minutes", "notification-delivery-quiet", "notification-delivery-quiet-clear", "notification-delivery-timezone", "notification-delivery-invalid", "notification-group-card", "notification-group-board", "read-only-field"];
for (const key of notificationKeys) {
  assert.notEqual(latin[key], english[key], key);
  assert.deepEqual(tokens(latin[key]), tokens(english[key]), key);
}
assert.match(latin['webhook-payload-description'], /optionem hereditatam servat.*si nihil definitum est.*semper miserunt/);
assert.ok(latin['webhook-payload-field-standard'].includes('WEBHOOKS_ATTRIBUTES'));
assert.match(latin['webhook-hide-identity'], /Nomen meum.*omitte/);
assert.match(latin['notification-delivery-grouping-all'], /Omnia mittenda in uno nuntio/);
assert.notEqual(latin['notification-delivery-grouping-board'], latin['notification-delivery-grouping-card']);
assert.match(latin['notification-delivery-quiet'], /exspecta donec finiantur/);
assert.match(latin['read-only-field'], /omne membrum.*soli administratores tabulae.*mutant/);
for (const key of ['external-link-rules-description', 'external-link-identifier-aliases']) {
  const braces = text => (text.match(/[{](?:number|identifier)[}]/g) || []).sort();
  assert.deepEqual(braces(latin[key]), braces(english[key]));
}
assert.ok(latin['external-link-rules-description'].includes('[{identifier}:{number}] = https://tracker.example.com/{identifier}/{number}'));
assert.ok(latin['external-link-identifier-aliases'].includes('TK=Task, IN=Incident'));

const workflowScrumKeys = ["r-wrike-workflow", "r-wrike-workflow-note", "r-export-wrike-workflow", "r-import-wrike-workflow", "r-import-wrike-workflow-done", "r-moved-forward", "r-moved-back", "r-add-actinguser-assignee", "r-remove-all-assignees", "ldap-sync-now", "ldap-sync-now-done", "ldap-sync-now-error", "ldap-sync-now-nothing", "oauth-providers-allowed-email-domains", "import-file-label", "subtask-mark-done", "subtask-mark-not-done", "subtask-done-no-permission", "scrum-release-scope", "scrum-releases-select-help", "scrum-import-into-board", "scrum-import-into-board-hint", "scrum-import-choose-file", "scrum-import-invalid-file", "scrum-import-preview-sprints", "scrum-import-preview-releases", "scrum-import-preview-cards", "scrum-import-preview-nothing", "scrum-import-into-board-done", "scrum-import-card-not-matched", "scrum-import-card-ambiguous", "scrum-import-card-on-another-board", "scrum-import-record-ambiguous", "scrum-import-record-not-imported", "scrum-import-sprint-finished"];
for (const key of workflowScrumKeys) {
  assert.notEqual(latin[key], english[key], key);
  assert.deepEqual(tokens(latin[key]), tokens(english[key]), key);
}
for (const literal of ['Active', 'Completed', 'Deferred', 'Cancelled', 'GET /workflows']) assert.ok(latin['r-wrike-workflow-note'].includes(literal));
assert.match(latin['r-wrike-workflow-note'], /exportari non possunt/);
for (const name of ['LDAP_BACKGROUND_SYNC_IMPORT_NEW_USERS', 'LDAP_BACKGROUND_SYNC_KEEP_EXISTANT_USERS_UPDATED']) assert.ok(latin['ldap-sync-now-nothing'].includes(name));
assert.match(latin['oauth-providers-allowed-email-domains'], /commatibus separatis.*si vacuum est, omnibus licet/);
assert.notEqual(latin['subtask-mark-done'], latin['subtask-mark-not-done']);
assert.match(latin['scrum-import-into-board-hint'], /numquam duplicantur.*per ID.*numerum chartae et titulum.*immutatae relinquuntur.*Primum praevisionem/);
assert.match(latin['scrum-import-card-on-another-board'], /aliam tabulam.*immutata/);
assert.match(latin['scrum-import-sprint-finished'], /perfectum non mota/);
assert.match(latin['scrum-releases-select-help'], /Ctrl.*Cmd.*omnes electiones tolle.*omnibus editionibus/);
assert.equal(latin['scrum-import-preview'], 'Praevisio');
assert.equal(latin.history, 'Historia');
