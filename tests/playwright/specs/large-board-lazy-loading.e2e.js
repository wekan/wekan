'use strict';

/**
 * #6745: a large board loads only what is visible, and opening / closing a
 * card stays fast however many minicards are on screen.
 *
 * Measured in the running app on a 4,000-card board (FerretDB, SQLite):
 *  - closing a card took ~4 s: each stopped helper ran DataCache.checkStop(),
 *    which asked Tracker for hasDependents() - a for-in over every dependent of
 *    values such as the current board, thousands of them. ~0.1 s now.
 *  - a card open re-ran ~7,700 computations (every avatar, every comment and
 *    checklist badge of every minicard); ~1,000 now.
 *  - every lazy window shipped every comment's full text, and the board shipped
 *    every comment reaction of the board, to show minicard badges.
 *
 * tests/largeBoardDataLoading.test.cjs pins the same fixes in the source.
 */

const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const { openLazyBoard } = require('../helpers/lazyBoard');

const LISTS = 3;
const CARDS_PER_LIST = 40;
const CLOSE_BUDGET_MS = 1500;
const BUDGET_PER_MINICARD = 25;

function seedChildren(board, ownerId) {
  const cards = db.find('cards', { boardId: board.boardId }, { _id: 1, listId: 1 });
  const now = new Date();
  const comments = [];
  const reactions = [];
  const checklists = [];
  const items = [];
  for (const card of cards) {
    const commentId = db.uid('cmt');
    comments.push({
      _id: commentId, boardId: board.boardId, cardId: card._id, userId: ownerId,
      text: `Long comment text of ${card._id} `.repeat(20), createdAt: now, modifiedAt: now,
    });
    reactions.push({
      _id: db.uid('rct'), boardId: board.boardId, cardId: card._id, cardCommentId: commentId,
      reactions: [{ reactionCodepoint: '&#128077;', userIds: [ownerId] }],
    });
    const checklistId = db.uid('cl');
    checklists.push({ _id: checklistId, boardId: board.boardId, cardId: card._id, title: 'Checklist',
      sort: 0, createdAt: now, modifiedAt: now });
    items.push({ _id: db.uid('cli'), boardId: board.boardId, cardId: card._id, checklistId,
      title: 'Item', sort: 0, isFinished: false, createdAt: now, modifiedAt: now });
  }
  db.insertMany('card_comments', comments);
  db.insertMany('card_comment_reactions', reactions);
  db.insertMany('checklists', checklists);
  db.insertMany('checklistItems', items);
  return cards.map(card => card._id);
}

function cleanupChildren(boardId) {
  for (const collection of ['card_comments', 'card_comment_reactions', 'checklists', 'checklistItems']) {
    db.deleteMany(collection, { boardId });
  }
}

const count = (page, collection, selector = {}) => page.evaluate(
  ({ name, sel }) => Meteor.connection._stores[name]?._getCollection().find(sel).count() || 0,
  { name: collection, sel: selector },
);

async function startCountingInvalidations(page) {
  await page.evaluate(() => {
    const { Tracker } = Package.tracker;
    if (!window.__wekanLazyPatched) {
      const invalidate = Tracker.Computation.prototype.invalidate;
      const stop = Tracker.Computation.prototype.stop;
      let stopping = 0;
      Tracker.Computation.prototype.stop = function countedStop(...args) {
        stopping += 1;
        try { return stop.apply(this, args); } finally { stopping -= 1; }
      };
      Tracker.Computation.prototype.invalidate = function countedInvalidate(...args) {
        if (!this.invalidated && stopping === 0) window.__wekanLazyInvalidations += 1;
        return invalidate.apply(this, args);
      };
      window.__wekanLazyPatched = true;
    }
    window.__wekanLazyInvalidations = 0;
  });
}

test.describe('#6745 large board: load only what is visible', () => {
  let board;
  let cardIds;

  test.beforeEach(async ({ loggedInPage: page, user }) => {
    test.setTimeout(180_000);
    board = db.seedBoard({
      ownerId: user.id,
      listCount: LISTS,
      cardTitlesPerList: Array.from({ length: LISTS }, (_, l) =>
        Array.from({ length: CARDS_PER_LIST }, (_, i) => `Card ${l + 1}-${i + 1}`)),
    });
    cardIds = seedChildren(board, user.id);
    await openLazyBoard(page, board);
    await expect(page.locator('.js-minicard').first()).toBeVisible({ timeout: 30_000 });
  });

  test.afterEach(() => {
    cleanupChildren(board.boardId);
    db.cleanup({ boardIds: [board.boardId] });
  });

  test('the board sends a window of cards and no comment text or reactions', async ({ loggedInPage: page }) => {
    // Every list shows its first window, not all of its cards.
    await expect.poll(() => count(page, 'cards', { boardId: board.boardId })).toBeGreaterThan(0);
    const cards = await count(page, 'cards', { boardId: board.boardId });
    expect(cards).toBeLessThan(cardIds.length);

    // The comments of the window's cards are there - the count and unread
    // badges need them - but not their text.
    await expect.poll(() => count(page, 'card_comments', { boardId: board.boardId })).toBeGreaterThan(0);
    expect(await count(page, 'card_comments', { boardId: board.boardId, text: { $exists: true } })).toBe(0);
    // Reactions are shown only under an open card's comments.
    expect(await count(page, 'card_comment_reactions', { boardId: board.boardId })).toBe(0);
  });

  test('an opened card gets its comments with text and its reactions, and closes fast', async ({ loggedInPage: page }) => {
    const minicard = page.locator(`#js-list-${board.listIds[1]} .js-minicard`, { hasText: 'Card 2-3' });
    await minicard.waitFor({ state: 'visible', timeout: 20_000 });
    const cardId = db.findCardIdByTitle({ boardId: board.boardId, title: 'Card 2-3' });
    const minicards = await page.locator('.js-minicard').count();

    await startCountingInvalidations(page);
    await minicard.evaluate(element => element.click());
    await page.locator('.board-wrapper > .js-card-details, .js-card-details').first().waitFor({ state: 'visible' });
    await expect.poll(() => count(page, 'card_comments', { cardId, text: { $exists: true } })).toBe(1);
    await expect.poll(() => count(page, 'card_comment_reactions', { cardId })).toBe(1);
    // Only THIS card's: the rest of the board stays without text and reactions.
    expect(await count(page, 'card_comments', { cardId: { $ne: cardId }, text: { $exists: true } })).toBe(0);
    expect(await count(page, 'card_comment_reactions', { cardId: { $ne: cardId } })).toBe(0);
    const onOpen = await page.evaluate(() => window.__wekanLazyInvalidations);
    expect(onOpen, `${onOpen} invalidations for ${minicards} minicards`).toBeLessThan(minicards * BUDGET_PER_MINICARD);

    await startCountingInvalidations(page);
    const started = Date.now();
    await page.locator('.js-close-card-details').first().click();
    await page.locator('.js-card-details').first().waitFor({ state: 'hidden', timeout: 30_000 });
    const closeMs = Date.now() - started;
    expect(closeMs, `closing the card took ${closeMs} ms`).toBeLessThan(CLOSE_BUDGET_MS);
    // The opened card's comment text leaves with the card.
    await expect.poll(() => count(page, 'card_comments', { text: { $exists: true } })).toBe(0);
  });

  test('a card edited or moved elsewhere still updates the window (negative)', async ({ loggedInPage: page }) => {
    const list = page.locator(`#js-list-${board.listIds[0]}`);
    await expect(list.locator('.js-minicard', { hasText: 'Card 1-2' })).toBeVisible({ timeout: 20_000 });

    // A field the membership observer no longer watches (the title) still
    // reaches the minicard: the window watches its own cards' every field.
    db.updateOne('cards', { boardId: board.boardId, title: 'Card 1-2' }, { $set: { title: 'Renamed outside' } });
    await expect(list.locator('.js-minicard', { hasText: 'Renamed outside' })).toBeVisible({ timeout: 20_000 });

    // A card moved to another list leaves this list's window.
    db.updateOne('cards', { boardId: board.boardId, title: 'Card 1-3' }, { $set: { listId: board.listIds[2] } });
    await expect(list.locator('.js-minicard', { hasText: 'Card 1-3' })).toHaveCount(0, { timeout: 20_000 });
  });
});
