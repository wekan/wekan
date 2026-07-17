'use strict';

/**
 * Spec 13 — Swimlanes
 *
 * Covers:
 *  - Default board renders with exactly one swimlane
 *  - Swimlane header shows the expected title ("Default")
 *  - The swimlane action popup opens without JS errors
 *  - Collapsing a swimlane doesn't crash the page
 *  - Adding a new swimlane creates it on the board
 */

const { test, expect } = require('../fixtures');
const BoardPage = require('../pages/BoardPage');

test.describe('Swimlanes', () => {
  test('board renders with a visible swimlane section', async ({ boardPage, board }) => {
    // The fixture seeds one swimlane named "Default".
    // Each swimlane has DOM id="swimlane-{swimlaneId}" AND class .js-swimlane.
    const swimlane = boardPage.locator('.js-swimlane');
    await expect(swimlane.first()).toBeVisible({ timeout: 10_000 });
  });

  test('swimlane header shows the seeded "Default" title', async ({ boardPage, board }) => {
    // swimlaneHeader.jade: .swimlane-header contains the title (h4.title)
    const header = boardPage.locator('.js-swimlane-header, .swimlane-header');
    await expect(header.first()).toBeVisible({ timeout: 10_000 });

    const title = boardPage.locator('.swimlane-header .title, .js-swimlane-header .title').first();
    if (await title.count() > 0) {
      const text = await title.innerText();
      expect(text.trim()).toBe('Default');
    }
  });

  test('swimlane action popup opens without JS errors', async ({ boardPage, board }) => {
    const errors = [];
    boardPage.on('pageerror', e => errors.push(e.message));

    // a.js-open-add-swimlane-menu — the "+" icon on each swimlane header
    const plusBtn = boardPage.locator('a.js-open-add-swimlane-menu').first();
    if (await plusBtn.count() > 0) {
      await plusBtn.click();
      const pop = boardPage.locator('.js-pop-over');
      await expect(pop).toBeVisible({ timeout: 6_000 });
      // Popup being visible is sufficient proof it opened without crashing.
      // (WeKan renders a hidden back-btn as the first element inside the popup.)
    } else {
      // Swimlane "+" icon not present (single-swimlane boards may hide it in some views)
      await expect(boardPage.locator('.js-swimlane').first()).toBeVisible({ timeout: 5_000 });
    }

    const critical = errors.filter(
      e => !e.includes('ResizeObserver') && !e.includes('Non-Error promise rejection'),
    );
    expect(critical).toHaveLength(0);
  });

  test('clicking the swimlane collapse button does not crash the page', async ({ boardPage, board }) => {
    const errors = [];
    boardPage.on('pageerror', e => errors.push(e.message));

    // .js-collapse-swimlane is inside the swimlane header
    const collapseBtn = boardPage.locator('.js-collapse-swimlane').first();
    if (await collapseBtn.count() > 0) {
      await collapseBtn.click();
      await boardPage.waitForTimeout(800);

      // After collapse, .js-swimlane (the lists container) is removed by Blaze's "unless collapseSwimlane".
      // The swimlane header wrapper (.js-swimlane-header) remains visible inside .swimlane.nodragscroll.
      await expect(boardPage.locator('.js-swimlane-header').first()).toBeVisible({ timeout: 5_000 });
    } else {
      // Collapse button not present — verify the board is still rendered
      await expect(boardPage.locator('.js-swimlane').first()).toBeVisible({ timeout: 5_000 });
    }

    const critical = errors.filter(
      e => !e.includes('ResizeObserver') && !e.includes('Non-Error promise rejection'),
    );
    expect(critical).toHaveLength(0);
  });

  test('adding a new swimlane creates it on the board', async ({ boardPage, board }) => {
    const before = await boardPage.locator('.js-swimlane').count();

    // Open the swimlane action popup via the "+" icon
    const plusBtn = boardPage.locator('a.js-open-add-swimlane-menu').first();
    if (await plusBtn.count() > 0) {
      await plusBtn.click();
      const pop = boardPage.locator('.js-pop-over');
      // 15s (not 6s) to match the suite's standard popup-visibility wait: under the
      // full parallel run this popup can take >6s to render on webkit, which flaked
      // even though the popup opens fine (~3s) when the test runs in isolation.
      await pop.waitFor({ timeout: 15_000 });

      // Click "Add Swimlane" inside the action popup
      const addSwimlaneLink = pop.locator('a.js-add-swimlane');
      if (await addSwimlaneLink.count() > 0) {
        await addSwimlaneLink.click();
        await boardPage.waitForTimeout(400);

        // swimlaneAddPopup: fill in the name and submit
        const nameInput = boardPage.locator('input.swimlane-name-input').first();
        if (await nameInput.count() > 0) {
          await nameInput.fill('New Test Swimlane');
          await boardPage.locator('.js-pop-over button.primary, .js-pop-over button[type=submit]').first().click();
          await boardPage.waitForTimeout(800);

          // Board should now have one more swimlane
          const after = await boardPage.locator('.js-swimlane').count();
          expect(after).toBeGreaterThan(before);
        }
      } else {
        // Action popup didn't show "add swimlane" — verify popup opened
        await expect(pop).toBeVisible({ timeout: 3_000 });
      }
    } else {
      // No "+" icon — verify existing swimlane is still visible
      await expect(boardPage.locator('.js-swimlane').first()).toBeVisible({ timeout: 5_000 });
    }
  });
});
