'use strict';
// #4294: "when creating a ticket, I want the assignee to be the creator of the
// card by default", and "give a Rule a default name". Add a rule WITHOUT a
// title whose action makes {creator} the assignee: the rule is named after
// what it does, and a card created in the list gets its creator as assignee -
// on card.assignees, not card.members.
const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const { navigateInApp } = require('../helpers/auth');

test.describe('#4294 rule assignee action and default title', () => {
  test.afterEach(({ board }) => {
    db.deleteMany('rules', { boardId: board.boardId });
    db.deleteMany('triggers', { boardId: board.boardId });
    db.deleteMany('actions', { boardId: board.boardId });
  });

  test('an untitled rule assigns the creator of a new card', async ({ boardPage: page, board, user }) => {
    await navigateInApp(page, `/b/${board.boardId}/${board.slug}/rules`);
    await page.locator('.rules-page').waitFor({ timeout: 20_000 });
    await page.locator('#ruleTitle').fill('');
    await page.locator('.js-goto-trigger').click();
    await page.locator('.js-add-create-trigger.js-goto-action').first().click();
    await page.locator('.js-set-card-actions').click();
    await page.locator('#assignee-action').selectOption('add');
    await page.locator('#assignee-name').fill('{creator}');
    await page.locator('.js-add-assignee-action.js-goto-rules').click();

    await expect.poll(() => db.find('rules', { boardId: board.boardId }).length, { timeout: 15_000 }).toBe(1);
    const rule = db.find('rules', { boardId: board.boardId })[0];
    expect(rule.title).toMatch(/^When .+, then .+/);
    expect(db.find('actions', { _id: rule.actionId })[0]).toMatchObject({ actionType: 'addAssignee', username: '{creator}' });

    // A card created in the first list: its creator becomes its assignee.
    await navigateInApp(page, `/b/${board.boardId}/${board.slug}`);
    await page.locator('a.open-minicard-composer.js-open-inlined-form').first().click();
    const textarea = page.locator('textarea.minicard-composer-textarea.js-card-title').first();
    await expect(textarea).toBeVisible({ timeout: 6_000 });
    await textarea.fill('Assigned by rule');
    await page.locator('.add-controls button.primary.confirm').first().click();
    await expect.poll(() => (db.find('cards', { boardId: board.boardId, title: 'Assigned by rule' })[0] || {}).assignees,
      { timeout: 20_000 }).toEqual([user.id]);
    const card = db.find('cards', { boardId: board.boardId, title: 'Assigned by rule' })[0];
    expect(card.members || []).not.toContain(user.id);
  });
});
