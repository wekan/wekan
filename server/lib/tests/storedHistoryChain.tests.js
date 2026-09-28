import assert from 'node:assert/strict';
import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';
import ChangeHistory from '/models/changeHistory';
import { HistoryWriterGates, migrateStoredHistoryChain, HistoryChainHeads, initializeStoredHistoryChain, appendStoredHistoryChain } from '/server/lib/storedHistoryChain';
const { rowHashIsValid } = require('/models/lib/changeHistoryIntegrity');
describe('Stored History chain collections', function () {
  this.timeout(15000);
  it('validates before reservation and preserves exact schema-backed chain rows', async function () {
    if (!Meteor.isAppTest) this.skip();
    const boardId = Random.id(), ids = Array.from({ length: 6 }, () => Random.id());
    const input = id => ({ _id: id, boardId, entityType: 'card', entityId: 'card', userId: 'actor',
      changeType: 'edited', group: 'title', newContent: { field: 'title', value: `  ${id}  ` }, createdAt: new Date(1000) });
    const assertCurrent = async () => {};
    try {
      await assert.rejects(appendStoredHistoryChain({ row: input(ids[0]), assertCurrent }), /not-initialized/);
      await initializeStoredHistoryChain({ boardId, assertExclusive: assertCurrent });
      for (const patch of [{ entityType: 'invalid' }, { changeType: 'invalid' }, { userId: 42 }, { extraField: true }]) {
        await assert.rejects(appendStoredHistoryChain({ row: { ...input(ids[0]), ...patch }, assertCurrent }), /schema-invalid/);
      }
      assert.equal((await HistoryChainHeads.findOneAsync({ boardId })).pending, null);
      assert.equal(await ChangeHistory.find({ boardId }).countAsync(), 0);
      await Promise.all(ids.map(id => appendStoredHistoryChain({ row: input(id), assertCurrent })));
      const rows = await ChangeHistory.find({ boardId }, { transform: null }).fetchAsync();
      assert.equal(rows.length, ids.length);
      const successors = new Map();
      for (const row of rows) {
        assert.ok(rowHashIsValid(row)); assert.ok(!successors.has(row.previousHash));
        successors.set(row.previousHash, row.integrityHash);
        assert.equal(row.swimlaneId, null); assert.equal(row.undone, false);
        assert.equal(row.newContent.value, `  ${row._id}  `); assert.equal(row.createdAt.getTime(), 1000);
      }
      let hash = null, count = 0;
      while (successors.has(hash)) { hash = successors.get(hash); count++; }
      assert.equal(count, ids.length); assert.equal((await HistoryChainHeads.findOneAsync({ boardId })).hash, hash);
      await appendStoredHistoryChain({ row: input(ids[0]), assertCurrent });
      assert.equal(await ChangeHistory.find({ boardId }).countAsync(), ids.length);
      await assert.rejects(appendStoredHistoryChain({ row: { ...input(ids[0]), userId: 'changed' }, assertCurrent }), /row-conflict/);
    } finally {
      await ChangeHistory.rawCollection().deleteMany({ boardId });
      await HistoryChainHeads.rawCollection().deleteMany({ boardId });
    }
  });
});


describe('Ordinary History writer migration', function () {
  this.timeout(15000);
  it('routes record through admission and permanently switches a migrated board to one chain', async function () {
    if (!Meteor.isAppTest) this.skip();
    const boardId = Random.id(), migrationId = require('node:crypto').randomUUID();
    const record = value => ChangeHistory.record({ boardId, entityType: 'card', entityId: 'card',
      changeType: 'edited', group: 'title', userId: 'actor', newContent: { field: 'title', value } });
    try {
      assert.ok(await record('before'));
      assert.equal((await HistoryWriterGates.findOneAsync({ boardId })).mode, 'legacy');
      await assert.rejects(migrateStoredHistoryChain({ boardId, migrationId }), /deployment-guard-required/);
      await migrateStoredHistoryChain({ boardId, migrationId, assertDeploymentExclusive: async () => {} });
      assert.equal((await HistoryWriterGates.findOneAsync({ boardId })).mode, 'coordinated');
      const ids = await Promise.all(Array.from({ length: 10 }, (_, i) => record(`after-${i}`)));
      assert.ok(ids.every(id => typeof id === 'string')); assert.equal(new Set(ids).size, 10);
      const rows = await ChangeHistory.find({ boardId }, { transform: null }).fetchAsync();
      const successors = new Map();
      for (const row of rows) { assert.ok(rowHashIsValid(row)); assert.ok(!successors.has(row.previousHash)); successors.set(row.previousHash, row.integrityHash); }
      let head = null, count = 0; while (successors.has(head)) { head = successors.get(head); count++; }
      assert.equal(count, 11); assert.equal((await HistoryChainHeads.findOneAsync({ boardId })).hash, head);
      await HistoryChainHeads.rawCollection().deleteOne({ boardId });
      // Best-effort recording must not fall back to the unsafe old writer when
      // a migrated head disappears. The gate stays coordinated for recovery.
      assert.equal(await record('no fallback'), null);
      assert.equal(await ChangeHistory.find({ boardId }).countAsync(), 11);
      assert.equal((await HistoryWriterGates.findOneAsync({ boardId })).mode, 'coordinated');
    } finally {
      await ChangeHistory.rawCollection().deleteMany({ boardId });
      await HistoryChainHeads.rawCollection().deleteMany({ boardId });
      await HistoryWriterGates.rawCollection().deleteMany({ boardId });
    }
  });
});
