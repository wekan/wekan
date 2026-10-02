'use strict';
// An interrupted Scrum import is finished online by a board administrator
// (server/lib/scrumImportRecovery.js, scrum.resumeImport).
const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const { loginWithToken, openBoard } = require('../helpers/auth');

test('a board admin finishes an interrupted Scrum import from the Scrum view', async ({ page, user, board }) => {
  const [card] = db.find('cards', { boardId: board.boardId });
  const sprintId = `imported-${board.boardId}`;
  const steps = [
    { kind: 'insert', collection: 'sprints', after: { _id: sprintId, boardId: board.boardId, name: 'Recovered sprint',
      state: 'planned', revision: 1, scrumImportPending: true } },
    { kind: 'update', collection: 'cards', boardId: board.boardId, id: card._id, before: {},
      after: { scrum: { sprintId }, scrumRevision: 1 } },
    { kind: 'update', collection: 'boards', boardId: board.boardId, id: board.boardId, before: {},
      after: { scrum: { enabled: true }, scrumRevision: 1, scrumImportLosses: [] } },
  ];
  try {
    // The writer crashed after its first step; its lease ran out long ago.
    db.insertOne('scrumSprints', steps[0].after);
    db.insertOne('scrumImportPending', { _id: board.boardId, operationId: 'op', owner: 'gone', leaseUntil: new Date(0),
      state: 'applying', total: 3, next: 1 });
    db.insertMany('scrumImportSteps', steps.map((step, index) => ({ _id: `op:${index}`, boardId: board.boardId,
      operationId: 'op', index, step })));
    await loginWithToken(page, user.id, user.token);
    await openBoard(page, board.boardId, board.slug);
    await page.locator('.js-toggle-board-view').first().click();
    await page.locator('.pop-over .js-open-product-backlog-view').click();
    await expect(page.locator('.scrum-import-pending')).toBeVisible();
    await page.locator('.js-scrum-resume-import').click();
    await expect(page.locator('.scrum-import-pending')).toHaveCount(0);
    await expect.poll(() => db.findOne('scrumImportPending', { _id: board.boardId })).toBeNull();
    expect(db.findOne('cards', { _id: card._id }).scrum).toEqual({ sprintId });
    expect(db.findOne('scrumSprints', { _id: sprintId }).scrumImportPending).toBeUndefined();
  } finally {
    db.deleteMany('scrumImportPending', { _id: board.boardId });
    db.deleteMany('scrumImportSteps', { boardId: board.boardId });
    db.deleteMany('scrumSprints', { boardId: board.boardId });
  }
});
