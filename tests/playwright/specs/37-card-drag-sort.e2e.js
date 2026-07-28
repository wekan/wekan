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

  // #6558 "Moving cards behaves weirdly": on a board with scrollbars in both
  // directions, a card drag also panned the board - the list slid sideways under
  // the pointer while the card followed it, so the drop landed somewhere else.
  // Three drag-scroll implementations shared the pointer: the dragscroll library
  // (bound to the canvas AND to every lane), the `mousedown .board-canvas` lane
  // pan in swimlanes.js, and jQuery UI sortable, which is the one that is
  // supposed to move the card.
  test('#6558 dragging a card does not pan the lane or the board', async ({
    loggedInPage,
    user,
    browserName,
  }) => {
    test.skip(browserName !== 'chromium', 'drag-sort harness validated on Chromium');
    // Enough lists that the lane overflows horizontally, which is the board the
    // report is about.
    const board = db.seedBoard({
      ownerId: user.id,
      title: 'DragNoPan',
      listCount: 12,
      cardTitlesPerList: [['One', 'Two', 'Three']],
    });
    try {
      await openBoard(loggedInPage, board.boardId, board.slug);
      await waitForMeteor(loggedInPage);
      const list = `#js-list-${board.listIds[0]}`;
      await loggedInPage.locator(`${list} .js-minicard`).first().waitFor({ timeout: 30_000 });

      // Pan the lane away from its left edge first, so a pan in EITHER direction
      // during the drag is visible as a change (scrollLeft cannot go below 0).
      const startScroll = await loggedInPage.evaluate(() => {
        const lane = document.querySelector('.js-lists');
        const canvas = document.querySelector('.board-canvas');
        if (lane) lane.scrollLeft = 120;
        return { lane: lane ? lane.scrollLeft : null, canvas: canvas ? canvas.scrollTop : null };
      });
      expect(startScroll.lane).toBeGreaterThan(0);

      const card = loggedInPage.locator(`${list} .js-minicard`).first();
      const box = await card.boundingBox();
      const x = box.x + box.width / 2;
      const y = box.y + 12;

      await loggedInPage.mouse.move(x, y);
      await loggedInPage.mouse.down();
      // Past jQuery UI's 7px threshold, then a sideways travel - the gesture that
      // used to drag the card and pan the lane at the same time. Kept well inside
      // the lane so the drag's own edge auto-scroll cannot fire.
      await loggedInPage.mouse.move(x, y + 12, { steps: 4 });
      for (let i = 1; i <= 8; i++) {
        await loggedInPage.mouse.move(x + i * 10, y + 12 + i, { steps: 2 });
        await loggedInPage.waitForTimeout(15);
      }

      const during = await loggedInPage.evaluate(() => {
        const lane = document.querySelector('.js-lists');
        const canvas = document.querySelector('.board-canvas');
        return {
          lane: lane ? lane.scrollLeft : null,
          canvas: canvas ? canvas.scrollTop : null,
          canvasPans: canvas ? canvas.classList.contains('dragscroll') : null,
          lanePans: lane ? lane.classList.contains('dragscroll') : null,
          dragging: !!document.querySelector('.ui-sortable-helper'),
        };
      });

      await loggedInPage.mouse.up();
      await loggedInPage.waitForTimeout(400);

      expect(during.dragging).toBe(true); // the card really was being dragged
      expect(during.canvasPans).toBe(false); // ... and nothing was panning with it
      expect(during.lanePans).toBe(false);
      expect(during.lane).toBe(startScroll.lane);
      expect(during.canvas).toBe(startScroll.canvas);

      // Panning is a feature: it comes back the moment the drag is over.
      await expect
        .poll(
          () =>
            loggedInPage.evaluate(
              () => !!document.querySelector('.board-canvas.dragscroll'),
            ),
          { timeout: 5_000 },
        )
        .toBe(true);
    } finally {
      db.cleanup({ boardIds: [board.boardId] });
    }
  });
});
