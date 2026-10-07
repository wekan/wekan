'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { translationTokens } = require('../releases/translations/placeholder-tokens.mjs');
const read = code => JSON.parse(fs.readFileSync(path.join(__dirname, '../imports/i18n/data', `${code}.i18n.json`), 'utf8'));
const en = read('en');
const keys = Object.keys(en).filter(key => key.startsWith('notification-activity-'));
assert.equal(keys.length, 13);
for (const code of ['tk_TM', 'tt', 'so', 'ku', 'ckb', 'pap', 'tpi', 'bi', 'mi', 'sm', 'haw', 'zu', 'zu-ZA', 'xh', 'st', 'tn', 'rw', 'rn', 'ny', 'bho', 'mai', 'or_IN', 'kok', 'ary']) {
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
assert.match(read('ku')['notification-activity-description'], /Bîranînên dema dawî û behskirinên bi @ her dem tên/);
assert.match(read('ckb')['notification-activity-description'], /بیرخستنەوەکانی کاتی تەواوبوون و ئاماژەکان بە @ هەمیشە دەگەن/);
assert.match(read('ku')['notification-activity-description'], /nîşana wê rake/);
assert.match(read('ckb')['notification-activity-description'], /نیشانەی.*لاببە/);
assert.match(read('pap')['notification-activity-description'], /Rekordatorionan.*@ semper ta yega/);
assert.match(read('tpi')['notification-activity-description'], /tingim de bilong pinis.*@ bai kam yet olgeta taim/);
assert.match(read('bi')['notification-activity-description'], /tingbaot dedlaen.*@ oli kam oltaem/);
assert.match(read('pap')['notification-activity-description'], /Kita e marka/);
assert.match(read('tpi')['notification-activity-description'], /Rausim mak/);
assert.match(read('bi')['notification-activity-description'], /Tekemaot mak/);
assert.match(read('mi')['notification-activity-description'], /Ka tae tonu mai ngā whakamaharatanga rā kati.*@/);
assert.match(read('sm')['notification-activity-description'], /E oo mai pea faamanatu.*@/);
assert.match(read('haw')['notification-activity-description'], /E hiki mau mai nā hoʻomanaʻo.*@/);
assert.match(read('mi')['notification-activity-description'], /Tangohia te tohu/);
assert.match(read('sm')['notification-activity-description'], /Aveese le faailoga/);
assert.match(read('haw')['notification-activity-description'], /Wehe i ka māka/);
for (const code of ['zu', 'zu-ZA']) {
  assert.match(read(code)['notification-activity-description'], /Izikhumbuzi.*@ kuhlala kufika/);
  assert.match(read(code)['notification-activity-description'], /Susa uphawu/);
}
assert.match(read('xh')['notification-activity-description'], /Izikhumbuzo.*@ zisoloko zifika/);
assert.match(read('st')['notification-activity-description'], /Dikgopotso.*@ di fihla kamehla/);
assert.match(read('tn')['notification-activity-description'], /Dikgopotso.*@ di goroga ka metlha/);
assert.match(read('xh')['notification-activity-description'], /Susa uphawu/);
assert.match(read('st')['notification-activity-description'], /Tlosa letshwao/);
assert.match(read('tn')['notification-activity-description'], /Tlosa letshwao/);
assert.match(read('rw')['notification-activity-description'], /Ibyibutsa igihe ntarengwa.*@ bihora bigera/);
assert.match(read('rn')['notification-activity-description'], /Ivyibutsa igihe ntarengwa.*@ vyama bigushikira/);
assert.match(read('ny')['notification-activity-description'], /Zokumbutsa tsiku lomaliza.*@ zimafikabe nthawi zonse/);
for (const code of ['rw', 'rn']) assert.match(read(code)['notification-activity-description'], /Kuraho akamenyetso/);
assert.match(read('ny')['notification-activity-description'], /Chotsani chizindikiro/);
assert.match(read('bho')['notification-activity-description'], /आखिरी तारीख.*@.*हमेशा आई/);
assert.match(read('mai')['notification-activity-description'], /अंतिम तिथिक स्मरण.*@.*सदिखन अबैत रहत/);
assert.match(read('or_IN')['notification-activity-description'], /ଶେଷ ତାରିଖର ସ୍ମାରକ.*@.*ସବୁବେଳେ ଆସିବ/);
assert.match(read('bho')['notification-activity-description'], /निशान हटा दीं/);
assert.match(read('mai')['notification-activity-description'], /चिन्ह हटा दिअ/);
assert.match(read('or_IN')['notification-activity-description'], /ଚିହ୍ନ ହଟାନ୍ତୁ/);
assert.match(read('kok')['notification-activity-description'], /निमाण्या तारखेची याद.*@.*सदांच येतात/);
assert.match(read('ary')['notification-activity-description'], /التذكيرات بآخر أجل.*@ كيوصلو ديما/);
assert.match(read('kok')['notification-activity-description'], /खूण काडात/);
assert.match(read('ary')['notification-activity-description'], /حيّد العلامة/);
console.log('Notification activity translations: 13 messages in 24 locales passed');
