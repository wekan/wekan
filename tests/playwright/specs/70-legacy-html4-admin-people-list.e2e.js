'use strict';

const fs = require('node:fs');
const { test, expect } = require('@playwright/test');
const db = require('../helpers/db');
const { loginWithToken, navigateInApp, waitForMeteor } = require('../helpers/auth');

test('People list, filters, state and locations match at the same URL', async ({ browser, baseURL }) => {
  test.setTimeout(180_000);
  const suffix = db.uniqueSuffix();
  const username = `html4people${suffix}`;
  const password = `Legacy-${suffix}-Pass!`;
  const target = db.seedUser();
  const removable = db.seedUser();
  const teamId = `people-team-${suffix}`;
  const addressId = `people-address-${suffix}`;
  const address = '198.51.100.44';
  const at = new Date();
  db.updateOne('users', { _id: target.id }, { $set: {
    username: `person_${suffix}`,
    loginDisabled: false,
    loginAddresses: { entries: { address: {
      value: address, family: 'ipv4', count: 3, firstAt: at, at,
    } }, overflow: 0 },
  } });
  db.updateOne('users', { _id: removable.id }, { $set: {
    username: `removable_${suffix}`, loginDisabled: false,
  } });
  db.insertMany('team', [{ _id: teamId, teamDisplayName: `People Team ${suffix}`,
    teamIsActive: true, createdAt: at, modifiedAt: at }]);
  db.insertMany('loginAddresses', [{ _id: addressId, address, ipv4: address,
    ipv6: '', location: { country: 'FI', city: `People City ${suffix}` },
    locationLabel: `People City ${suffix}` }]);
  const legacyContext = await browser.newContext({ javaScriptEnabled: false, locale: 'en-US' });
  const legacy = await legacyContext.newPage();
  let admin;
  let created;
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

    let form = legacy.locator('form:has(input[name="legacyOperation"][value="show-create-person"])');
    await Promise.all([legacy.waitForNavigation(), form.locator('input[type="submit"]').click()]);
    form = legacy.locator('form:has(input[name="legacyOperation"][value="create-person"])');
    await form.locator('input[name="fullname"]').fill(`Created Person ${suffix}`);
    await form.locator('input[name="username"]').fill(`created_${suffix}`);
    await form.locator('input[name="initials"]').fill('CP');
    await form.locator('input[name="email"]').fill(`created_${suffix}@wekan-test.invalid`);
    await form.locator('input[name="password"]').fill(`Created-${suffix}-Pass!`);
    await Promise.all([legacy.waitForNavigation(), form.locator('input[type="submit"]').click()]);
    created = db.findOne('users', { username: `created_${suffix}` });
    expect(created).toBeTruthy();
    expect(created.profile.fullname).toBe(`Created Person ${suffix}`);

    form = legacy.locator(`form:has(input[name="legacyOperation"][value="update-person"]):has(input[name="targetUserId"][value="${created._id}"])`);
    await form.locator('input[name="fullname"]').fill(`Updated Person ${suffix}`);
    await form.locator('input[name="initials"]').fill('UP');
    await form.locator('select[name="emailVerified"]').selectOption('true');
    await form.locator('input[name="importUsernames"]').fill('old-one; old-two');
    await Promise.all([legacy.waitForNavigation(), form.locator('input[type="submit"]').click()]);
    await expect.poll(() => db.findOne('users', { _id: created._id })?.profile?.fullname)
      .toBe(`Updated Person ${suffix}`);
    const updated = db.findOne('users', { _id: created._id });
    expect(updated.profile.initials).toBe('UP');
    expect(updated.emails[0].verified).toBe(true);
    expect(updated.importUsernames).toEqual(['old-one', 'old-two']);

    form = legacy.locator(`form:has(input[name="legacyOperation"][value="upload-person-avatar"]):has(input[name="targetUserId"][value="${created._id}"])`);
    await form.locator('input[name="avatarImage"]').setInputFiles({
      name: 'person.png', mimeType: 'image/png',
      buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=', 'base64'),
    });
    await Promise.all([legacy.waitForNavigation(), form.locator('input[type="submit"]').click()]);
    const avatarUrl = db.findOne('users', { _id: created._id })?.profile?.avatarUrl;
    expect(avatarUrl).toMatch(/^\/cdn\/storage\/avatars\//);
    const avatarId = avatarUrl.split('/').pop();
    expect(db.findOne('avatars', { _id: avatarId })?.type).toBe('image/gif');

    form = legacy.locator(`form:has(input[name="legacyOperation"][value="upload-person-avatar"]):has(input[name="targetUserId"][value="${created._id}"])`);
    await form.locator('input[name="avatarImage"]').setInputFiles({
      name: 'person-second.png', mimeType: 'image/png',
      buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=', 'base64'),
    });
    await Promise.all([legacy.waitForNavigation(), form.locator('input[type="submit"]').click()]);
    const secondAvatarId = db.findOne('users', { _id: created._id })
      .profile.avatarUrl.split('/').pop();
    expect(secondAvatarId).not.toBe(avatarId);
    form = legacy.locator(`form:has(input[name="legacyOperation"][value="select-person-avatar"]):has(input[name="avatarId"][value="${avatarId}"])`);
    await Promise.all([legacy.waitForNavigation(), form.locator('input[type="submit"]').click()]);
    form = legacy.locator(`form:has(input[name="legacyOperation"][value="request-delete-person-avatar"]):has(input[name="avatarId"][value="${secondAvatarId}"])`);
    await Promise.all([legacy.waitForNavigation(), form.locator('input[type="submit"]').click()]);
    form = legacy.locator(`form:has(input[name="legacyOperation"][value="delete-person-avatar"]):has(input[name="avatarId"][value="${secondAvatarId}"])`);
    await Promise.all([legacy.waitForNavigation(), form.locator('input[type="submit"]').click()]);
    expect(db.findOne('avatars', { _id: secondAvatarId })).toBeFalsy();
    expect(db.findOne('users', { _id: created._id }).profile.avatarUrl)
      .toBe(`/cdn/storage/avatars/${avatarId}`);

    form = legacy.locator('form:has(input[name="legacyOperation"][value="update-people-team"])');
    await form.locator(`input[name="targetUserIds"][value="${created._id}"]`).check();
    await form.locator('select[name="teamId"]').selectOption(teamId);
    await Promise.all([legacy.waitForNavigation(), form.locator('input[type="submit"]').click()]);
    await expect.poll(() => db.findOne('users', { _id: created._id })?.teams?.[0]?.teamId)
      .toBe(teamId);

    form = legacy.locator(`form:has(input[name="legacyOperation"][value="request-delete-person"]):has(input[name="targetUserId"][value="${removable.id}"])`);
    await Promise.all([legacy.waitForNavigation(), form.locator('input[type="submit"]').click()]);
    form = legacy.locator(`form:has(input[name="legacyOperation"][value="delete-person"]):has(input[name="targetUserId"][value="${removable.id}"])`);
    await Promise.all([legacy.waitForNavigation(), form.locator('input[type="submit"]').click()]);
    await expect.poll(() => db.findOne('users', { _id: removable.id })).toBeFalsy();

    const search = legacy.locator('form:has(input[name="q"][type="text"])');
    await search.locator('input[name="q"]').fill(suffix);
    await Promise.all([legacy.waitForNavigation(), search.locator('input[type="submit"]').click()]);
    await expect(legacy.locator('tbody')).toContainText(`person_${suffix}`);
    await expect(legacy.locator('tbody')).toContainText('FI (3)');
    form = legacy.locator(`form:has(input[name="legacyOperation"][value="show-login-country"]):has(input[name="targetUserId"][value="${target.id}"])`);
    await Promise.all([legacy.waitForNavigation(), form.locator('input[type="submit"]').click()]);
    await expect(legacy.locator('tbody')).toContainText(`People City ${suffix}`);
    await expect(legacy.locator('tbody')).toContainText(address);

    form = legacy.locator(`form:has(input[name="legacyOperation"][value="set-person-active"]):has(input[name="targetUserId"][value="${target.id}"])`);
    await Promise.all([legacy.waitForNavigation(), form.locator('input[type="submit"]').click()]);
    await expect.poll(() => db.findOne('users', { _id: target.id })?.loginDisabled).toBe(true);
    const filter = legacy.locator('form:has(select[name="filter"])');
    await filter.locator('select[name="filter"]').selectOption('inactive');
    await Promise.all([legacy.waitForNavigation(), filter.locator('input[type="submit"]').click()]);
    await expect(legacy.locator('tbody')).toContainText(`person_${suffix}`);
    if (process.env.WEKAN_HTML4_SCREENSHOTS) {
      fs.mkdirSync(process.env.WEKAN_HTML4_SCREENSHOTS, { recursive: true });
      await legacy.screenshot({
        path: `${process.env.WEKAN_HTML4_SCREENSHOTS}/html4-people-list.png`, fullPage: true,
      });
    }

    modernContext = await browser.newContext({ locale: 'en-US',
      viewport: { width: 1600, height: 2400 } });
    const modern = await modernContext.newPage();
    await loginWithToken(modern, admin._id, db.addResumeToken(admin._id));
    await navigateInApp(modern, '/admin/people/people');
    await waitForMeteor(modern);
    const input = modern.locator('.js-table-page-search');
    await input.fill(suffix);
    await input.press('Enter');
    const row = modern.locator('tbody tr', { hasText: `person_${suffix}` });
    await expect(row).toBeVisible();
    await expect(row).toContainText('No');
    await expect(row.locator('.people-login-locations')).toContainText('3');
    if (process.env.WEKAN_HTML4_SCREENSHOTS) await modern.screenshot({
      path: `${process.env.WEKAN_HTML4_SCREENSHOTS}/html5-people-list.png`, fullPage: true,
    });

    const impersonationFilter = legacy.locator('form:has(select[name="filter"])');
    await impersonationFilter.locator('select[name="filter"]').selectOption('all');
    await Promise.all([legacy.waitForNavigation(),
      impersonationFilter.locator('input[type="submit"]').click()]);
    const impersonationSearch = legacy.locator('form:has(input[name="q"][type="text"])');
    await impersonationSearch.locator('input[name="q"]').fill(`created_${suffix}`);
    await Promise.all([legacy.waitForNavigation(),
      impersonationSearch.locator('input[type="submit"]').click()]);
    form = legacy.locator(`form:has(input[name="legacyOperation"][value="show-person"]):has(input[name="targetUserId"][value="${created._id}"])`);
    await Promise.all([legacy.waitForNavigation(), form.locator('input[type="submit"]').click()]);
    form = legacy.locator(`form:has(input[name="legacyOperation"][value="select-person-avatar"]):has(input[name="avatarId"][value="${avatarId}"])`);
    await form.locator('input[name="targetUserId"]').evaluate((node, value) => {
      node.value = value;
    }, target.id);
    await Promise.all([legacy.waitForNavigation(), form.locator('input[type="submit"]').click()]);
    expect(db.findOne('eventlog', { stream: 'security', bleed: 'UserBleed',
      userId: admin._id, source: 'adminPeople' })).toBeTruthy();
    await expect.poll(() => db.findOne('users', { _id: admin._id })?.loginDisabled)
      .toBe(true);
    form = legacy.locator(`form:has(input[name="legacyOperation"][value="request-impersonate-person"]):has(input[name="targetUserId"][value="${created._id}"])`);
    await Promise.all([legacy.waitForNavigation(), form.locator('input[type="submit"]').click()]);
    form = legacy.locator(`form:has(input[name="legacyOperation"][value="impersonate-person"]):has(input[name="targetUserId"][value="${created._id}"])`);
    await Promise.all([legacy.waitForNavigation(), form.locator('input[type="submit"]').click()]);
    await expect(legacy.locator('body')).toContainText(`created_${suffix}`);
    expect(db.findOne('impersonatedUsers', { adminId: admin._id,
      userId: created._id, reason: 'clickedImpersonate' })).toBeTruthy();
  } finally {
    if (modernContext) await modernContext.close();
    await legacyContext.close();
    db.deleteMany('loginAddresses', { _id: addressId });
    db.deleteMany('team', { _id: teamId });
    if (admin?._id) db.deleteMany('impersonatedUsers', { adminId: admin._id });
    if (admin?._id) db.deleteMany('eventlog', { stream: 'security', userId: admin._id });
    if (created?._id) {
      db.deleteMany('avatars', { userId: created._id });
    }
    db.cleanup({ userIds: [target.id, removable.id, ...(created?._id ? [created._id] : []),
      ...(admin?._id ? [admin._id] : [])] });
  }
});
