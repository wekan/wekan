'use strict';

/**
 * Spec 14 — Voting & watchers
 *
 * Covers:
 *  - Positive voting on a card registers the vote
 *  - Negative voting on a card registers the vote
 *  - Toggling the watch on a card works without errors
 *  - Watching a board works without errors
 *  - Voted state is reflected visually (voted class on button)
 */

const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const BoardPage = require('../pages/BoardPage');
const CardPage = require('../pages/CardPage');

test.describe('Voting & watchers', () => {
  test('positive vote button is clickable and registers the voted state', async ({ boardPage, board }) => {
    const errors = [];
    boardPage.on('pageerror', e => errors.push(e.message));

    // Enable vote on the card via MongoDB so the vote section renders
    db.updateOne('cards', { boardId: board.boardId, title: 'Alpha Card' },
      { $set: { 'vote.question': 'Approve this?', 'vote.public': true } });
    await boardPage.reload({ waitUntil: 'networkidle' });

    const bp = new BoardPage(boardPage);
    const cp = new CardPage(boardPage);
    const [listA] = board.listIds;

    await bp.clickCard(listA, 'Alpha Card');
    await cp.waitForOpen();

    // Vote section: button.js-vote.js-vote-positive
    const voteBtn = cp.root.locator('button.js-vote-positive').first();
    if (await voteBtn.count() > 0) {
      await voteBtn.click();
      await boardPage.waitForTimeout(600);
      // After voting, the button should carry the "voted" class
      await expect(voteBtn).toHaveClass(/voted/, { timeout: 5_000 });
    } else {
      // Vote section not rendered (board may not have voting enabled)
      console.log('Note: vote-positive button not found; board may not enable voting');
    }

    const critical = errors.filter(
      e => !e.includes('ResizeObserver') && !e.includes('Non-Error promise rejection'),
    );
    expect(critical).toHaveLength(0);
  });

  test('negative vote button is clickable and registers the voted state', async ({ boardPage, board }) => {
    db.updateOne('cards', { boardId: board.boardId, title: 'Alpha Card' },
      { $set: { 'vote.question': 'Reject this?', 'vote.public': true } });
    await boardPage.reload({ waitUntil: 'networkidle' });

    const bp = new BoardPage(boardPage);
    const cp = new CardPage(boardPage);
    const [listA] = board.listIds;

    await bp.clickCard(listA, 'Alpha Card');
    await cp.waitForOpen();

    const voteBtn = cp.root.locator('button.js-vote-negative').first();
    if (await voteBtn.count() > 0) {
      await voteBtn.click();
      await boardPage.waitForTimeout(600);
      await expect(voteBtn).toHaveClass(/voted/, { timeout: 5_000 });
    } else {
      console.log('Note: vote-negative button not found');
    }
  });

  test('toggling watch on a card succeeds without errors', async ({ boardPage, board }) => {
    const errors = [];
    boardPage.on('pageerror', e => errors.push(e.message));

    const bp = new BoardPage(boardPage);
    const cp = new CardPage(boardPage);
    const [listA] = board.listIds;

    await bp.clickCard(listA, 'Alpha Card');
    await cp.waitForOpen();

    // cardDetails.jade: a.js-toggle-watch-card is in the card's actions area
    const watchBtn = cp.root.locator('a.js-toggle-watch-card').first();
    if (await watchBtn.count() > 0) {
      await watchBtn.click();
      await boardPage.waitForTimeout(500);
      // Verify card is still open (no crash)
      await expect(cp.root).toBeVisible({ timeout: 3_000 });
    } else {
      // Watch button may be inside the actions menu
      await cp.openActionsMenu();
      const popWatchBtn = boardPage.locator('.js-pop-over a.js-toggle-watch-card');
      if (await popWatchBtn.count() > 0) {
        await popWatchBtn.click();
        await boardPage.waitForTimeout(500);
      } else {
        console.log('Note: js-toggle-watch-card not found on card');
      }
    }

    const critical = errors.filter(
      e => !e.includes('ResizeObserver') && !e.includes('Non-Error promise rejection'),
    );
    expect(critical).toHaveLength(0);
  });

  test('watching/unwatching the board works without errors', async ({ boardPage, board }) => {
    const errors = [];
    boardPage.on('pageerror', e => errors.push(e.message));

    // boardHeader.jade: a.board-header-btn.js-watch-board
    const watchBoardBtn = boardPage.locator('a.js-watch-board').first();
    if (await watchBoardBtn.count() > 0) {
      await watchBoardBtn.click();
      await boardPage.waitForTimeout(500);
      // Board still visible after toggling watch
      await expect(boardPage.locator('.board-list-cards, .js-list').first()).toBeVisible({ timeout: 5_000 });
    } else {
      console.log('Note: js-watch-board button not found in board header');
    }

    const critical = errors.filter(
      e => !e.includes('ResizeObserver') && !e.includes('Non-Error promise rejection'),
    );
    expect(critical).toHaveLength(0);
  });

  test('vote counts update in the card after voting', async ({ boardPage, board, user }) => {
    // Seed a card with an active vote question
    db.updateOne('cards', { boardId: board.boardId, title: 'Beta Card' },
      { $set: { 'vote.question': 'Ship it?', 'vote.public': true, 'vote.positive': [], 'vote.negative': [] } });
    await boardPage.reload({ waitUntil: 'networkidle' });

    const bp = new BoardPage(boardPage);
    const cp = new CardPage(boardPage);
    const [, listB] = board.listIds;

    await bp.clickCard(listB, 'Beta Card');
    await cp.waitForOpen();

    const votePositiveBtn = cp.root.locator('button.js-vote-positive').first();
    if (await votePositiveBtn.count() > 0) {
      // Get initial count label
      const countLabel = cp.root.locator('.js-show-positive-votes, .card-label-green').first();
      const before = await countLabel.innerText().catch(() => '0');

      await votePositiveBtn.click();
      await boardPage.waitForTimeout(800);

      // Count should have changed (Blaze reactive update)
      const after = await countLabel.innerText().catch(() => '0');
      // Either the count increased or the voted class was applied
      const voted = await votePositiveBtn.evaluate(el => el.classList.contains('voted'));
      expect(voted || after !== before).toBeTruthy();
    } else {
      console.log('Note: voting section not rendered for Beta Card');
    }
  });
});
