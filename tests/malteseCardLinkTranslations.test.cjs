'use strict';
const assert = require('node:assert/strict');
const test = require('node:test');
const en = require('../imports/i18n/data/en.i18n.json');
const mt = require('../imports/i18n/data/mt.i18n.json');
const keys = Object.keys(en).filter(key => /^(?:attach-card(?:-|$)|attachCardPopup-title$|attached-card-unavailable$|detach-card$|custom-field-link|custom-field-unlink$|field-link-|cardCustomFieldLinksPopup-title$)/.test(key));

test('Maltese card attachment and field-link messages are translated with intact tokens', async () => {
  const { translationTokens } = await import('../releases/translations/placeholder-tokens.mjs');
  assert.ok(keys.length >= 30);
  for (const key of keys) {
    assert.equal(typeof mt[key], 'string', key);
    assert.ok(mt[key].trim(), key);
    assert.notEqual(mt[key], en[key], key);
    assert.deepEqual(translationTokens(mt[key]), translationTokens(en[key]), key);
  }
});

test('Maltese field links distinguish matching fields, direction and permission', () => {
  assert.match(mt['custom-field-links-hint'], /bl-istess isem u tip/);
  assert.match(mt['custom-field-links-hint'], /karta waħda.*kkupjat fuq il-karta l-oħra/);
  assert.match(mt['custom-field-links-hint'], /biss fuq karta waħda jitħallew kif inhuma/);
  assert.match(mt['custom-field-link-both'], /Fiż-żewġ direzzjonijiet/);
  assert.match(mt['custom-field-link-send'], /direzzjoni waħda.*karta prinċipali/);
  assert.match(mt['custom-field-link-sends'], /din il-karta.*dik il-karta/);
  assert.match(mt['custom-field-link-receives'], /dik il-karta.*din il-karta/);
  assert.notEqual(mt['custom-field-link-sends'], mt['custom-field-link-receives']);
  assert.match(mt['field-link-not-allowed'], /teditja ż-żewġ karti/);
  assert.doesNotMatch(mt['field-link-not-allowed'], /tara ż-żewġ karti/);
  assert.match(mt['custom-field-link-inactive'], /ma tistax aktar teditja ż-żewġ karti, jew karta hija arkivjata/);
});

test('Maltese attachment failures do not imply permission to see a hidden card', () => {
  for (const key of ['attached-card-unavailable', 'custom-field-link-unavailable']) assert.match(mt[key], /ma tistax tara/);
  assert.match(mt['attach-card-not-found'], /ebda karta li tista' tara/);
  for (const key of ['attach-card-self', 'field-link-self']) assert.match(mt[key], /ma tistax.*magħha nnifisha/);
  assert.match(mt['field-link-archived'], /arkivjata ma tistax tintrabat/);
  for (const key of ['attach-card-limit', 'field-link-limit']) assert.match(mt[key], /għadd massimu/);
  assert.match(mt['detach-card'], /Neħħi l-karta mehmuża/);
  assert.match(mt['custom-field-unlink'], /Ħoll ir-rabta/);
});
