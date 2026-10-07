'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { translationTokens } = require('../releases/translations/placeholder-tokens.mjs');
const read = code => JSON.parse(fs.readFileSync(path.join(__dirname, '../imports/i18n/data', `${code}.i18n.json`), 'utf8'));
const en = read('en');
const keys = Object.keys(en).filter(key => key.startsWith('due-reminder-'));
assert.equal(keys.length, 6);
for (const code of ['tk_TM', 'tt', 'so', 'ku', 'ckb', 'pap', 'tpi', 'bi']) {
  const locale = read(code);
  assert.deepEqual(Object.keys(locale), Object.keys(en), `${code}: source key order`);
  for (const key of keys) {
    assert.ok(locale[key]?.trim(), `${code}:${key}: nonempty`);
    assert.notEqual(locale[key], en[key], `${code}:${key}: translated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(en[key]), `${code}:${key}: exact source tokens`);
  }
  assert.match(locale['due-reminder-days-label'], /0/, `${code}: due-day zero`);
  assert.deepEqual(locale['due-reminder-invalid'].match(/-?\d+/g), ['-14', '14'], `${code}: signed range retained`);
  assert.match(locale['due-reminder-webhook'], /webhook/, `${code}: webhook terminology`);
  assert.notEqual(locale['due-reminder-invalid'], locale['due-reminder-saved'], `${code}: success differs from error`);
}
assert.match(read('tk_TM')['due-reminder-days-label'], /otur.*položitel.*öňki.*otrisatel.*soňky.*boş/);
assert.match(read('tt')['due-reminder-days-label'], /өтер.*уңай.*кадәрге.*тискәре.*соңгы.*буш/);
assert.match(read('so')['due-reminder-days-label'], /hakadyo.*togan.*horreeya.*taban.*dambeeya.*bannaan/);
assert.match(read('tk_TM')['due-reminder-invalid'], /iň köp on.*bitin/);
assert.match(read('tt')['due-reminder-invalid'], /иң күбе ун бөтен/);
assert.match(read('so')['due-reminder-invalid'], /ugu badnaan toban.*tiro dhan/);
assert.match(read('ku')['due-reminder-days-label'], /virgulê.*erênî.*berî.*neyînî.*piştî.*vala/);
assert.match(read('ckb')['due-reminder-days-label'], /کۆما.*ئەرێنی.*پێش.*نەرێنی.*دوای.*بەتاڵی/);
assert.match(read('pap')['due-reminder-days-label'], /koma.*positivo.*promé.*negativo.*despues.*bashí/);
assert.match(read('ku')['due-reminder-invalid'], /Herî zêde deh rojên tam/);
assert.match(read('ckb')['due-reminder-invalid'], /زۆرترین دە ڕۆژی تەواو/);
assert.match(read('pap')['due-reminder-invalid'], /máksimo dies dia henter/);
assert.match(read('tpi')['due-reminder-days-label'], /koma.*winim 0.*paslain.*aninit long 0.*bihain.*stap nating/);
assert.match(read('bi')['due-reminder-days-label'], /koma.*moa long 0.*bifo.*daon long 0.*afta.*emti/);
assert.match(read('tpi')['due-reminder-invalid'], /tenpela de tasol.*namba olgeta/);
assert.match(read('bi')['due-reminder-invalid'], /ten dei nomo.*mak antap.*ful namba/);
console.log('Due reminder translations: 6 messages in 8 locales passed');
