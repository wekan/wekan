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
const corsican = readLocale('co');
const tokens = value => [...value.matchAll(
  /__[A-Za-z0-9_]+__|%[A-Za-z]|%{[A-Za-z0-9]+}|{{[A-Za-z0-9]+}}/g,
)].map(([token]) => token).sort();
const tags = value => [...value.matchAll(/<\/?[A-Za-z][^>]*>/g)]
  .map(([tag]) => tag).sort();

const fillResult = spawnSync(process.execPath, [
  path.join(root, 'releases/translations/fill-translations.mjs'),
  '--completed-catalog', '--list',
  'co',
], { cwd: root, encoding: 'utf8' });
assert.equal(fillResult.status, 0, fillResult.stderr);
assert.equal(Object.keys(JSON.parse(fillResult.stdout)).length, 0,
  'every actionable Corsican value stays translated');

assert.deepEqual(Object.keys(corsican), Object.keys(english),
  'Corsican key inventory and order match English');
for (const [key, value] of Object.entries(corsican)) {
  assert.deepEqual(tokens(value), tokens(english[key]),
    `${key}: locale-wide placeholder inventory`);
  assert.deepEqual(tags(value), tags(english[key]),
    `${key}: locale-wide HTML tag inventory`);
}

assert.equal(corsican.add, 'Aghjunghje');
assert.equal(corsican.board, 'Tavula');
assert.equal(corsican.card, 'Carta');
assert.equal(corsican.delete, 'Squassà');
assert.equal(corsican.save, 'Arregistrà');
assert.match(corsican['board-members-same-org-only'], /urganizazione/i);
assert.deepEqual(tokens(corsican['act-deleteCard']),
  ['__board__', '__card__', '__list__', '__swimlane__']);
assert.deepEqual(tokens(corsican['activity-changedTitle']), ['%s', '%s']);



// Newer linked-card features are outside the historical completed-catalog gate.
const cardLinkKeys = Object.keys(english).filter(key => /^(?:attach-card(?:-|$)|attachCardPopup-title$|attached-card-unavailable$|detach-card$|custom-field-link|custom-field-unlink$|field-link-|cardCustomFieldLinksPopup-title$)/.test(key));
assert.equal(cardLinkKeys.length, 30);
for (const key of cardLinkKeys) {
  assert.notEqual(corsican[key], english[key], `${key}: no English fallback`);
  assert.deepEqual(tokens(corsican[key]), tokens(english[key]), key);
}
assert.match(corsican['custom-field-links-hint'], /listessu nome è tippu/);
assert.match(corsican['custom-field-links-hint'], /una sola carta fermanu senza cambiamentu/);
assert.match(corsican['custom-field-link-both'], /duie direzzioni/);
assert.match(corsican['custom-field-link-send'], /una sola direzzione.*carta principale/);
assert.match(corsican['custom-field-link-sends'], /sta carta.*quella carta/);
assert.match(corsican['custom-field-link-receives'], /quella carta.*sta carta/);
assert.match(corsican['field-link-not-allowed'], /mudificà e duie carte/);
assert.doesNotMatch(corsican['field-link-not-allowed'], /vede e duie carte/);
assert.match(corsican['custom-field-link-inactive'], /ùn pò più mudificà.*archiviata/);
assert.match(corsican['attach-card-not-found'], /nisuna carta chì pudete vede/);
assert.match(corsican['field-link-self'], /ùn pò micca.*ella stessa/);
assert.match(corsican['field-link-archived'], /archiviata ùn pò micca/);



const recoveryKeys = Object.keys(english).filter(key => /^(stuck-sync-operation-|interrupted-import-)/.test(key));
assert.equal(recoveryKeys.length, 48);
for (const key of recoveryKeys) {
  assert.notEqual(corsican[key], english[key], `${key}: recovery message translated`);
  assert.deepEqual(tokens(corsican[key]), tokens(english[key]), key);
}
assert.match(corsican['stuck-sync-operation-description'], /cambiamenti digià appiicati fermanu/);
assert.match(corsican['stuck-sync-operation-description'], /ùn seranu mai scritti/);
assert.match(corsican['stuck-sync-operation-description'], /paragunerà torna a lista cù a so fonte/);
assert.match(corsican['stuck-sync-operation-replayable'], /ùn hè micca stata abbandunata/);
assert.match(corsican['stuck-sync-operation-not-stuck'], /ùn pò micca esse abbandunata/);
assert.match(corsican['interrupted-import-description'], /schedariu fonte ùn hè micca cunservatu/);
assert.match(corsican['interrupted-import-description'], /ancu ciò chì ci hè statu aghjuntu dopu/);
assert.match(corsican['interrupted-import-keep-confirm'], /Nunda hè squassatu/);
assert.doesNotMatch(corsican['interrupted-import-keep-confirm'], /squassati definitivamente/);
assert.match(corsican['interrupted-import-discard-confirm'], /tuttu ciò ch'ella cuntene sò squassati definitivamente/);
assert.match(corsican['interrupted-import-foreign-board'], /ùn hè micca stata mudificata/);



const notificationKeys = Object.keys(english).filter(key => /^(webhook-payload-|webhook-hide-identity$|webhook-someone$|notification-delivery-|notification-group-)/.test(key));
assert.ok(notificationKeys.length >= 39);
for (const key of notificationKeys) {
  assert.notEqual(corsican[key], english[key], `${key}: notification message translated`);
  assert.deepEqual(tokens(corsican[key]), tokens(english[key]), key);
}
assert.match(corsican['webhook-payload-description'], /paràmetru ereditatu/);
assert.match(corsican['webhook-payload-description'], /s'ellu ùn hè definitu nunda.*sempre mandatu/);
assert.match(corsican['webhook-payload-field-standard'], /WEBHOOKS_ATTRIBUTES/);
assert.match(corsican['webhook-hide-identity'], /Ùn mette micca u mo nome/);
assert.match(corsican['notification-delivery-quiet'], /aspittà ch'elle finiscanu/);
assert.doesNotMatch(corsican['notification-delivery-quiet'], /squassà|abbandunà/);
assert.match(corsican['notification-delivery-grouping-all'], /un solu messagiu/);
assert.match(corsican['notification-delivery-grouping-none'], /separatamente/);
assert.match(corsican['notification-delivery-schedule-daily'], /Una volta à ghjornu/);

console.log('corsicanTranslationProgress: historical catalog and translated feature checks passed');

const controlKeys = ["board-announcement", "board-announcement-enabled", "board-view-calendar-mode", "cards-use-list-color", "import-members-mode-heading", "import-members-mode-map", "import-members-mode-placeholder", "import-members-mode-me", "csv-mapping-title", "csv-mapping-description", "csv-mapping-not-in-file", "csv-mapping-column-number", "csv-mapping-list-missing", "csv-mapping-list-name", "csv-mapping-custom-fields", "csv-mapping-boards", "csv-mapping-skipped-sheets", "csv-mapping-title-required", "csv-mapping-list-required", "invalid-import-mapping", "import-many-boards", "import-many-boards-hint", "import-one-board-per-project", "import-one-board-per-project-hint", "import-many-progress", "import-many-results-heading", "import-many-imported", "export-all-boards", "export-selected-boards", "export-all-boards-hint", "exportAllBoardsPopup-title", "exportToTrelloPopup-title", "trello-export-desc", "trello-export-include-attachments", "trello-export-start", "trello-export-open-board", "trello-export-warnings", "sandstorm-trello-access-needed", "sandstorm-allow-trello-access", "sandstorm-trello-access-granted", "sandstorm-forget-access", "sandstorm-trello-save-label", "external-link-rules", "external-link-rules-description", "external-link-identifier-aliases", "read-only-field", "r-wrike-workflow", "r-wrike-workflow-note", "r-export-wrike-workflow", "r-import-wrike-workflow", "r-import-wrike-workflow-done", "r-moved-forward", "r-moved-back", "r-add-actinguser-assignee", "r-remove-all-assignees", "ldap-sync-now", "ldap-sync-now-done", "ldap-sync-now-error", "ldap-sync-now-nothing", "oauth-providers-allowed-email-domains", "import-file-label", "subtask-mark-done", "subtask-mark-not-done", "subtask-done-no-permission", "login-setting-env-only"];
for (const key of controlKeys) {
  assert.notEqual(corsican[key], english[key], key);
  assert.deepEqual(tokens(corsican[key]), tokens(english[key]), key);
}
for (const literal of ['{number}', '{identifier}', '[{identifier}:{number}] = https://tracker.example.com/{identifier}/{number}']) assert.ok(corsican['external-link-rules-description'].includes(literal));
for (const literal of ['Active', 'Completed', 'Deferred', 'Cancelled', 'GET /workflows', 'JSON']) assert.ok(corsican['r-wrike-workflow-note'].includes(literal));
for (const literal of ['LDAP_BACKGROUND_SYNC_IMPORT_NEW_USERS', 'LDAP_BACKGROUND_SYNC_KEEP_EXISTANT_USERS_UPDATED']) assert.ok(corsican['ldap-sync-now-nothing'].includes(literal));
assert.match(corsican['trello-export-desc'], /Swimlane: …/);
assert.match(corsican['import-members-mode-placeholder'], /utilizatori pruvisori cù i so nomi.*utilizatori veri più tardi/);
assert.match(corsican['csv-mapping-description'], /curregite quelle sbagliate.*micca in u schedariu/);
assert.match(corsican['import-many-boards-hint'], /senza associu di i membri/);
assert.match(corsican['import-many-boards-hint'], /una sola espurtazione.*una sola tavula/);
assert.match(corsican['export-all-boards-hint'], /chì pudete espurtà.*Excel.*fogliu.*altru furmatu.*\.zip/);
assert.match(corsican['sandstorm-trello-access-needed'], /ùn hà micca accessu propiu.*prima/);
assert.match(corsican['trello-export-warnings'], /Ùn hè statu pussibule/);
assert.match(corsican['r-wrike-workflow-note'], /compia.*Completed o Cancelled.*micca compia.*Active o Deferred/);
assert.match(corsican['r-wrike-workflow-note'], /ùn ponu micca esse espurtate/);
assert.match(corsican['read-only-field'], /ogni membru vede.*solu l'amministratori/);
assert.match(corsican['login-setting-env-only'], /Solu l'ambiente di u servore.*sola lettura/);
assert.match(corsican['oauth-providers-allowed-email-domains'], /virgule; viotu permette tutti/);
assert.match(corsican['subtask-mark-not-done'], /micca compiu/);
assert.doesNotMatch(corsican['subtask-mark-done'], /micca/);
assert.match(corsican['subtask-done-no-permission'], /Ùn pudete micca cambià/);
