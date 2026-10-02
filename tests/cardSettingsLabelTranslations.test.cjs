'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { translationTokens } = require('../releases/translations/placeholder-tokens.mjs');
const read = code => JSON.parse(fs.readFileSync(path.join(__dirname, '../imports/i18n/data', `${code}.i18n.json`), 'utf8'));
const english = read('en');
const codes = ["kk", "ky", "tg", "mn", "uz", "uz-LA", "uz-UZ", "uz-AR", "ba", "tt", "tk_TM", "ug", "ckb", "ku", "am", "as", "or_IN", "si", "ps", "sd", "km", "km-KH", "km_KH", "my", "fo", "fy", "fy-NL", "fur", "rm", "sc", "scn", "nap", "pap", "so", "mg", "rw", "rn", "ny", "om"];
const keys = ['card-settings-card-color', 'card-settings-linked-card', 'card-settings-description-badge'];
for (const code of codes) {
  const locale = read(code);
  for (const key of keys) {
    assert.ok(locale[key]?.trim(), `${code}:${key}: nonempty`);
    assert.notEqual(locale[key], english[key], `${code}:${key}: translated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `${code}:${key}: tokens`);
  }
  assert.equal(new Set(keys.map(key => locale[key])).size, keys.length, `${code}: distinct settings`);
  assert.equal(locale['card-settings-linked-card'], locale['cardType-linkedCard'], `${code}: established linked-card terminology`);
}
for (const key of [...keys, 'cardType-linkedCard']) {
  assert.match(read('uz-AR')[key], /\p{Script=Arabic}/u, `${key}: Arabic Uzbek`);
  assert.doesNotMatch(read('uz-AR')[key], /\p{Script=Latin}/u, `${key}: no Latin seed`);
}
assert.match(read('mn')['card-settings-card-color'], /өнгө/);
assert.match(read('mn')['card-settings-description-badge'], /Тайлбар/);
assert.notEqual(read('ba')['card-settings-card-color'], read('tt')['card-settings-card-color']);
for (const key of [...keys, 'cardType-linkedCard']) {
  assert.doesNotMatch(read('or_IN')[key], /\|/, `${key}: no stray separator`);
}
assert.equal(read('fur')['cardType-linkedCard'], 'Cjarte colegade');
assert.equal(read('rm')['cardType-linkedCard'], 'Carta colliada');
assert.doesNotMatch(read('fur')['card-settings-linked-card'], /collegata/);
assert.doesNotMatch(read('rm')['card-settings-linked-card'], /collegata/);
assert.equal(read('scn')['card-settings-linked-card'], 'Carta culligata');
assert.doesNotMatch(read('scn')['cardType-linkedCard'], /collegata/);
assert.equal(read('pap')['card-settings-linked-card'], 'Karchi konektá');
assert.doesNotMatch(read('pap')['cardType-linkedCard'], /enlazada/);
assert.notEqual(read('rw')['card-settings-description-badge'], read('rn')['card-settings-description-badge']);
console.log(`Card setting labels: ${keys.length} labels in ${codes.length} locales passed`);
