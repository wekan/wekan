'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { reportScope } = require('../server/lib/syncRunReport');
function harness({ revoke = false, reincarnate = false, restricted = false } = {}) {
  let methods, reads = 0, accessChecks = 0, listReads = 0;
  let selector, options;
  const list = { _id: 'list', boardId: 'board', syncCredentialIncarnation: 'lifetime' };
  const context = {
    Meteor: { methods: value => { methods = value; }, Error: class extends Error { constructor(code, reason) { super(reason); this.error = code; } } },
    DDPRateLimiter: { addRule() {} }, check: (value, type) => assert.equal(typeof value, 'string'), Match: {},
    Lists: { findOneAsync: async () => ({ ...list, syncCredentialIncarnation: reincarnate && ++listReads > 2 ? 'new' : 'lifetime' }) },
    ReactiveCache: { getBoard: async () => ({ allowed: !revoke || ++accessChecks < 2 }) },
    allowIsBoardMemberWithWriteAccess: (id, board) => board.allowed,
    ListSyncRunReports: { find: (query, opts) => { reads++; selector=query;options=opts;return {fetchAsync:async()=>[{status:'unfinished'}]}; } },
    require: id => id === '/server/lib/syncRunReport' ? { reportScope } :
      id === '/models/lib/boardCardScope' ? { assignedOnlyCardScope: () => restricted ? { members: 'user' } : null } : {},
  };
  vm.createContext(context);
  vm.runInContext(fs.readFileSync('server/methods/listSync.js','utf8').replace(/^import .*;\n/gm,''),context);
  return { invoke: userId => methods.listSyncRunReports.call({ userId }, 'list'),
    state: () => ({ reads, selector, options }) };
}
test('run reports require fresh full-list write access and never publish private records', async () => {
  const allowed = harness();
  assert.equal((await allowed.invoke('user'))[0].status,'unfinished');
  const state=allowed.state();assert.equal(state.options.limit,20);
  assert.equal(state.selector.incarnation,'lifetime');assert.equal(state.selector.boardId,'board');
  assert.ok(state.selector.startedAt.$gte.getTime() < Date.now());
  assert.equal(state.options.fields.coverage,1);assert.equal(state.options.fields.incarnation,undefined);
  for(const setup of [{restricted:true},{revoke:true},{reincarnate:true}]){
    const denied=harness(setup);await assert.rejects(denied.invoke('user'));
    if(setup.restricted)assert.equal(denied.state().reads,0);
  }
  const anonymous=harness();await assert.rejects(anonymous.invoke(null));assert.equal(anonymous.state().reads,0);
  const source=fs.readFileSync('server/lib/listSyncRunReports.js','utf8');
  assert.match(source,/deny\(\{ insert: \(\) => true, update: \(\) => true, remove: \(\) => true/);
  assert.match(source,/expireAfterSeconds: 30 \* 24 \* 60 \* 60/);
});
