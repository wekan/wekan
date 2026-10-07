'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { translationTokens } = require('../releases/translations/placeholder-tokens.mjs');
const read = code => JSON.parse(fs.readFileSync(path.join(__dirname, '../imports/i18n/data', `${code}.i18n.json`), 'utf8'));
const en = read('en');
const keys = Object.keys(en).filter(key => key.startsWith('notification-activity-'));
assert.equal(keys.length, 13);
for (const code of ['tk_TM', 'tt', 'so']) {
  const locale = read(code);
  assert.deepEqual(Object.keys(locale), Object.keys(en), `${code}: key order`);
  for (const key of keys) {
    assert.ok(locale[key]?.trim(), `${code}:${key}: nonempty`);
    assert.notEqual(locale[key], en[key], `${code}:${key}: translated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(en[key]), `${code}:${key}: exact tokens`);
  }
  assert.equal((locale['notification-activity-description'].match(/@/g) || []).length, 1, `${code}: mention marker retained`);
  assert.notEqual(locale['notification-activity-members'], locale['notification-activity-assignees'], `${code}: members and assignees distinct`);
}
// Muting ordinary activity does not mute reminders or direct mentions.
assert.match(read('tk_TM')['notification-activity-description'], /Möhlet ýatlatmalary we @ arkaly agzalmalar hemişe gelýär/);
assert.match(read('tt')['notification-activity-description'], /Үтәү вакыты турында искәртмәләр һәм @ аша искә алулар һәрвакыт килә/);
assert.match(read('so')['notification-activity-description'], /Xusuusinnada.*@ mar walba way imanayaan/);
assert.match(read('tk_TM')['notification-activity-description'], /belligini aýryň/);
assert.match(read('tt')['notification-activity-description'], /билгесен алыгыз/);
assert.match(read('so')['notification-activity-description'], /Ka saar calaamadda/);
console.log('Notification activity translations: 13 messages in 3 locales passed');
