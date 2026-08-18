'use strict';

/**
 * Spec 43 — All Boards page on a phone-sized viewport (#6488).
 *
 * Regression guard for two mobile requirements:
 *  - board icons show AT LEAST 2 per row (menu on the left, boards on the right);
 *  - #content is the single vertical scroller; the board list grows naturally
 *    inside it (nested list/wrapper scrollers broke on invited-board rows).
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
    const invitedBoard = await db.seedBoard({
      ownerId: adminUser.id,
      title: 'Phone invitation board',
    });
    boards.push(invitedBoard);
    db.updateOne('users', { _id: adminUser.id }, {
      $set: { 'profile.invitedBoards': [invitedBoard.boardId] },
    });
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

      // The invitation row contains more than a normal 4rem board icon. The
      // fixed phone tile height used to clip its message and both actions while
      // leaving only the title visible (#6488 comments 9 and 10).
      const invitation = page.locator(`li.js-board.${invitedBoard.boardId}`);
      await expect(invitation).toHaveClass(/is-invited/);
      await expect(invitation.getByText('You are just invited to this board')).toBeVisible();
      await expect(invitation.locator('.js-accept-invite')).toBeVisible();
      await expect(invitation.locator('.js-decline-invite')).toBeVisible();
      const invitationBox = await invitation.boundingBox();
      expect(invitationBox).toBeTruthy();
      for (const control of [
        invitation.getByText('You are just invited to this board'),
        invitation.locator('.js-accept-invite'),
        invitation.locator('.js-decline-invite'),
      ]) {
        const box = await control.boundingBox();
        expect(box).toBeTruthy();
        expect(box.y).toBeGreaterThanOrEqual(invitationBox.y);
        expect(box.y + box.height).toBeLessThanOrEqual(
          invitationBox.y + invitationBox.height + 1,
        );
      }

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

      // There is ONE vertical scroll owner. Nested overflow containers made a
      // swipe depend on where it began and failed when an invitation row grew.
      const m = await list.evaluate(el => ({
        overflowY: getComputedStyle(el).overflowY,
        clientHeight: el.clientHeight,
        scrollHeight: el.scrollHeight,
      }));
      // CSS computes overflow-y:visible to auto when overflow-x is hidden.
      // The capacity assertion is the behavioral contract: the list itself
      // has no vertical range, so #content remains the only scroll owner.
      expect(['visible', 'auto']).toContain(m.overflowY);
      expect(m.scrollHeight).toBeLessThanOrEqual(m.clientHeight + 1);

      const content = await page.locator('#content').evaluate(el => ({
        overflowY: getComputedStyle(el).overflowY,
        clientHeight: el.clientHeight,
        scrollHeight: el.scrollHeight,
      }));
      expect(['auto', 'scroll']).toContain(content.overflowY);
      expect(content.scrollHeight).toBeGreaterThan(content.clientHeight + 4);

      await page.locator('#content').evaluate(el => { el.scrollTop = el.scrollHeight; });
      await expect(tiles.last()).toBeVisible();

    } finally {
      db.updateOne('users', { _id: adminUser.id }, {
        $unset: { 'profile.invitedBoards': '' },
      });
      boards.forEach(b => db.cleanup({ boardIds: [b.boardId] }));
    }
  });
});
