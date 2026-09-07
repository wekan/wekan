'use strict';

const fs = require('node:fs');
const { test, expect } = require('@playwright/test');
const db = require('../helpers/db');
const { loginWithToken, navigateInApp, waitForMeteor } = require('../helpers/auth');

test('People Teams has equivalent complete HTML4 operations', async ({ browser, baseURL }) => {
  test.setTimeout(180_000);
  const suffix = db.uniqueSuffix();
  const username = `html4team${suffix}`;
  const password = `Legacy-${suffix}-Pass!`;
  const shortName = `team-${suffix}`;
  const displayName = `Team ${suffix}`;
  const member = db.seedUser();
  const legacyContext = await browser.newContext({ javaScriptEnabled: false, locale: 'en-US' });
  const legacy = await legacyContext.newPage();
  const originalSetting = db.findOne('settings', {});
  let admin;
  let team;
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
      legacy.locator('form[action="/admin/people/teams"] input[type="submit"]').first().click()]);

    let form = legacy.locator('form:has(input[name="legacyOperation"][value="show-create-team"])');
    await Promise.all([legacy.waitForNavigation(), form.locator('input[type="submit"]').click()]);
    form = legacy.locator('form:has(input[name="legacyOperation"][value="create-team"])');
    await form.locator('input[name="teamDisplayName"]').fill(displayName);
    await form.locator('input[name="teamDesc"]').fill(`Description ${suffix}`);
    await form.locator('input[name="teamShortName"]').fill(shortName);
    await form.locator('input[name="teamWebsite"]').fill(`www.${suffix}.invalid`);
    await form.locator('select[name="teamIsActive"]').selectOption('true');
    await Promise.all([legacy.waitForNavigation(), form.locator('input[type="submit"]').click()]);
    team = db.findOne('team', { teamShortName: shortName });
    expect(team).toBeTruthy();
    db.updateOne('users', { _id: member.id }, { $set: { teams: [{
      teamId: team._id, teamDisplayName: displayName,
    }] } });

    form = legacy.locator('form:has(input[name="legacyOperation"][value="update-team"])');
    await form.locator('input[name="teamDisplayName"]').fill(`${displayName} edited`);
    await Promise.all([legacy.waitForNavigation(), form.locator('input[type="submit"]').click()]);
    await expect.poll(() => db.findOne('users', { _id: member.id })?.teams?.[0]?.teamDisplayName)
      .toBe(`${displayName} edited`);

    form = legacy.locator(`form:has(input[name="legacyOperation"][value="set-team-feature"]):has(input[name="teamId"][value="${team._id}"]):has(input[name="teamFeature"][value="teamSharedTemplates"])`);
    await Promise.all([legacy.waitForNavigation(), form.locator('input[type="submit"]').click()]);
    await expect.poll(() => db.findOne('team', { _id: team._id })?.teamSharedTemplates).toBe(true);
    form = legacy.locator('form:has(input[name="legacyOperation"][value="set-board-members-same-team"])');
    if (await form.locator('input[name="enabled"]').inputValue() === 'true') {
      await Promise.all([legacy.waitForNavigation(), form.locator('input[type="submit"]').click()]);
    }
    await expect.poll(() => db.findOne('settings', {})?.boardMembersFromSameTeamOnly).toBe(true);

    if (process.env.WEKAN_HTML4_SCREENSHOTS) {
      fs.mkdirSync(process.env.WEKAN_HTML4_SCREENSHOTS, { recursive: true });
      await legacy.screenshot({
        path: `${process.env.WEKAN_HTML4_SCREENSHOTS}/html4-people-teams.png`, fullPage: true,
      });
    }

    modernContext = await browser.newContext({ locale: 'en-US',
      viewport: { width: 1600, height: 2400 } });
    const modern = await modernContext.newPage();
    await loginWithToken(modern, admin._id, db.addResumeToken(admin._id));
    await navigateInApp(modern, '/admin/people/teams');
    await waitForMeteor(modern);
    const row = modern.locator('tbody tr', { hasText: shortName });
    await expect(row).toContainText(`${displayName} edited`);
    await expect(row.locator('input[data-feature="teamSharedTemplates"]')).toBeChecked();
    if (process.env.WEKAN_HTML4_SCREENSHOTS) await modern.screenshot({
      path: `${process.env.WEKAN_HTML4_SCREENSHOTS}/html5-people-teams.png`, fullPage: true,
    });

    form = legacy.locator(`form:has(input[name="legacyOperation"][value="request-delete-team"]):has(input[name="teamId"][value="${team._id}"])`);
    await Promise.all([legacy.waitForNavigation(), form.locator('input[type="submit"]').click()]);
    form = legacy.locator('form:has(input[name="legacyOperation"][value="delete-team"])');
    await Promise.all([legacy.waitForNavigation(), form.locator('input[type="submit"]').click()]);
    expect(db.findOne('team', { _id: team._id })).toBeTruthy();
    db.updateOne('users', { _id: member.id }, { $set: { teams: [] } });
    form = legacy.locator(`form:has(input[name="legacyOperation"][value="request-delete-team"]):has(input[name="teamId"][value="${team._id}"])`);
    await Promise.all([legacy.waitForNavigation(), form.locator('input[type="submit"]').click()]);
    form = legacy.locator('form:has(input[name="legacyOperation"][value="delete-team"])');
    await Promise.all([legacy.waitForNavigation(), form.locator('input[type="submit"]').click()]);
    await expect.poll(() => db.findOne('team', { _id: team._id })).toBeNull();

    const anonymous = await legacyContext.newPage();
    await anonymous.goto(`${baseURL}/admin/people/teams`);
    await expect(anonymous.locator('body')).toContainText(/not authorized/i);
    await expect(anonymous.locator('body')).not.toContainText(shortName);
  } finally {
    if (originalSetting?._id) db.updateOne('settings', { _id: originalSetting._id }, {
      $set: { boardMembersFromSameTeamOnly:
        originalSetting.boardMembersFromSameTeamOnly === true },
    });
    if (team?._id) db.deleteMany('team', { _id: team._id });
    if (modernContext) await modernContext.close();
    await legacyContext.close();
    db.cleanup({ userIds: [member.id, ...(admin?._id ? [admin._id] : [])] });
  }
});
