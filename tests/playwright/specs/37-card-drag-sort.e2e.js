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
 *  - #6430: cancelling jQuery UI's DOM move must leave a visual card in the drop
 *           slot until Blaze renders the real card there.
 */

const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const { openBoard, waitForMeteor } = require('../helpers/auth');
const { dragCardOnto } = require('../helpers/dragSort');

async function dbOrder(boardId, listId) {
  return db
    .find('cards', { boardId, listId }, { title: 1, sort: 1 })
    .sort((a, b) => a.sort - b.sort)
    .map((c) => c.title);
}

test.describe('Card drag-sort reordering', () => {
  test('without drag handles, dragging from the title reorders the card', async ({
    loggedInPage,
    user,
    browserName,
  }) => {
    test.skip(browserName !== 'chromium', 'drag-sort harness validated on Chromium');
    const board = db.seedBoard({
      ownerId: user.id,
      title: 'TitleDragSurface',
      cardTitlesPerList: [['Drag my title', 'Target card'], [], []],
    });
    try {
      db.updateOne('users', { _id: user.id }, {
        $set: { 'profile.showDesktopDragHandles': false },
      });
      await openBoard(loggedInPage, board.boardId, board.slug);
      await waitForMeteor(loggedInPage);
      const list = loggedInPage.locator(`#js-list-${board.listIds[0]}`);
      const source = list.locator('.js-minicard', { hasText: 'Drag my title' });
      const target = list.locator('.js-minicard', { hasText: 'Target card' });
      await expect(source.locator('.handle')).toHaveCount(0);

      await dragCardOnto(loggedInPage, source, target, {
        place: 'after',
        handle: '.minicard-title-text',
      });

      await expect.poll(() => dbOrder(board.boardId, board.listIds[0]))
        .toEqual(['Target card', 'Drag my title']);
    } finally {
      db.updateOne('users', { _id: user.id }, {
        $unset: { 'profile.showDesktopDragHandles': '' },
      });
      db.cleanup({ boardIds: [board.boardId] });
    }
  });

  test('with drag handles, dragging from the handle reorders the card', async ({
    loggedInPage,
    user,
    browserName,
  }) => {
    test.skip(browserName !== 'chromium', 'drag-sort harness validated on Chromium');
    const board = db.seedBoard({
      ownerId: user.id,
      title: 'HandleDragSurface',
      cardTitlesPerList: [['Drag my handle', 'Handle target'], [], []],
    });
    try {
      db.updateOne('users', { _id: user.id }, {
        $set: { 'profile.showDesktopDragHandles': true },
      });
      await openBoard(loggedInPage, board.boardId, board.slug);
      await waitForMeteor(loggedInPage);
      const list = loggedInPage.locator(`#js-list-${board.listIds[0]}`);
      const source = list.locator('.js-minicard', { hasText: 'Drag my handle' });
      const target = list.locator('.js-minicard', { hasText: 'Handle target' });
      await expect(source.locator('.handle')).toBeVisible({ timeout: 8_000 });

      await dragCardOnto(loggedInPage, source, target, {
        place: 'after',
        handle: '.handle',
      });

      await expect.poll(() => dbOrder(board.boardId, board.listIds[0]))
        .toEqual(['Handle target', 'Drag my handle']);
    } finally {
      db.updateOne('users', { _id: user.id }, {
        $unset: { 'profile.showDesktopDragHandles': '' },
      });
      db.cleanup({ boardIds: [board.boardId] });
    }
  });

  test('Mobile Mode aligns card controls and keeps the desktop swimlane handle position', async ({
    loggedInPage,
    user,
  }) => {
    const board = db.seedBoard({
      ownerId: user.id,
      title: 'MobileHandleAlignment',
      cardTitlesPerList: [['Aligned card'], [], []],
    });
    const centerX = locator => locator.evaluate(el => {
      const box = el.getBoundingClientRect();
      return box.left + box.width / 2;
    });
    try {
      db.updateOne('users', { _id: user.id }, {
        $set: { 'profile.showDesktopDragHandles': true },
      });
      await loggedInPage.setViewportSize({ width: 1200, height: 800 });
      await loggedInPage.evaluate(() => localStorage.setItem('wekan-mobile-mode', 'false'));
      await openBoard(loggedInPage, board.boardId, board.slug);
      await waitForMeteor(loggedInPage);

      const swimlaneHandle = loggedInPage.locator('.js-swimlane-header-handle').first();
      await expect(swimlaneHandle).toBeVisible({ timeout: 8_000 });
      const desktopSwimlaneX = await centerX(swimlaneHandle);

      await loggedInPage.evaluate(() => localStorage.setItem('wekan-mobile-mode', 'true'));
      await loggedInPage.reload({ waitUntil: 'domcontentloaded' });
      await waitForMeteor(loggedInPage);
      await expect(swimlaneHandle).toBeVisible({ timeout: 8_000 });
      expect(Math.abs((await centerX(swimlaneHandle)) - desktopSwimlaneX))
        .toBeLessThan(0.5);

      await loggedInPage.locator(`#js-list-${board.listIds[0]}`).click();
      const card = loggedInPage.locator('.js-minicard', { hasText: 'Aligned card' });
      await expect(card).toBeVisible({ timeout: 8_000 });
      const menuIcon = card.locator('.minicard-details-menu-with-handle .fa');
      const handleIcon = card.locator('.handle .fa');
      expect(Math.abs((await centerX(handleIcon)) - (await centerX(menuIcon))))
        .toBeLessThan(0.5);
    } finally {
      db.updateOne('users', { _id: user.id }, {
        $unset: { 'profile.showDesktopDragHandles': '' },
      });
      db.cleanup({ boardIds: [board.boardId] });
    }
  });

  test('#761 dragging toward the bottom scrolls the long list and accepts the drop', async ({
    loggedInPage,
    user,
    browserName,
  }) => {
    test.skip(browserName !== 'chromium', 'drag-sort harness validated on Chromium');
    const titles = Array.from({ length: 35 }, (_, i) => `Long Card ${i + 1}`);
    const board = db.seedBoard({
      ownerId: user.id,
      title: 'Issue 761 Long List',
      cardTitlesPerList: [titles, [], []],
    });
    try {
      await loggedInPage.setViewportSize({ width: 1000, height: 600 });
      await openBoard(loggedInPage, board.boardId, board.slug);
      await waitForMeteor(loggedInPage);
      const list = loggedInPage.locator(`#js-list-${board.listIds[0]}`);
      const body = list.locator('.list-body');
      const sourceCard = db.findOne('cards', {
        boardId: board.boardId,
        title: titles[0],
      });
      const source = list.locator(`.js-minicard[data-card-id="${sourceCard._id}"]`);
      await expect(source).toBeVisible({ timeout: 20_000 });
      const originalSort = sourceCard.sort;
      const sourceBox = await source.boundingBox();
      const bodyBox = await body.boundingBox();
      expect(sourceBox).toBeTruthy();
      expect(bodyBox).toBeTruthy();

      await loggedInPage.mouse.move(
        sourceBox.x + sourceBox.width / 2,
        sourceBox.y + 12,
      );
      await loggedInPage.mouse.down();
      await loggedInPage.mouse.move(
        sourceBox.x + sourceBox.width / 2 + 10,
        sourceBox.y + 24,
        { steps: 4 },
      );
      const edgeX = bodyBox.x + bodyBox.width / 2;
      const edgeY = bodyBox.y + bodyBox.height - 8;
      for (let i = 0; i < 45; i += 1) {
        await loggedInPage.mouse.move(edgeX + (i % 2), edgeY - (i % 2), {
          steps: 2,
        });
        await loggedInPage.waitForTimeout(20);
      }
      const scrolled = await body.evaluate(element => element.scrollTop);
      expect(scrolled).toBeGreaterThan(0);
      await loggedInPage.mouse.up();

      await expect.poll(() => db.findOne('cards', {
        boardId: board.boardId,
        title: titles[0],
      }).sort).not.toBe(originalSort);
    } finally {
      await loggedInPage.mouse.up().catch(() => {});
      db.cleanup({ boardIds: [board.boardId] });
    }
  });

  test('#5421 a fast touch drag moves the card without opening it', async ({
    loggedInPage,
    user,
    browserName,
  }) => {
    test.skip(browserName !== 'chromium', 'raw touch gesture uses Chromium CDP');
    const board = db.seedBoard({
      ownerId: user.id,
      title: 'FastTouchDrag',
      listCount: 2,
      cardTitlesPerList: [['Touch Card'], ['Target Card']],
    });
    try {
      await openBoard(loggedInPage, board.boardId, board.slug);
      await waitForMeteor(loggedInPage);
      const source = loggedInPage
        .locator('.js-minicard')
        .filter({ hasText: 'Touch Card' })
        .first();
      const target = loggedInPage
        .locator('.js-minicard')
        .filter({ hasText: 'Target Card' })
        .first();
      await source.waitFor({ timeout: 30_000 });

      const handle = source.locator('.handle');
      const sourceBox = (await handle.count())
        ? await handle.boundingBox()
        : await source.boundingBox();
      const targetBox = await target.boundingBox();
      expect(sourceBox).not.toBeNull();
      expect(targetBox).not.toBeNull();
      const from = {
        x: sourceBox.x + sourceBox.width / 2,
        y: sourceBox.y + sourceBox.height / 2,
      };
      const to = {
        x: targetBox.x + targetBox.width / 2,
        y: targetBox.y + 6,
      };
      const cdp = await loggedInPage.context().newCDPSession(loggedInPage);
      await cdp.send('Input.dispatchTouchEvent', {
        type: 'touchStart',
        touchPoints: [{ ...from, id: 1 }],
      });
      for (let i = 1; i <= 6; i++) {
        await cdp.send('Input.dispatchTouchEvent', {
          type: 'touchMove',
          touchPoints: [
            {
              x: from.x + ((to.x - from.x) * i) / 6,
              y: from.y + ((to.y - from.y) * i) / 6,
              id: 1,
            },
          ],
        });
      }
      await cdp.send('Input.dispatchTouchEvent', {
        type: 'touchEnd',
        touchPoints: [],
      });

      await expect
        .poll(
          () =>
            db.findOne(
              'cards',
              { boardId: board.boardId, title: 'Touch Card' },
              { listId: 1 },
            ).listId,
          { timeout: 15_000 },
        )
        .toBe(board.listIds[1]);
      expect(loggedInPage.url()).not.toContain('/cards/');
      await expect(loggedInPage.locator('.js-card-details')).toHaveCount(0);
    } finally {
      db.cleanup({ boardIds: [board.boardId] });
    }
  });

  test('#6430 a cross-list drop never leaves its target visually empty', async ({
    loggedInPage,
    user,
    browserName,
  }) => {
    test.skip(
      browserName !== 'chromium',
      'drag-sort harness validated on Chromium',
    );
    const board = db.seedBoard({
      ownerId: user.id,
      title: 'DragNoFlicker',
      listCount: 2,
      cardTitlesPerList: [['Moving Card'], []],
    });
    try {
      await openBoard(loggedInPage, board.boardId, board.slug);
      await waitForMeteor(loggedInPage);
      const source = loggedInPage
        .locator('.js-minicard')
        .filter({ hasText: 'Moving Card' })
        .first();
      const target = loggedInPage.locator(
        `#js-list-${board.listIds[1]} .js-minicards`,
      );
      await source.waitFor({ timeout: 30_000 });

      // Make the reconciliation gap deterministic. The object attached to the
      // rendered source node is the same object list.js reads in sortable's
      // stop callback, so delaying this method emulates a costly large-board
      // flush without changing production timing.
      await source.evaluate((element) => {
        const card = Blaze.getData(element);
        const move = card.move.bind(card);
        card.move = (...args) =>
          new Promise((resolve, reject) => {
            setTimeout(() => move(...args).then(resolve, reject), 750);
          });
      });

      await dragCardOnto(loggedInPage, source, target, { place: 'center' });

      // At all times after mouse-up the target contains either the temporary
      // preview or the real reactive card. The old cancel-then-render sequence
      // left it empty for the duration of a large board's Blaze flush.
      await expect(target.locator('[data-card-id]')).toHaveCount(1);
      await expect(target.locator('.card-drop-preview')).toHaveCount(1);
      await expect
        .poll(
          () => target.locator('.js-minicard:not(.card-drop-preview)').count(),
          {
            timeout: 15_000,
          },
        )
        .toBe(1);
      await expect(target.locator('.card-drop-preview')).toHaveCount(0);
    } finally {
      db.cleanup({ boardIds: [board.boardId] });
    }
  });

  test('#3826 cards that have a parent can be reordered and the new order persists', async ({
    loggedInPage,
    user,
    browserName,
  }) => {
    // The reorder logic is browser-independent; the jQuery-UI drag-sort harness
    // is validated on Chromium. Scoped to Chromium so cross-browser drag-timing
    // differences cannot flake the otherwise-green matrix.
    test.skip(
      browserName !== 'chromium',
      'drag-sort harness validated on Chromium',
    );
    // list 0 = parents, list 1 = sub-tasks (each given a parentId).
    const board = db.seedBoard({
      ownerId: user.id,
      title: 'DragSort',
      listCount: 2,
      cardTitlesPerList: [
        ['Parent P'],
        ['A Card', 'B Card', 'C Card', 'D Card'],
      ],
    });
    try {
      const parentId = db.findOne(
        'cards',
        { boardId: board.boardId, title: 'Parent P' },
        { _id: 1 },
      )._id;
      const subListId = board.listIds[1];
      db.updateMany(
        'cards',
        { boardId: board.boardId, listId: subListId },
        { $set: { parentId } },
      );

      await openBoard(loggedInPage, board.boardId, board.slug);
      await waitForMeteor(loggedInPage);
      const list = `#js-list-${subListId}`;
      await loggedInPage
        .locator(`${list} .js-minicard`)
        .first()
        .waitFor({ timeout: 30_000 });

      // Drag the last sub-task card to the front of the list.
      await dragCardOnto(
        loggedInPage,
        loggedInPage
          .locator(`${list} .js-minicard`)
          .filter({ hasText: 'D Card' })
          .first(),
        loggedInPage
          .locator(`${list} .js-minicard`)
          .filter({ hasText: 'A Card' })
          .first(),
        { place: 'before' },
      );

      // The reorder must be saved (it used to revert for parented cards).
      await expect
        .poll(async () => (await dbOrder(board.boardId, subListId))[0], {
          timeout: 15_000,
        })
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
  //
  // The drag must stay away from the lane and canvas EDGES. Within 40px of one
  // (EDGE_SIZE in imports/lib/boardAutoScroll.js) the drag's own auto-scroll
  // takes over by design and moves the lane 15px per mouse event, which is a
  // FEATURE (#443: dragging a card toward an off-screen list scrolls the board).
  // The first version of this test grabbed the first card of the first list,
  // 8 moves x 15px scrolled the lane from 120 to exactly 0, and it read that as
  // panning. Panning is 1:1 with the pointer and happens anywhere; edge
  // auto-scroll only happens at an edge - so the honest way to tell them apart
  // is to drag in the middle, where auto-scroll does not fire at all.
  test('#6558 dragging a card does not pan the lane or the board', async ({
    loggedInPage,
    user,
    browserName,
  }) => {
    test.skip(
      browserName !== 'chromium',
      'drag-sort harness validated on Chromium',
    );
    // Enough lists that the lane overflows horizontally, which is the board the
    // report is about, and cards in several of them so one can be found away
    // from the edges.
    const board = db.seedBoard({
      ownerId: user.id,
      title: 'DragNoPan',
      listCount: 12,
      cardTitlesPerList: [
        ['One', 'Two'],
        ['Three', 'Four'],
        ['Five', 'Six'],
        ['Seven', 'Eight'],
      ],
    });
    try {
      await openBoard(loggedInPage, board.boardId, board.slug);
      await waitForMeteor(loggedInPage);
      await loggedInPage
        .locator('.js-minicard')
        .first()
        .waitFor({ timeout: 30_000 });

      // Pan the lane away from its left edge first, so a pan in EITHER direction
      // during the drag is visible as a change (scrollLeft cannot go below 0).
      const startScroll = await loggedInPage.evaluate(() => {
        const lane = document.querySelector('.js-lists');
        const canvas = document.querySelector('.board-canvas');
        if (lane) lane.scrollLeft = 120;
        return {
          lane: lane ? lane.scrollLeft : null,
          canvas: canvas ? canvas.scrollTop : null,
        };
      });
      expect(startScroll.lane).toBeGreaterThan(0);

      // The safest card to grab, and how far it may be moved: everything stays
      // MARGIN px inside the lane and the canvas, so the edge auto-scroll never
      // fires and any movement of the scroll positions is panning.
      const MARGIN = 70;
      const plan = await loggedInPage.evaluate((margin) => {
        const lane = document.querySelector('.js-lists');
        const canvas = document.querySelector('.board-canvas');
        if (!lane || !canvas) return null;
        const l = lane.getBoundingClientRect();
        const c = canvas.getBoundingClientRect();
        const box = {
          left: l.left + margin,
          right: l.right - margin,
          top: Math.max(l.top, c.top) + margin,
          bottom: Math.min(l.bottom, c.bottom) - margin,
        };
        let best = null;
        for (const el of document.querySelectorAll('.js-minicard')) {
          const r = el.getBoundingClientRect();
          const x = r.left + r.width / 2;
          const y = r.top + 12;
          const room = Math.min(
            x - box.left,
            box.right - x,
            y - box.top,
            box.bottom - y,
          );
          if (room > 0 && (!best || room > best.room))
            best = { x, y, room, box };
        }
        return best;
      }, MARGIN);
      // A window too small to hold a drag that stays clear of every edge would
      // measure the auto-scroll instead of panning, and would say nothing about
      // the bug. Better skipped than misleading.
      test.skip(
        !plan || plan.room < 30,
        'no card sits far enough from the lane/canvas edges in this viewport',
      );

      // A short diagonal, entirely inside the safe box: the gesture that used to
      // drag the card and pan the lane at the same time.
      const steps = [];
      for (let i = 1; i <= 8; i++) {
        steps.push({
          x: Math.min(plan.x + i * 6, plan.box.right),
          y: Math.min(plan.y + 12 + i * 3, plan.box.bottom),
        });
      }

      await loggedInPage.mouse.move(plan.x, plan.y);
      await loggedInPage.mouse.down();
      // Past jQuery UI's 7px distance threshold first.
      await loggedInPage.mouse.move(plan.x, plan.y + 12, { steps: 4 });
      for (const s of steps) {
        await loggedInPage.mouse.move(s.x, s.y, { steps: 2 });
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
