'use strict';
const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const { openBoard } = require('../helpers/auth');
const { MongoClient } = require('mongodb');
const { backfillCardListEntries } = require('../../../server/lib/cardListEntryBackfill');

test('recovered legacy column dates hide old cards while contradictory history stays visible', async ({ loggedInPage: page, board }) => {
  const [old, unknown, inconsistent] = db.find('cards', { boardId: board.boardId });
  for (const card of [old, unknown, inconsistent]) db.updateOne('cards', { _id: card._id }, {
    $set: { listId: old.listId }, $unset: { listEnteredAt: '' },
  });
  const client = await new MongoClient(process.env.WEKAN_MONGO_URL).connect();
  try {
    const storage = client.db();
    const at = new Date(Date.now() - 60 * 86400000);
    await storage.collection('activities').insertMany([
      { cardId: old._id, boardId: board.boardId, activityType: 'moveCard', createdAt: at, oldListId: 'earlier', listId: old.listId },
      { cardId: inconsistent._id, boardId: board.boardId, activityType: 'moveCard', createdAt: at, oldListId: 'earlier', listId: 'wrong-destination' },
    ]);
    const result = await backfillCardListEntries({ cards: storage.collection('cards'), activities: storage.collection('activities') });
    expect(result.columnDatesRestored).toBeGreaterThanOrEqual(1);
    expect((await storage.collection('cards').findOne({ _id: old._id })).listEnteredAt).toEqual(at);
    await openBoard(page, board.boardId, board.slug);
    await page.locator('.js-open-filter-view').click();
    const form = page.locator('.js-column-age-filter');
    await form.locator('select').selectOption(old.listId);
    await form.locator('input').fill('30');
    await form.locator('button').click();
    await expect(page.locator(`.js-minicard[data-card-id="${old._id}"]`)).toBeHidden();
    for (const card of [unknown, inconsistent]) await expect(page.locator(`.js-minicard[data-card-id="${card._id}"]`)).toBeVisible();
    expect(db.findOne('cards', { _id: old._id }).archived).toBe(false);
  } finally { await client.close(); }
});
