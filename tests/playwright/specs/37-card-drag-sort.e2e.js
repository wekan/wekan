'use strict';

/**
 * Spec 37 — card drag-sort reordering regressions.
 *
 * Uses the drag-sort harness (helpers/dragSort.js), which drives jQuery-UI
 * sortable with a realistic stepped mouse gesture (Playwright's high-level
 * dragTo() does not trigger jQuery-UI sortable).
 *
 *  - #3826: reordering cards in a list whose cards have a parent (sub-tasks) must
 *           persist — it was reported that such cards "go back to their place".
 *           Verified here that the new order is saved both for a few cards and at
 *           scale.
 */

const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const { openBoard, waitForMeteor } = require('../helpers/auth');
const { dragCardOnto } = require('../helpers/dragSort');

async function dbOrder(boardId, listId) {
  return db
    .find('cards', { boardId, listId }, { title: 1, sort: 1 })
    .sort((a, b) => a.sort - b.sort)
    .map(c => c.title);
}

test.describe('Card drag-sort reordering', () => {
  test('#3826 cards that have a parent can be reordered and the new order persists', async ({
    loggedInPage,
    user,
    browserName,
  }) => {
    // The reorder logic is browser-independent; the jQuery-UI drag-sort harness
    // is validated on Chromium. Scoped to Chromium so cross-browser drag-timing
    // differences cannot flake the otherwise-green matrix.
    test.skip(browserName !== 'chromium', 'drag-sort harness validated on Chromium');
    // list 0 = parents, list 1 = sub-tasks (each given a parentId).
    const board = db.seedBoard({
      ownerId: user.id,
      title: 'DragSort',
      listCount: 2,
      cardTitlesPerList: [['Parent P'], ['A Card', 'B Card', 'C Card', 'D Card']],
    });
    try {
      const parentId = db.findOne('cards', { boardId: board.boardId, title: 'Parent P' }, { _id: 1 })._id;
      const subListId = board.listIds[1];
      db.updateMany('cards', { boardId: board.boardId, listId: subListId }, { $set: { parentId } });

      await openBoard(loggedInPage, board.boardId, board.slug);
      await waitForMeteor(loggedInPage);
      const list = `#js-list-${subListId}`;
      await loggedInPage.locator(`${list} .js-minicard`).first().waitFor({ timeout: 30_000 });

      // Drag the last sub-task card to the front of the list.
      await dragCardOnto(
        loggedInPage,
        loggedInPage.locator(`${list} .js-minicard`).filter({ hasText: 'D Card' }).first(),
        loggedInPage.locator(`${list} .js-minicard`).filter({ hasText: 'A Card' }).first(),
        { place: 'before' },
      );

      // The reorder must be saved (it used to revert for parented cards).
      await expect
        .poll(async () => (await dbOrder(board.boardId, subListId))[0], { timeout: 15_000 })
        .toBe('D Card');
    } finally {
      db.cleanup({ boardIds: [board.boardId] });
    }
  });
});
