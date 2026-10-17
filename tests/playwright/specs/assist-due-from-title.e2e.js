'use strict';

// A due date typed at the end of a card title (docs/Features/Cards/Dates/
// Due-Date-From-Title.md): the hint under the field, the card it makes, the
// hint's x, the board's own off switch, and the opened card's title.

const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const BoardPage = require('../pages/BoardPage');
const CardPage = require('../pages/CardPage');

const tomorrowAt = (hour, minute = 0) => {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1, hour, minute).getTime();
};

test.describe('Due date from the title', () => {
  test('the add-card form reads a due date from the end of the title', async ({ boardPage, board }) => {
    const bp = new BoardPage(boardPage);
    const [listA] = board.listIds;
    await bp.openAddCardTop(listA);
    const form = bp.list(listA).locator('.js-inlined-form');
    const textarea = form.locator('textarea.js-card-title');

    await textarea.fill('Call the printer tomorrow 14:00');
    const hint = form.locator('.js-title-due-hint');
    await expect(hint).toBeVisible();
    await expect(hint).toContainText(/\b(14|0?2):00\b/);
    await form.locator('button[type=submit]').click();
    await expect.poll(() => db.findOne('cards', { boardId: board.boardId, title: 'Call the printer' }), { timeout: 15_000 }).toBeTruthy();
    const card = db.findOne('cards', { boardId: board.boardId, title: 'Call the printer' });
    expect(new Date(card.dueAt).getTime()).toBe(tomorrowAt(14));
    // The form is ready for the next card, with no hint left over.
    await expect(hint).toHaveCount(0);

    // The x keeps the words in the title (negative).
    await textarea.fill('Lunch with Bob tomorrow');
    await expect(hint).toBeVisible();
    await form.locator('.js-title-due-hint-dismiss').click();
    await expect(hint).toHaveCount(0);
    await form.locator('button[type=submit]').click();
    await expect.poll(() => db.findOne('cards', { boardId: board.boardId, title: 'Lunch with Bob tomorrow' }), { timeout: 15_000 }).toBeTruthy();
    expect(db.findOne('cards', { boardId: board.boardId, title: 'Lunch with Bob tomorrow' }).dueAt).toBeFalsy();
  });

  test('Board Settings / Card turns it off for the add-card form (negative)', async ({ boardPage, board }) => {
    db.updateOne('boards', { _id: board.boardId }, { $set: { allowsDueFromTitleOnMinicard: false } });
    const bp = new BoardPage(boardPage);
    const [listA] = board.listIds;
    await bp.openAddCardTop(listA);
    const form = bp.list(listA).locator('.js-inlined-form');
    await form.locator('textarea.js-card-title').fill('Ship it tomorrow');
    await boardPage.waitForTimeout(300);
    await expect(form.locator('.js-title-due-hint')).toHaveCount(0);
    await form.locator('button[type=submit]').click();
    await expect.poll(() => db.findOne('cards', { boardId: board.boardId, title: 'Ship it tomorrow' }), { timeout: 15_000 }).toBeTruthy();
    expect(db.findOne('cards', { boardId: board.boardId, title: 'Ship it tomorrow' }).dueAt).toBeFalsy();
  });

  test('renaming the opened card reads a due date too', async ({ boardPage, board }) => {
    const bp = new BoardPage(boardPage);
    const cp = new CardPage(boardPage);
    await bp.clickCard(board.listIds[0], 'Alpha Card');
    await cp.waitForOpen();
    await cp.root.locator('.card-details-title-edit-zone').click();
    const editor = cp.root.locator('textarea.js-edit-card-title');
    await expect(editor).toBeVisible({ timeout: 5_000 });
    await editor.fill('Alpha Card tomorrow 9:30');
    await expect(cp.root.locator('.js-title-due-hint')).toBeVisible();
    await cp.root.locator('.js-submit-edit-card-title-form').click();
    await expect.poll(() => (db.findOne('cards', { boardId: board.boardId, title: 'Alpha Card' }) || {}).dueAt, { timeout: 15_000 }).toBeTruthy();
    const card = db.findOne('cards', { boardId: board.boardId, title: 'Alpha Card' });
    expect(new Date(card.dueAt).getTime()).toBe(tomorrowAt(9, 30));
  });
});
