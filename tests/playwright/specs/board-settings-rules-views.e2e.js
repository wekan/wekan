'use strict';
// Board Settings: the Rules page's views sit directly under Rules, and a
// divider separates that group from Change color (2026-09-30).
// Order and guards are pinned in tests/boardMenuOrder.test.cjs.
const { test, expect } = require('../fixtures');
const BoardPage = require('../pages/BoardPage');

async function openBoardMenu(page) {
  await new BoardPage(page).openSidebar();
  await page.locator('.board-sidebar .js-open-board-menu').click();
  await page.locator('.js-pop-over').waitFor();
}

test('Rules views are listed under Rules, above a divider, and open that view', async ({ boardPage: page }) => {
  await openBoardMenu(page);
  const popover = page.locator('.js-pop-over');
  // Entries and dividers in document order, first two groups.
  // The popup's own back/close buttons are js- links too; only the menu counts.
  const order = await popover.evaluate(root => [...root.querySelectorAll('a[class*="js-"], hr')]
    .map(node => (node.tagName === 'HR' ? 'hr' : [...node.classList].find(c => c.startsWith('js-'))))
    .filter(cls => !['js-back-view', 'js-close-pop-over'].includes(cls))
    .slice(0, 8));
  expect(order).toEqual(['js-open-rules-view', 'js-open-rules-list-view', 'js-open-rules-workflow-view',
    // After the divider, Scrum settings has a group of its own above the
    // board's look (sidebar.jade, added with the Scrum work).
    'js-open-rules-blocks-view', 'js-open-rules-history', 'js-open-rules-import-export', 'hr', 'js-open-board-scrum-settings']);
  for (const label of ['List View', 'Workflow', 'Blocks', 'History', 'Import / Export rules']) {
    await expect(popover.getByText(label, { exact: false }).first()).toBeVisible();
  }

  await popover.locator('.js-open-rules-workflow-view').click();
  await expect(page).toHaveURL(/\/rules/);
  await expect(page.locator('.rules-workflow')).toBeVisible();

  await page.goBack();
  await openBoardMenu(page);
  await page.locator('.js-pop-over .js-open-rules-history').click();
  await expect(page.locator('.rules-page .history-table')).toBeVisible();

  await page.goBack();
  await openBoardMenu(page);
  await page.locator('.js-pop-over .js-open-rules-import-export').click();
  await expect(page.locator('.js-pop-over .rules-import-export')).toBeVisible();
});

// The Rules page uses the board's own right sidebar, not a separate one that
// held only its views (2026-09-30); a board view leads back to the board.
test('the Rules page uses the board sidebar, and a board view leads back to the board', async ({ boardPage: page, board }) => {
  await openBoardMenu(page);
  await page.locator('.js-pop-over .js-open-rules-workflow-view').click();
  await expect(page).toHaveURL(/\/rules/);
  await expect(page.locator('.rules-workflow')).toBeVisible();
  await expect(page.locator('.page-sidebar')).toHaveCount(0);

  // The hamburger opens the board sidebar with Board Settings in it.
  await page.locator('.js-toggle-page-sidebar').first().click();
  await expect(page.locator('.board-sidebar.is-open .js-open-board-menu')).toBeVisible();
  await page.locator('.board-sidebar .js-open-board-menu').click();
  await page.locator('.js-pop-over .js-open-rules-history').click();
  await expect(page.locator('.rules-page .history-table')).toBeVisible();
  await expect(page.locator('.board-sidebar.is-open')).toHaveCount(0, { timeout: 5_000 });

  await page.locator('.js-toggle-board-view').first().click();
  await page.locator('.js-pop-over .js-open-swimlanes-view').click();
  await expect(page).toHaveURL(new RegExp(`/b/${board.boardId}/[^/]+$`));
  await expect(page.locator('.rules-page')).toHaveCount(0);
});
