// The completed catalog predates newer features; keep its no-regression gate.
// Full translation work remains visible through fill-translations.mjs --list.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const fillScript = path.join(root, 'releases/translations/fill-translations.mjs');
const result = spawnSync(process.execPath, [fillScript, '--completed-catalog', '--list', 'ga'], {
  cwd: root,
  encoding: 'utf8',
});
assert.equal(result.status, 0, result.stderr);
const remaining = JSON.parse(result.stdout);
// This explicit count makes a skipped or oversized batch visible. The token
// and tag inventory checks below protect every translated value.
assert.equal(Object.keys(remaining).length, 0);

const english = JSON.parse(
  fs.readFileSync(path.join(root, 'imports/i18n/data/en.i18n.json'), 'utf8'),
);
const irish = JSON.parse(
  fs.readFileSync(path.join(root, 'imports/i18n/data/ga.i18n.json'), 'utf8'),
);
const tokens = (value) =>
  [
    ...value.matchAll(
      /__[A-Za-z0-9_]+__|%[A-Za-z]|%{[A-Za-z0-9]+}|{{[A-Za-z0-9]+}}/g,
    ),
  ]
    .map(([token]) => token)
    .sort();
const tags = (value) =>
  [...value.matchAll(/<\/?[A-Za-z][^>]*>/g)]
    .map(([tag]) => tag)
    .sort();

for (const [key, value] of Object.entries(irish)) {
  if (value !== english[key]) {
    assert.deepEqual(tokens(value), tokens(english[key]), key);
  }
  assert.deepEqual(tags(value), tags(english[key]), key);
}

assert.equal(irish.accept, 'Glac');
assert.deepEqual(tokens(irish['activity-changedTitle']), ['%s', '%s']);
assert.deepEqual(tokens(irish['act-removeChecklistItem']), [
  '__board__',
  '__card__',
  '__checkList__',
  '__checklistItem__',
  '__list__',
  '__swimlane__',
]);
assert.match(irish['act-createBoard'], /clár/);
assert.match(irish['act-createCard'], /cárta/);

const cardLinkKeys = ["attach-card", "attachCardPopup-title", "attach-card-hint", "attached-card-unavailable", "detach-card", "attach-card-self", "attach-card-limit", "attach-card-not-found", "board-announcement", "board-announcement-enabled", "board-view-calendar-mode", "custom-field-links", "custom-field-links-hint", "custom-field-links-none", "custom-field-link-unavailable", "custom-field-link-fields", "custom-field-link-no-fields", "custom-field-link-inactive", "custom-field-unlink", "custom-field-link-target", "custom-field-link-direction", "custom-field-link-both", "custom-field-link-send", "custom-field-link-sends", "custom-field-link-receives", "custom-field-link-add", "field-link-self", "field-link-limit", "field-link-archived", "field-link-invalid", "field-link-not-found", "field-link-not-allowed", "cardCustomFieldLinksPopup-title", "cards-use-list-color"];
for (const key of cardLinkKeys) {
  assert.notEqual(irish[key], english[key], key);
  assert.deepEqual(tokens(irish[key]), tokens(english[key]), key);
}
assert.match(irish['custom-field-link-both'], /Sa dá threo.*cheachtar cárta/);
assert.match(irish['custom-field-link-send'], /I dtreo amháin.*bpríomhchárta/);
assert.match(irish['custom-field-link-inactive'], /Ar sos.*an dá chárta.*sa chartlann/);
assert.match(irish['field-link-not-allowed'], /an dá chárta a chur in eagar/);
assert.match(irish['attach-card-self'], /Ní féidir.*leis féin/);
assert.match(irish['custom-field-links-hint'], /Ní athraítear réimsí.*chárta amháin/);

assert.match(irish['s3-access-key'], /rochtana/);
assert.match(irish['s3-secret-key'], /rúnda/);
assert.notEqual(irish['s3-access-key'], irish['s3-secret-key']);
assert.match(irish['s3-endpoint-description'], /s3.amazonaws.com.*minio.example.com/);

const importGuideKeys = ["import-board-instruction-opml", "import-board-instruction-orgmode", "import-board-instruction-meistertask", "import-board-instruction-obsidian", "import-board-instruction-linear", "import-board-instruction-ticktick", "import-board-instruction-clickup", "import-board-instruction-nullboard", "import-board-instruction-kanri", "import-board-instruction-pivotal"];
for (const key of importGuideKeys) {
  assert.notEqual(irish[key], english[key], key);
  assert.deepEqual(tokens(irish[key]), tokens(english[key]), key);
}
assert.match(irish['import-board-instruction-orgmode'], /TODO agus DONE.*SCHEDULED, DEADLINE agus CLOSED/);
assert.match(irish['import-board-instruction-meistertask'], /tascanna críochnaithe a ndáta críochnaithe/);
assert.match(irish['import-board-instruction-nullboard'], /lipéad raw.*an chéad chlár/);
assert.match(irish['import-board-instruction-kanri'], /an chéad chlár/);
assert.match(irish['import-board-instruction-clickup'], /colúin go léir/);
