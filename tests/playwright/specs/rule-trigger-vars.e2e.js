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

// #3195: the editor inserts a variable at the caret of the text field last
// focused, and offers the board's custom fields but not admin-only ones.
test('the rule editor inserts a picked variable into the last focused field', async ({ boardPage: page, board }) => {
  const { navigateInApp } = require('../helpers/auth');
  const stamp = Date.now();
  const fields = [['Stage', false], ['Secret', true]].map(([name, adminOnly]) => ({
    _id: `cf${name}${stamp}`, boardIds: [board.boardId], name: `${name}${stamp}`, type: 'text', settings: {}, adminOnly,
    showOnCard: false, automaticallyOnCard: false, alwaysOnCard: false, showLabelOnMiniCard: false,
    createdAt: new Date(), modifiedAt: new Date(),
  }));
  fields.forEach(field => db.insertOne('customFields', field));
  try {
    await navigateInApp(page, `/b/${board.boardId}/${board.slug}/rules`);
    await page.locator('#ruleTitle').fill('Picker');
    await page.locator('.js-goto-trigger').first().click();
    const picker = page.locator('.js-rule-variable-picker');
    await expect(picker.locator(`option[value="{customField:Stage${stamp}}"]`)).toHaveCount(1);
    await expect(picker.locator(`option[value="{customField:Secret${stamp}}"]`)).toHaveCount(0);
    await expect(picker.locator('option[value="{assignees}"]')).toHaveCount(1);

    const listName = page.locator('#create-list-name');
    await listName.fill('Stage ');
    await listName.focus();
    await picker.selectOption(`{customField:Stage${stamp}}`);
    await expect(listName).toHaveValue(`Stage {customField:Stage${stamp}}`);
    await expect(listName).toBeFocused();
    await expect(picker).toHaveValue('');
    // The caret follows the token: a second pick lands after the first.
    await picker.selectOption('{members}');
    await expect(listName).toHaveValue(`Stage {customField:Stage${stamp}}{members}`);
    // A different field becomes the target once it is focused.
    const swimlane = page.locator('#create-swimlane-name');
    await swimlane.focus();
    await picker.selectOption('{board}');
    await expect(swimlane).toHaveValue('{board}');
    await expect(listName).toHaveValue(`Stage {customField:Stage${stamp}}{members}`);

    // The action editor has the same picker.
    await page.locator('.js-add-create-trigger').first().click();
    await expect(page.locator('.js-rule-variable-picker')).toBeVisible();
  } finally {
    fields.forEach(field => db.deleteOne('customFields', { _id: field._id }));
  }
});
