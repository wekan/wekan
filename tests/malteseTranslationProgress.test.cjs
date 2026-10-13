// Check the current full filtered inventory, including newer feature strings.
// An empty fill report is not a semantic or fluent-language certification.
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
const maltese = readLocale('mt');
const tokens = value => [...value.matchAll(
  /__[A-Za-z0-9_]+__|%[A-Za-z]|%{[A-Za-z0-9]+}|{{[A-Za-z0-9]+}}/g,
)].map(([token]) => token).sort();
const tags = value => [...value.matchAll(/<\/?[A-Za-z][^>]*>/g)]
  .map(([tag]) => tag).sort();

const fillResult = spawnSync(process.execPath, [
  path.join(root, 'releases/translations/fill-translations.mjs'),
  '--list',
  'mt',
], { cwd: root, encoding: 'utf8' });
assert.equal(fillResult.status, 0, fillResult.stderr);
assert.equal(Object.keys(JSON.parse(fillResult.stdout)).length, 0,
  'every actionable Maltese value stays translated');

for (const [key, value] of Object.entries(maltese)) {
  if (value !== english[key]) {
    assert.deepEqual(tokens(value), tokens(english[key]),
      `${key}: locale-wide placeholder inventory`);
  }
  assert.deepEqual(tags(value), tags(english[key]),
    `${key}: locale-wide HTML tag inventory`);
}

assert.equal(maltese.accept, 'Aċċetta');
assert.equal(maltese.actions, 'Azzjonijiet');
assert.equal(maltese['allboards.workspaces'], 'Spazji tax-xogħol');
assert.equal(maltese['color-black'], 'iswed');
assert.equal(maltese['color-red'], 'aħmar');
assert.equal(maltese['color-white'], 'abjad');
assert.deepEqual(tokens(maltese['activity-changedTitle']), ['%s', '%s']);
assert.deepEqual(tokens(maltese['act-deleteCard']),
  ['__board__', '__card__', '__list__', '__swimlane__']);

console.log('malteseTranslationProgress: current fill inventory and locale-wide token checks passed');

for (const key of Object.keys(english).filter(k => /^(csv-mapping-|import-members-mode-|invalid-import-mapping$)/.test(k))) {
  assert.notEqual(maltese[key], english[key], key);
  assert.deepEqual(tokens(maltese[key]), tokens(english[key]), key);
}
assert.match(maltese['import-members-mode-placeholder'], /bl-ismijiet tagħhom stess.*utenti reali aktar tard/);
assert.match(maltese['import-members-mode-map'], /utent eżistenti għal kull/);
assert.match(maltese['import-members-mode-me'], /kollha jirrappreżentaw lili/);
assert.match(maltese['csv-mapping-list-missing'], /lista waħda.*kull karta/);
assert.match(maltese['csv-mapping-list-required'], /jew agħżel il-kolonna/);
assert.match(maltese['csv-mapping-skipped-sheets'], /ma jiġux importati/);
assert.match(maltese['invalid-import-mapping'], /ma jaqbilx mal-fajl/);

for (const key of Object.keys(english).filter(k => /^(scrum-import-|scrum-release-scope$|scrum-releases-select-help$|subtask-mark-|subtask-done-no-permission$)/.test(k))) {
  assert.notEqual(maltese[key], english[key], key);
  assert.deepEqual(tokens(maltese[key]), tokens(english[key]), key);
}
assert.match(maltese['scrum-import-into-board-hint'], /jintrabtu, qatt ma jiġu duplikati/);
assert.match(maltese['scrum-import-into-board-hint'], /bl-ID, jew bin-numru u t-titlu/);
assert.match(maltese['scrum-import-into-board-hint'], /ma jaqblux.*jitħallew mhux mibdula/);
assert.match(maltese['scrum-import-card-ambiguous'], /aktar minn karta waħda/);
assert.match(maltese['scrum-import-card-on-another-board'], /bord ieħor.*mhux mibdula/);
assert.match(maltese['scrum-import-sprint-finished'], /ma ġietx imċaqalqa.*ntemm/);
assert.match(maltese['scrum-releases-select-help'], /Ctrl.*Cmd.*Mac.*kull verżjoni/);
assert.match(maltese['subtask-mark-not-done'], /mhux lest/);
assert.doesNotMatch(maltese['subtask-mark-done'], /mhux lest/);
assert.match(maltese['subtask-done-no-permission'], /Ma tistax tibdel/);

for (const key of Object.keys(english).filter(k => /^(import-many-|import-one-board-per-project|export-all-boards|export-selected-boards$|exportAllBoardsPopup-title$|exportToTrelloPopup-title$|trello-export-|sandstorm-trello-|sandstorm-allow-trello-access$|sandstorm-forget-access$|import-file-label$)/.test(k))) {
  assert.notEqual(maltese[key], english[key], key);
  assert.deepEqual(tokens(maltese[key]), tokens(english[key]), key);
}
assert.match(maltese['import-many-boards-hint'], /mingħajr tqabbil tal-membri/);
assert.match(maltese['import-many-boards-hint'], /esportazzjoni waħda.*bord wieħed/);
assert.match(maltese['import-many-boards-hint'], /minflok it-test fil-kamp/);
assert.match(maltese['import-one-board-per-project-hint'], /dipendenzi.*rapport tal-importazzjoni/);
assert.match(maltese['export-all-boards-hint'], /li tista' tesporta/);
assert.match(maltese['export-all-boards-hint'], /Excel.*folja għal kull bord.*format ieħor.*\.zip.*fajl għal kull bord/);
assert.match(maltese['trello-export-desc'], /Swimlane: …/);
assert.match(maltese['trello-export-desc'], /terġa' tibdel f'korsiji/);
assert.match(maltese['sandstorm-trello-access-needed'], /m'għandux aċċess.*L-ewwel/);
assert.match(maltese['trello-export-warnings'], /Ma setax jiġi esportat kollox/);

for (const key of ['board-announcement', 'board-announcement-enabled', 'board-view-calendar-mode', 'cards-use-list-color', 'external-link-rules', 'external-link-rules-description', 'external-link-identifier-aliases', 'read-only-field', 'r-wrike-workflow', 'r-wrike-workflow-note', 'r-export-wrike-workflow', 'r-import-wrike-workflow', 'r-import-wrike-workflow-done', 'r-moved-forward', 'r-moved-back', 'r-add-actinguser-assignee', 'r-remove-all-assignees', 'ldap-sync-now', 'ldap-sync-now-done', 'ldap-sync-now-error', 'ldap-sync-now-nothing', 'oauth-providers-allowed-email-domains', 'login-setting-env-only']) {
  assert.notEqual(maltese[key], english[key], key);
  assert.deepEqual(tokens(maltese[key]), tokens(english[key]), key);
}
for (const literal of ['{number}', '{identifier}', '[{identifier}:{number}] = https://tracker.example.com/{identifier}/{number}']) assert.ok(maltese['external-link-rules-description'].includes(literal));
for (const literal of ['TK=Task', 'IN=Incident']) assert.ok(maltese['external-link-identifier-aliases'].includes(literal));
for (const literal of ['Active', 'Completed', 'Deferred', 'Cancelled', 'GET /workflows', 'JSON']) assert.ok(maltese['r-wrike-workflow-note'].includes(literal));
assert.match(maltese['r-wrike-workflow-note'], /lesta meta.*Completed jew Cancelled.*mhux lesta.*Active jew Deferred/);
assert.match(maltese['r-wrike-workflow-note'], /ma jistgħux jiġu esportati/);
for (const literal of ['LDAP_BACKGROUND_SYNC_IMPORT_NEW_USERS', 'LDAP_BACKGROUND_SYNC_KEEP_EXISTANT_USERS_UPDATED']) assert.ok(maltese['ldap-sync-now-nothing'].includes(literal));
assert.match(maltese['read-only-field'], /kull membru jara.*amministraturi tal-bord biss jibdluh/);
assert.match(maltese['login-setting-env-only'], /biss mill-ambjent tas-server.*għall-qari biss/);
assert.match(maltese['oauth-providers-allowed-email-domains'], /separati b'virgoli; vojt jippermetti lil kulħadd/);
assert.match(maltese['cards-use-list-color'], /mingħajr kulur tagħhom stess/);

for (const format of ['opml', 'orgmode', 'meistertask', 'obsidian', 'linear', 'ticktick', 'clickup', 'nullboard', 'kanri', 'pivotal', 'tasksorg', 'monday', 'superproductivity', 'taiga', 'vikunja', 'quire', 'wrike', 'teamwork', 'businessmap', 'redmine', 'notion', 'plane']) {
  assert.notEqual(maltese['import-board-instruction-' + format], english['import-board-instruction-' + format]);
}
for (const literal of ['TODO', 'DONE', 'SCHEDULED', 'DEADLINE', 'CLOSED']) assert.ok(maltese['import-board-instruction-orgmode'].includes(literal));
for (const literal of ['Tasklist', 'Task', 'Description', 'Assign to', 'Start date', 'Due date', 'Priority', 'Estimated time', 'Tags', 'Status', '--', '##', '>>']) assert.ok(maltese['import-board-instruction-teamwork'].includes(literal));
for (const format of ['taiga', 'vikunja']) assert.match(maltese['import-board-instruction-' + format], /L-annessi ma jiġux importati/);
assert.match(maltese['import-board-instruction-notion'], /Ir-relazzjonijiet, l-immaġnijiet u l-annessi ma jiġux importati/);
assert.match(maltese['import-board-instruction-quire'], /Il-kummenti u l-annessi mhumiex fis-CSV/);
assert.match(maltese['import-board-instruction-plane'], /m'għandhiex deskrizzjonijiet jew annessi.*ma jiġux importati/);
for (const format of ['nullboard', 'kanri']) assert.match(maltese['import-board-instruction-' + format], /jiġi importat l-ewwel bord/);
assert.match(maltese['import-board-instruction-businessmap'], /l-ewwel semmi mill-ġdid ir-ringiela tal-intestaturi bl-Ingliż/);
assert.match(maltese['import-board-instruction-redmine'], /English f'My account qabel tesporta/);

for (const key of ['Platform', 'MongoDB_version', 'MongoDB_storage_engine', 'MongoDB_Oplog_enabled', 'map-region-usa', 'map-region-asia', 's3-file-id', 's3-minio-storage-description', 's3-disabled', 'mongodb-gridfs-storage', 's3-access-key', 's3-bucket', 's3-bucket-description', 's3-connection-failed', 's3-connection-success', 's3-enabled', 's3-endpoint', 's3-endpoint-description', 's3-minio-storage', 's3-port', 's3-port-description', 's3-region', 's3-secret-key', 's3-secret-key-required', 's3-settings-saved', 's3-ssl-enabled', 's3-attachments', 's3-size', 'r-sort-by', 'r-is', 'r-to', 'r-of', 'r-d-send-email-to', 'r-by', 'dueCardsViewChange-choice-me', 'of', 'blockly-ANNOUNCE_MOVE_OF', 'blockly-FIELD_BITMAP_PIXEL_ON']) {
  assert.notEqual(maltese[key], english[key], key);
  assert.deepEqual(tokens(maltese[key]), tokens(english[key]), key);
}
for (const brand of ['AWS S3', 'MinIO', 'Cloudflare R2', 'Backblaze B2', 'Wasabi', 'DigitalOcean Spaces']) assert.ok(maltese['s3-minio-storage-description'].includes(brand));
for (const host of ['s3.amazonaws.com', 'minio.example.com']) assert.ok(maltese['s3-endpoint-description'].includes(host));
assert.match(maltese['s3-secret-key-required'], /hija meħtieġa/);
assert.match(maltese['s3-disabled'], /diżattivata/);
assert.match(maltese['s3-enabled'], /attivat/);
assert.notEqual(maltese['s3-connection-failed'], maltese['s3-connection-success']);
assert.equal(maltese['blockly-ANNOUNCE_MOVE_OF'], '%1 minn %2');
assert.equal(maltese['blockly-FIELD_BITMAP_PIXEL_ON'], 'mixgħul');
assert.equal(maltese['attachment-limit-unit-bytes'], 'Bytes');
assert.equal(maltese['blockly-ALT_KEY'], 'Alt');
