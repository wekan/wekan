'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { translationTokens } = require('../releases/translations/placeholder-tokens.mjs');
const read = code => JSON.parse(fs.readFileSync(
  path.join(__dirname, '../imports/i18n/data', `${code}.i18n.json`), 'utf8'));
const english = read('en');
const codes = ['ku', 'ckb', 'tt', 'tk_TM'];
const keys = Object.keys(english).filter(key => key.startsWith('email-recovery-'));

for (const code of codes) {
  const locale = read(code);
  assert.deepEqual(Object.keys(locale), Object.keys(english), `${code}: source order`);
  for (const key of keys) {
    assert.ok(locale[key]?.trim(), `${code}:${key}: nonempty`);
    assert.notEqual(locale[key], english[key], `${code}:${key}: translated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `${code}:${key}: tokens`);
    const script = code === 'ckb' ? 'Arabic' : code === 'tt' ? 'Cyrillic' : 'Latin';
    assert.match(locale[key], new RegExp(`\\p{Script=${script}}`, 'u'), `${code}:${key}: native script`);
  }
  assert.notEqual(locale['email-recovery-pause'], locale['email-recovery-resume'], `${code}: opposite actions`);
  assert.notEqual(locale['email-recovery-retry'], locale['email-recovery-cancel'], `${code}: retry is not cancellation`);
  assert.notEqual(locale['email-recovery-busy'], locale['email-recovery-failed'], `${code}: busy is not an unconfirmed result`);
}

// Cancellation is irreversible only for the messages covered by this request.
// Retrying must retain the pause and the warning about uncertain delivery.
const meanings = {
  ku: {
    cancel: /nayê vegerandin.*piştî vê daxwazê.*dimînin/,
    description: /nayê paşvekişandin.*nezelal.*dubare.*rawestandina heyî diparêze/,
  },
  ckb: {
    cancel: /ناتوانرێت بگەڕێندرێنەوە.*دوای ئەم داواکارییە دەپارێزرێن/,
    description: /ناگەڕێندرێتەوە.*ناڕوونە.*دووبارە.*ڕاگرتنی هەنووکەیی دەپارێزێت/,
  },
  tt: {
    cancel: /кире кайтарып булмаячак.*сораудан соң.*хатлар саклана/,
    description: /кире алып булмый.*билгесез.*кабатланырга мөмкин.*туктатып торуны саклый/,
  },
  tk_TM: {
    cancel: /dikeldip bolmaz.*haýyşdan soň.*habarlar saklanar/,
    description: /yzyna alyp bolmaýar.*näbelli.*gaýtalanyp biler.*arakesmäni saklaýar/,
  },
};
for (const [code, expected] of Object.entries(meanings)) {
  assert.match(read(code)['email-recovery-confirm-cancel'], expected.cancel, `${code}: cancellation boundaries`);
  assert.match(read(code)['email-recovery-description'], expected.description, `${code}: delivery and pause warnings`);
}
console.log(`Email recovery translations: ${keys.length} messages in ${codes.length} locales passed`);
