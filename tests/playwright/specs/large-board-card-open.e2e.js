'use strict';

/**
 * #6745: on a large board, opening or closing a card took seconds.
 *
 * Two causes are measured here in the running app:
 *  - opening a card writes the user document (profile.cardLastViews), and the
 *    board view (Utils.boardView, allowBoardView) and the helpers of every
 *    minicard read the whole user document, so one open re-ran every list's card
 *    loop and every minicard. Counted with Tracker: 37,452 invalidations for 40
 *    minicards before, a few hundred now.
 *  - opening a card by its address (a link, the up/down keys, back/forward)
 *    and closing it again re-created the whole board. A minicard element is
 *    marked before and must still be the same element afterwards.
 *
 * tests/largeBoardCardOpen.test.cjs pins the same fixes in the source.
 */

const { test, expect } = require('@playwright/test');
const db = require('../helpers/db');
const { loginWithToken, openBoard } = require('../helpers/auth');
const BoardPage = require('../pages/BoardPage');
const CardPage = require('../pages/CardPage');

const LISTS = 4;
const CARDS_PER_LIST = 40;
const BUDGET_PER_MINICARD = 25;

function titlesFor(list) {
  return Array.from({ length: CARDS_PER_LIST }, (_, i) => `Card ${list}-${i + 1}`);
}

// Count Tracker invalidations from now on (each computation counted once per
// flush). A computation being STOPPED also invalidates itself; closing the card
// details tears its whole panel down that way, a fixed cost whatever the board
// size, so stops are not counted - re-running minicards is a data change.
async function startCountingInvalidations(page) {
  await page.evaluate(() => {
    const { Tracker } = Package.tracker;
    if (!window.__wekan6745Patched) {
      const invalidate = Tracker.Computation.prototype.invalidate;
      const stop = Tracker.Computation.prototype.stop;
      let stopping = 0;
      Tracker.Computation.prototype.stop = function countedStop(...args) {
        stopping += 1;
        try { return stop.apply(this, args); } finally { stopping -= 1; }
      };
      Tracker.Computation.prototype.invalidate = function countedInvalidate(...args) {
        if (!this.invalidated && stopping === 0) window.__wekan6745Invalidations += 1;
        return invalidate.apply(this, args);
      };
      window.__wekan6745Patched = true;
    }
    window.__wekan6745Invalidations = 0;
  });
}

async function invalidationsSoFar(page) {
  return page.evaluate(() => window.__wekan6745Invalidations);
}

// Let the client finish the server round trip of the user write.
async function settle(page) {
  await page.waitForTimeout(1500);
  await page.evaluate(() => new Promise(resolve => Package.tracker.Tracker.afterFlush(resolve)));
}

test.describe('#6745 large board: opening and closing a card', () => {
  let user;
  let board;
  let otherBoard;

  test.beforeEach(async ({ page }) => {
    user = db.seedUser();
    board = db.seedBoard({
      ownerId: user.id,
      listCount: LISTS,
      cardTitlesPerList: Array.from({ length: LISTS }, (_, i) => titlesFor(i + 1)),
    });
    otherBoard = db.seedBoard({ ownerId: user.id, cardTitlesPerList: [['Elsewhere Card']] });
    await loginWithToken(page, user.id, user.token);
    await openBoard(page, board.boardId, board.slug);
    await expect(page.locator('.js-minicard').first()).toBeVisible({ timeout: 20_000 });
    await settle(page);
  });

  test.afterEach(() => {
    db.cleanup({ boardIds: [board.boardId, otherBoard.boardId], userIds: [user.id] });
  });

  test('a click open or close does not re-run every minicard', async ({ page }) => {
    const minicards = await page.locator('.js-minicard').count();
    expect(minicards).toBeGreaterThanOrEqual(LISTS * 10);

    await startCountingInvalidations(page);
    await new BoardPage(page).clickCard(board.listIds[1], 'Card 2-3');
    await new CardPage(page).waitForOpen();
    await settle(page);
    const onOpen = await invalidationsSoFar(page);

    // The open was recorded - and as this card's own entry.
    const stored = db.findOne('users', { _id: user.id }, { 'profile.cardLastViews': 1 });
    const cardId = db.findCardIdByTitle({ boardId: board.boardId, title: 'Card 2-3' });
    expect(stored.profile.cardLastViews[cardId]).toBeTruthy();

    // Before #6745 a card open re-ran every list's card loop (Utils.boardView()
    // and allowBoardView() read the whole user, which the open writes), and Blaze
    // then re-evaluated every minicard: about 900 invalidations PER minicard
    // (37,452 for 40). Now it is the card details' own setup, a fixed few
    // hundred. 25 per minicard is far below the old cost and above the new one.
    expect(onOpen, `${onOpen} invalidations for ${minicards} minicards`).toBeLessThan(minicards * BUDGET_PER_MINICARD);

    await startCountingInvalidations(page);
    await new CardPage(page).close();
    await settle(page);
    const onClose = await invalidationsSoFar(page);
    expect(onClose, `${onClose} invalidations for ${minicards} minicards`).toBeLessThan(minicards * BUDGET_PER_MINICARD);
  });

  test('opening and closing a card by its address keeps the board on screen', async ({ page }) => {
    const marked = page.locator('.js-minicard').first();
    await marked.evaluate(element => { element.dataset.e2eMark6745 = 'kept'; });
    const cardId = db.findCardIdByTitle({ boardId: board.boardId, title: 'Card 3-2' });

    await page.evaluate(({ boardId, slug, id }) => {
      Package['ostrio:flow-router-extra'].FlowRouter.go('card', { boardId, slug, cardId: id });
    }, { boardId: board.boardId, slug: board.slug, id: cardId });
    await new CardPage(page).waitForOpen();
    await expect(page.locator('[data-e2e-mark6745="kept"]')).toHaveCount(1);

    // Closing a card opened by its address navigates back to the board route.
    await new CardPage(page).close();
    await expect(page).toHaveURL(new RegExp(`/b/${board.boardId}/${board.slug}$`));
    await expect(page.locator('[data-e2e-mark6745="kept"]')).toHaveCount(1);
  });

  test('a card on ANOTHER board still renders that board (negative)', async ({ page }) => {
    await page.locator('.js-minicard').first().evaluate(element => { element.dataset.e2eMark6745 = 'kept'; });
    const cardId = db.findCardIdByTitle({ boardId: otherBoard.boardId, title: 'Elsewhere Card' });

    await page.evaluate(({ boardId, slug, id }) => {
      Package['ostrio:flow-router-extra'].FlowRouter.go('card', { boardId, slug, cardId: id });
    }, { boardId: otherBoard.boardId, slug: otherBoard.slug, id: cardId });
    await new CardPage(page).waitForOpen();
    await expect(page.locator('.js-minicard', { hasText: 'Elsewhere Card' })).toBeVisible();
    await expect(page.locator('[data-e2e-mark6745="kept"]')).toHaveCount(0);
  });
});
