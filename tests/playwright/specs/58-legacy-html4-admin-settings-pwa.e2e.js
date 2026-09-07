'use strict';

const fs = require('node:fs');
const { test, expect } = require('@playwright/test');
const db = require('../helpers/db');
const { loginWithToken, navigateInApp, waitForMeteor } = require('../helpers/auth');

test('Settings PWA has equivalent validated HTML4 writes and assets', async ({
  browser,
  baseURL,
}) => {
  test.setTimeout(90_000);
  const suffix = `${Date.now()}${Math.floor(Math.random() * 10000)}`;
  const username = `html4pwa${suffix}`;
  const password = `Legacy-${suffix}-Pass!`;
  const manifestName = `PWA ${suffix}`;
  const meta = '<meta name="theme-color" content="#123456">';
  const link = '<link rel="icon" href="/favicon.ico">';
  const manifest = JSON.stringify({ name: manifestName });
  const assetlinks = JSON.stringify([{ relation: [`delegate_${suffix}`], target: {
    namespace: 'web', site: 'https://testi.wekan.fi',
  } }]);
  const legacyContext = await browser.newContext({ javaScriptEnabled: false, locale: 'fi-FI' });
  const legacy = await legacyContext.newPage();
  let user;
  let original;
  let modernContext;
  try {
    await legacy.goto(`${baseURL}/sign-up`);
    await legacy.locator('input[name="username"]').fill(username);
    await legacy.locator('input[name="email"]').fill(`${username}@wekan-test.invalid`);
    await legacy.locator('input[name="password"]').fill(password);
    await Promise.all([
      legacy.waitForNavigation(), legacy.locator('input[type="submit"]').click(),
    ]);
    user = db.findOne('users', { username });
    db.updateOne('users', { _id: user._id }, {
      $set: { isAdmin: true, 'profile.language': 'fi' },
    });
    original = db.findOne('settings', {});

    await Promise.all([
      legacy.waitForNavigation(),
      legacy.locator('form[action="/allboards"] input[type="submit"]').first().click(),
    ]);
    await Promise.all([
      legacy.waitForNavigation(),
      legacy.locator('form[action="/admin/settings/version"] input[type="submit"]')
        .first().click(),
    ]);
    await Promise.all([
      legacy.waitForNavigation(),
      legacy.locator('form[action="/admin/settings/pwa"] input[type="submit"]')
        .first().click(),
    ]);

    const headForm = legacy.locator(
      'form:has(input[name="legacyOperation"][value="set-pwa-head-content"])',
    );
    await headForm.locator('textarea[name="customHeadMetaTags"]').fill(meta);
    await headForm.locator('textarea[name="customHeadLinkTags"]').fill(link);
    await headForm.locator('textarea[name="customManifestContent"]').fill(manifest);
    await Promise.all([
      legacy.waitForNavigation(), headForm.locator('input[type="submit"]').click(),
    ]);
    const assetForm = legacy.locator(
      'form:has(input[name="legacyOperation"][value="set-pwa-assetlinks"])',
    );
    await assetForm.locator('textarea[name="customAssetLinksContent"]').fill(assetlinks);
    await Promise.all([
      legacy.waitForNavigation(), assetForm.locator('input[type="submit"]').click(),
    ]);
    for (const field of ['customHeadEnabled', 'customManifestEnabled',
      'customAssetLinksEnabled']) {
      const form = legacy.locator(
        `form:has(input[name="settingField"][value="${field}"])`,
      );
      await form.locator('select[name="enabled"]').selectOption('true');
      await Promise.all([
        legacy.waitForNavigation(), form.locator('input[type="submit"]').click(),
      ]);
    }
    await expect.poll(() => db.findOne('settings', {})?.customHeadMetaTags).toBe(meta);
    await expect.poll(() => db.findOne('settings', {})?.customManifestEnabled).toBe(true);
    if (process.env.WEKAN_HTML4_SCREENSHOTS) {
      fs.mkdirSync(process.env.WEKAN_HTML4_SCREENSHOTS, { recursive: true });
      await legacy.screenshot({
        path: `${process.env.WEKAN_HTML4_SCREENSHOTS}/html4-admin-settings-pwa.png`,
        fullPage: true,
      });
    }

    const manifestResponse = await legacy.request.get(`${baseURL}/site.webmanifest`);
    expect(await manifestResponse.json()).toEqual({ name: manifestName });
    const assetResponse = await legacy.request.get(`${baseURL}/.well-known/assetlinks.json`);
    expect((await assetResponse.json())[0].relation).toEqual([`delegate_${suffix}`]);
    const headPage = await legacyContext.newPage();
    await headPage.goto(`${baseURL}/sign-in`);
    await expect(headPage.locator('meta[name="theme-color"]')).toHaveAttribute('content', '#123456');
    await expect(headPage.locator('link[rel="icon"][href="/favicon.ico"]')).toHaveCount(1);

    modernContext = await browser.newContext({
      locale: 'fi-FI', viewport: { width: 1280, height: 2200 },
    });
    const modern = await modernContext.newPage();
    await loginWithToken(modern, user._id, db.addResumeToken(user._id));
    await navigateInApp(modern, '/admin/settings/pwa');
    await waitForMeteor(modern);
    await expect(modern.locator('meta[name="theme-color"]'))
      .toHaveAttribute('content', '#123456');
    await expect(modern.locator('#custom-head-meta')).toHaveValue(meta);
    await expect(modern.locator('#custom-head-links')).toHaveValue(link);
    await expect(modern.locator('#custom-manifest-content')).toHaveValue(
      new RegExp(manifestName),
    );
    await expect(modern.locator('#custom-assetlinks-content')).toHaveValue(
      new RegExp(`delegate_${suffix}`),
    );
    if (process.env.WEKAN_HTML4_SCREENSHOTS) {
      await modern.screenshot({
        path: `${process.env.WEKAN_HTML4_SCREENSHOTS}/html5-admin-settings-pwa.png`,
        fullPage: true,
      });
    }

    const anonymous = await legacyContext.newPage();
    await anonymous.goto(`${baseURL}/admin/settings/pwa`);
    await expect(anonymous.locator('body')).toContainText(
      /Sinulla ei ole oikeutta tarkastella tätä sivua|Not authorized/,
    );
    await expect(anonymous.locator('body')).not.toContainText(manifestName);
  } finally {
    if (original?._id) db.updateOne('settings', { _id: original._id }, { $set: {
      customHeadEnabled: original.customHeadEnabled === true,
      customHeadMetaTags: original.customHeadMetaTags || '',
      customHeadLinkTags: original.customHeadLinkTags || '',
      customManifestEnabled: original.customManifestEnabled === true,
      customManifestContent: original.customManifestContent || '',
      customAssetLinksEnabled: original.customAssetLinksEnabled === true,
      customAssetLinksContent: original.customAssetLinksContent || '',
    } });
    if (modernContext) await modernContext.close();
    await legacyContext.close();
    if (user?._id) db.deleteMany('users', { _id: user._id });
  }
});
