'use strict';
// TrayBleed (2026-10-02): profile.notifications was client-writable, and an
// entry names an activity whose card, comments and attachments the
// notification publications then send from any board. A client may only mark
// entries read/unread and remove them now.
const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const { loginWithToken, openBoard } = require('../helpers/auth');

test('a client cannot add a notification entry, but can still mark one read', async ({ page, user, board }) => {
  db.updateOne('users', { _id: user.id }, { $set: { 'profile.notifications': [{ activity: 'ownActivity1', read: null }] } });
  try {
    await loginWithToken(page, user.id, user.token);
    await openBoard(page, board.boardId, board.slug);
    // What the tray's checkbox does still works (negative).
    const marked = await page.evaluate(async userId => {
      try { await Meteor.callAsync('/users/update', { _id: userId }, { $set: { 'profile.notifications.0.read': new Date() } }); return 'ok'; }
      catch (error) { return String(error.error || error.message); }
    }, user.id);
    expect(marked).toBe('ok');
    expect(db.findOne('users', { _id: user.id }).profile.notifications[0].read).toBeTruthy();
    // The attack: name an activity of another board.
    const pushed = await page.evaluate(async userId => {
      try { await Meteor.callAsync('/users/update', { _id: userId }, { $push: { 'profile.notifications': { activity: 'foreignActivity' } } }); return 'pushed'; }
      catch (error) { return 'denied'; }
    }, user.id);
    expect(pushed).toBe('denied');
    expect(db.findOne('users', { _id: user.id }).profile.notifications.map(n => n.activity)).toEqual(['ownActivity1']);
    await expect.poll(() => db.findOne('eventlog', { bleed: 'TrayBleed', source: 'ddp:user-notifications' })?.count).toBeGreaterThan(0);
  } finally {
    db.updateOne('users', { _id: user.id }, { $unset: { loginDisabled: 1 } });
  }
});
