// The completed catalog predates newer features; keep its no-regression gate.
// Full translation work remains visible through fill-translations.mjs --list.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const pendingKeys = [
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
const fillScript = path.join(root, 'releases/translations/fill-translations.mjs');
for (const language of ['de-AT', 'de-CH', 'de', 'de_DE']) {
  const result = spawnSync(process.execPath, [fillScript, '--completed-catalog', '--list', language], { cwd: root, encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout, '{}\n');
  const locale = JSON.parse(fs.readFileSync(path.join(root, `imports/i18n/data/${language}.i18n.json`), 'utf8'));
  assert.equal(locale.board, 'Arbeitstafel');
  assert.equal(locale.swimlane, 'Arbeitsbahn');
  assert.equal(locale.status, 'Zustand');
  assert.equal(locale.repository, 'Quellcodeablage');
  assert.match(locale['azure-container'], /Azure/);
  assert.match(locale['office-report-desc'], /IPv4.*IPv6/);
  assert.match(locale['api-no-calls'], /REST API.*WITH_API=true/);
}

(async () => {
  const { translationTokens } = await import('../releases/translations/placeholder-tokens.mjs');
  const english = JSON.parse(fs.readFileSync(path.join(root, 'imports/i18n/data/en.i18n.json'), 'utf8'));
  for (const code of ['de', 'de-AT', 'de-CH', 'de_DE']) {
    const locale = JSON.parse(fs.readFileSync(path.join(root, `imports/i18n/data/${code}.i18n.json`), 'utf8'));
    assert.deepEqual(Object.keys(locale), Object.keys(english), code);
    for (const key of Object.keys(english)) {
      assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `${code}:${key}`);
    }
    for (const key of ['filter-column-age-hint', 'scrum-total', 'sync-preview-saved',
      'email-recovery-description', 'activity-recovery-busy', 'saml-login-not-started',
      'r-rule-any-trigger-help', 'move-selection-before', 'move-selection-after']) {
      assert.ok(locale[key]?.trim(), key);
      assert.notEqual(locale[key], english[key], `${code}:${key} remains English`);
    }
    for (const key of pendingKeys) {
      assert.ok(locale[key]?.trim(), `${code}:${key}`);
      assert.notEqual(locale[key], english[key], `${code}:${key} remains English`);
      if (code === 'de-CH') assert.ok(!locale[key].includes('ß'), `${code}:${key}`);
    }
    assert.match(locale['stuck-sync-operation-discard-confirm'], /Bereits angewendete Änderungen bleiben erhalten/);
    assert.match(locale['stuck-sync-operation-discard-confirm'], /werden niemals geschrieben/);
    assert.match(locale['stuck-sync-operation-description'], /vergleicht die Liste erneut mit ihrer Quelle/);
    assert.match(locale['stuck-sync-operation-replayable-now'], /kann er nicht verworfen werden/);
    assert.match(locale['stuck-sync-operation-replayable'], /wurde er nicht verworfen/);
    assert.match(locale['stuck-sync-operation-truncated'], /50 ältesten/);
    assert.match(locale['scrum-releases-select-help'], /mehreren Veröffentlichungen/);
    assert.match(locale['scrum-releases-select-help'], /sämtlichen Veröffentlichungen/);
    assert.match(locale['scrum-releases-select-help'], /Strg.*Cmd/);
    for (const name of ['LDAP_BACKGROUND_SYNC_IMPORT_NEW_USERS',
      'LDAP_BACKGROUND_SYNC_KEEP_EXISTANT_USERS_UPDATED']) {
      assert.ok(locale['ldap-sync-now-nothing'].includes(name), `${code}:${name}`);
    }
    assert.match(locale['scrum-close-sprint'], code === 'de-CH' ? /abschliessen/ : /abschließen/);
    assert.match(locale['scrum-import-into-board-hint'], /niemals dupliziert/);
    assert.match(locale['scrum-import-into-board-hint'], /ID oder ihrer Kartennummer und ihres Titels/);
    assert.match(locale['scrum-import-card-on-another-board'], /unverändert gelassen/);
    assert.match(locale['scrum-import-sprint-finished'], /nicht in einen abgeschlossenen Sprint/);
    assert.match(locale['sync-planning-hint'], /zuerst anhand ihrer Quell-ID, dann anhand ihres Namens/);
    assert.match(locale['sync-planning-hint'], /erste Synchronisierung entfernt niemals/);
    assert.match(locale['interrupted-import-description'], /kann nicht fortgesetzt werden/);
    assert.match(locale['interrupted-import-description'], /aller seitdem hinzugefügten Inhalte/);
    assert.match(locale['interrupted-import-keep-confirm'], /nichts entfernt/);
    assert.match(locale['interrupted-import-discard-confirm'], /dauerhaft entfernt/);
    assert.match(locale['interrupted-import-truncated'], /50 ältesten/);
    assert.match(locale['interrupted-import-foreign-board'], /deshalb nicht verändert/);
    assert.match(locale['scrum-history-checkpoint-hint'], /nur angeboten, wenn niemand anderes/);
    assert.match(locale['scrum-history-checkpoint-hint'], /ohne Datensätze zu ändern/);
    assert.match(locale['scrum-history-checkpoint-discard-confirm'], /bereits geschrieben hat/);
    assert.notEqual(locale['r-moved-forward'], locale['r-moved-back']);
    for (const literal of ['{number}', '{identifier}', '[{identifier}:{number}] = https://tracker.example.com/{identifier}/{number}']) {
      assert.ok(locale['external-link-rules-description'].includes(literal), `${code}: preserve ${literal}`);
    }
    assert.ok(locale['external-link-identifier-aliases'].includes('TK=Task, IN=Incident'));
    assert.equal(locale['blockly-MATH_ADDITION_SYMBOL_ARIA'], 'plus');
    assert.notEqual(locale['move-selection-before'], locale['move-selection-after']);
  }
  console.log('German source keys, tokens, regional spelling and planning/recovery prose verified');
})().catch(error => { console.error(error); process.exitCode = 1; });
