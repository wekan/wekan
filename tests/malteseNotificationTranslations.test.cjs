'use strict';
const assert = require('node:assert/strict');
const test = require('node:test');
const en = require('../imports/i18n/data/en.i18n.json');
const mt = require('../imports/i18n/data/mt.i18n.json');
test('Maltese notification and planning messages retain tokens and protocol names', async () => {
  const { translationTokens } = await import('../releases/translations/placeholder-tokens.mjs');
  const keys = Object.keys(en).filter(k => /^(webhook-payload-|webhook-hide-identity$|webhook-someone$|notification-delivery-|notification-group-|sync-planning-)/.test(k));
  assert.ok(keys.length >= 43);
  for (const k of keys) {
    assert.equal(typeof mt[k], 'string', k);
    assert.ok(mt[k].trim(), k);
    assert.notEqual(mt[k], en[k], k);
    assert.deepEqual(translationTokens(mt[k]), translationTokens(en[k]), k);
  }
  for (const name of ['Rocket.Chat', 'Slack']) assert.ok(mt['webhook-payload-description'].includes(name));
  assert.match(mt['webhook-payload-field-standard'], /WEBHOOKS_ATTRIBUTES/);
});
test('Maltese notifications distinguish privacy, delayed delivery and grouping scope', () => {
  assert.match(mt['webhook-hide-identity'], /Ħalli ismi barra.*ħerġin/);
  assert.match(mt['webhook-payload-description'], /iżomm l-issettjar li ntiret/);
  assert.match(mt['webhook-payload-description'], /jekk ma jkun issettjat xejn.*dejjem bagħtu/);
  assert.match(mt['notification-delivery-quiet'], /stenna sakemm jispiċċaw/);
  assert.doesNotMatch(mt['notification-delivery-quiet'], /ħassar/);
  assert.match(mt['notification-delivery-grouping-all'], /ż-żmien li jintbagħat f'messaġġ wieħed/);
  assert.match(mt['notification-delivery-grouping-board'], /kull bord/);
  assert.match(mt['notification-delivery-grouping-card'], /kull karta/);
  assert.notEqual(mt['notification-delivery-grouping-board'], mt['notification-delivery-grouping-card']);
  assert.match(mt['notification-delivery-schedule-daily'], /Darba kuljum/);
});
test('Maltese planning sync keeps conditional enablement and non-destructive first sync', () => {
  const s = mt['sync-planning-hint'];
  assert.match(s, /biss waqt li Scrum ikun attivat/);
  assert.match(s, /bid-dati mogħtija mis-sors/);
  assert.match(s, /l-ewwel bl-ID tas-sors tagħha, imbagħad bl-isem/);
  assert.match(s, /Bidla lokali.*tibqa' sakemm is-sors jibdel/);
  assert.match(s, /l-ewwel sinkronizzazzjoni qatt ma tneħħi l-ippjanar/);
});
