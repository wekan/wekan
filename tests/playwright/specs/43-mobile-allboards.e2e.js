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
    for (let i = 0; i < 8; i++) {
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

      // At least 2 per row: the first two tiles share a row (same top) with the
      // second to the right of the first.
      const b0 = await tiles.nth(0).boundingBox();
      const b1 = await tiles.nth(1).boundingBox();
      expect(b0 && b1).toBeTruthy();
      expect(Math.abs(b0.y - b1.y)).toBeLessThan(b0.height / 2);
      expect(b1.x).toBeGreaterThan(b0.x);

      // The list is a bounded, scrollable container (content overflows its box).
      const list = page.locator('ul.board-list');
      const scrollable = await list.evaluate(el => el.scrollHeight > el.clientHeight + 4);
      expect(scrollable).toBe(true);
    } finally {
      boards.forEach(b => db.cleanup({ boardIds: [b.boardId] }));
    }
  });
});
