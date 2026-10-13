'use strict';
const assert = require('node:assert/strict');
const test = require('node:test');
const en = require('../imports/i18n/data/en.i18n.json');
const mt = require('../imports/i18n/data/mt.i18n.json');
test('Maltese recovery messages preserve every placeholder and leave no English fallback', async () => {
  const { translationTokens } = await import('../releases/translations/placeholder-tokens.mjs');
  const keys = Object.keys(en).filter(k => /^(stuck-sync-operation|interrupted-import|scrum-history-checkpoint)-/.test(k));
  assert.ok(keys.length >= 46);
  for (const key of keys) {
    assert.equal(typeof mt[key], 'string', key);
    assert.ok(mt[key].trim(), key);
    assert.notEqual(mt[key], en[key], key);
    assert.deepEqual(translationTokens(mt[key]), translationTokens(en[key]), key);
  }
});
test('Maltese distinguishes discarding an operation from deleting or retaining its board', () => {
  assert.match(mt['stuck-sync-operation-description'], /diġà applikati jibqgħu.*li fadal qatt ma jinkitbu/);
  assert.match(mt['stuck-sync-operation-description'], /tqabbel il-lista mas-sors tagħha/);
  assert.match(mt['stuck-sync-operation-discard-confirm'], /diġà applikat jibqgħu; il-bqija qatt ma jinkitbu/);
  assert.match(mt['stuck-sync-operation-replayable-now'], /titlesta waħedha.*ma tistax titwarrab/);
  assert.match(mt['stuck-sync-operation-reason-access-denied'], /aċċess għall-kitba fil-lista kollha/);
  assert.match(mt['interrupted-import-description'], /ma tistax titkompla.*fajl tas-sors tagħha ma jinżammx/);
  assert.match(mt['interrupted-import-description'], /inkluż kull ħaġa li żdiedet/);
  assert.match(mt['interrupted-import-keep-confirm'], /Ma jitneħħa xejn/);
  assert.match(mt['interrupted-import-discard-confirm'], /kulma hemm fuqu jitneħħew b'mod permanenti/);
  assert.doesNotMatch(mt['interrupted-import-keep-confirm'], /b'mod permanenti/);
  assert.match(mt['interrupted-import-foreign-board'], /ma nħoloqx.*ma ntmessx/);
  assert.match(mt['interrupted-import-scrum'], /lesti jew warrab dak l-istadju/);
  assert.match(mt['scrum-history-checkpoint-hint'], /biss meta ħadd ieħor ma jkun bidel/);
  assert.match(mt['scrum-history-checkpoint-hint'], /ma jinbidel ebda rekord/);
  assert.match(mt['scrum-history-checkpoint-discard-confirm'], /inklużi l-bidliet.*diġà kitbet/);
  for (const key of ['stuck-sync-operation-truncated', 'interrupted-import-truncated']) assert.match(mt[key], /l-eqdem 50/);
});
