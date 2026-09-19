'use strict';
const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const { loginWithToken, openBoard } = require('../helpers/auth');
const BoardPage = require('../pages/BoardPage');
const CardPage = require('../pages/CardPage');

test('F15 F17 A08: attachment actions work without hover and the viewer traps and returns focus', async ({ page, user, board }) => {
  const alpha = db.findOne('cards', { boardId: board.boardId, title: 'Alpha Card' });
  const ids = [db.uid('auditimage'), db.uid('auditimage')];
  db.insertMany('attachments', ids.map((id, i) => ({
    _id: id, name: `Audit image ${i}.png`, size: 68, type: 'image/png', extension: 'png', isImage: true,
    meta: { boardId: board.boardId, cardId: alpha._id },
    versions: { original: { path: `/unused/${id}.png`, name: `Audit image ${i}.png`, size: 68,
      type: 'image/png', extension: 'png', storage: 'fs' } },
  })));
  await page.route('**/cdn/storage/attachments/**', route => route.fulfill({
    contentType: 'image/png', body: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aD1sAAAAASUVORK5CYII=', 'base64'),
  }));
  await loginWithToken(page, user.id, user.token); await openBoard(page, board.boardId, board.slug);
  await expect(page.locator('#viewer-overlay')).toBeHidden();
  await new BoardPage(page).clickCard(board.listIds[0], 'Alpha Card');
  const card = new CardPage(page); await card.waitForOpen();
  const attachment = card.root.locator('.attachment-item').filter({ hasText: 'Audit image 0.png' });
  await expect(attachment).toBeVisible();
  await attachment.locator('.js-open-attachment-menu').focus(); await page.keyboard.press('Enter');
  await page.locator('.js-pop-over .js-add-background-image').click();
  await expect.poll(() => db.findOne('boards', { _id: board.boardId }).backgroundImageURL || '').toContain(ids[0]);
  await attachment.locator('.js-open-attachment-menu').focus(); await page.keyboard.press('Enter');
  await page.locator('.js-pop-over .js-remove-background-image').click();
  await expect.poll(() => db.findOne('boards', { _id: board.boardId }).backgroundImageURL || '').toBe('');
  // Removing the background reloads the board and closes its card window.
  await expect(card.root).toHaveCount(0);
  await new BoardPage(page).clickCard(board.listIds[0], 'Alpha Card');
  await card.waitForOpen();
  const preview = attachment.locator('.open-preview');
  await preview.focus(); await page.keyboard.press('Enter');
  const viewer = page.locator('#viewer-overlay');
  await expect(viewer).toBeVisible();
  await expect(page.locator('#viewer-close')).toBeFocused();
  await page.locator('#next-attachment').focus(); await page.keyboard.press('Enter');
  await expect(page.locator('#attachment-name')).toHaveText('Audit image 1.png');
  await page.keyboard.press('Tab'); await expect(page.locator('#viewer-close')).toBeFocused();
  await page.keyboard.press('Escape'); await expect(viewer).toBeHidden();
  await expect(preview).toBeFocused();
});

test('F08: changing calendar options preserves the selected week view and date', async ({ boardPage: page, user }) => {
  await page.locator('.js-toggle-board-view').first().click();
  await page.locator('.pop-over .js-open-cal-view').click();
  const calendar = page.locator('.fc').first();
  await expect(calendar).toBeVisible();
  await calendar.locator('.fc-timeGridWeek-button').click();
  await calendar.locator('.fc-next-button').click();
  const selectedDate = await calendar.evaluate(el => el._wekanCalendar.getDate().toISOString());
  db.updateOne('users', { _id: user.id }, { $set: { 'profile.startDayOfWeek': 1 } });
  await expect(calendar.locator('.fc-timeGridWeek-button')).toHaveClass(/fc-button-active/);
  await expect.poll(() => calendar.evaluate(el => el._wekanCalendar.getOption('firstDay'))).toBe(1);
  expect(await calendar.evaluate(el => el._wekanCalendar.getDate().toISOString())).toBe(selectedDate);
});

test('V02: Gantt headers and bars scale together with the saved font preset', async ({ page, user, board }) => {
  const today = new Date(); const tomorrow = new Date(today.getTime() + 86400000);
  db.updateMany('cards', { boardId: board.boardId }, { $set: { startAt: today, dueAt: tomorrow } });
  db.updateOne('users', { _id: user.id }, { $set: { 'profile.uiFontSize': 'largest' } });
  await loginWithToken(page, user.id, user.token); await openBoard(page, board.boardId, board.slug);
  await page.locator('.js-toggle-board-view').first().click();
  await page.locator('.pop-over .js-open-gantt-frappe-view').click();
  const chart = page.locator('.gantt-view .gantt-container');
  await expect(chart).toBeVisible();
  await expect(chart.locator('.bar-label').first()).toHaveCSS('font-size', '19.5px');
  expect(Number(await chart.locator('rect.bar').first().getAttribute('height'))).toBe(45);
});
