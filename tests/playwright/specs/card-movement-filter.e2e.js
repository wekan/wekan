'use strict';
const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const { openBoard } = require('../helpers/auth');

test('historical movement picker finds earlier moves, refreshes recorded events, rejects reversed dates and clears', async ({ loggedInPage: page, board, user }) => {
  // Raw writes are observed through polling on a standalone MongoDB.
  test.setTimeout(150000);
  const [movedAgain, other, unknown] = db.find('cards', { boardId: board.boardId });
  const extras = Array.from({ length: 35 }, (_, i) => ({ ...movedAgain, _id: `move-${board.boardId}-${i}`, title: `Extra ${i}`, sort: 100 + i }));
  db.insertMany('cards', extras);
  const far = extras[34];
  const event = (card, id, date, activityType = 'moveCard', eventBoard = board.boardId) => ({
    _id: `${id}-${board.boardId}`, boardId: eventBoard, cardId: card._id,
    userId: user.id, activityType, createdAt: new Date(date), listId: board.listIds[0], oldListId: board.listIds[1],
  });
  db.insertMany('activities', [
    event(movedAgain, 'earlier', '2026-09-01T12:00:00Z'), event(movedAgain, 'later', '2026-09-20T12:00:00Z'),
    event(far, 'board-move', '2026-09-02T12:00:00Z', 'moveCardBoard'),
    event(other, 'foreign', '2026-09-01T12:00:00Z', 'moveCard', 'private-other-board'),
    event(other, 'too-late', '2026-09-03T12:00:00Z'), event(unknown, 'created', '2026-09-01T12:00:00Z', 'createCard'),
  ]);
  await openBoard(page, board.boardId, board.slug);
  await page.locator('.js-open-filter-view').click();
  const form = page.locator('.js-card-movement-range');
  const from = form.locator('.js-card-movement-from'), to = form.locator('.js-card-movement-to');
  const visible = () => page.locator('.board-canvas .js-minicard').evaluateAll(rows => rows.map(row => row.dataset.cardId).sort());
  await from.fill('2026-09-01'); await to.fill('2026-09-02');
  await form.locator('[type="submit"]').click();
  await expect.poll(visible).toEqual([movedAgain._id, far._id].sort());
  await to.fill('2026-08-01'); await form.locator('[type="submit"]').click();
  await expect(to).toHaveJSProperty('validationMessage', 'Choose valid dates, with the end on or after the start.');
  await expect.poll(visible).toEqual([movedAgain._id, far._id].sort());
  await to.fill('2026-09-02'); await form.locator('[type="submit"]').click();
  db.insertOne('activities', event(unknown, 'new-history', '2026-09-02T14:00:00Z'));
  await expect.poll(visible).toEqual([movedAgain._id, far._id, unknown._id].sort());
  db.deleteOne('activities', { _id: `earlier-${board.boardId}` });
  await expect.poll(visible).toEqual([far._id, unknown._id].sort());
  await page.locator('.js-open-filter-view').click();
  await page.locator('.js-open-filter-view').click();
  await expect(from).toHaveValue('2026-09-01');
  await form.locator('.js-clear-movement-range').click();
  await expect(from).toHaveValue(''); await expect(to).toHaveValue('');
  await expect.poll(() => page.evaluate(() => Meteor.connection._stores.boardMovementMatches?._getCollection().find().count() || 0)).toBe(0);
  await expect.poll(visible).not.toEqual([far._id, unknown._id].sort());
});
