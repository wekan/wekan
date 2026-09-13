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
const db = require('../helpers/db');
const BoardPage = require('../pages/BoardPage');
const CardPage = require('../pages/CardPage');

test.describe('Board-level actions', () => {
  test('header collapse sits beside Home and keeps Home and title visible', async ({ boardPage }) => {
    const header = boardPage.locator('#header-quick-access');
    const home = header.locator('.header-home-link');
    const toggle = header.locator('.js-toggle-header-icons-collapsed');
    const title = header.locator('.header-page-title');
    const originalViewport = boardPage.viewportSize();
    try {
      for (const width of [1280, 375]) {
        await boardPage.setViewportSize({ width, height: 900 });
        await expect(home).toBeVisible();
        await expect(toggle).toHaveCount(1);
        await expect(toggle).toBeVisible();
        await expect(title).toBeVisible();
        expect(await home.evaluate(el =>
          el.nextElementSibling?.classList.contains('js-toggle-header-icons-collapsed') &&
          el.nextElementSibling.nextElementSibling?.classList.contains('header-page-title'),
        )).toBe(true);
        const [homeBox, toggleBox] = await Promise.all([home.boundingBox(), toggle.boundingBox()]);
        expect(Math.abs(homeBox.y - toggleBox.y)).toBeLessThan(12);
        const rtl = await header.evaluate(el => getComputedStyle(el).direction === 'rtl');
        if (rtl) expect(toggleBox.x + toggleBox.width).toBeLessThanOrEqual(homeBox.x + 1);
        else expect(toggleBox.x).toBeGreaterThanOrEqual(homeBox.x + homeBox.width - 1);
        if (await header.getAttribute('data-header-icons-collapsed') === 'true') await toggle.click();
        const mode = header.locator('.mobile-mode-toggle');
        await expect(mode).toBeVisible();
        await toggle.click();
        await expect(header).toHaveAttribute('data-header-icons-collapsed', 'true');
        await expect(mode).not.toBeVisible();
        await expect(home).toBeVisible();
        await expect(toggle).toBeVisible();
        await expect(title).toBeVisible();
        await toggle.click();
        await expect(header).toHaveAttribute('data-header-icons-collapsed', 'false');
        await expect(mode).toBeVisible();
      }
    } finally {
      if (originalViewport) await boardPage.setViewportSize(originalViewport);
    }
  });

  test('board settings (board menu) opens from the right sidebar', async ({ boardPage, board }) => {
    // The header Board Settings cog was removed (it is already in the right
    // sidebar). Open the sidebar from the header hamburger if needed, then open
    // the board menu (cog) that lives inside it.
    const boardMenuBtn = boardPage.locator('.board-sidebar .js-open-board-menu');
    if (!(await boardMenuBtn.isVisible().catch(() => false))) {
      // The hamburger moved to the first top header bar and was renamed with
      // it: one control now opens whichever sidebar the page has.
      // docs/Features/Page/Header.md
      await boardPage.locator('.js-toggle-page-sidebar').first().click();
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

  test('#6660: star/unstar persists through the server method', async ({ boardPage, board, user }) => {
    // a.board-header-btn.js-star-board
    const starBtn = boardPage.locator('a.js-star-board').first();
    if (await starBtn.count() > 0) {
      const wasStar = await starBtn.evaluate(el => el.classList.contains('is-active'));
      await starBtn.click();
      await boardPage.waitForTimeout(500);
      // Toggle should have changed the is-active class
      const isStar = await starBtn.evaluate(el => el.classList.contains('is-active'));
      expect(isStar).toBe(!wasStar);
      const persistedStars = expect.poll(
        () => db.findOne('users', { _id: user.id })?.profile?.starredBoards || [],
        { timeout: 10_000 },
      );
      if (isStar) await persistedStars.toContain(board.boardId);
      else await persistedStars.not.toContain(board.boardId);

      // Restore to original state
      await starBtn.click();
      const restoredStars = expect.poll(
        () => db.findOne('users', { _id: user.id })?.profile?.starredBoards || [],
        { timeout: 10_000 },
      );
      if (wasStar) await restoredStars.toContain(board.boardId);
      else await restoredStars.not.toContain(board.boardId);
    } else {
      console.log('Note: js-star-board button not found in board header');
    }

  });

  test('renaming board via popup updates the board title', async ({ boardPage, board }) => {
    const errors = [];
    boardPage.on('pageerror', e => errors.push(e.message));

    // The board name in the main header opens the existing rename form.
    const editTitle = boardPage.locator('#header-quick-access .js-edit-board-title');
    await expect(editTitle).toBeVisible();
    await editTitle.click();
    const pop = boardPage.locator('.js-pop-over');
    await expect(pop).toBeVisible();
    const renamedTitle = `Renamed ${board.boardId}`;
    await pop.locator('input.js-board-name').fill(renamedTitle);
    await pop.locator('input[type=submit]').click();
    await expect.poll(() => db.findOne('boards', { _id: board.boardId }).title)
      .toBe(renamedTitle);
    await expect(boardPage.locator('#header-quick-access .header-page-title')).toHaveText(renamedTitle);

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

  test('member menu opens Boards in Archive and shows archived boards', async ({ boardPage, board }) => {
    const errors = [];
    boardPage.on('pageerror', e => errors.push(e.message));

    const archived = db.seedBoard({ ownerId: board.owner.id, title: `Archived ${board.boardId}` });
    db.updateOne('boards', { _id: archived.boardId }, { $set: { archived: true } });
    try {
      await boardPage.locator('.js-open-header-member-menu').click();
      await boardPage.locator('.js-pop-over .js-open-archived-board').click();
      await expect(boardPage).toHaveURL(/\/allboards\/archive(?:[?#]|$)/);
      await expect(boardPage.locator(`.js-board.${archived.boardId}`)).toBeVisible();
      await expect(boardPage.locator(`.js-board.${board.boardId}`)).toHaveCount(0);
    } finally {
      db.cleanup({ boardIds: [archived.boardId] });
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
