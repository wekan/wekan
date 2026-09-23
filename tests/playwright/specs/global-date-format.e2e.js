'use strict';
const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const { loginWithToken, openBoard, navigateInApp } = require('../helpers/auth');
const BoardPage = require('../pages/BoardPage');
const CardPage = require('../pages/CardPage');

test('Date settings cascade from global to board to member through their own controls', async ({ page, browser, user, adminUser, board }) => {
  const setting = db.findOne('settings', {});
  const previous = { hideDateFormat: setting.hideDateFormat, globalDateFormat: setting.globalDateFormat };
  const adminContext = await browser.newContext();
  const admin = await adminContext.newPage();
  const guestContext = await browser.newContext();
  const guest = await guestContext.newPage();
  const card = db.findOne('cards', { boardId: board.boardId, title: 'Alpha Card' });
  const dueAt = new Date('2026-03-21T12:00:00Z');
  try {
    await loginWithToken(admin, adminUser.id, adminUser.token);
    await admin.evaluate(id => Meteor.callAsync('/settings/update', { _id: id }, { $set: { hideDateFormat: false, globalDateFormat: 'YYYY-MM-DD' } }), setting._id);
    db.updateOne('boards', { _id: board.boardId }, { $set: { permission: 'public' } });
    db.updateOne('users', { _id: user.id }, { $set: { 'profile.dateFormat': 'MM-DD-YYYY', 'profile.dateFormatOverride': false } });
    db.updateOne('cards', { _id: card._id }, { $set: { dueAt } });
    await loginWithToken(page, user.id, user.token);
    await openBoard(page, board.boardId, board.slug);
    const bp = new BoardPage(page);
    const miniDate = bp.minicard(board.listIds[0], 'Alpha Card').locator('.due-date time').first();
    await expect(miniDate).toContainText('2026-03-21');
    await bp.clickCard(board.listIds[0], 'Alpha Card');
    const cp = new CardPage(page);
    await cp.waitForOpen();
    const heading = cp.root.locator('[data-section="date-format"]');
    await expect(heading).toHaveText('Date');
    await expect(cp.root.locator('.js-date-format-selector')).toHaveCount(0);

    await navigateInApp(admin, '/admin/settings/visibility');
    const logoChecked = await admin.locator('#hide-logo').evaluate(el => el.classList.contains('is-checked'));
    await admin.locator('#global-date-format').selectOption('DD-MM-YYYY');
    await admin.locator('#global-date-format-enabled').click();
    expect(await admin.locator('#hide-logo').evaluate(el => el.classList.contains('is-checked'))).toBe(logoChecked);
    await admin.locator('.js-visibility-date-save').click();
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
    await expect(admin.locator('#global-date-format-enabled')).toHaveClass(/is-checked/);
    await expect(admin.locator('#global-date-format')).toHaveValue('DD-MM-YYYY');
    await guest.addInitScript(() => localStorage.setItem('dateFormat', 'YYYY-MM-DD'));
    await openBoard(guest, board.boardId, board.slug);
    const guestBoard = new BoardPage(guest);
    await expect(guestBoard.minicard(board.listIds[0], 'Alpha Card').locator('.due-date time').first()).toContainText('21-03-2026');
    await guestBoard.clickCard(board.listIds[0], 'Alpha Card');
    await expect(new CardPage(guest).root.locator('[data-section="date-format"]')).toHaveText('Date');
    await expect(guest.locator('.js-date-format-selector')).toHaveCount(0);

    // Board Settings / Date: checked overrides the global default, including guests.
    await page.evaluate(() => Popup.close());
    await bp.openSidebar();
    await page.locator('.js-open-board-menu').click();
    await page.locator('.js-pop-over .content:not(.no-height) .js-open-board-date-settings').click();
    await expect(page.locator('.js-pop-over .content:not(.no-height) .js-global-date-format-status')).toContainText(/Enabled\s*:\s*DD-MM-YYYY/);
    await expect(page.locator('.js-pop-over .content:not(.no-height) .js-board-date-format-status')).toHaveCount(0);
    let editor = page.locator('.js-pop-over .content:not(.no-height) .js-date-format-form');
    const weekToggle = page.locator('.js-pop-over .content:not(.no-height) .js-show-week-of-year-toggle');
    await expect(weekToggle).toBeVisible();
    await expect(page.locator('.board-sidebar .js-show-week-of-year-toggle')).toHaveCount(0);
    const saveBox = await editor.locator('button[type="submit"]').boundingBox();
    const weekBox = await weekToggle.boundingBox();
    expect(weekBox.y).toBeGreaterThan(saveBox.y + saveBox.height);
    const previousWeek = db.findOne('users', { _id: user.id }).profile.showWeekOfYear;
    await weekToggle.click();
    await expect.poll(() => db.findOne('users', { _id: user.id }).profile.showWeekOfYear).toBe(!previousWeek);
    await weekToggle.click();
    await expect.poll(() => db.findOne('users', { _id: user.id }).profile.showWeekOfYear).toBe(previousWeek);

    await expect(editor.locator('#start-day-of-week, #calendar-system')).toHaveCount(0);
    await editor.locator('.js-date-format-select').selectOption('YYYY-MM-DD-date-only');
    await editor.locator('.js-date-format-override').check();
    await editor.locator('button[type="submit"]').click();
    await expect.poll(() => db.findOne('boards', { _id: board.boardId }).dateFormatOverride).toBe(true);
    await expect(miniDate).toContainText('2026-03-21');
    await expect(miniDate).not.toContainText(/\d{1,2}:\d{2}/);
    await expect(guestBoard.minicard(board.listIds[0], 'Alpha Card').locator('.due-date time').first()).toContainText('2026-03-21');

    // Member Settings / Date overrides both defaults only while checked.
    await page.evaluate(() => Popup.close());
    await page.locator('.js-open-header-member-menu').first().click();
    await page.locator('.js-pop-over .content:not(.no-height) .js-member-date-settings').click();
    await expect(page.locator('.js-pop-over .content:not(.no-height) .js-global-date-format-status')).toContainText(/Enabled\s*:\s*DD-MM-YYYY/);
    await expect(page.locator('.js-pop-over .content:not(.no-height) .js-board-date-format-status')).toContainText(/Enabled\s*:\s*YYYY-MM-DD/);
    editor = page.locator('.js-pop-over .content:not(.no-height) .js-date-format-form');
    await expect(editor.locator('.js-date-format-select')).toBeVisible();
    await expect(editor.locator('.js-member-date-format-heading')).toHaveText('Member Settings: Date Format');
    await expect(editor.locator('.js-member-date-format-enabled')).toHaveText('Disabled');
    const expectStatusAligned = async () => {
      const box = await editor.locator('.js-date-format-override').boundingBox();
      const text = await editor.locator('.js-member-date-format-enabled').boundingBox();
      expect(box.height).toBe(16);
      expect(text.x).toBeGreaterThan(box.x + box.width);
      expect(Math.abs(text.y + text.height / 2 - box.y - box.height / 2)).toBeLessThan(1);
    };
    await expectStatusAligned();

    await expect(page.locator('.js-pop-over .content:not(.no-height) .date-format-inherited hr')).toHaveCount(0);
    await expect(editor.locator('hr')).toHaveCount(2);

    const formatBox = await editor.locator('.js-date-format-select').boundingBox();
    const weekStartBox = await editor.locator('#start-day-of-week').boundingBox();
    const calendarBox = await editor.locator('#calendar-system').boundingBox();
    expect(formatBox.y + formatBox.height).toBeLessThan(weekStartBox.y);
    expect(weekStartBox.y + weekStartBox.height).toBeLessThan(calendarBox.y);

    await editor.locator('.js-date-format-select').selectOption('MM-DD-YYYY');
    await editor.locator('.js-date-format-override').check();
    await expect(editor.locator('.js-member-date-format-enabled')).toHaveText('Enabled');
    await expectStatusAligned();
    await editor.locator('button[type="submit"]').click();
    await expect(miniDate).toContainText('03-21-2026');
    await page.locator('.js-pop-over .content:not(.no-height) .js-member-date-settings').click();
    await expect(editor.locator('.js-date-format-override')).toBeChecked();
    await editor.locator('.js-date-format-override').uncheck();
    await expect(editor.locator('.js-member-date-format-enabled')).toHaveText('Disabled');
    await editor.locator('button[type="submit"]').click();
    await expect(miniDate).toContainText('2026-03-21');
    await page.evaluate(() => Popup.close());
    await page.evaluate(id => Meteor.callAsync('setBoardDateFormat', id, 'YYYY-MM-DD-date-only', false), board.boardId);
    await expect(miniDate).toContainText('21-03-2026');
    // Both guests and signed-in non-members are rejected, and invalid formats fail.
    for (const target of [guest, admin]) {
      const rejected = await target.evaluate(async id => {
        try { await Meteor.callAsync('setBoardDateFormat', id, 'MM-DD-YYYY', true); return false; }
        catch { return true; }
      }, board.boardId);
      expect(rejected).toBe(true);
    }
    for (const method of ['setBoardDateFormat', 'changeDateFormat']) {
      const rejected = await page.evaluate(async ({method, id}) => {
        try { await Meteor.callAsync(method, ...(method === 'setBoardDateFormat' ? [id] : []), 'invalid', true); return false; }
        catch { return true; }
      }, {method, id: board.boardId});
      expect(rejected).toBe(true);
    }
    await admin.locator('#global-date-format-enabled').click();
    await admin.locator('.js-visibility-date-save').click();
    await expect(miniDate).toContainText('2026-03-21');
    await expect(heading).toHaveText('Date');
    await page.locator('.js-open-header-member-menu').first().click();
    await page.locator('.js-pop-over .content:not(.no-height) .js-member-date-settings').click();
    await expect(page.locator('.js-pop-over .content:not(.no-height) .js-global-date-format-status')).toContainText(/Disabled\s*:\s*DD-MM-YYYY/);
    await expect(page.locator('.js-pop-over .content:not(.no-height) .js-board-date-format-status')).toContainText(/Disabled\s*:\s*YYYY-MM-DD/);
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
