'use strict';
// #6839: the opened card's title, and how its window and every popup move.
//
//  - Clicking ANY part of the title edits it - the right of it too, and the
//    space beside a short last line, which used to drag the window instead.
//  - With drag handles OFF the window is moved from the empty space of its
//    header row above the title, between the collapse caret and the menu.
//  - With drag handles ON only the drag handle moves it.
//  - Every popup moves the same way: by its title bar with handles off, by its
//    handle alone with them on.
const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const { loginWithToken, openBoard } = require('../helpers/auth');
const BoardPage = require('../pages/BoardPage');
const CardPage = require('../pages/CardPage');

const LONG = 'test test test test test testtest test testtest test testtest test test';

async function drag(page, x, y, dx, dy) {
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + dx / 2, y + dy / 2, { steps: 4 });
  await page.mouse.move(x + dx, y + dy, { steps: 4 });
  await page.mouse.up();
}

async function openCard(page, user, board, handles) {
  db.updateOne('users', { _id: user.id }, { $set: { 'profile.showDesktopDragHandles': handles } });
  const card = db.findOne('cards', { boardId: board.boardId, title: 'Alpha Card' });
  db.updateOne('cards', { _id: card._id }, { $set: { title: LONG } });
  await loginWithToken(page, user.id, user.token);
  await openBoard(page, board.boardId, board.slug);
  await page.setViewportSize({ width: 1280, height: 800 });
  await new BoardPage(page).clickCard(board.listIds[0], LONG);
  const cp = new CardPage(page);
  await cp.waitForOpen();
  return cp;
}

// The empty space of the header row above the title: between the collapse
// caret and the first button at the other end, at the height of that row.
async function emptyHeaderPoint(details) {
  return details.evaluate(el => {
    const header = el.querySelector('.card-details-header');
    const caret = header.querySelector('.js-card-collapse-toggle') || header.querySelector('a');
    const menu = header.querySelector('.js-open-card-details-menu');
    const c = caret.getBoundingClientRect();
    const m = menu.getBoundingClientRect();
    const rtl = getComputedStyle(el).direction === 'rtl';
    const x = rtl ? (m.right + c.left) / 2 : (c.right + m.left) / 2;
    const y = (c.top + c.bottom) / 2;
    const hit = document.elementFromPoint(x, y);
    return { x, y, onTitle: !!hit.closest('.card-details-title'), onLink: !!hit.closest('a') };
  });
}

const box = locator => locator.boundingBox();
// Where it is, not how tall: the window settles its height as it renders.
const at = async locator => { const b = await locator.boundingBox(); return { x: Math.round(b.x), y: Math.round(b.y) }; };

test('handles off: any part of the title edits, the empty header row moves the window', async ({ page, user, board }) => {
  const cp = await openCard(page, user, board, false);
  const details = page.locator('section.js-card-details').first();
  const title = details.locator('h2.card-details-title');
  const t = await box(title);
  // The trailing end of the title - where a drag used to start - edits now.
  for (const fx of [0.95, 0.5, 0.05]) {
    await page.mouse.click(t.x + t.width * fx, t.y + t.height - 4);
    await expect(details.locator('.js-card-details-title textarea, .js-card-details-title input').first()).toBeVisible();
    await details.locator('.js-close-inlined-form').first().click();
    await expect(title).toBeVisible();
  }

  const point = await emptyHeaderPoint(details);
  expect(point.onTitle, 'the point is above the title, not on it').toBe(false);
  expect(point.onLink, 'and not on a button').toBe(false);
  const before = await box(details);
  await drag(page, point.x, point.y, -120, 60);
  const after = await box(details);
  expect(Math.round(after.x - before.x)).toBe(-120);
  expect(Math.round(after.y - before.y)).toBe(60);
  // Negative: moving it opened no editor.
  await expect(details.locator('.js-card-details-title textarea')).toHaveCount(0);
  expect(cp).toBeTruthy();
});

test('handles on: the empty header row does not move the window, the handle does', async ({ page, user, board }) => {
  await openCard(page, user, board, true);
  const details = page.locator('section.js-card-details').first();
  const handle = details.locator('.js-card-drag-handle');
  await expect(handle).toBeVisible();
  const point = await emptyHeaderPoint(details);
  const before = await box(details);
  await drag(page, point.x, point.y, -120, 60);
  expect(await at(details), 'negative: the header row is not a drag source with a handle').toEqual({ x: Math.round(before.x), y: Math.round(before.y) });
  const h = await box(handle);
  await drag(page, h.x + h.width / 2, h.y + h.height / 2, -120, 60);
  const after = await box(details);
  expect(Math.round(after.x - before.x)).toBe(-120);
  expect(Math.round(after.y - before.y)).toBe(60);
});

for (const handles of [false, true]) {
  test(`every popup moves like the card - ${handles ? 'by its handle alone with handles on' : 'by its title bar with handles off'}`, async ({ page, user, board }) => {
    await openCard(page, user, board, handles);
    const details = page.locator('section.js-card-details').first();
    const popups = [
      // The card's menu, Labels from the card, and a member menu outside it.
      async () => details.locator('.js-open-card-details-menu').first().click(),
      async () => details.locator('a.add-label.js-add-labels').first().click(),
      async () => page.locator('.js-open-header-member-menu').first().click(),
    ];
    for (const open of popups) {
      await open();
      const pop = page.locator('.js-pop-over').last();
      await expect(pop).toBeVisible();
      const titleBar = pop.locator('.header-title');
      const handle = pop.locator('.js-popup-drag-handle');
      await expect(handle).toHaveCount(handles ? 1 : 0);
      const before = await box(pop);
      const bar = await box(titleBar);
      await drag(page, bar.x + Math.min(30, bar.width / 2), bar.y + bar.height / 2, -40, 30);
      if (handles) {
        expect(await at(pop), 'negative: with a handle, the title bar does not move it').toEqual({ x: Math.round(before.x), y: Math.round(before.y) });
        const h = await box(handle);
        await drag(page, h.x + h.width / 2, h.y + h.height / 2, -40, 30);
      }
      const after = await box(pop);
      expect(Math.round(after.x - before.x), await pop.getAttribute('data-popup')).toBe(-40);
      expect(Math.round(after.y - before.y)).toBe(30);
      await pop.locator('.js-close-pop-over').first().click();
      await expect(page.locator('.js-pop-over')).toHaveCount(0);
    }
  });
}
