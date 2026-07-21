'use strict';

/**
 * Spec 43 — All Boards page on a phone-sized viewport (#6488).
 *
 * Regression guard for two mobile requirements:
 *  - board icons show AT LEAST 2 per row (menu on the left, boards on the right);
 *  - the board list is a bounded, scrollable container (the old CSS forced it
 *    min-height:100vh so it grew to fit and, clipped by the overflow:hidden wrapper,
 *    boards below the fold were unreachable — "you can't scroll boards on mobile").
 */

const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const { loginWithToken } = require('../helpers/auth');

const BASE_URL = process.env.WEKAN_BASE_URL || 'http://localhost:3000';

test.describe('All Boards – phone viewport (#6488)', () => {
  // iPhone 12 mini-ish portrait.
  test.use({ viewport: { width: 375, height: 667 }, storageState: undefined });

  test('board icons show at least 2 per row and the list scrolls', async ({ page, adminUser }) => {
    const boards = [];
    for (let i = 0; i < 12; i++) {
      boards.push(await db.seedBoard({ ownerId: adminUser.id, title: `MobileBoard ${i}` }));
    }
    try {
      await loginWithToken(page, adminUser.id, adminUser.token);
      await page.goto(BASE_URL, { waitUntil: 'networkidle' });

      // Boards not dragged into a workspace appear under "Remaining".
      const remaining = page.locator('.menu-item').filter({ hasText: /remaining/i });
      await remaining.waitFor({ timeout: 20_000 });
      await remaining.click();

      const tiles = page.locator('ul.board-list li.js-board');
      await expect(tiles.first()).toBeVisible({ timeout: 15_000 });
      expect(await tiles.count()).toBeGreaterThanOrEqual(4);

      // At least 2 per row. Measure EVERY tile in the list (including the leading
      // "+ Add board" tile, which occupies the first grid cell and offsets the
      // first two boards onto different rows), then cluster tiles by their top
      // and assert the top row holds >=2 tiles at two distinct x columns. This
      // verifies the 2-column grid directly, without assuming which board lands
      // where.
      const allTiles = page.locator('ul.board-list li');
      const count = await allTiles.count();
      const boxes = [];
      for (let i = 0; i < count; i++) {
        const bb = await allTiles.nth(i).boundingBox();
        if (bb) boxes.push(bb);
      }
      expect(boxes.length).toBeGreaterThanOrEqual(4);
      const rowH = Math.min(...boxes.map(b => b.height));
      const top = Math.min(...boxes.map(b => b.y));
      const firstRow = boxes.filter(b => Math.abs(b.y - top) < rowH / 2);
      // Two or more tiles share the top row...
      expect(firstRow.length).toBeGreaterThanOrEqual(2);
      // ...at two or more distinct x positions (real columns, not overlap).
      const xs = [...new Set(firstRow.map(b => Math.round(b.x)))].sort((a, b) => a - b);
      expect(xs.length).toBeGreaterThanOrEqual(2);
      expect(xs[1]).toBeGreaterThan(xs[0]);

      // Layout: the board list sits to the RIGHT of the left menu (side-by-side), NOT
      // stacked below it. Stacking pushed the boards under the menu + search bar, and
      // since dragscroll does not work over that area you could not drag-scroll down
      // to the boards. The board list's left edge must be at/after the menu's right.
      const list = page.locator('ul.board-list');
      const menuBox = await page.locator('.boards-left-menu').boundingBox();
      const listBox = await list.boundingBox();
      expect(menuBox && listBox).toBeTruthy();
      expect(listBox.x).toBeGreaterThanOrEqual(menuBox.x + menuBox.width - 2);

      // The list must be a BOUNDED, scrollable container so boards below the fold
      // are reachable (not clipped by the surrounding overflow:hidden). Assert the
      // invariant the CSS guarantees — a scroll container whose height is bounded
      // to the viewport — instead of requiring the current board count to overflow
      // it (which depends on exact tile height vs viewport and is flaky). An
      // unbounded list that grew to fit all its boards fails clientHeight<=viewport.
      const m = await list.evaluate(el => ({
        overflowY: getComputedStyle(el).overflowY,
        clientHeight: el.clientHeight,
        scrollHeight: el.scrollHeight,
        viewport: window.innerHeight,
      }));
      expect(['auto', 'scroll']).toContain(m.overflowY);
      expect(m.clientHeight).toBeLessThanOrEqual(m.viewport);
      // When there are more boards than fit, the bounded box actually scrolls.
      if (m.scrollHeight > m.viewport) {
        expect(m.scrollHeight).toBeGreaterThan(m.clientHeight + 4);
      }

      // The left menu is its own bounded scroll area too, so a tall menu's lower
      // items (many workspaces) can be drag-scrolled to instead of being clipped by
      // the fixed-height wrapper.
      const menu = await page.locator('.boards-left-menu').evaluate(el => ({
        overflowY: getComputedStyle(el).overflowY,
        clientHeight: el.clientHeight,
        viewport: window.innerHeight,
      }));
      expect(['auto', 'scroll']).toContain(menu.overflowY);
      expect(menu.clientHeight).toBeLessThanOrEqual(menu.viewport);
    } finally {
      boards.forEach(b => db.cleanup({ boardIds: [b.boardId] }));
    }
  });
});
