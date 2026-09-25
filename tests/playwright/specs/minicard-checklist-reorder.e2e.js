'use strict';
const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const BoardPage = require('../pages/BoardPage');
const CardPage = require('../pages/CardPage');

for (const handles of [false, true]) {
  test(`minicard checklist progress and third-position drop (handles ${handles})`, async ({ boardPage: page, board, user }) => {
    db.updateOne('users', { _id: user.id }, { $set: { 'profile.showDesktopDragHandles': handles } });
    const bp = new BoardPage(page), cp = new CardPage(page);
    await bp.clickCard(board.listIds[0], 'Alpha Card');
    await cp.waitForOpen();
    await cp.addChecklist('Mini tasks');
    for (const title of ['45', '2', '3', '1', '4']) await cp.addChecklistItem('Mini tasks', title);
    await cp.toggleChecklistItem('Mini tasks', '4');
    const cardId = db.findCardIdByTitle({ boardId: board.boardId, title: 'Alpha Card' });
    const checklist = db.findOne('checklists', { cardId, title: 'Mini tasks' });
    db.updateOne('checklists', { _id: checklist._id }, { $set: { showChecklistAtMinicard: true } });
    await cp.close();
    const mini = bp.minicard(board.listIds[0], 'Alpha Card');
    const tasks = mini.locator('.minicard-checklist').filter({ hasText: 'Mini tasks' });
    await expect(tasks.locator('.checklist-progress-text')).toHaveText('20%');
    await expect(tasks.locator('[role="progressbar"]')).toHaveAttribute('aria-valuenow', '20');
    // Reinitialization after collapse must also retain sorting.
    await tasks.locator('.js-collapse-checklist').click();
    await expect(tasks.locator('.js-checklist-items')).toHaveCount(0);
    await expect(tasks.locator('.checklist-progress-text')).toHaveText('20%');
    await tasks.locator('.js-collapse-checklist').click();
    const items = tasks.locator('.js-checklist-item');
    await expect(items).toHaveCount(5);
    const before = db.countDocuments('cards', { boardId: board.boardId });
    const start = await (handles ? items.first().locator('.checklistitem-handle') : items.first()).boundingBox();
    const end = await items.nth(2).boundingBox();
    await page.mouse.move(start.x + start.width / 2, start.y + start.height / 2);
    await page.mouse.down();
    await page.mouse.move(start.x + start.width / 2, end.y + end.height - 2, { steps: 20 });
    await page.mouse.up();
    const expected = ['2', '3', '45', '1', '4'];
    await expect.poll(async () => (await items.locator('.item-title').allTextContents()).map(t => t.trim())).toEqual(expected);
    expect(db.countDocuments('cards', { boardId: board.boardId })).toBe(before);
    await expect(cp.root).not.toBeVisible();
    await page.reload();
    await expect.poll(async () => (await items.locator('.item-title').allTextContents()).map(t => t.trim())).toEqual(expected);
    await expect(tasks.locator('.checklist-progress-text')).toHaveText('20%');
  });
}

for (const handles of [false, true]) {
  test(`move a minicard checklist item across swimlanes and lists (handles ${handles})`, async ({ boardPage: page, board, user }) => {
    db.updateOne('users', { _id: user.id }, { $set: { 'profile.showDesktopDragHandles': handles } });
    const sourceCard = db.findOne('cards', { boardId: board.boardId, title: 'Alpha Card' });
    const targetCard = { ...sourceCard, _id: db.uid('target'), title: 'Target card', listId: db.uid('list'), swimlaneId: db.uid('lane') };
    db.insertOne('swimlanes', { _id: targetCard.swimlaneId, title: 'Other lane', boardId: board.boardId, archived: false, type: 'swimlane', height: -1, sort: 1, createdAt: new Date() });
    db.insertOne('lists', { ...db.findOne('lists', { _id: board.listIds[1] }), _id: targetCard.listId, swimlaneId: targetCard.swimlaneId });
    db.insertOne('cards', targetCard);
    const sourceId = db.uid('check'), targetId = db.uid('check'), itemId = db.uid('item');
    for (const [id, card] of [[sourceId, sourceCard], [targetId, targetCard]]) {
      db.insertOne('checklists', { _id: id, cardId: card._id, boardId: board.boardId, title: 'Transfer tasks', sort: 0, showChecklistAtMinicard: true, createdAt: new Date() });
    }
    db.insertMany('checklistItems', [
      { _id: itemId, title: 'Move me', checklistId: sourceId, cardId: sourceCard._id, boardId: board.boardId, sort: 0, isFinished: false },
      { _id: db.uid('item'), title: 'Existing target', checklistId: targetId, cardId: targetCard._id, boardId: board.boardId, sort: 0, isFinished: false },
    ]);
    await page.reload();
    const bp = new BoardPage(page);
    const source = bp.minicard(board.listIds[0], 'Alpha Card').locator('.js-checklist-item');
    const target = bp.minicard(targetCard.listId, 'Target card').locator('.js-checklist-item');
    await expect(source).toHaveCount(1);
    await expect(target).toHaveCount(1);
    // Fit both swimlanes on screen without changing the drag implementation.
    await page.setViewportSize({ width: 1500, height: 1300 });
    const from = await (handles ? source.locator('.checklistitem-handle') : source).boundingBox();
    const to = await target.boundingBox();
    const count = db.countDocuments('cards', { boardId: board.boardId });
    await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
    await page.mouse.down();
    await page.mouse.move(to.x + to.width / 2, to.y + to.height - 2, { steps: 35 });
    await page.mouse.up();
    await expect.poll(() => db.findOne('checklistItems', { _id: itemId }).checklistId).toBe(targetId);
    expect(db.findOne('checklistItems', { _id: itemId }).cardId).toBe(targetCard._id);
    expect(db.countDocuments('cards', { boardId: board.boardId })).toBe(count);
    await expect(source).toHaveCount(0);
    await expect(target).toHaveCount(2);
    await page.reload();
    await expect(target).toHaveCount(2);
  });
}
