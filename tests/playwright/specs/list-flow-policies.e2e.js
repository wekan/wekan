'use strict';

// The Kanban flow policies of a board's lists (docs/Features/Lists/Flow-Policies.md):
// a list's policy at its header and in its menu, the commitment point's flag,
// the WIP limit per person in the opened card - each off until the board turns
// it on, and hidden again by Admin Panel / Features.

const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const BoardPage = require('../pages/BoardPage');
const CardPage = require('../pages/CardPage');

const featureStates = () => (db.findOne('settings', {}, { featureStates: 1 }) || {}).featureStates;
const restoreFeatures = saved => (saved
  ? db.updateOne('settings', {}, { $set: { featureStates: saved } })
  : db.updateOne('settings', {}, { $unset: { featureStates: 1 } }));

test.describe('List flow policies', () => {
  test('a list policy shows at the header only when the board and the instance show them', async ({ boardPage, board }) => {
    const saved = featureStates();
    db.updateOne('lists', { _id: board.listIds[0] }, { $set: { policy: 'In: has an owner. Out: reviewed.' } });
    const bp = new BoardPage(boardPage);
    const mark = bp.list(board.listIds[0]).locator('.js-open-list-policy');
    await expect(bp.list(board.listIds[0])).toBeVisible({ timeout: 15_000 });
    // Negative: off until the board turns it on.
    await expect(mark).toHaveCount(0);

    db.updateOne('boards', { _id: board.boardId }, { $set: { allowsListPolicies: true } });
    await expect(mark).toHaveAttribute('title', /has an owner/, { timeout: 15_000 });
    // A list with no policy has no mark.
    await expect(bp.list(board.listIds[1]).locator('.js-open-list-policy')).toHaveCount(0);

    db.updateOne('settings', {}, { $set: { 'featureStates.list-policies': false } });
    await expect(mark).toHaveCount(0, { timeout: 15_000 });
    restoreFeatures(saved);
    await expect(mark).toBeVisible({ timeout: 15_000 });
  });

  test('a list policy is written from the list menu', async ({ boardPage, board }) => {
    db.updateOne('boards', { _id: board.boardId }, { $set: { allowsListPolicies: true } });
    const bp = new BoardPage(boardPage);
    await bp.openListMenu(board.listIds[1]);
    await boardPage.locator('.js-pop-over .js-list-policy').click();
    await boardPage.locator('.js-pop-over .js-list-policy-text').fill('Out: tested on a phone');
    await boardPage.locator('.js-pop-over .js-list-policy-form input[type="submit"]').click();
    await expect.poll(() => (db.findOne('lists', { _id: board.listIds[1] }) || {}).policy, { timeout: 15_000 })
      .toBe('Out: tested on a phone');
    await expect(bp.list(board.listIds[1]).locator('.js-open-list-policy')).toBeVisible({ timeout: 15_000 });
  });

  test('the commitment point is flagged, and the WIP limit per person warns in the opened card', async ({ boardPage, board, user }) => {
    db.updateOne('boards', { _id: board.boardId }, { $set: { commitmentListId: board.listIds[1], personWipLimit: 1 } });
    const bp = new BoardPage(boardPage);
    await expect(bp.list(board.listIds[1]).locator('.list-commitment-mark')).toBeVisible({ timeout: 15_000 });
    await expect(bp.list(board.listIds[0]).locator('.list-commitment-mark')).toHaveCount(0);

    for (const title of ['Alpha Card', 'Beta Card']) {
      const card = db.findOne('cards', { boardId: board.boardId, title });
      db.updateOne('cards', { _id: card._id }, { $set: { assignees: [user.id] } });
    }
    const cp = new CardPage(boardPage);
    await bp.clickCard(board.listIds[0], 'Alpha Card');
    await cp.waitForOpen();
    await expect(cp.root.locator('.js-card-person-wip-over')).toContainText('2', { timeout: 15_000 });

    // Negative: a limit nobody is over warns about nobody.
    db.updateOne('boards', { _id: board.boardId }, { $set: { personWipLimit: 5 } });
    await expect(cp.root.locator('.js-card-person-wip-over')).toHaveCount(0, { timeout: 15_000 });
  });

  test('a split list marks a card Done here and counts both halves', async ({ boardPage, board }) => {
    const saved = featureStates();
    const listId = board.listIds[0];
    const bp = new BoardPage(boardPage);
    const mini = bp.minicard(listId, 'Alpha Card');
    await expect(mini).toBeVisible({ timeout: 15_000 });
    // Negative: nothing until the board allows split lists and the list is split.
    await expect(mini.locator('.js-minicard-split-done')).toHaveCount(0);
    try {
      db.updateOne('boards', { _id: board.boardId }, { $set: { allowsSplitLists: true } });
      db.updateOne('lists', { _id: listId }, { $set: { split: true } });
      await mini.locator('.js-minicard-split-done').click({ timeout: 15_000 });
      await expect.poll(() => ((db.findOne('cards', { boardId: board.boardId, title: 'Alpha Card' }) || {}).flow || {}).splitDoneListId,
        { timeout: 15_000 }).toBe(listId);
      await expect(mini.locator('.minicard')).toHaveClass(/minicard-split-done/, { timeout: 15_000 });
      await expect(bp.list(listId).locator('.list-split-counts')).toContainText('0', { timeout: 15_000 });
      await expect(bp.list(listId).locator('.list-split-counts')).toContainText('1');

      db.updateOne('settings', {}, { $set: { 'featureStates.split-lists': false } });
      await expect(mini.locator('.js-minicard-split-done')).toHaveCount(0, { timeout: 15_000 });
      await expect(mini.locator('.minicard')).not.toHaveClass(/minicard-split-done/);
    } finally {
      restoreFeatures(saved);
    }
  });
});
