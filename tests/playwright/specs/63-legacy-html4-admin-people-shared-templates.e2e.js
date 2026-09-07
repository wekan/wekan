'use strict';

const fs = require('node:fs');
const { test, expect } = require('@playwright/test');
const db = require('../helpers/db');
const { loginWithToken, navigateInApp, waitForMeteor } = require('../helpers/auth');

test('People Shared templates has equivalent scoped HTML4 discovery', async ({ browser, baseURL }) => {
  test.setTimeout(120_000);
  const suffix = db.uniqueSuffix();
  const username = `html4templates${suffix}`;
  const password = `Legacy-${suffix}-Pass!`;
  const groupUser = db.seedUser();
  const emptyUser = db.seedUser();
  const org = { orgId: `html4_org_${suffix}`, orgDisplayName: `HTML4 Org ${suffix}` };
  const team = { teamId: `html4_team_${suffix}`, teamDisplayName: `HTML4 Team ${suffix}` };
  const domain = `${suffix}.html4.invalid`;
  const title = `HTML4 Template ${suffix}`;
  db.setUserGroups({ userId: groupUser.id, orgs: [org], teams: [team],
    email: `member@${domain}` });
  db.setUserGroups({ userId: emptyUser.id, orgs: [org], teams: [team],
    email: `empty@${domain}` });
  db.seedTemplatesBoard({ ownerId: groupUser.id, templateTitles: [title] });
  db.seedTemplatesBoard({ ownerId: emptyUser.id, templateTitles: [] });

  const legacyContext = await browser.newContext({ javaScriptEnabled: false, locale: 'en-US' });
  const legacy = await legacyContext.newPage();
  let admin;
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
      legacy.locator('form[action="/admin/people/shared-templates"] input[type="submit"]').first().click()]);

    await expect(legacy.locator('input[name="templateScopes"]')).toHaveCount(3);
    await expect(legacy.locator('body')).toContainText('Select a scope');
    await expect(legacy.locator('body')).not.toContainText(title);
    const filters = legacy.locator('form:has(input[name="legacyOperation"][value="filter-shared-templates"])');
    await filters.locator('input[value="organizations"]').check();
    await filters.locator('input[value="teams"]').check();
    await filters.locator('input[value="domains"]').check();
    await Promise.all([legacy.waitForNavigation(), filters.locator('input[type="submit"]').click()]);
    await expect(legacy.locator('body')).toContainText(org.orgDisplayName);
    await expect(legacy.locator('body')).toContainText(team.teamDisplayName);
    await expect(legacy.locator('body')).toContainText(domain);
    await expect(legacy.locator('body')).toContainText(title);
    await expect(legacy.locator('body')).not.toContainText(emptyUser.username);
    await expect(legacy.locator(`form[action^="/b/"]:has-text("${title}")`)).toHaveCount(3);
    if (process.env.WEKAN_HTML4_SCREENSHOTS) {
      fs.mkdirSync(process.env.WEKAN_HTML4_SCREENSHOTS, { recursive: true });
      await legacy.screenshot({ path: `${process.env.WEKAN_HTML4_SCREENSHOTS}/html4-people-shared-templates.png`, fullPage: true });
    }

    modernContext = await browser.newContext({ locale: 'en-US',
      viewport: { width: 1280, height: 1800 } });
    const modern = await modernContext.newPage();
    await loginWithToken(modern, admin._id, db.addResumeToken(admin._id));
    await navigateInApp(modern, '/admin/people/shared-templates');
    await waitForMeteor(modern);
    await modern.locator('a.js-toggle-template-scope[data-scope="organizations"]').click();
    await expect(modern.locator('.shared-templates-group h5', {
      hasText: org.orgDisplayName,
    })).toBeVisible();
    await expect(modern.locator('a.js-shared-template-link', { hasText: title })).toBeVisible();
    if (process.env.WEKAN_HTML4_SCREENSHOTS) await modern.screenshot({
      path: `${process.env.WEKAN_HTML4_SCREENSHOTS}/html5-people-shared-templates.png`,
      fullPage: true,
    });

    const anonymous = await legacyContext.newPage();
    await anonymous.goto(`${baseURL}/admin/people/shared-templates`);
    await expect(anonymous.locator('body')).toContainText(/not authorized/i);
    await expect(anonymous.locator('input[name="templateScopes"]')).toHaveCount(0);
  } finally {
    if (modernContext) await modernContext.close();
    await legacyContext.close();
    if (admin?._id) db.deleteMany('users', { _id: admin._id });
    db.cleanup({ userIds: [groupUser.id, emptyUser.id] });
  }
});
