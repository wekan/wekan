'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(require.resolve('../server/rulesHelper.js'), 'utf8');
const object = source.slice(source.indexOf('export const RulesHelper = ') + 'export const RulesHelper = '.length).trim().replace(/;$/, '');
const activity = { cardId: 'card', boardId: 'board', userId: 'actor' };
const cases = [
  ...['addLabel', 'removeLabel', 'removeAllLabels'].map(actionType => [{ actionType, labelId: 'label' }, actionType]),
  [{ actionType: 'linkCard', boardId: 'board', listName: 'List', swimlaneName: 'Lane' }, 'link'],
];
for (const [dateField, suffix] of [['startAt', 'Start'], ['endAt', 'End'], ['dueAt', 'Due'], ['receivedAt', 'Received']]) {
  for (const actionType of ['setDate', 'updateDate', 'removeDate', 'setDateRelative']) {
    cases.push([{ actionType, dateField, days: 2 }, `${actionType === 'removeDate' ? 'unset' : 'set'}${suffix}`]);
  }
}
function fixture(action, method) {
  let release, reject, started, calls = 0;
  const entered = new Promise(resolve => { started = resolve; });
  const pending = new Promise((resolve, fail) => { release = resolve; reject = fail; });
  // Observe the injected failure even in a regression where the caller drops
  // the Promise; the assertion must report early completion, not crash Node.
  pending.catch(() => {});
  const card = { _id: 'card', getStart() {}, getEnd() {}, getDue() {}, getReceived() {},
    [method]() { calls++; started(); return calls === 1 ? pending : Promise.resolve(); } };
  const helper = vm.runInNewContext(`(${object})`, {
    // Rules with several triggers/actions (models/lib/ruleParts.js).
    ...require('../models/lib/ruleParts.js'),
    console: { error() {} },
    buildRuleVars: async () => ({}),
    relativeDateOffset: () => new Date(1234),
    resolveRuleListId: row => row._id, resolveRuleSwimlaneId: row => row._id,
    getDestBoardDefaultSwimlane: async () => ({ _id: 'lane' }),
    ReactiveCache: { getCard: async () => card, getList: async () => ({ _id: 'list' }),
      getSwimlane: async () => ({ _id: 'lane' }) },
  });
  helper.findMatchingRules = async () => [{ getAction: async () => action }, { getAction: async () => action }];
  return { helper, entered, release, reject, calls: () => calls };
}
for (const [action, method] of cases) {
  const name = `${action.actionType} ${action.dateField || ''}`.trim();
  test(`${name} waits for its write before the next matched rule`, async () => {
    const f = fixture(action, method);
    let finished = false;
    const execution = f.helper.executeRules(activity).then(() => { finished = true; });
    await f.entered;
    await new Promise(resolve => setImmediate(resolve));
    const early = finished, callsBeforeRelease = f.calls();
    f.release();
    await execution;
    assert.equal(early, false);
    assert.equal(callsBeforeRelease, 1);
    assert.equal(f.calls(), 2);
  });
  test(`${name} propagates write rejection and stops later rules`, async () => {
    const f = fixture(action, method), failure = new Error('write refused');
    const execution = f.helper.executeRules(activity);
    const rejected = assert.rejects(execution, error => error === failure);
    await f.entered;
    f.reject(failure);
    await rejected;
    assert.equal(f.calls(), 1);
  });
}
