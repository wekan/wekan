'use strict';
const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const BoardPage = require('../pages/BoardPage');
const CardPage = require('../pages/CardPage');

for (const direction of ['ltr', 'rtl']) {
  test(`card editor can be manually enlarged and keeps its size while typing (${direction})`, async ({ boardPage: page, board }) => {
    const bp = new BoardPage(page);
    await bp.openAddCardTop(board.listIds[0]);
    const input = bp.list(board.listIds[0]).locator('textarea.js-card-title');
    await input.fill('Resizable draft');
    await input.evaluate((el, dir) => { el.style.direction = dir; }, direction);
    await expect(input).toHaveCSS('resize', 'both');
    const before = await input.boundingBox();
    const x = direction === 'rtl' ? before.x + 3 : before.x + before.width - 3;
    await page.mouse.move(x, before.y + before.height - 3);
    await page.mouse.down();
    await page.mouse.move(x, before.y + before.height + 87, { steps: 10 });
    await page.mouse.up();
    const enlarged = await input.boundingBox();
    expect(enlarged.height).toBeGreaterThan(before.height + 50);
    await input.press('End');
    await input.pressSequentially(' still large');
    await expect.poll(async () => (await input.boundingBox()).height).toBeGreaterThan(before.height + 50);
    expect(db.find('cards', { boardId: board.boardId, title: 'Resizable draft still large' })).toHaveLength(0);
  });
}

test('label names preserve multiple lines when saved and reopened', async ({ boardPage: page, board }) => {
  const bp = new BoardPage(page), cp = new CardPage(page);
  await bp.clickCard(board.listIds[0], 'Alpha Card');
  await cp.waitForOpen();
  await cp.openLabelSelector();
  const pop = page.locator('.js-pop-over');
  await pop.locator('.js-add-label').click();
  const input = pop.locator('textarea.js-label-name');
  await input.fill('First line');
  await input.press('Enter');
  await input.pressSequentially('Second line');
  await expect(input).toHaveValue('First line\nSecond line');
  await expect(input).toHaveCSS('resize', 'both');
  await pop.locator('.js-palette-color').first().click();
  await pop.locator('button.primary, button[type=submit]').first().click();
  await expect.poll(() => db.findOne('boards', { _id: board.boardId }).labels.some(l => l.name === 'First line\nSecond line')).toBe(true);
  // Create goes back to the Labels popup and the card stays open, so clicking
  // its minicard again would close it. Close the popup and reopen the editor.
  await expect(pop.locator('li.js-card-label-item').filter({ hasText: 'First line' })).toHaveCount(1);
  await page.evaluate(() => Popup.close());
  await expect(pop).toHaveCount(0);
  await cp.openLabelSelector();
  await pop.locator('li.js-card-label-item').filter({ hasText: 'First line' }).locator('.js-edit-label').click();
  await expect(pop.locator('textarea.js-label-name')).toHaveValue('First line\nSecond line');
});
