// The completed catalog predates newer features; keep its no-regression gate.
// Full translation work remains visible through fill-translations.mjs --list.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const fillScript = path.join(root, 'releases/translations/fill-translations.mjs');
for (const language of ['af', 'af_ZA']) {
  const result = spawnSync(process.execPath, [fillScript, '--completed-catalog', '--list', language], { cwd: root, encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout, '{}\n');
  const locale = JSON.parse(fs.readFileSync(path.join(root, `imports/i18n/data/${language}.i18n.json`), 'utf8'));
  assert.equal(locale['select-none'], 'Kies niks');
  assert.equal(locale.status, 'Toestand');
  assert.equal(locale.avatars, 'Profielprente');
  assert.match(locale['office-report-desc'], /IPv4.*IPv6/);
  assert.match(locale['api-no-calls'], /REST API.*WITH_API=true/);
}

const english = JSON.parse(fs.readFileSync(path.join(root, 'imports/i18n/data/en.i18n.json'), 'utf8'));
const { translationTokens } = require('../releases/translations/placeholder-tokens.mjs');
const recoveryKeys = Object.keys(english).filter(key => key.startsWith('stuck-sync-operation-'));
assert.equal(recoveryKeys.length, 23);
for (const language of ['af', 'af_ZA']) {
  const locale = JSON.parse(fs.readFileSync(path.join(root, `imports/i18n/data/${language}.i18n.json`), 'utf8'));
  for (const key of recoveryKeys) {
    assert.notEqual(locale[key], english[key], key);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), key);
  }
  assert.match(locale['stuck-sync-operation-description'], /veranderinge wat reeds toegepas is, bly behoue/);
  assert.match(locale['stuck-sync-operation-description'], /oorblywende gestoorde veranderinge word nooit geskryf nie/);
  assert.match(locale['stuck-sync-operation-reason-access-denied'], /skryftoegang tot die hele lys nie/);
  assert.match(locale['stuck-sync-operation-replayable-now'], /kan dit nie weggegooi word nie/);
  assert.match(locale['stuck-sync-operation-not-stuck'], /kan dit nie weggegooi word nie/);
  assert.match(locale['stuck-sync-operation-truncated'], /50 oudste/);
  assert.match(locale['stuck-sync-operation-busy'], /sinchroniseer tans/);
}

const interruptedImportKeys = Object.keys(english).filter(key => key.startsWith('interrupted-import-'));
assert.equal(interruptedImportKeys.length, 25);
for (const language of ['af', 'af_ZA']) {
  const locale = JSON.parse(fs.readFileSync(path.join(root, `imports/i18n/data/${language}.i18n.json`), 'utf8'));
  for (const key of interruptedImportKeys) {
    assert.notEqual(locale[key], english[key], key);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), key);
  }
  assert.match(locale['interrupted-import-description'], /bronlêer nie bewaar word nie/);
  assert.match(locale['interrupted-import-description'], /enigiets wat sedertdien bygevoeg is/);
  assert.match(locale['interrupted-import-counts'], /__swimlanes__ swembane/);
  assert.match(locale['interrupted-import-discard-confirm'], /permanent verwyder/);
  assert.match(locale['interrupted-import-keep-confirm'], /Niks word verwyder nie/);
  assert.match(locale['interrupted-import-foreign-board'], /dus nie verander nie/);
  assert.match(locale['interrupted-import-truncated'], /50 oudste/);
  assert.match(locale['interrupted-import-scrum-busy'], /word nog geskryf of herstel/);
}

const translatedPlanningControls = ["board-announcement", "board-announcement-enabled", "cards-use-list-color", "import-board-instruction-opml", "import-board-instruction-orgmode", "import-board-instruction-todoist", "external-link-rules", "external-link-rules-description", "external-link-identifier-aliases", "read-only-field", "r-moved-forward", "r-moved-back", "r-assignee", "r-add-actinguser-assignee", "r-remove-all-assignees", "ldap-sync-now", "ldap-sync-now-done", "ldap-sync-now-error", "ldap-sync-now-nothing", "oauth-providers-allowed-email-domains", "login-origin-mismatch", "scrum-release-scope", "scrum-releases-select-help", "scrum-import-into-board", "scrum-import-into-board-hint", "scrum-import-preview", "scrum-import-choose-file", "scrum-import-invalid-file", "scrum-import-preview-sprints", "scrum-import-preview-releases", "scrum-import-preview-cards", "scrum-import-preview-nothing", "scrum-import-into-board-done", "scrum-import-card-not-matched", "scrum-import-card-ambiguous", "scrum-import-card-on-another-board", "scrum-import-record-ambiguous", "scrum-import-record-not-imported", "scrum-import-sprint-finished", "sync-planning-sprint", "sync-planning-releases", "sync-planning-fields", "sync-planning-hint", "scrum-history-checkpoint-stuck", "scrum-history-checkpoint-counts", "scrum-history-checkpoint-hint", "scrum-history-checkpoint-rollback", "scrum-history-checkpoint-discard", "scrum-history-checkpoint-discard-confirm", "scrum-history-checkpoint-ask-admin", "login-setting-env-only"];
for (const language of ['af', 'af_ZA']) {
  const locale = JSON.parse(fs.readFileSync(path.join(root, `imports/i18n/data/${language}.i18n.json`), 'utf8'));
  for (const key of translatedPlanningControls) {
    assert.notEqual(locale[key], english[key], key);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), key);
  }
  for (const token of ['TODO', 'DONE', 'SCHEDULED', 'DEADLINE', 'CLOSED']) {
    assert.ok(locale['import-board-instruction-orgmode'].includes(token));
  }
  for (const token of ['CSV', '@labels', 'p1', 'p3']) {
    assert.ok(locale['import-board-instruction-todoist'].includes(token));
  }
  for (const token of ['LDAP_BACKGROUND_SYNC_IMPORT_NEW_USERS', 'LDAP_BACKGROUND_SYNC_KEEP_EXISTANT_USERS_UPDATED']) {
    assert.ok(locale['ldap-sync-now-nothing'].includes(token));
  }
  assert.ok(locale['external-link-rules-description'].includes('[{identifier}:{number}] = https://tracker.example.com/{identifier}/{number}'));
  assert.ok(locale['external-link-identifier-aliases'].includes('TK=Task, IN=Incident'));
  assert.ok(locale['login-origin-mismatch'].includes('ROOT_URL'));
  assert.match(locale['sync-planning-hint'], /die eerste sinchronisasie verwyder nooit beplanning nie/);
  assert.match(locale['scrum-import-into-board-hint'], /nooit gedupliseer nie/);
  assert.match(locale['scrum-history-checkpoint-hint'], /niemand anders daardie rekords sedertdien verander het nie/);
  assert.match(locale['scrum-history-checkpoint-hint'], /verander geen rekords nie/);
  assert.match(locale['login-setting-env-only'], /as leesalleen gewys/);
}
