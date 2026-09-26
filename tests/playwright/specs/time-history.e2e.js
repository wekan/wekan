'use strict';
const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const BoardPage = require('../pages/BoardPage');
const CardPage = require('../pages/CardPage');

test('move dialog records reason and one reversible position', async ({ boardPage: page, board }) => {
  const source = db.findOne('cards', { boardId: board.boardId, title: 'Alpha Card' });
  await new BoardPage(page).clickCard(source.listId, source.title);
  const card = new CardPage(page);
  await card.waitForOpen();
  await card.openActionsMenu();
  await card.clickAction('.js-move-card');
  const popup = page.locator('.js-pop-over');
  await popup.locator('#move-card-reason').fill('Ready for review');
  await popup.locator('.js-select-lists').selectOption(board.listIds[1]);
  await popup.locator('.js-done').click();
  await expect.poll(() => db.getCard(source._id).listId).toBe(board.listIds[1]);
  await expect.poll(() => db.find('changeHistory', { entityId: source._id, group: 'position' }).length).toBe(1);
  const row = db.findOne('changeHistory', { entityId: source._id, group: 'position' });
  expect(row.newContent.lastMoveReason).toBe('Ready for review');
  const undo = await page.evaluate(id => Meteor.callAsync('changeHistory.undoLast', id), board.boardId);
  expect(undo.group).toBe('position');
  await expect.poll(() => db.getCard(source._id).listId).toBe(source.listId);
  expect(db.getCard(source._id).lastMoveReason || '').toBe('');
  await page.evaluate(id => Meteor.callAsync('changeHistory.redoLast', id), board.boardId);
  await expect.poll(() => db.getCard(source._id).lastMoveReason).toBe('Ready for review');
});

test('REST time corrections, move reasons, retained activity and report authors', async ({ boardPage: page, board, user }) => {
  const source = db.findOne('cards', { boardId: board.boardId, title: 'Alpha Card' });
  const headers = { Authorization: `Bearer ${user.token}` };
  const endpoint = `/api/boards/${board.boardId}/lists/${source.listId}/cards/${source._id}`;
  for (const spentTime of [4, 2, 0]) {
    const response = await page.request.put(endpoint, { headers, data: { spentTime } });
    expect(response.status()).toBe(200);
  }
  expect(db.getCard(source._id).spentTime).toBe(0);
  const changes = db.find('changeHistory', { entityId: source._id, 'newContent.field': 'spentTime' });
  expect(changes).toHaveLength(3);
  expect(changes.every(row => row.userId === user.id)).toBe(true);
  const invalid = await page.request.put(endpoint, { headers, data: { spentTime: -1 } });
  expect(invalid.status()).toBe(400);
  await page.locator('.js-toggle-board-view').first().click();
  await page.locator('.js-open-time-view').click();
  await expect(page.locator('.time-adjustments')).toContainText('Time adjustments by author');
  await expect(page.locator('.time-adjustments tbody').last().locator('tr')).toHaveCount(3);
  await expect(page.locator('.time-adjustments')).toContainText('-2');
  await page.locator('.js-export-chart').click();
  for (const label of ['Excel', 'PDF']) {
    const url = await page.locator('.pop-over a').filter({ hasText: label }).getAttribute('href');
    const response = await page.request.get(url);
    expect(response.status()).toBe(200);
    expect((await response.body()).length).toBeGreaterThan(500);
  }
  const moved = await page.request.put(endpoint, { headers, data: { listId: board.listIds[1], moveReason: 'Awaiting delivery' } });
  expect(moved.status()).toBe(200);
  const move = db.findOne('changeHistory', { entityId: source._id, group: 'position' });
  expect(move.newContent.lastMoveReason).toBe('Awaiting delivery');
  const activities = db.find('activities', { cardId: source._id });
  const deleted = await page.request.delete(`/api/boards/${board.boardId}/lists/${board.listIds[1]}/cards/${source._id}`, { headers });
  expect(deleted.status()).toBe(200);
  expect(db.getCard(source._id)).toBeNull();
  for (const row of activities) expect(db.findOne('activities', { _id: row._id })).toBeTruthy();
  expect(db.findOne('changeHistory', { entityId: source._id, group: 'lifecycle' }).previousContent.document.title).toBe(source.title);
  const report = await page.evaluate(id => Meteor.callAsync('boardChartData', id, 'time'), board.boardId);
  expect(report.adjustments.entries).toHaveLength(3);
  expect(report.adjustments.entries.every(row => row.title === source.title)).toBe(true);
});

test('activity timestamps are exact inline text (#1673)', async ({ boardPage: page, board, user }) => {
  const source = db.findOne('cards', { boardId: board.boardId, title: 'Alpha Card' });
  const at = new Date('2026-09-20T12:34:00Z');
  db.insertOne('activities', { _id: `time-exact-${board.boardId}`, boardId: board.boardId, cardId: source._id,
    listId: source.listId, userId: user.id, activityType: 'createCard', cardTitle: 'Timestamp sample', createdAt: at });
  // Existing feed timestamps use the shared date-format preference helper.
  await new BoardPage(page).clickCard(source.listId, source.title);
  const toggle = page.locator('[data-section=activities]');
  if (await toggle.count()) await toggle.click();
  const stamp = page.locator('.js-activity-permalink').filter({ hasText: '2026' }).first();
  await expect(stamp).toBeVisible();
  expect(await stamp.textContent()).toMatch(/\d{1,2}:\d{2}/);
});


test('checklist completion activity survives deleting its checklist (#1598)', async ({ boardPage: page, board, user }) => {
  const source = db.findOne('cards', { boardId: board.boardId, title: 'Alpha Card' });
  await new BoardPage(page).clickCard(source.listId, source.title);
  const card = new CardPage(page);
  await card.waitForOpen();
  await card.addChecklist('Retained work');
  await card.addChecklistItem('Retained work', 'Completed step');
  const list = card.root.locator('.js-checklist').filter({ hasText: 'Retained work' });
  const item = list.locator('.js-checklist-item');
  await item.focus();
  await page.keyboard.press('Space');
  await expect(item).toHaveAttribute('aria-checked', 'true');
  const checklist = db.findOne('checklists', { cardId: source._id, title: 'Retained work' });
  const activity = db.find('activities', { checklistId: checklist._id });
  expect(activity.length).toBeGreaterThan(1);
  const response = await page.request.delete(`/api/boards/${board.boardId}/cards/${source._id}/checklists/${checklist._id}`,
    { headers: { Authorization: `Bearer ${user.token}` } });
  expect(response.status()).toBe(200);
  for (const row of activity) expect(db.findOne('activities', { _id: row._id })).toBeTruthy();
  expect(db.findOne('checklists', { _id: checklist._id })).toBeNull();
});
