'use strict';
const assert = require('node:assert/strict');
const data = require('../imports/i18n/data/tlh.i18n.json');
const english = require('../imports/i18n/data/en.i18n.json');
const records = require('../releases/translations/audited-corrections.json').filter(row => row.locale === 'tlh');
const tokens = value => (value.match(/__[A-Za-z0-9_]+__|%(?:[0-9]+\$)?[A-Za-z]|%\{[^}]+\}/g) || []).sort();
for (const row of records) {
  assert.equal(data[row.key], row.after);
  assert.deepEqual(tokens(row.after), tokens(english[row.key]), row.key);
}
for (const key of ['board-delete-notice', 'card-delete-pop', 'custom-field-delete-pop', 'delete-board-confirm-popup']) {
  assert.match(data[key], /Qaw'|teqlu'/, `${key}: destructive consequence`);
  assert.match(data[key], /chIl|chIl|laHbe'|ratlhbe'/i, `${key}: loss or inability to undo`);
  assert.doesNotMatch(data[key], /\b(?:werden|löschen|können|Karten|Listen)\b/i);
}
assert.match(data['accounts-lockout-no-locked-users'], /botlu'be'/, 'no users blocked');
assert.match(data['accounts-lockout-all-users-unlocked'], /botHa'lu'pu'/, 'blocking removed');
assert.match(data['app-is-offline'], /De' chIl/, 'refresh data-loss warning remains explicit');
for (const card of JSON.parse(data['copyManyCardsPopup-format'])) {
  assert.deepEqual(Object.keys(card), ['title', 'description']);
  assert.match(card.title, /'echletHom/);
}
assert.ok(data['advanced-filter-description'].includes("Field1 == I\\'m"));
// KLI Gregorian mapping: Saturday has two synonyms; Sunday is numbered day one.
// https://www.kli.org/duolingo/say-when-an-event-was-2/
assert.equal(data.saturday, 'ghInjaj');
assert.equal(data.sunday, "jaj wa'");
assert.notEqual(data.saturday, data.sunday, 'Sunday must not reuse the Saturday synonym');
console.log(`klingonAuditedTranslations: ${records.length} recorded values, security states and destructive warnings verified`);

// A technical-name retention decision must retain the actual tool name.
assert.equal(data.cron, "Cron");
assert.doesNotMatch(data.cron, /Zeitplan/);
