'use strict';
const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const { loginWithToken, openBoard, navigateInApp } = require('../helpers/auth');
const BoardPage = require('../pages/BoardPage');
const CardPage = require('../pages/CardPage');

test('#6703 admin date format overrides members and guests and restores preferences when disabled', async ({ page, browser, user, adminUser, board }) => {
  const setting = db.findOne('settings', {});
  const previous = { hideDateFormat: setting.hideDateFormat, globalDateFormat: setting.globalDateFormat };
  const adminContext = await browser.newContext();
  const admin = await adminContext.newPage();
  const guestContext = await browser.newContext();
  const guest = await guestContext.newPage();
  const card = db.findOne('cards', { boardId: board.boardId, title: 'Alpha Card' });
  const dueAt = new Date('2026-03-21T12:00:00Z');
  try {
    db.updateOne('settings', { _id: setting._id }, { $set: { hideDateFormat: false, globalDateFormat: 'YYYY-MM-DD' } });
    db.updateOne('boards', { _id: board.boardId }, { $set: { permission: 'public' } });
    db.updateOne('users', { _id: user.id }, { $set: { 'profile.dateFormat': 'MM-DD-YYYY' } });
    db.updateOne('cards', { _id: card._id }, { $set: { dueAt } });
    await loginWithToken(page, user.id, user.token);
    await openBoard(page, board.boardId, board.slug);
    const bp = new BoardPage(page);
    const miniDate = bp.minicard(board.listIds[0], 'Alpha Card').locator('.due-date time').first();
    await expect(miniDate).toContainText('03-21-2026');
    await bp.clickCard(board.listIds[0], 'Alpha Card');
    const cp = new CardPage(page);
    await cp.waitForOpen();
    const heading = cp.root.locator('[data-section="date-format"]');
    await expect(heading).toHaveText('Date Format');
    await expect(cp.root.locator('.js-date-format-selector')).toHaveValue('MM-DD-YYYY');

    await loginWithToken(admin, adminUser.id, adminUser.token);
    await navigateInApp(admin, '/admin/settings/visibility');
    await admin.locator('#global-date-format').selectOption('DD-MM-YYYY');
    await admin.locator('#hide-date-format').click();
    await admin.locator('.js-visibility-all-boards-save').click();
    await expect.poll(() => db.findOne('settings', { _id: setting._id }).globalDateFormat).toBe('DD-MM-YYYY');
    await expect.poll(() => db.findOne('settings', { _id: setting._id }).hideDateFormat).toBe(true);
    await expect(heading).toHaveText('Date');
    await expect(cp.root.locator('.js-date-format-selector')).toHaveCount(0);
    await expect(cp.root.locator('.due-date time').first()).toContainText('21-03-2026');
    await expect(miniDate).toContainText('21-03-2026');
    await expect(miniDate).toHaveAttribute('datetime', dueAt.toISOString());
    expect(db.findOne('users', { _id: user.id }).profile.dateFormat).toBe('MM-DD-YYYY');

    // A non-admin cannot change the instance override via the collection RPC.
    const denied = await page.evaluate(async id => {
      try { await Meteor.callAsync('/settings/update', { _id: id }, { $set: { hideDateFormat: false } }); return false; }
      catch (error) { return !!error; }
    }, setting._id);
    expect(denied).toBe(true);
    // Even an admin cannot store an unsupported format.
    const invalid = await admin.evaluate(async id => {
      try { await Meteor.callAsync('/settings/update', { _id: id }, { $set: { globalDateFormat: 'invalid' } }); return false; }
      catch (error) { return !!error; }
    }, setting._id);
    expect(invalid).toBe(true);
    expect(db.findOne('settings', { _id: setting._id }).globalDateFormat).toBe('DD-MM-YYYY');

    await admin.reload();
    await admin.waitForFunction(() => typeof Meteor !== 'undefined' && Meteor.user()?.isAdmin && !Meteor.loggingIn());
    await navigateInApp(admin, '/admin/settings/visibility');
    await expect(admin.locator('#hide-date-format')).toHaveClass(/is-checked/);
    await expect(admin.locator('#global-date-format')).toHaveValue('DD-MM-YYYY');
    await guest.addInitScript(() => localStorage.setItem('dateFormat', 'YYYY-MM-DD'));
    await openBoard(guest, board.boardId, board.slug);
    const guestBoard = new BoardPage(guest);
    await expect(guestBoard.minicard(board.listIds[0], 'Alpha Card').locator('.due-date time').first()).toContainText('21-03-2026');
    await guestBoard.clickCard(board.listIds[0], 'Alpha Card');
    await expect(new CardPage(guest).root.locator('[data-section="date-format"]')).toHaveText('Date');
    await expect(guest.locator('.js-date-format-selector')).toHaveCount(0);

    await admin.locator('#hide-date-format').click();
    await admin.locator('.js-visibility-all-boards-save').click();
    await expect(heading).toHaveText('Date Format');
    await expect(cp.root.locator('.js-date-format-selector')).toHaveValue('MM-DD-YYYY');
    await expect(miniDate).toContainText('03-21-2026');
    expect(db.getCard(card._id).dueAt).toBe(dueAt.toISOString());
  } finally {
    const $set = {}, $unset = {};
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) $unset[key] = ''; else $set[key] = value;
    }
    db.updateOne('settings', { _id: setting._id }, {
      ...(Object.keys($set).length ? { $set } : {}), ...(Object.keys($unset).length ? { $unset } : {}),
    });
    await adminContext.close();
    await guestContext.close();
  }
});
