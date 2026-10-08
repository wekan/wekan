// The completed catalog predates newer features; keep its no-regression gate.
// Full translation work remains visible through fill-translations.mjs --list.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const fillScript = path.join(root, 'releases/translations/fill-translations.mjs');
const result = spawnSync(process.execPath, [fillScript, '--completed-catalog', '--list', 'gv'], {
  cwd: root,
  encoding: 'utf8',
});
assert.equal(result.status, 0, result.stderr);
const remaining = JSON.parse(result.stdout);
assert.equal(Object.keys(remaining).length, 0);

const english = JSON.parse(fs.readFileSync(path.join(root, 'imports/i18n/data/en.i18n.json'), 'utf8'));
const manx = JSON.parse(fs.readFileSync(path.join(root, 'imports/i18n/data/gv.i18n.json'), 'utf8'));
const { translationTokens: tokens } = require('../releases/translations/placeholder-tokens.mjs');
const tags = (value) => [...value.matchAll(/<\/?[A-Za-z][^>]*>/g)].map(([tag]) => tag).sort();

for (const [key, value] of Object.entries(manx)) {
  if (value !== english[key]) assert.deepEqual(tokens(value), tokens(english[key]), key);
  assert.deepEqual(tags(value), tags(english[key]), key);
}

assert.equal(manx.accept, 'Gow');
assert.match(manx['act-createBoard'], /boayrd/i);
assert.match(manx['act-createCard'], /kaart/i);

const scrumBatch = ["board-view-product-backlog", "board-view-sprints", "board-view-sprint-report", "board-view-velocity", "scrum-settings", "scrum-product-owner", "scrum-master", "scrum-developers", "scrum-working-days", "scrum-enabled", "scrum-product-goal", "scrum-definition-of-done", "scrum-estimate-source", "scrum-estimate-unit", "scrum-completion-policy", "scrum-source-poker", "scrum-source-customField", "scrum-policy-dueComplete", "scrum-policy-doneLists", "scrum-sprints", "scrum-sprint", "scrum-start-sprint", "scrum-close-sprint", "scrum-cancel-sprint", "scrum-rollover-sprint", "scrum-cancel-reason", "scrum-product-backlog", "scrum-edit-sprint", "scrum-sprint-goal", "scrum-capacity", "scrum-new-sprint", "scrum-releases", "scrum-release", "scrum-select-sprint", "scrum-backlog", "scrum-backlog-help", "scrum-estimate", "scrum-backlog-rank", "scrum-issue-type", "scrum-acceptance-criteria", "scrum-events", "scrum-event-kind", "scrum-timebox", "scrum-notes", "scrum-event-planning", "scrum-event-daily", "scrum-event-review", "scrum-event-retrospective", "scrum-committed", "scrum-completed", "scrum-added", "scrum-removed", "scrum-incomplete", "scrum-no-closed-sprints", "scrum-total", "scrum-state-planned", "scrum-state-active", "scrum-state-closed", "scrum-state-cancelled", "scrum-unknown-estimate", "scrum-past-sprints", "scrum-list-category", "scrum-swimlane-purpose", "scrum-category-backlog", "scrum-category-todo", "scrum-category-doing", "scrum-category-done", "scrum-state-released", "scrum-released-at", "scrum-follow-up-cards", "scrum-import-reference-omitted"];
for (const key of scrumBatch) {
  assert.ok(manx[key]?.trim(), key);
  assert.notEqual(manx[key], english[key], key);
}
assert.deepEqual(Object.keys(manx), Object.keys(english));
assert.deepEqual(tokens(manx['scrum-total']), ['__count__', '__estimate__', '__unknown__']);
assert.deepEqual(tokens(manx['scrum-import-reference-omitted']), ['__reference__']);
assert.notEqual(manx['scrum-close-sprint'], manx['scrum-cancel-sprint']);
assert.notEqual(manx['scrum-completed'], manx['scrum-incomplete']);
assert.match(manx['scrum-timebox'], /mynnidyn/);
assert.equal(manx['scrum-product-backlog'], manx['board-view-product-backlog']);
assert.equal(manx['scrum-sprints'], manx['board-view-sprints']);
assert.equal(new Set(['planned', 'active', 'closed', 'cancelled'].map(state => manx['scrum-state-' + state])).size, 4);

const recoveryBatch = ["email-failure-smtp-temporary", "email-failure-smtp-rejected", "email-failure-smtp-authentication", "email-failure-smtp-configuration", "email-failure-recipient-unavailable", "email-failure-delivery-unconfirmed", "email-failure-acknowledgement-failed", "email-failure-delivery-failed", "email-failure-retry-limit", "activity-recovery-heading", "activity-recovery-description", "activity-recovery-empty", "activity-recovery-unavailable", "activity-recovery-retry", "activity-recovery-retrying", "activity-recovery-status-pending", "activity-recovery-status-preparing", "activity-recovery-status-processing", "activity-recovery-status-missing", "activity-recovery-status-changed", "activity-recovery-status-invalid", "activity-recovery-status-inconsistent", "activity-recovery-busy", "activity-recovery-denied", "activity-recovery-source-unavailable", "activity-recovery-disabled", "activity-recovery-failed", "activity-recovery-pause", "activity-recovery-resume", "activity-recovery-paused", "activity-recovery-control-conflict", "activity-recovery-control-failed", "activity-recovery-status-cancelled", "activity-recovery-cancel", "activity-recovery-cancel-confirm", "rule-email-recovery-unavailable"];
for (const key of recoveryBatch) assert.notEqual(manx[key], english[key], key);
assert.match(manx['email-failure-smtp-temporary'], /shallidagh/);
assert.match(manx['email-failure-smtp-rejected'], /beayn/);
assert.match(manx['activity-recovery-description'], /Cha jean.*chroo reesht rieau/);
assert.match(manx['activity-recovery-cancel-confirm'], /dy beayn.*Cha nod.*Cha bee.*er nyn goyrt er ash/);
assert.match(manx['activity-recovery-failed'], /er ny reayll/);
assert.notEqual(manx['activity-recovery-status-missing'], manx['activity-recovery-status-changed']);
assert.notEqual(manx['activity-recovery-pause'], manx['activity-recovery-cancel']);

const syncBatch = ["sync-conflict-heading", "sync-conflict-hint", "sync-conflict-local", "sync-conflict-keep-local", "sync-conflict-use-source", "sync-conflict-refresh", "sync-conflict-review-complete", "sync-conflict-duplicate", "sync-conflict-keep-mapping", "sync-conflict-detach", "sync-conflict-detach-hint", "sync-conflict-archive", "sync-conflict-archive-hint", "sync-conflict-keep-card-local", "sync-conflict-creation", "sync-conflict-creation-hint", "sync-conflict-create-replacement", "sync-preview-button", "sync-preview-heading", "sync-preview-saved", "sync-preview-unavailable", "sync-preview-blocked", "sync-preview-create", "sync-preview-update", "sync-preview-archive", "sync-preview-baseline", "sync-preview-truncated", "sync-preview-omissions", "sync-preview-scope", "sync-preview-excluded", "sync-preview-unmapped", "sync-preview-parser-warnings", "sync-preview-parser-unsupported", "sync-source-heading", "sync-source-scope", "sync-source-unmapped", "sync-source-excluded", "sync-source-converted", "sync-source-fallback", "sync-source-excluded-item", "sync-source-occurrences", "sync-source-truncated", "sync-source-omitted", "sync-report-button", "sync-report-retention", "sync-report-partial", "sync-report-unfinished", "sync-report-failed", "sync-report-completed", "sync-report-completed-with-warnings", "sync-report-skipped", "sync-report-review-only", "sync-report-unavailable", "sync-report-empty", "sync-recovery-heading", "sync-recovery-description", "sync-recovery-unavailable", "sync-recovery-all", "sync-estimate-field", "sync-estimate-field-hint", "sync-original-time", "sync-remaining-time", "sync-time-estimate-hint"];
for (const key of syncBatch) assert.notEqual(manx[key], english[key], key);
assert.match(manx['sync-conflict-hint'], /Cha nel red erbee.*gys coarys y vun/);
assert.match(manx['sync-conflict-archive-hint'], /Cha nel ny fo-chaartyn.*gaghlaa/);
assert.match(manx['sync-conflict-creation-hint'], /kaart noa cheddin/);
assert.match(manx['sync-report-retention'], /20.*30 laa/);
assert.match(manx['sync-preview-truncated'], /100/);
assert.match(manx['sync-source-truncated'], /100/);
assert.match(manx['sync-estimate-field-hint'], /lhiggey shaghey.*null.*dolley magh/);
assert.match(manx['sync-time-estimate-hint'], /un vagher.*ny lomarcan/);
assert.match(manx['sync-recovery-description'], /cha nod.*toshiaght reesht.*cur caghlaaghyn er ash/);
assert.notEqual(manx['sync-conflict-keep-local'], manx['sync-conflict-use-source']);
