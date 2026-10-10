'use strict';
const { test, expect } = require('../fixtures');
test('SAML sign-in displays callback errors as text and clears them before another attempt', async ({ page }) => {
  await page.goto('/sign-in');
  await page.waitForFunction(() => typeof Meteor !== 'undefined' && Meteor.status().connected);
  await expect(page.locator('#login-error-message')).toBeAttached();
  await page.evaluate(() => {
    document.getElementById('at-saml').classList.remove('hide');
    Meteor.loginWithSaml = (_options, callback) => { window.samlTestCallback = callback; callback(new Meteor.Error('saml-login-failed', '<b>SAML certificate validation failed</b>')); };
  });
  await page.locator('#at-saml').click({ force: true });
  await expect(page.locator('#login-error-message')).toHaveText('<b>SAML certificate validation failed</b>');
  await expect(page.locator('#login-error-message b')).toHaveCount(0);
  await expect(page).toHaveURL(/\/sign-in/);
  await page.evaluate(() => { Meteor.loginWithSaml = (_options, callback) => { window.samlTestCallback = callback; }; });
  await page.locator('#at-saml').click({ force: true });
  await expect(page.locator('#login-error-message')).toHaveText('');
});

test('real signed SAML popup establishes a Meteor session and failed ACS returns its actual error', async ({ page, browser, adminUser }) => {
  const fs = require('node:fs'), path = require('node:path'), { execFileSync } = require('node:child_process');
  const { startProvider } = require('../../integration/login-providers/provider.cjs');
  const { loginWithToken } = require('../helpers/auth');
  const db = require('../helpers/db');
  const parent = process.env.TMPDIR || path.resolve('.tools/tmp');
  const work = fs.mkdtempSync(path.join(parent, 'saml-browser-'));
  execFileSync('openssl', ['req', '-x509', '-newkey', 'rsa:2048', '-nodes', '-keyout', work + '/key.pem', '-out', work + '/cert.pem', '-days', '2', '-subj', '/CN=WeKan-test-only'], { stdio: 'ignore' });
  const certificate = fs.readFileSync(work + '/cert.pem', 'utf8');
  const provider = await startProvider({ certificate, privateKey: fs.readFileSync(work + '/key.pem', 'utf8') });
  provider.state.user = db.uid('saml-popup');
  let previous, createdId;
  try {
    await loginWithToken(page, adminUser.id, adminUser.token);
    previous = await page.evaluate(() => Meteor.callAsync('getSamlConfigSources'));
    await page.evaluate(config => Meteor.callAsync('saveSamlSettings', config), {
      enabled: true, provider: 'popup-regression', entryPoint: provider.url + '/saml', issuer: new URL(page.url()).origin,
      // SAML logs in by full-page redirect by default since ad51a03731 (a
      // popup is blocked in iframes and on some phones, and an identity
      // provider's Cross-Origin-Opener-Policy can cut it off). This test is
      // about the POPUP flow, which SAML_LOGIN_FLOW=popup still chooses, so it
      // asks for it; without it loginWithSaml navigates this page away to the
      // identity provider, which is the deliberate new default, not a bug.
      cert: certificate, mergeExistingUsers: false, loginFlow: 'popup',
    });
    for (const mode of ['allow', 'subject-conflict', 'tampered']) {
      provider.state.mode = mode === 'subject-conflict' ? 'allow' : mode;
      provider.state.samlEmail = `${provider.state.user}.saml@example.invalid`;
      provider.state.samlNameID = mode === 'subject-conflict' ? 'different-subject' : undefined;
      const context = await browser.newContext(), client = await context.newPage();
      try {
        await client.goto(new URL('/sign-in', page.url()).toString());
        await client.waitForFunction(() => typeof Meteor !== 'undefined' && Meteor.status().connected);
        // Until the SAML service configuration has arrived the client takes the
        // redirect (saml_client.js samlLoginFlow): wait for the popup setting.
        await client.waitForFunction(() => Package['service-configuration'].ServiceConfiguration.configurations
          .findOne({ service: 'saml' })?.loginFlow === 'popup');
        await client.evaluate(() => {
          window.samlResult = null;
          Meteor.loginWithSaml({ provider: 'popup-regression' }, error => { window.samlResult = error ? { error: error.error, reason: error.reason } : { ok: true }; });
        });
        await expect.poll(() => client.evaluate(() => window.samlResult)).toBeTruthy();
        const result = await client.evaluate(() => window.samlResult);
        if (mode === 'allow') {
          expect(result).toEqual({ ok: true });
          createdId = await client.evaluate(() => Meteor.userId());
          expect(createdId).toBeTruthy();
          expect(db.findOne('users', { _id: createdId }).authenticationMethod).toBe('saml');
        } else if (mode === 'subject-conflict') {
          expect(result.error).toBe('saml-account-conflict');
          expect(await client.evaluate(() => Meteor.userId())).toBeNull();
          expect(db.findOne('users', { _id: createdId }).services.saml.nameID).toBe(provider.state.samlEmail);
        } else {
          expect(result.error).toBe('saml-login-failed');
          expect(result.reason).not.toContain('no matching SAML login attempt');
          expect(await client.evaluate(() => Meteor.userId())).toBeNull();
        }
      } finally { await context.close(); }
    }
  } finally {
    if (previous) await page.evaluate(config => Meteor.callAsync('saveSamlSettings', config), previous.overrides);
    if (createdId) db.cleanup({ userIds: [createdId] });
    await provider.close(); fs.rmSync(work, { recursive: true, force: true });
  }
});
