'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { translationTokens } = require('../releases/translations/placeholder-tokens.mjs');
const read = code => JSON.parse(fs.readFileSync(path.join(__dirname, '../imports/i18n/data', `${code}.i18n.json`), 'utf8'));
const english = read('en');
const codes = ["kk", "ky", "tg", "mn", "uz", "uz-LA", "uz-UZ", "uz-AR", "ba", "tt", "tk_TM", "ug", "ckb", "ku", "am", "as", "or_IN", "si", "ps", "sd", "km", "km-KH", "km_KH", "my", "fo", "fy", "fy-NL", "fur", "rm", "sc", "scn", "nap", "pap", "so", "mg", "rw", "rn", "ny", "om", "zu", "zu-ZA", "xh", "st", "tn", "nso", "ss", "nd", "ts", "ve", "lg", "wo", "ak", "bm", "ee", "br", "kw", "gv", "csb", "hsb", "szl", "bi", "tpi", "mi", "sm", "to", "haw", "fj", "ve-CC", "wa", "lld", "rup", "yue_CN", "wuu-Hans", "yi", "bua", "cv", "sah", "bho", "mai", "kok", "ary", "ace", "wa-RR", "se", "ve-PP", "bo", "dz", "ti", "af", "af_ZA", "an", "ar", "ar-DZ", "ar-EG", "ast-ES", "az", "az-AZ", "az-LA", "be", "bg", "bn", "bs", "ca", "ca@valencia", "ca_ES", "co", "cs", "cs-CZ", "cy", "cy-GB", "da", "de", "de-AT", "de-CH", "de_DE", "el", "el-GR", "eo", "es", "es-AR", "es-CL", "es-CO", "es-LA", "es-MX", "es-PE", "es-PY", "es_CO", "et-EE", "eu", "fa", "fa-IR", "fi", "fr", "fr-BE", "fr-CA", "fr-CH", "fr-FR", "ga", "gd", "gl", "gl-ES", "gu-IN", "ha", "he", "he-IL", "hi", "hi-IN", "hr", "ht", "hu", "hy", "id", "ig", "is", "it", "ja", "ja-HI", "ja-JP", "jv", "ka", "kn", "ko", "ko-KR", "la", "lb", "lt", "lv", "mk", "ml", "mr", "ms", "ms-MY", "mt", "nb", "ne", "nl", "nl-NL", "vl-SS", "oc", "pa", "pl", "pl-PL", "pt", "pt-BR", "pt-PT", "pt_PT", "ro", "ro-RO", "ru", "ru-RU", "ru-UA", "ru_RU", "sk", "sl", "sl_SI", "sn", "sq", "sr", "sv", "sw", "ta", "te-IN", "th", "tl", "tr", "uk", "uk-UA", "ur", "vi", "vi-VN", "yo", "cmn", "zh", "zh-CN", "zh-GB", "zh-Hans", "zh_SG", "zh-HK", "zh-Hant", "zh-TW", "ks", "tlh", "vo", "ay", "qu", "gn", "ff", "kl", "nah", "wal", "chr", "iu", "tig", "zgh"];
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
for (const code of ['ro', 'ro-RO']) {
  assert.equal(read(code)['card-settings-linked-card'], 'Card asociat');
  assert.doesNotMatch(read(code)['cardType-linkedCard'], /Scheda|collegata/);
}
assert.equal(read('co')['cardType-linkedCard'], 'Carta cullegata');
assert.equal(read('la')['cardType-linkedCard'], 'Schedula coniuncta');
assert.doesNotMatch(read('la')['card-settings-linked-card'], /Latine:|Linked/);
assert.equal(read('lb')['cardType-linkedCard'], 'Verknëppelt Kaart');
assert.equal(read('mt')['cardType-linkedCard'], 'Kard marbuta');
assert.equal(read('sn')['cardType-linkedCard'], 'Kadhi rakabatanidzwa');
assert.equal(read('tl')['cardType-linkedCard'], 'Naka-link na kard');
assert.equal(read('ur')['cardType-linkedCard'], 'منسلک کارڈ');
assert.equal(read('fi')['card-settings-card-color'], 'Kortin väri');
assert.equal(read('zh-CN')['card-settings-card-color'], '卡片颜色');
assert.equal(read('zh-TW')['card-settings-card-color'], '卡片顏色');
console.log(`Card setting labels: ${keys.length} labels in ${codes.length} locales passed`);

assert.equal(read('ks')['card-settings-card-color'], 'کارڈُک رَنٛگ');
assert.equal(read('ks')['card-settings-description-badge'], 'تفصیلُک نشان');
assert.equal(read('tlh')['card-settings-card-color'], "'echletHom qalmuS");
assert.equal(read('tlh')['card-settings-description-badge'], "QIjmeH De' Degh");

assert.equal(read('vo')['card-settings-card-color'], 'Köl kada');
assert.equal(read('vo')['card-settings-description-badge'], 'Mäk beskriba');

assert.equal(read('ay')['card-settings-linked-card'], 'Mayachata karta');
assert.equal(read('qu')['card-settings-linked-card'], "T'inkisqa karta");
for (const code of ['ay', 'qu']) {
  assert.equal(read(code)['cardType-linkedCard'], read(code)['card-settings-linked-card']);
  assert.doesNotMatch(read(code)['cardType-linkedCard'], /Linked|Kay willaymi:/);
}
assert.equal(read('gn')['card-settings-card-color'], "Kuatia'i sa'y");

assert.equal(read('ff')['card-settings-card-color'], 'Goobu kartal');
assert.equal(read('kl')['card-settings-card-color'], 'Kortsip qalipaataa');

const catalogCodes = fs.readdirSync(path.join(__dirname, '../imports/i18n/data'))
  .filter(file => file.endsWith('.i18n.json') && !/^en(?:[-_.])/.test(file))
  .map(file => file.slice(0, -10));
assert.deepEqual([...codes].sort(), catalogCodes.sort(), 'all non-English catalogs covered');
for (const [code, script] of [
  ['chr', /\p{Script=Cherokee}/u], ['iu', /\p{Script=Canadian_Aboriginal}/u],
  ['tig', /\p{Script=Ethiopic}/u], ['zgh', /\p{Script=Tifinagh}/u],
]) {
  for (const key of keys) assert.match(read(code)[key], script, `${code}:${key}: native script`);
}
assert.equal(read('nah')['card-settings-card-color'], 'Amatlapalli itlapal');
assert.equal(read('wal')['card-settings-card-color'], 'Kaardiya meraa');
assert.equal(read('wal')['cardType-linkedCard'], 'Ohettida kaardiya');
assert.doesNotMatch(read('wal')['cardType-linkedCard'], /Wolayttatto:|Linked/);
assert.equal(read('tig')['cardType-linkedCard'], 'ለትአሰረ ወረቀት ካርድ');
assert.doesNotMatch(read('tig')['cardType-linkedCard'], /ዝተራኸበ/);

const pending = JSON.parse(fs.readFileSync(path.join(__dirname, '../releases/translations/pending-transifex.json'), 'utf8'));
for (const key of keys) assert.ok(!pending.keys.some(entry => entry.key === key), `${key}: complete batch leaves pending queue`);
