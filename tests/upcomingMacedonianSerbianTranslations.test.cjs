'use strict';

// The Upcoming release completes Macedonian and Serbian Office/API reports.
// Run: node tests/upcomingMacedonianSerbianTranslations.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const readLanguage = code => JSON.parse(fs.readFileSync(
  path.join(ROOT, 'imports/i18n/data', `${code}.i18n.json`),
  'utf8',
));
const english = readLanguage('en');
const languages = ['mk', 'sr'].map(readLanguage);
const translatedKeys = [
  'officeReportTitle',
  'office-report-desc',
  'office-logins',
  'office-first-seen',
  'office-last-seen',
  'office-shared',
  'office-no-results',
  'api-report-desc',
  'api-calls',
  'api-first-called',
  'api-last-called',
  'api-no-calls',
];

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

test('both languages translate every report placeholder', () => {
  for (const language of languages) {
    for (const key of translatedKeys) {
      assert.notStrictEqual(language[key], english[key], `${key} is still English`);
    }
  }
});

test('both languages use Cyrillic report prose', () => {
  for (const language of languages) {
    for (const key of translatedKeys) {
      assert.match(language[key], /\p{Script=Cyrillic}/u, `${key} lacks Cyrillic text`);
    }
  }
});

test('the two languages retain distinct established vocabulary', () => {
  for (const key of translatedKeys) {
    assert.notStrictEqual(languages[0][key], languages[1][key], `${key} was copied`);
  }
});

test('technical tokens and universal API labels remain recognizable', () => {
  for (const language of languages) {
    assert.match(language['office-report-desc'], /IPv4/);
    assert.match(language['office-report-desc'], /IPv6/);
    assert.match(language['api-report-desc'], /REST API/);
    assert.match(language['api-no-calls'], /REST API/);
    assert.match(language['api-no-calls'], /WITH_API=true/);
    assert.strictEqual(language.apiReportTitle, 'API');
    assert.strictEqual(language['api-endpoint'], 'API');
  }
});

console.log(`\nupcomingMacedonianSerbianTranslations: ${passed} tests passed`);

const serbianRecovery = readLanguage('sr');
const { translationTokens } = require('../releases/translations/placeholder-tokens.mjs');
const recoveryKeys = Object.keys(english).filter(key => key.startsWith('stuck-sync-operation-'));
assert.equal(recoveryKeys.length, 23);
for (const key of recoveryKeys) {
  assert.notEqual(serbianRecovery[key], english[key], key);
  assert.deepEqual(translationTokens(serbianRecovery[key]), translationTokens(english[key]), key);
}
assert.match(serbianRecovery['stuck-sync-operation-description'], /већ примењене промене остају/);
assert.match(serbianRecovery['stuck-sync-operation-description'], /преостале сачуване промене никада се не уписују/);
assert.match(serbianRecovery['stuck-sync-operation-reason-access-denied'], /право уписа у цео део поступка/);
assert.match(serbianRecovery['stuck-sync-operation-replayable-now'], /не може одбацити/);
assert.match(serbianRecovery['stuck-sync-operation-not-stuck'], /не може одбацити/);
assert.match(serbianRecovery['stuck-sync-operation-truncated'], /50 најстаријих/);
assert.match(serbianRecovery['stuck-sync-operation-busy'], /управо синхронизује/);

const interruptedImportKeys = Object.keys(english).filter(key => key.startsWith('interrupted-import-'));
assert.equal(interruptedImportKeys.length, 25);
for (const key of interruptedImportKeys) {
  assert.notEqual(serbianRecovery[key], english[key], key);
  assert.deepEqual(translationTokens(serbianRecovery[key]), translationTokens(english[key]), key);
}
assert.match(serbianRecovery['interrupted-import-description'], /изворна датотека не чува/);
assert.match(serbianRecovery['interrupted-import-description'], /све што је додато након увоза/);
assert.match(serbianRecovery['interrupted-import-counts'], /__swimlanes__ поступака/);
assert.match(serbianRecovery['interrupted-import-discard-confirm'], /трајно се уклањају/);
assert.match(serbianRecovery['interrupted-import-keep-confirm'], /Ништа се не уклања/);
assert.match(serbianRecovery['interrupted-import-foreign-board'], /нису промењени/);
assert.match(serbianRecovery['interrupted-import-truncated'], /50 најстаријих/);
assert.match(serbianRecovery['interrupted-import-scrum-busy'], /још уписује или опоравља/);

const translatedPlanningControls = ["board-announcement", "board-announcement-enabled", "cards-use-list-color", "import-board-instruction-opml", "import-board-instruction-orgmode", "import-board-instruction-todoist", "external-link-rules", "external-link-rules-description", "external-link-identifier-aliases", "read-only-field", "r-moved-forward", "r-moved-back", "r-assignee", "r-add-actinguser-assignee", "r-remove-all-assignees", "ldap-sync-now", "ldap-sync-now-done", "ldap-sync-now-error", "ldap-sync-now-nothing", "oauth-providers-allowed-email-domains", "login-origin-mismatch", "scrum-release-scope", "scrum-releases-select-help", "scrum-import-into-board", "scrum-import-into-board-hint", "scrum-import-preview", "scrum-import-choose-file", "scrum-import-invalid-file", "scrum-import-preview-sprints", "scrum-import-preview-releases", "scrum-import-preview-cards", "scrum-import-preview-nothing", "scrum-import-into-board-done", "scrum-import-card-not-matched", "scrum-import-card-ambiguous", "scrum-import-card-on-another-board", "scrum-import-record-ambiguous", "scrum-import-record-not-imported", "scrum-import-sprint-finished", "sync-planning-sprint", "sync-planning-releases", "sync-planning-fields", "sync-planning-hint", "scrum-history-checkpoint-stuck", "scrum-history-checkpoint-counts", "scrum-history-checkpoint-hint", "scrum-history-checkpoint-rollback", "scrum-history-checkpoint-discard", "scrum-history-checkpoint-discard-confirm", "scrum-history-checkpoint-ask-admin", "login-setting-env-only"];
for (const key of translatedPlanningControls) {
  assert.notEqual(serbianRecovery[key], english[key], key);
  assert.deepEqual(translationTokens(serbianRecovery[key]), translationTokens(english[key]), key);
}
for (const literal of ['TODO', 'DONE', 'SCHEDULED', 'DEADLINE', 'CLOSED']) {
  assert.ok(serbianRecovery['import-board-instruction-orgmode'].includes(literal), literal);
}
for (const literal of ['@labels', 'p1', 'p3', 'CSV']) {
  assert.ok(serbianRecovery['import-board-instruction-todoist'].includes(literal), literal);
}
assert.ok(serbianRecovery['external-link-rules-description'].includes('[{identifier}:{number}] = https://tracker.example.com/{identifier}/{number}'));
assert.ok(serbianRecovery['external-link-identifier-aliases'].includes('TK=Task, IN=Incident'));
for (const literal of ['LDAP_BACKGROUND_SYNC_IMPORT_NEW_USERS', 'LDAP_BACKGROUND_SYNC_KEEP_EXISTANT_USERS_UPDATED']) {
  assert.ok(serbianRecovery['ldap-sync-now-nothing'].includes(literal), literal);
}
assert.match(serbianRecovery['login-origin-mismatch'], /ROOT_URL/);
assert.match(serbianRecovery['sync-planning-hint'], /прва синхронизација никада не уклања/);
assert.match(serbianRecovery['scrum-import-into-board-hint'], /никада се не дуплирају/);
assert.match(serbianRecovery['scrum-history-checkpoint-hint'], /нико други.*није променио/);
assert.match(serbianRecovery['scrum-history-checkpoint-hint'], /не мења записе/);
assert.match(serbianRecovery['login-setting-env-only'], /само за читање/);
