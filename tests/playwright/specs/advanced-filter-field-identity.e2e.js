'use strict';
const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const { loginWithToken, openBoard } = require('../helpers/auth');

test('sidebar and rules require the selected field itself to match', async ({ page, user, board }) => {
  const points = db.uid('points'), other = db.uid('other'), checkbox = db.uid('checkbox');
  const cards = db.find('cards', { boardId: board.boardId });
  const wrong = cards[0], right = cards[1], missing = cards[2];
  db.insertMany('customFields', [
    { _id: points, boardIds: [board.boardId], name: 'Points', type: 'number', settings: {} },
    { _id: other, boardIds: [board.boardId], name: 'Other', type: 'number', settings: {} },
    { _id: checkbox, boardIds: [board.boardId], name: 'Reviewed', type: 'checkbox', settings: {} },
  ]);
  for (const [card, fields] of [
    [wrong, [{ _id: points, value: 1 }, { _id: other, value: 2 }]],
    [right, [{ _id: points, value: 2 }, { _id: other, value: 1 }]],
    [missing, [{ _id: other, value: 2 }]],
  ]) db.updateOne('cards', { _id: card._id }, { $set: { customFields: [...fields, { _id: checkbox, value: true }] } });
  const triggerId = db.uid('trigger'), actionId = db.uid('action');
  db.insertOne('triggers', { _id: triggerId, boardId: board.boardId, activityType: 'advancedFilterTrigger', advancedFilter: 'not(Points = 1) and (Points = 2)' });
  db.insertOne('actions', { _id: actionId, boardId: board.boardId, actionType: 'markCardComplete' });
  db.insertOne('rules', { _id: db.uid('rule'), boardId: board.boardId, triggerId, actionId, enabled: true, title: 'Match points only' });
  const missingTriggerId = db.uid('missing-trigger');
  db.insertOne('triggers', { _id: missingTriggerId, boardId: board.boardId,
    activityType: 'advancedFilterTrigger', advancedFilter: 'UnknownField = 2' });
  db.insertOne('rules', { _id: db.uid('missing-rule'), boardId: board.boardId,
    triggerId: missingTriggerId, actionId, enabled: true, title: 'Missing field must not match' });
  const invalidTriggerId = db.uid('invalid-trigger');
  db.insertOne('triggers', { _id: invalidTriggerId, boardId: board.boardId,
    activityType: 'advancedFilterTrigger', advancedFilter: 'Points = 2 or' });
  db.insertOne('rules', { _id: db.uid('invalid-rule'), boardId: board.boardId,
    triggerId: invalidTriggerId, actionId, enabled: true, title: 'Incomplete rule must not match' });
  try {
    await loginWithToken(page, user.id, user.token);
    await openBoard(page, board.boardId, board.slug);
    await page.locator('.js-open-filter-view').click();
    const input = page.locator('.js-field-advanced-filter');
    const visible = page.locator('.board-canvas .js-minicard');
    for (const [filter, ids] of [
      ['Points = 2', [right._id]], ['Points > 1', [right._id]],
      ['Points != 2', [wrong._id]],
      ['Points = 2 and Other = 1', [right._id]],
      ['Points = 2 or Points = 1', [right._id, wrong._id]],
      ['not Points = 2', [wrong._id, missing._id]],
      ['!(Points = 2)', [wrong._id, missing._id]],
      ['not(Points = 1 or Points = 2)', [missing._id]],
      ['(Points = 1 or Points = 2) and (Other = 1)', [right._id]],
      ['Points = 2 or', [right._id]], // Invalid input retains the last valid filter.

    ]) {
      await input.fill(filter);
      await input.dispatchEvent('change');
      await expect.poll(() => visible.evaluateAll(elements => elements.map(el => el.dataset.cardId).sort())).toEqual(ids.sort());
    }
    await input.fill('');
    await input.dispatchEvent('change');
    await expect(visible).toHaveCount(3);
    for (const card of cards) await page.evaluate(({ cardId, checkbox }) =>
      Meteor.callAsync('setCardCustomFieldCheckbox', cardId, checkbox, false), { cardId: card._id, checkbox });
    expect(db.findOne('cards', { _id: right._id }).dueComplete).toBe(true);
    expect(!!db.findOne('cards', { _id: wrong._id }).dueComplete).toBe(false);
    expect(!!db.findOne('cards', { _id: missing._id }).dueComplete).toBe(false);
  } finally {
    db.deleteMany('customFields', { _id: { $in: [points, other, checkbox] } });
    for (const collection of ['rules', 'triggers', 'actions']) db.deleteMany(collection, { boardId: board.boardId });
  }
});

test('decimal currency filters and rules preserve the complete numeric boundary', async ({ page, user, board }) => {
  const fieldId = db.uid('cost');
  const cards = db.find('cards', { boardId: board.boardId });
  db.insertOne('customFields', { _id: fieldId, boardIds: [board.boardId], name: 'Cost', type: 'currency', settings: { currencyCode: 'EUR' } });
  for (const card of cards) db.updateOne('cards', { _id: card._id }, { $set: { customFields: [{ _id: fieldId, value: 2 }] } });
  const actionId = db.uid('action');
  db.insertOne('actions', { _id: actionId, boardId: board.boardId, actionType: 'markCardComplete' });
  for (const filter of ['Cost > 2.5', 'Cost > 2hours']) {
    const triggerId = db.uid('trigger');
    db.insertOne('triggers', { _id: triggerId, boardId: board.boardId, activityType: 'advancedFilterTrigger', advancedFilter: filter });
    db.insertOne('rules', { _id: db.uid('rule'), boardId: board.boardId, triggerId, actionId, title: filter, enabled: true });
  }
  try {
    await loginWithToken(page, user.id, user.token);
    for (let index = 0; index < cards.length; index++) {
      await page.evaluate(({ cardId, fieldId, value }) => Meteor.callAsync('setCardCustomFieldCurrency', cardId, fieldId, value),
        { cardId: cards[index]._id, fieldId, value: [2.25, 2.5, 2.75][index] });
    }
    expect(cards.map(card => !!db.findOne('cards', { _id: card._id }).dueComplete)).toEqual([false, false, true]);
    await openBoard(page, board.boardId, board.slug);
    await page.locator('.js-open-filter-view').click();
    const input = page.locator('.js-field-advanced-filter');
    const visible = page.locator('.board-canvas .js-minicard');
    for (const [filter, indices] of [
      ['Cost = 2.5', [1]], ['Cost > 2.5', [2]], ['Cost >= 2.5', [1, 2]],
      ['Cost < 2.5', [0]], ['Cost <= 2.5', [0, 1]], ['Cost = 25e-1', [1]],
      ['Cost != 2.5', [0, 2]], ['Cost > 2hours', [0, 2]],
    ]) {
      await input.fill(filter);
      await input.dispatchEvent('change');
      await expect.poll(() => visible.evaluateAll(elements => elements.map(el => el.dataset.cardId).sort()))
        .toEqual(indices.map(index => cards[index]._id).sort());
    }
  } finally {
    db.deleteOne('customFields', { _id: fieldId });
    for (const collection of ['rules', 'triggers', 'actions']) db.deleteMany(collection, { boardId: board.boardId });
  }
});
