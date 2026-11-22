'use strict';
// Cloud Panel (docs/Features/Admin-Panel/Cloud-Panel.md): it exists only where
// the server has the CLOUD environment variable, at that address
// (CloudPanelBleed). The test server is started WITHOUT CLOUD, as every
// ordinary WeKan is, so the first test is the negative one: no Admin Panel /
// Cloud tab, no People / Cloud setting, no panel at /cloud - even with a
// domain stored in the database the way an earlier version let a site
// administrator store one from the browser - and every cloud method refused.
//
// The second runs only against a test server started with CLOUD set to its
// own host name (WEKAN_TEST_CLOUD=true says so):
//   CLOUD=localhost WEKAN_TEST_CLOUD=true ./build.sh --playwright-spec cloud-panel chromium
// tests/cloudPanel.test.cjs, tests/cloudPanelAccess.test.cjs and
// tests/cloudPanelGate.test.cjs pin the rules without a browser.
const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const { loginWithToken, navigateInApp } = require('../helpers/auth');

const host = () => new URL(process.env.WEKAN_BASE_URL || 'http://localhost:3000').hostname;

test('negative: without CLOUD there is no Cloud Panel, whatever the database says, and no cloud method answers', async ({ page, adminUser }) => {
  test.skip(process.env.WEKAN_TEST_CLOUD === 'true', 'this test server has CLOUD set');
  const stamp = Date.now();
  db.deleteMany('cloudSettings', {});
  db.insertOne('cloudSettings', { _id: 'cloud', settings: { domain: host(), superAdminUsername: adminUser.username } });
  const domainId = `e2e-cloud-${stamp}`;
  db.insertOne('cloudDomains', { _id: domainId, domain: `internal${stamp}.example.com`, mode: 'own', upstream: 'x:1',
    database: { host: '127.0.0.1', port: 9, database: 'admin' } });
  try {
    await loginWithToken(page, adminUser.id, adminUser.token);
    await navigateInApp(page, '/admin/people/email');
    await expect(page.locator('.admin-panel-tabs a.board-header-btn.people')).toBeVisible({ timeout: 20_000 });
    await expect(page.locator('.admin-panel-tabs a.board-header-btn.cloud')).toHaveCount(0);
    await expect(page.locator('[data-id="cloud-setting"]')).toHaveCount(0);
    await expect(page.locator('form.js-cloud-panel-settings')).toHaveCount(0);

    await navigateInApp(page, '/admin/cloud/domains');
    await expect(page.locator('.cloud-panel')).toContainText(/CLOUD/, { timeout: 20_000 });
    await expect(page.locator('.cloud-panel .side-menu')).toHaveCount(0);

    const answers = await page.evaluate(async id => {
      const out = {};
      out.who = await Meteor.callAsync('cloudPanelWhoAmI');
      for (const [name, args] of [['cloudPanelTestDatabase', [id]], ['cloudPanelDomainsCount', ['']],
        ['cloudPanelSetSettings', [{ domain: 'x.example.com', superAdminUsername: 'x' }]], ['cloudPanelImportDomain', [id, { dryRun: true }]]]) {
        try { await Meteor.callAsync(name, ...args); out[name] = 'answered'; } catch (e) { out[name] = e.error || e.message; }
      }
      return out;
    }, domainId);
    expect(answers.who.enabled).toBe(false);
    for (const name of ['cloudPanelTestDatabase', 'cloudPanelDomainsCount', 'cloudPanelSetSettings', 'cloudPanelImportDomain']) {
      expect(answers[name], name).toBe('not-authorized');
    }
    // ...and Admin Panel / Problems has the attempt.
    await expect.poll(() => db.countDocuments('eventlog', { stream: 'security', bleed: 'CloudPanelBleed' }), { timeout: 20_000 })
      .toBeGreaterThan(0);
  } finally {
    db.deleteMany('cloudSettings', {});
    db.deleteMany('cloudDomains', { _id: domainId });
    db.deleteMany('eventlog', { stream: 'security', bleed: 'CloudPanelBleed' });
  }
});

test('with CLOUD: the Cloud Admin has Admin Panel / Cloud, adds a domain, and its support board is made', async ({ page, adminUser, user }) => {
  test.skip(process.env.WEKAN_TEST_CLOUD !== 'true', 'needs a test server started with CLOUD=<its host> and WEKAN_TEST_CLOUD=true');
  const stamp = Date.now();
  const domain = `customer${stamp}.example.com`;
  try {
    await loginWithToken(page, adminUser.id, adminUser.token);
    await navigateInApp(page, '/admin/people/email');
    await page.locator('.admin-panel-tabs a.board-header-btn.cloud').click({ timeout: 20_000 });
    await expect(page.locator('.cloud-panel .side-menu')).toBeVisible({ timeout: 20_000 });
    await expect(page.locator('a.js-cloud-menu[data-id="allowed-addresses"]')).toHaveCount(1);
    await page.locator('.js-cloud-domain-new').click();
    const form = page.locator('form.js-cloud-domain');
    await form.locator('[name="domain"]').fill(domain);
    await form.locator('[name="customerEmail"]').fill(user.email);
    await form.locator('[name="mode"]').selectOption('shared');
    await form.locator('button[type="submit"]').click();
    await expect(page.locator('.table-page-table tbody tr', { hasText: domain })).toHaveCount(1, { timeout: 20_000 });
    await expect.poll(() => db.countDocuments('boards', { title: `Support: ${domain}` }), { timeout: 20_000 }).toBe(1);

    // Allowed addresses: a list without this browser's address is not saved.
    await page.locator('a.js-cloud-menu[data-id="allowed-addresses"]').click();
    await page.locator('.js-cloud-addresses-text').fill('198.51.100.0/24');
    await expect(page.locator('.js-cloud-addresses-lockout')).toBeVisible();

    // The customer: tickets of their own domain, and no Cloud Admin menu.
    await loginWithToken(page, user.id, user.token);
    await navigateInApp(page, '/cloud');
    await page.locator('a.js-cloud-menu[data-id="tickets"]').click({ timeout: 20_000 });
    await page.locator('form.js-cloud-ticket-add [name="title"]').fill(`Ticket ${stamp}`);
    await page.locator('form.js-cloud-ticket-add button[type="submit"]').click();
    await expect(page.locator('.cloud-ticket-open .cloud-ticket', { hasText: `Ticket ${stamp}` })).toHaveCount(1, { timeout: 20_000 });
    await expect(page.locator('a.js-cloud-menu[data-id="domains"]')).toHaveCount(0);
  } finally {
    const d = db.findOne('cloudDomains', { domain });
    if (d && d.support) {
      for (const c of ['cards', 'lists', 'swimlanes', 'card_comments']) db.deleteMany(c, { boardId: d.support.boardId });
      db.deleteOne('boards', { _id: d.support.boardId });
    }
    if (d && d.orgId) db.deleteOne('org', { _id: d.orgId });
    db.deleteMany('cloudDomains', { domain });
  }
});
