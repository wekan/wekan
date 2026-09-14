'use strict';
const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const { loginWithToken, waitForMeteor } = require('../helpers/auth');
const BASE_URL = process.env.WEKAN_BASE_URL || 'http://localhost:3000';
test('domain-approved inviter cannot grant a foreign private board', async ({ page, user, user2 }) => {
  const victim = db.seedBoard({ ownerId: user2.id, cardTitlesPerList: [['Private card']] });
  const settings = db.findOne('settings', {});
  const invitee = `board-grant-${Date.now()}@example.invalid`;
  db.updateOne('settings', { _id: settings._id }, { $set: { disableRegistration: true, mailDomainName: user.email.slice(user.email.indexOf('@')) } });
  try {
    await page.goto(`${BASE_URL}/sign-in`);
    await waitForMeteor(page);
    await loginWithToken(page, user.id, user.token);
    const result = await page.evaluate(async ({ email, boardId }) => {
      try { await window.Meteor.callAsync('sendInvitation', [email], [boardId]); return 'unexpected-success'; }
      catch (error) { return error.error; }
    }, { email: invitee, boardId: victim.boardId });
    expect(result).toBe('not-allowed');
    expect(db.find('invitation_codes', { email: invitee })).toHaveLength(0);
  } finally {
    const $set = {}, $unset = {};
    for (const key of ['disableRegistration', 'mailDomainName']) {
      if (Object.prototype.hasOwnProperty.call(settings, key)) $set[key] = settings[key];
      else $unset[key] = '';
    }
    db.updateOne('settings', { _id: settings._id }, { ...Object.keys($set).length && { $set }, ...Object.keys($unset).length && { $unset } });
    db.deleteMany('invitation_codes', { email: invitee });
    db.cleanup({ boardIds: [victim.boardId] });
  }
});
