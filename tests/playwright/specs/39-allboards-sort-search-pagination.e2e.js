'use strict';

/**
 * Spec 39 — All Boards sort / search / pagination (#5799)
 *
 * Covers the All Boards page features added in #5799:
 *   - Sort button: Custom (manual drag order, default) / Title A→Z / Title Z→A,
 *     stored per user in profile.allBoardsSortBy.
 *   - Board-name search box that spans every category.
 *   - Server-side pagination of the board grid in the sorted modes
 *     (getAllBoardsPage), with the page resolved against the effective user.
 *
 * Includes positive AND negative cases.
 */

const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const { loginWithToken } = require('../helpers/auth');

const BASE_URL = process.env.WEKAN_BASE_URL || 'http://localhost:3000';

function callMethod(page, name, ...args) {
  return page.evaluate(
    ({ name, args }) =>
      new Promise(resolve => {
        Meteor.call(name, ...args, (err, res) =>
          resolve(err ? { error: err.reason || err.error || err.message } : { result: res ?? null }),
        );
      }),
    { name, args },
  );
}

async function boardNames(page) {
  return page.$$eval('li.js-board .board-list-item-name', els =>
    els.map(el => (el.textContent || '').trim()).filter(Boolean),
  );
}

// Open the All Boards page and switch to the "Remaining" sub-view, where boards
// not assigned to a workspace (and not starred) appear.
async function gotoRemaining(page) {
  await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
  const remaining = page.locator('.js-select-menu[data-type="remaining"]');
  await remaining.first().waitFor({ timeout: 15_000 });
  await remaining.first().click();
}

test.describe('#5799 All Boards sort / search / pagination', () => {
  test.describe('sort + search (UI)', () => {
    // Three boards owned by `user`, with out-of-order names so sorting is observable.
    const seeded = [];
    test.beforeEach(({ user }) => {
      seeded.length = 0;
      for (const title of ['Zebra Board', 'Apple Board', 'Mango Board']) {
        seeded.push(db.seedBoard({ ownerId: user.id, title }));
      }
    });
    test.afterEach(() => {
      db.cleanup({ boardIds: seeded.map(b => b.boardId) });
    });

    test('Title A→Z and Z→A sort the board grid; custom hides pagination', async ({ page, user }) => {
      await loginWithToken(page, user.id, user.token);
      await gotoRemaining(page);

      // Default (custom) mode: the seeded boards are visible and there are no
      // server-pagination controls.
      await expect
        .poll(() => boardNames(page), { timeout: 15_000 })
        .toEqual(expect.arrayContaining(['Zebra Board', 'Apple Board', 'Mango Board']));
      expect(await page.locator('.boards-pagination').count()).toBe(0);

      // Switch to Title A→Z via the Sort popup.
      await page.locator('.js-open-boards-sort').click();
      await page.locator('a.js-boards-sort[data-sort="title-asc"]').click();
      await expect
        .poll(async () => {
          const names = (await boardNames(page)).filter(n => /Board$/.test(n));
          return names.join('|');
        }, { timeout: 15_000 })
        .toBe('Apple Board|Mango Board|Zebra Board');

      // Switch to Title Z→A.
      await page.locator('.js-open-boards-sort').click();
      await page.locator('a.js-boards-sort[data-sort="title-desc"]').click();
      await expect
        .poll(async () => {
          const names = (await boardNames(page)).filter(n => /Board$/.test(n));
          return names.join('|');
        }, { timeout: 15_000 })
        .toBe('Zebra Board|Mango Board|Apple Board');
    });

    test('search filters boards by name; non-matching search shows none', async ({ page, user }) => {
      await loginWithToken(page, user.id, user.token);
      await gotoRemaining(page);
      await expect.poll(() => boardNames(page), { timeout: 15_000 })
        .toEqual(expect.arrayContaining(['Apple Board']));

      const search = page.locator('.js-board-search-input');

      // Positive: partial, case-insensitive match narrows to one board.
      await search.fill('apple');
      await expect
        .poll(async () => (await boardNames(page)).filter(n => /Board$/.test(n)), { timeout: 15_000 })
        .toEqual(['Apple Board']);

      // Negative: a term that matches nothing yields an empty grid.
      await search.fill('this-board-does-not-exist-xyz');
      await expect
        .poll(async () => (await boardNames(page)).filter(n => /Board$/.test(n)), { timeout: 15_000 })
        .toEqual([]);

      // Clearing the search restores the boards.
      await page.locator('.js-board-search-clear').click();
      await expect
        .poll(async () => (await boardNames(page)).filter(n => /Board$/.test(n)).sort(), { timeout: 15_000 })
        .toEqual(['Apple Board', 'Mango Board', 'Zebra Board']);
    });
  });

  test.describe('getAllBoardsPage (server)', () => {
    // Seed enough boards to exercise pagination deterministically.
    const seeded = [];
    test.beforeEach(({ user }) => {
      seeded.length = 0;
      // Names Board 01 .. Board 30 so title sort order is predictable.
      for (let i = 1; i <= 30; i++) {
        const title = `Board ${String(i).padStart(2, '0')}`;
        seeded.push(db.seedBoard({ ownerId: user.id, title }));
      }
    });
    test.afterEach(() => {
      db.cleanup({ boardIds: seeded.map(b => b.boardId) });
    });

    test('returns the correct sorted page and total; pages do not overlap', async ({ page, user }) => {
      await loginWithToken(page, user.id, user.token);
      await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });

      // Positive: page 1, perPage 10, title-asc → 10 ids, total >= 30.
      const p1 = await callMethod(page, 'getAllBoardsPage', {
        search: '', sortBy: 'title-asc', menu: 'remaining', page: 1, perPage: 10,
      });
      expect(p1.result).toBeTruthy();
      expect(p1.result.ids.length).toBe(10);
      expect(p1.result.total).toBeGreaterThanOrEqual(30);

      const p2 = await callMethod(page, 'getAllBoardsPage', {
        search: '', sortBy: 'title-asc', menu: 'remaining', page: 2, perPage: 10,
      });
      expect(p2.result.ids.length).toBe(10);

      // Negative: pages must not overlap.
      const overlap = p1.result.ids.filter(id => p2.result.ids.includes(id));
      expect(overlap).toEqual([]);

      // title-desc page 1 starts from the opposite end (no overlap with asc page 1
      // when there are more than 2*perPage boards).
      const d1 = await callMethod(page, 'getAllBoardsPage', {
        search: '', sortBy: 'title-desc', menu: 'remaining', page: 1, perPage: 10,
      });
      const ascDescOverlap = p1.result.ids.filter(id => d1.result.ids.includes(id));
      expect(ascDescOverlap).toEqual([]);
    });

    test('search narrows the total; a non-matching search returns nothing', async ({ page, user }) => {
      await loginWithToken(page, user.id, user.token);
      await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });

      // Positive: searching "Board 0" matches Board 01..09 (9 boards).
      const hit = await callMethod(page, 'getAllBoardsPage', {
        search: 'Board 0', sortBy: 'title-asc', menu: 'remaining', page: 1, perPage: 100,
      });
      expect(hit.result.total).toBe(9);
      expect(hit.result.ids.length).toBe(9);

      // Negative: a term matching no board returns an empty page and zero total.
      const miss = await callMethod(page, 'getAllBoardsPage', {
        search: 'zzz-nonexistent-zzz', sortBy: 'title-asc', menu: 'remaining', page: 1, perPage: 100,
      });
      expect(miss.result.total).toBe(0);
      expect(miss.result.ids).toEqual([]);
    });

    test('does not leak boards the user has no access to (negative)', async ({ page, user, user2 }) => {
      // A private board owned by user2 that `user` is NOT a member of.
      const other = db.seedBoard({ ownerId: user2.id, title: 'Secret User2 Board' });
      try {
        await loginWithToken(page, user.id, user.token);
        await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });

        const res = await callMethod(page, 'getAllBoardsPage', {
          search: 'Secret User2 Board', sortBy: 'title-asc', menu: 'remaining', page: 1, perPage: 100,
        });
        expect(res.result.total).toBe(0);
        expect(res.result.ids).toEqual([]);
      } finally {
        db.cleanup({ boardIds: [other.boardId] });
      }
    });
  });
});
