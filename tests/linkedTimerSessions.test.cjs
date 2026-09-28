'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(require.resolve('../models/cards.js'), 'utf8');
const start = source.indexOf('  // Flowtime (#3919) session helpers.');
const end = source.indexOf('  getVoteQuestion()', start);
function fixture() {
  const writes = [], credits = [];
  const methods = vm.runInNewContext(`({${source.slice(start, end)}})`, {
    Date, Cards: { updateAsync: async (selector, modifier) => { writes.push({ selector, modifier }); return 1; } },
  });
  const card = { ...methods, _id: 'wrapper', linkedId: 'source', spentTime: 999,
    getRealId: () => 'source', getSpentTime: () => 4,
    setSpentTime: async value => { credits.push(value); } };
  return { card, writes, credits };
}
test('every timer session write targets the displayed wrapper, not its source', async () => {
  const { card, writes } = fixture();
  await card.startFlowSession('actor'); await card.addFlowInterruption();
  card.flowStartAt = new Date(); await card.stopFlowSession();
  await card.startPomodoro('actor', 25);
  card.pomodoroStartAt = new Date(); card.pomodoroPhase = 'work';
  await card.completePomodoroWorkInterval();
  card.pomodoroPhase = 'break'; await card.completePomodoroBreakInterval();
  await card.stopPomodoro();
  assert.equal(writes.length, 7);
  for (const { selector } of writes) assert.equal(selector._id, 'wrapper');
});
test('completed work credits the displayed source total, never the stale wrapper total', async () => {
  const { card, credits } = fixture();
  card.pomodoroStartAt = new Date(); card.pomodoroPhase = 'work'; card.pomodoroWorkMinutes = 30;
  await card.completePomodoroWorkInterval(); assert.equal(credits[0], 4.5);
  card.flowStartAt = new Date(Date.now() - 3600000);
  await card.stopFlowSession(); assert.ok(credits[1] >= 5 && credits[1] < 5.01);
  card.pomodoroStartAt = new Date(Date.now() - 1800000);
  await card.stopPomodoro(); assert.ok(credits[2] >= 4.5 && credits[2] < 4.51);
});
test('failed credit leaves the active timer available instead of clearing it', async () => {
  for (const method of ['stopFlowSession', 'completePomodoroWorkInterval', 'stopPomodoro']) {
    const { card, writes } = fixture();
    card.flowStartAt = card.pomodoroStartAt = new Date(); card.pomodoroPhase = 'work';
    card.setSpentTime = async () => { throw new Error('credit denied'); };
    await assert.rejects(card[method](), /credit denied/); assert.equal(writes.length, 0);
  }
});
test('ending a break never credits working time', async () => {
  const { card, credits } = fixture(); card.pomodoroStartAt = new Date(); card.pomodoroPhase = 'break';
  await card.completePomodoroBreakInterval(); await card.stopPomodoro(); assert.equal(credits.length, 0);
});
test('one spent-time setter handles linked boards instead of being shadowed by a later helper', () => {
  assert.equal([...source.matchAll(/\n  setSpentTime\(spentTime\) \{/g)].length, 1);
  const body = source.match(/  setSpentTime\(spentTime\) \{([\s\S]*?)\n  \},/)[1];
  const calls = [];
  const setter = vm.runInNewContext(`(function(spentTime) {${body}})`, {
    Boards: { updateAsync: (selector, modifier) => calls.push(['board', selector._id, modifier.$set.spentTime]) },
    Cards: { updateAsync: (selector, modifier) => calls.push(['card', selector._id, modifier.$set.spentTime]) },
  });
  setter.call({ isLinkedBoard: () => true, linkedId: 'board' }, 4.5);
  setter.call({ isLinkedBoard: () => false, getRealId: () => 'source' }, 5);
  assert.deepEqual(calls, [['board', 'board', 4.5], ['card', 'source', 5]]);
});
test('Pomodoro countdown transitions once while its asynchronous write is pending', async () => {
  let created, tick, finish, transitions = 0, nonreactive = 0;
  const pending = new Promise(resolve => { finish = resolve; });
  const card = { _id: 'wrapper', pomodoroStartAt: new Date(Date.now() - 60000), pomodoroPhase: 'work',
    isPomodoroActive: () => true, getPomodoroWorkMinutes: () => 1,
    completePomodoroWorkInterval: () => { transitions++; return pending; } };
  const client = fs.readFileSync(require.resolve('../client/components/cards/cardPomodoro.js'), 'utf8').replace(/^import .*;\n/gm, '');
  vm.runInNewContext(client, {
    Template: { cardPomodoro: { onCreated: fn => { created = fn; }, onDestroyed() {}, helpers() {}, events() {} } },
    Cards: { findOne: id => { assert.equal(id, 'wrapper'); return card; } },
    getCurrentCardIdFromContext: () => 'wrapper', Date, Promise, console,
    Tracker: { nonreactive: fn => { nonreactive++; return fn(); } },
    ReactiveVar: class { constructor(value) { this.value = value; } set(value) { this.value = value; } get() { return this.value; } },
    Meteor: { setInterval: fn => { tick = fn; return 1; }, clearInterval() {} },
  });
  const instance = { autorun: fn => fn() }; created.call(instance);
  tick(); tick(); await new Promise(resolve => setImmediate(resolve));
  assert.equal(transitions, 1); assert.equal(nonreactive, 1);
  finish(); await new Promise(resolve => setImmediate(resolve));
  assert.equal(instance.transitioning, false);
});
