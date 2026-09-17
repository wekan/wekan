'use strict';
const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const BoardPage = require('../pages/BoardPage');
const CardPage = require('../pages/CardPage');

for (const submit of ['click', 'Enter', 'Control+Enter']) {
  test(`#6700 one checklist persists after ${submit}`, async ({ boardPage: page, board, user }) => {
    db.updateOne('users', { _id: user.id }, { $set: { 'profile.submitOnEnter': true } });
    const cp = new CardPage(page);
    await new BoardPage(page).clickCard(board.listIds[0], 'Alpha Card');
    await cp.waitForOpen();
    await cp.root.locator('a.add-checklist.js-open-inlined-form').last().click();
    const form = cp.root.locator('form.js-add-checklist');
    await form.locator('textarea').fill('Single submission');
    if (submit === 'click') await form.locator('button[type="submit"]').click();
    else await form.locator('textarea').press(submit);
    const cardId = db.findCardIdByTitle({ boardId: board.boardId, title: 'Alpha Card' });
    await expect.poll(() => db.countDocuments('checklists', { cardId, title: 'Single submission' })).toBe(1);
    await page.reload();
    await new BoardPage(page).clickCard(board.listIds[0], 'Alpha Card');
    await cp.waitForOpen();
    await expect(cp.root.locator('.js-checklist .checklist-title').filter({ hasText: 'Single submission' })).toHaveCount(1);
    expect(db.countDocuments('checklists', { cardId, title: 'Single submission' })).toBe(1);
  });
}
