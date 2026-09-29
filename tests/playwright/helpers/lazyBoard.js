'use strict';
const { expect } = require('@playwright/test');
const db = require('./db');
const { openBoard } = require('./auth');

// Auto mode is chosen once when opening a board. Cross the real server
// threshold, then remove the padding so small fixtures can exercise lazy pages.
async function openLazyBoard(page, board) {
  const threshold = await page.evaluate(() => Meteor.settings.public.cardsLoadingLazyThreshold ?? 500);
  const template = db.findOne('cards', { boardId: board.boardId });
  const ids = Array.from({ length: threshold + 1 }, () => db.uid('lazy-padding'));
  db.insertMany('cards', ids.map((_id, i) => ({ ...template, _id,
    title: 'Lazy mode padding', sort: 10000 + i, archived: false })));
  try {
    await openBoard(page, board.boardId, board.slug);
    await expect.poll(() => page.evaluate(id => Meteor.connection._stores.boardCardLoadingModes
      ?._getCollection().findOne(id)?.lazy, board.boardId)).toBe(true);
  } finally {
    db.deleteMany('cards', { _id: { $in: ids } });
  }
}
module.exports = { openLazyBoard };
