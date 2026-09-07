'use strict';

const fs = require('node:fs');
const { test, expect } = require('@playwright/test');
const db = require('../helpers/db');
const { loginWithToken, navigateInApp, waitForMeteor } = require('../helpers/auth');

test('member invitation and logout share guarded HTML4 and HTML5 routes', async ({ browser, baseURL }) => {
  test.setTimeout(120_000);
  const suffix = `${Date.now()}${Math.floor(Math.random() * 10000)}`;
  const username = `html4invite${suffix}`;
  const output = `${process.cwd()}/../../.tools/html4-member-invitation-logout`;
  const legacyContext = await browser.newContext({ javaScriptEnabled: false, locale: 'en-US' });
  const legacy = await legacyContext.newPage();
  let user;
  let ownBoard;
  let foreignBoard;
  let foreignUser;
  let modernContext;
  try {
    await legacy.goto(`${baseURL}/sign-up`);
    await legacy.locator('input[name="username"]').fill(username);
    await legacy.locator('input[name="email"]').fill(`${username}@wekan-test.invalid`);
    await legacy.locator('input[name="password"]').fill(`Invite-${suffix}!`);
    await Promise.all([legacy.waitForNavigation(), legacy.locator('input[type="submit"]').click()]);
    user = db.findOne('users', { username });
    db.updateOne('users', { _id: user._id }, { $set: { isAdmin: true } });
    ownBoard = db.seedBoard({ ownerId: user._id, title: `Own invitation board ${suffix}` });
    foreignUser = db.seedUser();
    foreignBoard = db.seedBoard({ ownerId: foreignUser.id, title: `Foreign invitation board ${suffix}` });

    await Promise.all([legacy.waitForNavigation(),
      legacy.locator('form[action="/allboards"] input[type="submit"]').click()]);
    await Promise.all([legacy.waitForNavigation(),
      legacy.locator('form[action="/account/invite"] input[type="submit"]').click()]);
    await expect(legacy.locator(`text=Own invitation board ${suffix}`)).toBeVisible();
    await expect(legacy.locator(`text=Foreign invitation board ${suffix}`)).toHaveCount(0);
    fs.mkdirSync(output, { recursive: true });
    await legacy.screenshot({ path: `${output}/html4-member-invitation.png`, fullPage: true });

    modernContext = await browser.newContext({ locale: 'en-US' });
    const modern = await modernContext.newPage();
    await loginWithToken(modern, user._id, db.addResumeToken(user._id));
    await navigateInApp(modern, '/account/invite');
    await waitForMeteor(modern);
    await expect(modern.locator('#email-to-invite')).toBeVisible();
    await expect(modern.locator('.js-toggle-board-choose', {
      hasText: `Own invitation board ${suffix}`,
    })).toBeVisible();
    await expect(modern.locator('.js-toggle-board-choose', {
      hasText: `Foreign invitation board ${suffix}`,
    })).toHaveCount(0);
    await modern.screenshot({ path: `${output}/html5-member-invitation.png`, fullPage: true });

    const invitation = legacy.locator(
      'form:has(input[name="legacyOperation"][value="send-member-invitations"])',
    );
    await invitation.locator('textarea[name="invitationEmails"]')
      .fill(`blocked-${suffix}@wekan-test.invalid`);
    await invitation.evaluate((form, boardId) => {
      const input = document.createElement('input');
      input.type = 'hidden'; input.name = 'invitationBoards'; input.value = boardId;
      form.appendChild(input);
    }, foreignBoard.boardId);
    await Promise.all([legacy.waitForNavigation(), invitation.locator('input[type="submit"]').click()]);
    expect(db.findOne('invitationCodes', { email: `blocked-${suffix}@wekan-test.invalid` }))
      .toBeNull();
    await expect.poll(() => db.findOne('eventlog', {
      stream: 'security', source: 'memberInvitation', userId: user._id,
    })).not.toBeNull();

    await Promise.all([legacy.waitForNavigation(),
      legacy.locator('form[action="/account/logout"] input[type="submit"]').click()]);
    const logout = legacy.locator(
      'form:has(input[name="legacyOperation"][value="logout-member"])',
    );
    const legacySessionId = await logout.locator('input[name="legacySession"]').inputValue();
    await Promise.all([legacy.waitForNavigation(), logout.locator('input[type="submit"]').click()]);
    await expect(legacy.locator('form[action="/users/login"]')).toBeVisible();
    expect(db.findOne('legacyHtml4Sessions', { _id: legacySessionId })).toBeNull();
    await legacy.screenshot({ path: `${output}/html4-member-logout.png`, fullPage: true });

    await navigateInApp(modern, '/account/logout');
    await waitForMeteor(modern);
    await expect(modern.locator('form.js-account-logout')).toBeVisible();
    await modern.screenshot({ path: `${output}/html5-member-logout.png`, fullPage: true });
    await modern.locator('form.js-account-logout input[type="submit"]').click();
    await expect.poll(() => modern.evaluate(() => Meteor.userId())).toBeNull();
  } finally {
    if (modernContext) await modernContext.close();
    await legacyContext.close();
    for (const board of [ownBoard, foreignBoard]) {
      if (!board?.boardId) continue;
      db.deleteMany('cards', { boardId: board.boardId });
      db.deleteMany('lists', { boardId: board.boardId });
      db.deleteMany('swimlanes', { boardId: board.boardId });
      db.deleteMany('boards', { _id: board.boardId });
    }
    if (user?._id) {
      db.deleteMany('invitationCodes', { authorId: user._id });
      db.deleteMany('eventlog', { userId: user._id });
      db.deleteMany('legacyHtml4Sessions', { userId: user._id });
      db.deleteMany('users', { _id: user._id });
    }
    if (foreignUser?.id) db.deleteMany('users', { _id: foreignUser.id });
  }
});
