const http = require('node:http');
const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const { loginWithToken, openBoard } = require('../helpers/auth');
const call = (page, name, ...args) => page.evaluate(({ name, args }) => Meteor.callAsync(name, ...args), { name, args });
let server, base, value;
test.beforeAll(async () => {
  server = http.createServer((_req, res) => {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ startAt: 0, total: 1, issues: [{ key: 'EST-1', fields: {
      summary: 'Estimated task', description: '', status: { name: 'Open' },
      ...(value === undefined ? {} : { customfield_100: value }),
    } }] }));
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  base = `http://127.0.0.1:${server.address().port}`;
});
test.afterAll(async () => { await new Promise(resolve => server.close(resolve)); });

test('Jira estimate mapping syncs zero/null and reviews local changes through the popup', async ({ page, user, board }) => {
  const listId = db.find('lists', { boardId: board.boardId })[0]._id;
  const fieldId = `${listId}-estimate`;
  db.insertOne('customFields', { _id: fieldId, boardIds: [board.boardId], name: 'Jira points', type: 'number',
    settings: { jiraEstimateFieldId: 'customfield_100', jiraEstimateUnit: 'points' } });
  try {
    await loginWithToken(page, user.id, user.token);
    await openBoard(page, board.boardId, board.slug);
    const config = { type: 'jira', url: base, projectKey: 'EST', token: 'estimate-test-token' };
    await call(page, 'setListSyncSource', listId, config);
    const savedList = db.findOne('lists', { _id: listId });
    expect(db.findOne('listSyncCredentials', { _id: savedList.syncRevision }).runAsUserId).toBe(user.id);
    expect(savedList.syncSource.runAsUserId).toBeUndefined();
    await expect(call(page, 'setListSyncSource', listId, { ...config, runAsUserId: 'another-user' })).rejects.toThrow();
    await page.evaluate(list => {
      Popup.close(); Popup.open('listSync', { dataContext: list })({ currentTarget: document.body,
        target: document.body, preventDefault() {}, stopPropagation() {} });
    }, db.findOne('lists', { _id: listId }));
    await page.locator('.js-toggle-sync-field[data-field="estimate"]').click();
    await page.locator('.js-list-sync-estimate-field').selectOption(fieldId);
    await page.locator('.js-list-sync-save').click();
    await expect.poll(() => db.findOne('lists', { _id: listId }).syncSource.estimateCustomFieldId).toBe(fieldId);
    value = 0;
    const preview = await call(page, 'previewListSync', listId);
    expect(preview.error).toBeFalsy();
    expect(preview.preview.items[0].fields).toContain('estimate');
    expect(preview.preview.coverage.source.rows.some(row => row.path.endsWith('/customfield_100'))).toBe(false);
    await page.locator('.js-list-sync-now').click();
    await expect.poll(() => db.findOne('cards', { listId, syncExternalId: 'EST-1' })?.customFields).toContainEqual({ _id: fieldId, value: 0 });
    const card = db.findOne('cards', { listId, syncExternalId: 'EST-1' });
    const triggerId = db.uid('estimate-trigger'), actionId = db.uid('estimate-action');
    db.insertOne('triggers', { _id: triggerId, boardId: board.boardId,
      activityType: 'advancedFilterTrigger', advancedFilter: "'Jira points' = 2" });
    db.insertOne('actions', { _id: actionId, boardId: board.boardId, actionType: 'markCardComplete' });
    db.insertOne('rules', { _id: db.uid('estimate-rule'), boardId: board.boardId,
      triggerId, actionId, title: 'Complete at two points', enabled: true });
    const activityValues = () => db.find('activities', { cardId: card._id, customFieldId: fieldId })
      .map(activity => [activity.activityType, activity.value ?? null]);
    expect(activityValues()).toEqual([]);
    value = 2;
    expect((await call(page, 'syncListNow', listId)).error).toBeFalsy();
    expect(db.findOne('cards', { _id: card._id }).customFields).toContainEqual({ _id: fieldId, value: 2 });
    expect(activityValues()).toEqual([['setCustomField', 2]]);
    expect(db.findOne('cards', { _id: card._id }).dueComplete).toBe(true);
    expect((await call(page, 'syncListNow', listId)).error).toBeFalsy();
    expect(activityValues()).toHaveLength(1);
    db.updateOne('cards', { _id: card._id }, { $set: { customFields: [
      { _id: fieldId, value: 3 }, { _id: 'unrelated', value: 'keep me' }] } });
    value = 4;
    await page.locator('.js-list-sync-now').click();
    const conflict = page.locator('.list-sync-conflict').filter({ hasText: 'Estimate' });
    await expect(conflict).toBeVisible();
    expect(activityValues()).toHaveLength(1);
    await conflict.locator('[data-choice="source"]').click();
    await expect.poll(() => db.findOne('cards', { _id: card._id }).customFields).toContainEqual({ _id: fieldId, value: 4 });
    expect(db.findOne('cards', { _id: card._id }).customFields).toContainEqual({ _id: 'unrelated', value: 'keep me' });
    expect(db.findOne('cards', { _id: card._id }).customFields.map(field => field._id)).toEqual([fieldId, 'unrelated']);
    value = null;
    expect((await call(page, 'syncListNow', listId)).error).toBeFalsy();
    expect(db.findOne('cards', { _id: card._id }).customFields).toEqual([{ _id: 'unrelated', value: 'keep me' }]);
    expect(db.findOne('cards', { _id: card._id }).syncLastSource).toHaveProperty('estimate', null);
    expect(activityValues()).toEqual([['setCustomField', 2], ['setCustomField', 4], ['unsetCustomField', null]]);
    value = 5;
    expect((await call(page, 'syncListNow', listId)).error).toBeFalsy();
    value = undefined;
    expect((await call(page, 'syncListNow', listId)).error).toBeFalsy();
    expect(db.findOne('cards', { _id: card._id }).customFields).toContainEqual({ _id: fieldId, value: 5 });
    value = 'invalid';
    expect((await call(page, 'syncListNow', listId)).error).toContain('Invalid Jira estimate');
    expect(activityValues()).toHaveLength(4);
    value = 6;
    db.updateOne('cards', { _id: card._id }, { $set: { customFields: [
      { _id: fieldId, value: 'not numeric' }, { _id: 'unrelated', value: 'keep me' }] } });
    expect((await call(page, 'syncListNow', listId)).error).toContain('Invalid local numeric estimate');
    db.updateOne('cards', { _id: card._id }, { $set: { customFields: [
      { _id: fieldId, value: 5 }, { _id: 'unrelated', value: 'keep me' }] } });
    db.updateOne('customFields', { _id: fieldId }, { $set: { 'settings.jiraEstimateUnit': 'hours' } });
    expect((await call(page, 'syncListNow', listId)).error).toContain('mapping changed');
    expect(db.findOne('cards', { _id: card._id }).customFields).toContainEqual({ _id: fieldId, value: 5 });
    const revision = db.findOne('lists', { _id: listId }).syncRevision;
    await expect(call(page, 'setListSyncSource', listId, { ...config, fields: ['estimate'], estimateCustomFieldId: 'foreign' })).rejects.toThrow();
    expect(db.findOne('lists', { _id: listId }).syncRevision).toBe(revision);
    await call(page, 'setListSyncSource', listId, { ...config, fields: ['estimate'], estimateCustomFieldId: fieldId });
    const changedMapping = await call(page, 'syncListNow', listId);
    expect(changedMapping.conflicts[0].field).toBe('estimate');
    expect(db.findOne('cards', { _id: card._id }).customFields).toContainEqual({ _id: fieldId, value: 5 });
  } finally {
    for (const collection of ['rules', 'triggers', 'actions']) db.deleteMany(collection, { boardId: board.boardId });
    db.deleteOne('customFields', { _id: fieldId });
    db.deleteMany('listSyncCredentials', { listId });
  }
});

test('dotted checkbox writes emit false once and removing a valued field emits an unset', async ({ page, user, board }) => {
  const card = db.find('cards', { boardId: board.boardId })[0];
  const fieldId = db.uid('checkbox');
  db.insertOne('customFields', { _id: fieldId, boardIds: [board.boardId], name: 'Reviewed', type: 'checkbox' });
  db.updateOne('cards', { _id: card._id }, { $set: { customFields: [{ _id: fieldId, value: true }] } });
  const activities = () => db.find('activities', { cardId: card._id, customFieldId: fieldId });
  try {
    await loginWithToken(page, user.id, user.token);
    await openBoard(page, board.boardId, board.slug);
    await call(page, 'setCardCustomFieldCheckbox', card._id, fieldId, false);
    expect(activities().map(a => [a.activityType, a.value])).toEqual([['setCustomField', false]]);
    await call(page, 'setCardCustomFieldCheckbox', card._id, fieldId, false);
    expect(activities()).toHaveLength(1);
    await expect(call(page, 'setCardCustomFieldCheckbox', card._id, 'foreign', true)).rejects.toThrow();
    expect(activities()).toHaveLength(1);
    await call(page, 'setCardCustomFieldAssigned', card._id, fieldId, false);
    expect(activities().map(a => a.activityType)).toEqual(['setCustomField', 'unsetCustomField']);
    await call(page, 'setCardCustomFieldAssigned', card._id, fieldId, true);
    expect(activities()).toHaveLength(2);
  } finally {
    db.deleteOne('customFields', { _id: fieldId });
  }
});
