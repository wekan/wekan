'use strict';
const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const { loginWithToken, openBoard } = require('../helpers/auth');
const call = (page, method, ...args) => page.evaluate(async ({ method, args }) => {
  try { return await Meteor.callAsync(method, ...args); }
  catch (error) { throw new Error(`${error.error}: ${error.reason || error.message}`); }
}, { method, args });

test('unfinished imports block Scrum writes, History and exports while showing a clear warning', async ({ page, request, user, board }) => {
  try {
    await loginWithToken(page, user.id, user.token);
    const sprint = await call(page, 'scrum.saveSprint', board.boardId, null,
      { name: 'Pending import', plannedStart: '2026-09-01', plannedEnd: '2026-09-30' }, null);
    const active = await call(page, 'scrum.startSprint', board.boardId, sprint._id, sprint.revision);
    await call(page, 'scrum.closeSprint', board.boardId, sprint._id, active.revision, null);
    db.updateOne('scrumSprints', { _id: sprint._id }, { $set: { scrumImportPending: true } });
    const original = db.findOne('scrumSprints', { _id: sprint._id });
    const historyCount = db.find('changeHistory', { boardId: board.boardId }).length;
    const card = db.find('cards', { boardId: board.boardId })[0];
    const writes = [
      ['scrum.configure', board.boardId, { productGoal: 'Changed' }, null],
      ['scrum.saveSprint', board.boardId, null, { name: 'Extra sprint' }, null],
      ['scrum.saveRelease', board.boardId, null, { name: 'Extra release' }, null],
      ['scrum.saveEvent', board.boardId, null, { name: 'Extra event' }, null],
      ['scrum.updateCard', board.boardId, card._id, { acceptanceCriteria: 'Changed' }, 0],
      ['scrum.updateList', board.boardId, card.listId, { category: 'done' }, 0],
      ['scrum.updateSwimlane', board.boardId, card.swimlaneId, { purpose: 'Changed' }, 0],
      ['scrum.startSprint', board.boardId, sprint._id, original.revision],
      ['scrum.cancelSprint', board.boardId, sprint._id, original.revision, 'Changed'],
      // Exercise the already-closed retry path, which bypasses normal pending().
      ['scrum.closeSprint', board.boardId, sprint._id, active.revision, null],
      ['changeHistory.undoLast', board.boardId],
    ];
    for (const [method, ...args] of writes) {
      await expect(call(page, method, ...args), method).rejects.toThrow(/import is incomplete/);
    }
    expect(db.findOne('scrumSprints', { _id: sprint._id })).toEqual(original);
    expect(db.find('changeHistory', { boardId: board.boardId })).toHaveLength(historyCount);
    expect(db.find('scrumHistoryPending', { _id: board.boardId })).toHaveLength(0);
    const data = await call(page, 'scrum.getBoardData', board.boardId);
    expect(data.importPending).toBe(true); expect(data.canAdmin).toBe(false); expect(data.canWrite).toBe(false);
    expect(data.cards.every(card => card.canWrite === false)).toBe(true);
    for (const key of ['scrumDaily', 'scrumSprint', 'scrumVelocity']) for (const format of ['Excel', 'PDF']) {
      const response = await request.get(`/api/boards/${board.boardId}/charts/${key}/export${format}?authToken=${encodeURIComponent(user.token)}&sprintId=${sprint._id}`);
      expect(response.status()).toBe(409);
      expect(await response.text()).toContain('import is incomplete');
    }
    await openBoard(page, board.boardId, board.slug);
    await page.locator('.js-toggle-board-view').first().click();
    await page.locator('.pop-over .js-open-sprints-view').click();
    await expect(page.locator('.scrum-import-pending')).toContainText('import is incomplete');
    await expect(page.locator('.js-scrum-settings')).toHaveCount(0);
    await expect(page.locator('.js-scrum-sprint-form')).toHaveCount(0);
    // The importer clears this marker only after its writes finish. Verify
    // the guard does not leave a permanent write lock after that transition.
    db.updateOne('scrumSprints', { _id: sprint._id }, { $unset: { scrumImportPending: '' } });
    expect((await call(page, 'scrum.getBoardData', board.boardId)).canAdmin).toBe(true);
    expect((await call(page, 'changeHistory.undoLast', board.boardId)).undone).toBe(true);
    await page.locator('.js-scrum-refresh').click();
    await expect(page.locator('.scrum-import-pending')).toHaveCount(0);
    await expect(page.locator('.js-scrum-sprint-form')).toHaveCount(1);
  } finally {
    for (const collection of ['scrumSprints', 'scrumReleases', 'scrumEvents', 'scrumDailySnapshots']) db.deleteMany(collection, { boardId: board.boardId });
    db.deleteMany('scrumHistoryPending', { _id: board.boardId });
  }
});

test('a private import checkpoint blocks Scrum before the first sprint exists', async ({ page, user, board }) => {
  db.insertOne('scrumImportPending', { _id: board.boardId, operationId: 'test-plan',
    state: 'preparing', userId: user.id, next: 0, total: 1 });
  try {
    await loginWithToken(page, user.id, user.token);
    const data = await call(page, 'scrum.getBoardData', board.boardId);
    expect(data.importPending).toBe(true);
    expect(data.sprints).toHaveLength(0);
    expect(data).not.toHaveProperty('operationId');
    expect(data).not.toHaveProperty('total');
    await expect(call(page, 'scrum.saveSprint', board.boardId, null, { name: 'Too early' }, null))
      .rejects.toThrow(/import is incomplete/);
    await openBoard(page, board.boardId, board.slug);
    await page.locator('.js-toggle-board-view').first().click();
    await page.locator('.pop-over .js-open-sprints-view').click();
    await expect(page.locator('.scrum-import-pending')).toBeVisible();
    await expect(page.locator('.js-scrum-sprint-form')).toHaveCount(0);
    for (const state of ['applying', 'applied']) {
      db.updateOne('scrumImportPending', { _id: board.boardId }, { $set: { state } });
      expect((await call(page, 'scrum.getBoardData', board.boardId)).importPending).toBe(true);
      await expect(call(page, 'scrum.configure', board.boardId, { productGoal: 'Too early' }, null))
        .rejects.toThrow(/import is incomplete/);
    }
    db.deleteMany('scrumImportPending', { _id: board.boardId });
    await page.locator('.js-scrum-refresh').click();
    await expect(page.locator('.scrum-import-pending')).toHaveCount(0);
    expect((await call(page, 'scrum.getBoardData', board.boardId)).canAdmin).toBe(true);
  } finally { db.deleteMany('scrumImportPending', { _id: board.boardId }); }
});
