'use strict';

// A setting that turns something off is refused by the SERVER, not only
// hidden by the page (docs/Features/Admin-Panel/Settings-Enforced-On-Server.md).
// Each test turns a setting off in the database, waits until the server has
// it, and makes from the page the very call the hidden button would make.
const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const { waitForMeteor } = require('../helpers/auth');
const { holdSharedSetting } = require('../helpers/sharedSettingLock');

// PASSWORD_LOGIN_ENABLED lives in `loginOptions` beside the password policy,
// which the two password specs set and sign in with: never at the same time.
holdSharedSetting(test, 'password-policy');

const BASE_URL = process.env.WEKAN_BASE_URL || 'http://localhost:3000';
const errorOf = (page, name, ...args) => page.evaluate(async ({ name, args }) => {
  try {
    await Meteor.callAsync(name, ...args);
    return null;
  } catch (error) {
    return { error: error.error, reason: error.reason };
  }
}, { name, args });
const settingId = () => db.findOne('settings', {}, { _id: 1 })._id;
const resetLockout = () => db.deleteMany('AccountsLockout.Connections',
  { clientAddress: { $in: ['127.0.0.1', '::1', '::ffff:127.0.0.1'] } });

test.describe('Settings enforced on the server', () => {
  test('an unticked feature refuses its method and its board view, and answers again once ticked', async ({ boardPage: page, board }) => {
    const id = settingId();
    const before = db.findOne('settings', { _id: id }, { featureStates: 1 }).featureStates || {};
    const restore = () => db.updateOne('settings', { _id: id }, Object.prototype.hasOwnProperty.call(before, 'views-table')
      ? { $set: { 'featureStates.views-table': before['views-table'] } }
      : { $unset: { 'featureStates.views-table': '' } });
    const input = { boardId: board.boardId, listId: board.listIds[0], swimlaneId: board.swimlaneId, title: `gate-${Date.now()}` };
    try {
      db.updateOne('settings', { _id: id }, { $set: { 'featureStates.views-table': false } });
      // The settings observer may poll: wait until the server refuses.
      await expect.poll(async () => (await errorOf(page, 'tableViewAddCard', input))?.error,
        { timeout: 20_000 }).toBe('feature-disabled');
      expect(db.findOne('cards', { title: input.title })).toBeFalsy();
      expect((await errorOf(page, 'setBoardView', 'board-view-table', board.boardId))?.error).toBe('feature-disabled');

      // Negative: ticked again, the same call adds the card.
      db.updateOne('settings', { _id: id }, { $set: { 'featureStates.views-table': true } });
      await expect.poll(async () => (await errorOf(page, 'tableViewAddCard', { ...input, title: `${input.title}-on` })) === null
        || !!db.findOne('cards', { title: `${input.title}-on` }), { timeout: 20_000 }).toBe(true);
    } finally {
      restore();
      db.deleteMany('cards', { title: { $regex: `^${input.title}` } });
    }
  });

  test('deleting your own account is refused while Self delete is off', async ({ loggedInPage: page, user }) => {
    const before = db.findOne('accountSettings', { _id: 'accounts-allowUserDelete' });
    try {
      db.updateOne('accountSettings', { _id: 'accounts-allowUserDelete' }, { $set: { booleanValue: false } });
      for (const name of ['removeUser', 'anonymizeUser']) {
        const error = await errorOf(page, name, user.id);
        expect(error, name).toEqual({ error: 'not-authorized', reason: 'Deleting your own account is not allowed' });
      }
      const still = db.findOne('users', { _id: user.id });
      expect(still).toBeTruthy();
      expect(still.anonymized).not.toBe(true);
    } finally {
      db.updateOne('accountSettings', { _id: 'accounts-allowUserDelete' },
        { $set: { booleanValue: !!(before && before.booleanValue) } });
    }
  });

  test('password login disabled refuses a DDP and a REST password sign-in', async ({ browser, request }) => {
    const id = settingId();
    const context = await browser.newContext({ baseURL: BASE_URL });
    const page = await context.newPage();
    try {
      db.updateOne('settings', { _id: id }, { $set: { 'loginOptions.passwordLoginEnabled': false } });
      resetLockout();
      await page.goto(`${BASE_URL}/sign-in`);
      await waitForMeteor(page);
      await expect.poll(() => page.evaluate(() => Meteor.callAsync('isPasswordLoginEnabled')),
        { timeout: 20_000 }).toBe(false);
      const ddp = await page.evaluate(() => new Promise(resolve => {
        Meteor.loginWithPassword({ username: 'nobody-here' }, 'wrong-or-right', error => resolve(error && error.error));
      }));
      expect(ddp).toBe('password-login-disabled');
      const rest = await request.post(`${BASE_URL}/users/login`, { data: { username: 'nobody-here', password: 'x' } });
      expect(rest.status()).toBe(403);
      expect((await rest.json()).error).toBe('password-login-disabled');

      // Negative: switched back on, the REST login is an ordinary failure again.
      db.updateOne('settings', { _id: id }, { $unset: { 'loginOptions.passwordLoginEnabled': '' } });
      await expect.poll(() => page.evaluate(() => Meteor.callAsync('isPasswordLoginEnabled')),
        { timeout: 20_000 }).toBe(true);
      const again = await request.post(`${BASE_URL}/users/login`, { data: { username: 'nobody-here', password: 'x' } });
      expect(again.status()).toBe(401);
    } finally {
      db.updateOne('settings', { _id: id }, { $unset: { 'loginOptions.passwordLoginEnabled': '' } });
      resetLockout();
      await context.close();
    }
  });
});
