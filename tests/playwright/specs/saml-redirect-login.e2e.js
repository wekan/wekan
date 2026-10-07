'use strict';
// SAML identity-provider profiles with a real signed response from the
// fixture identity provider: an Assertion-only signature, full-page redirect
// login, the "Invalid document signature" failure it replaces, and a token
// link opened in a tab that did not start the login.
const { test, expect } = require('../fixtures');
const fs = require('node:fs');
const path = require('node:path');
const { loginWithToken, navigateInApp } = require('../helpers/auth');
const db = require('../helpers/db');
const { startProvider } = require('../../integration/login-providers/provider.cjs');

const fixture = name => fs.readFileSync(path.resolve(__dirname, '../../fixtures/saml', name), 'utf8');

async function withProvider(page, adminUser, settings, run) {
  const certificate = fixture('idp-cert.pem');
  const provider = await startProvider({ certificate, privateKey: fixture('idp-key.pem') });
  provider.state.user = db.uid('saml-redirect');
  await loginWithToken(page, adminUser.id, adminUser.token);
  const previous = await page.evaluate(() => Meteor.callAsync('getSamlConfigSources'));
  const created = [];
  try {
    await page.evaluate(config => Meteor.callAsync('saveSamlSettings', config), {
      enabled: true, provider: 'redirect-regression', entryPoint: provider.url + '/saml',
      issuer: new URL(page.url()).origin, cert: certificate, mergeExistingUsers: false, ...settings,
    });
    await run(provider, created);
  } finally {
    await page.evaluate(config => Meteor.callAsync('saveSamlSettings', config), previous.overrides);
    if (created.length) db.cleanup({ userIds: created });
    await provider.close();
  }
}

async function startLogin(client, origin) {
  await client.goto(new URL('/sign-in', origin).toString());
  await client.waitForFunction(() => typeof Meteor !== 'undefined' && Meteor.status().connected
    && ServiceConfiguration.configurations.findOne({ service: 'saml' }));
  // Redirect mode: the page itself leaves for the identity provider, so start
  // it after evaluate() has returned.
  await client.evaluate(() => { setTimeout(() => Meteor.loginWithSaml({ provider: 'redirect-regression' }), 0); });
}

test('an Assertion-only identity provider logs in by full-page redirect', async ({ page, browser, adminUser }) => {
  await withProvider(page, adminUser, { idpProfile: 'signed-assertion-redirect' }, async (provider, created) => {
    provider.state.mode = 'assertion-only';
    const context = await browser.newContext();
    const client = await context.newPage();
    try {
      await startLogin(client, page.url());
      await client.waitForURL(url => url.pathname === '/' && !url.search.includes('samlToken'));
      // The exchange ends with a full reload of '/'; wait inside the new page.
      const userId = await (await client.waitForFunction(
        () => typeof Meteor !== 'undefined' && Meteor.userId(), null, { timeout: 30000 })).jsonValue();
      created.push(userId);
      expect(db.findOne('users', { _id: userId }).authenticationMethod).toBe('saml');
      // WebKit can still be finishing the exchange's last navigation here; read
      // the pending token from the page that settles, not the one going away.
      let pending;
      for (let attempt = 0; ; attempt++) {
        try { pending = await client.evaluate(() => sessionStorage.getItem('wekan-saml-pending-token')); break; }
        catch (error) {
          if (attempt === 2 || !/Execution context was destroyed|navigation/i.test(error.message)) throw error;
          await client.waitForLoadState('load');
        }
      }
      expect(pending).toBeNull();
    } finally { await context.close(); }

    // Tampered Assertion: refused, shown on the sign-in page, nobody logged in.
    provider.state.mode = 'assertion-only-tampered';
    const tamperedContext = await browser.newContext();
    const tampered = await tamperedContext.newPage();
    try {
      await startLogin(tampered, page.url());
      await tampered.waitForURL(url => url.pathname === '/sign-in' && !url.search.includes('samlError'));
      await expect(tampered.locator('#login-error-message')).toContainText(/signature/i);
      expect(await tampered.evaluate(() => Meteor.userId())).toBeNull();
    } finally { await tamperedContext.close(); }
  });
});

test('the standard profile refuses an Assertion-only signature with the reported error', async ({ page, browser, adminUser }) => {
  // Standard signature rules, redirect login: exactly the reported failure.
  await withProvider(page, adminUser, { idpProfile: 'standard', loginFlow: 'redirect' }, async provider => {
    provider.state.mode = 'assertion-only';
    const context = await browser.newContext();
    const client = await context.newPage();
    try {
      await startLogin(client, page.url());
      await client.waitForURL(url => url.pathname === '/sign-in' && !url.search.includes('samlError'));
      await expect(client.locator('#login-error-message')).toContainText('Invalid document signature');
      expect(await client.evaluate(() => Meteor.userId())).toBeNull();
    } finally { await context.close(); }
  });
});

test('a samlToken link opened in another browser does not log it in', async ({ page, browser, adminUser }) => {
  await withProvider(page, adminUser, { idpProfile: 'signed-assertion-redirect' }, async provider => {
    provider.state.mode = 'assertion-only';
    const starter = await browser.newContext();
    const victim = await browser.newContext();
    try {
      const startPage = await starter.newPage();
      // Keep the ACS's redirect back to WeKan instead of following it, so the
      // token is never used by the tab that started the login.
      let tokenUrl = null;
      await startPage.route(/\/_saml\/validate\//, async route => {
        const response = await route.fetch({ maxRedirects: 0 });
        tokenUrl = response.headers().location;
        await route.fulfill({ status: 200, contentType: 'text/html', body: '<p>stopped</p>' });
      });
      await startLogin(startPage, page.url());
      await expect.poll(() => tokenUrl).toBeTruthy();
      const victimPage = await victim.newPage();
      await victimPage.goto(tokenUrl);
      await victimPage.waitForFunction(() => typeof Meteor !== 'undefined' && Meteor.status().connected);
      await expect(victimPage.locator('#login-error-message')).toContainText('not started in this browser tab');
      expect(await victimPage.evaluate(() => Meteor.userId())).toBeNull();
      expect(victimPage.url()).not.toContain('samlToken');
    } finally { await starter.close(); await victim.close(); }
  });
});

test('Admin Panel offers the profile and each setting with a Default choice', async ({ page, adminUser }) => {
  await loginWithToken(page, adminUser.id, adminUser.token);
  const previous = await page.evaluate(() => Meteor.callAsync('getSamlConfigSources'));
  try {
    await navigateInApp(page, '/admin/people/saml');
    await expect(page.locator('#auth-idpProfile option')).toHaveText([/Default/, 'standard', 'signed-assertion-redirect']);
    await expect(page.locator('#auth-loginFlow option')).toHaveText([/Default \((popup|redirect)\)/, 'popup', 'redirect']);
    await page.locator('#auth-idpProfile').selectOption('signed-assertion-redirect');
    await page.locator('.js-auth-provider-settings button[type=submit]').click();
    await expect.poll(async () => (await page.evaluate(() => Meteor.callAsync('getSamlConfigSources'))).sources.loginFlow)
      .toEqual({ source: 'profile', value: 'redirect' });
    // Requiring neither signature is refused and nothing is saved.
    await page.locator('#auth-wantAssertionsSigned').selectOption('false');
    await page.locator('.js-auth-provider-settings button[type=submit]').click();
    await expect(page.locator('.warning')).toContainText('SAML_WANT_ASSERTIONS_SIGNED');
    const after = await page.evaluate(() => Meteor.callAsync('getSamlConfigSources'));
    expect(after.overrides.wantAssertionsSigned).toBeUndefined();
  } finally {
    await page.evaluate(config => Meteor.callAsync('saveSamlSettings', config), previous.overrides);
  }
});
