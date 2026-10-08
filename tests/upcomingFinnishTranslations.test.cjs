// The completed catalog predates newer features; keep its no-regression gate.
// Full translation work remains visible through fill-translations.mjs --list.
'use strict';

// The Upcoming release completes the Finnish Office and API report strings.
// Keep every report key translated while preserving product and protocol names.
// Run: node tests/upcomingFinnishTranslations.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const readLanguage = code => JSON.parse(fs.readFileSync(
  path.join(ROOT, 'imports/i18n/data', `${code}.i18n.json`),
  'utf8',
));
const english = readLanguage('en');
const finnish = readLanguage('fi');
const reportKeys = Object.keys(english).filter(key =>
  key === 'officeReportTitle'
  || key === 'apiReportTitle'
  || key.startsWith('office-')
  || key.startsWith('api-report-')
  || key.startsWith('api-first-')
  || key.startsWith('api-last-')
  || key === 'api-endpoint'
  || key === 'api-calls'
  || key === 'api-no-calls');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

console.log('upcomingFinnishTranslations:');

test('every Office and API report key exists in Finnish', () => {
  assert.strictEqual(reportKeys.length, 17, 'update the expected report-key inventory intentionally');
  for (const key of reportKeys) {
    assert.strictEqual(typeof finnish[key], 'string', `${key} is missing`);
    assert.ok(finnish[key].trim(), `${key} is empty`);
  }
});

test('none of the report prose remains the English placeholder (negative)', () => {
  const intentionallyUniversal = new Set(['apiReportTitle', 'api-endpoint']);
  for (const key of reportKeys) {
    if (!intentionallyUniversal.has(key)) {
      assert.notStrictEqual(finnish[key], english[key], `${key} is still English`);
    }
  }
});

test('REST API and WITH_API stay recognizable in translated descriptions', () => {
  assert.match(finnish['api-report-desc'], /REST API/);
  assert.match(finnish['api-no-calls'], /REST API/);
  assert.match(finnish['api-no-calls'], /WITH_API=true/);
});

console.log(`\nupcomingFinnishTranslations: ${passed} tests passed`);

(async () => {
  const { translationTokens } = await import('../releases/translations/placeholder-tokens.mjs');
  test('Finnish preserves source key order and interpolation tokens', () => {
    assert.deepStrictEqual(Object.keys(finnish), Object.keys(english));
    for (const key of Object.keys(english)) {
      assert.deepStrictEqual(translationTokens(finnish[key]), translationTokens(english[key]), key);
    }
  });
  test('filters, Scrum, sync and notification recovery have Finnish prose', () => {
    for (const key of ['filter-column-age-hint', 'scrum-total',
      'scrum-import-reference-omitted', 'sync-preview-saved',
      'activity-recovery-busy', 'due-reminder-heading', 'saml-login-not-started']) {
      assert.ok(finnish[key]?.trim(), key);
      assert.notStrictEqual(finnish[key], english[key], key);
    }
  });
  test('only reviewed product names and math symbols remain unchanged', () => {
    const { execFileSync } = require('node:child_process');
    const missing = JSON.parse(execFileSync(process.execPath,
      ['releases/translations/fill-translations.mjs', '--completed-catalog', '--list', 'fi'],
      { cwd: ROOT, encoding: 'utf8' }));
    assert.deepStrictEqual(missing, {});
    assert.strictEqual(finnish['blockly-MAC_OS'], 'macOS');
    assert.strictEqual(finnish['blockly-MATH_TRIG_COS'], 'cos');
    assert.notStrictEqual(finnish['blockly-MATH_ADDITION_SYMBOL_ARIA'],
      english['blockly-MATH_ADDITION_SYMBOL_ARIA']);
  });
})().catch(error => { console.error(error); process.exitCode = 1; });

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

test('new import, assignment, login and recovery messages are translated', () => {
  for (const key of pendingKeys) {
    assert.ok(finnish[key]?.trim(), key);
    assert.notStrictEqual(finnish[key], english[key], key);
  }
});

test('recovery retains applied changes but never writes the remainder', () => {
  assert.match(finnish['stuck-sync-operation-discard-confirm'], /Jo tehdyt muutokset säilyvät/);
  assert.match(finnish['stuck-sync-operation-discard-confirm'], /ei koskaan kirjoiteta/);
  assert.match(finnish['stuck-sync-operation-description'], /seuraava synkronointi vertaa listaa uudelleen sen lähteeseen/);
  assert.match(finnish['stuck-sync-operation-replayable-now'], /ei voi hylätä/);
  assert.match(finnish['stuck-sync-operation-replayable'], /ei hylätty/);
  assert.match(finnish['stuck-sync-operation-truncated'], /50 vanhinta/);
});

test('configuration names and multi-release selection remain precise', () => {
  for (const name of ['LDAP_BACKGROUND_SYNC_IMPORT_NEW_USERS',
    'LDAP_BACKGROUND_SYNC_KEEP_EXISTANT_USERS_UPDATED']) {
    assert.ok(finnish['ldap-sync-now-nothing'].includes(name), name);
  }
  assert.match(finnish['scrum-releases-select-help'], /useaan julkaisuun/);
  assert.match(finnish['scrum-releases-select-help'], /Ctrl/);
  assert.match(finnish['scrum-releases-select-help'], /Cmd/);
  assert.match(finnish['scrum-releases-select-help'], /kaikista julkaisuista/);
});

test('planning import and recovery choices retain their meaning and syntax', () => {
  assert.match(finnish['scrum-import-into-board-hint'], /ei.*koskaan luoda kaksoiskappaleita/);
  assert.match(finnish['scrum-import-into-board-hint'], /tunnisteen tai kortin numeron ja otsikon/);
  assert.match(finnish['scrum-import-card-on-another-board'], /jätettiin ennalleen/);
  assert.match(finnish['scrum-import-sprint-finished'], /ei siirretty/);
  assert.match(finnish['sync-planning-hint'], /ensin lähdetunnisteen ja sitten nimen/);
  assert.match(finnish['sync-planning-hint'], /ensimmäinen synkronointi koskaan poista/);
  assert.match(finnish['interrupted-import-description'], /ei voi jatkaa/);
  assert.match(finnish['interrupted-import-description'], /myös tuonnin jälkeen lisätyt tiedot/);
  assert.match(finnish['interrupted-import-keep-confirm'], /Mitään ei poisteta/);
  assert.match(finnish['interrupted-import-discard-confirm'], /poistetaan pysyvästi/);
  assert.match(finnish['interrupted-import-truncated'], /50 vanhinta/);
  assert.match(finnish['interrupted-import-foreign-board'], /sitä ei muutettu/);
  assert.match(finnish['scrum-history-checkpoint-hint'], /vain, jos kukaan muu ei/);
  assert.match(finnish['scrum-history-checkpoint-hint'], /muuttamatta tietueita/);
  assert.match(finnish['scrum-history-checkpoint-discard-confirm'], /jo kirjoittamat muutokset/);
  assert.notStrictEqual(finnish['r-moved-forward'], finnish['r-moved-back']);
  for (const literal of ['{number}', '{identifier}', '[{identifier}:{number}] = https://tracker.example.com/{identifier}/{number}']) {
    assert.ok(finnish['external-link-rules-description'].includes(literal), literal);
  }
  assert.ok(finnish['external-link-identifier-aliases'].includes('TK=Task, IN=Incident'));
});
