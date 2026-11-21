'use strict';
// Cloud Panel (docs/Features/Admin-Panel/Cloud-Panel.md): at the Cloud Panel
// Domain the SuperAdmin keeps the customer domains and their invoices, a
// customer sees only their own invoices, and anybody else nothing.
// tests/cloudPanel.test.cjs and tests/cloudPanelAccess.test.cjs pin the rules.
const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const { loginWithToken, navigateInApp } = require('../helpers/auth');

test('Cloud Panel: the SuperAdmin adds a domain and an invoice; the customer sees it, a stranger nothing', async ({ page, adminUser, user, user2 }) => {
  const stamp = Date.now();
  // The test server's own host is the Cloud Panel Domain here.
  const host = new URL(process.env.WEKAN_BASE_URL || 'http://localhost:3000').hostname;
  const domain = `customer${stamp}.example.com`;
  db.deleteMany('cloudSettings', {});
  db.insertOne('cloudSettings', { _id: 'cloud', settings: { domain: host, superAdminUsername: adminUser.username } });
  try {
    // Admin Panel / People / Cloud shows the setting.
    await loginWithToken(page, adminUser.id, adminUser.token);
    await navigateInApp(page, '/admin/people/cloud');
    await expect(page.locator('form.js-cloud-panel-settings #cloud-settings-admin')).toHaveValue(adminUser.username, { timeout: 20_000 });

    await navigateInApp(page, '/cloud');
    await expect(page.locator('.cloud-panel .side-menu')).toBeVisible({ timeout: 20_000 });
    await page.locator('.js-cloud-domain-new').click();
    const form = page.locator('form.js-cloud-domain');
    await form.locator('[name="domain"]').fill(domain);
    await form.locator('[name="customerName"]').fill(`Customer ${stamp}`);
    await form.locator('[name="customerEmail"]').fill(user2.email);
    await form.locator('[name="mode"]').selectOption('shared');
    await form.locator('button[type="submit"]').click();
    await expect(page.locator('.table-page-table tbody tr', { hasText: domain })).toHaveCount(1, { timeout: 20_000 });

    await page.locator('a.js-cloud-menu[data-id="invoices"]').click();
    const invoice = page.locator('form.js-cloud-invoice');
    await invoice.locator('[name="domainId"]').selectOption({ label: domain });
    await invoice.locator('[name="number"]').fill(`H-${stamp}`);
    await invoice.locator('[name="issueDate"]').fill('2026-01-01');
    await invoice.locator('[name="amount"]').fill('49');
    await invoice.locator('[name="status"]').selectOption('paid');
    await invoice.locator('[name="paidDate"]').fill('2026-01-10');
    await invoice.locator('button[type="submit"]').click();
    await expect(page.locator('.cloud-invoice-table tbody tr', { hasText: `H-${stamp}` })).toHaveCount(1, { timeout: 20_000 });

    // The customer: their own invoice, paid and when; no SuperAdmin menu.
    await loginWithToken(page, user2.id, user2.token);
    await navigateInApp(page, '/cloud');
    const row = page.locator('.cloud-invoice-table tbody tr', { hasText: `H-${stamp}` });
    await expect(row).toContainText('2026-01-10', { timeout: 20_000 });
    await expect(page.locator('a.js-cloud-menu[data-id="domains"]')).toHaveCount(0);
    await expect(page.locator('form.js-cloud-invoice')).toHaveCount(0);

    // Negative: somebody who is neither sees only that the panel is not theirs.
    await loginWithToken(page, user.id, user.token);
    await navigateInApp(page, '/cloud');
    await expect(page.locator('.cloud-panel .side-menu')).toHaveCount(0, { timeout: 20_000 });
    await expect(page.locator('.cloud-panel')).toContainText(/Cloud Panel/);
  } finally {
    const d = db.findOne('cloudDomains', { domain });
    if (d) {
      db.deleteMany('cloudInvoices', { domainId: d._id });
      if (d.orgId) db.deleteOne('org', { _id: d.orgId });
    }
    db.deleteMany('cloudDomains', { domain });
    db.deleteMany('cloudSettings', {});
  }
});
