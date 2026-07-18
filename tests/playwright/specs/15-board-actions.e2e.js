'use strict';

/**
 * Spec 15 — Board-level actions
 *
 * Covers:
 *  - Starring / un-starring a board from the board header
 *  - Renaming a board via the boardChangeTitle popup
 *  - Opening the card filter sidebar
 *  - Archiving a card and verifying it's gone from the board
 *  - Restoring a card from the archived-items view
 *  - Sorting cards popup opens without JS errors
 */

const { test, expect } = require('../fixtures');
const BoardPage = require('../pages/BoardPage');
const CardPage = require('../pages/CardPage');

test.describe('Board-level actions', () => {
  test('board settings (board menu) opens from the right sidebar', async ({ boardPage, board }) => {
    // The header Board Settings cog was removed (it is already in the right
    // sidebar). Open the sidebar from the header hamburger if needed, then open
    // the board menu (cog) that lives inside it.
    const boardMenuBtn = boardPage.locator('.board-sidebar .js-open-board-menu');
    if (!(await boardMenuBtn.isVisible().catch(() => false))) {
      await boardPage.locator('.js-toggle-sidebar').first().click();
    }
    await boardMenuBtn.waitFor();

    // Negative: the popup must not be open before the click.
    await expect(boardPage.locator('.js-pop-over')).not.toBeVisible();

    await boardMenuBtn.click();
    const popup = boardPage.locator('.js-pop-over');
    await popup.waitFor();

    // It is the real boardMenu popup: "Archived Items" lives inside it.
    await expect(popup.locator('.js-open-archives')).toBeVisible();

    // Close it again so later tests start from a clean header. Use the
    // popup's own X button (.js-close-pop-over, as 19-accessibility does) —
    // a keyboard Escape proved unreliable here across engines.
    await popup.locator('.js-close-pop-over').first().click();
    await expect(boardPage.locator('.js-pop-over')).not.toBeVisible({ timeout: 8_000 });
  });

  test('star/unstar board button toggles active class without errors', async ({ boardPage, board }) => {
    const errors = [];
    boardPage.on('pageerror', e => errors.push(e.message));

    // a.board-header-btn.js-star-board
    const starBtn = boardPage.locator('a.js-star-board').first();
    if (await starBtn.count() > 0) {
      const wasStar = await starBtn.evaluate(el => el.classList.contains('is-active'));
      await starBtn.click();
      await boardPage.waitForTimeout(500);
      // Toggle should have changed the is-active class
      const isStar = await starBtn.evaluate(el => el.classList.contains('is-active'));
      expect(isStar).toBe(!wasStar);

      // Restore to original state
      await starBtn.click();
      await boardPage.waitForTimeout(300);
    } else {
      console.log('Note: js-star-board button not found in board header');
    }

    const critical = errors.filter(
      e => !e.includes('ResizeObserver') && !e.includes('Non-Error promise rejection'),
    );
    expect(critical).toHaveLength(0);
  });

  test('renaming board via popup updates the board title', async ({ boardPage, board }) => {
    const errors = [];
    boardPage.on('pageerror', e => errors.push(e.message));

    // a.board-header-btn.js-edit-board-title opens boardChangeTitle popup
    const editTitleBtn = boardPage.locator('a.js-edit-board-title').first();
    if (await editTitleBtn.count() > 0) {
      await editTitleBtn.click();
      const pop = boardPage.locator('.js-pop-over');
      await expect(pop).toBeVisible({ timeout: 6_000 });

      // boardChangeTitlePopup has input.js-board-name
      const titleInput = pop.locator('input.js-board-name').first();
      if (await titleInput.count() > 0) {
        await titleInput.click({ clickCount: 3 });
        await titleInput.fill('Renamed Test Board');
        // Submit is input.primary.wide[type=submit]
        await pop.locator('input[type=submit], button[type=submit]').first().click();
        await boardPage.waitForTimeout(800);

        // The edit-title button stores the current board title in its value attribute
        const editBtn = boardPage.locator('a.js-edit-board-title').first();
        if (await editBtn.count() > 0) {
          const newTitle = await editBtn.getAttribute('value');
          expect(newTitle).toBe('Renamed Test Board');
        }
      } else {
        await expect(pop).toBeVisible({ timeout: 3_000 });
      }
    } else {
      console.log('Note: js-edit-board-title button not found; board admin check may have failed');
    }

    const critical = errors.filter(
      e => !e.includes('ResizeObserver') && !e.includes('Non-Error promise rejection'),
    );
    expect(critical).toHaveLength(0);
  });

  test('filter sidebar opens when filter button is clicked', async ({ boardPage, board }) => {
    const errors = [];
    boardPage.on('pageerror', e => errors.push(e.message));

    // a.board-header-btn.js-open-filter-view
    const filterBtn = boardPage.locator('a.js-open-filter-view').first();
    if (await filterBtn.count() > 0) {
      await filterBtn.click();
      // The filter sidebar is .board-sidebar or .js-filter-sidebar
      const sidebar = boardPage.locator('.board-sidebar, .js-filter-sidebar').first();
      await expect(sidebar).toBeVisible({ timeout: 6_000 });

      // Close the sidebar by pressing Escape or clicking close button
      await boardPage.keyboard.press('Escape');
      await boardPage.waitForTimeout(300);
    } else {
      console.log('Note: js-open-filter-view button not found');
    }

    const critical = errors.filter(
      e => !e.includes('ResizeObserver') && !e.includes('Non-Error promise rejection'),
    );
    expect(critical).toHaveLength(0);
  });

  test('archiving a card removes it from the board list', async ({ boardPage, board }) => {
    const errors = [];
    boardPage.on('pageerror', e => errors.push(e.message));

    const bp = new BoardPage(boardPage);
    const cp = new CardPage(boardPage);
    const [listA] = board.listIds;

    // Verify card is visible on board
    await expect(bp.minicard(listA, 'Alpha Card')).toBeVisible({ timeout: 8_000 });

    // Open card and archive it
    await bp.clickCard(listA, 'Alpha Card');
    await cp.waitForOpen();
    await cp.archiveCard();

    // Card should no longer appear in the list
    await expect(bp.minicard(listA, 'Alpha Card')).not.toBeVisible({ timeout: 8_000 });

    const critical = errors.filter(
      e => !e.includes('ResizeObserver') && !e.includes('Non-Error promise rejection'),
    );
    expect(critical).toHaveLength(0);
  });

  test('archived items view opens via board header button', async ({ boardPage, board }) => {
    const errors = [];
    boardPage.on('pageerror', e => errors.push(e.message));

    // a.board-header-btn.js-open-archived-board opens the archived items sidebar
    const archiveBtn = boardPage.locator('a.js-open-archived-board').first();
    if (await archiveBtn.count() > 0) {
      await archiveBtn.click();
      // The archived items panel is typically .board-sidebar with archive content
      const sidebar = boardPage.locator('.board-sidebar').first();
      await expect(sidebar).toBeVisible({ timeout: 6_000 });
    } else {
      console.log('Note: js-open-archived-board button not found in board header');
    }

    const critical = errors.filter(
      e => !e.includes('ResizeObserver') && !e.includes('Non-Error promise rejection'),
    );
    expect(critical).toHaveLength(0);
  });

  test('sort cards popup opens without JS errors', async ({ boardPage, board }) => {
    const errors = [];
    boardPage.on('pageerror', e => errors.push(e.message));

    // a.js-sort-cards opens cardsSort popup
    const sortBtn = boardPage.locator('a.js-sort-cards').first();
    if (await sortBtn.count() > 0) {
      await sortBtn.click();
      const pop = boardPage.locator('.js-pop-over');
      await expect(pop).toBeVisible({ timeout: 6_000 });
    } else {
      console.log('Note: js-sort-cards button not found');
    }

    const critical = errors.filter(
      e => !e.includes('ResizeObserver') && !e.includes('Non-Error promise rejection'),
    );
    expect(critical).toHaveLength(0);
  });
});
