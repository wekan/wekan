'use strict';
// #3194: Calendar Mode, Trello's calendar. Chosen from the Board View menu
// below Calendar; each card is on its due day with its labels and whole title,
// in the board's order; a card opens; Month and Week.
const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const { openBoard } = require('../helpers/auth');

test('Calendar Mode shows due cards on their day with labels, in board order (#3194)', async ({ boardPage: page, board }) => {
  const lists = db.find('lists', { boardId: board.boardId }).sort((a, b) => a.sort - b.sort);
  const cards = db.find('cards', { boardId: board.boardId });
  const inFirst = cards.find(card => card.listId === lists[0]._id);
  const inSecond = cards.find(card => card.listId === lists[1]._id);
  const today = new Date();
  // Later in the day for the card of the FIRST list: the time does not order
  // the day's cards, the lists do.
  const due = hour => new Date(today.getFullYear(), today.getMonth(), today.getDate(), hour);
  db.updateOne('boards', { _id: board.boardId }, { $push: { labels: { _id: 'calmode-label', name: 'Broadcast', color: 'green' } } });
  db.updateOne('cards', { _id: inFirst._id }, { $set: { dueAt: due(18), labelIds: ['calmode-label'],
    title: 'A long programme title that wraps over several lines in the calendar' } });
  db.updateOne('cards', { _id: inSecond._id }, { $set: { dueAt: due(8) } });

  await openBoard(page, board.boardId, board.slug);
  await page.locator('.js-toggle-board-view').first().click();
  const entries = page.locator('.pop-over .js-board-view-entry');
  const names = await entries.evaluateAll(links => links.map(link => link.className));
  const cal = names.findIndex(name => name.includes('js-open-cal-view'));
  expect(names[cal + 1]).toContain('js-open-calendar-mode-view');
  await page.locator('.pop-over .js-open-calendar-mode-view').click();

  const view = page.locator('.js-calendar-mode-view');
  await expect(view).toBeVisible();
  const pad = n => String(n).padStart(2, '0');
  const key = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;
  const day = view.locator(`.calendar-mode-day[data-day="${key}"]`);
  await expect(day).toHaveClass(/is-today/);
  const titles = day.locator('.calendar-mode-card-title');
  await expect(titles).toHaveText([
    'A long programme title that wraps over several lines in the calendar', inSecond.title,
  ]);
  await expect(day.locator('.calendar-mode-card').first().locator('.card-label.card-label-green')).toHaveText('Broadcast');
  // Negative: a card with no due date is not on the calendar.
  const undated = cards.find(card => card._id !== inFirst._id && card._id !== inSecond._id);
  if (undated) await expect(view.locator('.calendar-mode-card', { hasText: undated.title })).toHaveCount(0);

  // A week is one row; the month several.
  expect(await view.locator('.calendar-mode-week').count()).toBeGreaterThan(3);
  await view.locator('.js-calendar-mode-range[data-range="week"]').click();
  await expect(view.locator('.calendar-mode-week')).toHaveCount(1);
  await expect(view.locator('.calendar-mode-week .calendar-mode-day')).toHaveCount(7);
  await expect(day.locator('.calendar-mode-card')).toHaveCount(2);

  // A card opens.
  await day.locator('.calendar-mode-card', { hasText: inSecond.title }).click();
  await expect(page).toHaveURL(new RegExp(`/${inSecond._id}$`));
});
