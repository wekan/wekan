'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { translationTokens } = require('../releases/translations/placeholder-tokens.mjs');
const read = code => JSON.parse(fs.readFileSync(path.join(__dirname, '../imports/i18n/data', `${code}.i18n.json`), 'utf8'));
const en = read('en');
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
for (const code of ['lld', 'hsb', 'szl', 'wuu-Hans']) {
const locale = read(code);
assert.deepEqual(Object.keys(locale), Object.keys(en));
for (const key of keys) {
  assert.ok(locale[key]?.trim(), key);
  assert.notEqual(locale[key], en[key], `${key}: translated`);
  assert.deepEqual(translationTokens(locale[key]), translationTokens(en[key]), `${key}: exact placeholders`);
}
// Preserve retry and cancellation limits in both languages.
if (code === 'lld') {
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
} else if (code === 'hsb') {
  assert.match(locale['activity-recovery-description'], /ženje aktiwitu znowa njewutworja/);
  assert.match(locale['activity-recovery-cancel-confirm'], /njeda so pokročować/);
  assert.match(locale['activity-recovery-cancel-confirm'], /čakanskim rynku.*doručene zdźělenki so njewotwołaja/);
  assert.match(locale['activity-recovery-failed'], /dźěło je so wobchowało/);
  assert.match(locale['activity-recovery-denied'], /doručenje hižo njedowoleja/);
  assert.match(locale['rule-email-recovery-description'], /njewospjetuje ani njepřetorhuje/);
  assert.notEqual(locale['activity-recovery-pause'], locale['activity-recovery-cancel']);
  assert.notEqual(locale['email-failure-smtp-temporary'], locale['email-failure-smtp-rejected']);
  assert.notEqual(locale['rule-email-recovery-unconfirmed'], locale['rule-email-recovery-sent']);
 } else if (code === 'szl') {
  assert.match(locale['activity-recovery-description'], /nigdy niy tworzi aktywności ôd nowa/);
  assert.match(locale['activity-recovery-cancel-confirm'], /niy idzie wznowić/);
  assert.match(locale['activity-recovery-cancel-confirm'], /E-maile już we kolejce.*niy bydōm cofniynte/);
  assert.match(locale['activity-recovery-failed'], /robota ôstała zachowanŏ/);
  assert.match(locale['activity-recovery-denied'], /już niy pozwŏlajōm/);
  assert.match(locale['rule-email-recovery-description'], /niy ponŏwiŏ ani niy anuluje/);
  assert.notEqual(locale['activity-recovery-pause'], locale['activity-recovery-cancel']);
  assert.notEqual(locale['email-failure-smtp-temporary'], locale['email-failure-smtp-rejected']);
  assert.notEqual(locale['rule-email-recovery-unconfirmed'], locale['rule-email-recovery-sent']);
 } else {
  assert.match(locale['activity-recovery-description'], /再试绝勿会重新建立活动/);
  assert.match(locale['activity-recovery-cancel-confirm'], /取消以后勿能恢复/);
  assert.match(locale['activity-recovery-cancel-confirm'], /排进队列个邮件.*送达个通知勿会撤回/);
  assert.match(locale['activity-recovery-failed'], /工作保留下来哉/);
  assert.match(locale['activity-recovery-denied'], /已经勿允许发送哉/);
  assert.match(locale['rule-email-recovery-description'], /勿会重新尝试或者取消发送/);
  assert.notEqual(locale['activity-recovery-pause'], locale['activity-recovery-cancel']);
  assert.notEqual(locale['email-failure-smtp-temporary'], locale['email-failure-smtp-rejected']);
  assert.notEqual(locale['rule-email-recovery-unconfirmed'], locale['rule-email-recovery-sent']);
}
}
console.log('Ladin, Upper Sorbian, Silesian and Wu notification translations: 46 messages each passed');
