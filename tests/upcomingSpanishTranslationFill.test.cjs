// The completed catalog predates newer features; keep its no-regression gate.
// Full translation work remains visible through fill-translations.mjs --list.
'use strict';
const assert = require('assert');
const childProcess = require('child_process');
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const node = process.execPath;
const fill = path.join(ROOT, 'releases/translations/fill-translations.mjs');
const languages = ['es-AR', 'es-CL', 'es-CO', 'es-LA', 'es-MX', 'es-PE',
  'es-PY', 'es', 'es_CO'];
for (const language of languages) {
  assert.deepStrictEqual(JSON.parse(childProcess.execFileSync(node,
    [fill, '--completed-catalog', '--list', language], { cwd: ROOT, encoding: 'utf8' })), {});
  const translated = JSON.parse(fs.readFileSync(path.join(ROOT,
    'imports/i18n/data', `${language}.i18n.json`), 'utf8'));
  assert.strictEqual(translated.officeReportTitle, 'Oficinas');
  assert.match(translated['api-report-desc'], /puntos finales|frecuencia/);
  assert.match(translated['api-no-calls'], /WITH_API=true/);
  assert.strictEqual(translated.error, 'Mensaje de error');
}
console.log('upcomingSpanishTranslationFill: historical baseline checks passed');

const currentKeys = [
  "board-announcement",
  "board-announcement-enabled",
  "cards-use-list-color",
  "external-link-rules",
  "external-link-rules-description",
  "external-link-identifier-aliases",
  "read-only-field",
  "r-moved-forward",
  "r-moved-back",
  "scrum-import-into-board",
  "scrum-import-into-board-hint",
  "scrum-import-preview",
  "scrum-import-choose-file",
  "scrum-import-invalid-file",
  "scrum-import-preview-sprints",
  "scrum-import-preview-releases",
  "scrum-import-preview-cards",
  "scrum-import-preview-nothing",
  "scrum-import-into-board-done",
  "scrum-import-card-not-matched",
  "scrum-import-card-ambiguous",
  "scrum-import-card-on-another-board",
  "scrum-import-record-ambiguous",
  "scrum-import-record-not-imported",
  "scrum-import-sprint-finished",
  "sync-planning-sprint",
  "sync-planning-releases",
  "sync-planning-fields",
  "sync-planning-hint",
  "interrupted-import-heading",
  "interrupted-import-description",
  "interrupted-import-board",
  "interrupted-import-progress",
  "interrupted-import-created",
  "interrupted-import-source",
  "interrupted-import-state-stopped",
  "interrupted-import-state-failed",
  "interrupted-import-state-discarding",
  "interrupted-import-scrum",
  "interrupted-import-counts",
  "interrupted-import-no-board",
  "interrupted-import-keep",
  "interrupted-import-discard",
  "interrupted-import-keep-confirm",
  "interrupted-import-discard-confirm",
  "interrupted-import-refresh",
  "interrupted-import-empty",
  "interrupted-import-truncated",
  "interrupted-import-unavailable",
  "interrupted-import-missing",
  "interrupted-import-not-interrupted",
  "interrupted-import-foreign-board",
  "interrupted-import-scrum-busy",
  "interrupted-import-failed",
  "scrum-history-checkpoint-stuck",
  "scrum-history-checkpoint-counts",
  "scrum-history-checkpoint-hint",
  "scrum-history-checkpoint-rollback",
  "scrum-history-checkpoint-discard",
  "scrum-history-checkpoint-discard-confirm",
  "scrum-history-checkpoint-ask-admin",
  "import-board-instruction-opml",
  "import-board-instruction-orgmode",
  "import-board-instruction-todoist",
  "r-assignee",
  "r-add-actinguser-assignee",
  "r-remove-all-assignees",
  "ldap-sync-now",
  "ldap-sync-now-done",
  "ldap-sync-now-error",
  "ldap-sync-now-nothing",
  "oauth-providers-allowed-email-domains",
  "scrum-release-scope",
  "scrum-releases-select-help",
  "stuck-sync-operation-heading",
  "stuck-sync-operation-description",
  "stuck-sync-operation-list",
  "stuck-sync-operation-progress",
  "stuck-sync-operation-reason",
  "stuck-sync-operation-applied",
  "stuck-sync-operation-reason-scope-changed",
  "stuck-sync-operation-reason-access-denied",
  "stuck-sync-operation-reason-trigger-unknown",
  "stuck-sync-operation-reason-intent-missing",
  "stuck-sync-operation-reason-unknown",
  "stuck-sync-operation-replayable-now",
  "stuck-sync-operation-discard",
  "stuck-sync-operation-discard-confirm",
  "stuck-sync-operation-refresh",
  "stuck-sync-operation-empty",
  "stuck-sync-operation-truncated",
  "stuck-sync-operation-unavailable",
  "stuck-sync-operation-missing",
  "stuck-sync-operation-not-stuck",
  "stuck-sync-operation-replayable",
  "stuck-sync-operation-busy",
  "stuck-sync-operation-failed"
];

(async () => {
  const { translationTokens } = await import('../releases/translations/placeholder-tokens.mjs');
  const en = JSON.parse(fs.readFileSync(path.join(ROOT, 'imports/i18n/data/en.i18n.json'), 'utf8'));
  for (const language of languages) {
    const translated = JSON.parse(fs.readFileSync(path.join(ROOT,
      'imports/i18n/data', `${language}.i18n.json`), 'utf8'));
    assert.deepStrictEqual(Object.keys(translated), Object.keys(en), language);
    for (const key of Object.keys(en)) {
      assert.deepStrictEqual(translationTokens(translated[key]), translationTokens(en[key]), `${language}:${key}`);
    }
    for (const key of ['filter-column-age-hint', 'scrum-total', 'sync-preview-saved',
      'email-recovery-description', 'activity-recovery-busy',
      'rule-email-recovery-description', 'saml-login-not-started',
      'blockly-WORKSPACE_SEARCH_INPUT_LABEL']) {
      assert.ok(translated[key]?.trim(), `${language}:${key}`);
      assert.notStrictEqual(translated[key], en[key], `${language}:${key} remains English`);
    }
    for (const key of currentKeys) {
      assert.ok(translated[key]?.trim(), `${language}:${key}`);
      assert.notStrictEqual(translated[key], en[key], `${language}:${key} remains English`);
    }
    assert.match(translated['scrum-import-into-board-hint'], /nunca se duplican/);
    assert.match(translated['scrum-import-into-board-hint'], /por ID o por número de tarjeta y título/);
    assert.match(translated['scrum-import-card-on-another-board'], /dejado sin cambios/);
    assert.match(translated['scrum-import-sprint-finished'], /No se ha movido/);
    assert.match(translated['sync-planning-hint'], /primero por su ID.*después por su nombre/);
    assert.match(translated['sync-planning-hint'], /primera sincronización nunca elimina/);
    assert.match(translated['interrupted-import-description'], /No se puede reanudar/);
    assert.match(translated['interrupted-import-description'], /incluidos los elementos añadidos desde entonces/);
    assert.match(translated['interrupted-import-keep-confirm'], /No se elimina nada/);
    assert.match(translated['interrupted-import-discard-confirm'], /eliminarán permanentemente/);
    assert.match(translated['interrupted-import-truncated'], /50 más antiguas/);
    assert.match(translated['interrupted-import-foreign-board'], /no se ha modificado/);
    assert.match(translated['scrum-history-checkpoint-hint'], /solo se ofrece si nadie más/);
    assert.match(translated['scrum-history-checkpoint-hint'], /sin cambiar ningún registro/);
    assert.match(translated['scrum-history-checkpoint-discard-confirm'], /ya ha escrito/);
    assert.notStrictEqual(translated['r-moved-forward'], translated['r-moved-back']);
    for (const literal of ['{number}', '{identifier}', '[{identifier}:{number}] = https://tracker.example.com/{identifier}/{number}']) {
      assert.ok(translated['external-link-rules-description'].includes(literal), `${language}: preserve ${literal}`);
    }
    assert.ok(translated['external-link-identifier-aliases'].includes('TK=Task, IN=Incident'));
    for (const name of ['LDAP_BACKGROUND_SYNC_IMPORT_NEW_USERS', 'LDAP_BACKGROUND_SYNC_KEEP_EXISTANT_USERS_UPDATED']) {
      assert.ok(translated['ldap-sync-now-nothing'].includes(name), `${language}:${name}`);
    }
    assert.match(translated['scrum-releases-select-help'], /varias versiones/);
    assert.match(translated['scrum-releases-select-help'], /todas las versiones/);
    assert.match(translated['stuck-sync-operation-description'], /vuelve a comparar la lista con su origen/);
    assert.match(translated['stuck-sync-operation-discard-confirm'], /ya aplicados se conservan/);
    assert.match(translated['stuck-sync-operation-discard-confirm'], /nunca se escriben/);
    assert.match(translated['stuck-sync-operation-replayable-now'], /no se puede descartar/);
    assert.match(translated['stuck-sync-operation-replayable'], /no se ha descartado/);
    assert.match(translated['stuck-sync-operation-truncated'], /50 más antiguas/);
    for (const literal of ['TODO', 'DONE', 'SCHEDULED', 'DEADLINE', 'CLOSED']) {
      assert.ok(translated['import-board-instruction-orgmode'].includes(literal), `${language}:${literal}`);
    }
    for (const literal of ['@labels', 'p1', 'p3', 'CSV']) {
      assert.ok(translated['import-board-instruction-todoist'].includes(literal), `${language}:${literal}`);
    }
    assert.strictEqual(translated['blockly-ARIA_TYPE_FIELD_COLOUR'], 'color');
    assert.strictEqual(translated['blockly-INPUT_LABEL_MATH_DIVISOR'], 'divisor');
  }
  console.log('upcomingSpanishTranslationFill: source keys, tokens and new prose verified in all nine locales');
})().catch(error => { console.error(error); process.exitCode = 1; });
