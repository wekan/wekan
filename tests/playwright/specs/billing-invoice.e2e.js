'use strict';
// Budget and billing (docs/Features/Billing/Billing.md): a board admin sets a
// rate and a budget, sees the cost and the forecast in red over the budget,
// and invoices the billable hours once. A member of the board does not see the
// board on the page. tests/billing.test.cjs and tests/billingAccess.test.cjs
// pin the rules.
const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const { loginWithToken, navigateInApp } = require('../helpers/auth');

test('Budget and billing: cost against budget, and one invoice of the billable hours', async ({ page, user, user2 }) => {
  const stamp = Date.now();
  const board = db.seedBoard({ ownerId: user.id, title: `Billing ${stamp}`, listCount: 1,
    cardTitlesPerList: [[`Billed ${stamp}`, `Internal ${stamp}`]] });
  try {
    db.addBoardMember({ boardId: board.boardId, userId: user2.id });
    const billed = db.findCardIdByTitle({ boardId: board.boardId, title: `Billed ${stamp}` });
    const internal = db.findCardIdByTitle({ boardId: board.boardId, title: `Internal ${stamp}` });
    db.updateOne('cards', { _id: billed }, { $set: { assignees: [user2.id], spentTime: 10, estimatedHours: 15 } });
    db.updateOne('cards', { _id: internal }, { $set: { assignees: [user2.id], spentTime: 4, billable: false } });
    // The time by day (server/timeEntries.js): 10 h of the billed card, 8 of
    // them this month and 2 last month; the internal card's 4 h.
    const month = new Date().toISOString().slice(0, 7);
    const lastMonth = new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth() - 1, 15)).toISOString().slice(0, 10);
    db.insertMany('timeEntries', [
      { _id: `te1-${stamp}`, cardId: billed, boardId: board.boardId, userId: user2.id, date: `${month}-01`, hours: 8, source: 'manual' },
      { _id: `te2-${stamp}`, cardId: billed, boardId: board.boardId, userId: user2.id, date: lastMonth, hours: 2, source: 'manual' },
      { _id: `te3-${stamp}`, cardId: internal, boardId: board.boardId, userId: user2.id, date: `${month}-02`, hours: 4, source: 'manual' },
    ]);

    await loginWithToken(page, user.id, user.token);
    await navigateInApp(page, '/billing');
    await page.locator('a.js-billing-board', { hasText: `Billing ${stamp}` }).click();

    await page.locator('form.js-billing-rate #billing-rate-amount').fill('100');
    await page.locator('form.js-billing-rate #billing-rate-currency').fill('EUR');
    await page.locator('form.js-billing-rate button[type="submit"]').click();
    await page.locator('#billing-budget-amount').fill('1500');
    await page.locator('#billing-budget-currency').fill('EUR');
    await page.locator('form.js-billing-budget button[type="submit"]').click();

    // 14 h spent at 100 = 1400; 5 h still to do = 500; forecast 1900 > 1500.
    const row = page.locator('tr.billing-board-row', { hasText: `Billing ${stamp}` });
    await expect(row).toHaveClass(/is-over/, { timeout: 20_000 });
    await expect(row.locator('.billing-over')).toBeVisible();

    // This month only: 8 h of the billable card.
    await page.locator('#billing-period-start').fill(`${month}-01`);
    await page.locator('#billing-period-start').dispatchEvent('change');
    await expect(page.locator('.billing-draft-lines li')).toHaveCount(1);
    await page.locator('form.js-billing-invoice button[type="submit"]').click();
    const invoiceRow = page.locator('.billing-invoice-table tbody tr').first();
    await expect(invoiceRow).toContainText('INV-');
    await expect(invoiceRow.locator('td').nth(4)).toHaveText('8');
    // The invoice opens on the page; a PDF and an SVG download.
    await expect(page.locator('.billing-print')).toBeVisible();
    for (const format of ['pdf', 'svg']) {
      const [file] = await Promise.all([page.waitForEvent('download'), invoiceRow.locator(`button.js-billing-file[data-format="${format}"]`).click()]);
      expect(file.suggestedFilename()).toMatch(new RegExp(`^INV-\\d{4}-\\d{4}\\.${format}$`));
    }
    // Last month's 2 h are still open.
    await page.locator('#billing-period-start').fill('');
    await page.locator('#billing-period-start').dispatchEvent('change');
    await expect(page.locator('.billing-draft-lines li')).toHaveCount(1);
    await expect(page.locator('.billing-draft-lines li')).toContainText('2');

    // Negative: a member who is not a board admin does not see the board.
    await loginWithToken(page, user2.id, user2.token);
    await navigateInApp(page, '/billing');
    await expect(page.locator('.billing-page')).toBeVisible();
    await expect(page.locator('a.js-billing-board', { hasText: `Billing ${stamp}` })).toHaveCount(0);
  } finally {
    db.deleteMany('billingRates', { boardId: board.boardId });
    db.deleteMany('billingBudgets', { boardId: board.boardId });
    db.deleteMany('billingInvoices', { boardId: board.boardId });
    db.deleteMany('billingProfiles', { boardId: board.boardId });
    db.deleteMany('timeEntries', { boardId: board.boardId });
    db.cleanup({ boardIds: [board.boardId] });
  }
});
