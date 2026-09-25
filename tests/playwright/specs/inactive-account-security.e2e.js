'use strict';
const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const { loginWithToken, navigateInApp } = require('../helpers/auth');

test('inactive admin-created users cannot log in; active users can; disable revokes live sessions and tokens', async ({ page, browser, adminUser }) => {
  await loginWithToken(page, adminUser.id, adminUser.token);
  const password = 'InactiveRegression-9!';
  const username = db.uid('inactive');
  let id;
  const other = await browser.newContext();
  try {
    id = await page.evaluate(async ({ username, password }) => Meteor.callAsync('setCreateUser',
      'Inactive Regression', username, 'IR', password, 'false', 'true', `${username}@wekan-test.invalid`, [], [], []), { username, password });
    const created = db.findOne('users', { _id: id });
    expect(created.loginDisabled).toBe(true);
    expect(created.isAdmin).toBe(false);
    expect(created.profile.fullname).toBe('Inactive Regression');
    expect(created.profile.initials).toBe('IR');
    const restLogin = () => page.request.post('/users/login', { data: { username, password } });
    expect((await restLogin()).ok()).toBe(false);
    const client = await other.newPage();
    await client.goto('/sign-in');
    await client.waitForFunction(() => typeof Meteor !== 'undefined' && Meteor.status().connected);
    expect(await client.evaluate(({ username, password }) => new Promise(resolve =>
      Meteor.loginWithPassword(username, password, error => resolve(!!error))), { username, password })).toBe(true);
    await page.evaluate(id => Meteor.callAsync('editUser', id, { loginDisabled: false }), id);
    const response = await restLogin();
    expect(response.ok()).toBe(true);
    const body = await response.json();
    const token = body.data?.token || body.token;
    expect(token).toBeTruthy();
    await loginWithToken(client, id, token);
    expect(await client.evaluate(() => Meteor.userId())).toBe(id);
    expect((await page.request.get('/api/user', { headers: { Authorization: `Bearer ${token}`, Cookie: '' } })).ok()).toBe(true);
    // Active users cannot administer their own disabled status.
    expect(await client.evaluate(id => Meteor.callAsync('editUser', id, { loginDisabled: true })
      .then(() => false, () => true), id)).toBe(true);
    await page.evaluate(id => Meteor.callAsync('editUser', id, { loginDisabled: true }), id);
    await expect.poll(() => client.evaluate(() => Meteor.userId())).toBeNull();
    expect(db.findOne('users', { _id: id }).services.resume.loginTokens).toEqual([]);
    expect((await page.request.get('/api/user', { headers: { Authorization: `Bearer ${token}`, Cookie: '' } })).ok()).toBe(false);
    for (const headers of [
      { Authorization: `Bearer ${token}`, Cookie: '' },
      { Cookie: `meteor_login_token=${token}` },
      { 'X-User-Id': id, 'X-Auth-Token': token, Cookie: '' },
    ]) {
      const upload = await page.request.post('/api/attachment/upload', { headers, data: {} });
      expect([401, 403]).toContain(upload.status());
    }
    expect((await restLogin()).ok()).toBe(false);
    // Reactivation cannot resurrect the old token.
    await page.evaluate(id => Meteor.callAsync('editUser', id, { loginDisabled: false }), id);
    expect(await client.evaluate(token => new Promise(resolve =>
      Meteor.loginWithToken(token, error => resolve(!!error))), token)).toBe(true);
    // A direct database disable also revokes an existing session.
    const again = await (await restLogin()).json();
    await loginWithToken(client, id, again.data?.token || again.token);
    db.updateOne('users', { _id: id }, { $set: { loginDisabled: true } });
    await expect.poll(() => client.evaluate(() => Meteor.userId())).toBeNull();
    await expect.poll(() => db.findOne('users', { _id: id }).services.resume.loginTokens.length).toBe(0);
  } finally {
    await other.close();
    if (id) db.cleanup({ userIds: [id] });
  }
});

test('People Active control uses the authorized method and persists its change', async ({ page, adminUser, user }) => {
  await loginWithToken(page, adminUser.id, adminUser.token);
  await navigateInApp(page, '/admin/people');
  await page.locator('[data-id="people-setting"]').click();
  const toggle = page.locator(`.js-toggle-active-status[data-user-id="${user.id}"]`);
  // The fixture account can be beyond the first page in a developer database.
  const search = page.locator('input[type="search"], input.js-search').first();
  if (await search.isVisible()) await search.fill(user.username);
  await expect(toggle).toBeVisible();
  await toggle.click();
  await expect.poll(() => db.findOne('users', { _id: user.id }).loginDisabled).toBe(true);
  await expect(toggle).toHaveAttribute('data-is-active', 'false');
  await toggle.click();
  await expect.poll(() => db.findOne('users', { _id: user.id }).loginDisabled).toBe(false);
});


test('admin-created administrator flags persist and ordinary users cannot create accounts', async ({ page, adminUser, user }) => {
  await loginWithToken(page, user.id, user.token);
  const username = db.uid('admincreated');
  const args = ['Created Admin', username, 'CA', 'CreatedAdmin-9!', 'true', 'false', `${username}@wekan-test.invalid`, [], [], []];
  expect(await page.evaluate(args => Meteor.callAsync('setCreateUser', ...args).then(() => false, () => true), args)).toBe(true);
  expect(db.findOne('users', { username })).toBeNull();
  await loginWithToken(page, adminUser.id, adminUser.token);
  let id;
  try {
    id = await page.evaluate(args => Meteor.callAsync('setCreateUser', ...args), args);
    const created = db.findOne('users', { _id: id });
    expect(created.isAdmin).toBe(true);
    expect(created.loginDisabled).toBe(false);
  } finally {
    if (id) db.cleanup({ userIds: [id] });
  }
});
