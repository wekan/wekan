'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const read = code => JSON.parse(fs.readFileSync(path.join(ROOT,
  'imports/i18n/data', `${code}.i18n.json`), 'utf8'));
const english = read('en');
const translated = read('et-EE');
assert.strictEqual(translated['blockly-BACKSPACE_KEY'], 'Tagasilüke');
assert.strictEqual(translated['blockly-SHIFT_KEY'], 'Tõstuklahv');
assert.notStrictEqual(translated['blockly-END_KEY'], translated['end-date']);
for (const key of ['blockly-ALT_KEY', 'blockly-COMMAND_KEY', 'blockly-CONTROL_KEY',
  'blockly-OPTION_KEY', 'blockly-CHROME_OS', 'blockly-LINUX', 'blockly-MAC_OS',
  'blockly-WINDOWS', 'blockly-LOGIC_NULL', 'blockly-MATH_TRIG_ACOS',
  'blockly-MATH_TRIG_ASIN', 'blockly-MATH_TRIG_ATAN', 'blockly-MATH_TRIG_COS',
  'blockly-MATH_TRIG_SIN', 'blockly-MATH_TRIG_TAN', 'scrum-sprint']) {
  assert.strictEqual(translated[key], english[key], `${key}: preserve technical term`);
}
// URL percent encoding is data, not a printf placeholder.
const { translationTokens: inventory } = require('../releases/translations/placeholder-tokens.mjs');
for (const [key, source] of Object.entries(english)) {
  assert.deepStrictEqual(inventory(translated[key] || ''), inventory(source),
    `et-EE:${key} changed a placeholder`);
}
const values = Object.values(translated).join('\n');
assert.doesNotMatch(values, /__(?:manus|kaart|kaardile|loend|nimekiri|laud|tahvel|kutsuja|kasutaja|loe|algus|lõpp|predikaat_)/);
const emailKeys = Object.keys(english).filter(key =>
  /^rule-email-(recovery|resolution|legacy)-/.test(key) || key === 'r-insert-variable');
assert.ok(emailKeys.length >= 55);
for (const key of emailKeys) {
  assert.ok(translated[key]?.trim(), `${key}: missing Estonian text`);
  assert.notStrictEqual(translated[key], english[key], `${key}: English placeholder`);
}
assert.match(translated['rule-email-recovery-resend-confirm'], /kaks korda/);
assert.match(translated['rule-email-legacy-discard-confirm'], /ei saadeta kunagi/);
assert.match(translated['rule-email-legacy-description'], /autoril on endiselt juurdepääs/);
assert.match(translated['rule-email-recovery-actions-hint'], /ei saada.*kunagi ise uuesti/);
for (const key of Object.keys(english).filter(key =>
  /^(filter-(recency|movement-range|date-range|due-|column-age|preset|card-text)|notification-activity-|due-reminder-|map-view-|auto-archive-)/.test(key))) {
  assert.ok(translated[key]?.trim(), `${key}: missing Estonian text`);
  assert.notStrictEqual(translated[key], english[key], `${key}: English placeholder`);
}
for (const token of ['@createdAt', '@receivedAt', '@startAt', '@dueAt', '@endAt', '@listEnteredAt', 'none']) {
  assert.ok(translated['advanced-filter-card-dates-hint'].includes(token), `preserve ${token}`);
}
for (const token of ['{creator}', '{assignees}', '{members}', '{customField:Name}']) {
  assert.ok(translated['r-trigger-vars-hint'].includes(token), `preserve ${token}`);
}
assert.ok(translated['r-vars-people-hint'].includes('{customField:Field name}'));
assert.match(translated['filter-column-age-hint'], /ei nulli/);
assert.match(translated['instance-desc'], /Sisse logimata inimestele seda kunagi ei näidata/);
for (const key of Object.keys(english).filter(key => key.startsWith('scrum-'))) {
  assert.ok(translated[key]?.trim(), `${key}: missing Estonian text`);
  // Sprint has the same spelling in Estonian and English.
  if (key !== 'scrum-sprint') {
    assert.notStrictEqual(translated[key], english[key], `${key}: English placeholder`);
  }
}
assert.match(translated['scrum-total'], /kaarti/);
assert.match(translated['scrum-report-help'], /ei ole nullhinnangud/);
assert.match(translated['scrum-daily-observations-help'], /ei salvesta iga muudatust/);
assert.match(translated['scrum-partial-report'], /ainult praegu sulle määratud kaardid/);
for (const key of Object.keys(english).filter(key =>
  /^sync-(conflict|preview|source|report|recovery|estimate)-/.test(key))) {
  assert.ok(translated[key]?.trim(), `${key}: missing Estonian text`);
  assert.notStrictEqual(translated[key], english[key], `${key}: English placeholder`);
}
assert.match(translated['sync-conflict-hint'], /Lähtesüsteemi ei saadeta midagi/);
assert.match(translated['sync-conflict-detach-hint'], /sisu jääb WeKani alles/);
assert.match(translated['sync-report-partial'], /ei jätka ega võta käivitust tagasi/);
assert.match(translated['sync-estimate-field-hint'], /Puuduvaid lähteväärtusi eiratakse.*null tühjendab/);
for (const key of Object.keys(english).filter(key =>
  /^(email-(recovery|failure)-|activity-recovery-|history-request-)/.test(key))) {
  assert.ok(translated[key]?.trim(), `${key}: missing Estonian text`);
  assert.notStrictEqual(translated[key], english[key], `${key}: English placeholder`);
}
assert.match(translated['activity-recovery-cancel-confirm'], /ei saa jätkata/);
assert.match(translated['email-recovery-confirm-cancel'], /ei saa taastada/);
assert.match(translated['history-request-hint'], /ei saa.*teist muudatust tagasi võtta/);
for (const token of ['todo.txt', '"x"', '+project', '@context', '(A)', 'due:', 't:']) {
  assert.ok(translated['import-board-instruction-todotxt'].includes(token), `preserve todo.txt ${token}`);
}
console.log('upcomingEstonianPlaceholderRepair: placeholders, recovery, filters, Scrum, Sync and rule syntax passed');
