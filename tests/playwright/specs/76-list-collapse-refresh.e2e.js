'use strict';

const { test, expect } = require('../fixtures');
const db = require('../helpers/db');

test('#6712 a collapsed list stays collapsed after a hard reload', async ({ boardPage, board }) => {
  const list = boardPage.locator(`#js-list-${board.listIds[0]}`);
  await list.locator('.js-collapse').click();
  await expect(list).toHaveClass(/list-collapsed/);
  await expect.poll(() => {
    const user = db.findOne('users', { _id: board.owner.id });
    return user?.profile?.collapsedLists?.[board.boardId]?.[`${board.listIds[0]}:${board.swimlaneId}`];
  }).toBe(true);
  await boardPage.reload({ waitUntil: 'domcontentloaded' });
  await expect(list).toHaveClass(/list-collapsed/);
});
