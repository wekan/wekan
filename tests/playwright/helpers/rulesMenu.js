'use strict';
// Rules and its views are in Board Settings, under Rules, in the board's right
// sidebar - on the board and on the Rules page alike, since the Rules page uses
// the board sidebar (client/components/sidebar/sidebar.jade). Open the sidebar
// if it is closed, then Board Settings, then pick one; `entry` is its js- class
// without the dot: js-open-rules-view, js-open-rules-list-view,
// js-open-rules-workflow-view, js-open-rules-blocks-view, js-open-rules-history
// or js-open-rules-import-export.
async function openRulesMenuEntry(page, entry) {
  const settings = page.locator('.board-sidebar .js-open-board-menu');
  if (!(await settings.isVisible().catch(() => false))) {
    await page.locator('.js-toggle-page-sidebar').first().click();
  }
  await settings.click();
  const link = page.locator(`.js-pop-over .${entry}`);
  await link.waitFor({ timeout: 15_000 });
  await link.click();
}
module.exports = { openRulesMenuEntry };
