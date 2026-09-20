const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const BoardPage = require('../pages/BoardPage');
const CardPage = require('../pages/CardPage');

test('closing a card tolerates a published user without a profile', async ({ boardPage: page, board, user }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.stack || error.message));
  const original = db.findOne('users', { _id: user.id });
  const card = new CardPage(page);
  await new BoardPage(page).clickCard(board.listIds[0], 'Alpha Card');
  await card.waitForOpen();
  try {
    // Reproduce the partial user document seen while publications settle.
    db.updateOne('users', { _id: user.id }, { $unset: { profile: '' } });
    await page.waitForFunction(() => Meteor.user() && !Meteor.user().profile);
    await page.keyboard.press('Escape');
    await expect(card.root).toBeHidden();
    expect(errors).toEqual([]);
  } finally {
    db.updateOne('users', { _id: user.id }, original.profile === undefined
      ? { $unset: { profile: '' } } : { $set: { profile: original.profile } });
  }
});
