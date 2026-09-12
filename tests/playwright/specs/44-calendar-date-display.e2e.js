'use strict';

const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const { loginWithToken, openBoard } = require('../helpers/auth');
const BoardPage = require('../pages/BoardPage');
const CardPage = require('../pages/CardPage');

test('Jalali mouse and keyboard selection saves the same native instant in an English UI', async ({ page, user, board }) => {
  const dueAt = new Date('2026-03-21T12:00:00.000Z');
  const card = db.findOne('cards', { boardId: board.boardId, title: 'Alpha Card' });
  db.updateOne('users', { _id: user.id }, { $set: {
    'profile.language': 'en', 'profile.calendarSystem': 'jalali', 'profile.dateFormat': 'YYYY-MM-DD',
  } });
  db.updateOne('cards', { _id: card._id }, { $set: { dueAt } });
  await loginWithToken(page, user.id, user.token);
  await openBoard(page, board.boardId, board.slug);
  const bp = new BoardPage(page);
  const miniDate = bp.minicard(board.listIds[0], 'Alpha Card').locator('.due-date time').first();
  await expect(miniDate).toContainText('1405-01-01');
  await expect(miniDate).not.toContainText('2026-03-21');
  await expect(miniDate).toHaveAttribute('datetime', dueAt.toISOString());
  await bp.clickCard(board.listIds[0], 'Alpha Card');
  const cp = new CardPage(page);
  await cp.waitForOpen();
  const detailDate = cp.root.locator('.due-date time').first();
  await expect(detailDate).toContainText('1405-01-01');
  await cp.root.locator('.due-date .js-edit-date, a.due-date.js-edit-date').first().click();
  await expect(page.locator('.js-pop-over #date')).toHaveValue('2026-03-21');
  const popup = page.locator('.js-pop-over');
  await expect(popup.locator('.selected-calendar-picker')).toBeVisible();
  await expect(popup.locator('.js-calendar-toggle')).toHaveCount(0);
  await expect(popup.locator('.selected-calendar-date')).toContainText('1405-01-01');
  const calendarWidth = await popup.locator('.selected-calendar-picker').evaluate(el => el.getBoundingClientRect().width);
  const fieldsWidth = await popup.locator('.fields').evaluate(el => el.getBoundingClientRect().width);
  expect(Math.abs(calendarWidth - fieldsWidth)).toBeLessThan(2);
  await expect(popup.locator('.calendar-time-input input')).toHaveAttribute('type', 'hidden');
  await expect(popup.locator('.calendar-time-input select')).toHaveCount(2);
  const firstDay = popup.locator('.js-calendar-day[data-date="2026-03-21"]');
  await firstDay.focus();
  await expect(firstDay).toBeFocused();
  await firstDay.press('ArrowRight');
  const nextDay = popup.locator('.js-calendar-day[data-date="2026-03-22"]');
  await expect(nextDay).toBeFocused();
  await nextDay.press('Enter');
  await expect(popup.locator('.selected-calendar-date')).toContainText('1405-01-02');
  await expect(popup.locator('.selected-calendar-picker')).toBeVisible();
  await popup.locator('.js-calendar-hour').selectOption('15');
  await popup.locator('.js-calendar-minute').selectOption('30');
  const savedInstant = await page.evaluate(() => new Date(2026, 2, 22, 15, 30).toISOString());
  await popup.locator('.js-submit-date').click();
  await expect(detailDate).toContainText('1405-01-02');
  await expect(detailDate).toContainText('15:30');
  await expect.poll(() => new Date(db.findOne('cards', { _id: card._id }).dueAt).toISOString()).toBe(savedInstant);
  await page.evaluate(() => Meteor.callAsync('changeCalendarSystem', 'gregorian'));
  await expect(detailDate).toContainText('2026-03-22');
  await expect(detailDate).not.toContainText('1405-01-01');
});

test('Member Settings offers supported calendars and displays only the saved selection', async ({ page, user, board }) => {
  const card = db.findOne('cards', { boardId: board.boardId, title: 'Alpha Card' });
  db.updateOne('users', { _id: user.id }, { $set: { 'profile.language': 'en' } });
  db.updateOne('cards', { _id: card._id }, { $set: { dueAt: new Date('2026-03-21T12:00:00Z') } });
  await loginWithToken(page, user.id, user.token);
  await openBoard(page, board.boardId, board.slug);
  const bp = new BoardPage(page);
  const badge = bp.minicard(board.listIds[0], 'Alpha Card').locator('.due-date time').first();
  await expect(badge).toContainText('2026-03-21');
  await page.locator('.js-open-header-member-menu').first().click();
  await page.locator('.js-pop-over .js-change-settings').click();
  const selector = page.locator('.js-pop-over #calendar-system');
  await expect(selector).toHaveValue('gregorian');
  for (const name of ['jalali', 'hebrew', 'japanese', 'buddhist']) {
    await expect(selector.locator(`option[value="${name}"]`)).toHaveCount(1);
  }
  await selector.selectOption('buddhist');
  await page.locator('.js-pop-over .js-apply-user-settings').click();
  await expect.poll(() => db.findOne('users', { _id: user.id }).profile.calendarSystem).toBe('buddhist');
  await expect(badge).toContainText('2569');
  await expect(badge).not.toContainText('2026-03-21');
  await expect(badge).not.toContainText('1405');
});

test('Jalali month view has actual month boundaries and a single calendar title', async ({ page, user, board }) => {
  db.updateOne('users', { _id: user.id }, { $set: {
    'profile.language': 'en', 'profile.calendarSystem': 'jalali', 'profile.boardView': 'board-view-cal',
  } });
  await loginWithToken(page, user.id, user.token);
  await openBoard(page, board.boardId, board.slug);
  await page.waitForFunction(() => Boolean(document.getElementById('calendar-view')?._wekanCalendar));
  await page.evaluate(() => document.getElementById('calendar-view')._wekanCalendar.gotoDate(new Date(2026, 2, 21)));
  await expect(page.locator('#calendar-view .fc-toolbar-title')).toContainText('1405-01-01');
  await expect(page.locator('#calendar-view .fc-toolbar-title')).not.toContainText('2026');
  await expect(page.locator('#calendar-view td[data-date="2026-03-21"] .fc-daygrid-day-number')).toHaveText('1');
  await page.locator('#calendar-view .fc-next-button').click();
  await expect(page.locator('#calendar-view .fc-toolbar-title')).toContainText('1405-02-01');
});

for (const calendarSystem of ['gregorian', 'buddhist']) {
  test(`${calendarSystem} popup opens a full-width calendar with only hour/minute controls`, async ({ page, user, board }) => {
    db.updateOne('users', { _id: user.id }, { $set: { 'profile.calendarSystem': calendarSystem } });
    const card = db.findOne('cards', { boardId: board.boardId, title: 'Alpha Card' });
    db.updateOne('cards', { _id: card._id }, { $set: { dueAt: new Date('2026-03-21T12:00:00Z') } });
    await loginWithToken(page, user.id, user.token);
    await openBoard(page, board.boardId, board.slug);
    await new BoardPage(page).clickCard(board.listIds[0], 'Alpha Card');
    const cp = new CardPage(page);
    await cp.waitForOpen();
    await cp.root.locator('.due-date .js-edit-date, a.due-date.js-edit-date').first().click();
    const popup = page.locator('.js-pop-over');
    await expect(popup.locator('.selected-calendar-picker')).toBeVisible();
    await expect(popup.locator('.js-calendar-toggle')).toHaveCount(0);
    await expect(popup.locator('input[type="date"], input[type="text"]')).toHaveCount(0);
    await expect(popup.locator('.js-calendar-hour')).toBeVisible();
    await expect(popup.locator('.js-calendar-minute')).toBeVisible();
    const dimensions = await popup.locator('.fields').evaluate(el => ({
      fields: el.clientWidth,
      grid: el.querySelector('.selected-calendar-picker').getBoundingClientRect().width,
      overflow: el.scrollWidth - el.clientWidth,
    }));
    expect(Math.abs(dimensions.fields - dimensions.grid)).toBeLessThan(2);
    expect(dimensions.overflow).toBeLessThan(2);
    const nextDay = popup.locator('.js-calendar-day[data-date="2026-03-22"]');
    await nextDay.click();
    await expect(nextDay).toHaveAttribute('aria-pressed', 'true');
    await expect(popup.locator('.selected-calendar-picker')).toBeVisible();
  });
}
