const http = require('node:http');
const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const { loginWithToken, openBoard } = require('../helpers/auth');
const call = (page, name, ...args) => page.evaluate(async ({ name, args }) => {
  try { return await Meteor.callAsync(name, ...args); }
  catch (error) { throw new Error(error.reason || error.message); }
}, { name, args });
let server, base, fields;
test.beforeAll(async () => {
  server = http.createServer((_req, res) => {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ startAt: 0, total: 1, issues: [{ key: 'TIME-1', fields: { summary: 'Time estimates', ...fields } }] }));
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  base = `http://127.0.0.1:${server.address().port}`;
});
test.afterAll(async () => { await new Promise(resolve => server.close(resolve)); });

test('Jira original and remaining hours sync together and review local edits in the popup', async ({ page, user, board }) => {
  const listId = board.listIds[0], ids = ['original', 'remaining'].map(key => `${listId}-${key}`);
  for (const [index, key] of ['original', 'remaining'].entries()) db.insertOne('customFields', {
    _id: ids[index], boardIds: [board.boardId], type: 'number', name: `Jira ${key} hours`, settings: { jiraTimeField: key },
  });
  try {
    await loginWithToken(page, user.id, user.token); await openBoard(page, board.boardId, board.slug);
    const config = { type: 'jira', url: base, projectKey: 'TIME', token: 'local-test-token' };
    await call(page, 'setListSyncSource', listId, config);
    await page.evaluate(list => {
      Popup.close(); Popup.open('listSync', { dataContext: list })({ currentTarget: document.body,
        target: document.body, preventDefault() {}, stopPropagation() {} });
    }, db.findOne('lists', { _id: listId }));
    await page.locator('.js-toggle-sync-field[data-field="originalEstimate"]').click();
    await page.locator('.js-toggle-sync-field[data-field="remainingEstimate"]').click();
    await expect(page.locator('.js-pop-over')).toContainText('Exactly one matching field');
    await page.locator('.js-list-sync-save').click();
    await expect.poll(() => db.findOne('lists', { _id: listId }).syncSource.fields).toContain('remainingEstimate');
    fields = { timetracking: { originalEstimateSeconds: 7200, remainingEstimateSeconds: 0 } };
    const preview = await call(page, 'previewListSync', listId);
    expect(preview.error).toBeFalsy(); expect(preview.preview.items[0].fields).toContain('originalEstimate');
    await page.locator('.js-list-sync-now').click();
    await expect.poll(() => db.findOne('cards', { listId, syncExternalId: 'TIME-1' })?.customFields).toEqual([
      { _id: ids[0], value: 2 }, { _id: ids[1], value: 0 },
    ]);
    const card = db.findOne('cards', { listId, syncExternalId: 'TIME-1' });
    fields = { timetracking: { originalEstimateSeconds: 10800, remainingEstimateSeconds: 3600 } };
    expect((await call(page, 'syncListNow', listId)).error).toBeFalsy();
    expect(db.findOne('cards', { _id: card._id }).customFields).toEqual([{ _id: ids[0], value: 3 }, { _id: ids[1], value: 1 }]);
    db.updateOne('cards', { _id: card._id }, { $set: { customFields: [
      { _id: ids[0], value: 3 }, { _id: ids[1], value: 7 }, { _id: 'other', value: false },
    ] } });
    fields = { timetracking: { originalEstimateSeconds: 10800, remainingEstimateSeconds: 7200 } };
    await page.locator('.js-list-sync-now').click();
    const conflict = page.locator('.list-sync-conflict').filter({ hasText: 'Remaining time estimate' });
    await expect(conflict).toBeVisible();
    await conflict.locator('[data-choice="source"]').click();
    await expect.poll(() => db.findOne('cards', { _id: card._id }).customFields).toContainEqual({ _id: ids[1], value: 2 });
    fields = { timetracking: { originalEstimateSeconds: null, remainingEstimateSeconds: 0 } };
    expect((await call(page, 'syncListNow', listId)).error).toBeFalsy();
    expect(db.findOne('cards', { _id: card._id }).customFields).toEqual([{ _id: ids[1], value: 0 }, { _id: 'other', value: false }]);
    expect(db.findOne('cards', { _id: card._id }).syncLastSource.originalEstimate).toBeNull();
    fields = {};
    expect((await call(page, 'syncListNow', listId)).error).toBeFalsy();
    expect(db.findOne('cards', { _id: card._id }).customFields).toContainEqual({ _id: ids[1], value: 0 });
    fields = { timeestimate: 1800, timeoriginalestimate: 3600 };
    expect((await call(page, 'syncListNow', listId)).error).toBeFalsy();
    expect(db.findOne('cards', { _id: card._id }).customFields).toContainEqual({ _id: ids[1], value: 0.5 });
    const before = db.findOne('cards', { _id: card._id }).customFields;
    fields = { timeestimate: '3600' };
    expect((await call(page, 'syncListNow', listId)).error).toBeTruthy();
    expect(db.findOne('cards', { _id: card._id }).customFields).toEqual(before);
    db.updateOne('customFields', { _id: ids[1] }, { $set: { type: 'text' } });
    expect((await call(page, 'syncListNow', listId)).error).toContain('exactly one');
    expect(db.findOne('cards', { _id: card._id }).customFields).toEqual(before);
  } finally { db.deleteMany('customFields', { _id: { $in: ids } }); }
});

test('time estimate settings reject missing, foreign and ambiguous mappings', async ({ page, user, board }) => {
  const listId = board.listIds[0], id = db.uid('time-field');
  await loginWithToken(page, user.id, user.token);
  const config = { type: 'jira', url: base, projectKey: 'TIME', token: 'local-test-token', fields: ['originalEstimate'] };
  await expect(call(page, 'setListSyncSource', listId, config)).rejects.toThrow('exactly one');
  db.insertOne('customFields', { _id: id, boardIds: ['foreign-board'], type: 'number', name: 'Foreign', settings: { jiraTimeField: 'original' } });
  try {
    await expect(call(page, 'setListSyncSource', listId, config)).rejects.toThrow('exactly one');
    db.updateOne('customFields', { _id: id }, { $set: { boardIds: [board.boardId] } });
    await call(page, 'setListSyncSource', listId, config);
    db.insertOne('customFields', { _id: `${id}-duplicate`, boardIds: [board.boardId], type: 'number', name: 'Duplicate', settings: { jiraTimeField: 'original' } });
    await expect(call(page, 'setListSyncSource', listId, config)).rejects.toThrow('exactly one');
    expect((await call(page, 'syncListNow', listId)).error).toContain('exactly one');
  } finally { db.deleteMany('customFields', { _id: { $in: [id, `${id}-duplicate`] } }); }
});
