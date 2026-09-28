'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { assignedOnlyCardScope } = require('../models/lib/boardCardScope');
const tick = () => new Promise(resolve => setImmediate(resolve));
async function fixture(search) {
  const observers = [], rows = new Map();
  let handler, stop, ready = 0;
  let board = { _id: 'board', permission: 'private', members: [{ userId: 'reader', isActive: true, isReadAssignedOnly: true }] };
  const model = name => ({ rawCollection: () => name, find: () => ({ observeChangesAsync: async callbacks => {
    const handle = { name, callbacks, stopped: false, stop() { this.stopped = true; } };
    observers.push(handle); callbacks.added('initial', {}); return handle;
  } }) });
  const Boards = { ...model('boards'), findOneAsync: async () => structuredClone(board) };
  const source = (fs.readFileSync('server/lib/publishBoardMatches.js', 'utf8').replace('export async function', 'async function') + '\n' +
    fs.readFileSync('server/publications/boardTextMatches.js', 'utf8'))
    .replace(/^import .*;\n/gm, '').replace(/^const \{ assignedOnlyCardScope \} = require\([^\n]+\);\n/m, '');
  vm.runInNewContext(source, { Meteor: { publish: (name, fn) => { handler = fn; }, Error }, check() {},
    Boards, Cards: model('cards'), CardComments: model('comments'), Checklists: model('checklists'), ChecklistItems: model('items'),
    canReadBoard: (id, doc) => !!doc && (doc.permission === 'public' || doc.members.some(m => m.userId === id && m.isActive)),
    assignedOnlyCardScope, boardTextSearch: search,
  });
  const context = { userId: 'reader', onStop: fn => { stop = fn; }, ready: () => ready++,
    added: (collection, id, fields) => rows.set(id, fields), removed: (collection, id) => rows.delete(id),
    error: error => { throw error; } };
  return { observers, rows, context, start: term => handler.call(context, 'board', term),
    setBoard(value) { board = value; }, stop: () => stop(), ready: () => ready };
}
test('publication scopes the join, retracts revoked results and cleans every observer', async () => {
  const scopes = [];
  const f = await fixture(async args => { scopes.push(args.scope); return ['allowed']; });
  await f.start('needle');
  assert.equal(f.rows.size, 1);
  assert.deepEqual(Object.keys([...f.rows.values()][0]).sort(), ['boardId', 'cardId', 'term']);
  assert.equal(scopes[0].assignees.$in[0], 'reader');
  f.setBoard({ _id: 'board', members: [], permission: 'private' });
  f.observers[0].callbacks.changed('board', {});
  assert.equal(f.rows.size, 0, 'board policy changes retract old results immediately');
  await tick(); assert.equal(f.rows.size, 0);
  f.stop(); assert.ok(f.observers.every(handle => handle.stopped));
});
test('authorization is rechecked after an in-flight search even before the observer event', async () => {
  let finish, entered;
  const started = new Promise(resolve => { entered = resolve; });
  const f = await fixture(async () => { entered(); return new Promise(resolve => { finish = resolve; }); });
  const running = f.start('needle'); await started;
  f.setBoard({ _id: 'board', permission: 'private', members: [] });
  finish(['formerly-allowed']); await running;
  assert.equal(f.rows.size, 0); f.stop();
});
test('invalid or unauthorized requests never search and stopped scans never publish', async () => {
  let calls = 0;
  for (const term of ['', ' ', 'x'.repeat(513)]) {
    const f = await fixture(async () => { calls++; return ['secret']; });
    await f.start(term); assert.equal(f.observers.length, 0);
  }
  const denied = await fixture(async () => { calls++; return ['secret']; });
  denied.setBoard({ _id: 'board', permission: 'private', members: [] });
  await denied.start('needle'); denied.stop(); assert.equal(calls, 0);
  let entered, finish;
  const started = new Promise(resolve => { entered = resolve; });
  const f = await fixture(async () => { entered(); return new Promise(resolve => { finish = resolve; }); });
  const running = f.start('needle'); await started; f.stop(); finish(['secret']); await running;
  assert.equal(f.rows.size, 0); assert.ok(f.observers.every(handle => handle.stopped));
});
