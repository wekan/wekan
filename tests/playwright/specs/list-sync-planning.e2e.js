// Planning Sync (2026-10-08): the Sync settings offer the issue's sprint and
// releases as opt-in fields, only where the source carries them, and a Sync
// puts the card in the board's sprint and release, made on this board when
// missing (models/lib/listSyncPlanning.js).
const http = require('node:http');
const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const { loginWithToken, openBoard } = require('../helpers/auth');
const call = (page, name, ...args) => page.evaluate(({ name, args }) => Meteor.callAsync(name, ...args), { name, args });
let server, base, issues;
test.beforeAll(async () => {
  // GitLab's Issues API (v4), with the iteration and milestone it returns.
  server = http.createServer((_req, res) => {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(issues));
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  base = `http://127.0.0.1:${server.address().port}`;
});
test.afterAll(async () => { await new Promise(resolve => server.close(resolve)); });

const openSyncPopup = (page, list) => page.evaluate(current => {
  Popup.close(); Popup.open('listSync', { dataContext: current })({ currentTarget: document.body,
    target: document.body, preventDefault() {}, stopPropagation() {} });
}, list);

test('the Sync settings opt into sprint and releases, and a Sync plans the card on this board', async ({ page, user, board }) => {
  const listId = db.find('lists', { boardId: board.boardId })[0]._id;
  db.updateOne('boards', { _id: board.boardId }, { $set: { scrum: { enabled: true } } });
  issues = [{ iid: 7, title: 'Pump', state: 'opened',
    iteration: { id: 501, iid: 5, title: 'Iteration 5', state: 2, start_date: '2026-10-01', due_date: '2026-10-14' },
    milestone: { id: 12, iid: 3, title: '2026.10', state: 'active', due_date: '2026-10-31' } }];
  try {
    await loginWithToken(page, user.id, user.token);
    await openBoard(page, board.boardId, board.slug);
    const config = { type: 'gitlab', url: base, projectKey: '42', token: 'planning-test-token' };
    await call(page, 'setListSyncSource', listId, config);
    await openSyncPopup(page, db.findOne('lists', { _id: listId }));
    // Off until chosen; the hint shows once one is.
    await expect(page.locator('.js-toggle-sync-field[data-field="sprint"]')).toBeVisible();
    await expect(page.locator('.js-toggle-sync-field[data-field="releases"]')).toBeVisible();
    await expect(page.locator('.js-list-sync-planning-hint')).toHaveCount(0);
    await page.locator('.js-toggle-sync-field[data-field="sprint"]').click();
    await page.locator('.js-toggle-sync-field[data-field="releases"]').click();
    await expect(page.locator('.js-list-sync-planning-hint')).toBeVisible();
    await page.locator('.js-list-sync-save').click();
    await expect.poll(() => db.findOne('lists', { _id: listId }).syncSource.fields).toEqual(
      expect.arrayContaining(['sprint', 'releases']));

    const preview = await call(page, 'previewListSync', listId);
    expect(preview.error).toBeFalsy();
    expect(db.find('scrumSprints', { boardId: board.boardId })).toHaveLength(0);

    await page.locator('.js-list-sync-now').click();
    await expect.poll(() => db.findOne('cards', { listId, syncExternalId: '7' })?.scrum?.sprintId).toBeTruthy();
    const card = db.findOne('cards', { listId, syncExternalId: '7' });
    const sprint = db.findOne('scrumSprints', { _id: card.scrum.sprintId });
    expect([sprint.boardId, sprint.name, sprint.state]).toEqual([board.boardId, 'Iteration 5', 'planned']);
    const release = db.findOne('scrumReleases', { _id: card.scrum.releaseIds[0] });
    expect([release.boardId, release.name]).toEqual([board.boardId, '2026.10']);

    // A local planning change stays while GitLab's stays the same.
    db.updateOne('cards', { _id: card._id }, { $set: { 'scrum.sprintId': null }, $inc: { scrumRevision: 1 } });
    expect((await call(page, 'syncListNow', listId)).error).toBeFalsy();
    expect(db.findOne('cards', { _id: card._id }).scrum.sprintId).toBeNull();
    expect(db.find('scrumSprints', { boardId: board.boardId })).toHaveLength(1);

    // Negative: GitHub issues carry a milestone but no sprint.
    await openSyncPopup(page, db.findOne('lists', { _id: listId }));
    await page.locator('.js-list-sync-type').selectOption('github');
    await expect(page.locator('.js-toggle-sync-field[data-field="sprint"]')).toHaveCount(0);
    await expect(page.locator('.js-toggle-sync-field[data-field="releases"]')).toBeVisible();
    await expect(call(page, 'setListSyncSource', listId, { ...config, type: 'github', fields: ['sprint'] })).rejects.toThrow();
  } finally {
    for (const collection of ['scrumSprints', 'scrumReleases', 'changeHistory']) db.deleteMany(collection, { boardId: board.boardId });
    db.deleteMany('listSyncCredentials', { listId });
  }
});

test('without Scrum on the board, a Sync leaves planning alone', async ({ page, user, board }) => {
  const listId = db.find('lists', { boardId: board.boardId })[0]._id;
  db.updateOne('boards', { _id: board.boardId }, { $unset: { scrum: '' } });
  issues = [{ iid: 8, title: 'Valve', state: 'opened', milestone: { id: 13, title: '2026.11', state: 'active' } }];
  try {
    await loginWithToken(page, user.id, user.token);
    await openBoard(page, board.boardId, board.slug);
    await call(page, 'setListSyncSource', listId, { type: 'gitlab', url: base, projectKey: '42',
      token: 'planning-test-token', fields: ['title', 'releases'] });
    const result = await call(page, 'syncListNow', listId);
    expect(result.error).toBeFalsy();
    expect(result.planningSkipped).toBe('scrum-disabled');
    expect(db.findOne('cards', { listId, syncExternalId: '8' }).scrum).toBeUndefined();
    expect(db.find('scrumReleases', { boardId: board.boardId })).toHaveLength(0);
  } finally {
    db.deleteMany('listSyncCredentials', { listId });
  }
});
