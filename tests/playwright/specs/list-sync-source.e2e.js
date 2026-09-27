'use strict';
const http = require('node:http');
const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const { loginWithToken, openBoard } = require('../helpers/auth');
const { syncSourceKey } = require('../../../models/lib/listSyncSourceIdentity');
const { cleanupSyncCredentials } = require('../../../server/lib/listSyncConfiguration');

let server, base, requests, emptyProjects, heldResponses;
test.beforeAll(async () => {
  requests = [];
  emptyProjects = new Set(['EMPTY']);
  heldResponses = [];
  server = http.createServer((req, res) => {
    const url = new URL(req.url, 'http://localhost');
    const project = url.searchParams.get('jql')?.replace('project=', '');
    requests.push({ project, auth: req.headers.authorization });
    // Deliberately overlapping external IDs exercise project-scoped matching.
    const issues = emptyProjects.has(project) ? [] : [{ key: 'SAME-1', fields: {
      summary: `${project} issue`, description: '', status: { name: 'Open' },
    } }];
    const respond = () => {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ startAt: 0, total: issues.length, issues }));
    };
    if (project === 'CONCURRENT') {
      heldResponses.push(respond);
    } else respond();
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  base = `http://127.0.0.1:${server.address().port}`;
});
test.afterAll(async () => { await new Promise(resolve => server.close(resolve)); });

test('concurrent Sync runs create one card, and a moved card blocks replacement in the popup', async ({ page, browser, user, board }) => {
  const listId = db.find('lists', { boardId: board.boardId })[0]._id;
  const config = { type: 'jira', url: base, projectKey: 'CONCURRENT', token: 'concurrency-test-token' };
  const secondContext = await browser.newContext();
  const second = await secondContext.newPage();
  try {
    await loginWithToken(page, user.id, user.token);
    await loginWithToken(second, user.id, user.token);
    await openBoard(page, board.boardId, board.slug);
    await openBoard(second, board.boardId, board.slug);
    await call(page, 'setListSyncSource', listId, config);
    const running = call(page, 'syncListNow', listId);
    await expect.poll(() => heldResponses.length).toBe(1);
    const busy = await call(second, 'syncListNow', listId);
    expect(busy.error).toContain('Sync is already running');
    const rejectedSave = await second.evaluate(async ({ id, config }) => {
      try { await Meteor.callAsync('setListSyncSource', id, { ...config, projectKey: 'TWO' }); return 'accepted'; }
      catch (error) { return error.error; }
    }, { id: listId, config });
    expect(rejectedSave).toBe('sync-busy');
    await openSync(second, listId);
    await second.locator('.js-list-sync-project-key').fill('TWO');
    await second.locator('.js-list-sync-save').click();
    await expect(second.locator('.pop-over .list-sync-now-error')).toContainText('Sync is already running');
    expect(db.findOne('lists', { _id: listId }).syncSource.projectKey).toBe('CONCURRENT');
    expect(db.findOne('listSyncCredentials', { listId }).sourceKey).toBe(syncSourceKey(config));
    expect(heldResponses).toHaveLength(1);
    heldResponses.splice(0).forEach(send => send());
    expect(await running).toMatchObject({ created: 1, archived: 0 });
    expect(db.findOne('listSyncLeases', { _id: listId })).toBeNull();
    const cards = db.find('cards', { listId, syncExternalId: 'SAME-1' });
    expect(cards).toHaveLength(1);
    expect(cards[0]._id).toMatch(/^sync-[a-f0-9]{64}$/);
    // Keep the identity but move the card out of the watched list. A retried
    // creation must not replace this local work or silently count it as synced.
    const otherList = db.find('lists', { boardId: board.boardId }).find(list => list._id !== listId);
    expect(otherList).toBeTruthy();
    db.updateOne('cards', { _id: cards[0]._id }, { $set: { listId: otherList._id, title: 'Moved local work' } });
    await openSync(page, listId);
    await page.locator('.js-list-sync-now').click();
    await expect.poll(() => heldResponses.length).toBe(1);
    heldResponses.splice(0).forEach(send => send());
    await expect(page.locator('.pop-over .list-sync-now-error')).toContainText('Sync creation conflict');
    expect(db.find('cards', { boardId: board.boardId, syncExternalId: 'SAME-1' })).toHaveLength(1);
    expect(db.findOne('cards', { _id: cards[0]._id })).toMatchObject({ listId: otherList._id, title: 'Moved local work' });
    db.updateOne('cards', { _id: cards[0]._id }, { $set: { listId, title: cards[0].title } });
    const retry = call(page, 'syncListNow', listId);
    await expect.poll(() => heldResponses.length).toBe(1);
    heldResponses.splice(0).forEach(send => send());
    expect(await retry).toMatchObject({ created: 0, archived: 0 });
  } finally {
    heldResponses.splice(0).forEach(send => send());
    await secondContext.close();
    db.deleteMany('listSyncCredentials', { listId });
  }
});

const call = (page, name, ...args) => page.evaluate(({ name, args }) => Meteor.callAsync(name, ...args), { name, args });
const openSync = (page, listId) => page.evaluate(list => {
  Popup.close();
  Popup.open('listSync', { dataContext: list })({ currentTarget: document.body,
    target: document.body, preventDefault() {}, stopPropagation() {} });
}, db.findOne('lists', { _id: listId }));

test('expired Sync worker stops before reconciling after a settings save reclaims its lease', async ({ page, browser, user, board }) => {
  const listId = db.find('lists', { boardId: board.boardId })[0]._id;
  const config = { type: 'jira', url: base, projectKey: 'CONCURRENT', token: 'old-test-token' };
  const secondContext = await browser.newContext();
  const second = await secondContext.newPage();
  try {
    await loginWithToken(page, user.id, user.token);
    await loginWithToken(second, user.id, user.token);
    await call(page, 'setListSyncSource', listId, config);
    const running = call(page, 'syncListNow', listId);
    await expect.poll(() => heldResponses.length).toBe(1);
    db.updateOne('listSyncLeases', { _id: listId }, { $set: { expiresAt: new Date(0) } });
    const replacement = { ...config, projectKey: 'TWO', token: 'replacement-test-token' };
    expect(await call(second, 'setListSyncSource', listId, replacement)).toEqual({ ok: true });
    heldResponses.splice(0).forEach(send => send());
    expect((await running).error).toContain('reservation expired');
    expect(db.find('cards', { listId, syncExternalId: 'SAME-1' })).toHaveLength(0);
    expect(db.findOne('lists', { _id: listId }).syncSource).toMatchObject({ projectKey: 'TWO' });
    expect(db.findOne('lists', { _id: listId }).syncSource.lastSyncError).toBeUndefined();
    expect(db.findOne('listSyncCredentials', { listId }).sourceKey).toBe(syncSourceKey(replacement));
    expect(await call(second, 'syncListNow', listId)).toMatchObject({ created: 1 });
  } finally {
    heldResponses.splice(0).forEach(send => send());
    await secondContext.close();
    db.deleteMany('listSyncCredentials', { listId });
    db.deleteMany('listSyncLeases', { _id: listId });
  }
});

test('switching projects isolates overlapping IDs, archives and credentials through the popup', async ({ page, user, board }) => {
  const listId = db.find('lists', { boardId: board.boardId })[0]._id;
  const config = { type: 'jira', url: base, projectKey: 'ONE', enabled: true, token: 'one-test-token' };
  await loginWithToken(page, user.id, user.token);
  await openBoard(page, board.boardId, board.slug);
  try {
    await call(page, 'setListSyncSource', listId, config);
    expect(await call(page, 'syncListNow', listId)).toMatchObject({ created: 1, archived: 0 });
    const first = db.findOne('cards', { listId, syncExternalId: 'SAME-1' });
    expect(first.syncSourceKey).toBe(syncSourceKey(config));
    await openSync(page, listId);
    await page.locator('.js-list-sync-project-key').fill('TWO');
    await page.locator('.js-list-sync-save').click();
    await expect.poll(() => db.findOne('lists', { _id: listId }).syncSource.projectKey).toBe('TWO');
    expect(await call(page, 'hasListSyncCredential', listId)).toBe(false);
    const count = requests.length;
    await page.locator('.js-list-sync-now').click();
    await expect(page.locator('.pop-over .list-sync-now-error')).toContainText('credential for this server and project');
    expect(requests).toHaveLength(count);
    await page.locator('.js-list-sync-token').fill('two-test-token');
    await page.locator('.js-list-sync-save').click();
    await expect.poll(() => call(page, 'hasListSyncCredential', listId)).toBe(true);
    await page.locator('.js-list-sync-now').click();
    await expect.poll(() => db.find('cards', { listId, syncExternalId: 'SAME-1' }).length).toBe(2);
    expect(db.findOne('cards', { _id: first._id }).title).toBe(first.title);
    expect(db.findOne('cards', { _id: first._id }).archived).toBe(false);
    expect(requests.at(-1).auth).toBe(`Basic ${Buffer.from(':two-test-token').toString('base64')}`);
    emptyProjects.add('TWO');
    expect(await call(page, 'syncListNow', listId)).toMatchObject({ created: 0, archived: 1 });
    expect(db.findOne('cards', { _id: first._id }).archived).toBe(false);
    emptyProjects.delete('TWO');
    await call(page, 'setListSyncSource', listId, { ...config, projectKey: 'EMPTY', token: 'empty-test-token' });
    expect(await call(page, 'syncListNow', listId)).toMatchObject({ created: 0, archived: 0 });
    expect(db.find('cards', { listId, syncExternalId: 'SAME-1', archived: false })).toHaveLength(1);
    await call(page, 'setListSyncSource', listId, null);
    await call(page, 'setListSyncSource', listId, config);
    expect(await call(page, 'syncListNow', listId)).toMatchObject({ created: 0, archived: 0 });
    expect(db.find('cards', { listId, syncExternalId: 'SAME-1' })).toHaveLength(2);
  } finally { db.deleteMany('listSyncCredentials', { listId }); }
});

test('saving a legacy source binds its cards and credential before a source switch or clear', async ({ page, user, board }) => {
  const card = db.find('cards', { boardId: board.boardId })[0];
  const config = { type: 'jira', url: base, projectKey: 'ONE', enabled: false };
  db.updateOne('lists', { _id: card.listId }, { $set: { syncSource: config } });
  db.updateOne('cards', { _id: card._id }, { $set: { syncSourceType: 'jira', syncExternalId: 'SAME-1' } });
  db.insertOne('listSyncCredentials', { _id: `sync-${card.listId}`, listId: card.listId, token: 'legacy-test-token' });
  await loginWithToken(page, user.id, user.token);
  try {
    await call(page, 'setListSyncSource', card.listId, { ...config, fields: ['title'] });
    expect(db.findOne('cards', { _id: card._id }).syncSourceKey).toBe(syncSourceKey(config));
    expect(await call(page, 'hasListSyncCredential', card.listId)).toBe(true);
    await call(page, 'setListSyncSource', card.listId, null);
    expect(db.findOne('cards', { _id: card._id }).syncSourceKey).toBe(syncSourceKey(config));
    await call(page, 'setListSyncSource', card.listId, { ...config, projectKey: 'TWO' });
    expect(await call(page, 'hasListSyncCredential', card.listId)).toBe(false);
    expect(db.findOne('cards', { _id: card._id }).title).toBe(card.title);
  } finally { db.deleteMany('listSyncCredentials', { listId: card.listId }); }
});

test('only the committed credential version is used and clearing cannot adopt an unfinished save', async ({ page, user, board }) => {
  const listId = db.find('lists', { boardId: board.boardId })[0]._id;
  const config = { type: 'jira', url: base, projectKey: 'ONE', token: 'committed-test-token' };
  await loginWithToken(page, user.id, user.token);
  try {
    await call(page, 'setListSyncSource', listId, config);
    const saved = db.findOne('lists', { _id: listId });
    expect(saved.syncRevision).toBeTruthy();
    expect(JSON.stringify(saved)).not.toContain(config.token);
    db.insertOne('listSyncCredentials', { _id: `staged-${listId}`, configurationId: `staged-${listId}`,
      listId, sourceKey: syncSourceKey(config), token: 'unfinished-test-token' });
    expect(await call(page, 'syncListNow', listId)).toMatchObject({ created: 1 });
    expect(requests.at(-1).auth).toBe(`Basic ${Buffer.from(':committed-test-token').toString('base64')}`);
    await call(page, 'setListSyncSource', listId, null);
    expect(await call(page, 'hasListSyncCredential', listId)).toBe(false);
    expect(db.findOne('listSyncCredentials', { _id: saved.syncRevision })).toBeNull();
    await call(page, 'setListSyncSource', listId, { ...config, token: null });
    expect(await call(page, 'hasListSyncCredential', listId)).toBe(false);
    const count = requests.length;
    expect((await call(page, 'syncListNow', listId)).error).toContain('credential for this server and project');
    expect(requests).toHaveLength(count);
  } finally { db.deleteMany('listSyncCredentials', { listId }); }
});

test('credential cleanup keeps the selected token usable and later settings saves use the new generation', async ({ page, user, board }) => {
  const { MongoClient } = require('mongodb');
  const client = new MongoClient(process.env.WEKAN_MONGO_URL || 'mongodb://127.0.0.1:3001/meteor');
  await client.connect();
  const database = client.db();
  const listId = db.find('lists', { boardId: board.boardId })[0]._id;
  const config = { type: 'jira', url: base, projectKey: 'ONE', token: 'cleanup-selected-token' };
  await loginWithToken(page, user.id, user.token);
  try {
    await call(page, 'setListSyncSource', listId, config);
    const selected = db.findOne('lists', { _id: listId });
    db.insertOne('listSyncCredentials', { _id: `orphan-${listId}`, configurationId: `orphan-${listId}`,
      listId, token: 'orphan-test-token', generation: 0 });
    await cleanupSyncCredentials({ list: selected,
      lists: { updateAsync: async (selector, update) => (await database.collection('lists').updateOne(selector, update)).matchedCount },
      credentials: { removeAsync: async selector => (await database.collection('listSyncCredentials').deleteMany(selector)).deletedCount } });
    expect(db.find('listSyncCredentials', { listId })).toHaveLength(1);
    expect(db.findOne('lists', { _id: listId }).syncRevision).toBe(selected.syncRevision);
    expect(await call(page, 'hasListSyncCredential', listId)).toBe(true);
    expect(await call(page, 'syncListNow', listId)).toMatchObject({ created: 1 });
    expect(requests.at(-1).auth).toBe(`Basic ${Buffer.from(':cleanup-selected-token').toString('base64')}`);
    await call(page, 'setListSyncSource', listId, { ...config, token: null });
    const saved = db.findOne('lists', { _id: listId });
    expect(db.findOne('listSyncCredentials', { _id: saved.syncRevision }).generation).toBe(1);
    expect(await call(page, 'hasListSyncCredential', listId)).toBe(true);
    // The fence is server-owned, even for an otherwise authorized board user.
    const result = await page.evaluate(async id => {
      try { await Meteor.callAsync('/lists/update', { _id: id }, { $set: { syncCredentialGeneration: 0 } }); return 'allowed'; }
      catch (_) { return 'denied'; }
    }, listId);
    expect(result).toBe('denied');
    expect(db.findOne('lists', { _id: listId }).syncCredentialGeneration).toBe(1);
  } finally { await client.close(); db.deleteMany('listSyncCredentials', { listId }); }
});

test('unknown legacy mappings and malformed server URLs reject configuration without changing cards', async ({ page, user, board }) => {
  const card = db.find('cards', { boardId: board.boardId })[0];
  db.updateOne('cards', { _id: card._id }, { $set: { syncSourceType: 'jira', syncExternalId: 'SAME-1' } });
  await loginWithToken(page, user.id, user.token);
  const result = await page.evaluate(async ({ id, url }) => {
    const failures = [];
    for (const serverUrl of [url, `${url}?token=secret`]) {
      try { await Meteor.callAsync('setListSyncSource', id, { type: 'jira', url: serverUrl, projectKey: 'NEW' }); failures.push('accepted'); }
      catch (error) { failures.push(error.error); }
    }
    return failures;
  }, { id: card.listId, url: base });
  expect(result).toEqual(['sync-source-unknown', 'invalid-sync-source']);
  expect(db.findOne('lists', { _id: card.listId }).syncSource).toBeUndefined();
  expect(db.findOne('cards', { _id: card._id }).syncSourceKey).toBeUndefined();
  expect(db.findOne('cards', { _id: card._id }).title).toBe(card.title);
  db.updateOne('lists', { _id: card.listId }, { $set: { syncSource: { type: 'github', projectKey: 'team/repo' } } });
  const foreign = await page.evaluate(async ({ id, url }) => {
    try { await Meteor.callAsync('setListSyncSource', id, { type: 'jira', url, projectKey: 'NEW' }); return 'accepted'; }
    catch (error) { return error.error; }
  }, { id: card.listId, url: base });
  expect(foreign).toBe('sync-source-unknown');
  expect(db.findOne('cards', { _id: card._id }).syncSourceKey).toBeUndefined();
  // A malformed legacy configuration can still be disconnected, but it cannot
  // be used to guess which project the old card belongs to.
  db.updateOne('lists', { _id: card.listId }, { $set: { syncSource: { type: 'jira', url: 'broken', projectKey: 'OLD' } } });
  expect(await call(page, 'setListSyncSource', card.listId, null)).toEqual({ cleared: true });
  expect(db.findOne('cards', { _id: card._id }).syncSourceKey).toBeUndefined();
});

test('switching a legacy source binds old cards to the old project and discards its credential', async ({ page, user, board }) => {
  const card = db.find('cards', { boardId: board.boardId })[0];
  const oldSource = { type: 'jira', url: base, projectKey: 'ONE', enabled: false };
  db.updateOne('lists', { _id: card.listId }, { $set: { syncSource: oldSource } });
  db.updateOne('cards', { _id: card._id }, { $set: { syncSourceType: 'jira', syncExternalId: 'SAME-1' } });
  db.insertOne('listSyncCredentials', { _id: `sync-${card.listId}`, listId: card.listId, token: 'legacy-test-token' });
  await loginWithToken(page, user.id, user.token);
  try {
    await call(page, 'setListSyncSource', card.listId, { ...oldSource, projectKey: 'TWO' });
    expect(db.findOne('cards', { _id: card._id }).syncSourceKey).toBe(syncSourceKey(oldSource));
    expect(await call(page, 'hasListSyncCredential', card.listId)).toBe(false);
    expect(db.findOne('listSyncCredentials', { listId: card.listId })).toBeNull();
    expect(db.findOne('cards', { _id: card._id }).archived).toBe(false);
  } finally { db.deleteMany('listSyncCredentials', { listId: card.listId }); }
});
