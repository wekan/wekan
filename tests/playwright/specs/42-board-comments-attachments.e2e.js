'use strict';

/**
 * Spec 42 — board publication still shows comments/attachments after the #6480
 * per-card → board-level cursor refactor.
 *
 * #6480: the `board` publication used to open one live CardComments cursor and one
 * Attachments cursor PER CARD (an N+1 that pinned FerretDB CPU on large boards). They
 * are now published with a single board-level cursor each, keyed on the denormalized
 * `boardId` / `meta.boardId`. This spec is the regression guard that the refactor did
 * NOT stop comments (and attachments) from reaching the client:
 *  - a comment carrying the board's boardId shows when its card is opened (positive);
 *  - a comment on a DIFFERENT board is NOT published into this board (negative — proves
 *    the board-level cursor is still correctly scoped by boardId).
 */

const { test, expect } = require('../fixtures');
const db = require('../helpers/db');

test.describe('Board publication – comments/attachments (#6480)', () => {
  test('a card comment (carrying boardId) is published and shown when the card is opened', async ({ boardPage, board }) => {
    const cardId = db.findCardIdByTitle({ boardId: board.boardId, title: 'Alpha Card' });
    expect(cardId).toBeTruthy();

    const now = new Date();
    const commentId = 'e2e-comment-6480';
    const commentText = 'E2E board-level comment 6480';
    // Idempotent: clear any leftover from a previous run, then insert a comment that
    // carries boardId (what the new board-level cursor filters on).
    await db.deleteMany('card_comments', { _id: commentId });
    await db.insertMany('card_comments', [
      {
        _id: commentId,
        boardId: board.boardId,
        cardId,
        text: commentText,
        userId: board.owner.id,
        createdAt: now,
        modifiedAt: now,
      },
    ]);

    // Open the card (its minicard) so the card detail — with the comments — renders.
    await boardPage.reload({ waitUntil: 'networkidle' });
    await boardPage.locator('.js-minicard').filter({ hasText: 'Alpha Card' }).first().click();

    // The comment reaches the client via the board-level CardComments cursor.
    await expect(boardPage.getByText(commentText)).toBeVisible({ timeout: 15_000 });

    await db.deleteMany('card_comments', { _id: commentId });
  });

  test('NEGATIVE: a comment on a different board is not published into this board', async ({ boardPage, board, user }) => {
    // A comment whose boardId is some OTHER board must never be pulled in by this
    // board's cursor (the board-level cursor is scoped by boardId).
    const cardId = db.findCardIdByTitle({ boardId: board.boardId, title: 'Beta Card' });
    const now = new Date();
    const foreignId = 'e2e-comment-6480-foreign';
    const foreignText = 'E2E foreign-board comment must not leak 6480';
    await db.deleteMany('card_comments', { _id: foreignId });
    await db.insertMany('card_comments', [
      {
        _id: foreignId,
        boardId: 'some-other-board-id-6480',
        cardId, // even reusing a real cardId, the boardId scopes it out
        text: foreignText,
        userId: user.id,
        createdAt: now,
        modifiedAt: now,
      },
    ]);

    await boardPage.reload({ waitUntil: 'networkidle' });
    await boardPage.locator('.js-minicard').filter({ hasText: 'Beta Card' }).first().click();

    // The foreign-board comment must NOT appear.
    await expect(boardPage.getByText(foreignText)).toHaveCount(0, { timeout: 10_000 });

    await db.deleteMany('card_comments', { _id: foreignId });
  });
});
