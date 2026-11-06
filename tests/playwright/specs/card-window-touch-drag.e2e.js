'use strict';

// The opened card's window moves under a FINGER. It was moved by mousedown / mousemove
// / mouseup only; a finger sends none of them while it moves, so on an iPad the page
// behind the card scrolled and the card stayed where it was - dragged from the collapse
// caret, the space beside it, the card number, or the drag handle. Title editing is
// unaffected (a tap on the title edits). Chromium only: the touch comes from the
// DevTools protocol, which produces the same Pointer Events (pointerType "touch") a
// finger does, and honours touch-action.
const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const BoardPage = require('../pages/BoardPage');

async function touchDrag(cdp, from, to, steps = 12) {
  const point = (x, y) => ({ x, y, id: 1 });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [point(from.x, from.y)] });
  for (let i = 1; i <= steps; i += 1) {
    await cdp.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: [point(from.x + ((to.x - from.x) * i) / steps, from.y + ((to.y - from.y) * i) / steps)],
    });
  }
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
}

const cardBox = page => page.evaluate(() => {
  const b = document.querySelector('.card-details').getBoundingClientRect();
  return { x: Math.round(b.x), y: Math.round(b.y) };
});
const centre = async locator => {
  const b = await locator.boundingBox();
  return { x: Math.round(b.x + b.width / 2), y: Math.round(b.y + b.height / 2) };
};

async function openCardWindow(page, board, user, { handles, touch = true }) {
  db.updateOne('users', { _id: user.id }, { $set: { 'profile.showDesktopDragHandles': handles } });
  db.updateOne('boards', { _id: board.boardId }, { $set: { allowsCardNumber: true } });
  await page.evaluate(() => localStorage.setItem('wekan-mobile-mode', 'false'));
  await page.reload();
  await new BoardPage(page).clickCard(board.listIds[0], 'Alpha Card');
  await expect(page.locator('.card-details')).toBeVisible();
  await expect(page.locator('body')).toHaveClass(/desktop-mode/);
  if (handles) await expect(page.locator('.js-card-drag-handle')).toBeVisible();
  else await expect(page.locator('.js-card-drag-handle')).toHaveCount(0);
  // Touch comes from the DevTools protocol, which only Chromium has; the mouse
  // test asks for none, so it runs in Firefox and WebKit too (it failed there
  // with "CDP session is only available in Chromium" before it had moved).
  if (!touch) return null;
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 1 });
  return cdp;
}

test('a finger moves the card window from the collapse caret, the space beside it and the card number', async ({ boardPage: page, board, user, browserName }) => {
  test.skip(browserName !== 'chromium', 'the touch comes from the DevTools protocol');
  const cdp = await openCardWindow(page, board, user, { handles: false });

  const spots = {
    'the collapse caret': () => centre(page.locator('.card-details .card-collapse-toggle')),
    'the card number': () => centre(page.locator('.card-details .card-number')),
    'the space between the title and the menu': async () => {
      const title = await page.locator('.card-details .card-details-title').boundingBox();
      const menu = await page.locator('.card-details .js-open-card-details-menu').boundingBox();
      const header = await page.locator('.card-details .card-details-header').boundingBox();
      return { x: Math.round((title.x + title.width + menu.x) / 2), y: Math.round(header.y + 18) };
    },
  };

  const inline = await page.evaluate(() => { const c = document.querySelector('.card-details'); return { left: c.style.left, top: c.style.top }; });
  for (const [name, where] of Object.entries(spots)) {
    const before = await cardBox(page);
    const from = await where();
    await touchDrag(cdp, from, { x: from.x - 120, y: from.y + 90 });
    await expect.poll(() => cardBox(page), { message: `a finger drag from ${name} moves the window` })
      .toMatchObject({ x: before.x - 120, y: before.y + 90 });
    // put it back for the next one
    await page.evaluate(({ left, top }) => { const c = document.querySelector('.card-details'); c.style.left = left; c.style.top = top; }, inline);
    await expect.poll(() => cardBox(page)).toMatchObject(before);
  }
});

test('a tap on the collapse caret still collapses the card, and the title still edits', async ({ boardPage: page, board, user, browserName }) => {
  test.skip(browserName !== 'chromium', 'the touch comes from the DevTools protocol');
  const cdp = await openCardWindow(page, board, user, { handles: false });
  const before = await cardBox(page);

  // A tap: press and release on the caret with no movement.
  const caret = await centre(page.locator('.card-details .card-collapse-toggle'));
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: caret.x, y: caret.y, id: 1 }] });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await expect(page.locator('.card-details.card-details-collapsed'), 'the tap collapses it').toBeVisible();
  expect(await cardBox(page), 'and does not move it').toMatchObject(before);
  await page.locator('.card-details .card-collapse-toggle').click();
  await expect(page.locator('.card-details.card-details-collapsed')).toHaveCount(0);

  // The title edits when it is tapped (not dragged from).
  await page.locator('.card-details .card-details-title').click();
  await expect(page.locator('.card-details textarea.js-edit-card-title, .card-details .js-card-details-title textarea')).toBeVisible();
});

test('a drag that starts on the caret moves the window and does not also collapse the card', async ({ boardPage: page, board, user, browserName }) => {
  test.skip(browserName !== 'chromium', 'the touch comes from the DevTools protocol');
  const cdp = await openCardWindow(page, board, user, { handles: false });
  const before = await cardBox(page);
  const from = await centre(page.locator('.card-details .card-collapse-toggle'));
  await touchDrag(cdp, from, { x: from.x + 60, y: from.y + 40 });
  await expect.poll(() => cardBox(page), { message: 'it moved' }).toMatchObject({ x: before.x + 60, y: before.y + 40 });
  await expect(page.locator('.card-details.card-details-collapsed'), 'the click after a drag is swallowed').toHaveCount(0);
});

test('a popup moves under a finger by its title bar', async ({ boardPage: page, browserName }) => {
  test.skip(browserName !== 'chromium', 'the touch comes from the DevTools protocol');
  await page.locator('.js-open-header-member-menu').first().click();
  const header = page.locator('.pop-over .header').first();
  await expect(header).toBeVisible();
  const box = () => page.evaluate(() => { const b = document.querySelector('.pop-over').getBoundingClientRect(); return { x: Math.round(b.x), y: Math.round(b.y) }; });
  const before = await box();
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 1 });
  // The title bar beside its title, away from the back and close buttons.
  const h = await header.boundingBox();
  const from = { x: Math.round(h.x + h.width / 2), y: Math.round(h.y + h.height / 2) };
  await touchDrag(cdp, from, { x: from.x - 90, y: from.y + 70 });
  await expect.poll(box, { message: 'a finger on the title bar moves the popup' }).toMatchObject({ x: before.x - 90, y: before.y + 70 });
});

test('with drag handles on, the handle moves the window under a finger and the header row does not', async ({ boardPage: page, board, user, browserName }) => {
  test.skip(browserName !== 'chromium', 'the touch comes from the DevTools protocol');
  const cdp = await openCardWindow(page, board, user, { handles: true });
  const before = await cardBox(page);

  // Negative: the header row is not the way when handles are on - not the caret (a
  // control, which would otherwise wait for a drag), not the card number.
  for (const locator of [page.locator('.card-details .card-collapse-toggle'), page.locator('.card-details .card-number')]) {
    const from = await centre(locator);
    await touchDrag(cdp, from, { x: from.x - 100, y: from.y + 80 });
    expect(await cardBox(page), 'the header row does not move it').toMatchObject(before);
  }

  // The handle does.
  const handle = await centre(page.locator('.card-details .js-card-drag-handle'));
  await touchDrag(cdp, handle, { x: handle.x - 140, y: handle.y + 100 });
  await expect.poll(() => cardBox(page), { message: 'a finger on the handle moves the window' })
    .toMatchObject({ x: before.x - 140, y: before.y + 100 });
});

test('a mouse still moves the window by the header row', async ({ boardPage: page, board, user }) => {
  await openCardWindow(page, board, user, { handles: false, touch: false });
  const before = await cardBox(page);
  const header = await page.locator('.card-details .card-details-header').boundingBox();
  const title = await page.locator('.card-details .card-details-title').boundingBox();
  const menu = await page.locator('.card-details .js-open-card-details-menu').boundingBox();
  const x = Math.round((title.x + title.width + menu.x) / 2);
  const y = Math.round(header.y + 18);
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x - 80, y + 60, { steps: 8 });
  await page.mouse.up();
  await expect.poll(() => cardBox(page)).toMatchObject({ x: before.x - 80, y: before.y + 60 });
});
