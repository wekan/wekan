'use strict';
const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const BoardPage = require('../pages/BoardPage');
const CardPage = require('../pages/CardPage');
const { loginWithToken, navigateInApp } = require('../helpers/auth');

test('#1686: the member picker sorts names across roles and filters by typing', async ({ page, user, user2, board }) => {
  db.updateOne('users', { _id: user.id }, { $set: { 'profile.fullname': 'Zulu Admin' } });
  db.updateOne('users', { _id: user2.id }, { $set: { 'profile.fullname': 'Alpha Member' } });
  db.addBoardMember({ boardId: board.boardId, userId: user2.id });
  await loginWithToken(page, user.id, user.token);
  await navigateInApp(page, `/b/${board.boardId}/${board.slug}`);
  const bp = new BoardPage(page);
  await bp.clickCard(board.listIds[0], 'Alpha Card');
  const card = new CardPage(page);
  await card.waitForOpen();
  await card.openMemberSelector();
  const popup = page.locator('.js-pop-over');
  const names = popup.locator('.js-card-member-list .full-name');
  await expect(names).toHaveCount(2);
  expect(await names.allTextContents()).toEqual([expect.stringContaining('Alpha Member'), expect.stringContaining('Zulu Admin')]);
  await popup.locator('.card-members-filter').fill('ALPHA');
  await popup.locator('.card-members-filter').press('ArrowRight');
  await expect(names).toHaveCount(1);
  await expect(names.first()).toContainText('Alpha Member');
  await popup.locator('.card-members-filter').fill('no-member-matches');
  await popup.locator('.card-members-filter').press('ArrowRight');
  await expect(names).toHaveCount(0);
});

test('#2160: change the selected cards color without changing unselected cards', async ({ boardPage: page, board }) => {
  const bp = new BoardPage(page);
  const list = board.listIds[0];
  await bp.openAddCardTop(list);
  await bp.submitNewCard(list, 'Another Selected Card');
  await page.locator('.js-multiselection-activate').click();
  await bp.openListMenu(list);
  await bp.clickListMenuItem('.js-select-cards');
  await page.locator('.board-sidebar .js-selection-color').click();
  const popup = page.locator('.js-pop-over');
  await popup.locator('.js-palette-color.card-details-red').click();
  await popup.locator('.js-submit').click();
  await expect.poll(() => db.find('cards', { boardId: board.boardId, listId: list }).map(c => c.color)).toEqual(['red', 'red']);
  expect(db.findOne('cards', { boardId: board.boardId, title: 'Beta Card' }).color || null).toBe(null);
});

test('#3213: an existing card becomes a subtask without creating a replacement', async ({ boardPage: page, board }) => {
  const bp = new BoardPage(page);
  const parent = db.findOne('cards', { boardId: board.boardId, title: 'Alpha Card' });
  const child = db.findOne('cards', { boardId: board.boardId, title: 'Beta Card' });
  const before = db.countDocuments('cards', { boardId: board.boardId });
  await bp.clickCard(board.listIds[0], 'Alpha Card');
  const details = new CardPage(page);
  await details.waitForOpen();
  await details.root.locator('.js-add-existing-subtask').click();
  await page.locator('.js-pop-over .js-select-existing-subtask').filter({ hasText: 'Beta Card' }).click();
  await expect.poll(() => db.findOne('cards', { _id: child._id }).parentId).toBe(parent._id);
  expect(db.countDocuments('cards', { boardId: board.boardId })).toBe(before);
});

test('#3114: remotely moving an open mobile card closes its details', async ({ page, user, board }) => {
  const destination = db.seedBoard({ ownerId: user.id, cardTitlesPerList: [[]] });
  try {
    await page.setViewportSize({ width: 390, height: 844 });
    await loginWithToken(page, user.id, user.token);
    await navigateInApp(page, `/b/${board.boardId}/${board.slug}`);
    await new BoardPage(page).clickCard(board.listIds[0], 'Alpha Card');
    await expect(page.locator('.js-card-details').first()).toBeVisible();
    const card = db.findOne('cards', { boardId: board.boardId, title: 'Alpha Card' });
    db.updateOne('cards', { _id: card._id }, { $set: {
      boardId: destination.boardId, listId: destination.listIds[0], swimlaneId: destination.swimlaneId,
    } });
    await expect(page.locator('.js-card-details')).toHaveCount(0);
    await expect(page.locator('.board-canvas')).toBeVisible();
  } finally { db.cleanup({ boardIds: [destination.boardId] }); }
});

test('#3198: hide a custom value on the minicard while retaining card details', async ({ boardPage: page, board }) => {
  const fieldId = db.uid('field');
  const card = db.findOne('cards', { boardId: board.boardId, title: 'Alpha Card' });
  db.updateOne('boards', { _id: board.boardId }, { $set: { allowsCustomFields: true, allowsCustomFieldsOnMinicard: true } });
  db.insertOne('customFields', { _id: fieldId, boardIds: [board.boardId], name: 'Statistical field', type: 'text', settings: {}, showOnCard: true, showLabelOnMiniCard: true });
  try {
    db.updateOne('cards', { _id: card._id }, { $set: { customFields: [{ _id: fieldId, value: 'Private-to-details statistic' }] } });
    const mini = page.locator(`.js-minicard[data-card-id="${card._id}"]`);
    await expect(mini).toContainText('Private-to-details statistic');
    db.updateOne('customFields', { _id: fieldId }, { $set: { showOnCard: false } });
    await expect(mini).not.toContainText('Private-to-details statistic');
    await mini.click();
    const details = new CardPage(page);
    await details.waitForOpen();
    await expect(details.root).toContainText('Private-to-details statistic');
  } finally { db.deleteOne('customFields', { _id: fieldId }); }
});
