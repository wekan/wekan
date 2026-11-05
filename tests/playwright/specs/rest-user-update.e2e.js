'use strict';

const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const { loginWithToken } = require('../helpers/auth');
const AdminPage = require('../pages/AdminPage');

const headers = token => ({ Authorization: `Bearer ${token}` });
const userPath = id => `/api/users/${id}`;

test('user PUT returns JSON 404 for missing users without changing existing users', async ({ request, adminUser, user }) => {
  const missing = db.uid('missing');
  const before = db.findOne('users', { _id: user.id });
  for (const data of [{ action: 'disableLogin' }, { action: 'enableLogin' }, { action: 'takeOwnership' }, {}]) {
    const response = await request.put(userPath(missing), { headers: headers(adminUser.token), data });
    expect(response.status()).toBe(404);
    expect(response.headers()['content-type']).toContain('application/json');
    expect(await response.json()).toEqual({ error: 'User not found' });
    expect(db.findOne('users', { _id: missing })).toBeNull();
    expect(db.findOne('users', { _id: user.id })).toEqual(before);
  }
});

test('user PUT preserves successful updates and hides session secrets', async ({ request, adminUser, user }) => {
  for (const [action, disabled] of [['disableLogin', true], ['enableLogin', false]]) {
    const response = await request.put(userPath(user.id), { headers: headers(adminUser.token), data: { action } });
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toMatchObject({ _id: user.id, loginDisabled: disabled });
    expect(body).not.toHaveProperty('services');
    expect(body).not.toHaveProperty('sessionData');
    const stored = db.findOne('users', { _id: user.id });
    expect(stored.loginDisabled).toBe(disabled);
    expect(stored.services.resume.loginTokens).toEqual([]);
  }
});

test('user PUT checks authentication and site-admin access before missing-user responses', async ({ request, user }) => {
  const before = db.findOne('users', { _id: user.id });
  for (const id of [user.id, db.uid('missing')]) {
    expect((await request.put(userPath(id), { data: { action: 'disableLogin' } })).status()).toBe(401);
    expect((await request.put(userPath(id), {
      headers: headers(user.token), data: { action: 'disableLogin' },
    })).status()).toBe(403);
  }
  expect(db.findOne('users', { _id: user.id })).toEqual(before);
});

test('People shows valid REST login changes after a missing-user update is rejected', async ({ page, request, adminUser, user }) => {
  await loginWithToken(page, adminUser.id, adminUser.token);
  const admin = new AdminPage(page);
  await admin.navigateToPeople();
  const row = admin.userRowByUsername(user.username);
  const status = row.locator('.js-toggle-active-status');
  await expect(status).toHaveAttribute('data-is-active', 'true');

  const missing = await request.put(userPath(db.uid('missing')), {
    headers: headers(adminUser.token), data: { action: 'disableLogin' },
  });
  expect(missing.status()).toBe(404);
  expect(await missing.json()).toEqual({ error: 'User not found' });
  await expect(status).toHaveAttribute('data-is-active', 'true');

  for (const [action, active] of [['disableLogin', 'false'], ['enableLogin', 'true']]) {
    const response = await request.put(userPath(user.id), {
      headers: headers(adminUser.token), data: { action },
    });
    expect(response.status()).toBe(200);
    await expect(status).toHaveAttribute('data-is-active', active);
    expect(db.findOne('users', { _id: user.id }).loginDisabled).toBe(active === 'false');
  }
});
