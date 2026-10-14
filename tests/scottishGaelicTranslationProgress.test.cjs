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
