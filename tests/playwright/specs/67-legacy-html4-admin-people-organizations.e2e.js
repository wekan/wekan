'use strict';

const fs = require('node:fs');
const { test, expect } = require('@playwright/test');
const db = require('../helpers/db');
const { loginWithToken, navigateInApp, waitForMeteor } = require('../helpers/auth');

const GIF = Buffer.from('R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==', 'base64');

test('People Organizations has equivalent complete HTML4 operations', async ({ browser, baseURL }) => {
  test.setTimeout(180_000);
  const suffix = `${Date.now()}${Math.floor(Math.random() * 10000)}`;
  const username = `html4org${suffix}`;
  const password = `Legacy-${suffix}-Pass!`;
  const shortName = `org-${suffix}`;
  const displayName = `Organization ${suffix}`;
  const member = db.seedUser();
  const legacyContext = await browser.newContext({ javaScriptEnabled: false, locale: 'en-US' });
  const legacy = await legacyContext.newPage();
  const originalSetting = db.findOne('settings', {});
  let admin;
  let org;
  let modernContext;
  try {
    await legacy.goto(`${baseURL}/sign-up`);
    await legacy.locator('input[name="username"]').fill(username);
    await legacy.locator('input[name="email"]').fill(`${username}@wekan-test.invalid`);
    await legacy.locator('input[name="password"]').fill(password);
    await Promise.all([legacy.waitForNavigation(), legacy.locator('input[type="submit"]').click()]);
    admin = db.findOne('users', { username });
    db.updateOne('users', { _id: admin._id }, {
      $set: { isAdmin: true, loginDisabled: false, 'profile.language': 'en' },
    });
    await Promise.all([legacy.waitForNavigation(),
      legacy.locator('form[action="/allboards"] input[type="submit"]').first().click()]);
    await Promise.all([legacy.waitForNavigation(),
      legacy.locator('form[action="/admin/people/people"] input[type="submit"]').first().click()]);
    await Promise.all([legacy.waitForNavigation(),
      legacy.locator('form[action="/admin/people/organizations"] input[type="submit"]').first().click()]);

    let form = legacy.locator('form:has(input[name="legacyOperation"][value="show-create-organization"])');
    await Promise.all([legacy.waitForNavigation(), form.locator('input[type="submit"]').click()]);
    form = legacy.locator('form:has(input[name="legacyOperation"][value="create-organization"])');
    await form.locator('input[name="orgDisplayName"]').fill(displayName);
    await form.locator('input[name="orgDesc"]').fill(`Description ${suffix}`);
    await form.locator('input[name="orgShortName"]').fill(shortName);
    await form.locator('input[name="orgAutoAddUsersWithDomainName"]').fill(`@${suffix}.invalid`);
    await form.locator('input[name="orgWebsite"]').fill(`www.${suffix}.invalid`);
    await form.locator('select[name="orgIsActive"]').selectOption('true');
    await Promise.all([legacy.waitForNavigation(), form.locator('input[type="submit"]').click()]);
    org = db.findOne('org', { orgShortName: shortName });
    expect(org).toBeTruthy();
    db.updateOne('users', { _id: member.id }, { $set: { orgs: [{
      orgId: org._id, orgDisplayName: displayName, isAdmin: false,
    }] } });

    form = legacy.locator('form:has(input[name="legacyOperation"][value="update-organization"])');
    await form.locator('input[name="orgDisplayName"]').fill(`${displayName} edited`);
    await Promise.all([legacy.waitForNavigation(), form.locator('input[type="submit"]').click()]);
    await expect.poll(() => db.findOne('users', { _id: member.id })?.orgs?.[0]?.orgDisplayName)
      .toBe(`${displayName} edited`);

    form = legacy.locator('form:has(input[name="legacyOperation"][value="save-organization-tenant"])');
    await form.locator('input[name="orgDomains"]').fill(`HTTPS://${suffix}.INVALID/path`);
    await form.locator('input[name="orgProductName"]').fill(`Tenant ${suffix}`);
    await form.locator('input[name="orgCustomHelpLinkUrl"]').fill(`/help/${suffix}`);
    await form.locator('input[name="orgLegalNotice"]').fill(`https://example.com/legal/${suffix}`);
    await Promise.all([legacy.waitForNavigation(), form.locator('input[type="submit"]').click()]);
    await expect.poll(() => db.findOne('org', { _id: org._id })?.orgDomains)
      .toBe(`${suffix}.invalid`);

    form = legacy.locator('form:has(input[name="brandingSlot"][value="login"])');
    await form.locator('input[type="file"]').setInputFiles({
      name: 'tenant-logo.png', mimeType: 'image/png', buffer: GIF,
    });
    await Promise.all([legacy.waitForNavigation(), form.locator('input[type="submit"]').click()]);
    await expect.poll(() => db.findOne('org', { _id: org._id })?.orgCustomLoginLogoImageUrl)
      .toMatch(/^\/branding\/images\/.+\.gif$/);

    form = legacy.locator(`form:has(input[name="legacyOperation"][value="set-organization-feature"]):has(input[name="orgId"][value="${org._id}"]):has(input[name="organizationFeature"][value="orgSharedTemplates"])`);
    await Promise.all([legacy.waitForNavigation(), form.locator('input[type="submit"]').click()]);
    await expect.poll(() => db.findOne('org', { _id: org._id })?.orgSharedTemplates).toBe(true);
    form = legacy.locator('form:has(input[name="legacyOperation"][value="set-board-members-same-org"])');
    if (await form.locator('input[name="enabled"]').inputValue() === 'true') {
      await Promise.all([legacy.waitForNavigation(), form.locator('input[type="submit"]').click()]);
    }
    await expect.poll(() => db.findOne('settings', {})?.boardMembersFromSameOrgOnly).toBe(true);

    form = legacy.locator(`form:has(input[name="legacyOperation"][value="show-organization-admins"]):has(input[name="orgId"][value="${org._id}"])`);
    await Promise.all([legacy.waitForNavigation(), form.locator('input[type="submit"]').click()]);
    form = legacy.locator(`form:has(input[name="legacyOperation"][value="set-organization-admin"]):has(input[name="targetUserId"][value="${member.id}"])`);
    await Promise.all([legacy.waitForNavigation(), form.locator('input[type="submit"]').click()]);
    await expect.poll(() => db.findOne('users', { _id: member.id })?.orgs?.[0]?.isAdmin).toBe(true);
    if (process.env.WEKAN_HTML4_SCREENSHOTS) {
      fs.mkdirSync(process.env.WEKAN_HTML4_SCREENSHOTS, { recursive: true });
      await legacy.screenshot({
        path: `${process.env.WEKAN_HTML4_SCREENSHOTS}/html4-people-organizations.png`,
        fullPage: true,
      });
    }

    modernContext = await browser.newContext({ locale: 'en-US',
      viewport: { width: 1600, height: 2400 } });
    const modern = await modernContext.newPage();
    await loginWithToken(modern, admin._id, db.addResumeToken(admin._id));
    await navigateInApp(modern, '/admin/people/organizations');
    await waitForMeteor(modern);
    const row = modern.locator('tbody tr', { hasText: shortName });
    await expect(row).toContainText(`${displayName} edited`);
    await expect(row.locator('input[data-feature="orgSharedTemplates"]')).toBeChecked();
    await row.locator('a.edit-org').click();
    await expect(modern.locator('.pop-over:visible .js-orgDomains'))
      .toHaveValue(`${suffix}.invalid`);
    await expect(modern.locator('.pop-over:visible img.admin-branding-preview'))
      .toHaveAttribute('src', /\/branding\/images\/.+\.gif$/);
    await modern.keyboard.press('Escape');
    if (process.env.WEKAN_HTML4_SCREENSHOTS) await modern.screenshot({
      path: `${process.env.WEKAN_HTML4_SCREENSHOTS}/html5-people-organizations.png`,
      fullPage: true,
    });

    form = legacy.locator(`form:has(input[name="legacyOperation"][value="request-delete-organization"]):has(input[name="orgId"][value="${org._id}"])`);
    await Promise.all([legacy.waitForNavigation(), form.locator('input[type="submit"]').click()]);
    form = legacy.locator('form:has(input[name="legacyOperation"][value="delete-organization"])');
    await Promise.all([legacy.waitForNavigation(), form.locator('input[type="submit"]').click()]);
    expect(db.findOne('org', { _id: org._id })).toBeTruthy();
    db.updateOne('users', { _id: member.id }, { $set: { orgs: [] } });
    form = legacy.locator(`form:has(input[name="legacyOperation"][value="request-delete-organization"]):has(input[name="orgId"][value="${org._id}"])`);
    await Promise.all([legacy.waitForNavigation(), form.locator('input[type="submit"]').click()]);
    form = legacy.locator('form:has(input[name="legacyOperation"][value="delete-organization"])');
    await Promise.all([legacy.waitForNavigation(), form.locator('input[type="submit"]').click()]);
    await expect.poll(() => db.findOne('org', { _id: org._id })).toBeNull();

    const anonymous = await legacyContext.newPage();
    await anonymous.goto(`${baseURL}/admin/people/organizations`);
    await expect(anonymous.locator('body')).toContainText(/not authorized/i);
    await expect(anonymous.locator('body')).not.toContainText(shortName);
  } finally {
    if (originalSetting?._id) db.updateOne('settings', { _id: originalSetting._id }, {
      $set: { boardMembersFromSameOrgOnly:
        originalSetting.boardMembersFromSameOrgOnly === true },
    });
    if (org?._id) db.deleteMany('org', { _id: org._id });
    if (modernContext) await modernContext.close();
    await legacyContext.close();
    db.cleanup({ userIds: [member.id, ...(admin?._id ? [admin._id] : [])] });
  }
});
