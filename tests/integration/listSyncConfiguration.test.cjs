'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { MongoClient, ObjectId } = require('mongodb');
const { readSyncCredential, commitSyncConfiguration } = require('../../server/lib/listSyncConfiguration');
const uri = process.env.WEKAN_SYNC_TEST_MONGO_URL;

test('Sync configuration selects immutable credentials atomically in a real database', { skip: !uri }, async t => {
  const clients = [new MongoClient(uri), new MongoClient(uri)];
  const name = `sync_config_${new ObjectId().toHexString()}`;
  await Promise.all(clients.map(client => client.connect()));
  const db = clients[0].db(name);
  t.after(async () => { await db.dropDatabase(); await Promise.all(clients.map(client => client.close())); });
  const adapter = collection => ({
    findOneAsync: selector => collection.findOne(selector),
    insertAsync: doc => collection.insertOne(doc),
    updateAsync: async (selector, modifier) => (await collection.updateOne(selector, modifier)).matchedCount,
    removeAsync: selector => collection.deleteMany(selector),
  });
  const contexts = clients.map(client => ({
    lists: adapter(client.db(name).collection('lists')),
    credentials: adapter(client.db(name).collection('credentials')),
    assertCurrent: async () => {},
  }));
  const oldSource = { type: 'jira', projectKey: 'OLD' };
  const newSource = { type: 'jira', projectKey: 'NEW' };
  const newCredential = { sourceKey: 'new-source', token: 'new-test-token' };
  async function seed(id) {
    const list = { _id: id, boardId: 'board', syncSource: oldSource };
    const previousCredential = { _id: `${id}-legacy`, listId: id, sourceKey: 'old-source', token: 'old-test-token' };
    await db.collection('lists').insertOne(list);
    await db.collection('credentials').insertOne(previousCredential);
    return { list, previousCredential, source: newSource, credential: newCredential };
  }
  const current = id => db.collection('lists').findOne({ _id: id });
  const read = list => readSyncCredential(contexts[0].credentials, list);

  await t.test('normal save selects settings and token together and removes the superseded token', async () => {
    const input = await seed('normal');
    assert.deepEqual(await commitSyncConfiguration({ ...contexts[0], ...input }), { ok: true });
    const list = await current('normal');
    assert.deepEqual(list.syncSource, newSource);
    assert.equal((await read(list)).token, newCredential.token);
    assert.equal(await db.collection('credentials').countDocuments({ listId: 'normal' }), 1);
    assert.ok(!JSON.stringify(list).includes('token'));
  });
  await t.test('crash after staging leaves the previous pair active', async () => {
    const input = await seed('before-commit');
    let checks = 0;
    await assert.rejects(commitSyncConfiguration({ ...contexts[0], ...input,
      assertCurrent: async () => { if (++checks === 2) throw new Error('simulated stop'); },
    }), /simulated stop/);
    const list = await current(input.list._id);
    assert.deepEqual(list, input.list);
    assert.equal((await read(list)).token, input.previousCredential.token);
    assert.equal(await db.collection('credentials').countDocuments({ listId: list._id }), 2);
  });
  await t.test('crash after commit or lost acknowledgement keeps the new pair active', async () => {
    for (const failure of ['cleanup', 'acknowledgement']) {
      const input = await seed(failure);
      const ctx = { ...contexts[0] };
      if (failure === 'cleanup') ctx.credentials = { ...ctx.credentials, removeAsync: async () => { throw new Error('simulated stop'); } };
      else ctx.lists = { ...ctx.lists, updateAsync: async (...args) => {
        await contexts[0].lists.updateAsync(...args); throw new Error('simulated stop');
      } };
      await assert.rejects(commitSyncConfiguration({ ...ctx, ...input }), /simulated stop/);
      const list = await current(input.list._id);
      assert.deepEqual(list.syncSource, newSource);
      assert.equal((await read(list)).token, newCredential.token);
    }
  });
  await t.test('two stale writers cannot select mixed settings and credentials', async () => {
    const input = await seed('race');
    let ready = 0, release;
    const barrier = new Promise(resolve => { release = resolve; });
    const attempts = contexts.map((ctx, index) => {
      let checks = 0;
      return commitSyncConfiguration({ ...ctx, ...input,
        source: { type: 'jira', projectKey: String(index) },
        credential: { sourceKey: String(index), token: `test-token-${index}` },
        assertCurrent: async () => {
          if (++checks === 2) { if (++ready === 2) release(); await barrier; }
        },
      });
    });
    const results = await Promise.allSettled(attempts);
    assert.equal(results.filter(result => result.status === 'fulfilled').length, 1);
    assert.equal(results.find(result => result.status === 'rejected').reason.code, 'sync-config-changed');
    const list = await current('race');
    assert.equal((await read(list)).token, `test-token-${list.syncSource.projectKey}`);
    assert.equal(await db.collection('credentials').countDocuments({ listId: 'race' }), 1);
  });
  await t.test('a delayed clear cleanup cannot delete a subsequent save', async () => {
    const input = await seed('clear');
    let finishCleanup, cleanupStarted;
    const cleanup = new Promise(resolve => { finishCleanup = resolve; });
    const started = new Promise(resolve => { cleanupStarted = resolve; });
    const clearing = commitSyncConfiguration({ ...contexts[0], ...input, source: null,
      credentials: { ...contexts[0].credentials, removeAsync: async selector => {
        cleanupStarted(); await cleanup; return contexts[0].credentials.removeAsync(selector);
      } },
    });
    await started;
    const cleared = await current('clear');
    assert.equal(await read(cleared), null);
    await commitSyncConfiguration({ ...contexts[1], ...input, list: cleared, previousCredential: null });
    finishCleanup(); await clearing;
    assert.equal((await read(await current('clear'))).token, newCredential.token);
    await assert.rejects(commitSyncConfiguration({ ...contexts[0], ...input, source: null }), { code: 'sync-config-changed' });
    assert.equal((await read(await current('clear'))).token, newCredential.token);
  });
  await t.test('save then clear cannot resurrect an earlier empty configuration', async () => {
    const list = { _id: 'aba', boardId: 'board' };
    await db.collection('lists').insertOne(list);
    const input = { list, source: newSource, credential: newCredential };
    await commitSyncConfiguration({ ...contexts[0], ...input });
    const saved = await current('aba');
    await commitSyncConfiguration({ ...contexts[0], list: saved, source: null, previousCredential: await read(saved) });
    await assert.rejects(commitSyncConfiguration({ ...contexts[1], ...input }), { code: 'sync-config-changed' });
    assert.equal((await current('aba')).syncSource, undefined);
    assert.equal(await read(await current('aba')), null);
  });
  await t.test('missing version never falls back to a legacy or staged token', async () => {
    const input = await seed('missing-version');
    const list = { ...input.list, syncRevision: 'absent' };
    assert.equal(await read(list), null);
    assert.equal(await read({ ...list, syncRevision: '' }), null);
    assert.equal(await read({ ...list, _id: 'other-list' }), null);
  });
});
