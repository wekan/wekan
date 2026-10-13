// Check the full current Kannada fill list, including pending features.
// Structural completion does not certify all existing wording.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const fillScript = path.join(root, 'releases/translations/fill-translations.mjs');
const result = spawnSync(process.execPath, [fillScript, '--list', 'kn'], {
  cwd: root,
  encoding: 'utf8',
});
assert.equal(result.status, 0, result.stderr);
const remaining = JSON.parse(result.stdout);
assert.equal(Object.keys(remaining).length, 0);

const english = JSON.parse(fs.readFileSync(
  path.join(root, 'imports/i18n/data/en.i18n.json'), 'utf8'));
const kannada = JSON.parse(fs.readFileSync(
  path.join(root, 'imports/i18n/data/kn.i18n.json'), 'utf8'));
const tokens = (value) => [...value.matchAll(
  /__[A-Za-z0-9_]+__|%[A-Za-z]|%{[A-Za-z0-9]+}|{{[A-Za-z0-9]+}}/g)]
  .map(([token]) => token).sort();
const tags = (value) => [...value.matchAll(/<\/?[A-Za-z][^>]*>/g)]
  .map(([tag]) => tag).sort();

for (const [key, value] of Object.entries(kannada)) {
  if (value !== english[key]) {
    assert.deepEqual(tokens(value), tokens(english[key]), key);
  }
  assert.deepEqual(tags(value), tags(english[key]), key);
}

assert.equal(kannada.accept, 'ಸ್ವೀಕರಿಸಿ');
assert.deepEqual(tokens(kannada['activity-changedTitle']), ['%s', '%s']);
assert.deepEqual(tokens(kannada['act-removeChecklistItem']),
  ['__board__', '__card__', '__checkList__', '__checklistItem__', '__list__',
    '__swimlane__']);
assert.match(kannada['act-createBoard'], /ಫಲಕ/);
assert.equal(kannada['workspace-settings'], 'ಕಾರ್ಯಕ್ಷೇತ್ರದ ಸೆಟ್ಟಿಂಗ್‌ಗಳು');
assert.deepEqual(tokens(kannada['activity-checklist-completed-card']),
  ['__board__', '__card__', '__checklist__', '__list__', '__swimlane__']);
assert.equal(kannada['set-list-width'], 'ಅಗಲವನ್ನು ಹೊಂದಿಸಿ');
assert.equal(kannada['public-boards'], 'ಸಾರ್ವಜನಿಕ ಫಲಕಗಳು');
assert.deepEqual(tokens(kannada['and-n-other-card_plural']), ['__count__']);
assert.deepEqual(tokens(kannada['avatar-too-big']), ['__size__']);
assert.deepEqual(tags(kannada['board-private-info']),
  ['</strong>', '<strong>']);
assert.deepEqual(tokens(
  kannada['board-open-and-move-between-remaining-and-workspaces']),
  ['__workspaces__']);
assert.deepEqual(tags(kannada['board-public-info']),
  ['</strong>', '<strong>']);
assert.equal(kannada['vote-question'], 'ಮತದಾನದ ಪ್ರಶ್ನೆ');
assert.equal(kannada['map-to-existing-user-no-results'],
  'ಹೊಂದುವ ಬಳಕೆದಾರರು ಕಂಡುಬಂದಿಲ್ಲ.');
assert.equal(kannada['font-size-largest'], 'ಅತ್ಯಂತ ದೊಡ್ಡದು');
assert.equal(kannada['color-sky'], 'ಆಕಾಶ ನೀಲಿ');
assert.equal(kannada['read-only'], 'ಓದಲು ಮಾತ್ರ');
assert.deepEqual(tokens(kannada['email-enrollAccount-text']),
  ['__url__', '__user__']);
assert.deepEqual(tokens(kannada['email-invite-text']),
  ['__board__', '__inviter__', '__url__', '__user__']);
assert.equal(kannada['filter-overdue'], 'ಅವಧಿ ಮೀರಿದೆ');
assert.equal(kannada['filter-no-assignee'], 'ನಿಯೋಜಿತರಿಲ್ಲ');
assert.deepEqual(tokens(kannada['import-board-instruction-issues']),
  ['__endpoint__', '__sourceName__']);
assert.equal(kannada['import-trello-zip-failed'], '.zip ಆಮದು ವಿಫಲವಾಗಿದೆ.');
assert.deepEqual(tokens(kannada['leave-board-pop']), ['__boardTitle__']);
assert.equal(kannada['multi-selection'], 'ಬಹು-ಆಯ್ಕೆ');
assert.deepEqual(tokens(kannada['remove-member-pop']),
  ['__boardTitle__', '__name__', '__username__']);
assert.equal(kannada.overtime, 'ಹೆಚ್ಚುವರಿ ಸಮಯ');
assert.equal(kannada['upload-failed'], 'ಅಪ್‌ಲೋಡ್ ವಿಫಲವಾಗಿದೆ');
assert.deepEqual(tokens(kannada['email-invite-register-text']),
  ['__icode__', '__inviter__', '__url__', '__user__']);
assert.equal(kannada.Database, 'ದತ್ತಸಂಚಯ');
assert.equal(kannada['active-org'], 'ಸಕ್ರಿಯ ಸಂಸ್ಥೆ');
assert.deepEqual(tokens(kannada['default-subtasks-board']), ['__board__']);
assert.equal(kannada['r-board-rules'], 'ಫಲಕದ ನಿಯಮಗಳು');
assert.deepEqual(tokens(kannada['r-w-every-day-at']), ['__time__']);
assert.deepEqual(tokens(kannada['r-import-unmapped']), ['__count__']);
assert.equal(kannada['r-trigger'], 'ಪ್ರಚೋದಕ');
assert.equal(kannada['r-d-send-email'], 'ಇಮೇಲ್ ಕಳುಹಿಸಿ');
assert.equal(kannada['r-add-swimlane'], 'ಪಥ ಸೇರಿಸಿ');
assert.deepEqual(tokens(kannada['act-a-dueAt']),
  ['__card__', '__timeOldValue__', '__timeValue__']);
assert.deepEqual(tokens(kannada['act-atUserComment']),
  ['__board__', '__card__', '__comment__', '__list__', '__swimlane__']);
assert.equal(kannada.monday, 'ಸೋಮವಾರ');
assert.equal(kannada['shared-templates'], 'ಹಂಚಿದ ಟೆಂಪ್ಲೇಟ್‌ಗಳು');
assert.deepEqual(tokens(kannada['n-n-of-n-cards-found']),
  ['__end__', '__start__', '__total__']);
assert.deepEqual(tokens(kannada['operator-number-expected']),
  ['__operator__', '__value__']);
assert.equal(kannada['next-page'], 'ಮುಂದಿನ ಪುಟ');
assert.deepEqual(tokens(kannada['globalSearch-instructions-operator-hash']),
  ['__operator_label__', '__operator_label__', '__operator_label_abbrev__']);
assert.deepEqual(tokens(kannada['globalSearch-instructions-operator-due']),
  ['__operator_due__', '__operator_due__', '__predicate_overdue__']);
assert.deepEqual(tokens(kannada['globalSearch-instructions-operator-has']),
  ['__operator_has__', '__predicate_assignee__', '__predicate_attachment__',
    '__predicate_checklist__', '__predicate_description__', '__predicate_due__',
    '__predicate_end__', '__predicate_member__', '__predicate_start__']);
assert.deepEqual(tokens(kannada['globalSearch-instructions-notes-3-2']),
  ['__predicate_month__', '__predicate_quarter__', '__predicate_week__',
    '__predicate_year__']);
assert.deepEqual(tokens(kannada['import-dependencies-done']),
  ['__imported__', '__unmatched__']);
assert.deepEqual(tokens(kannada['custom-field-stringtemplate-format']),
  ['%{value}']);
assert.equal(kannada['recovery-db'], 'ದತ್ತಸಂಚಯ');
assert.equal(kannada['ticket-number'], 'ಟಿಕೆಟ್ ಸಂಖ್ಯೆ');
assert.equal(kannada.copied, 'ನಕಲಿಸಲಾಗಿದೆ!');
assert.equal(kannada['move-storage-fs'], 'ಕಡತ ವ್ಯವಸ್ಥೆ');
assert.deepEqual(tokens(kannada['drag-board-to-workspace']), ['__workspaces__']);
assert.equal(kannada.accessibility, 'ಪ್ರವೇಶಸಾಧ್ಯತೆ');
assert.equal(kannada['cron-jobs'], 'ನಿಗದಿತ ಕೆಲಸಗಳು');
assert.deepEqual(tokens(kannada['database-migration-confirm']), ['__db__']);
assert.deepEqual(tags(kannada['render-links-as-plain-text-description']),
  ['<a href>']);
assert.equal(kannada.backup, 'ಬ್ಯಾಕಪ್');
assert.equal(kannada['backup-now'], 'ಈಗ ಬ್ಯಾಕಪ್ ಮಾಡಿ');
assert.equal(kannada['cloud-connection-success'], 'ಸಂಪರ್ಕ ಯಶಸ್ವಿಯಾಗಿದೆ');
assert.equal(kannada['migration-not-needed'], 'ವಲಸೆ ಅಗತ್ಯವಿಲ್ಲ');
assert.equal(kannada['lost-cards'], 'ಕಳೆದುಹೋದ ಕಾರ್ಡ್‌ಗಳು');
assert.equal(kannada.steps, 'ಹಂತಗಳು');
assert.equal(kannada['overall-progress'], 'ಒಟ್ಟಾರೆ ಪ್ರಗತಿ');
assert.deepEqual(tokens(kannada['repair-broken-cards-done']), ['__fixed__']);
assert.deepEqual(tokens(kannada['repair-broken-cards-done-unfixable']),
  ['__fixed__', '__unfixable__']);
assert.deepEqual(tokens(kannada['globalSearch-instructions-operator-number']),
  ['__operator_number__']);

assert.equal(kannada['attachment-limit-unit-bytes'], 'ಬೈಟ್‌ಗಳು');
assert.equal(kannada['r-d-send-email-to'], 'ಸ್ವೀಕರಿಸುವವರು');
for (const key of ['r-of', 'of']) assert.equal(`1 ${kannada[key]} 10`, '1 / 10');
assert.match(kannada['custom-field-links-hint'], /ಒಂದೇ ಹೆಸರು ಮತ್ತು ಪ್ರಕಾರ/);
assert.match(kannada['custom-field-links-hint'], /ಒಂದೇ ಕಾರ್ಡ್‌ನಲ್ಲಿ ಇರುವ ಕ್ಷೇತ್ರಗಳನ್ನು ಬದಲಾಯಿಸಲಾಗುವುದಿಲ್ಲ/);
assert.match(kannada['custom-field-link-send'], /ಈ ಕಾರ್ಡ್‌ನ ಬದಲಾವಣೆಗಳು ಮುಖ್ಯ ಕಾರ್ಡ್‌ಗೆ/);
assert.match(kannada['custom-field-link-receives'], /ಆ ಕಾರ್ಡ್‌ನ ಬದಲಾವಣೆಗಳು ಈ ಕಾರ್ಡ್‌ಗೆ/);
assert.match(kannada['field-link-not-allowed'], /ಎರಡೂ ಕಾರ್ಡ್‌ಗಳನ್ನು ಸಂಪಾದಿಸಲು.*ಅನುಮತಿ/);
assert.match(kannada['read-only-field'], /ಎಲ್ಲಾ ಸದಸ್ಯರೂ.*ನಿರ್ವಾಹಕರು ಮಾತ್ರ/);
assert.match(kannada['notification-delivery-quiet'], /ಮುಗಿಯುವವರೆಗೆ ಕಾಯಿರಿ/);
assert.match(kannada['webhook-payload-description'], /ಮೇಲಿನ ಹಂತದಿಂದ ಬಂದ ಸೆಟ್ಟಿಂಗ್ ಅನ್ನು ಉಳಿಸುತ್ತದೆ/);
assert.match(kannada['stuck-sync-operation-discard-confirm'], /ಈಗಾಗಲೇ ಅನ್ವಯಿಸಿದ ಬದಲಾವಣೆಗಳು ಉಳಿಯುತ್ತವೆ/);
assert.match(kannada['stuck-sync-operation-discard-confirm'], /ಉಳಿದವುಗಳನ್ನು ಎಂದಿಗೂ ಬರೆಯಲಾಗುವುದಿಲ್ಲ/);
assert.match(kannada['stuck-sync-operation-not-stuck'], /ತ್ಯಜಿಸಲಾಗುವುದಿಲ್ಲ/);
assert.match(kannada['stuck-sync-operation-replayable'], /ತಾನಾಗಿಯೇ ಮುಗಿಯುತ್ತದೆ.*ತ್ಯಜಿಸಲಾಗಿಲ್ಲ/);
assert.match(kannada['interrupted-import-description'], /ಮೂಲ ಕಡತವನ್ನು ಉಳಿಸದಿರುವುದರಿಂದ.*ಮುಂದುವರಿಸಲಾಗುವುದಿಲ್ಲ/);
assert.match(kannada['interrupted-import-description'], /ನಂತರ ಸೇರಿಸಿದವುಗಳೂ ಸೇರಿದಂತೆ/);
assert.match(kannada['interrupted-import-keep-confirm'], /ಯಾವುದನ್ನೂ ತೆಗೆದುಹಾಕಲಾಗುವುದಿಲ್ಲ/);
assert.match(kannada['interrupted-import-discard-confirm'], /ಎಲ್ಲವನ್ನೂ ಶಾಶ್ವತವಾಗಿ ತೆಗೆದುಹಾಕಲಾಗುತ್ತದೆ/);
assert.match(kannada['interrupted-import-foreign-board'], /ರಚಿಸಿಲ್ಲ.*ಬದಲಾಯಿಸಲಾಗಿಲ್ಲ/);
for (const key of ['stuck-sync-operation-truncated', 'interrupted-import-truncated']) assert.match(kannada[key], /ಅತ್ಯಂತ ಹಳೆಯ 50/);
for (const format of ['taiga', 'vikunja', 'notion']) assert.match(kannada['import-board-instruction-' + format], /ಲಗತ್ತುಗಳನ್ನು ಆಮದು ಮಾಡಲಾಗುವುದಿಲ್ಲ/);
assert.match(kannada['import-board-instruction-quire'], /ಕಾಮೆಂಟ್‌ಗಳು ಮತ್ತು ಲಗತ್ತುಗಳು ಇರುವುದಿಲ್ಲ/);
assert.match(kannada['import-board-instruction-plane'], /ವಿವರಣೆಗಳು ಅಥವಾ ಲಗತ್ತುಗಳು ಇರುವುದಿಲ್ಲ.*ಆಮದು ಮಾಡಲಾಗುವುದಿಲ್ಲ/);
for (const format of ['nullboard', 'kanri']) assert.match(kannada['import-board-instruction-' + format], /ಮೊದಲ ಫಲಕವನ್ನು ಆಮದು/);
for (const literal of ['TODO', 'DONE', 'SCHEDULED', 'DEADLINE', 'CLOSED']) assert.ok(kannada['import-board-instruction-orgmode'].includes(literal));
for (const literal of ['Tasklist', 'Task', 'Description', 'Assign to', 'Start date', 'Due date', 'Priority', 'Estimated time', 'Tags', 'Status', '--', '##', '>>']) {
  assert.ok(kannada['import-board-instruction-teamwork'].includes(literal));
}
assert.match(kannada['import-board-instruction-businessmap'], /ಶೀರ್ಷಿಕೆ ಸಾಲನ್ನು ಇಂಗ್ಲಿಷ್‌ಗೆ ಬದಲಾಯಿಸಿ/);
assert.match(kannada['import-board-instruction-redmine'], /My account ನಲ್ಲಿ ಭಾಷೆಯನ್ನು English/);
assert.match(kannada['import-many-boards-hint'], /ಸದಸ್ಯರ ಹೊಂದಾಣಿಕೆಯಿಲ್ಲದೆ/);
assert.match(kannada['import-many-boards-hint'], /ಮೇಲಿನ ಕ್ಷೇತ್ರದ ಬದಲಿಗೆ/);
assert.match(kannada['r-wrike-workflow-note'], /Completed ಅಥವಾ Cancelled.*ಪೂರ್ಣಗೊಂಡಿದೆ.*Active ಅಥವಾ Deferred.*ಅಪೂರ್ಣ/);
for (const literal of ['GET /workflows', 'JSON']) assert.ok(kannada['r-wrike-workflow-note'].includes(literal));
for (const literal of ['LDAP_BACKGROUND_SYNC_IMPORT_NEW_USERS', 'LDAP_BACKGROUND_SYNC_KEEP_EXISTANT_USERS_UPDATED']) assert.ok(kannada['ldap-sync-now-nothing'].includes(literal));
assert.ok(kannada['external-link-rules-description'].includes('[{identifier}:{number}] = https://tracker.example.com/{identifier}/{number}'));
assert.ok(kannada['webhook-payload-field-standard'].includes('WEBHOOKS_ATTRIBUTES'));
assert.match(kannada['login-setting-env-only'], /ಸರ್ವರ್ ಪರಿಸರದಿಂದ ಮಾತ್ರ.*ಓದಲು ಮಾತ್ರ/);
assert.ok(kannada['trello-export-desc'].includes('Swimlane: …'));
assert.match(kannada['trello-export-desc'], /ಮತ್ತೆ ಪಥಗಳಾಗಿ ಬದಲಾಯಿಸುತ್ತದೆ/);
assert.match(kannada['trello-export-warnings'], /ಎಲ್ಲವನ್ನೂ ರಫ್ತು ಮಾಡಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ/);
assert.match(kannada['sandstorm-trello-access-needed'], /ಇಂಟರ್ನೆಟ್ ಪ್ರವೇಶವಿಲ್ಲ.*ಮೊದಲು.*ಅನುಮತಿ/);
assert.match(kannada['sandstorm-trello-access-granted'], /ತಲುಪಬಹುದು/);

const { ruleTriggerCopula } = require('../imports/i18n/ruleGrammar');
for (const tag of ['kn', 'kn-IN', 'kn_IN', 'KN']) assert.equal(ruleTriggerCopula(tag, kannada['r-is']), '');
for (const tag of ['en', 'knight', '', undefined]) assert.equal(ruleTriggerCopula(tag, 'is'), 'is');
for (const key of ['r-added-to', 'r-removed-from', 'r-archived', 'r-unarchived', 'r-completed', 'r-made-incomplete']) {
  const phrase = [kannada['r-when-a-card'], ruleTriggerCopula('kn', kannada['r-is']), kannada[key]].filter(Boolean).join(' ');
  assert.doesNotMatch(phrase, /\bis\b| ಇದೆ /);
  assert.ok(phrase.endsWith(kannada[key]), 'retain the already inflected predicate');
}

(async () => {
  const { translationTokens } = await import('../releases/translations/placeholder-tokens.mjs');
  assert.deepEqual(Object.keys(kannada), Object.keys(english));
  for (const key of Object.keys(english)) assert.deepEqual(translationTokens(kannada[key]), translationTokens(english[key]), key);
  const i18n = require('i18next').createInstance();
  await i18n.init({ lng: 'kn', fallbackLng: 'en', initImmediate: false,
    interpolation: { prefix: '__', suffix: '__', escapeValue: false },
    resources: { en: { translation: english }, kn: { translation: kannada } } });
  assert.equal(i18n.t('notification-group-card', { count: 3, card: 'ಪರೀಕ್ಷೆ' }), 'ಪರೀಕ್ಷೆ ಕಾರ್ಡ್‌ನಲ್ಲಿ 3 ಅಧಿಸೂಚನೆಗಳು');
  assert.equal(i18n.t('stuck-sync-operation-applied', { applied: 0, total: 2 }), '2 ಬದಲಾವಣೆಗಳಲ್ಲಿ 0 ಅನ್ವಯಿಸಲಾಗಿದೆ');
  assert.equal(i18n.t('interrupted-import-state-failed', { stage: 'createCards', error: 'E_TEST' }), 'createCards ಹಂತದಲ್ಲಿ E_TEST ದೋಷದಿಂದ ವಿಫಲವಾಗಿದೆ');
  console.log('Kannada: full fill list, exact tokens, selected meanings, rule copula and runtime interpolation pass');
})().catch(error => { console.error(error); process.exitCode = 1; });
