// The completed catalog predates newer features; keep its no-regression gate.
// Full translation work remains visible through fill-translations.mjs --list.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const fillScript = path.join(root, 'releases/translations/fill-translations.mjs');
const result = spawnSync(process.execPath, [fillScript, '--completed-catalog', '--list', 'gd'], {
  cwd: root,
  encoding: 'utf8',
});
assert.equal(result.status, 0, result.stderr);
const remaining = JSON.parse(result.stdout);
assert.equal(Object.keys(remaining).length, 0);

const english = JSON.parse(fs.readFileSync(path.join(root, 'imports/i18n/data/en.i18n.json'), 'utf8'));
const gaelic = JSON.parse(fs.readFileSync(path.join(root, 'imports/i18n/data/gd.i18n.json'), 'utf8'));
const tokens = (value) => [...value.matchAll(/__[A-Za-z0-9_]+__|%[A-Za-z]|%{[A-Za-z0-9]+}|{{[A-Za-z0-9]+}}/g)].map(([token]) => token).sort();
const tags = (value) => [...value.matchAll(/<\/?[A-Za-z][^>]*>/g)].map(([tag]) => tag).sort();

for (const [key, value] of Object.entries(gaelic)) {
  if (value !== english[key]) assert.deepEqual(tokens(value), tokens(english[key]), key);
  assert.deepEqual(tags(value), tags(english[key]), key);
}

assert.equal(gaelic.accept, 'Gabh ris');
assert.match(gaelic['act-createBoard'], /bòrd/);
assert.match(gaelic['act-createCard'], /cairt/);
assert.equal(gaelic.log, 'Loga');

const attachmentStorageKeys = ["attach-card", "attachCardPopup-title", "attach-card-hint", "attached-card-unavailable", "detach-card", "attach-card-self", "attach-card-limit", "attach-card-not-found", "MongoDB_version", "MongoDB_storage_engine", "MongoDB_Oplog_enabled", "r-sort-by", "r-is", "r-to", "r-of", "r-d-send-email-to", "r-by", "dueCardsViewChange-choice-me", "s3-file-id", "s3-minio-storage-description", "s3-disabled", "mongodb-gridfs-storage", "s3-access-key", "s3-bucket", "s3-bucket-description", "s3-connection-failed", "s3-connection-success", "s3-enabled", "s3-endpoint", "s3-endpoint-description", "s3-minio-storage", "s3-port", "s3-port-description", "s3-region", "s3-secret-key", "s3-secret-key-required", "s3-settings-saved", "s3-ssl-enabled", "of", "s3-attachments", "s3-size"];
for (const key of attachmentStorageKeys) {
  assert.notEqual(gaelic[key], english[key], key);
  assert.deepEqual(tokens(gaelic[key]), tokens(english[key]), key);
}
assert.match(gaelic['attach-card-self'], /Chan urrainn.*rithe fhèin/);
assert.match(gaelic['attach-card-not-found'], /Cha deach.*a chì thu/);
assert.match(gaelic['s3-access-key'], /inntrigidh/);
assert.match(gaelic['s3-secret-key'], /dhìomhair/);
assert.notEqual(gaelic['s3-access-key'], gaelic['s3-secret-key']);
assert.match(gaelic['s3-endpoint-description'], /s3.amazonaws.com.*minio.example.com/);

const fieldLinkKeys = ["board-announcement", "board-announcement-enabled", "board-view-calendar-mode", "custom-field-links", "custom-field-links-hint", "custom-field-links-none", "custom-field-link-unavailable", "custom-field-link-fields", "custom-field-link-no-fields", "custom-field-link-inactive", "custom-field-unlink", "custom-field-link-target", "custom-field-link-direction", "custom-field-link-both", "custom-field-link-send", "custom-field-link-sends", "custom-field-link-receives", "custom-field-link-add", "field-link-self", "field-link-limit", "field-link-archived", "field-link-invalid", "field-link-not-found", "field-link-not-allowed", "cardCustomFieldLinksPopup-title", "cards-use-list-color"];
for (const key of fieldLinkKeys) {
  assert.notEqual(gaelic[key], english[key], key);
  assert.deepEqual(tokens(gaelic[key]), tokens(english[key]), key);
}
assert.match(gaelic['custom-field-link-both'], /An dà threo.*chairt eile/);
assert.match(gaelic['custom-field-link-send'], /Aon treo.*phrìomh chairt/);
assert.match(gaelic['custom-field-link-inactive'], /an dà chairt a dheasachadh tuilleadh.*san tasglann/);
assert.match(gaelic['field-link-not-allowed'], /an dà chairt a dheasachadh/);
assert.match(gaelic['custom-field-links-hint'], /Chan atharraichear.*aon chairt/);
assert.match(gaelic['field-link-self'], /Chan urrainn.*rithe fhèin/);

const importGuideKeys = ["import-board-instruction-opml", "import-board-instruction-orgmode", "import-board-instruction-meistertask", "import-board-instruction-obsidian", "import-board-instruction-linear", "import-board-instruction-ticktick", "import-board-instruction-clickup", "import-board-instruction-nullboard", "import-board-instruction-kanri", "import-board-instruction-pivotal"];
for (const key of importGuideKeys) {
  assert.notEqual(gaelic[key], english[key], key);
  assert.deepEqual(tokens(gaelic[key]), tokens(english[key]), key);
}
assert.match(gaelic['import-board-instruction-orgmode'], /TODO agus DONE.*SCHEDULED, DEADLINE agus CLOSED/);
assert.match(gaelic['import-board-instruction-meistertask'], /gnìomhan crìochnaichte an ceann-là crìochnachaidh/);
assert.match(gaelic['import-board-instruction-nullboard'], /leubail raw.*a’ chiad bhòrd/);
assert.match(gaelic['import-board-instruction-kanri'], /a’ chiad bhòrd/);
assert.match(gaelic['import-board-instruction-clickup'], /a h-uile colbh/);

const moreImportGuideKeys = ["import-board-instruction-tasksorg", "import-board-instruction-monday", "import-board-instruction-superproductivity", "import-board-instruction-taiga", "import-board-instruction-vikunja", "import-board-instruction-quire", "import-board-instruction-wrike", "import-board-instruction-teamwork", "import-board-instruction-businessmap", "import-board-instruction-redmine", "import-board-instruction-notion", "import-board-instruction-plane"];
for (const key of moreImportGuideKeys) {
  assert.notEqual(gaelic[key], english[key], key);
  assert.deepEqual(tokens(gaelic[key]), tokens(english[key]), key);
}
for (const format of ['taiga', 'vikunja']) assert.match(gaelic[`import-board-instruction-${format}`], /Cha tèid ceanglachain ion-phortadh/);
assert.match(gaelic['import-board-instruction-quire'], /Chan eil beachdan no ceanglachain/);
assert.match(gaelic['import-board-instruction-businessmap'], /gu Beurla an toiseach/);
assert.match(gaelic['import-board-instruction-redmine'], /gu Beurla.*My account mus/);
assert.match(gaelic['import-board-instruction-notion'], /Cha tèid dàimhean, dealbhan no ceanglachain/);
assert.match(gaelic['import-board-instruction-plane'], /Chan eil tuairisgeulan no ceanglachain.*cha tèid an ion-phortadh/);

const importControlKeys = ["import-members-mode-heading", "import-members-mode-map", "import-members-mode-placeholder", "import-members-mode-me", "csv-mapping-title", "csv-mapping-description", "csv-mapping-not-in-file", "csv-mapping-column-number", "csv-mapping-list-missing", "csv-mapping-list-name", "csv-mapping-custom-fields", "csv-mapping-boards", "csv-mapping-skipped-sheets", "csv-mapping-title-required", "csv-mapping-list-required", "invalid-import-mapping", "import-many-boards", "import-many-boards-hint", "import-one-board-per-project", "import-one-board-per-project-hint", "import-many-progress", "import-many-results-heading", "import-many-imported", "export-all-boards", "export-selected-boards", "export-all-boards-hint", "exportAllBoardsPopup-title"];
for (const key of importControlKeys) {
  assert.notEqual(gaelic[key], english[key], key);
  assert.deepEqual(tokens(gaelic[key]), tokens(english[key]), key);
}
assert.match(gaelic['import-members-mode-placeholder'], /h-ainmean aca fhèin.*fìor chleachdaichean nas anmoiche/);
assert.match(gaelic['import-many-boards-hint'], /gun mhaidseadh bhall.*na aon bhòrd.*an àite an raoin gu h-àrd/);
assert.match(gaelic['export-all-boards-hint'], /aon leabhar-obrach.*siota airson gach bòrd.*\.zip.*faidhle airson gach bòrd/);
assert.match(gaelic['csv-mapping-title-required'], /tiotalan nan cairtean/);
