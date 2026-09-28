'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs'), vm = require('node:vm');
test('stored archive execution requires explicit History ownership before effects or writes', async () => {
  const source = fs.readFileSync(require.resolve('../server/notifications/storedRulePlans'), 'utf8');
  const marker = 'export async function runStoredSyncRuleArchive';
  const context = { runStoredSyncActivityDelivery: async () => {},
    archiveContext: async () => ({ guard: async () => {} }),
    captureArchive: async () => ({ boardId: 'board' }),
    ensureRuleArchiveEffects: async () => assert.fail('must not prepare effects without ownership') };
  vm.runInNewContext(source.slice(source.indexOf(marker)).replace('export async function', 'async function'), context);
  const run = context.runStoredSyncRuleArchive;
  await assert.rejects(run({}), /history-reservation-required/);
  for (const reservation of [null, {}, { assertCurrent: async () => {} },
    { assertCurrent: async () => {}, previousHash: null, redoRows: null }]) {
    await assert.rejects(run({ withHistoryReservation: async (boardId, work) => {
      assert.equal(boardId, 'board'); return work(reservation);
    } }), /history-reservation-required/);
  }
  await assert.rejects(run({ withHistoryReservation: async (boardId, work) => work({
    previousHash: null, redoRows: [], assertCurrent: async () => { throw Error('History ownership lost'); },
  }) }), /History ownership lost/);
});
