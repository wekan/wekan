'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, '../server/startup/repairBoardsOnStartup.js'), 'utf8')
  .replace(/^import[\s\S]*?;\n/gm, '');

async function run({ marker = 1, fail = false, skip = false, pending = 0 } = {}) {
  const calls = [];
  let boot, delayed;
  let finish;
  const completed = new Promise(resolve => { finish = resolve; });
  vm.runInNewContext(source, {
    Meteor: { isServer: true, startup(fn) { boot = fn; }, setTimeout(fn) { delayed = fn; } },
    process: { env: { WEKAN_SKIP_STARTUP_REPAIR: skip ? 'true' : '' } },
    console: { log() {}, error() {} }, Date,
    Cards: { rawCollection: () => 'cards' }, Activities: { rawCollection: () => 'activities' },
    getRepairMarkerVersion: async () => marker,
    setBoardRepairStatus: async value => { calls.push(['status', JSON.parse(JSON.stringify(value))]); if (value.running === false) finish(); },
    backfillCardListEntries: async options => {
      assert.equal(options.cards, 'cards'); assert.equal(options.activities, 'activities'); calls.push(['backfill']);
      if (fail) throw Error('interrupted'); return { columnDatesRestored: 2, columnDatesUnknown: 1, ...(pending ? { columnDatesPending: pending } : {}) };
    },
    repairAllBoards: async () => { calls.push(['repair']); return { boardsScanned: 1 }; },
    setRepairMarkerVersion: async (...args) => { calls.push(['marker', ...JSON.parse(JSON.stringify(args))]); },
  });
  boot();
  if (delayed) delayed();
  if (delayed && marker < 2) await completed;
  await new Promise(resolve => setImmediate(resolve));
  return calls;
}

test('the versioned startup path backfills before saving the new marker and exposes outcome counts', async () => {
  const calls = await run();
  assert.deepEqual(calls.filter(call => call[0] !== 'status'), [
    ['backfill'], ['repair'], ['marker', 2, { boardsScanned: 1, columnDatesRestored: 2, columnDatesUnknown: 1 }],
  ]);
  assert.equal(calls.at(-1)[1].running, false);
  assert.equal(calls.at(-1)[1].repaired.columnDatesRestored, 2);
});
test('interruption leaves the version marker unchanged and exposes failure for a later retry', async () => {
  const calls = await run({ fail: true });
  assert.equal(calls.some(call => call[0] === 'marker'), false);
  assert.equal(calls.at(-1)[1].phase, 'error');
});
test('already-completed and explicitly disabled startup repairs do not rescan', async () => {
  assert.deepEqual(await run({ marker: 2 }), []);
  assert.deepEqual(await run({ skip: true }), []);
});

test('raced cards still missing a date keep the migration retryable', async () => {
  const calls = await run({ pending: 1 });
  assert.equal(calls.some(call => call[0] === 'marker'), false);
  assert.equal(calls.at(-1)[1].phase, 'error');
});
