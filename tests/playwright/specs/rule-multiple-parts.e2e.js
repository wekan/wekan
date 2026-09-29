'use strict';
// #4294 / #2953 (maintainer decision 2026-09-29): a rule fires when ANY of its
// triggers fires, once, and runs its actions in order.
const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const { navigateInApp } = require('../helpers/auth');

const call = (page, method, ...args) => page.evaluate(({ method, args }) => Meteor.callAsync(method, ...args), { method, args });
const created = trigger => ({ activityType: 'createCard', swimlaneName: '*', cardTitle: '*', userId: '*', ...trigger, desc: 'created' });

async function restCard(request, user, board, listId, title) {
  const res = await request.post(`/api/boards/${board.boardId}/lists/${listId}/cards`, {
    headers: { Authorization: `Bearer ${user.token}`, 'Content-Type': 'application/json' },
    data: { authorId: user.id, swimlaneId: board.swimlaneId, title },
  });
  expect(res.status()).toBe(200);
  return (await res.json())._id;
}

test('any trigger fires the rule once and every action runs in order', async ({ boardPage: page, request, user, board }) => {
  const [listA, listB, listC] = board.listIds.map(_id => db.findOne('lists', { _id }));
  const rule = await call(page, 'rules.createRule', board.boardId, 'Several parts',
    created({ listName: listA.title }), { actionType: 'addMember', username: '{creator}', desc: 'add' });
  try {
    await call(page, 'rules.addPart', rule._id, 'trigger', created({ listName: listB.title }));
    await call(page, 'rules.addPart', rule._id, 'action', { actionType: 'moveCardToTop', listName: listC.title, swimlaneName: '*', desc: 'move' });
    const saved = db.findOne('rules', { _id: rule._id });
    expect(saved.extraTriggerIds).toHaveLength(1);
    expect(saved.extraActionIds).toHaveLength(1);

    // Through the added trigger: both actions.
    const viaB = await restCard(request, user, board, listB._id, 'From B');
    await expect.poll(() => db.findOne('cards', { _id: viaB }).listId).toBe(listC._id);
    expect(db.findOne('cards', { _id: viaB }).members).toEqual([user.id]);
    // Through the rule's own trigger: the same.
    const viaA = await restCard(request, user, board, listA._id, 'From A');
    await expect.poll(() => db.findOne('cards', { _id: viaA }).listId).toBe(listC._id);
    // Neither trigger: nothing.
    const viaC = await restCard(request, user, board, listC._id, 'From C');
    await expect.poll(() => db.find('activities', { cardId: viaC, activityType: 'createCard' }).length).toBeGreaterThan(0);
    expect(db.findOne('cards', { _id: viaC }).members || []).toEqual([]);

    // Negative: a button cannot be an extra trigger; the limit is enforced.
    const refused = await page.evaluate(async id => {
      try { await Meteor.callAsync('rules.addPart', id, 'trigger', { activityType: 'button' }); return 'allowed'; }
      catch (e) { return e.error; }
    }, rule._id);
    expect(refused).toBe('invalid-rule-part');

    // The details view lists the extras, and Remove takes one away.
    await navigateInApp(page, `/b/${board.boardId}/${board.slug}/rules`);
    await page.locator(`.js-goto-details[data-rule-id="${rule._id}"]`).click();
    await expect(page.locator('.js-extra-rule-part')).toHaveCount(2);
    await page.locator('.js-remove-rule-part[data-kind="action"]').click();
    await expect.poll(() => db.findOne('rules', { _id: rule._id }).extraActionIds).toEqual([]);
    expect(db.findOne('actions', { _id: saved.extraActionIds[0] })).toBeNull();
    await expect(page.locator('.js-extra-rule-part')).toHaveCount(1);
  } finally {
    await call(page, 'rules.deleteRule', rule._id).catch(() => {});
  }
  // Deleting the rule removes its extra parts too.
  expect(db.find('triggers', { boardId: board.boardId })).toEqual([]);
});

test('only a board admin can add or remove rule parts', async ({ page, board, boardPage: adminPage, user2 }) => {
  const rule = await call(adminPage, 'rules.createRule', board.boardId, 'Admin only',
    created({ listName: '*' }), { actionType: 'archive', desc: 'archive' });
  try {
    db.addBoardMember({ boardId: board.boardId, userId: user2.id, isAdmin: false });
    const { loginWithToken, openBoard } = require('../helpers/auth');
    await loginWithToken(page, user2.id, user2.token);
    await openBoard(page, board.boardId, board.slug);
    const result = await page.evaluate(async id => {
      try { await Meteor.callAsync('rules.addPart', id, 'action', { actionType: 'archive' }); return 'allowed'; } catch (e) { return e.error; }
    }, rule._id);
    expect(result).toBe('not-authorized');
    expect(db.findOne('rules', { _id: rule._id }).extraActionIds).toBeUndefined();
  } finally {
    await call(adminPage, 'rules.deleteRule', rule._id).catch(() => {});
  }
});
