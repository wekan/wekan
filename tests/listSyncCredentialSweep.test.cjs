'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { sweepSyncCredentials } = require('../server/lib/listSyncConfiguration');

test('scheduled credential cleanup streams IDs, isolates failures and keeps secret errors out of logs', async () => {
  const source = fs.readFileSync(path.join(__dirname, '../server/listSync.js'), 'utf8');
  let startup, closed = false;
  const jobs = [], logs = [], removed = [], indexed = [];
  const cursor = {
    sort(value) { assert.deepEqual(JSON.parse(JSON.stringify(value)), { listId: 1 }); return this; },
    batchSize(size) { assert.equal(size, 100); return this; },
    async *[Symbol.asyncIterator]() { yield { listId: 'bad' }; yield { listId: 'good' }; yield { listId: 'good' }; },
    async close() { closed = true; },
  };
  const credentials = {
    find: (selector, options) => {
      assert.deepEqual(options, { fields: { _id: 1 }, sort: { _id: 1 }, limit: 500 });
      return { fetchAsync: async () => [{ _id: 'orphan' }] };
    },
    rawCollection: () => ({ find(selector, options) {
      assert.deepEqual(JSON.parse(JSON.stringify(options)), { projection: { _id: 1, listId: 1, incarnation: 1, configurationId: 1 } });
      return cursor;
    } }),
    removeAsync: async selector => { removed.push(selector); return 1; },
  };
  const context = {
    Meteor: { startup(fn) { startup = fn; } },
    SyncedCron: { add(job) { jobs.push(job); } },
    ensureIndex: async (collection, keys) => { assert.equal(collection, credentials); indexed.push(keys); },
    ListSyncCredentials: credentials,
    Lists: {
      findOneAsync: async ({ _id }) => {
        if (_id === 'bad') throw new Error('private-provider-secret');
        return { _id, boardId: 'board' };
      },
      updateAsync: async () => 1,
    },
    sweepSyncCredentials,
    scanListSync: async () => {},
    console: { error: (...args) => logs.push(args.join(' ')) },
  };
  vm.runInNewContext(source.slice(source.lastIndexOf('Meteor.startup(')), context);
  await startup();
  assert.deepEqual(JSON.parse(JSON.stringify(indexed)), [{ listId: 1, _id: 1 }]);
  const cleanup = jobs.find(job => job.name === 'wekan-list-sync-credential-cleanup');
  assert.ok(cleanup);
  assert.ok(jobs.find(job => job.name === 'wekan-list-sync'), 'ordinary Sync must remain scheduled');
  assert.equal(cleanup.schedule({ text: value => value }), 'every 1 hour');
  assert.deepEqual(await cleanup.job(), { cleaned: 1, skipped: 0, failed: 1, orphaned: 0 });
  assert.equal(removed.length, 1); assert.ok(closed);
  assert.doesNotMatch(logs.join('\n'), /private-provider-secret/);
  credentials.rawCollection = () => { throw new Error('private-database-password'); };
  assert.equal((await cleanup.job()).failed, true);
  assert.doesNotMatch(logs.join('\n'), /private-database-password/);
});
