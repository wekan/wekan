// The completed catalog predates newer features; keep its no-regression gate.
// Full translation work remains visible through fill-translations.mjs --list.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const readLocale = code => JSON.parse(fs.readFileSync(
  path.join(root, `imports/i18n/data/${code}.i18n.json`),
  'utf8',
));
const english = readLocale('en');
const aromanian = readLocale('rup');
const { translationTokens: tokens } = require('../releases/translations/placeholder-tokens.mjs');
const tags = value => [...value.matchAll(/<\/?[A-Za-z][^>]*>/g)]
  .map(([tag]) => tag).sort();

const fillResult = spawnSync(process.execPath, [
  path.join(root, 'releases/translations/fill-translations.mjs'),
  '--completed-catalog', '--list',
  'rup',
], { cwd: root, encoding: 'utf8' });
assert.equal(fillResult.status, 0, fillResult.stderr);
assert.equal(Object.keys(JSON.parse(fillResult.stdout)).length, 0,
  'Aromanian completed baseline has no regressed English placeholders');
assert.deepEqual(Object.keys(aromanian), Object.keys(english),
  'Aromanian keys retain English source order');

for (const [key, value] of Object.entries(aromanian)) {
  assert.equal(typeof value, 'string', `${key}: Aromanian value is text`);
  assert.deepEqual(tokens(value), tokens(english[key]),
    `${key}: locale-wide placeholder inventory`);
  assert.deepEqual(tags(value), tags(english[key]),
    `${key}: locale-wide HTML tag inventory`);
}

// Preserve newer local Aromanian forms: Cunia lists aprochi among accept synonyms
// https://dixionline.net/index.php?inputWord=dixescu
assert.equal(aromanian.accept, 'Aprochi');
assert.equal(aromanian.cancel, 'Anuleadzã');
assert.equal(aromanian.search, 'Caftu');
assert.equal(aromanian.board, 'Tabelã');
assert.equal(aromanian.card, 'Cartã');
assert.equal(aromanian.password, 'Zbor di intrari');
assert.deepEqual(tokens(aromanian['act-deleteCard']),
  ['__board__', '__card__', '__list__', '__swimlane__']);

console.log('aromanianTranslationProgress: historical baseline and source inventories passed');

assert.equal(aromanian['color-magenta'], 'arosh-vinjit',
  'magenta uses the locale-established Aromanian red-violet components');
assert.notEqual(aromanian['color-magenta'], english['color-magenta'],
  'magenta is no longer an English placeholder');
assert.match(aromanian['color-magenta'], new RegExp(
  `^${aromanian['color-red']}-${aromanian['color-purple']}$`),
  'magenta stays composed from the current red and purple labels');

const scrumLabelBatch = [
  "board-view-product-backlog",
  "board-view-sprints",
  "board-view-sprint-report",
  "board-view-velocity",
  "scrum-settings",
  "scrum-product-owner",
  "scrum-master",
  "scrum-developers",
  "scrum-working-days",
  "scrum-enabled",
  "scrum-product-goal",
  "scrum-definition-of-done",
  "scrum-estimate-source",
  "scrum-estimate-unit",
  "scrum-completion-policy",
  "scrum-source-poker",
  "scrum-source-customField",
  "scrum-policy-dueComplete",
  "scrum-policy-doneLists",
  "scrum-sprints",
  "scrum-sprint",
  "scrum-start-sprint",
  "scrum-close-sprint",
  "scrum-cancel-sprint",
  "scrum-rollover-sprint",
  "scrum-cancel-reason",
  "scrum-product-backlog",
  "scrum-edit-sprint",
  "scrum-sprint-goal",
  "scrum-capacity",
  "scrum-new-sprint",
  "scrum-releases",
  "scrum-release",
  "scrum-release-scope",
  "scrum-select-sprint",
  "scrum-backlog",
  "scrum-estimate",
  "scrum-backlog-rank",
  "scrum-issue-type",
  "scrum-acceptance-criteria",
  "scrum-events",
  "scrum-event-kind",
  "scrum-timebox",
  "scrum-notes",
  "scrum-event-planning",
  "scrum-event-daily",
  "scrum-event-review",
  "scrum-event-retrospective",
  "scrum-committed",
  "scrum-completed",
  "scrum-added",
  "scrum-removed",
  "scrum-incomplete",
  "scrum-total",
  "scrum-state-planned",
  "scrum-state-active",
  "scrum-state-closed",
  "scrum-state-cancelled",
  "scrum-unknown-estimate",
  "scrum-past-sprints",
  "scrum-list-category",
  "scrum-swimlane-purpose",
  "scrum-category-backlog",
  "scrum-category-todo",
  "scrum-category-doing",
  "scrum-category-done",
  "scrum-state-released",
  "scrum-released-at",
  "scrum-follow-up-cards",
  "scrum-import-reference-omitted",
  "scrum-resume-close",
  "scrum-daily-truncated",
  "scrum-observed-scope"
];
for (const key of scrumLabelBatch) {
  assert.ok(aromanian[key]?.trim(), key);
  assert.notEqual(aromanian[key], english[key], key);
  assert.ok(!/[\u0400-\u04ff]/u.test(aromanian[key]), `${key}: no Cyrillic lookalikes`);
}
assert.equal(aromanian['board-view-product-backlog'], aromanian['scrum-product-backlog']);
assert.equal(aromanian['board-view-sprints'], aromanian['scrum-sprints']);
assert.equal(aromanian['scrum-category-done'], aromanian['scrum-completed']);
assert.notEqual(aromanian['scrum-completed'], aromanian['scrum-incomplete']);
assert.equal(new Set(['planned','active','closed','cancelled','released']
  .map(state => aromanian[`scrum-state-${state}`])).size, 5);
assert.equal(new Set(['start','close','cancel']
  .map(action => aromanian[`scrum-${action}-sprint`])).size, 3);
assert.match(aromanian['scrum-total'], /__count__.*__estimate__.*__unknown__/);
assert.match(aromanian['scrum-daily-truncated'], /366/);
assert.match(aromanian['scrum-timebox'], /minuti/);

for (const key of Object.keys(english).filter(key => key.startsWith('scrum-'))) {
  assert.ok(aromanian[key]?.trim(), key);
  assert.notEqual(aromanian[key], english[key], `${key}: Scrum prose remains English`);
}
for (const key of ['scrum-daily-observations-help','scrum-daily-observations-export-help']) {
  assert.match(aromanian[key], /UTC/);
  assert.match(aromanian[key], /[Dd]zãlili cari lipsescu nu suntu bãgati/);
  assert.match(aromanian[key], /nu scriu cafi alãxiri/);
  assert.match(aromanian[key], /nicunuscuti nu suntu zero/);
}
assert.match(aromanian['scrum-report-help'], /unitãtsili sh-regulili.*idhii/);
assert.match(aromanian['scrum-confirm-cancel'], /armãn ligati.*pãnã/);
assert.match(aromanian['scrum-confirm-close'], /nibitisiti.*destinatsia aleasã/);
assert.match(aromanian['scrum-history-checkpoint-hint'], /nitsi un altu nu alãxi/);
assert.match(aromanian['scrum-history-checkpoint-hint'], /nu alãxeashti nitsi un registru/);
assert.notEqual(aromanian['scrum-history-checkpoint-rollback'],
  aromanian['scrum-history-checkpoint-discard']);
assert.deepEqual(tokens(aromanian['scrum-history-checkpoint-counts']),
  ['__applied__','__conflicted__','__pending__','__total__']);

const recoveryBatch = [
  "email-failure-smtp-temporary",
  "email-failure-smtp-rejected",
  "email-failure-smtp-authentication",
  "email-failure-smtp-configuration",
  "email-failure-recipient-unavailable",
  "email-failure-delivery-unconfirmed",
  "email-failure-acknowledgement-failed",
  "email-failure-delivery-failed",
  "email-failure-retry-limit",
  "activity-recovery-heading",
  "activity-recovery-description",
  "activity-recovery-empty",
  "activity-recovery-unavailable",
  "activity-recovery-retry",
  "activity-recovery-retrying",
  "activity-recovery-status-pending",
  "activity-recovery-status-preparing",
  "activity-recovery-status-processing",
  "activity-recovery-status-missing",
  "activity-recovery-status-changed",
  "activity-recovery-status-invalid",
  "activity-recovery-status-inconsistent",
  "activity-recovery-busy",
  "activity-recovery-denied",
  "activity-recovery-source-unavailable",
  "activity-recovery-disabled",
  "activity-recovery-failed",
  "activity-recovery-pause",
  "activity-recovery-resume",
  "activity-recovery-paused",
  "activity-recovery-control-conflict",
  "activity-recovery-control-failed",
  "activity-recovery-status-cancelled",
  "activity-recovery-cancel",
  "activity-recovery-cancel-confirm",
  "rule-email-recovery-unavailable"
];
for (const key of recoveryBatch) {
  assert.ok(aromanian[key]?.trim(), key);
  assert.notEqual(aromanian[key], english[key], key);
}
assert.match(aromanian['email-failure-smtp-temporary'], /temporar/);
assert.match(aromanian['email-failure-smtp-rejected'], /permanent/);
assert.match(aromanian['activity-recovery-description'], /nu adarã vãrnãoarã iara/);
assert.match(aromanian['activity-recovery-source-unavailable'], /Nu s-adarã iara nitsiva/);
assert.match(aromanian['activity-recovery-failed'], /Lucrul tsi ashteaptã fu pãstrat/);
assert.match(aromanian['activity-recovery-cancel-confirm'], /nu poati s-continueadzã iara/);
assert.match(aromanian['activity-recovery-cancel-confirm'], /nu s-toarnã nãpoi/);
assert.equal(new Set(['pause','resume','cancel'].map(action =>
  aromanian[`activity-recovery-${action}`])).size, 3);
