'use strict';

// #6872: a requester or assigner picked with the opened card's + button is
// stored as a user id in card.requesters / card.assigners. The minicard only
// drew the free-text requestedBy / assignedBy, so a picked member never showed
// there although "Show on Minicard" was on. It shows as an avatar now, and a
// typed name still shows beside it. tests/minicardRequestedAssignedBy6872.test.cjs
// pins the template; this drives it.

const { test, expect } = require('../fixtures');
const db = require('../helpers/db');

test.describe('#6872 Requested by / Assigned by on the minicard', () => {
  test('a picked member and a typed name both show', async ({ boardPage, board, user }) => {
    const alpha = db.findOne('cards', { boardId: board.boardId, title: 'Alpha Card' });
    db.updateOne('boards', { _id: board.boardId }, {
      $set: { allowsRequestedBy: true, allowsRequestedByOnMinicard: true,
        allowsAssignedBy: true, allowsAssignedByOnMinicard: true },
    });
    db.updateOne('cards', { _id: alpha._id }, {
      $set: { requesters: [user.id], requestedBy: '', assigners: [], assignedBy: 'Customer X' },
    });
    await boardPage.reload({ waitUntil: 'domcontentloaded' });

    const card = boardPage.locator('.js-minicard').filter({ hasText: 'Alpha Card' }).first();
    await expect(card).toBeVisible();
    // Only a picked member, no free text: this is the case that showed nothing.
    await expect(card.locator('.minicard-requested-by .fa-shopping-cart')).toBeVisible();
    await expect(card.locator('.minicard-requested-by .member')).toHaveCount(1);
    // Only free text: still shown, with Assigned by's own icon.
    await expect(card.locator('.minicard-assigned-by')).toContainText('Customer X');
    await expect(card.locator('.minicard-assigned-by .fa-user-plus')).toBeVisible();
  });

  test('negative: nothing picked and nothing typed draws no line', async ({ boardPage, board }) => {
    const alpha = db.findOne('cards', { boardId: board.boardId, title: 'Alpha Card' });
    db.updateOne('cards', { _id: alpha._id }, {
      $set: { requesters: [], requestedBy: '', assigners: [], assignedBy: '' },
    });
    await boardPage.reload({ waitUntil: 'domcontentloaded' });

    const card = boardPage.locator('.js-minicard').filter({ hasText: 'Alpha Card' }).first();
    await expect(card).toBeVisible();
    await expect(card.locator('.minicard-requested-by')).toHaveCount(0);
    await expect(card.locator('.minicard-assigned-by')).toHaveCount(0);
  });

  test('Show on Minicard off hides a picked member', async ({ boardPage, board, user }) => {
    const alpha = db.findOne('cards', { boardId: board.boardId, title: 'Alpha Card' });
    db.updateOne('boards', { _id: board.boardId }, { $set: { allowsRequestedByOnMinicard: false } });
    db.updateOne('cards', { _id: alpha._id }, { $set: { requesters: [user.id] } });
    await boardPage.reload({ waitUntil: 'domcontentloaded' });

    const card = boardPage.locator('.js-minicard').filter({ hasText: 'Alpha Card' }).first();
    await expect(card).toBeVisible();
    await expect(card.locator('.minicard-requested-by')).toHaveCount(0);
  });
});
