'use strict';

// #6751: today's day is visibly distinct in the due-date popup's calendar and
// in the board Calendar view.

const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const { loginWithToken, openBoard } = require('../helpers/auth');
const BoardPage = require('../pages/BoardPage');
const CardPage = require('../pages/CardPage');

// The browser's local calendar day (offset in days from today), as the picker
// computes it.
const localIso = (page, offset = 0) => page.evaluate(days => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}, offset);

const look = locator => locator.evaluate(element => {
  const style = getComputedStyle(element);
  return { boxShadow: style.boxShadow, fontWeight: style.fontWeight, textDecoration: style.textDecorationLine };
});

test('due-date popup marks today, and only today', async ({ page, user, board }) => {
  const card = db.findOne('cards', { boardId: board.boardId, title: 'Alpha Card' });
  db.updateOne('users', { _id: user.id }, { $set: { 'profile.language': 'en', 'profile.calendarSystem': 'gregorian' } });
  db.updateOne('cards', { _id: card._id }, { $unset: { dueAt: '' } });
  await loginWithToken(page, user.id, user.token);
  await openBoard(page, board.boardId, board.slug);
  await new BoardPage(page).clickCard(board.listIds[0], 'Alpha Card');
  const cp = new CardPage(page);
  await cp.waitForOpen();
  await cp.openDueDateEditor();
  const pop = page.locator('.js-pop-over');
  await expect(pop.locator('.selected-calendar-picker')).toBeVisible();

  const todayIso = await localIso(page);
  // With no due date the popup opens on the current month.
  const today = pop.locator(`.js-calendar-day[data-date="${todayIso}"]`);
  await expect(today).toHaveClass(/\bis-today\b/);
  await expect(today).toHaveAttribute('aria-current', 'date');
  await expect(pop.locator('td.is-today-cell')).toHaveCount(1);
  await expect(pop.locator('.js-calendar-day[aria-current]')).toHaveCount(1);
  await expect(pop.locator('.js-calendar-day.is-today')).toHaveCount(1);

  // Negative: a neighbouring day (tomorrow, or yesterday at the month's end)
  // has neither the marker nor the look.
  const tomorrowIso = await localIso(page, 1);
  let neighbour = pop.locator(`.js-calendar-day[data-date="${tomorrowIso}"]`);
  if (!(await neighbour.count())) neighbour = pop.locator('.js-calendar-day:not(.is-today)').last();
  await expect(neighbour).not.toHaveClass(/\bis-today\b/);
  await expect(neighbour).not.toHaveAttribute('aria-current', /.+/);

  // Move the pointer away so hover/focus does not decide the comparison.
  await page.mouse.move(0, 0);
  const todayLook = await look(today);
  const neighbourLook = await look(neighbour);
  expect(todayLook.boxShadow).toContain('inset');
  expect(todayLook.textDecoration).toContain('underline');
  expect(todayLook).not.toEqual(neighbourLook);

  // Negative: a month that does not contain today marks nothing.
  await pop.locator('.js-calendar-year-next').click();
  await expect(pop.locator(`.js-calendar-day[data-date="${todayIso}"]`)).toHaveCount(0);
  await expect(pop.locator('.js-calendar-day.is-today, .js-calendar-day[aria-current]')).toHaveCount(0);
});

test('board Calendar view marks today\'s day number', async ({ page, user, board }) => {
  await loginWithToken(page, user.id, user.token);
  await openBoard(page, board.boardId, board.slug);
  await page.locator('.js-toggle-board-view').first().click();
  await page.locator('.pop-over .js-open-cal-view').click();
  const today = page.locator('.calendar-view .fc-daygrid-day.fc-day-today .fc-daygrid-day-number').first();
  await expect(today).toBeVisible();
  const other = page.locator('.calendar-view .fc-daygrid-day:not(.fc-day-today):not(.fc-day-other) .fc-daygrid-day-number').first();
  const background = locator => locator.evaluate(element => getComputedStyle(element).backgroundColor);
  expect(await background(today)).not.toBe('rgba(0, 0, 0, 0)');
  // Negative: other days keep the plain number.
  expect(await background(other)).toBe('rgba(0, 0, 0, 0)');
  await expect(page.locator('.calendar-view .fc-daygrid-day.fc-day-today')).toHaveCount(1);
});
