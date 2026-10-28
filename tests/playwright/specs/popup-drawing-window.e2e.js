'use strict';

// The card's Drawing popup moves like the opened card - by its title bar or
// its drag handle - and has the opened card's maximize / minimize button.
// Minimizing puts it back where it was dragged, a maximized popup is not
// dragged, and maximized the drawing takes the window (d5d027a6f2; it used to
// keep an 800 x 500 shape). Opened from the card's menu at the right of the
// window, it is kept inside the window as it grows (client/lib/popupBounds.js).

const { test, expect } = require('../fixtures');
const BoardPage = require('../pages/BoardPage');
const CardPage = require('../pages/CardPage');

async function openDrawing(page, board) {
  const bp = new BoardPage(page);
  const cp = new CardPage(page);
  await bp.clickCard(board.listIds[0], 'Alpha Card');
  await cp.waitForOpen();
  await cp.root.locator('.js-open-card-details-menu').first().click();
  await page.locator('.js-pop-over .js-card-drawing').click();
  const popup = page.locator('.js-pop-over[data-popup="cardDrawingPopup"]');
  await expect(popup).toBeVisible({ timeout: 15_000 });
  // The Drawing popup is the card menu's popup element, renamed: for a moment
  // it still had the 960px menu's place, a box measured then was the menu's,
  // and the drag pressed outside the popup once it had moved - selecting the
  // page's text and closing it (Chromium). So: its drawing, then a box that
  // stays put.
  await expect(popup.locator('.js-drawing-surface')).toBeVisible();
  let last = '';
  await expect.poll(async () => {
    const b = await popup.boundingBox();
    const now = b ? [b.x, b.y, b.width, b.height].map(Math.round).join() : '';
    const settled = now !== '' && now === last;
    last = now;
    return settled;
  }, { intervals: [150] }).toBe(true);
  return popup;
}

async function drag(page, locator, dx, dy) {
  const b = await locator.boundingBox();
  const x = b.x + Math.min(20, b.width / 2);
  const y = b.y + b.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + dx / 2, y + dy / 2, { steps: 4 });
  await page.mouse.move(x + dx, y + dy, { steps: 4 });
  await page.mouse.up();
}

test('the Drawing popup is dragged by its title bar and its handle', async ({ boardPage: page, board }) => {
  await page.evaluate(() => { try { localStorage.removeItem('wekan-popup-maximized-cardDrawingPopup'); } catch (e) { /* none */ } });
  const popup = await openDrawing(page, board);
  const viewport0 = page.viewportSize();
  // Opened from the card's menu at the right, it is wholly inside the window.
  await expect.poll(async () => { const b = await popup.boundingBox(); return b.x + b.width; })
    .toBeLessThanOrEqual(viewport0.width - 11);
  const before = await popup.boundingBox();

  // Toward the side that has room, so the popup is not stopped at an edge: the
  // 860px popup kept inside at the right starts left of the middle with no
  // room to its right.
  const viewport = page.viewportSize();
  const dx = viewport.width - 12 - (before.x + before.width) >= 80 ? 80 : -80;
  const dy = before.y > viewport.height / 3 ? -40 : 40;
  await drag(page, popup.locator('.header-title'), dx, dy);
  const afterTitle = await popup.boundingBox();
  // Kept 12px inside the window: a tall popup has no room to go further down.
  const clampY = y => Math.max(12, Math.min(viewport.height - before.height - 12, y));
  expect(Math.abs(afterTitle.x - (before.x + dx))).toBeLessThan(6);
  expect(Math.abs(afterTitle.y - clampY(before.y + dy))).toBeLessThan(8);

  // The handle is there only while drag handles are on, as on the opened card
  // (Member Settings / Show desktop drag handles); without it the title bar is
  // the way, which is what the second drag then uses.
  const handles = (await popup.locator('.js-popup-drag-handle').count()) > 0;
  await drag(page, popup.locator(handles ? '.js-popup-drag-handle' : '.header-title'), -dx / 2, -dy / 2);
  const afterHandle = await popup.boundingBox();
  expect(Math.abs(afterHandle.x - (afterTitle.x - dx / 2))).toBeLessThan(6);
  expect(Math.abs(afterHandle.y - clampY(afterTitle.y - dy / 2))).toBeLessThan(8);
});

test('maximize fills the window, minimize puts it back, and maximized it is not dragged', async ({ boardPage: page, board }) => {
  await page.evaluate(() => { try { localStorage.removeItem('wekan-popup-maximized-cardDrawingPopup'); } catch (e) { /* none */ } });
  const popup = await openDrawing(page, board);
  const viewport = page.viewportSize();
  const start = await popup.boundingBox();
  await drag(page, popup.locator('.header-title'), start.x > viewport.width / 2 ? -60 : 60, start.y > viewport.height / 3 ? -30 : 30);
  const placed = await popup.boundingBox();

  await popup.locator('.js-popup-maximize').click();
  await expect(popup).toHaveClass(/pop-over--maximized/);
  const max = await popup.boundingBox();
  expect(max.width).toBeGreaterThan(viewport.width - 40);
  expect(max.height).toBeGreaterThan(viewport.height - 40);
  // Maximized, the drawing takes the window, not an 800 x 500 shape.
  await expect.poll(async () => (await popup.locator('.js-drawing-surface').boundingBox()).width)
    .toBeGreaterThan(viewport.width * 0.85);

  // Negative: a maximized popup stays where it is.
  await drag(page, popup.locator('.header-title'), 100, 100);
  const still = await popup.boundingBox();
  expect(Math.abs(still.x - max.x)).toBeLessThan(2);
  expect(Math.abs(still.y - max.y)).toBeLessThan(2);

  await popup.locator('.js-popup-minimize').click();
  await expect(popup).not.toHaveClass(/pop-over--maximized/);
  const back = await popup.boundingBox();
  expect(Math.abs(back.x - placed.x)).toBeLessThan(3);
  expect(Math.abs(back.y - placed.y)).toBeLessThan(3);
  expect(Math.abs(back.width - placed.width)).toBeLessThan(3);
});

test('a Drawing popup left maximized opens maximized again', async ({ boardPage: page, board }) => {
  let popup = await openDrawing(page, board);
  await popup.locator('.js-popup-maximize').click();
  await popup.locator('.js-close-pop-over').click();
  await expect(popup).toHaveCount(0);

  await page.locator('.js-open-card-details-menu').first().click();
  await page.locator('.js-pop-over .js-card-drawing').click();
  popup = page.locator('.js-pop-over[data-popup="cardDrawingPopup"]');
  await expect(popup).toHaveClass(/pop-over--maximized/);
  await expect(popup.locator('.js-popup-minimize')).toBeVisible();
  await popup.locator('.js-popup-minimize').click();
  await expect(popup).not.toHaveClass(/pop-over--maximized/);
});
