// The completed catalog predates newer features; keep its no-regression gate.
// Full translation work remains visible through fill-translations.mjs --list.
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const read = code => JSON.parse(fs.readFileSync(path.join(root, 'imports/i18n/data/' + code + '.i18n.json'), 'utf8'));
const currentKeys = [
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
  "stuck-sync-operation-failed",
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
  "scrum-history-checkpoint-ask-admin"
];

(async () => {
  const { translationTokens } = await import('../releases/translations/placeholder-tokens.mjs');
  const en = read('en'), pl = read('pl');
  assert.deepEqual(Object.keys(pl), Object.keys(en));
  for (const key of Object.keys(en)) {
    assert.deepEqual(translationTokens(pl[key]), translationTokens(en[key]), key);
  }
  for (const key of ['filter-column-age-hint', 'scrum-report-help', 'sync-preview-saved',
    'email-recovery-description', 'activity-recovery-cancel-confirm', 'saml-login-not-started',
    'instance-desc', 'r-trigger-vars-hint', 'r-vars-people-hint']) {
    assert.ok(pl[key]?.trim(), key);
    assert.notEqual(pl[key], en[key], key);
  }
  for (const key of ['r-trigger-vars-hint', 'r-vars-people-hint']) {
    assert.deepEqual(pl[key].match(/\{[^{}]+\}/g), en[key].match(/\{[^{}]+\}/g), key);
  }
  assert.deepEqual(pl['advanced-filter-card-dates-hint'].match(/@[A-Za-z]+/g),
    en['advanced-filter-card-dates-hint'].match(/@[A-Za-z]+/g));
  assert.match(pl['advanced-filter-card-dates-hint'], /@endAt = none/);
  assert.match(pl['scrum-report-help'], /nie są oszacowaniami zerowymi/);
  assert.match(pl['sync-conflict-hint'], /Nic nie jest wysyłane do systemu źródłowego/);
  assert.match(pl['activity-recovery-cancel-confirm'], /Nie będzie można ich wznowić/);
  assert.match(pl['email-recovery-confirm-cancel'], /Nowe wiadomości.*zostaną zachowane/);
  assert.match(pl['instance-desc'], /osobom niezalogowanym/);
  assert.match(pl['instance-desc'], /Edytować mogą tylko osoby dodane do tablicy/);
  assert.match(pl['board-instance-info'], /<strong>każdego zalogowanego użytkownika<\/strong>/);
  for (const key of currentKeys) {
    assert.ok(pl[key]?.trim(), key);
    assert.notEqual(pl[key], en[key], `${key}: translate current prose`);
  }
  for (const name of ['LDAP_BACKGROUND_SYNC_IMPORT_NEW_USERS', 'LDAP_BACKGROUND_SYNC_KEEP_EXISTANT_USERS_UPDATED']) {
    assert.ok(pl['ldap-sync-now-nothing'].includes(name), name);
  }
  assert.match(pl['scrum-releases-select-help'], /kilku wydań/);
  assert.match(pl['scrum-releases-select-help'], /wszystkich wydań/);
  assert.match(pl['stuck-sync-operation-description'], /ponownie porówna listę ze źródłem/);
  assert.match(pl['stuck-sync-operation-discard-confirm'], /zastosowane zmiany zostaną zachowane/);
  assert.match(pl['stuck-sync-operation-discard-confirm'], /nigdy nie zostaną wprowadzone/);
  assert.match(pl['stuck-sync-operation-replayable-now'], /nie można jej odrzucić/);
  assert.match(pl['stuck-sync-operation-replayable'], /nie została odrzucona/);
  assert.match(pl['stuck-sync-operation-truncated'], /50 najstarszych/);
  for (const literal of ['TODO', 'DONE', 'SCHEDULED', 'DEADLINE', 'CLOSED']) {
    assert.ok(pl['import-board-instruction-orgmode'].includes(literal), literal);
  }
  for (const literal of ['@labels', 'p1', 'p3', 'CSV']) {
    assert.ok(pl['import-board-instruction-todoist'].includes(literal), literal);
  }
  assert.match(pl['scrum-import-into-board-hint'], /nigdy powielane/);
  assert.match(pl['scrum-import-into-board-hint'], /ID albo numeru karty i tytułu/);
  assert.match(pl['scrum-import-card-on-another-board'], /pozostawiona bez zmian/);
  assert.match(pl['scrum-import-sprint-finished'], /nie została przeniesiona/);
  assert.match(pl['sync-planning-hint'], /najpierw według ID w źródle, a potem według nazwy/);
  assert.match(pl['sync-planning-hint'], /pierwsza synchronizacja nigdy nie usuwa/);
  assert.match(pl['interrupted-import-description'], /nie można wznowić/);
  assert.match(pl['interrupted-import-description'], /także elementy dodane później/);
  assert.match(pl['interrupted-import-keep-confirm'], /Nic nie zostanie usunięte/);
  assert.match(pl['interrupted-import-discard-confirm'], /trwale usunięte/);
  assert.match(pl['interrupted-import-truncated'], /50 najstarszych/);
  assert.match(pl['interrupted-import-foreign-board'], /nie została zmieniona/);
  assert.match(pl['scrum-history-checkpoint-hint'], /tylko wtedy, gdy nikt inny nie/);
  assert.match(pl['scrum-history-checkpoint-hint'], /bez zmieniania rekordów/);
  assert.match(pl['scrum-history-checkpoint-discard-confirm'], /już zapisane/);
  assert.notEqual(pl['r-moved-forward'], pl['r-moved-back']);
  for (const literal of ['{number}', '{identifier}', '[{identifier}:{number}] = https://tracker.example.com/{identifier}/{number}']) {
    assert.ok(pl['external-link-rules-description'].includes(literal), literal);
  }
  assert.ok(pl['external-link-identifier-aliases'].includes('TK=Task, IN=Incident'));
  assert.equal(pl['move-selection-before'], 'Przed');
  assert.equal(pl['move-selection-after'], 'Po');
  assert.notEqual(pl['move-selection-before'], pl['move-selection-after']);
  for (const key of ['blockly-MATH_ADDITION_SYMBOL_ARIA', 'blockly-MATH_SUBTRACTION_SYMBOL_ARIA',
    'blockly-INPUT_LABEL_NUMBER_MIN', 'blockly-ENTER_KEY', 'scrum-master']) {
    assert.equal(pl[key], en[key], key + ': reviewed shared term');
  }
  const inventory = spawnSync(process.execPath,
    ['releases/translations/fill-translations.mjs', '--completed-catalog', '--list', 'pl'], { cwd: root, encoding: 'utf8' });
  assert.equal(inventory.status, 0, inventory.stderr);
  assert.deepEqual(JSON.parse(inventory.stdout), {});
  console.log('Polish translation coverage, source order, syntax and warning meanings verified');
})().catch(error => { console.error(error); process.exitCode = 1; });
