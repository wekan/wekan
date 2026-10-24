'use strict';
// #6801: a list's resize handle is on its inline END - the right edge
// left-to-right, the LEFT edge right-to-left. Dragging the handle away from
// the list must widen it in both directions; right-to-left it narrowed.
const { test, expect } = require('../fixtures');

async function dragHandle(page, dir, outward) {
  await page.evaluate((d) => document.documentElement.setAttribute('dir', d), dir);
  const list = page.locator('.js-list').filter({ has: page.locator('.js-list-resize-handle') }).first();
  await list.waitFor({ timeout: 30_000 });
  await list.hover();
  const handle = list.locator('.js-list-resize-handle');
  await expect(handle).toBeVisible();
  const before = (await list.boundingBox()).width;
  const box = await handle.boundingBox();
  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;
  // Outward is to the right left-to-right and to the left right-to-left.
  const dx = (dir === 'rtl' ? -1 : 1) * outward;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + dx, y, { steps: 10 });
  await page.mouse.up();
  await page.waitForTimeout(300);
  return (await list.boundingBox()).width - before;
}

for (const dir of ['ltr', 'rtl']) {
  test(`${dir}: dragging a list's resize handle outward widens the list`, async ({ boardPage: page }) => {
    const grown = await dragHandle(page, dir, 80);
    expect(grown, `${dir}: the list follows the handle`).toBeGreaterThan(40);
  });

  test(`${dir}: dragging a list's resize handle inward narrows the list`, async ({ boardPage: page }) => {
    // Negative: widen first, so there is room above the minimum width, then
    // drag back in - it must narrow, not grow.
    await dragHandle(page, dir, 120);
    const shrunk = await dragHandle(page, dir, -60);
    expect(shrunk, `${dir}: the list follows the handle back`).toBeLessThan(-30);
  });
}
