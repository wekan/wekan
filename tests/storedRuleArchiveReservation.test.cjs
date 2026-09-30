'use strict';
// The stored rule archive runner used to need a board History reservation from
// planning until its last row was written, because its History rows were hashed
// into the chain when PLANNED. Maintainer decision of 2026-09-30: rows are
// content, linked when appended, so the runner needs no reservation at all -
// ordinary History is never blocked behind it. Its redo candidates are captured
// once, when the effects are planned.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs'), vm = require('node:vm');
const source = fs.readFileSync(require.resolve('../server/notifications/storedRulePlans'), 'utf8');
const marker = 'export async function runStoredSyncRuleArchive';
const body = source.slice(source.indexOf(marker), source.indexOf('\n}\n', source.indexOf(marker)));

test('stored archive execution needs no History reservation, only a delivery adapter', async () => {
  assert.doesNotMatch(body, /withHistoryReservation|previousHash/);
  const context = { runStoredSyncActivityDelivery: undefined,
    archiveContext: async () => assert.fail('must not start without a delivery adapter') };
  // Just the runner: later code in the file has its own exports.
  vm.runInNewContext(`${body}\n}`.replace('export async function', 'async function'), context);
  await assert.rejects(context.runStoredSyncRuleArchive({}), /sync-rule-archive-delivery-required/);
});

test('redo candidates are read when the effects are planned, never on replay', () => {
  const build = body.slice(body.indexOf('build: async () => {'), body.indexOf('} });', body.indexOf('build: async () => {')));
  assert.match(build, /ChangeHistory\.find\(\{ boardId: command\.boardId, userId: command\.actorId, undone: true,\s*superseded: \{ \$ne: true \} \}/);
  assert.match(build, /prepareRuleArchiveEffects\(\{ \.\.\.input, username: user\?\.username \|\| '', lists,\s*policy: options\.policy, redoRows \}\)/);
  // Negative: outside the planning callback nothing reads redo rows again.
  assert.equal((body.match(/undone: true/g) || []).length, 1);
});
