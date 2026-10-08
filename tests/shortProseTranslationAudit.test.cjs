'use strict';
const assert = require('node:assert/strict');
const { test } = require('node:test');

test('short prose audit exposes words and preserves indexed source arguments', async () => {
  const { shortProseCandidates } = await import('../releases/translations/audit-short-prose.mjs');
  const source = { condition: 'if', loop: 'do', move: '%1 of %2', end: 'to #', accept: 'OK', negative: 'No', person: 'Me' };
  const before = JSON.stringify(source);
  assert.deepEqual(shortProseCandidates(source, { ...source }), source);
  assert.equal(JSON.stringify(source), before);
  assert.deepEqual(shortProseCandidates(source, { ...source, condition: '假使' }), Object.fromEntries(Object.entries(source).filter(([key]) => key !== 'condition')));
});

test('short prose audit excludes technical notation and changed or missing values', async () => {
  const { shortProseCandidates } = await import('../releases/translations/audit-short-prose.mjs');
  const source = { os: 'OS', size: 'MB', pi: 'pi', constant: 'e', search: 'a', storage: 'S3', url: 'https://example.com', empty: '', token: '%1', longer: 'do something', word: 'or' };
  assert.deepEqual(shortProseCandidates(source, { ...source, word: '或者' }), {});
  assert.deepEqual(shortProseCandidates(source, {}), {});
  // Same spelling can be native: report it for review, never assert it is wrong.
  assert.deepEqual(shortProseCandidates({ word: 'No' }, { word: 'No' }), { word: 'No' });
});
