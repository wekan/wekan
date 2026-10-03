'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { translationTokens } = require('../releases/translations/placeholder-tokens.mjs');
const read = code => JSON.parse(fs.readFileSync(path.join(__dirname, '../imports/i18n/data', `${code}.i18n.json`), 'utf8'));
const en = read('en');
const locale = read('lld');
const keys = [
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
  "rule-email-recovery-heading",
  "rule-email-recovery-description",
  "rule-email-recovery-all",
  "rule-email-recovery-unconfirmed",
  "rule-email-recovery-sent",
  "rule-email-recovery-invalid",
  "rule-email-recovery-identifiers",
  "rule-email-recovery-started",
  "rule-email-recovery-finished",
  "rule-email-recovery-empty",
  "rule-email-recovery-unavailable"
];
assert.deepEqual(Object.keys(locale), Object.keys(en));
for (const key of keys) {
  assert.ok(locale[key]?.trim(), key);
  assert.notEqual(locale[key], en[key], `${key}: translated`);
  assert.deepEqual(translationTokens(locale[key]), translationTokens(en[key]), `${key}: exact placeholders`);
}
// Preserve limits of retry, cancellation and reports; these are operational guidance.
assert.match(locale['activity-recovery-description'], /ne creëia mai danüef na atività/);
assert.match(locale['activity-recovery-cancel-confirm'], /ne se pò nia continué do/);
assert.match(locale['activity-recovery-cancel-confirm'], /e-mail bele tla coa.*notificazions bele manedes ne vën nia retirédes/);
assert.match(locale['activity-recovery-failed'], /laour che speta é unì mantenì/);
assert.match(locale['activity-recovery-denied'], /ne permet nia plu l invié/);
assert.match(locale['rule-email-recovery-description'], /ne prova nia danüef y ne anulea nia l invié/);
assert.notEqual(locale['activity-recovery-pause'], locale['activity-recovery-cancel']);
assert.notEqual(locale['email-failure-smtp-temporary'], locale['email-failure-smtp-rejected']);
assert.notEqual(locale['rule-email-recovery-unconfirmed'], locale['rule-email-recovery-sent']);
console.log('Ladin notification translations: 46 messages passed');
