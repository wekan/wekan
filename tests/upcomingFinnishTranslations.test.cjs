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
  "stuck-sync-operation-failed"
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
