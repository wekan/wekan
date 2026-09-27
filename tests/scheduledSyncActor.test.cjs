'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { AsyncLocalStorage } = require('node:async_hooks');
const { withScheduledSyncActor } = require('../server/lib/scheduledSyncActor');
function fixture() {
  const state = { user: { _id: 'author' }, board: { _id: 'board' }, write: true, assigned: null, runs: 0, leases: 0 };
  const context = new AsyncLocalStorage();
  const args = { credential: { runAsUserId: 'author' }, list: { boardId: 'board' },
    findUser: async id => { assert.equal(id, 'author'); return state.user; },
    findBoard: async id => { assert.equal(id, 'board'); return state.board; },
    canWrite: () => state.write, assignedScope: () => state.assigned,
    assertCurrent: async () => { state.leases++; },
    withActor: (id, fn) => context.run(id, fn),
    run: async guard => { state.runs++; assert.equal(context.getStore(), 'author'); await guard(); return 'done'; },
  };
  return { state, context, args };
}
test('scheduled work retains the author across awaits and repeats lease/access checks', async () => {
  const { args, state, context } = fixture();
  assert.equal(await withScheduledSyncActor(args), 'done');
  assert.equal(state.leases, 2); assert.equal(context.getStore(), undefined);
});
test('missing, disabled, revoked and assigned-only authorizations stop before running', async () => {
  for (const change of [f => f.args.credential = null, f => f.args.credential.runAsUserId = '',
    f => f.state.user = null, f => f.state.user.loginDisabled = true,
    f => f.state.board = null, f => f.state.write = false, f => f.state.assigned = { assignees: 'author' }]) {
    const f = fixture(); change(f);
    await assert.rejects(withScheduledSyncActor(f.args), error => /^sync-actor-/.test(error.code));
    assert.equal(f.state.runs, 0);
  }
});
test('revocation during fetch stops subsequent writes and never changes another async context', async () => {
  const { args, state, context } = fixture();
  args.run = async guard => { await Promise.resolve(); state.write = false; await guard(); assert.fail('revoked write ran'); };
  await context.run('other-request', async () => {
    await assert.rejects(withScheduledSyncActor(args), /no longer has full-list/);
    assert.equal(context.getStore(), 'other-request');
  });
});
test('lease failures are preserved and no work runs', async () => {
  const { args, state } = fixture();
  args.assertCurrent = async () => { throw new Error('lease lost'); };
  await assert.rejects(withScheduledSyncActor(args), /lease lost/);
  assert.equal(state.runs, 0);
});
test('the recurring scanner always selects the scheduled authorization path', async () => {
  const fs = require('node:fs'), vm = require('node:vm');
  const source = fs.readFileSync(require.resolve('../server/listSync.js'), 'utf8');
  const calls = [];
  const context = { Lists: { find: () => ({ fetchAsync: async () => [{ _id: 'one' }, { _id: 'two' }] }) },
    syncOneList: async (list, options) => calls.push([list._id, options.scheduled]), console };
  vm.runInNewContext(source.slice(source.indexOf('export async function scanListSync'),
    source.lastIndexOf('Meteor.startup(')).replace('export async', 'async'), context);
  await context.scanListSync();
  assert.deepEqual(calls, [['one', true], ['two', true]]);
});
