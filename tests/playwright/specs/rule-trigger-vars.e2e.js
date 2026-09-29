'use strict';
// #4294 / #3195 (maintainer decision 2026-09-29): a trigger value may use the
// action variables. "When a card is moved to the list named in its
// {customField:Target}" fires only for the card whose field names that list.
const { test, expect } = require('../fixtures');
const db = require('../helpers/db');

const call = (page, method, ...args) => page.evaluate(({ method, args }) => Meteor.callAsync(method, ...args), { method, args });

async function move(request, user, board, card, listId) {
  const res = await request.put(`/api/boards/${board.boardId}/lists/${card.listId}/cards/${card._id}`, {
    headers: { Authorization: `Bearer ${user.token}`, 'Content-Type': 'application/json' },
    data: { listId, swimlaneId: board.swimlaneId },
  });
  expect(res.status()).toBe(200);
}

test('a trigger list name read from a custom field fires only for the matching card', async ({ boardPage: page, request, user, board }) => {
  const [listA, listB, listC] = board.listIds.map(_id => db.findOne('lists', { _id }));
  const fieldId = `cf${Date.now()}`;
  db.insertOne('customFields', {
    _id: fieldId, boardIds: [board.boardId], name: 'Target', type: 'text', settings: {},
    showOnCard: false, automaticallyOnCard: false, alwaysOnCard: false, showLabelOnMiniCard: false,
    createdAt: new Date(), modifiedAt: new Date(),
  });
  const alpha = db.findOne('cards', { boardId: board.boardId, listId: listA._id });
  const beta = db.findOne('cards', { boardId: board.boardId, listId: listB._id });
  db.updateOne('cards', { _id: alpha._id }, { $set: { customFields: [{ _id: fieldId, value: listC.title }], members: [] } });
  db.updateOne('cards', { _id: beta._id }, { $set: { customFields: [{ _id: fieldId, value: 'Somewhere else' }], members: [] } });
  const rule = await call(page, 'rules.createRule', board.boardId, 'Moved to its target',
    { activityType: 'moveCard', listName: '{customField:Target}', oldListName: '*', swimlaneName: '*', cardTitle: '*', userId: '*', desc: 'target' },
    { actionType: 'addMember', username: '{creator}', desc: 'add creator' });
  try {
    const trigger = db.findOne('triggers', { _id: rule.triggerId });
    expect(trigger.listName).toBe('{customField:Target}');

    // Alpha moves to the list its Target names: the rule adds its creator.
    await move(request, user, board, alpha, listC._id);
    await expect.poll(() => db.findOne('cards', { _id: alpha._id }).members).toEqual([alpha.userId]);
    // Negative: Beta moves to the same list, but its Target names another list.
    await move(request, user, board, beta, listC._id);
    await expect.poll(() => db.find('activities', { cardId: beta._id, activityType: 'moveCard' }).length).toBeGreaterThan(0);
    expect(db.findOne('cards', { _id: beta._id }).members || []).toEqual([]);
  } finally {
    await call(page, 'rules.deleteRule', rule._id).catch(() => {});
    db.deleteOne('customFields', { _id: fieldId });
  }
});

test('the trigger editor explains which variables trigger fields accept', async ({ boardPage: page, board }) => {
  const { navigateInApp } = require('../helpers/auth');
  await navigateInApp(page, `/b/${board.boardId}/${board.slug}/rules`);
  await page.locator('#ruleTitle').fill('Variables');
  await page.locator('.js-goto-trigger').first().click();
  await expect(page.locator('.js-trigger-vars-hint')).toContainText('{customField:Name}');
});
