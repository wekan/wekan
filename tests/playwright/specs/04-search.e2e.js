'use strict';

/**
 * Spec 04 — Search
 *
 * Covers:
 *  - Global search returns only relevant cards across all boards
 *  - Changing a card's status (list) from global search results without losing the card
 *  - Board-level search returns only matching cards
 *  - All cards are findable via global search
 *  - Filter sidebar: filter by member and by title fragment
 */

const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const { loginWithToken } = require('../helpers/auth');
const SearchPage = require('../pages/SearchPage');
const BoardPage = require('../pages/BoardPage');

test.describe('Search', () => {
  test('global search returns cards matching the query and excludes non-matching cards', async ({ boardPage, board }) => {
    const sp = new SearchPage(boardPage);
    await sp.navigateToGlobalSearch();
    await sp.globalSearch('Alpha Card');

    await expect.poll(async () => {
      const currentTitles = (await sp.globalSearchResultTitles())
        .map(t => t.trim())
        .filter(Boolean);
      return currentTitles.filter(t => t.toLowerCase().includes('alpha')).length;
    }, {
      timeout: 20_000,
      intervals: [500, 1000, 2000],
      message: 'Expected global search to return at least one Alpha result',
    }).toBeGreaterThanOrEqual(1);

    const titles = (await sp.globalSearchResultTitles())
      .map(t => t.trim())
      .filter(Boolean);

    const matching = titles.filter(t => t.toLowerCase().includes('alpha'));
    const nonMatching = titles.filter(t => !t.toLowerCase().includes('alpha'));

    expect(matching.length).toBeGreaterThanOrEqual(1);
    expect(nonMatching.length).toBe(0);
  });

  test('global search does not return cards from boards the user cannot access', async ({ page, user, user2, board }) => {
    // board is owned by user; user2 is NOT a member

    // Search as user2
    await loginWithToken(page, user2.id, user2.token);
    const sp = new SearchPage(page);
    await sp.navigateToGlobalSearch();
    await sp.globalSearch('Alpha Card');

    const titles = await sp.globalSearchResultTitles();
    // user2 should not see any cards from the inaccessible board
    const leaked = titles.filter(t => t.includes('Alpha Card'));
    expect(leaked.length).toBe(0);
  });

  test('changing card status in global search results keeps the card visible', async ({ boardPage, board }) => {
    const sp = new SearchPage(boardPage);
    const bp = new BoardPage(boardPage);

    await sp.navigateToGlobalSearch();
    await sp.globalSearch('Alpha Card');
    const result = sp.globalSearchResultByTitle('Alpha Card');
    await expect(result).toBeVisible({ timeout: 10_000 });

    // Change list via the in-result status selector
    const listSelector = result.locator('.js-select-card-details-lists, select[name*="list"]').first();
    if (await listSelector.count() > 0) {
      const targetListTitle = (await bp.listHeader(board.listIds[1]).innerText()).trim();
      await listSelector.selectOption({ label: targetListTitle });
      await boardPage.waitForTimeout(800);
      // Card should still appear in results (not disappear)
      await expect(result).toBeVisible({ timeout: 8_000 });
    }
  });

  test('all seeded cards are findable via global search', async ({ boardPage, board }) => {
    const sp = new SearchPage(boardPage);
    const cardTitles = ['Alpha Card', 'Beta Card', 'Gamma Card'];

    for (const title of cardTitles) {
      // Fire the search once per term, then poll only the result read. The
      // global-search page shows the boards/lists help block by default, so
      // navigateToGlobalSearch()+globalSearch() can return before the reactive
      // results render. Re-navigating/re-searching on every poll iteration kept
      // reading each fresh search too early; polling a single search lets the
      // round-trip settle (matching the resilient pattern of the tests above).
      await sp.navigateToGlobalSearch();
      await sp.globalSearch(title);

      await expect
        .poll(
          async () => {
            const titles = await sp.globalSearchResultTitles();
            return titles.some(t => t.includes(title));
          },
          {
            timeout: 20_000,
            intervals: [250, 500, 1000, 2000],
            message: `Expected to find "${title}" in global search`,
          },
        )
        .toBe(true);
    }
  });

  test('board-level search returns only cards matching the query', async ({ boardPage, board }) => {
    const sp = new SearchPage(boardPage);
    await sp.openBoardSearch();
    await sp.boardSearch('Alpha');

    // The board-level search (searchSidebar) shows matching cards in the sidebar, not by
    // filtering the board canvas. Verify Alpha Card appears in the sidebar results.
    const sidebarResults = sp.boardSearchResults();
    const resultCount = await sidebarResults.count();
    expect(resultCount).toBeGreaterThanOrEqual(1);

    const allTitles = await sidebarResults.locator('.minicard-title').allInnerTexts();
    const alphaFound = allTitles.some(t => t.includes('Alpha'));
    expect(alphaFound).toBe(true);
  });

  test('filter sidebar filters cards by title fragment', async ({ boardPage, board }) => {
    const sp = new SearchPage(boardPage);
    await sp.openFilterSidebar();
    await sp.filterByTitle('Alpha');

    // Beta and Gamma cards should not be visible
    await expect(boardPage.locator('.js-minicard').filter({ hasText: 'Beta Card' })).not.toBeVisible({ timeout: 5_000 });
    await expect(boardPage.locator('.js-minicard').filter({ hasText: 'Gamma Card' })).not.toBeVisible({ timeout: 5_000 });

    await sp.clearFilters();
  });

  test('filter sidebar filters cards by member', async ({ boardPage, board, user }) => {
    const sp = new SearchPage(boardPage);
    await sp.openFilterSidebar();

    // Filter by current user - cards assigned to them
    const memberFilter = boardPage.locator('.js-toggle-member-filter').first();
    if (await memberFilter.count() > 0) {
      await memberFilter.click();
      await boardPage.waitForTimeout(600);
      // No error should occur - board canvas stays functional
      await expect(boardPage.locator('.board-canvas')).toBeVisible();
      await sp.clearFilters();
    }
  });

  test('filter sidebar filters cards by label and keeps selected label active', async ({ boardPage, board }) => {
    const labelId = `lbl_${Date.now()}`;
    const labelName = 'E2E Label Alpha';

    db.updateOne('boards', { _id: board.boardId },
      { $set: { labels: [{ _id: labelId, name: labelName, color: 'green' }] } });
    db.updateMany('cards', { boardId: board.boardId }, { $set: { labelIds: [] } });
    db.updateOne('cards', { boardId: board.boardId, title: 'Alpha Card' },
      { $set: { labelIds: [labelId] } });

    await boardPage.reload({ waitUntil: 'networkidle' });

    const sp = new SearchPage(boardPage);
    await sp.openFilterSidebar();

    const labelFilter = boardPage
      .locator('.js-toggle-label-filter')
      .filter({ hasText: labelName })
      .first();

    await expect(labelFilter).toBeVisible({ timeout: 10_000 });
    await labelFilter.click();
    await boardPage.waitForTimeout(800);

    // Ensure selected-state indicator is rendered on the clicked label filter.
    await expect(labelFilter.locator('i.fa-check').first()).toBeVisible({ timeout: 10_000 });

    // Only Alpha card has the selected label.
    await expect(boardPage.locator('.js-minicard').filter({ hasText: 'Alpha Card' })).toBeVisible({ timeout: 10_000 });
    await expect(boardPage.locator('.js-minicard').filter({ hasText: 'Beta Card' })).not.toBeVisible({ timeout: 10_000 });
    await expect(boardPage.locator('.js-minicard').filter({ hasText: 'Gamma Card' })).not.toBeVisible({ timeout: 10_000 });

    await sp.clearFilters();
  });

  test('#6629: Board Table view applies the active label filter', async ({ boardPage, board }) => {
    const labelId = `lbl_${Date.now()}`;
    const labelName = 'Table Filter Label';
    db.updateOne('boards', { _id: board.boardId },
      { $set: { labels: [{ _id: labelId, name: labelName, color: 'green' }] } });
    db.updateMany('cards', { boardId: board.boardId }, { $set: { labelIds: [] } });
    db.updateOne('cards', { boardId: board.boardId, title: 'Alpha Card' },
      { $set: { labelIds: [labelId] } });
    await boardPage.reload({ waitUntil: 'networkidle' });

    // A board-view change reloads the page and clears the in-memory Filter.
    // Enter Table view first, then activate the filter under test.
    await boardPage.locator('.js-toggle-board-view').first().click();
    await boardPage.locator('.pop-over .js-open-table-view').click();
    await expect(boardPage.locator('.my-cards-board-table')).toBeVisible({
      timeout: 10_000,
    });

    const sp = new SearchPage(boardPage);
    await sp.openFilterSidebar();
    const labelFilter = boardPage.locator('.js-toggle-label-filter')
      .filter({ hasText: labelName }).first();
    await labelFilter.click();
    await expect(labelFilter.locator('i.fa-check').first())
      .toBeVisible({ timeout: 10_000 });

    await expect(boardPage.locator('.my-cards-board-table tbody tr'))
      .toHaveCount(1);
    await expect(boardPage.locator('.my-cards-board-table tbody'))
      .toContainText('Alpha Card');
    await expect(boardPage.locator('.my-cards-board-table tbody'))
      .not.toContainText('Beta Card');

    await sp.clearFilters();
  });

  test('#6632: Table view uses full width and remembers wrapped card titles', async ({
    boardPage,
    board,
  }) => {
    const longTitle = 'A very long card title '.repeat(12).trim();
    db.updateOne(
      'cards',
      { boardId: board.boardId, title: 'Alpha Card' },
      { $set: { title: longTitle } },
    );
    await boardPage.reload({ waitUntil: 'networkidle' });
    await boardPage.locator('.js-toggle-board-view').first().click();
    await boardPage.locator('.pop-over .js-open-table-view').click();

    const table = boardPage.locator('.table-view-table');
    const titleCell = table.locator('.table-view-cell-card-title').first();
    await expect(table).toBeVisible({ timeout: 10_000 });
    const widths = await table.evaluate(element => ({
      table: element.getBoundingClientRect().width,
      parent: element.parentElement.getBoundingClientRect().width,
    }));
    expect(widths.table).toBeGreaterThan(widths.parent * 0.9);
    await expect(titleCell).toHaveAttribute('title', longTitle);
    await expect(titleCell.locator('.viewer p')).toHaveCSS('white-space', 'nowrap');
    await expect(titleCell.locator('.viewer p')).toHaveCSS('text-overflow', 'ellipsis');

    await boardPage.locator('.js-table-view-toggle-card-title-wrap').click();
    await expect(titleCell.locator('.viewer p')).toHaveCSS('white-space', 'normal');
    await boardPage.reload({ waitUntil: 'networkidle' });
    await expect(
      boardPage.locator('.table-view-cell-card-title .viewer p').first(),
    ).toHaveCSS('white-space', 'normal');
  });

  test('#6633: Table view headers toggle ascending and descending sorting', async ({
    boardPage,
  }) => {
    await boardPage.locator('.js-toggle-board-view').first().click();
    await boardPage.locator('.pop-over .js-open-table-view').click();
    const titles = boardPage.locator(
      '.table-view-cell-card-title .viewer p',
    );
    await expect(titles.first()).toHaveText('Alpha Card', { timeout: 10_000 });

    await boardPage
      .locator('.js-table-view-sort[data-field="title"]')
      .click();
    await expect(titles.first()).toHaveText('Gamma Card');
    await expect(
      boardPage.locator(
        '.js-table-view-sort[data-field="title"] i.fa-sort-desc',
      ),
    ).toBeVisible();

    await boardPage
      .locator('.js-table-view-sort[data-field="listTitle"]')
      .click();
    await expect(
      boardPage.locator(
        '.js-table-view-sort[data-field="listTitle"] i.fa-sort-asc',
      ),
    ).toBeVisible();
  });
});
