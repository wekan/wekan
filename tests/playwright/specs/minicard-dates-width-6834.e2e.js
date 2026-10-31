'use strict';
// #6834: a minicard's dates row reserves only the drag handle's room at its
// trailing edge. It reserved 84px - a third of a narrow minicard - and a due
// date with its "1 day left" was broken over three lines beside an empty strip.
const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const { loginWithToken, openBoard } = require('../helpers/auth');

for (const language of ['en', 'fa']) {
  test(`the due date badge uses the minicard's width (${language})`, async ({ page, user, board }) => {
    db.updateOne('users', { _id: user.id }, { $set: { 'profile.language': language } });
    const card = db.findOne('cards', { boardId: board.boardId, title: 'Alpha Card' });
    db.updateOne('cards', { _id: card._id }, { $set: { dueAt: new Date(Date.now() + 86400000) } });
    await loginWithToken(page, user.id, user.token);
    await openBoard(page, board.boardId, board.slug);
    const minicard = page.locator('.js-minicard', { hasText: 'Alpha Card' }).first();
    const dates = minicard.locator('.dates').first();
    await expect(dates.locator('.card-date.due-date')).toBeVisible();
    const reserved = await dates.evaluate(el => parseFloat(getComputedStyle(el).marginInlineEnd));
    expect(reserved).toBeLessThanOrEqual(24);
    // The badge is at most two lines high in a default-width list, not three.
    const lines = await dates.locator('.card-date.due-date').evaluate(el => {
      const lh = parseFloat(getComputedStyle(el).lineHeight) || 16;
      return Math.round(el.getBoundingClientRect().height / lh);
    });
    expect(lines).toBeLessThanOrEqual(2);
  });
}
