'use strict';
const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const { openLazyBoard } = require('../helpers/lazyBoard');

test('lazy Table view pages the whole board, searches off-page cards, sorts and retracts revoked pages', async ({ loggedInPage: page, user, user2 }) => {
  test.setTimeout(120000);
  const board = db.seedBoard({ ownerId: user.id, cardTitlesPerList: [Array.from({ length: 62 }, (_, i) => `Card ${i}`)] });
  const foreign = db.seedBoard({ ownerId: user2.id, cardTitlesPerList: [['Private card']] });
  try {
    await openLazyBoard(page, board);
    await page.locator('.js-toggle-board-view').first().click();
    await page.locator('.pop-over .js-open-table-view').click();
    const titles = page.locator('.my-cards-card-title-table');
    await expect(titles).toHaveCount(25);
    await expect(titles.first()).toHaveText('Card 0');
    await expect(page.locator('.table-view-page-info')).toHaveText('1 / 3');
    await page.locator('.js-table-view-next-page').click();
    await expect(titles.first()).toHaveText('Card 25');
    await expect(page.locator('.table-view-page-info')).toHaveText('2 / 3');
    await page.locator('.js-table-view-next-page').click();
    await expect(titles).toHaveCount(12); await expect(titles.first()).toHaveText('Card 50');
    await page.locator('.js-table-view-sort[data-field="title"]').click();
    await expect(titles).toHaveCount(25); await expect(titles.first()).toHaveText('Card 61');
    await page.locator('.js-table-view-search').fill('Card 1');
    await page.locator('.js-table-view-search-button').click();
    await expect(titles).toHaveCount(11); await expect(titles.first()).toHaveText('Card 19');
    // Page metadata is bounded independently of other publications' card cache.
    await expect.poll(() => page.evaluate(() => Meteor.connection._stores.boardTablePages._getCollection().find().fetch()
      .map(doc => doc.ids.length))).toEqual([11]);
    const forbidden = await page.evaluate(async boardId => {
      const key = 'unauthorized-page';
      const options = { query: '', page: 1, sortField: 'title', direction: 'asc', group: false };
      await new Promise((resolve, reject) => {
        window.deniedTableSubscription = Meteor.subscribe('boardTablePage', boardId, key, {}, options, { onReady: resolve, onError: reject });
      });
      return Meteor.connection._stores.boardTablePages._getCollection().find({ key }).count();
    }, foreign.boardId);
    expect(forbidden).toBe(0);
    await page.evaluate(() => window.deniedTableSubscription.stop());
    db.updateOne('cards', { boardId: board.boardId, title: 'Card 19' }, { $set: { title: 'Changed outside query' } });
    await expect(titles).toHaveCount(10); await expect(titles.first()).toHaveText('Card 18');
    db.updateOne('boards', { _id: board.boardId }, { $set: { members: [] } });
    await expect.poll(() => page.evaluate(() => Meteor.connection._stores.boardTablePages?._getCollection().find().count() || 0)).toBe(0);
  } finally { db.cleanup({ boardIds: [board.boardId, foreign.boardId] }); }
});
