'use strict';

const fs = require('node:fs');
const { test, expect } = require('@playwright/test');
const db = require('../helpers/db');
const { loginWithToken, navigateInApp, waitForMeteor } = require('../helpers/auth');

const GIF = Buffer.from('R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==', 'base64');

test('Settings Visibility has equivalent complete HTML4 operations', async ({ browser, baseURL }) => {
  test.setTimeout(120_000);
  const suffix = db.uniqueSuffix();
  const username = `html4visibility${suffix}`;
  const password = `Legacy-${suffix}-Pass!`;
  const productName = `Visibility ${suffix}`;
  const legacyContext = await browser.newContext({ javaScriptEnabled: false, locale: 'fi-FI' });
  const legacy = await legacyContext.newPage();
  let user;
  let original;
  let originalPrivate;
  let modernContext;
  try {
    await legacy.goto(`${baseURL}/sign-up`);
    await legacy.locator('input[name="username"]').fill(username);
    await legacy.locator('input[name="email"]').fill(`${username}@wekan-test.invalid`);
    await legacy.locator('input[name="password"]').fill(password);
    await Promise.all([legacy.waitForNavigation(), legacy.locator('input[type="submit"]').click()]);
    user = db.findOne('users', { username });
    db.updateOne('users', { _id: user._id }, {
      $set: { isAdmin: true, loginDisabled: false, 'profile.language': 'fi' },
    });
    original = db.findOne('settings', {});
    originalPrivate = db.findOne('tableVisibilityModeSettings', {
      _id: 'tableVisibilityMode-allowPrivateOnly',
    });
    await Promise.all([legacy.waitForNavigation(),
      legacy.locator('form[action="/allboards"] input[type="submit"]').first().click()]);
    await Promise.all([legacy.waitForNavigation(),
      legacy.locator('form[action="/admin/settings/version"] input[type="submit"]').first().click()]);
    await Promise.all([legacy.waitForNavigation(),
      legacy.locator('form[action="/admin/settings/visibility"] input[type="submit"]').first().click()]);

    let form = legacy.locator('form:has(input[name="legacyOperation"][value="save-visibility-allboards"])');
    for (const name of ['allowPrivateOnly', 'hideBoardActivitiesOnAllBoards',
      'hideCardCounterList', 'hideBoardMemberList']) {
      if (!(await form.locator(`input[name="${name}"]`).isChecked())) {
        await form.locator(`input[name="${name}"]`).check();
      }
    }
    await form.locator('select[name="spinnerName"]').selectOption('Wave');
    await Promise.all([legacy.waitForNavigation(), form.locator('input[type="submit"]').click()]);

    form = legacy.locator('form:has(input[name="legacyOperation"][value="save-visibility-urls"])');
    for (const name of ['supportPageEnabled', 'supportPagePublic']) {
      if (!(await form.locator(`input[name="${name}"]`).isChecked())) await form.locator(`input[name="${name}"]`).check();
    }
    await form.locator('input[name="supportTitle"]').fill(`Support ${suffix}`);
    await form.locator('textarea[name="supportPageText"]').fill(`Support content ${suffix}`);
    await form.locator('input[name="customHelpLinkUrl"]').fill(`/help/${suffix}`);
    await form.locator('input[name="legalNotice"]').fill(`https://example.com/legal/${suffix}`);
    await form.locator('textarea[name="automaticLinkedUrlSchemes"]').fill('gemini\nipfs');
    await Promise.all([legacy.waitForNavigation(), form.locator('input[type="submit"]').click()]);

    form = legacy.locator('form:has(input[name="legacyOperation"][value="save-visibility-product"])');
    await form.locator('input[name="productName"]').fill(productName);
    await Promise.all([legacy.waitForNavigation(), form.locator('input[type="submit"]').click()]);
    form = legacy.locator('form:has(input[name="legacyOperation"][value="save-visibility-theme"])');
    await form.locator('select[name="themeColor"]').selectOption('nephritis');
    await form.locator('input[name="themeCustomColor1"]').fill('#123456');
    await Promise.all([legacy.waitForNavigation(), form.locator('input[type="submit"]').click()]);

    form = legacy.locator('form:has(input[name="legacyOperation"][value="save-visibility-logos"])');
    if (!(await form.locator('input[name="hideLogo"]').isChecked())) await form.locator('input[name="hideLogo"]').check();
    await form.locator('input[name="customLoginLogoLinkUrl"]').fill(`https://example.com/login/${suffix}`);
    await form.locator('textarea[name="textBelowCustomLoginLogo"]').fill(`Below ${suffix}`);
    await form.locator('input[name="customTopLeftCornerLogoLinkUrl"]').fill(`https://example.com/top/${suffix}`);
    await form.locator('input[name="customTopLeftCornerLogoHeight"]').fill('31');
    await Promise.all([legacy.waitForNavigation(), form.locator('input[type="submit"]').click()]);

    form = legacy.locator('form:has(input[name="brandingSlot"][value="login"])');
    await form.locator('input[type="file"]').setInputFiles({ name: 'logo.png', mimeType: 'image/png', buffer: GIF });
    await Promise.all([legacy.waitForNavigation(), form.locator('input[type="submit"]').click()]);
    await expect.poll(() => db.findOne('settings', {})?.productName).toBe(productName);
    await expect.poll(() => db.findOne('settings', {})?.customLoginLogoImageUrl)
      .toMatch(/^\/branding\/images\/.+\.gif$/);
    await expect(legacy.locator('img[src^="/branding/images/"]')).toHaveCount(1);
    if (process.env.WEKAN_HTML4_SCREENSHOTS) {
      fs.mkdirSync(process.env.WEKAN_HTML4_SCREENSHOTS, { recursive: true });
      await legacy.screenshot({ path: `${process.env.WEKAN_HTML4_SCREENSHOTS}/html4-visibility.png`, fullPage: true });
    }

    modernContext = await browser.newContext({ locale: 'en-US', viewport: { width: 1280, height: 2400 } });
    const modern = await modernContext.newPage();
    await loginWithToken(modern, user._id, db.addResumeToken(user._id));
    await navigateInApp(modern, '/admin/settings/visibility');
    await waitForMeteor(modern);
    await expect(modern.locator('#product-name')).toHaveValue(productName);
    await expect(modern.locator('#support-title')).toHaveValue(`Support ${suffix}`);
    await expect(modern.locator('#custom-help-link-url')).toHaveValue(`/help/${suffix}`);
    await expect(modern.locator('#custom-login-logo-link-url')).toHaveValue(`https://example.com/login/${suffix}`);
    await expect(modern.locator('#spinnerName')).toHaveValue('Wave');
    await expect(modern.locator('img.admin-branding-preview').first()).toHaveAttribute('src', /\/branding\/images\/.+\.gif$/);
    if (process.env.WEKAN_HTML4_SCREENSHOTS) await modern.screenshot({
      path: `${process.env.WEKAN_HTML4_SCREENSHOTS}/html5-visibility.png`, fullPage: true,
    });

    form = legacy.locator('form:has(input[name="legacyOperation"][value="save-visibility-urls"])');
    await form.locator('input[name="customHelpLinkUrl"]').fill('javascript:alert(1)');
    await Promise.all([legacy.waitForNavigation(), form.locator('input[type="submit"]').click()]);
    expect(db.findOne('settings', {})?.customHelpLinkUrl).toBe(`/help/${suffix}`);

    const anonymous = await legacyContext.newPage();
    await anonymous.goto(`${baseURL}/admin/settings/visibility`);
    await expect(anonymous.locator('body')).toContainText(/Sinulla ei ole oikeutta|Not authorized/);
    await expect(anonymous.locator('body')).not.toContainText(`Support content ${suffix}`);
  } finally {
    if (original?._id) {
      const { _id, ...originalFields } = original;
      db.updateOne('settings', { _id }, { $set: originalFields });
    }
    if (originalPrivate?._id) db.updateOne('tableVisibilityModeSettings',
      { _id: originalPrivate._id }, { $set: { booleanValue: originalPrivate.booleanValue } });
    if (modernContext) await modernContext.close();
    await legacyContext.close();
    if (user?._id) db.deleteMany('users', { _id: user._id });
  }
});
