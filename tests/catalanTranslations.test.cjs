// The completed catalog predates newer features; keep its no-regression gate.
// Full translation work remains visible through fill-translations.mjs --list.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const result = spawnSync(process.execPath, [path.join(root, 'releases/translations/fill-translations.mjs'), '--list', 'ca'], { cwd: root, encoding: 'utf8' });
assert.equal(result.status, 0, result.stderr);
assert.equal(result.stdout, '{}\n');
const locale = JSON.parse(fs.readFileSync(path.join(root, 'imports/i18n/data/ca.i18n.json'), 'utf8'));
assert.equal(locale['select-none'], 'No en seleccionis cap');
assert.equal(locale.avatars, 'Imatges dels perfils');
assert.equal(locale.errors, "Missatges d'error");
assert.match(locale['office-report-desc'], /IPv4.*IPv6/);
assert.match(locale['api-no-calls'], /REST API.*WITH_API=true/);

const settingsKeys = ["board-announcement", "board-announcement-enabled", "cards-use-list-color", "external-link-rules", "external-link-rules-description", "external-link-identifier-aliases", "read-only-field", "r-moved-forward", "r-moved-back", "r-assignee", "r-add-actinguser-assignee", "r-remove-all-assignees", "ldap-sync-now", "ldap-sync-now-done", "ldap-sync-now-error", "ldap-sync-now-nothing", "oauth-providers-allowed-email-domains", "scrum-release-scope", "scrum-releases-select-help", "scrum-import-into-board", "scrum-import-into-board-hint", "scrum-import-preview", "scrum-import-choose-file", "scrum-import-invalid-file", "scrum-import-preview-sprints"];
const { translationTokens } = require('../releases/translations/placeholder-tokens.mjs');
const english = JSON.parse(fs.readFileSync(path.join(root, 'imports/i18n/data/en.i18n.json'), 'utf8'));
for (const code of ['ca', 'ca_ES', 'ca@valencia']) {
  const data = JSON.parse(fs.readFileSync(path.join(root, 'imports/i18n/data', code + '.i18n.json'), 'utf8'));
  for (const key of settingsKeys) {
    assert.ok(data[key]?.trim(), key);
    assert.notEqual(data[key], english[key], code + ': ' + key);
    assert.deepEqual(translationTokens(data[key]), translationTokens(english[key]), code + ': ' + key);
  }
  assert.match(data['read-only-field'], /només els administradors del tauler el poden canviar/);
  assert.match(data['scrum-import-into-board-hint'], /mai no es dupliquen/);
  assert.match(data['scrum-import-into-board-hint'], /sense coincidència.*sense canvis/);
  assert.match(data['r-moved-forward'], /endavant.*posterior/);
  assert.match(data['r-moved-back'], /enrere.*anterior/);
  assert.match(data['oauth-providers-allowed-email-domains'], /en blanc es permeten tots/);
  for (const literal of ['LDAP_BACKGROUND_SYNC_IMPORT_NEW_USERS', 'LDAP_BACKGROUND_SYNC_KEEP_EXISTANT_USERS_UPDATED']) assert.ok(data['ldap-sync-now-nothing'].includes(literal));
  assert.ok(data['external-link-rules-description'].includes('[{identifier}:{number}] = https://tracker.example.com/{identifier}/{number}'));
  assert.deepEqual(data['external-link-rules-description'].match(/\{[^{}]+\}/g), english['external-link-rules-description'].match(/\{[^{}]+\}/g));
  assert.ok(data['external-link-identifier-aliases'].includes('TK=Task, IN=Incident'));
}

const planningKeys = ["scrum-import-preview-releases", "scrum-import-preview-cards", "scrum-import-preview-nothing", "scrum-import-into-board-done", "scrum-import-card-not-matched", "scrum-import-card-ambiguous", "scrum-import-card-on-another-board", "scrum-import-record-ambiguous", "scrum-import-record-not-imported", "scrum-import-sprint-finished", "sync-planning-sprint", "sync-planning-releases", "sync-planning-fields", "sync-planning-hint", "stuck-sync-operation-heading", "stuck-sync-operation-description", "stuck-sync-operation-list", "stuck-sync-operation-progress", "stuck-sync-operation-reason", "stuck-sync-operation-applied"];
for (const code of ['ca', 'ca_ES', 'ca@valencia']) {
  const data = JSON.parse(fs.readFileSync(path.join(root, 'imports/i18n/data', code + '.i18n.json'), 'utf8'));
  for (const key of planningKeys) {
    assert.ok(data[key]?.trim(), key);
    assert.notEqual(data[key], english[key], code + ': ' + key);
    assert.deepEqual(translationTokens(data[key]), translationTokens(english[key]), code + ': ' + key);
  }
  assert.match(data['scrum-import-card-on-another-board'], /altre tauler.*sense canvis/);
  assert.match(data['scrum-import-sprint-finished'], /No s’ha mogut.*esprint finalitzat/);
  assert.match(data['sync-planning-hint'], /primer per l’ID de la font i després pel nom/);
  assert.match(data['sync-planning-hint'], /primera sincronització mai no elimina la planificació/);
  assert.match(data['sync-planning-hint'], /canvi local.*es manté fins que la font canvia/);
  assert.match(data['stuck-sync-operation-description'], /els canvis ja aplicats es conserven/);
  assert.match(data['stuck-sync-operation-description'], /canvis desats pendents mai no s’escriuen/);
  assert.doesNotMatch(data['stuck-sync-operation-description'], /els canvis ja aplicats s’eliminen/);
}

const recoveryKeys = ["stuck-sync-operation-reason-scope-changed", "stuck-sync-operation-reason-access-denied", "stuck-sync-operation-reason-trigger-unknown", "stuck-sync-operation-reason-intent-missing", "stuck-sync-operation-reason-unknown", "stuck-sync-operation-replayable-now", "stuck-sync-operation-discard", "stuck-sync-operation-discard-confirm", "stuck-sync-operation-refresh", "stuck-sync-operation-empty", "stuck-sync-operation-truncated", "stuck-sync-operation-unavailable", "stuck-sync-operation-missing", "stuck-sync-operation-not-stuck", "stuck-sync-operation-replayable", "stuck-sync-operation-busy", "stuck-sync-operation-failed", "interrupted-import-heading", "interrupted-import-description", "interrupted-import-board", "interrupted-import-progress", "interrupted-import-created"];
for (const code of ['ca', 'ca_ES', 'ca@valencia']) {
  const data = JSON.parse(fs.readFileSync(path.join(root, 'imports/i18n/data', code + '.i18n.json'), 'utf8'));
  for (const key of recoveryKeys) {
    assert.ok(data[key]?.trim(), key);
    assert.notEqual(data[key], english[key], code + ': ' + key);
    assert.deepEqual(translationTokens(data[key]), translationTokens(english[key]), code + ': ' + key);
  }
  assert.match(data['stuck-sync-operation-reason-access-denied'], /ja no té accés d’escriptura a tota la llista/);
  assert.match(data['stuck-sync-operation-replayable-now'], /no es pot descartar/);
  assert.match(data['stuck-sync-operation-replayable'], /no s’ha descartat/);
  assert.match(data['stuck-sync-operation-not-stuck'], /no es pot descartar/);
  assert.match(data['stuck-sync-operation-discard-confirm'], /canvis que ja ha aplicat es conserven/);
  assert.match(data['stuck-sync-operation-discard-confirm'], /la resta no s’escriuen mai/);
  assert.doesNotMatch(data['stuck-sync-operation-discard-confirm'], /canvis que ja ha aplicat s’eliminen/);
  assert.match(data['stuck-sync-operation-truncated'], /50 més antigues/);
  assert.match(data['interrupted-import-description'], /no es pot continuar perquè no es conserva el fitxer d’origen/);
  assert.match(data['interrupted-import-description'], /elimina el tauler.*tot el seu contingut/);
  assert.match(data['interrupted-import-description'], /inclòs tot el que s’hi ha(?:gi|ja) afegit des de llavors/);
}

const recoveryResultKeys = ["interrupted-import-source", "interrupted-import-state-stopped", "interrupted-import-state-failed", "interrupted-import-state-discarding", "interrupted-import-scrum", "interrupted-import-counts", "interrupted-import-no-board", "interrupted-import-keep", "interrupted-import-discard", "interrupted-import-keep-confirm", "interrupted-import-discard-confirm", "interrupted-import-refresh", "interrupted-import-empty", "interrupted-import-truncated", "interrupted-import-unavailable", "interrupted-import-missing", "interrupted-import-not-interrupted", "interrupted-import-foreign-board", "interrupted-import-scrum-busy", "interrupted-import-failed", "scrum-history-checkpoint-stuck", "scrum-history-checkpoint-counts", "scrum-history-checkpoint-hint", "scrum-history-checkpoint-rollback", "scrum-history-checkpoint-discard", "scrum-history-checkpoint-discard-confirm", "scrum-history-checkpoint-ask-admin", "login-setting-env-only"];
for (const code of ['ca', 'ca_ES', 'ca@valencia']) {
  const data = JSON.parse(fs.readFileSync(path.join(root, 'imports/i18n/data', code + '.i18n.json'), 'utf8'));
  for (const key of recoveryResultKeys) {
    assert.ok(data[key]?.trim(), key);
    assert.notEqual(data[key], english[key], code + ': ' + key);
    assert.deepEqual(translationTokens(data[key]), translationTokens(english[key]), code + ': ' + key);
  }
  assert.match(data['interrupted-import-keep-confirm'], /No s’elimina res/);
  assert.match(data['interrupted-import-discard-confirm'], /tot el seu contingut s’eliminen permanentment/);
  assert.match(data['interrupted-import-foreign-board'], /no s’ha modificat/);
  assert.match(data['interrupted-import-truncated'], /50 més antigues/);
  assert.match(data['scrum-history-checkpoint-hint'], /només s’ofereix quan ningú més no ha modificat/);
  assert.match(data['scrum-history-checkpoint-hint'], /no modifica cap registre/);
  assert.match(data['scrum-history-checkpoint-stuck'], /bloquejada fins que es resol(?:gui|ga)/);
  assert.match(data['login-setting-env-only'], /Només l’entorn del servidor.*només per a lectura/);
  assert.doesNotMatch(data['interrupted-import-keep-confirm'], /s’elimina el tauler/);
}

for (const code of ['ca', 'ca_ES']) {
  const data = JSON.parse(fs.readFileSync(path.join(root, `imports/i18n/data/${code}.i18n.json`), 'utf8'));
  assert.deepEqual(Object.keys(data), Object.keys(english));
  for (const key of Object.keys(english)) assert.deepEqual(translationTokens(data[key]), translationTokens(english[key]), `${code}:${key}`);
  const full = spawnSync(process.execPath, [path.join(root, 'releases/translations/fill-translations.mjs'), '--list', code], { cwd: root, encoding: 'utf8' });
  assert.equal(full.status, 0, full.stderr);
  assert.deepEqual(JSON.parse(full.stdout), {});
  assert.equal(data['notification-delivery-part-dates'], 'Dates');
  assert.match(data['custom-field-links-hint'], /mateix nom i tipus a totes dues fitxes/);
  assert.match(data['custom-field-links-hint'], /només té una de les fitxes es deixen sense canvis/);
  assert.match(data['custom-field-link-inactive'], /ja no pot editar totes dues fitxes.*arxivada/);
  assert.match(data['custom-field-link-both'], /tots dos sentits.*qualsevol fitxa/);
  assert.match(data['custom-field-link-send'], /un sol sentit.*fitxa principal/);
  assert.match(data['field-link-not-allowed'], /editar totes dues fitxes/);
  assert.equal(data['import-members-mode-me'], 'Substitueix-les totes per mi');
  assert.match(data['import-many-boards-hint'], /sense associar membres/);
  assert.match(data['import-many-boards-hint'], /en si mateix una sola exportació.*és un sol tauler/);
  assert.match(data['export-all-boards-hint'], /podeu exportar.*llibre.*\.zip/);
  assert.match(data['webhook-payload-description'], /conserva la configuració heretada/);
  assert.match(data['notification-delivery-quiet'], /espera fins que acabin/);
  assert.match(data['r-wrike-workflow-note'], /com a completada.*Completed.*Cancelled.*com a no completada.*Active.*Deferred/);
  for (const literal of ['GET /workflows', 'Active', 'Completed', 'Deferred', 'Cancelled']) assert.ok(data['r-wrike-workflow-note'].includes(literal), literal);
  assert.ok(data['webhook-payload-field-standard'].includes('WEBHOOKS_ATTRIBUTES'));
  assert.notEqual(data['subtask-mark-done'], data['subtask-mark-not-done']);
}
console.log('Catalan current catalogs, shared date label, tokens and field meanings pass');
