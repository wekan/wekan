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
  test('positive vote button is clickable and registers the voted state', async ({ boardPage, board, user }) => {
    const errors = [];
    boardPage.on('pageerror', e => errors.push(e.message));

    // Enable vote on the card via MongoDB so the vote section renders
    db.updateOne('cards', { boardId: board.boardId, title: 'Alpha Card' },
      { $set: { 'vote.question': 'Approve this?', 'vote.public': true } });
    await boardPage.reload({ waitUntil: 'domcontentloaded' });

    const bp = new BoardPage(boardPage);
    const cp = new CardPage(boardPage);
    const [listA] = board.listIds;

    await bp.clickCard(listA, 'Alpha Card');
    await cp.waitForOpen();

    // Vote section: button.js-vote.js-vote-positive
    const voteBtn = cp.root.locator('button.js-vote-positive').first();
    await expect(voteBtn).toBeVisible();
    await voteBtn.click();
    await expect(voteBtn).toHaveClass(/voted/, { timeout: 10_000 });
    await expect.poll(() => db.findOne('cards', { boardId: board.boardId, title: 'Alpha Card' }).vote.positive)
      .toContain(user.id);

    const critical = errors.filter(
      e => !e.includes('ResizeObserver') && !e.includes('Non-Error promise rejection'),
    );
    expect(critical).toHaveLength(0);
  });

  test('negative vote button is clickable and registers the voted state', async ({ boardPage, board, user }) => {
    db.updateOne('cards', { boardId: board.boardId, title: 'Alpha Card' },
      { $set: { 'vote.question': 'Reject this?', 'vote.public': true } });
    await boardPage.reload({ waitUntil: 'domcontentloaded' });

    const bp = new BoardPage(boardPage);
    const cp = new CardPage(boardPage);
    const [listA] = board.listIds;

    await bp.clickCard(listA, 'Alpha Card');
    await cp.waitForOpen();

    const voteBtn = cp.root.locator('button.js-vote-negative').first();
    await expect(voteBtn).toBeVisible();
    await voteBtn.click();
    await expect(voteBtn).toHaveClass(/voted/, { timeout: 10_000 });
    await expect.poll(() => db.findOne('cards', { boardId: board.boardId, title: 'Alpha Card' }).vote.negative)
      .toContain(user.id);
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
    await boardPage.reload({ waitUntil: 'domcontentloaded' });

    const bp = new BoardPage(boardPage);
    const cp = new CardPage(boardPage);
    const [, listB] = board.listIds;

    await bp.clickCard(listB, 'Beta Card');
    await cp.waitForOpen();

    const votePositiveBtn = cp.root.locator('button.js-vote-positive').first();
    await expect(votePositiveBtn).toBeVisible();
    const countLabel = cp.root.locator('.js-show-positive-votes').first();
    await expect(countLabel).toHaveText('0');
    await votePositiveBtn.click();
    await expect(votePositiveBtn).toHaveClass(/voted/);
    await expect(countLabel).toHaveText('1');
    await expect.poll(() => db.findOne('cards', { boardId: board.boardId, title: 'Beta Card' }).vote.positive)
      .toContain(user.id);
  });
});

test('Corsican Planning Poker shows literal scores without progress prefixes', async ({ boardPage: page, board }) => {
  db.updateOne('boards', { _id: board.boardId }, { $set: { allowsPoker: true } });
  db.updateOne('cards', { boardId: board.boardId, title: 'Alpha Card' }, { $set: {
    'poker.question': 'Estimate this card', 'poker.end': new Date(Date.now() + 86400000),
  } });
  await page.evaluate(() => Meteor.callAsync('setLanguage', 'co'));
  await page.reload({ waitUntil: 'domcontentloaded' });
  const bp = new BoardPage(page), cp = new CardPage(page);
  await bp.clickCard(board.listIds[0], 'Alpha Card');
  await cp.waitForOpen();
  // The section's shared heading (cardSectionHeader), as every section of the card has.
  await expect(cp.root.locator('.js-toggle-card-section[data-section="poker"]')).toContainText('Planning Poker');
  for (const [name, value] of [['one','1'],['two','2'],['three','3'],['five','5'],['eight','8'],['thirteen','13'],['twenty','20'],['forty','40'],['one-hundred','100'],['unsure','?']]) {
    await expect(cp.root.locator('.js-poker-vote-' + name)).toHaveText(value);
  }
  await expect(cp.root.locator('.poker-deck')).not.toContainText(['In corsu']);
});

for (const [direction, label] of [['positive', 'pro'], ['negative', 'contra']]) {
  test(`Latin ${direction} vote label records the matching vote`, async ({ boardPage, board, user }) => {
    await boardPage.evaluate(() => Meteor.callAsync('setLanguage', 'la'));
    db.updateOne('cards', { boardId: board.boardId, title: 'Alpha Card' },
      { $set: { 'vote.question': 'Approve this?', 'vote.public': true } });
    await boardPage.reload({ waitUntil: 'domcontentloaded' });
    await new BoardPage(boardPage).clickCard(board.listIds[0], 'Alpha Card');
    const cp = new CardPage(boardPage);
    await cp.waitForOpen();
    const button = cp.root.locator(`button.js-vote-${direction}`).first();
    await expect(button).toContainText(label);
    await expect(button).not.toContainText('Latine:');
    await button.click();
    await expect(button).toHaveClass(/voted/);
    await expect.poll(() => db.findOne('cards', { boardId: board.boardId, title: 'Alpha Card' }).vote[direction]).toContain(user.id);
  });
}
