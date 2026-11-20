'use strict';
// The Definition of Ready beside the Definition of Done (Scrum settings,
// models/lib/scrum.js): written by the board admin in the Scrum settings,
// readable by every member in the Scrum views; nothing drawn while empty.
const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const { loginWithToken, openBoard } = require('../helpers/auth');

async function view(page, slug) {
  await page.locator('.js-toggle-board-view').first().click();
  await page.locator(`.pop-over .js-open-${slug}-view`).click();
  await expect(page.locator('.scrum-view')).toBeVisible();
}
const call = (page, method, ...args) => page.evaluate(async ({ method, args }) => {
  try { return await Meteor.callAsync(method, ...args); } catch (e) { throw new Error(`${e.error}: ${e.reason || e.message}`); }
}, { method, args });

test('the Definition of Ready is saved with the Scrum settings and shown to the team', async ({ page, user, board }) => {
  await loginWithToken(page, user.id, user.token);
  await openBoard(page, board.boardId, board.slug);
  await view(page, 'product-backlog');
  // Negative: nothing is drawn while it is empty.
  await expect(page.locator('.js-scrum-definition-of-ready')).toHaveCount(0);

  await call(page, 'scrum.configure', board.boardId, { definitionOfReady: 'Estimated, small, with acceptance criteria' }, null);
  await expect.poll(() => (db.findOne('boards', { _id: board.boardId }).scrum || {}).definitionOfReady, { timeout: 15_000 })
    .toBe('Estimated, small, with acceptance criteria');
  // The Scrum view reads its data when it opens (the admin's Save refreshes it).
  await openBoard(page, board.boardId, board.slug);
  await view(page, 'product-backlog');
  const block = page.locator('.js-scrum-definition-of-ready');
  await expect(block).toBeVisible({ timeout: 15_000 });
  await block.locator('summary').click();
  await expect(block).toContainText('Estimated, small');
  await expect(page.locator('textarea[name="definitionOfReady"]')).toHaveValue('Estimated, small, with acceptance criteria');
  // Negative: a value that is not text is refused.
  await expect(call(page, 'scrum.configure', board.boardId, { definitionOfReady: 7 }, null)).rejects.toThrow();
});
