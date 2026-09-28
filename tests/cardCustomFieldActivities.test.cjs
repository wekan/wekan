'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { isDeepStrictEqual } = require('node:util');
const fs = require('node:fs');
const vm = require('node:vm');
const { collectionWriteSucceeded } = require('../server/lib/collectionWriteOutcome');
function harness() {
  const emitted = [];
  let hook;
  const context = {
    EJSON: { equals: isDeepStrictEqual },
    Activities: { insertAsync: async activity => { await Promise.resolve(); emitted.push(activity); } },
    Cards: { after: { update: fn => { hook = fn; } } },
    collectionWriteSucceeded,
    deferSyncRecording: () => false,
  };
  const model = fs.readFileSync('models/cards.js', 'utf8');
  vm.runInNewContext(model.slice(model.indexOf('async function cardCustomFields('), model.indexOf('\nasync function cardCreation')), context);
  const server = fs.readFileSync('server/models/cards.js', 'utf8');
  const start = server.indexOf('// Custom-field rules must observe');
  vm.runInNewContext(server.slice(start, server.indexOf('\n});', start) + 4), context);
  const card = fields => ({ _id: 'card', boardId: 'board', listId: 'list', swimlaneId: 'lane', customFields: fields });
  return { emitted, run: (before, after, outcome = {}, fields = ['customFields']) =>
    hook.call({ previous: card(before), affected: 1, ...outcome }, 'user', card(after), fields) };
}
test('after-write custom-field activities compare identities, preserve zero/false and await insertion', async () => {
  const h = harness();
  await h.run([{ _id: 'points', value: 3 }, { _id: 'other', value: 'keep' }],
    [{ _id: 'other', value: 'keep' }, { _id: 'points', value: 0 }, { _id: 'flag', value: false }]);
  assert.equal(h.emitted.length, 2);
  assert.deepEqual(h.emitted.map(a => [a.customFieldId, a.value, a.activityType]),
    [['points', 0, 'setCustomField'], ['flag', false, 'setCustomField']]);
  for (const a of h.emitted) {
    assert.equal(a.cardId, 'card'); assert.equal(a.listId, 'list');
    assert.equal(a.swimlaneId, 'lane'); assert.equal(a.userId, 'user');
  }
});
test('no-op/reorder/empty assignment, unrelated and failed writes emit nothing', async () => {
  const h = harness(), before = [{ _id: 'a', value: { date: new Date(0), values: [1, 2] } }, { _id: 'b', value: 2 }];
  await h.run(before, [{ _id: 'b', value: 2 }, { _id: 'a', value: { date: new Date(0), values: [1, 2] } }, { _id: 'empty', value: null }]);
  for (const outcome of [{ affected: 0 }, { affected: 1, err: new Error('failed') }, { previous: undefined }, { affected: undefined }]) {
    await h.run(before, [], outcome);
  }
  await h.run(before, [], {}, ['title']);
  assert.equal(h.emitted.length, 0);
});
test('removed entries, explicit null and missing values clear only previously valued fields', async () => {
  const h = harness();
  await h.run([{ _id: 'removed', value: 0 }, { _id: 'null', value: false }, { _id: 'unset', value: 'x' }, { _id: 'empty', value: null }],
    [{ _id: 'null', value: null }, { _id: 'unset' }]);
  assert.deepEqual(h.emitted.map(a => a.customFieldId), ['removed', 'null', 'unset']);
  assert.ok(h.emitted.every(a => a.activityType === 'unsetCustomField' && !Object.hasOwn(a, 'value')));
});
