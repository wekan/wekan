'use strict';
// Guards of nested stored Sync stages share results within one evaluation
// (server/lib/syncGuardWindow.js). Run: node tests/syncGuardWindow.test.cjs
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { reuseWithinEvaluation } = require('../server/lib/syncGuardWindow');

test('nested before-and-after guards no longer multiply the base check', async () => {
  let base = 0;
  const layer = inner => reuseWithinEvaluation(async () => { await inner(); await inner(); });
  let guard = reuseWithinEvaluation(async () => { base++; });
  for (let depth = 0; depth < 8; depth++) guard = layer(guard);
  await guard();
  assert.equal(base, 1, 'without sharing this is 2^8 = 256 base checks');
});

test('every call from ordinary work checks afresh, so a change between stages is seen (negative)', async () => {
  let allowed = true, base = 0;
  const lease = reuseWithinEvaluation(async () => { base++; if (!allowed) throw new Error('lease lost'); });
  const stage = reuseWithinEvaluation(async () => { await lease(); await lease(); });
  await stage();
  allowed = false; // what an adapter or another server did in between
  await assert.rejects(stage(), /lease lost/);
  allowed = true;
  await stage();
  assert.equal(base, 3, 'one base check per evaluation, none reused across them');
});

test('a failure fails its evaluation and is not carried into the next (negative)', async () => {
  let fail = true;
  const base = reuseWithinEvaluation(async () => { if (fail) throw new Error('denied'); });
  const outer = reuseWithinEvaluation(async () => { await base(); });
  await assert.rejects(outer(), /denied/);
  fail = false;
  await outer();
});

test('a guard reached again through its own check does not wait on itself', async () => {
  let depth = 0, inner;
  const outer = reuseWithinEvaluation(async () => { if (depth++ < 2) await inner(); });
  inner = reuseWithinEvaluation(async () => { await outer(); });
  await Promise.race([outer(), new Promise((_, reject) => setTimeout(() => reject(new Error('deadlock')), 500))]);
});

test('the stored stages use it, and the journal ownership read stays fresh', () => {
  assert.throws(() => reuseWithinEvaluation(null), /evaluation-invalid/);
  const root = path.join(__dirname, '..');
  for (const file of ['server/lib/listSyncOperations.js', 'server/notifications/storedRulePlans.js', 'server/lib/syncActivityDelivery.js',
    'server/lib/syncEffects.js', 'server/lib/syncRuleArchiveEffects.js', 'server/notifications/storedDelivery.js']) {
    assert.match(fs.readFileSync(path.join(root, file), 'utf8'), /reuseWithinEvaluation\(async/, file);
  }
  assert.doesNotMatch(fs.readFileSync(path.join(root, 'server/lib/syncOperationJournal.js'), 'utf8'), /reuseWithinEvaluation/);
});
