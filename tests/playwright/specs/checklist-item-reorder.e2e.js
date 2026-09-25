'use strict';
const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const BoardPage = require('../pages/BoardPage');
const CardPage = require('../pages/CardPage');

test('#6723 checklist item drop persists its new position after reload', async ({ boardPage: page, board, user }) => {
  db.updateOne('users', { _id: user.id }, { $set: { 'profile.showDesktopDragHandles': true } });
  const bp = new BoardPage(page), cp = new CardPage(page);
  await bp.clickCard(board.listIds[0], 'Alpha Card');
  await cp.waitForOpen();
  await cp.addChecklist('Reorder tasks');
  for (const title of ['First task', 'Second task', 'Third task']) {
    await cp.addChecklistItem('Reorder tasks', title);
  }
  await page.keyboard.press('Escape');
  const items = cp.checklistItems('Reorder tasks');
  await expect(items).toHaveCount(3);
  const titles = () => items.locator('.item-title').allTextContents();
  const initial = (await titles()).map(title => title.trim());
  const first = items.first(), last = items.last();
  const start = await first.locator('.checklistitem-handle').boundingBox();
  const end = await last.boundingBox();
  await page.mouse.move(start.x + start.width / 2, start.y + start.height / 2);
  await page.mouse.down();
  await page.mouse.move(start.x + start.width / 2, end.y + end.height - 2, { steps: 20 });
  await page.mouse.up();
  const expected = [...initial.slice(1), initial[0]];
  await expect.poll(async () => (await titles()).map(title => title.trim())).toEqual(expected);
  const cardId = db.findCardIdByTitle({ boardId: board.boardId, title: 'Alpha Card' });
  const checklist = db.findOne('checklists', { cardId, title: 'Reorder tasks' });
  await expect.poll(() => db.find('checklistItems', { checklistId: checklist._id })
    .sort((a, b) => a.sort - b.sort).map(item => item.title)).toEqual(expected);
  await page.reload();
  await bp.clickCard(board.listIds[0], 'Alpha Card');
  await cp.waitForOpen();
  await expect.poll(async () => (await titles()).map(title => title.trim())).toEqual(expected);
});
