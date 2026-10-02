'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { translationTokens } = require('../releases/translations/placeholder-tokens.mjs');
const read = code => JSON.parse(fs.readFileSync(path.join(__dirname, '../imports/i18n/data', `${code}.i18n.json`), 'utf8'));
const english = read('en');
const codes = ["kk", "ky", "tg", "mn", "uz", "uz-LA", "uz-UZ", "uz-AR", "ba", "tt", "tk_TM", "ug", "ckb", "ku", "am", "as", "or_IN", "si", "ps", "sd", "km", "km-KH", "km_KH", "my", "fo", "fy", "fy-NL", "fur", "rm", "sc", "scn", "nap", "pap", "so", "mg", "rw", "rn", "ny", "om", "zu", "zu-ZA", "xh", "st", "tn", "nso", "ss", "nd", "ts", "ve", "lg", "wo", "ak", "bm", "ee", "br", "kw", "gv", "csb", "hsb", "szl", "bi", "tpi", "mi", "sm", "to", "haw", "fj", "ve-CC", "wa", "lld", "rup", "yue_CN", "wuu-Hans", "yi", "bua", "cv", "sah", "bho", "mai", "kok", "ary", "ace", "wa-RR"];
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
assert.equal(read('ts')['cardType-linkedCard'], 'Khadi leri hlanganisiweke');
assert.doesNotMatch(read('ts')['card-settings-linked-card'], /mhaka khadi/);
assert.equal(read('ve')['cardType-linkedCard'], 'Garaṱa ḽo ṱumanywaho');
for (const key of ['board', 'card', 'description', 'save', 'delete', 'edit', 'add', 'name']) {
  assert.notEqual(read('ve')[key], read('zu')[key], `${key}: no Zulu seed in Venda`);
}
assert.equal(read('ve').description, 'Ṱhaluso');
assert.equal(read('ve').save, 'Vhulunga');
assert.equal(read('lg')['cardType-linkedCard'], 'Ekaadi eyungiddwa');
assert.doesNotMatch(read('lg')['card-settings-linked-card'], /Linked/);
assert.equal(read('ak')['cardType-linkedCard'], 'Kaad a wɔde abɔ mu');
assert.doesNotMatch(read('ak')['card-settings-linked-card'], /Linked/);
assert.equal(read('ee')['cardType-linkedCard'], 'Agbalẽvi si wodo ka kɔ');
assert.equal(read('br')['cardType-linkedCard'], 'Kartenn liammet');
assert.doesNotMatch(read('br')['card-settings-linked-card'], /kavet/);
assert.match(read('gv')['card-settings-card-color'], /^Daah /);
assert.equal(read('hsb')['cardType-linkedCard'], 'Zwjazana kartka');
assert.doesNotMatch(read('hsb')['card-settings-linked-card'], /WeKan:|Propojená/);
assert.equal(read('bi')['cardType-linkedCard'], 'Kad we i joen');
assert.doesNotMatch(read('bi')['card-settings-linked-card'], /Linked/);
assert.equal(read('to')['cardType-linkedCard'], 'Kaati kuo fakafehokotaki');
assert.doesNotMatch(read('to')['card-settings-linked-card'], /Faka-Tonga:|Linked/);
assert.equal(read('haw')['cardType-linkedCard'], 'Kāleka i hoʻopili ʻia');
assert.doesNotMatch(read('haw')['card-settings-linked-card'], /linakeka/);
assert.equal(read('ve-CC')['cardType-linkedCard'], 'Scheda colegada');
assert.doesNotMatch(read('ve-CC')['card-settings-linked-card'], /collegata/);
assert.equal(read('lld')['cardType-linkedCard'], 'Ciarta colegada');
assert.doesNotMatch(read('lld')['card-settings-linked-card'], /collegata/);
assert.equal(read('bua')['cardType-linkedCard'], 'Холбоотой карточко');
assert.match(read('bua')['card-settings-description-badge'], /Тайлбариин/);
assert.match(read('cv')['card-settings-description-badge'], /Ӑнлантару/);
assert.match(read('sah')['card-settings-description-badge'], /Быһаарыы/);
assert.equal(read('ace')['cardType-linkedCard'], 'Kad nyang meusambông');
assert.equal(read('wa-RR').board, 'Pisara');
assert.equal(read('wa-RR').card, 'Kard');
assert.doesNotMatch(read('wa-RR').board, /Tableau/);
assert.doesNotMatch(read('wa-RR').card, /Carte/);
console.log(`Card setting labels: ${keys.length} labels in ${codes.length} locales passed`);
