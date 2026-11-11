'use strict';

const crypto = require('node:crypto');
const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const { loginWithToken } = require('../helpers/auth');

const headers = token => ({ Authorization: `Bearer ${token}` });
const hash = token => crypto.createHash('sha256').update(token).digest('base64');
const tokens = user => db.findOne('users', { _id: user.id }).services.resume.loginTokens;

async function issueToken(request, admin, user) {
  const response = await request.post(`/api/createtoken/${user.id}`, {
    headers: headers(admin.token), data: { reason: 'Token revocation regression' },
  });
  expect(response.status()).toBe(200);
  const data = await response.json();
  expect(data._id).toBe(user.id);
  expect(typeof data.authToken).toBe('string');
  return data.authToken;
}

test('deleting a stored token hash revokes its session before responding and preserves another session', async ({ request, adminUser, user, user2 }) => {
  const issued = await issueToken(request, adminUser, user);
  expect((await request.get('/api/user', { headers: headers(issued) })).status()).toBe(200);
  const otherTokens = tokens(user2);
  const deletion = await request.post('/api/deletetoken', {
    headers: headers(adminUser.token), data: { userId: user.id, token: hash(issued) },
  });
  expect(deletion.status()).toBe(200);
  expect(tokens(user).some(entry => entry.hashedToken === hash(issued))).toBe(false);
  expect((await request.get('/api/user', { headers: headers(issued) })).status()).toBe(401);
  expect((await request.get('/api/user', { headers: headers(user.token) })).status()).toBe(200);
  expect(tokens(user2)).toEqual(otherTokens);
  expect(db.findOne('users', { _id: user.id }).loginDisabled).not.toBe(true);
});

test('supplying the original token retains the existing no-op behavior', async ({ request, adminUser, user }) => {
  const issued = await issueToken(request, adminUser, user);
  const before = tokens(user);
  const response = await request.post('/api/deletetoken', {
    headers: headers(adminUser.token), data: { userId: user.id, token: issued },
  });
  expect(response.status()).toBe(200);
  expect(tokens(user)).toEqual(before);
  expect((await request.get('/api/user', { headers: headers(issued) })).status()).toBe(200);
  expect((await request.get('/api/user', { headers: headers(user.token) })).status()).toBe(200);
});

test('only site administrators can revoke tokens and unknown tokens leave sessions intact', async ({ request, adminUser, user, user2 }) => {
  const before = tokens(user);
  for (const auth of [{}, headers(user2.token)]) {
    const response = await request.post('/api/deletetoken', {
      headers: auth, data: { userId: user.id, token: hash(user.token) },
    });
    expect([401, 403]).toContain(response.status());
    expect(tokens(user)).toEqual(before);
  }
  const unknown = await request.post('/api/deletetoken', {
    headers: headers(adminUser.token), data: { userId: user.id, token: crypto.randomBytes(24).toString('base64url') },
  });
  expect(unknown.status()).toBe(200);
  expect(tokens(user)).toEqual(before);
  const all = await request.post('/api/deletetoken', {
    headers: headers(adminUser.token), data: { userId: user.id },
  });
  expect(all.status()).toBe(200);
  expect(tokens(user)).toEqual([]);
  expect((await request.get('/api/user', { headers: headers(user.token) })).status()).toBe(401);
});

test('revoking a browser session signs it out while another session stays logged in', async ({ loggedInPage: page, browser, request, adminUser, user }) => {
  const survivorToken = db.addResumeToken(user.id);
  const otherContext = await browser.newContext();
  try {
    const otherPage = await otherContext.newPage();
    await loginWithToken(otherPage, user.id, survivorToken);
    expect(await page.evaluate(() => Meteor.userId())).toBe(user.id);
    expect(await otherPage.evaluate(() => Meteor.userId())).toBe(user.id);
    const response = await request.post('/api/deletetoken', {
      headers: headers(adminUser.token), data: { userId: user.id, token: hash(user.token) },
    });
    expect(response.status()).toBe(200);
    await expect.poll(() => page.evaluate(() => Meteor.userId())).toBeNull();
    expect(await otherPage.evaluate(() => Meteor.userId())).toBe(user.id);
    expect((await request.get('/api/user', { headers: headers(survivorToken) })).status()).toBe(200);
    expect(tokens(user).map(entry => entry.hashedToken)).toEqual([hash(survivorToken)]);
    // A fresh sign-in page cannot resume the revoked browser credential either.
    await page.goto('/sign-in');
    await page.waitForFunction(() => typeof Meteor !== 'undefined' && !Meteor.loggingIn());
    expect(await page.evaluate(() => Meteor.userId())).toBeNull();
    await expect(page.locator('#at-field-username_and_email')).toBeVisible();
  } finally {
    await otherContext.close();
  }
});
