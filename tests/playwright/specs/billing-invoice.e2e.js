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
    // The page draws the saved rate before the next form is filled: a save
    // redraws the forms, and would reset what is being typed.
    await expect(page.locator('.billing-list li', { hasText: '100' })).toHaveCount(1, { timeout: 20_000 });
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

// Professional services: an expense and a fixed fee go on the invoice with
// the time; with approval on only approved time is billed; a quote prices
// the work still to do. tests/billingAccess.test.cjs pins the rules.
test('Budget and billing: expenses, fees, approving time and a quote', async ({ page, user, user2 }) => {
  const stamp = Date.now();
  const board = db.seedBoard({ ownerId: user.id, title: `PSA ${stamp}`, listCount: 1, cardTitlesPerList: [[`Build ${stamp}`]] });
  try {
    db.addBoardMember({ boardId: board.boardId, userId: user2.id });
    const card = db.findCardIdByTitle({ boardId: board.boardId, title: `Build ${stamp}` });
    db.updateOne('cards', { _id: card }, { $set: { assignees: [user2.id], spentTime: 3, estimatedHours: 10 } });
    const day = new Date().toISOString().slice(0, 10);
    db.insertMany('timeEntries', [{ _id: `pe1-${stamp}`, cardId: card, boardId: board.boardId, userId: user2.id, date: day, hours: 3, source: 'manual' }]);

    await loginWithToken(page, user.id, user.token);
    await navigateInApp(page, '/billing');
    await page.locator('a.js-billing-board', { hasText: `PSA ${stamp}` }).click();
    await page.locator('form.js-billing-rate #billing-rate-amount').fill('100');
    await page.locator('form.js-billing-rate #billing-rate-currency').fill('EUR');
    await page.locator('form.js-billing-rate #billing-rate-cost').fill('60');
    await page.locator('form.js-billing-rate button[type="submit"]').click();
    await expect(page.locator('.billing-margin')).toBeVisible({ timeout: 20_000 });
    await expect(page.locator('.billing-list li', { hasText: '100' })).toHaveCount(1, { timeout: 20_000 });

    const expense = page.locator('form.js-billing-expense');
    await expense.locator('[name="amount"]').fill('50');
    await expense.locator('[name="description"]').fill(`Train ${stamp}`);
    await expense.locator('[name="category"]').selectOption('travel');
    await expense.locator('button[type="submit"]').click();
    await expect(page.locator('.billing-expenses li', { hasText: `Train ${stamp}` })).toHaveCount(1, { timeout: 20_000 });
    const fee = page.locator('form.js-billing-fee');
    await fee.locator('[name="title"]').fill(`Kick-off ${stamp}`);
    await fee.locator('[name="amount"]').fill('500');
    await fee.locator('button[type="submit"]').click();
    await expect(page.locator('.billing-draft-lines li')).toHaveCount(3, { timeout: 20_000 });

    // Approval on: the time waits, the fee and the expense do not.
    await page.locator('form.js-billing-profile [name="approveTime"]').check();
    await page.locator('form.js-billing-profile button[type="submit"]').click();
    await expect(page.locator('.billing-approval li')).toHaveCount(1, { timeout: 20_000 });
    await expect(page.locator('.billing-draft-lines li')).toHaveCount(2);
    await page.locator('.billing-approval button[data-decision="approved"]').click();
    await expect(page.locator('.billing-draft-lines li')).toHaveCount(3, { timeout: 20_000 });

    // A quote of the 7 h still to do; it opens on the page.
    await page.locator('form.js-billing-quote button[type="submit"]').click();
    await expect(page.locator('.billing-print h2')).toContainText('QUO-', { timeout: 20_000 });
    await expect(page.locator('.billing-quote-table tbody tr')).toHaveCount(1);

    // Negative: the member sees neither the board nor its money.
    await loginWithToken(page, user2.id, user2.token);
    await navigateInApp(page, '/billing');
    await expect(page.locator('.billing-page')).toBeVisible();
    await expect(page.locator('a.js-billing-board', { hasText: `PSA ${stamp}` })).toHaveCount(0);
  } finally {
    for (const c of ['billingRates', 'billingBudgets', 'billingInvoices', 'billingProfiles', 'billingExpenses', 'billingFees', 'billingQuotes', 'timeEntries']) {
      db.deleteMany(c, { boardId: board.boardId });
    }
    db.cleanup({ boardIds: [board.boardId] });
  }
});
