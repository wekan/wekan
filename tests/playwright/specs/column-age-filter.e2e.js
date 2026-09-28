'use strict';
const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const { openBoard } = require('../helpers/auth');

test('list-age filter hides only old cards in the chosen list and refreshes after real moves', async ({ loggedInPage: page, board }) => {
  const cards = db.find('cards', { boardId: board.boardId });
  const [old, unknown, other] = cards;
  const age = new Date(Date.now() - 60 * 86400000);
  db.updateOne('cards', { _id: old._id }, { $set: { listEnteredAt: age } });
  db.updateOne('cards', { _id: unknown._id }, { $set: { listId: old.listId }, $unset: { listEnteredAt: '' } });
  db.updateOne('cards', { _id: other._id }, { $set: { listEnteredAt: age } });
  await openBoard(page, board.boardId, board.slug);
  await page.locator('.js-open-filter-view').click();
  const form = page.locator('.js-column-age-filter');
  await form.locator('select').selectOption(old.listId);
  await form.locator('input').fill('30');
  await form.locator('button').click();
  const mini = card => page.locator(`.js-minicard[data-card-id="${card._id}"]`);
  await expect(mini(old)).toBeHidden();
  await expect(mini(unknown)).toBeVisible();
  await expect(mini(other)).toBeVisible();
  expect(db.findOne('cards', { _id: old._id }).archived).toBe(false);
  await page.evaluate(async ({ id, listId }) => Meteor.callAsync('/cards/update', { _id: id }, { $set: { title: 'Edited old card' } }), { id: old._id });
  await expect(mini(old)).toBeHidden();
  expect(new Date(db.findOne('cards', { _id: old._id }).listEnteredAt)).toEqual(age);
  await page.evaluate(async ({ id, listId }) => Meteor.callAsync('/cards/update', { _id: id }, { $set: { listId } }), { id: old._id, listId: other.listId });
  await expect(mini(old)).toBeVisible();
  await page.evaluate(async ({ id, listId }) => Meteor.callAsync('/cards/update', { _id: id }, { $set: { listId } }), { id: old._id, listId: old.listId });
  await expect(mini(old)).toBeVisible();
  expect(new Date(db.findOne('cards', { _id: old._id }).listEnteredAt).getTime()).toBeGreaterThan(age.getTime());
  // Disabling the filter reveals even an old card, without archiving it.
  db.updateOne('cards', { _id: old._id }, { $set: { listEnteredAt: age } });
  await expect(mini(old)).toBeHidden();
  if (!await form.isVisible()) await page.locator('.js-open-filter-view').click();
  await form.locator('select').selectOption('');
  await form.locator('button').click();
  await expect(mini(old)).toBeVisible();
});
