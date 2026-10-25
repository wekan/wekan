'use strict';

// #6802: the lasso. A loop selects lines; the selection moves together,
// resizes from its handle, groups and ungroups, and changes layer - and Undo
// steps back through each of those.

const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const BoardPage = require('../pages/BoardPage');
const CardPage = require('../pages/CardPage');

const drawingPopup = page => page.locator('.js-pop-over[data-popup="cardDrawingPopup"]');
const lines = page => page.locator('.js-drawing-surface path:not(.card-drawing-lasso-loop)');

// A pointer path through `points` (fractions of the surface), pressed all the way.
async function pointerPath(page, points) {
  await page.locator('.js-drawing-surface').evaluate((svg, points) => {
    const r = svg.getBoundingClientRect();
    const at = ([x, y]) => ({ clientX: r.left + r.width * x, clientY: r.top + r.height * y });
    const send = (type, p) => svg.dispatchEvent(new PointerEvent(type, { bubbles: true, cancelable: true, pointerType: 'mouse', pointerId: 1, isPrimary: true, button: 0, buttons: type === 'pointerup' ? 0 : 1, ...at(p) }));
    send('pointerdown', points[0]);
    for (let i = 1; i < points.length; i += 1) {
      const [a, b] = [points[i - 1], points[i]];
      for (let k = 1; k <= 4; k += 1) send('pointermove', [a[0] + ((b[0] - a[0]) * k) / 4, a[1] + ((b[1] - a[1]) * k) / 4]);
    }
    send('pointerup', points[points.length - 1]);
  }, points);
}
const loopAround = (page, x0, y0, x1, y1) => pointerPath(page, [[x0, y0], [x1, y0], [x1, y1], [x0, y1], [x0, y0]]);
const pathDs = page => lines(page).evaluateAll(ps => ps.map(p => p.getAttribute('d')));
// The drawing's own size (#6802: it takes the room there is), from its viewBox.
const drawingSize = page => page.locator('.js-drawing-surface').evaluate(svg => {
  const [, , width, height] = svg.getAttribute('viewBox').split(' ').map(Number);
  return { width, height };
});
const boxOf = page => page.locator('.card-drawing-selection').evaluate(r => ({
  x: Number(r.getAttribute('x')), y: Number(r.getAttribute('y')), width: Number(r.getAttribute('width')), height: Number(r.getAttribute('height')),
}));

test('the lasso selects, moves, resizes, groups and stacks lines, and Undo steps back', async ({ boardPage: page, board }) => {
  const bp = new BoardPage(page);
  const cp = new CardPage(page);
  await bp.clickCard(board.listIds[0], 'Alpha Card');
  await cp.waitForOpen();
  const card = db.findOne('cards', { boardId: board.boardId, title: 'Alpha Card' });
  await cp.root.locator('.js-open-card-details-menu').first().click();
  await page.locator('.js-pop-over .js-card-drawing').click();
  const popup = drawingPopup(page);
  await expect(popup).toBeVisible();

  // Two short lines at the top left, one at the bottom right.
  await pointerPath(page, [[0.1, 0.1], [0.2, 0.15]]);
  await pointerPath(page, [[0.1, 0.25], [0.2, 0.3]]);
  await pointerPath(page, [[0.7, 0.7], [0.85, 0.8]]);
  await expect(lines(page)).toHaveCount(3);
  const before = await pathDs(page);
  const { width: W, height: H } = await drawingSize(page);

  await popup.locator('.js-drawing-lasso').click();
  await expect(popup.locator('.js-drawing-lasso')).toHaveClass(/is-active/);
  await expect(popup.locator('.card-drawing-selection-tools')).toHaveCount(0);

  // The loop around the two top-left lines selects them.
  await loopAround(page, 0.05, 0.05, 0.3, 0.4);
  await expect(popup.locator('.card-drawing-selection-tools')).toBeVisible();
  await expect(popup.locator('.card-drawing-selection')).toHaveCount(1);
  await expect(lines(page)).toHaveCount(3, { timeout: 1000 });

  // Moved together, from inside the box; the third line stays.
  const box = await boxOf(page);
  const inside = [(box.x + box.width / 2) / W, (box.y + box.height / 2) / H];
  await pointerPath(page, [inside, [inside[0] + 0.25, inside[1] + 0.1]]);
  // Blaze draws a change after the event: wait for it before reading.
  await expect.poll(async () => (await pathDs(page))[0]).not.toBe(before[0]);
  const moved = await pathDs(page);
  expect(moved[0]).not.toBe(before[0]);
  expect(moved[1]).not.toBe(before[1]);
  expect(moved[2]).toBe(before[2]);
  await expect.poll(async () => (await boxOf(page)).x).toBeGreaterThan(box.x + W * 0.18);
  const movedBox = await boxOf(page);
  expect(movedBox.x).toBeGreaterThan(box.x + W * 0.18);
  expect(Math.round(movedBox.width)).toBe(Math.round(box.width));

  // Resized by the handle, from the top-left corner.
  const handle = [(movedBox.x + movedBox.width) / W, (movedBox.y + movedBox.height) / H];
  await pointerPath(page, [handle, [handle[0] + 0.1, handle[1] + 0.1]]);
  await expect.poll(async () => (await boxOf(page)).width).toBeGreaterThan(movedBox.width * 1.2);
  const resized = await boxOf(page);
  expect(Math.abs(resized.x - movedBox.x)).toBeLessThan(3);

  // Grouped: a loop around just one of them selects both.
  await expect(popup.locator('.js-drawing-ungroup')).toHaveCount(0);
  await popup.locator('.js-drawing-group').click();
  await expect(popup.locator('.js-drawing-ungroup')).toBeVisible();
  await loopAround(page, 0.95, 0.95, 0.99, 0.99); // empty: nothing selected
  await expect(popup.locator('.card-drawing-selection-tools')).toHaveCount(0);
  const grouped = await pathDs(page);
  const firstBox = await lines(page).first().evaluate(p => { const b = p.getBBox(); return { x: b.x, y: b.y, width: b.width, height: b.height }; });
  await loopAround(page, (firstBox.x - 8) / W, (firstBox.y - 8) / H, (firstBox.x + firstBox.width + 8) / W, (firstBox.y + firstBox.height + 8) / H);
  await expect(popup.locator('.js-drawing-ungroup')).toBeVisible();
  const groupBox = await boxOf(page);
  expect(groupBox.height).toBeGreaterThan(firstBox.height + 20);

  // Layer: the group to the front - the bottom-right line is now first.
  await popup.locator('.js-drawing-layer[data-layer="front"]').click();
  const front = [grouped[2], grouped[0], grouped[1]];
  await expect.poll(() => pathDs(page)).toEqual(front);
  await popup.locator('.js-drawing-layer[data-layer="backward"]').click();
  await expect.poll(() => pathDs(page)).toEqual(grouped);

  // Undo: back through the layer changes, the grouping, the resize and the move.
  await popup.locator('.js-drawing-undo').click();
  await expect.poll(() => pathDs(page)).toEqual(front);
  for (let i = 0; i < 4; i += 1) await popup.locator('.js-drawing-undo').click();
  await expect.poll(() => pathDs(page)).toEqual(before);

  // Ungroup, regroup and save: the group is kept on the card.
  for (let i = 0; i < 4; i += 1) await popup.locator('.js-drawing-undo').click(); // nothing to step back to: lines go
  await expect(lines(page)).toHaveCount(0);
  await popup.locator('.js-drawing-lasso').click(); // back to the pen
  await pointerPath(page, [[0.1, 0.1], [0.2, 0.15]]);
  await pointerPath(page, [[0.1, 0.25], [0.2, 0.3]]);
  await popup.locator('.js-drawing-lasso').click();
  await loopAround(page, 0.05, 0.05, 0.3, 0.4);
  await popup.locator('.js-drawing-group').click();
  await popup.locator('.js-drawing-save').click();
  await expect.poll(() => {
    const saved = (db.findOne('cards', { _id: card._id }).drawings || []).slice(-1)[0];
    return saved ? saved.strokes.map(s => Boolean(s.group)) : null;
  }, { timeout: 15_000 }).toEqual([true, true]);
});
