'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { MongoClient, ObjectId } = require('mongodb');
const { readSyncCredential, commitSyncConfiguration, cleanupSyncCredentials, sweepSyncCredentials } = require('../../server/lib/listSyncConfiguration');
const uri = process.env.WEKAN_SYNC_TEST_MONGO_URL;

test('Sync configuration selects immutable credentials atomically in a real database', { skip: !uri }, async t => {
  const clients = [new MongoClient(uri), new MongoClient(uri)];
  const name = `sync_config_${new ObjectId().toHexString()}`;
  await Promise.all(clients.map(client => client.connect()));
  const db = clients[0].db(name);
  t.after(async () => { await db.dropDatabase(); await Promise.all(clients.map(client => client.close())); });
  const adapter = collection => ({
    findOneAsync: selector => collection.findOne(selector),
    find: (selector, options) => ({ fetchAsync: () => collection.find(selector,
      { projection: options.fields }).sort(options.sort).limit(options.limit).toArray() }),
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
  const newCredential = { sourceKey: 'new-source', token: 'new-test-token', runAsUserId: 'saving-user' };
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
    assert.equal((await read(list)).runAsUserId, 'saving-user');
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
  const cleanup = async (id, overrides = {}) => cleanupSyncCredentials({ ...contexts[0], list: await current(id), ...overrides });
  await t.test('cleanup removes interrupted stages, retains legacy selection and fences a delayed activation', async () => {
    const input = await seed('cleanup-stage');
    let staged, resume;
    const ready = new Promise(resolve => { staged = resolve; });
    const gate = new Promise(resolve => { resume = resolve; });
    let checks = 0;
    const saving = commitSyncConfiguration({ ...contexts[0], ...input, assertCurrent: async () => {
      if (++checks === 2) { staged(); await gate; }
    } });
    await ready;
    await cleanup(input.list._id);
    assert.equal(await db.collection('credentials').countDocuments({ listId: input.list._id }), 1);
    assert.equal((await read(await current(input.list._id))).token, input.previousCredential.token);
    resume(); await assert.rejects(saving, { code: 'sync-config-changed' });
    assert.equal((await read(await current(input.list._id))).token, input.previousCredential.token);
  });
  await t.test('a late old-generation insert cannot activate and is collected on the next sweep', async () => {
    const input = await seed('late-insert');
    let resume, inserting;
    const ready = new Promise(resolve => { inserting = resolve; });
    const gate = new Promise(resolve => { resume = resolve; });
    const saving = commitSyncConfiguration({ ...contexts[0], ...input,
      credentials: { ...contexts[0].credentials, insertAsync: async doc => {
        inserting(); await gate; return contexts[0].credentials.insertAsync(doc);
      } }, assertCurrent: async () => {
        if ((await current(input.list._id)).syncCredentialGeneration) throw new Error('stopped');
      },
    });
    await ready; await cleanup(input.list._id); resume();
    await assert.rejects(saving, /stopped/);
    assert.equal(await db.collection('credentials').countDocuments({ listId: input.list._id }), 2);
    await cleanup(input.list._id);
    assert.equal(await db.collection('credentials').countDocuments({ listId: input.list._id }), 1);
  });
  await t.test('delayed cleanup preserves newer selected and staged credentials', async () => {
    const input = await seed('delayed-sweep');
    let resume, deleting;
    const ready = new Promise(resolve => { deleting = resolve; });
    const gate = new Promise(resolve => { resume = resolve; });
    const sweeping = cleanup(input.list._id, { credentials: { ...contexts[0].credentials, removeAsync: async selector => {
      deleting(); await gate; return contexts[0].credentials.removeAsync(selector);
    } } });
    await ready;
    const fenced = await current(input.list._id);
    await commitSyncConfiguration({ ...contexts[1], ...input, list: fenced });
    const active = await current(input.list._id);
    await db.collection('credentials').insertOne({ _id: 'new-stage', configurationId: 'new-stage',
      listId: input.list._id, generation: active.syncCredentialGeneration, token: 'later-stage' });
    resume(); await sweeping;
    assert.equal((await read(await current(input.list._id))).token, newCredential.token);
    assert.ok(await db.collection('credentials').findOne({ _id: 'new-stage' }));
    await cleanup(input.list._id);
    assert.equal(await db.collection('credentials').countDocuments({ listId: input.list._id }), 1);
  });
  await t.test('interrupted or ambiguous cleanup is repeatable without changing the selected credential', async () => {
    for (const phase of ['fence', 'delete']) {
      const input = await seed(`failed-sweep-${phase}`);
      await commitSyncConfiguration({ ...contexts[0], ...input });
      const selected = (await current(input.list._id)).syncRevision;
      await db.collection('credentials').insertOne({ _id: `unused-${phase}`, configurationId: `unused-${phase}`,
        listId: input.list._id, token: 'unused' });
      const override = phase === 'fence' ? { lists: { ...contexts[0].lists, updateAsync: async (...args) => {
        await contexts[0].lists.updateAsync(...args); throw new Error('uncertain');
      } } } : { credentials: { ...contexts[0].credentials, removeAsync: async () => { throw new Error('uncertain'); } } };
      await assert.rejects(cleanup(input.list._id, override), /uncertain/);
      assert.equal((await read(await current(input.list._id)))._id, selected);
      await cleanup(input.list._id);
      assert.equal((await read(await current(input.list._id)))._id, selected);
      assert.equal(await db.collection('credentials').countDocuments({ listId: input.list._id }), 1);
    }
  });
  await t.test('stale sweep snapshots do not delete and disconnected lists retire every old version', async () => {
    const input = await seed('stale-sweep');
    await commitSyncConfiguration({ ...contexts[0], ...input });
    assert.equal((await cleanup(input.list._id, { list: input.list })).skipped, true);
    const selected = await current(input.list._id);
    await commitSyncConfiguration({ ...contexts[0], list: selected, source: null });
    await cleanup(input.list._id);
    assert.equal(await db.collection('credentials').countDocuments({ listId: input.list._id }), 0);
  });
  await t.test('overlapping sweep workers share one generation transition', async () => {
    const input = await seed('sweep-race');
    await commitSyncConfiguration({ ...contexts[0], ...input });
    const list = await current(input.list._id);
    await db.collection('credentials').insertOne({ _id: 'race-orphan', listId: list._id,
      configurationId: 'race-orphan', generation: 0, token: 'unused' });
    const results = await Promise.all(contexts.map(ctx => cleanupSyncCredentials({ ...ctx, list })));
    assert.equal(results.filter(result => result.skipped).length, 1);
    assert.equal((await current(list._id)).syncCredentialGeneration, 1);
    assert.equal((await read(await current(list._id)))._id, list.syncRevision);
    assert.equal(await db.collection('credentials').countDocuments({ listId: list._id }), 1);
  });
  await t.test('damaged and exhausted generations repair without reviving old saves', async () => {
    for (const [index, generation] of [null, -1, 0.5, Number.MAX_SAFE_INTEGER, '1', NaN, Infinity, {}, []].entries()) {
      const input = await seed(`bad-generation-${index}`);
      const list = { ...input.list, syncCredentialGeneration: generation };
      await db.collection('lists').replaceOne({ _id: list._id }, list);
      await db.collection('credentials').insertOne({ _id: `bad-stage-${index}`, configurationId: `bad-stage-${index}`,
        listId: list._id, generation, token: 'unselected' });
      await cleanup(list._id);
      const repaired = await current(list._id);
      assert.equal(repaired.syncCredentialGeneration, 0);
      assert.equal(typeof repaired.syncCredentialFence, 'string');
      assert.equal((await read(repaired)).token, input.previousCredential.token);
      assert.equal(await db.collection('credentials').countDocuments({ listId: list._id }), 1);
      await assert.rejects(commitSyncConfiguration({ ...contexts[0], ...input, list }), /settings changed/);
      await commitSyncConfiguration({ ...contexts[0], ...input, list: repaired });
      assert.equal((await read(await current(list._id))).token, newCredential.token);
      // Direct settings saves repair too, even when no credential rows exist.
      const empty = { _id: `empty-bad-${index}`, boardId: 'board', syncCredentialGeneration: generation };
      await db.collection('lists').insertOne(empty);
      await commitSyncConfiguration({ ...contexts[0], ...input, list: empty, previousCredential: null });
      assert.equal((await current(empty._id)).syncCredentialGeneration, 0);
      assert.equal(typeof (await current(empty._id)).syncCredentialFence, 'string');
      assert.equal((await read(await current(empty._id))).token, newCredential.token);
    }
  });
  await t.test('cleanup deletes a bounded snapshot, never stages from a later fence', async () => {
    const input = await seed('bounded-reset');
    await commitSyncConfiguration({ ...contexts[0], ...input });
    await db.collection('credentials').insertMany(Array.from({ length: 505 }, (_, i) => ({
      _id: `bounded-${String(i).padStart(3, '0')}`, configurationId: `bounded-${i}`,
      listId: input.list._id, generation: 'invalid', token: 'unused',
    })));
    let release, reached;
    const paused = new Promise(resolve => { reached = resolve; });
    const gate = new Promise(resolve => { release = resolve; });
    const first = cleanup(input.list._id, { credentials: { ...contexts[0].credentials,
      removeAsync: async selector => { reached(); await gate; return contexts[0].credentials.removeAsync(selector); },
    } });
    await paused;
    await db.collection('lists').updateOne({ _id: input.list._id }, { $set: { syncCredentialGeneration: null } });
    await cleanup(input.list._id);
    const secondFence = await current(input.list._id);
    await commitSyncConfiguration({ ...contexts[1], ...input, list: secondFence,
      previousCredential: await read(secondFence) });
    const selected = await current(input.list._id);
    // This stage has the same numeric generation as a much older save, but
    // was never in either cleanup snapshot and belongs to the current fence.
    await db.collection('credentials').insertOne({ _id: 'later-bounded-stage', configurationId: 'later-bounded-stage',
      listId: input.list._id, generation: 0, token: 'later' });
    release(); await first;
    assert.equal((await read(await current(input.list._id)))._id, selected.syncRevision);
    assert.ok(await db.collection('credentials').findOne({ _id: 'later-bounded-stage' }));
    assert.equal(await db.collection('credentials').countDocuments({ listId: input.list._id }), 7);
    await cleanup(input.list._id);
    assert.equal(await db.collection('credentials').countDocuments({ listId: input.list._id }), 1);
  });
  await t.test('settings repair is atomic across lost acknowledgements and disconnects', async () => {
    const input = await seed('repair-ack');
    await db.collection('lists').updateOne({ _id: input.list._id }, { $set: { syncCredentialGeneration: null } });
    const old = await current(input.list._id);
    await assert.rejects(commitSyncConfiguration({ ...contexts[0], ...input, list: old,
      lists: { ...contexts[0].lists, updateAsync: async (...args) => {
        await contexts[0].lists.updateAsync(...args); throw new Error('lost acknowledgement');
      } } }), /lost acknowledgement/);
    const active = await current(input.list._id);
    assert.equal(active.syncCredentialGeneration, 0);
    assert.equal((await read(active)).token, newCredential.token);
    await assert.rejects(commitSyncConfiguration({ ...contexts[1], ...input, list: old }), /settings changed/);
    await db.collection('lists').updateOne({ _id: input.list._id }, { $set: { syncCredentialGeneration: 'broken' } });
    await commitSyncConfiguration({ ...contexts[1], list: await current(input.list._id), source: null });
    assert.equal((await current(input.list._id)).syncCredentialGeneration, 0);
    assert.equal(await read(await current(input.list._id)), null);
    await cleanup(input.list._id);
    assert.equal(await db.collection('credentials').countDocuments({ listId: input.list._id }), 0);
  });
  await t.test('malformed opaque fences are replaced when saving settings', async () => {
    for (const [index, fence] of [null, '', 42, {}].entries()) {
      const input = await seed(`bad-fence-${index}`);
      await db.collection('lists').updateOne({ _id: input.list._id }, { $set: {
        syncCredentialGeneration: 7, syncCredentialFence: fence,
      } });
      const previous = await current(input.list._id);
      await commitSyncConfiguration({ ...contexts[0], ...input, list: previous });
      const active = await current(input.list._id);
      assert.equal(active.syncCredentialGeneration, 7);
      assert.match(active.syncCredentialFence, /^[a-f0-9-]{36}$/);
      assert.equal((await read(active)).token, newCredential.token);
      await assert.rejects(commitSyncConfiguration({ ...contexts[1], ...input, list: previous }), /settings changed/);
    }
  });
  await t.test('the streaming sweep handles disabled lists, missing lists and per-list errors without exposing tokens', async () => {
    const input = await seed('disabled');
    await db.collection('lists').updateOne({ _id: input.list._id }, { $set: { 'syncSource.enabled': false } });
    await db.collection('credentials').insertOne({ _id: 'disabled-orphan', listId: input.list._id,
      configurationId: 'disabled-orphan', generation: 0, token: 'private-test-marker' });
    await db.collection('credentials').insertOne({ _id: 'missing-list', listId: 'no-list', token: 'private-test-marker' });
    const result = await sweepSyncCredentials({ ...contexts[0],
      cursor: db.collection('credentials').find({}, { projection: { _id: 1, listId: 1, incarnation: 1, configurationId: 1 } }).sort({ listId: 1 }).batchSize(2) });
    assert.ok(result.cleaned > 0); assert.equal(result.failed, 0); assert.ok(result.orphaned > 0);
    assert.doesNotMatch(JSON.stringify(result), /token|private-test-marker/);
    assert.equal(await db.collection('credentials').countDocuments({ listId: input.list._id }), 1);
    assert.equal(await db.collection('credentials').findOne({ _id: 'missing-list' }), null);
  });
  await t.test('orphan cleanup cannot retire a recreated list credential or activate a delayed old save', async () => {
    const input = await seed('recreated');
    await db.collection('lists').updateOne({ _id: input.list._id }, { $set: { syncCredentialIncarnation: 'old-lifetime' } });
    const old = await current(input.list._id);
    await commitSyncConfiguration({ ...contexts[0], ...input, list: old });
    const activeOld = await current(old._id);
    const oldCredential = await read(activeOld);
    assert.equal(oldCredential.incarnation, 'old-lifetime');
    await db.collection('lists').deleteOne({ _id: old._id });
    const candidates = await db.collection('credentials').find({ listId: old._id },
      { projection: { _id: 1, listId: 1, incarnation: 1, configurationId: 1 } }).toArray();
    let recreated, selected;
    const ctx = { ...contexts[0], credentials: { ...contexts[0].credentials, removeAsync: async selector => {
      // Interleave recreation after the missing-list read but before deletion.
      await db.collection('lists').insertOne({ ...activeOld, syncCredentialIncarnation: 'new-lifetime' });
      recreated = await current(old._id);
      assert.equal(await read(recreated), null, 'copied revision cannot select an old lifetime');
      await commitSyncConfiguration({ ...contexts[1], ...input, list: recreated, previousCredential: null });
      selected = await current(old._id);
      return contexts[0].credentials.removeAsync(selector);
    } } };
    let closed = false;
    const result = await sweepSyncCredentials({ ...ctx, cursor: {
      async *[Symbol.asyncIterator]() { yield* candidates; }, async close() { closed = true; },
    } });
    assert.equal(result.orphaned, 1); assert.equal(closed, true);
    assert.equal((await read(selected)).incarnation, 'new-lifetime');
    assert.equal((await read(selected)).token, 'new-test-token');
    await assert.rejects(commitSyncConfiguration({ ...contexts[0], ...input, list: activeOld,
      previousCredential: oldCredential }), /settings changed/);
    assert.equal((await read(await current(old._id)))._id, selected.syncRevision);
    assert.equal(await db.collection('credentials').countDocuments({ listId: old._id }), 1);
  });
  await t.test('new lifetimes reject legacy tokens and an interrupted orphan deletion retries', async () => {
    const input = await seed('legacy-recreated');
    const recreated = { ...input.list, syncCredentialIncarnation: 'new-lifetime' };
    assert.equal(await read(recreated), null);
    await db.collection('lists').updateOne({ _id: input.list._id }, { $set: { syncCredentialIncarnation: 'new-lifetime' } });
    await assert.rejects(commitSyncConfiguration({ ...contexts[0], ...input }), /settings changed/);
    assert.equal(await db.collection('credentials').countDocuments({ listId: input.list._id }), 1);
    await db.collection('lists').deleteOne({ _id: input.list._id });
    const cursor = () => db.collection('credentials').find({ listId: input.list._id },
      { projection: { _id: 1, listId: 1, incarnation: 1, configurationId: 1 } }).sort({ listId: 1 });
    const failed = await sweepSyncCredentials({ ...contexts[0], cursor: cursor(),
      credentials: { ...contexts[0].credentials, removeAsync: async () => { throw new Error('private failure'); } } });
    assert.equal(failed.failed, 1);
    assert.equal(await db.collection('credentials').countDocuments({ listId: input.list._id }), 1);
    assert.equal((await sweepSyncCredentials({ ...contexts[0], cursor: cursor() })).orphaned, 1);
    assert.equal(await db.collection('credentials').countDocuments({ listId: input.list._id }), 0);
  });

});
