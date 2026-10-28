'use strict';

// #6802: the Drawing popup's drawing area takes the room there is, grows from
// its corner handle and zooms with the magnifier; Save is above the drawing;
// a color comes from the wheel, an HTML color code, the custom colors or the
// eyedropper; and Add Card's Drawing sits in Search / Template / Drawing /
// More options.

const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const BoardPage = require('../pages/BoardPage');
const CardPage = require('../pages/CardPage');

const drawingPopup = page => page.locator('.js-pop-over[data-popup="cardDrawingPopup"]');
const viewBox = page => page.locator('.js-drawing-surface').evaluate(svg => svg.getAttribute('viewBox').split(' ').map(Number));

async function stroke(page, from, to) {
  await page.locator('.js-drawing-surface').evaluate((svg, { from, to }) => {
    const r = svg.getBoundingClientRect();
    const at = ([x, y]) => ({ clientX: r.left + r.width * x, clientY: r.top + r.height * y });
    const send = (type, p) => svg.dispatchEvent(new PointerEvent(type, { bubbles: true, cancelable: true, pointerType: 'mouse', pointerId: 1, isPrimary: true, button: 0, buttons: type === 'pointerup' ? 0 : 1, ...at(p) }));
    send('pointerdown', from);
    for (let i = 1; i <= 4; i += 1) send('pointermove', [from[0] + ((to[0] - from[0]) * i) / 4, from[1] + ((to[1] - from[1]) * i) / 4]);
    send('pointerup', to);
  }, { from, to });
}

async function openNewDrawing(page, board) {
  const bp = new BoardPage(page);
  const cp = new CardPage(page);
  await bp.clickCard(board.listIds[0], 'Alpha Card');
  await cp.waitForOpen();
  const details = page.locator('.card-details');
  const header = details.locator('.js-toggle-card-section[data-section="attachments"]');
  if (await header.locator('.fa-caret-right').count()) await header.click();
  await details.locator('.attachment-gallery .js-add-attachment').click();
  await page.locator('.js-pop-over .js-attach-drawing').click();
  const popup = drawingPopup(page);
  await expect(popup).toHaveClass(/pop-over--maximized/);
  return popup;
}

test('the drawing area fills the window, grows from its corner and zooms; Save is above it', async ({ boardPage: page, board }) => {
  const popup = await openNewDrawing(page, board);
  const viewport = page.viewportSize();

  // The whole room: wider than the old 800 x 500 on a large window.
  await expect.poll(async () => (await viewBox(page))[2]).toBeGreaterThan(Math.min(800, viewport.width * 0.6));
  const surface = await page.locator('.js-drawing-surface').boundingBox();
  expect(surface.width).toBeGreaterThan(viewport.width * 0.85);
  expect(surface.height).toBeGreaterThan(viewport.height * 0.5);

  // Save above the drawing, at the right end of the tools.
  const save = await popup.locator('.js-drawing-save').boundingBox();
  const eraser = await popup.locator('.js-drawing-eraser').boundingBox();
  expect(save.y + save.height).toBeLessThanOrEqual(surface.y + 1);
  expect(save.x).toBeGreaterThan(eraser.x);

  // The corner handle makes the drawing area larger. Filling the window, the
  // handle sits at the window's corner (x 1236 of 1280) and a drag past the
  // window's edge is not delivered by every browser - Firefox stopped at the
  // edge - so the drawing is zoomed out to 80% first, which leaves room.
  await popup.locator('.js-drawing-zoom-out').click();
  await expect(popup.locator('.card-drawing-zoom')).toHaveText('80%');
  const [, , w0, h0] = await viewBox(page);
  const handle = popup.locator('.js-drawing-canvas-resize');
  const hb = await handle.boundingBox();
  await page.mouse.move(hb.x + hb.width / 2, hb.y + hb.height / 2);
  await page.mouse.down();
  await page.mouse.move(hb.x + 120, hb.y + 80, { steps: 5 });
  await page.mouse.up();
  await expect.poll(async () => (await viewBox(page))[2]).toBeGreaterThan(w0 + 60);
  expect((await viewBox(page))[3]).toBeGreaterThan(h0 + 40);

  // The magnifier: larger and smaller on the screen, the drawing itself the same.
  const before = await page.locator('.js-drawing-surface').boundingBox();
  await popup.locator('.js-drawing-zoom-in').click();
  await expect.poll(async () => (await page.locator('.js-drawing-surface').boundingBox()).width).toBeGreaterThan(before.width * 1.2);
  await expect(popup.locator('.card-drawing-zoom')).toHaveText('100%');
  await popup.locator('.js-drawing-zoom-in').click();
  await expect(popup.locator('.card-drawing-zoom')).toHaveText('125%');
  await popup.locator('.js-drawing-zoom-out').click();
  await popup.locator('.js-drawing-zoom-out').click();
  await expect(popup.locator('.card-drawing-zoom')).toHaveText('80%');

  // A line still lands where it is drawn, zoomed out: its first point is a
  // tenth of the way across the drawing.
  await stroke(page, [0.1, 0.1], [0.3, 0.2]);
  const [, , w1] = await viewBox(page);
  const d0 = await page.locator('.js-drawing-surface path').first().getAttribute('d');
  const x = Number(d0.match(/^M([\d.]+)/)[1]);
  expect(Math.abs(x - w1 * 0.1)).toBeLessThan(w1 * 0.02);
});

test('colors: the wheel, the HTML color code, custom colors and the eyedropper', async ({ boardPage: page, board }) => {
  const popup = await openNewDrawing(page, board);
  await page.evaluate(() => window.localStorage.removeItem('wekan-drawing-custom-colors'));

  // Clicking a color opens the wheel and the code.
  await popup.locator('.js-drawing-color').nth(1).click();
  await expect(popup.locator('.js-drawing-wheel')).toBeVisible();
  await expect(popup.locator('.js-drawing-hex')).toHaveValue('#e53935');

  // The code sets the pen color, and a line is drawn with it.
  await popup.locator('.js-drawing-hex').fill('#3366cc');
  await stroke(page, [0.1, 0.5], [0.5, 0.5]);
  await expect(page.locator('.js-drawing-surface path').last()).toHaveAttribute('stroke', '#3366cc');

  // Negative: a code that is not a color changes nothing.
  await popup.locator('.js-drawing-hex').fill('javascript:x');
  await stroke(page, [0.1, 0.6], [0.5, 0.6]);
  await expect(page.locator('.js-drawing-surface path').last()).toHaveAttribute('stroke', '#3366cc');

  // The wheel: its rim at 0 degrees is red, at full brightness.
  await popup.locator('.js-drawing-hex').fill('#ffffff');
  const wheel = await popup.locator('.js-drawing-wheel').boundingBox();
  await page.mouse.click(wheel.x + wheel.width - 2, wheel.y + wheel.height / 2);
  await expect(popup.locator('.js-drawing-hex')).toHaveValue(/^#f[a-f0-9]0[0-9a-f]0[0-9a-f]$/);

  // Added to the colors, kept with the signed-in user's account - not in the
  // browser, which is for someone not signed in on a public board.
  await popup.locator('.js-drawing-hex').fill('#3366cc');
  await popup.locator('.js-drawing-add-color').click();
  await expect(popup.locator('.card-drawing-color--custom[data-color="#3366cc"]')).toHaveCount(1);
  const profileColors = () => ((db.findOne('users', { _id: board.owner.id }) || {}).profile || {}).drawingColors || [];
  await expect.poll(profileColors, { timeout: 15_000 }).toEqual(['#3366cc']);
  expect(await page.evaluate(() => window.localStorage.getItem('wekan-drawing-custom-colors'))).toBeNull();
  await popup.locator('.js-drawing-remove-color').click();
  await expect(popup.locator('.card-drawing-color--custom')).toHaveCount(0);
  await expect.poll(profileColors, { timeout: 15_000 }).toEqual([]);

  // The eyedropper, on the drawing (the browser's screen picker cannot be
  // driven by a test): it takes the color of the line under it.
  await popup.locator('.js-drawing-hex').fill('#000000');
  await page.evaluate(() => { window.EyeDropper = undefined; });
  await popup.locator('.js-drawing-eyedropper').click();
  await expect(popup.locator('.js-drawing-eyedropper')).toHaveClass(/is-active/);
  const lines = await page.locator('.js-drawing-surface path').count();
  await stroke(page, [0.3, 0.5], [0.3, 0.5]);
  await expect(popup.locator('.js-drawing-hex')).toHaveValue('#3366cc');
  await expect(page.locator('.js-drawing-surface path')).toHaveCount(lines, { timeout: 1000 });
});

test('Add Card: Drawing is in Search / Template / Drawing / More options, for one card', async ({ boardPage: page, board }) => {
  await page.locator('a.open-minicard-composer.js-open-inlined-form').first().click();
  const textarea = page.locator('textarea.minicard-composer-textarea.js-card-title').first();
  await textarea.fill('Drawn card two');
  const row = page.locator('.minicard-composer').first().locator('xpath=following-sibling::*[contains(@class,"add-controls")][2]');
  const links = await row.locator('a').evaluateAll(as => as.map(a => a.className));
  const at = name => links.findIndex(c => c.includes(name));
  expect(at('js-card-template')).toBeLessThan(at('js-add-card-drawing'));
  expect(at('js-add-card-drawing')).toBeLessThan(at('js-toggle-more-options'));

  await row.locator('.js-add-card-drawing').click();
  const popup = drawingPopup(page);
  await expect(popup).toHaveClass(/pop-over--maximized/, { timeout: 15_000 });
  await expect.poll(() => db.findOne('cards', { boardId: board.boardId, title: 'Drawn card two' }), { timeout: 15_000 }).toBeTruthy();
  await stroke(page, [0.2, 0.2], [0.6, 0.7]);
  await popup.locator('.js-drawing-save').click();
  await expect(popup).toHaveCount(0, { timeout: 15_000 });
  const card = db.findOne('cards', { boardId: board.boardId, title: 'Drawn card two' });
  await expect.poll(() => db.find('attachments', { 'meta.cardId': card._id }).filter(a => /\.svg$/.test(a.name || '')).length, { timeout: 15_000 }).toBe(1);
});
