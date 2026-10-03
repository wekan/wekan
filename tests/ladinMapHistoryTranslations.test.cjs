'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { translationTokens } = require('../releases/translations/placeholder-tokens.mjs');
const read = code => JSON.parse(fs.readFileSync(path.join(__dirname, '../imports/i18n/data', `${code}.i18n.json`), 'utf8'));
const en = read('en');
const locale = read('lld');
const keys = ['board-view-map', 'map-view-empty', 'map-view-upload', 'map-view-remove-image', 'map-view-unplaced', 'map-view-place-hint', 'map-view-all-placed', 'saml-login-not-started', 'move-selection-before', 'move-selection-after', 'history-request-pending-undo', 'history-request-pending-redo', 'history-request-hint', 'history-request-retry', 'history-request-forget'];
assert.deepEqual(Object.keys(locale), Object.keys(en));
for (const key of keys) {
  assert.ok(locale[key]?.trim(), key);
  assert.notEqual(locale[key], en[key], `${key}: translated`);
  assert.deepEqual(translationTokens(locale[key]), translationTokens(en[key]), `${key}: exact placeholders`);
}
assert.notEqual(locale['move-selection-before'], locale['move-selection-after']);
assert.notEqual(locale['history-request-pending-undo'], locale['history-request-pending-redo']);
// Keep the retry guarantee and browser-tab restriction explicit, including negation.
assert.match(locale['history-request-hint'], /medema domanda.*ne pò nia anulé na segunda mudaziun/);
assert.match(locale['saml-login-not-started'], /SAML ne é nia.*scheda dl browser/);
assert.match(locale['map-view-empty'], /aministradëur.*ciarié/);
assert.match(locale['map-view-place-hint'], /Strajiné.*o.*clicché/);
console.log('Ladin map/history translations: 15 messages passed');
