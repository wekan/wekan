'use strict';

const fs = require('node:fs');
const { test, expect } = require('@playwright/test');
const db = require('../helpers/db');

test('Forgot Password has equivalent HTML4 and HTML5 views at the same URL', async ({ browser, baseURL }) => {
  test.setTimeout(60_000);
  const output = `${process.cwd()}/../../.tools/html4-account-recovery`;
  fs.mkdirSync(output, { recursive: true });

  const legacyContext = await browser.newContext({ javaScriptEnabled: false, locale: 'en-US' });
  const legacy = await legacyContext.newPage();
  await legacy.goto(`${baseURL}/forgot-password`);
  await expect(legacy.locator('h1')).toContainText('Forgot password');
  const form = legacy.locator('form[action="/users/forgot-password"]');
  await expect(form.locator('label[for="email"]')).toContainText('Email');
  await form.locator('input[name="email"]').fill(`missing-${Date.now()}@wekan-test.invalid`);
  await Promise.all([legacy.waitForNavigation(), form.locator('input[type="submit"]').click()]);
  await expect(legacy.locator('body')).toContainText('Email sent');
  await legacy.screenshot({ path: `${output}/html4-forgot-password.png`, fullPage: true });

  const modernContext = await browser.newContext({ locale: 'en-US' });
  const modern = await modernContext.newPage();
  await modern.goto(`${baseURL}/forgot-password`);
  await expect(modern.locator('input[type="email"]')).toBeVisible();
  await expect(modern.locator('button[type="submit"], input[type="submit"]')).toBeVisible();
  await modern.screenshot({ path: `${output}/html5-forgot-password.png`, fullPage: true });

  await modernContext.close();
  await legacyContext.close();
});

test('Send verification again has equivalent HTML4 and HTML5 views at the same URL', async ({ browser, baseURL }) => {
  test.setTimeout(60_000);
  const output = `${process.cwd()}/../../.tools/html4-account-recovery`;
  fs.mkdirSync(output, { recursive: true });

  const legacyContext = await browser.newContext({ javaScriptEnabled: false, locale: 'en-US' });
  const legacy = await legacyContext.newPage();
  await legacy.goto(`${baseURL}/send-again`);
  const form = legacy.locator('form[action="/users/send-verification"]');
  await expect(form.locator('label[for="email"]')).toContainText('Email');
  await form.locator('input[name="email"]').fill(`missing-${Date.now()}@wekan-test.invalid`);
  await Promise.all([legacy.waitForNavigation(), form.locator('input[type="submit"]').click()]);
  await expect(legacy).toHaveURL(/verification=requested/);
  await expect(legacy.locator('body')).toContainText('Email sent');
  await legacy.screenshot({ path: `${output}/html4-send-again.png`, fullPage: true });

  const modernContext = await browser.newContext({ locale: 'en-US' });
  const modern = await modernContext.newPage();
  await modern.goto(`${baseURL}/send-again`);
  await expect(modern.locator('input[type="email"], input[name="email"]')).toBeVisible();
  await expect(modern.locator('button[type="submit"], input[type="submit"]')).toBeVisible();
  await modern.screenshot({ path: `${output}/html5-send-again.png`, fullPage: true });

  await modernContext.close();
  await legacyContext.close();
});

test('HTML4 reset, enrollment and verification tokens are single-use', async ({ browser, baseURL }) => {
  test.setTimeout(90_000);
  const suffix = `${Date.now()}${Math.floor(Math.random() * 10000)}`;
  const username = `html4token${suffix}`;
  const email = `${username}@wekan-test.invalid`;
  const resetToken = `reset-${suffix}`;
  const enrollToken = `enroll-${suffix}`;
  const verifyToken = `verify-${suffix}`;
  const output = `${process.cwd()}/../../.tools/html4-account-recovery`;
  fs.mkdirSync(output, { recursive: true });
  const legacyContext = await browser.newContext({ javaScriptEnabled: false, locale: 'en-US' });
  const legacy = await legacyContext.newPage();
  let user;
  let modernContext;
  try {
    await legacy.goto(`${baseURL}/sign-up`);
    await legacy.locator('input[name="username"]').fill(username);
    await legacy.locator('input[name="email"]').fill(email);
    await legacy.locator('input[name="password"]').fill(`Initial-${suffix}!`);
    await Promise.all([legacy.waitForNavigation(), legacy.locator('input[type="submit"]').click()]);
    user = db.findOne('users', { username });

    db.updateOne('users', { _id: user._id }, { $set: {
      'emails.0.verified': false,
      'services.password.reset': { token: resetToken, email, when: new Date() },
    } });
    await legacy.goto(`${baseURL}/reset-password/${resetToken}`);
    let form = legacy.locator('form[action="/users/reset-password"]');
    await expect(form.locator('input[name="password"]')).toBeVisible();
    await legacy.screenshot({ path: `${output}/html4-reset-password.png`, fullPage: true });
    await form.locator('input[name="password"]').fill(`Reset-${suffix}!`);
    await form.locator('input[name="passwordAgain"]').fill(`Reset-${suffix}!`);
    await Promise.all([legacy.waitForNavigation(), form.locator('input[type="submit"]').click()]);
    await expect(legacy.locator('body')).toContainText(username);
    await expect.poll(() => db.findOne('users', { _id: user._id })
      ?.services?.password?.reset).toBeUndefined();
    await expect.poll(() => db.findOne('users', { _id: user._id })
      ?.emails?.[0]?.verified).toBe(true);

    // A consumed token cannot overwrite the new password a second time.
    await legacy.goto(`${baseURL}/reset-password/${resetToken}`);
    form = legacy.locator('form[action="/users/reset-password"]');
    await form.locator('input[name="password"]').fill(`Replay-${suffix}!`);
    await form.locator('input[name="passwordAgain"]').fill(`Replay-${suffix}!`);
    await Promise.all([legacy.waitForNavigation(), form.locator('input[type="submit"]').click()]);
    await expect(legacy).toHaveURL(/token=failed/);

    db.updateOne('users', { _id: user._id }, { $set: {
      'emails.0.verified': false,
      'services.password.enroll': { token: enrollToken, email, when: new Date() },
    } });
    await legacy.goto(`${baseURL}/enroll-account/${enrollToken}`);
    form = legacy.locator('form[action="/users/reset-password"]');
    await expect(form.locator('input[name="tokenKind"]')).toHaveValue('enroll');
    await legacy.screenshot({ path: `${output}/html4-enroll-account.png`, fullPage: true });
    await form.locator('input[name="password"]').fill(`Enrolled-${suffix}!`);
    await form.locator('input[name="passwordAgain"]').fill(`Enrolled-${suffix}!`);
    await Promise.all([legacy.waitForNavigation(), form.locator('input[type="submit"]').click()]);
    await expect.poll(() => db.findOne('users', { _id: user._id })
      ?.services?.password?.enroll).toBeUndefined();

    db.updateOne('users', { _id: user._id }, { $set: {
      'emails.0.verified': false,
      'services.email.verificationTokens': [{ token: verifyToken, address: email,
        when: new Date() }],
    } });
    await legacy.goto(`${baseURL}/verify-email/${verifyToken}`);
    form = legacy.locator('form[action="/users/verify-email"]');
    await expect(form.locator('input[name="token"]')).toHaveValue(verifyToken);
    await legacy.screenshot({ path: `${output}/html4-verify-email.png`, fullPage: true });
    await Promise.all([legacy.waitForNavigation(), form.locator('input[type="submit"]').click()]);
    await expect.poll(() => db.findOne('users', { _id: user._id })
      ?.emails?.[0]?.verified).toBe(true);
    await expect.poll(() => db.findOne('users', { _id: user._id })
      ?.services?.email?.verificationTokens || []).toHaveLength(0);

    modernContext = await browser.newContext({ locale: 'en-US' });
    const modern = await modernContext.newPage();
    await modern.goto(`${baseURL}/reset-password/not-a-real-token`);
    await expect(modern.locator('input[type="password"]')).toHaveCount(2);
    await modern.screenshot({ path: `${output}/html5-reset-password.png`, fullPage: true });
    await modern.goto(`${baseURL}/enroll-account/not-a-real-token`);
    await expect(modern.locator('input[type="password"]')).toHaveCount(2);
    await modern.screenshot({ path: `${output}/html5-enroll-account.png`, fullPage: true });
    await modern.goto(`${baseURL}/verify-email/not-a-real-token`);
    await expect(modern.locator('body')).toBeVisible();
    await modern.screenshot({ path: `${output}/html5-verify-email.png`, fullPage: true });
  } finally {
    if (user) db.deleteOne('users', { _id: user._id });
    if (modernContext) await modernContext.close();
    await legacyContext.close();
  }
});
