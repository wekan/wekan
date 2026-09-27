'use strict';
const http = require('node:http');
const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const { loginWithToken, openBoard } = require('../helpers/auth');
const { syncSourceKey } = require('../../../models/lib/listSyncSourceIdentity');

let server, base, requests, emptyProjects;
test.beforeAll(async () => {
  requests = [];
  emptyProjects = new Set(['EMPTY']);
  server = http.createServer((req, res) => {
    const url = new URL(req.url, 'http://localhost');
    const project = url.searchParams.get('jql')?.replace('project=', '');
    requests.push({ project, auth: req.headers.authorization });
    // Deliberately overlapping external IDs exercise project-scoped matching.
    const issues = emptyProjects.has(project) ? [] : [{ key: 'SAME-1', fields: {
      summary: `${project} issue`, description: '', status: { name: 'Open' },
    } }];
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ startAt: 0, total: issues.length, issues }));
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  base = `http://127.0.0.1:${server.address().port}`;
});
test.afterAll(async () => { await new Promise(resolve => server.close(resolve)); });

const call = (page, name, ...args) => page.evaluate(({ name, args }) => Meteor.callAsync(name, ...args), { name, args });
const openSync = (page, listId) => page.evaluate(list => {
  Popup.close();
  Popup.open('listSync', { dataContext: list })({ currentTarget: document.body,
    target: document.body, preventDefault() {}, stopPropagation() {} });
}, db.findOne('lists', { _id: listId }));

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
