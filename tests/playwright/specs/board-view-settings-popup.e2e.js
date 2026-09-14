'use strict';
const { test, expect } = require('../fixtures');

test('Board View Settings stays visible and supports title drag and resizing', async ({ boardPage: page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.evaluate(() => {
    Popup.close();
    const opener = document.querySelector('.js-open-board-view-settings') || document.body;
    Popup.open('boardViewSettings', { titleKey: 'board-view' })({
      currentTarget: opener, target: opener, preventDefault() {}, stopPropagation() {},
    });
  });
  const popup = page.locator('.pop-over[data-popup="boardViewSettingsPopup"]');
  await expect(popup).toBeVisible();
  const initial = await popup.boundingBox();
  expect(initial.x).toBeGreaterThanOrEqual(0);
  expect(initial.x + initial.width).toBeLessThanOrEqual(1280);
  expect(initial.y + initial.height).toBeLessThanOrEqual(900);
  const title = await popup.locator('.header-title').boundingBox();
  await page.mouse.move(title.x + title.width / 2, title.y + title.height / 2);
  await page.mouse.down();
  await page.mouse.move(title.x + title.width / 2 - 100, title.y + title.height / 2 + 30);
  await page.mouse.up();
  const moved = await popup.boundingBox();
  expect(moved.x).toBeLessThan(initial.x);
  expect(moved.y).toBeGreaterThan(initial.y);
  const grip = popup.locator('.js-date-popup-resize');
  await expect(grip).toBeVisible();
  await grip.focus();
  await page.keyboard.press('ArrowRight');
  const resized = await popup.boundingBox();
  expect(resized.width).toBeGreaterThan(moved.width);
  const corner = await grip.boundingBox();
  await page.mouse.move(corner.x + 10, corner.y + 10);
  await page.mouse.down();
  await page.mouse.move(corner.x + 30, corner.y + 30);
  await page.mouse.up();
  expect((await popup.boundingBox()).width).toBeGreaterThan(resized.width);
  await popup.locator('.js-close-pop-over').click();
  await expect(popup).not.toBeVisible();
});
