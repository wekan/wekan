'use strict';
// #6939: the card details window remembers the width its user drags it to, the
// Admin Panel's default percentage applies until then, and "Reset width" in the
// card menu forgets the dragged one. models/lib/cardDetailsWidth.js,
// client/lib/cardDetailsWidthMemory.js.
const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const BoardPage = require('../pages/BoardPage');
const CardPage = require('../pages/CardPage');

const width = page => page.locator('.js-card-details').first().evaluate(el => Math.round(el.getBoundingClientRect().width));

test.describe('#6939 card details width', () => {
  test.use({ viewport: { width: 1600, height: 900 } });

  test.afterEach(async ({ user }) => {
    db.updateOne('users', { _id: user.id }, { $unset: { 'profile.cardDetailsWidth': '' } });
    db.updateMany('settings', {}, { $unset: { cardDetailsDefaultWidthPercent: '' } });
  });

  test('a dragged width is kept for the next card, and Reset width forgets it', async ({ boardPage, board, user }) => {
    const bp = new BoardPage(boardPage);
    const cp = new CardPage(boardPage);
    const [listA, listB] = board.listIds;
    await bp.clickCard(listA, 'Alpha Card');
    await cp.waitForOpen();
    await expect.poll(() => width(boardPage)).toBe(520);

    // Drag the browser's own resize handle, the bottom corner on the end side -
    // once the window has settled: as it opens it is the window's full height
    // for a moment, its corner below the bottom edge, and a press there lands
    // on the page outside the card, which closes it.
    await expect.poll(() => boardPage.locator('.js-card-details').first()
      .evaluate(el => el.getBoundingClientRect().bottom <= window.innerHeight - 4)).toBe(true);
    const box = await boardPage.locator('.js-card-details').first().boundingBox();
    await boardPage.mouse.move(box.x + box.width - 2, box.y + box.height - 2);
    await boardPage.mouse.down();
    await boardPage.mouse.move(box.x + box.width + 300, box.y + box.height - 2, { steps: 10 });
    // Released outside the card, as every widening resize is: it stays open.
    await boardPage.mouse.up();
    await expect(boardPage.locator('.js-card-details').first()).toBeVisible();
    const dragged = await width(boardPage);
    expect(dragged).toBeGreaterThan(760);
    await expect.poll(() => db.findOne('users', { _id: user.id })?.profile?.cardDetailsWidth)
      .toBeGreaterThan(760);

    await cp.close();
    await bp.clickCard(listB, 'Beta Card');
    await cp.waitForOpen();
    await expect.poll(async () => Math.abs((await width(boardPage)) - dragged)).toBeLessThan(4);

    // Reset width, from the card menu.
    await boardPage.locator('.js-card-details .js-open-card-details-menu').first().click();
    await boardPage.locator('.js-pop-over .js-reset-card-details-width').click();
    await expect.poll(() => width(boardPage)).toBe(520);
    await expect.poll(() => db.findOne('users', { _id: user.id })?.profile?.cardDetailsWidth).toBeUndefined();
  });

  test('the administrator\'s percentage, 520px at least, until a user drags their own', async ({ boardPage, board }) => {
    db.updateMany('settings', {}, { $set: { cardDetailsDefaultWidthPercent: 60 } });
    // Written straight into MongoDB, so it reaches the open page when Meteor
    // next polls the settings (a test database has no change streams).
    await expect.poll(() => boardPage.evaluate(() => getComputedStyle(document.documentElement)
      .getPropertyValue('--wekan-card-details-width')), { timeout: 30_000 }).toContain('60vw');
    const bp = new BoardPage(boardPage);
    const cp = new CardPage(boardPage);
    await bp.clickCard(board.listIds[0], 'Alpha Card');
    await cp.waitForOpen();
    // 60% of the 1600px window.
    await expect.poll(() => width(boardPage)).toBe(960);
    // Negative: a maximized card is not the remembered width.
    await boardPage.locator('.js-card-details .js-maximize-card-details').first().click();
    await expect.poll(() => width(boardPage)).toBeGreaterThan(1500);
  });
});
