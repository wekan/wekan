'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { createHash } = require('node:crypto');
const { MongoClient, ObjectId } = require('mongodb');
const uri = process.env.WEKAN_SYNC_TEST_MONGO_URL;
test('preset writes are atomic per owner/board/name and deletion hooks clean only their own scope', { skip: !uri }, async t => {
  const { validateFilterPresetState, FILTER_PRESET_SETS, FILTER_PRESET_TEXTS } = await import('../../models/lib/filterPresetState.js');
  const client = await new MongoClient(uri).connect(), db = client.db(`preset_${new ObjectId().toHexString()}`);
  t.after(async () => { await db.dropDatabase(); await client.close(); });
  const collection = db.collection('savedCardFilters');
  const range = { field: 'createdAt', from: '', to: '', includeMissing: false };
  const state = { version: 1, sets: Object.fromEntries(FILTER_PRESET_SETS.map(key => [key, []])),
    texts: Object.fromEntries(FILTER_PRESET_TEXTS.map(key => [key, ''])), labelMode: 'or', due: null,
    dateRange: range, movementDate: range, dateRecency: { createdAt: '', modifiedAt: '' }, columnAge: { listId: '', days: 30 } };
  let methods, removeBoard, removeUser;
  const boards = db.collection('boards');
  await boards.insertMany(['a', 'b'].map(_id => ({ _id, permission: 'private', members: ['one', 'two'] })));
  // server/filterPresets.js reads boardPermission (semi-open boards, f122a8287);
  // the sandbox hands it the real module and nothing else.
  const sandboxRequire = id => {
    if (id !== '/models/lib/boardPermission') throw new Error(`unexpected require ${id}`);
    return require('../../models/lib/boardPermission.js');
  };
  const context = { createHash, validateFilterPresetState, check() {}, Match: { Any: 'any' }, require: sandboxRequire,
    Meteor: { methods: value => { methods = value; }, Error: class extends Error { constructor(code) { super(code); this.error = code; } },
      users: { after: { remove: hook => { removeUser = hook; } } } },
    Mongo: { Collection: class { rawCollection() { return collection; } async removeAsync(query) { return (await collection.deleteMany(query)).deletedCount; } } },
    Boards: { findOneAsync: id => boards.findOne({ _id: id }), after: { remove: hook => { removeBoard = hook; } } },
    canReadBoard: (user, board) => !!board?.members.includes(user), publishComposite() {}, DDPRateLimiter: { addRule() {} },
  };
  vm.runInNewContext(fs.readFileSync('server/filterPresets.js', 'utf8').replace(/^import .*;\n/gm, ''), context);
  const save = (owner, board, name, value = state) => methods['filterPresets.save'].call({ userId: owner }, board, name, value);
  const ids = await Promise.all(Array.from({ length: 10 }, () => save('one', 'a', 'Same name')));
  assert.equal(new Set(ids).size, 1); assert.equal(await collection.countDocuments({}), 1);
  const other = await save('two', 'a', 'Same name'); assert.notEqual(other, ids[0]);
  const elsewhere = await save('one', 'b', 'Same name');
  await assert.rejects(save('outsider', 'a', 'Denied'), { error: 'not-authorized' });
  await assert.rejects(save('one', 'a', 'Invalid', { ...state, version: 999 }), { error: 'invalid-filter-preset' });
  await assert.rejects(methods['filterPresets.remove'].call({ userId: 'two' }, 'a', ids[0]), { error: 'preset-not-found' });
  await removeBoard('one', { _id: 'a' });
  assert.equal(await collection.countDocuments({}), 1); assert.ok(await collection.findOne({ _id: elsewhere }));
  await save('two', 'b', 'Keep'); await removeUser('admin', { _id: 'one' });
  assert.equal(await collection.countDocuments({ ownerId: 'one' }), 0);
  assert.equal(await collection.countDocuments({ ownerId: 'two' }), 1);
});
