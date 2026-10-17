'use strict';

// Rule suggestions (docs/Features/Rules/Rule-Suggestions.md): a habit in the
// board's activities is offered above the rule list, Create makes the rule,
// Dismiss hides it, and a non-admin or a disabled feature gets nothing.

const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const { loginWithToken, navigateInApp } = require('../helpers/auth');

// Three cards moved to the second list and archived 20 seconds later.
function seedHabit(board, userId) {
  const cards = db.find('cards', { boardId: board.boardId }).slice(0, 3);
  const base = Date.now() - 60 * 60 * 1000;
  const rows = [];
  cards.forEach((card, i) => {
    const t = base + i * 600_000;
    rows.push({ _id: `e2e-rs-m${i}-${board.boardId}`, activityType: 'moveCard', boardId: board.boardId, cardId: card._id,
      userId, listId: board.listIds[1], createdAt: new Date(t) });
    rows.push({ _id: `e2e-rs-a${i}-${board.boardId}`, activityType: 'archivedCard', boardId: board.boardId, cardId: card._id,
      userId, listId: board.listIds[1], createdAt: new Date(t + 20_000) });
  });
  db.insertMany('activities', rows);
}

test.describe('Rule suggestions', () => {
  test.use({ storageState: undefined });

  test('a habit is suggested, Create makes the rule, Dismiss hides one', async ({ page, adminUser }) => {
    const board = await db.seedBoard({ ownerId: adminUser.id, title: 'Rule Suggestions Board',
      cardTitlesPerList: [['One', 'Two', 'Three'], [], []] });
    seedHabit(board, adminUser.id);
    const done = db.findOne('lists', { _id: board.listIds[1] });
    await loginWithToken(page, adminUser.id, adminUser.token);
    await navigateInApp(page, `/b/${board.boardId}/${board.slug}/rules`);

    const box = page.locator('.js-rule-suggestions');
    await expect(box).toBeVisible({ timeout: 20_000 });
    const row = box.locator('.rule-suggestion').first();
    await expect(row).toContainText(done.title);
    await expect(row.locator('.rule-suggestion-count')).toContainText('3');
    await row.locator('.js-create-suggested-rule').click();

    await expect.poll(() => db.find('rules', { boardId: board.boardId }).length, { timeout: 15_000 }).toBe(1);
    const rule = db.findOne('rules', { boardId: board.boardId });
    const trigger = db.findOne('triggers', { _id: rule.triggerId });
    const action = db.findOne('actions', { _id: rule.actionId });
    expect(trigger).toMatchObject({ activityType: 'moveCard', listName: done.title, oldListName: '*' });
    expect(action).toMatchObject({ actionType: 'archive', boardId: board.boardId });
    // The rule now does it, so it is no longer suggested (negative).
    await expect(box).toHaveCount(0, { timeout: 15_000 });

    // Dismiss: remove the rule, the suggestion returns, then Dismiss hides it.
    db.deleteMany('rules', { boardId: board.boardId });
    await page.reload();
    await expect(page.locator('.js-rule-suggestions .rule-suggestion')).toHaveCount(1, { timeout: 20_000 });
    await page.locator('.js-dismiss-suggested-rule').click();
    await expect(page.locator('.js-rule-suggestions')).toHaveCount(0, { timeout: 15_000 });
    const user = db.findOne('users', { _id: adminUser.id });
    expect(user.profile.dismissedRuleSuggestions[board.boardId]).toHaveLength(1);
  });

  test('a member who is not a board admin, and a disabled feature, get nothing (negative)', async ({ page, adminUser }) => {
    const board = await db.seedBoard({ ownerId: adminUser.id, title: 'Rule Suggestions Off',
      cardTitlesPerList: [['One', 'Two', 'Three'], [], []] });
    seedHabit(board, adminUser.id);
    await loginWithToken(page, adminUser.id, adminUser.token);
    await navigateInApp(page, `/b/${board.boardId}/${board.slug}`);
    const ask = () => page.evaluate(id => Meteor.callAsync('rules.suggestions', id), board.boardId);
    expect((await ask()).length).toBe(1);

    const setting = db.findOne('settings', {});
    const states = { ...(setting.featureStates || {}), 'rule-suggestions': false };
    db.updateOne('settings', { _id: setting._id }, { $set: { featureStates: states } });
    try {
      expect(await ask()).toEqual([]);
    } finally {
      db.updateOne('settings', { _id: setting._id }, { $set: { featureStates: { ...states, 'rule-suggestions': true } } });
    }

    db.updateOne('boards', { _id: board.boardId, 'members.userId': adminUser.id }, { $set: { 'members.$.isAdmin': false } });
    expect(await ask()).toEqual([]);
    const refused = await page.evaluate(id => Meteor.callAsync('rules.dismissSuggestion', id,
      '[{"kind":"moved","listId":"x"},{"kind":"archive"}]').then(() => 'allowed', err => err.error), board.boardId);
    expect(refused).toBe('not-authorized');
  });
});
