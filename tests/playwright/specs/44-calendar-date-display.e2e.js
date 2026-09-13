'use strict';

const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const { loginWithToken, openBoard, navigateInApp } = require('../helpers/auth');
const BoardPage = require('../pages/BoardPage');
const CardPage = require('../pages/CardPage');

async function expectCalendarOption(page, selector, calendar, label) {
  const supported = await page.evaluate(value => {
    try { return new Intl.DateTimeFormat('en', { calendar: value }).resolvedOptions().calendar === value; }
    catch { return false; }
  }, calendar);
  const option = selector.locator(`option[value="${calendar}"]`);
  await expect(option).toHaveCount(supported ? 1 : 0);
  if (supported) await expect(option).toHaveText(label);
}

test('RTL date popup keeps its bottom-right grip and moves with physical pointer coordinates', async ({ page, user, board }) => {
  const card = db.findOne('cards', { boardId: board.boardId, title: 'Alpha Card' });
  db.updateOne('users', { _id: user.id }, { $set: {
    'profile.language': 'ar', 'profile.calendarSystem': 'jalali',
  } });
  db.updateOne('cards', { _id: card._id }, { $set: {
    dueAt: new Date('2026-03-21T12:00:00.000Z'),
  } });
  await loginWithToken(page, user.id, user.token);
  await openBoard(page, board.boardId, board.slug);
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  const bp = new BoardPage(page);
  await bp.clickCard(board.listIds[0], 'Alpha Card');
  const cp = new CardPage(page);
  await cp.waitForOpen();
  await cp.root.locator('.due-date .js-edit-date, a.due-date.js-edit-date').first().click();
  const popup = page.locator('.js-pop-over');
  await expect(popup.locator('.selected-calendar-picker')).toBeVisible();
  const original = await popup.boundingBox();
  const grip = await popup.locator('.js-date-popup-resize').boundingBox();
  expect(Math.abs(grip.x + grip.width - original.x - original.width)).toBeLessThan(2);
  expect(Math.abs(grip.y + grip.height - original.y - original.height)).toBeLessThan(2);
  const title = await popup.locator('.header-title').boundingBox();
  await page.mouse.move(title.x + title.width / 2, title.y + title.height / 2);
  await page.mouse.down();
  await page.mouse.move(title.x + title.width / 2 + 30, title.y + title.height / 2 + 20);
  await page.mouse.up();
  const moved = await popup.boundingBox();
  expect(moved.x).toBeCloseTo(original.x + 30, 0);
  expect(moved.y).toBeCloseTo(original.y + 20, 0);
  expect(moved.width).toBeCloseTo(original.width, 0);
});

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
  await expect(popup.locator('.selected-calendar-heading')).toContainText('Farvardin');
  await expect(popup.locator('.selected-calendar-heading .selected-calendar-date')).toHaveCount(1);
  await expect(popup.locator('.fields > .left > label')).toHaveCount(0);
  const calendarWidth = await popup.locator('.selected-calendar-picker').evaluate(el => el.getBoundingClientRect().width);
  const fieldsWidth = await popup.locator('.fields').evaluate(el => el.getBoundingClientRect().width);
  expect(Math.abs(calendarWidth - fieldsWidth)).toBeLessThan(2);
  await expect(popup.locator('.calendar-time-input input')).toHaveAttribute('type', 'hidden');
  await expect(popup.locator('.calendar-time-input select')).toHaveCount(2);
  const originalBounds = await popup.boundingBox();
  const titleBounds = await popup.locator('.header-title').boundingBox();
  await page.mouse.move(titleBounds.x + titleBounds.width / 2, titleBounds.y + titleBounds.height / 2);
  await page.mouse.down();
  await page.mouse.move(titleBounds.x + titleBounds.width / 2 - 60, titleBounds.y + titleBounds.height / 2 + 20);
  await page.mouse.up();
  const movedBounds = await popup.boundingBox();
  expect(movedBounds.x).toBeCloseTo(originalBounds.x - 60, 0);
  await expect(popup).toBeVisible();
  // Compare controls in the same idle state: Save receives initial focus,
  // and the drag may end over a calendar button.
  await page.mouse.move(0, 0);
  await popup.locator('.js-submit-date').evaluate(button => button.blur());
  const buttonStyles = await popup.evaluate(el => {
    const save = getComputedStyle(el.querySelector('.js-submit-date'));
    return [...el.querySelectorAll('.selected-calendar-heading button, .js-calendar-day')].map(button => {
      const style = getComputedStyle(button);
      return {
        control: button.className, focused: button === document.activeElement,
        hovered: button.matches(':hover'),
        color: style.color, background: style.backgroundColor,
        saveColor: save.color, saveBackground: save.backgroundColor,
      };
    }).filter(style => style.background !== style.saveBackground || style.color !== style.saveColor);
  });
  expect(buttonStyles).toEqual([]);
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

for (const [viewPreference, calendarId] of [
  ['board-view-cal', 'calendar-view'],
  ['board-view-multiboard-cal', 'multiboard-calendar-view'],
]) {
test(`Jalali ${viewPreference} has actual month boundaries and a single calendar title`, async ({ page, user, board }) => {
  db.updateOne('users', { _id: user.id }, { $set: {
    'profile.language': 'en', 'profile.calendarSystem': 'jalali', 'profile.boardView': viewPreference,
  } });
  await loginWithToken(page, user.id, user.token);
  await navigateInApp(page, `/b/${board.boardId}/${board.slug}`);
  await page.waitForFunction(id => Boolean(document.getElementById(id)?._wekanCalendar), calendarId);
  await page.evaluate(id => document.getElementById(id)._wekanCalendar.gotoDate(new Date(2026, 2, 21)), calendarId);
  await expect(page.locator(`#${calendarId} .fc-toolbar-title`)).toContainText('1405-01-01');
  await expect(page.locator(`#${calendarId} .fc-toolbar-title`)).not.toContainText('2026');
  await expect(page.locator(`#${calendarId} td[data-date="2026-03-21"] .fc-daygrid-day-number`)).toHaveText('1');
  const boundaries = await page.evaluate(id => {
    const view = document.getElementById(id)._wekanCalendar.view;
    const nativeDate = date => [date.getFullYear(), date.getMonth() + 1, date.getDate()];
    return { start: nativeDate(view.currentStart), end: nativeDate(view.currentEnd) };
  }, calendarId);
  expect(boundaries).toEqual({ start: [2026, 3, 21], end: [2026, 4, 21] });
  await page.locator(`#${calendarId} .fc-next-button`).click();
  await expect(page.locator(`#${calendarId} .fc-toolbar-title`)).toContainText('1405-02-01');
  // Ordibehesht's 31 days cross Gregorian month boundaries. Its first day
  // must occupy Tuesday's column rather than the first weekday column.
  const firstCell = page.locator(`#${calendarId} td[data-date="2026-04-21"]`);
  await expect(firstCell.locator('.fc-daygrid-day-number')).toHaveText('1');
  const column = await firstCell.evaluate(cell => cell.cellIndex);
  const headerClass = await page.locator(`#${calendarId} th.fc-col-header-cell`).nth(column).getAttribute('class');
  expect(headerClass).toContain('fc-day-tue');
  await page.locator(`#${calendarId} .fc-listMonth-button`).click();
  await expect(page.locator(`#${calendarId} .fc-toolbar-title`)).toContainText('1405-02-01');
  await page.locator(`#${calendarId} .fc-prev-button`).click();
  await expect(page.locator(`#${calendarId} .fc-toolbar-title`)).toContainText('1405-01-01');
  await expect(page.locator(`#${calendarId} .fc-toolbar-title`)).not.toContainText('2026');
});
}

for (const calendarSystem of ['gregorian', 'buddhist']) {
  test(`${calendarSystem} popup opens a full-width calendar with only hour/minute controls`, async ({ page, user, board }, testInfo) => {
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
    const assertAllControlsFit = async () => {
      const layout = await popup.evaluate(el => {
        const shell = el.getBoundingClientRect();
        const controls = [...el.querySelectorAll('.selected-calendar-heading button, .js-calendar-day, .calendar-time-input select, .edit-date > button')];
        return {
          overflow: el.scrollHeight - el.clientHeight,
          bottom: shell.bottom,
          viewport: innerHeight,
          allVisible: controls.every(control => {
            const bounds = control.getBoundingClientRect();
            return bounds.top >= shell.top && bounds.bottom <= shell.bottom;
          }),
          nestedScroll: [...el.querySelectorAll('.content-wrapper, .content-container, .content, .datepicker-container')]
            .some(child => /auto|scroll/.test(getComputedStyle(child).overflowY)),
        };
      });
      expect(layout.overflow).toBeLessThan(2);
      expect(layout.bottom).toBeLessThanOrEqual(layout.viewport);
      expect(layout.allVisible).toBe(true);
      expect(layout.nestedScroll).toBe(false);
    };
    await assertAllControlsFit();
    await expect(popup.locator('.js-date-popup-resize')).toBeVisible();
    const before = await popup.boundingBox();
    await page.mouse.move(before.x + before.width - 3, before.y + before.height - 3);
    await page.mouse.down();
    await page.mouse.move(before.x + before.width + 40, before.y + before.height + 30, { steps: 8 });
    await page.mouse.up();
    const after = await popup.boundingBox();
    expect(after.width).toBeGreaterThan(before.width + 10);
    expect(after.height).toBeGreaterThan(before.height + 10);
    await assertAllControlsFit();
    await popup.locator('.js-date-popup-resize').focus();
    await popup.locator('.js-date-popup-resize').press('ArrowRight');
    await popup.locator('.js-date-popup-resize').press('ArrowDown');
    const keyboardSize = await popup.boundingBox();
    expect(keyboardSize.width).toBeGreaterThan(after.width);
    expect(keyboardSize.height).toBeGreaterThan(after.height);
    await assertAllControlsFit();
    await popup.screenshot({ path: testInfo.outputPath('resized-date-popup.png') });
    const nextDay = popup.locator('.js-calendar-day[data-date="2026-03-22"]');
    await nextDay.click();
    await expect(nextDay).toHaveAttribute('aria-pressed', 'true');
    await expect(popup.locator('.selected-calendar-picker')).toBeVisible();
  });
}

test('Arabic Member Settings shows translated calendar options after the translation audit fixes', async ({ page, user, board }) => {
  db.updateOne('users', { _id: user.id }, { $set: { 'profile.language': 'ar' } });
  await loginWithToken(page, user.id, user.token);
  await openBoard(page, board.boardId, board.slug);
  await page.locator('.js-open-header-member-menu').first().click();
  await page.locator('.js-pop-over .js-change-settings').click();
  const selector = page.locator('.js-pop-over #calendar-system');
  await expect(selector).toBeVisible();
  await expect(selector.locator('option[value="buddhist"]')).not.toHaveText('Buddhist');
  await expect(selector.locator('option[value="chinese"]')).not.toHaveText('Chinese');
  await expect(selector).not.toContainText('görünüşü');
});

test('Latvian Member Settings shows repaired calendar terminology', async ({ page, user, board }) => {
  db.updateOne('users', { _id: user.id }, { $set: { 'profile.language': 'lv' } });
  await loginWithToken(page, user.id, user.token);
  await openBoard(page, board.boardId, board.slug);
  await page.locator('.js-open-header-member-menu').first().click();
  await page.locator('.js-pop-over .js-change-settings').click();
  const selector = page.locator('.js-pop-over #calendar-system');
  await expect(selector).toBeVisible();
  await expectCalendarOption(page, selector, 'islamic-rgsa', 'Hidžras kalendārs (Saūda Arābija, pēc novērojumiem)');
  await expectCalendarOption(page, selector, 'islamic-tbla', 'Hidžras kalendārs (tabulārs, astronomiskā epoha)');
});

for (const language of ['ro', 'ro-RO']) {
  test(`${language} Member Settings distinguishes repaired Hijri calendar variants`, async ({ page, user, board }) => {
    db.updateOne('users', { _id: user.id }, { $set: { 'profile.language': language } });
    await loginWithToken(page, user.id, user.token);
    await openBoard(page, board.boardId, board.slug);
    await page.locator('.js-open-header-member-menu').first().click();
    await page.locator('.js-pop-over .js-change-settings').click();
    const selector = page.locator('.js-pop-over #calendar-system');
    await expect(selector).toBeVisible();
    await expectCalendarOption(page, selector, 'islamic-rgsa', 'Calendar Hijri (Arabia Saudită, observarea lunii)');
    await expectCalendarOption(page, selector, 'islamic-tbla', 'Calendar Hijri (tabular, epocă astronomică)');
    await expect(selector).not.toContainText('Islamic (Saudi Arabia)');
    await expect(selector).not.toContainText('Islamic tabular');
  });
}

for (const [language, sighting, tabular] of [
  ['bo', 'Hijri ལོ་ཐོ། (སཽ་དྷི་ཨ་རཱ་བི་ཡ། ཟླ་བ་མཐོང་བ་ལྟར།)', 'Hijri ལོ་ཐོ། (རེའུ་མིག་ལྟར། སྐར་དཔྱད་རིག་པའི་རྩིས་འགོའི་དུས་ཚེས།)'],
  ['de', 'Hidschri-Kalender (Saudi-Arabien, Mondsichtung)', 'Hidschri-Kalender (tabellarisch, astronomische Epoche)'],
  ['pt-BR', 'Calendário islâmico (Arábia Saudita, observação da Lua)', 'Calendário islâmico (tabular, época astronômica)'],
]) {
  test(`${language} Member Settings shows native Hijri variant labels`, async ({ page, user, board }) => {
    db.updateOne('users', { _id: user.id }, { $set: { 'profile.language': language } });
    await loginWithToken(page, user.id, user.token);
    await openBoard(page, board.boardId, board.slug);
    await page.locator('.js-open-header-member-menu').first().click();
    await page.locator('.js-pop-over .js-change-settings').click();
    const selector = page.locator('.js-pop-over #calendar-system');
    await expect(selector).toBeVisible();
    await expectCalendarOption(page, selector, 'islamic-rgsa', sighting);
    await expectCalendarOption(page, selector, 'islamic-tbla', tabular);
    await expect(selector).not.toContainText('Islamic (Saudi Arabia)');
  });
}
