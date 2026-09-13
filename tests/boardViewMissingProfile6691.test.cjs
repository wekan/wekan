'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const settings = require('../models/lib/boardViewSettings');
const source = fs.readFileSync('client/lib/utils.js', 'utf8');
const methods = source.slice(source.indexOf('  boardView() {'), source.indexOf('  // `swimlaneId` scopes'));
let user, browserView, pending = null, board = null;
const context = {
  ...settings,
  pendingBoardView: { get: () => pending, set: value => { pending = value; } },
  ReactiveCache: { getCurrentUser: () => user },
  window: { localStorage: { getItem: () => browserView,
    setItem: () => { throw Error('Reading a view must not write storage'); } } },
};
vm.createContext(context);
vm.runInContext(`var Utils = {${methods} getCurrentBoard() { return currentBoard(); }, reload() { throw Error('Reading a view must not reload'); } };`,
  Object.assign(context, { currentBoard: () => board }));
const Utils = context.Utils;
for (const profile of [undefined, {}, { boardView: undefined }, { boardView: '' }, { boardView: 'invalid' }]) {
  user = { _id: 'member', profile };
  for (const stored of [null, '', 'invalid', 'board-view-swimlanes', 'board-view-lists', 'board-view-cal']) {
    browserView = stored;
    assert.equal(Utils.storedBoardView(), settings.isKnownBoardView(stored) ? stored : settings.DEFAULT_BOARD_VIEW);
    assert.equal(Utils.boardView(), Utils.storedBoardView());
  }
}
user = { profile: { boardView: 'board-view-lists' } };
browserView = 'board-view-cal';
assert.equal(Utils.boardView(), 'board-view-lists', 'published preference wins');
user.boardViewPreference = 'board-view-swimlanes';
assert.equal(Utils.boardView(), 'board-view-swimlanes', 'private preference survives a competing partial profile');
user.boardViewPreference = 'board-view-lists';
pending = 'board-view-cal';
user.profile.boardView = pending;
assert.equal(Utils.boardView(), 'board-view-cal');
assert.equal(pending, 'board-view-cal', 'stale private preference cannot acknowledge a pending choice');
user.boardViewPreference = pending;
assert.equal(Utils.boardView(), 'board-view-cal');
assert.equal(pending, null);
delete user.boardViewPreference;

pending = 'board-view-swimlanes';
assert.equal(Utils.boardView(), pending, 'pending choice wins until publication catches up');
user.profile.boardView = pending;
assert.equal(Utils.boardView(), 'board-view-swimlanes');
assert.equal(pending, null);
user = { profile: {} }; browserView = null;
board = { permission: 'private', defaultPrivateBoardView: 'board-view-lists', boardViewSettings: { 'board-view-swimlanes': { showOnPrivate: false } } };
assert.equal(Utils.boardView(), 'board-view-lists', 'board default is honored');
board = null;
const listSource = fs.readFileSync('client/components/lists/listBody.js', 'utf8');
const scope = listSource.slice(listSource.indexOf('  this.idOrNull ='), listSource.indexOf('  this.addCard ='));
context.instance = { data: { board: () => ({ isTemplatesBoard: () => false }) } };
vm.runInContext(`(function() { ${scope} }).call(instance);`, context);
assert.equal(context.instance.idOrNull('lane-A'), 'lane-A', 'partial profile retains swimlane scope');
assert.equal(context.instance.idOrNull('lane-B'), 'lane-B');
browserView = 'board-view-lists';
assert.equal(context.instance.idOrNull('lane-A'), undefined, 'list view stays unscoped');
context.instance.data = null;
assert.equal(context.instance.idOrNull('lane-A'), undefined);
(async () => {
  let publish, observer, selector, options, cleanup;
  const messages = [];
  let stops = 0;
  const handle = { stop: () => { stops++; } };
  vm.runInNewContext(fs.readFileSync('server/publications/userBoardView.js', 'utf8').replace(/^import .*;\n/m, ''), {
    Meteor: { publish: (name, handler) => { assert.equal(name, 'userBoardView'); publish = handler; },
      users: { find: (filter, projection) => {
        selector = JSON.parse(JSON.stringify(filter)); options = JSON.parse(JSON.stringify(projection));
        return { observeChangesAsync: async callbacks => {
          observer = callbacks; callbacks.added(filter._id, { profile: { boardView: 'board-view-swimlanes' } });
          return handle;
        } };
      } } },
  });
  assert.equal(await publish.call({ userId: null, ready: () => 'ready' }, 'victim'), 'ready');
  for (const id of ['admin', 'impersonated-member']) {
    messages.length = 0;
    await publish.call({ userId: id, onStop: callback => { cleanup = callback; },
      added: (collection, userId, fields) => messages.push(['added', collection, userId, JSON.parse(JSON.stringify(fields))]),
      changed: (collection, userId, fields) => messages.push(['changed', collection, userId, fields.boardViewPreference]),
      removed: (collection, userId) => messages.push(['removed', collection, userId]),
      ready: () => messages.push(['ready']),
    }, 'victim');
    assert.deepEqual(selector, { _id: id }, 'client-supplied IDs cannot select another user');
    assert.deepEqual(options, { fields: { 'profile.boardView': 1 } });
    assert.deepEqual(messages, [['added', 'users', id, { boardViewPreference: 'board-view-swimlanes' }], ['ready']]);
    observer.changed(id, { profile: { boardView: 'board-view-lists' } });
    observer.changed(id, {});
    observer.removed(id);
    assert.deepEqual(messages.slice(2), [['changed', 'users', id, 'board-view-lists'], ['changed', 'users', id, undefined], ['removed', 'users', id]],
      'preference changes, unsets and deleted users remain reactive');
    cleanup();
    const count = messages.length;
    observer.added(id, { profile: { boardView: 'board-view-cal' } });
    assert.equal(messages.length, count, 'stopped subscriptions send no preference');
  }
  assert.equal(stops, 2, 'every observer is stopped');
  console.log('boardViewMissingProfile6691: private preference publication, reactivity and cleanup passed');
})().catch(error => { console.error(error); process.exitCode = 1; });
assert.match(fs.readFileSync('server/imports.js', 'utf8'), /import '\/server\/publications\/userBoardView'/);
assert.match(fs.readFileSync('client/00-startup.js', 'utf8'), /Meteor\.subscribe\('userBoardView'\)/);
console.log('boardViewMissingProfile6691: fallback, scoping, defaults and private publication passed');

(async () => {
  const serverSource = fs.readFileSync('server/models/users.js', 'utf8');
  const method = serverSource.slice(serverSource.indexOf('  async impersonate(userId) {'), serverSource.indexOf('  async isImpersonated(userId) {'));
  let finishSwitch;
  const switched = new Promise(resolve => { finishSwitch = resolve; });
  let enteredSwitch;
  const entered = new Promise(resolve => { enteredSwitch = resolve; });
  const calls = [];
  const methods = vm.runInNewContext(`({${method}})`, {
    check: () => {}, Match: { Any: {}, test: value => typeof value === 'string' },
    Meteor: { Error: class extends Error { constructor(code, message) { super(message); this.error = code; } } },
    ReactiveCache: { getUser: async () => ({ _id: 'member' }), getCurrentUser: async () => ({ _id: 'admin', isAdmin: true }) },
    ImpersonatedUsers: { insertAsync: async () => { calls.push('record'); } },
  });
  let returned = false;
  const result = methods.impersonate.call({ setUserId: id => { calls.push(id); enteredSwitch(); return switched; } }, 'member').then(() => { returned = true; });
  // Let the real async method reach setUserId, but leave its promise pending.
  await entered;
  assert.deepEqual(calls, ['record', 'member']);
  assert.equal(returned, false, 'method must not return before subscriptions finish switching');
  finishSwitch();
  await result;
  assert.equal(returned, true);
  await assert.rejects(methods.impersonate.call({}, ''), /user id is required/);
  await assert.rejects(methods.impersonate.call({ setUserId: async () => { throw Error('switch failed'); } }, 'member'), /switch failed/,
    'subscription-switch failures propagate to the client');
  console.log('boardViewMissingProfile6691: impersonation awaits the Meteor 3 subscription transition');
})().catch(error => { console.error(error); process.exitCode = 1; });
