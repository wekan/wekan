'use strict';
const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const BoardPage = require('../pages/BoardPage');
const CardPage = require('../pages/CardPage');

for (const handles of [false, true]) {
  test(`#6723 third-position drop follows placeholder (handles ${handles})`, async ({ boardPage: page, board, user }) => {
    db.updateOne('users', { _id: user.id }, { $set: { 'profile.showDesktopDragHandles': handles } });
    const bp = new BoardPage(page), cp = new CardPage(page);
    await bp.clickCard(board.listIds[0], 'Alpha Card');
    await cp.waitForOpen();
    await cp.addChecklist('Reorder tasks');
    for (const title of ['2', '3', '1', '4', '45']) {
      await cp.addChecklistItem('Reorder tasks', title);
    }
    await page.keyboard.press('Escape');
    const items = cp.checklistItems('Reorder tasks');
    await expect(items).toHaveCount(5);
    // First reproduce the preceding move: put the last item (45) at the top.
    const bottom = items.last(), top = items.first();
    const from = await (handles ? bottom.locator('.checklistitem-handle') : bottom).boundingBox();
    const to = await top.boundingBox();
    await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
    await page.mouse.down();
    await page.mouse.move(from.x + from.width / 2, to.y + 2, { steps: 20 });
    await page.mouse.up();
    await expect.poll(async () => (await items.locator('.item-title').allTextContents()).map(t => t.trim()))
      .toEqual(['45', '2', '3', '1', '4']);
    const titles = () => items.locator('.item-title').allTextContents();
    const initial = (await titles()).map(title => title.trim());
    const first = items.first(), last = items.nth(2);
    const start = await (handles ? first.locator('.checklistitem-handle') : first).boundingBox();
    const end = await last.boundingBox();
    await page.mouse.move(start.x + start.width / 2, start.y + start.height / 2);
    await page.mouse.down();
    await page.mouse.move(start.x + start.width / 2, end.y + end.height - 2, { steps: 20 });
    const placeholderOrder = await page.locator('.js-checklist-items').evaluate(container =>
      [...container.querySelectorAll('.js-checklist-item:not(.ui-sortable-helper), .placeholder')]
        .filter(el => getComputedStyle(el).display !== 'none')
        .map(el => el.matches('.placeholder') ? '45' : el.querySelector('.item-title').textContent.trim()));
    await page.mouse.up();
    const expected = [initial[1], initial[2], initial[0], ...initial.slice(3)];
    expect(placeholderOrder).toEqual(expected);
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

}
