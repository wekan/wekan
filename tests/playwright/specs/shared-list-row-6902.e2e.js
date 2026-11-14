'use strict';

/**
 * #6902 - Board Settings / Swimlane / "One shared list header row" shows the
 * same lists in every swimlane and scrolls the swimlanes sideways together,
 * as swimlanes were before lists belonged to one swimlane. Nothing is written
 * to the lists: turned off, each swimlane shows its own lists again.
 * tests/sharedListRow6902.test.cjs drives the logic.
 */

const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const { loginWithToken, openBoard } = require('../helpers/auth');

// The board's own swimlane keeps its lists; a second swimlane gets one list of
// its own, as on a board made while lists were per swimlane.
function seed(user, listCount = 3) {
  const board = db.seedBoard({ ownerId: user.id, listCount, cardTitlesPerList: [['Alpha Card']] });
  const lane2 = db.uid('swim');
  const own = db.uid('list');
  const now = new Date();
  db.insertOne('swimlanes', { _id: lane2, title: 'Second lane', boardId: board.boardId, sort: 2, type: 'swimlane',
    archived: false, createdAt: now, updatedAt: now, modifiedAt: now });
  db.insertOne('lists', { _id: own, title: 'Only in the second lane', boardId: board.boardId, swimlaneId: lane2,
    sort: listCount + 1, type: 'list', starred: false, archived: false,
    wipLimit: { value: 1, enabled: false, soft: false }, width: 272, createdAt: now, updatedAt: now, modifiedAt: now });
  db.insertOne('cards', { _id: db.uid('card'), title: 'Second lane card', boardId: board.boardId, swimlaneId: lane2,
    listId: board.listIds[0], sort: 0, archived: false, userId: user.id, type: 'cardType-card',
    createdAt: now, modifiedAt: now, dateLastActivity: now });
  return { board, lane2, own };
}

const listIdsIn = (page, swimlaneId) => page.evaluate(id =>
  [...document.querySelectorAll(`#swimlane-${id} .js-list`)].map(el => Blaze.getData(el)?._id).filter(Boolean), swimlaneId);

test('every swimlane shows all of the board\'s lists, each with its own cards', async ({ page, user }) => {
  const { board, lane2, own } = seed(user);
  try {
    db.updateOne('boards', { _id: board.boardId }, { $set: { sharedListHeaders: true } });
    await loginWithToken(page, user.id, user.token);
    await openBoard(page, board.boardId, board.slug);
    const all = [...board.listIds, own];
    await expect.poll(() => listIdsIn(page, board.swimlaneId)).toEqual(all);
    await expect.poll(() => listIdsIn(page, lane2)).toEqual(all);
    // One header row: the first swimlane's.
    await expect(page.locator(`#swimlane-${board.swimlaneId} .list-header`).first()).toBeVisible();
    await expect(page.locator(`#swimlane-${lane2} .list-header:visible`)).toHaveCount(0);
    // Each list holds the cards of the swimlane it is shown in.
    await expect(page.locator(`#swimlane-${lane2} .js-minicard`, { hasText: 'Second lane card' })).toHaveCount(1);
    await expect(page.locator(`#swimlane-${lane2} .js-minicard`, { hasText: 'Alpha Card' })).toHaveCount(0);
    await expect(page.locator(`#swimlane-${board.swimlaneId} .js-minicard`, { hasText: 'Second lane card' })).toHaveCount(0);
    // Nothing was written to the lists.
    expect(db.findOne('lists', { _id: own }).swimlaneId).toBe(lane2);
    expect(db.findOne('lists', { _id: board.listIds[0] }).swimlaneId).toBe(board.swimlaneId);
  } finally { db.cleanup({ boardIds: [board.boardId] }); }
});

test('the swimlanes scroll sideways together', async ({ page, user }) => {
  const { board, lane2 } = seed(user, 14);
  try {
    db.updateOne('boards', { _id: board.boardId }, { $set: { sharedListHeaders: true } });
    await loginWithToken(page, user.id, user.token);
    await page.setViewportSize({ width: 1280, height: 800 });
    await openBoard(page, board.boardId, board.slug);
    await expect.poll(async () => (await listIdsIn(page, lane2)).length).toBe(15);
    for (const [from, to] of [[board.swimlaneId, lane2], [lane2, board.swimlaneId]]) {
      const target = await page.evaluate(id => {
        const el = document.getElementById(`swimlane-${id}`);
        el.scrollLeft = Math.round((el.scrollWidth - el.clientWidth) * (el.scrollLeft ? 0.25 : 0.75));
        return el.scrollLeft;
      }, from);
      expect(target).toBeGreaterThan(0);
      await expect.poll(() => page.evaluate(id => document.getElementById(`swimlane-${id}`).scrollLeft, to)).toBe(target);
    }
  } finally { db.cleanup({ boardIds: [board.boardId] }); }
});

test('negative: without the setting each swimlane shows only its own lists and scrolls alone', async ({ page, user }) => {
  const { board, lane2, own } = seed(user, 14);
  try {
    await loginWithToken(page, user.id, user.token);
    await page.setViewportSize({ width: 1280, height: 800 });
    await openBoard(page, board.boardId, board.slug);
    await expect.poll(() => listIdsIn(page, lane2)).toEqual([own]);
    await expect.poll(() => listIdsIn(page, board.swimlaneId)).toEqual(board.listIds);
    await page.evaluate(id => { document.getElementById(`swimlane-${id}`).scrollLeft = 400; }, board.swimlaneId);
    await page.waitForTimeout(300);
    expect(await page.evaluate(id => document.getElementById(`swimlane-${id}`).scrollLeft, lane2)).toBe(0);
  } finally { db.cleanup({ boardIds: [board.boardId] }); }
});
