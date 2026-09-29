'use strict';

// After an import is submitted: a complete import opens its board at once; one
// that completed with warnings first shows the loss report on the import page
// (server/methods/importReport.js). Wait for either, open the board from the
// report when there is one, and return the report's rows (null for none).
async function waitForImportedBoard(page, { timeout = 30_000 } = {}) {
  const report = page.locator('.js-import-report');
  await Promise.race([
    page.waitForURL(/\/b\//, { timeout }),
    report.waitFor({ state: 'visible', timeout }),
  ]);
  if (!/\/b\//.test(page.url()) && await report.isVisible()) {
    const rows = await report.locator('.import-report-row').allTextContents();
    // The report replaces the page; the source picker is hidden behind it.
    if (!(await page.locator('.import-columns').isHidden())) throw new Error('import sources still shown beside the report');
    await page.locator('.js-open-imported-board').click();
    await page.waitForURL(/\/b\//, { timeout });
    return rows;
  }
  return null;
}

module.exports = { waitForImportedBoard };
