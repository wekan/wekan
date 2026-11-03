'use strict';

// #6865: Escape closes the inline add-list composer, also after a list was created
// from it (it stays open for the next one).
const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const BoardPage = require('../pages/BoardPage');

test('#6865: Escape closes the add-list composer opened after a list, before and after a list is created', async ({ boardPage: page, board, user }) => {
  const bp = new BoardPage(page);
  const [listId] = board.listIds;
  // Escape is a keyboard shortcut: it needs them turned on (the seeded user has them off).
  db.updateOne('users', { _id: user.id }, { $set: { 'profile.keyboardShortcuts': true } });
  await expect.poll(() => page.evaluate(() => Meteor.user()?.profile?.keyboardShortcuts === true)).toBe(true);
  const composer = page.locator('.js-add-list-inline-form textarea.list-name-input, form textarea.list-name-input').first();
  const open = async () => {
    await bp.list(listId).locator('.js-add-list-here').first().click({ force: true });
    await expect(composer).toBeVisible();
  };

  await open();
  await page.keyboard.press('Escape');
  await expect(composer, 'Escape closes it').toHaveCount(0);

  // Create a list from it: the composer stays open, and Escape closes it then too.
  await open();
  await composer.fill('List from the composer');
  await page.locator('.js-add-list-inline-form button[type=submit]').click();
  await expect.poll(() => db.findOne('lists', { boardId: board.boardId, title: 'List from the composer' })).toBeTruthy();
  await expect(composer, 'still open after the list was created').toBeVisible();
  await page.keyboard.press('Escape');
  await expect(composer, 'Escape closes it after creating').toHaveCount(0);
});
