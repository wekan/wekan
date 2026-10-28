'use strict';

// #6827: a list's Add card form closes once the card is added, unless Member
// Settings keeps it open for typing the next card.
const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const BoardPage = require('../pages/BoardPage');

test('#6827: the Add card form closes after a card, unless Member Settings keeps it open', async ({ boardPage: page, board, user }) => {
  const bp = new BoardPage(page);
  const [listId] = board.listIds;
  const composer = bp.list(listId).locator('.js-inlined-form textarea.js-card-title');
  db.updateOne('users', { _id: user.id }, { $unset: { 'profile.keepAddCardFormOpen': '' } });
  await expect.poll(() => page.evaluate(() => Meteor.user()?.profile?.keepAddCardFormOpen === undefined)).toBe(true);

  // Off (the default): the card is added and the form is gone.
  await bp.openAddCardTop(listId);
  await bp.submitNewCard(listId, 'Closed after adding');
  await expect(composer).toHaveCount(0);

  // A multi-line paste added as separate cards: every card, then closed -
  // not closed half way through.
  await bp.openAddCardTop(listId);
  const form = bp.list(listId).locator('form').filter({ has: page.locator('textarea.js-card-title') });
  await composer.fill('Pasted one\nPasted two');
  await form.locator('.js-multiline-title-mode[value=separate]').check();
  await form.locator('button[type=submit]').click();
  await expect.poll(() => ['Pasted one', 'Pasted two'].every(title => db.findOne('cards', { boardId: board.boardId, title }))).toBe(true);
  await expect(composer).toHaveCount(0);

  // On, from Member Settings: the form stays, empty, for the next card.
  await page.locator('.js-open-header-member-menu').first().click();
  await page.locator('.js-change-settings').click();
  await page.locator('.js-toggle-keep-add-card-form-open').click();
  await expect.poll(() => db.findOne('users', { _id: user.id }).profile.keepAddCardFormOpen).toBe(true);
  await expect(page.locator('.js-toggle-keep-add-card-form-open .fa-check')).toBeVisible();
  await page.keyboard.press('Escape');
  await bp.openAddCardTop(listId);
  await bp.submitNewCard(listId, 'Kept open after adding');
  await expect(composer).toBeVisible();
  await expect(composer).toHaveValue('');
  await bp.submitNewCard(listId, 'The next card');
  await bp.closeComposers(listId);
});
