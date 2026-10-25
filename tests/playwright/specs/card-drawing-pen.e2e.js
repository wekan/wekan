'use strict';

// #6802: a new drawing, the whole window, saved as an SVG attachment - from
// the opened card's Add attachment popup, and from Add Card when it adds ONE
// card - and the pen tools: the eraser, and palm rejection.

const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const BoardPage = require('../pages/BoardPage');
const CardPage = require('../pages/CardPage');

const drawingPopup = page => page.locator('.js-pop-over[data-popup="cardDrawingPopup"]');

async function stroke(page, from, to, pointerType = 'mouse', pointerId = 1) {
  // Pointer events of the given kind, as a pen or a palm would send them.
  await page.locator('.js-drawing-surface').evaluate((svg, { from, to, pointerType, pointerId }) => {
    const r = svg.getBoundingClientRect();
    const at = ([x, y]) => ({ clientX: r.left + r.width * x, clientY: r.top + r.height * y });
    const send = (type, p) => svg.dispatchEvent(new PointerEvent(type, { bubbles: true, cancelable: true, pointerType, pointerId, isPrimary: true, button: 0, buttons: type === 'pointerup' ? 0 : 1, ...at(p) }));
    send('pointerdown', from);
    for (let i = 1; i <= 6; i += 1) send('pointermove', [from[0] + ((to[0] - from[0]) * i) / 6, from[1] + ((to[1] - from[1]) * i) / 6]);
    send('pointerup', to);
  }, { from, to, pointerType, pointerId });
}

const lines = page => page.locator('.js-drawing-surface path');

async function svgAttachmentsOf(cardId) {
  return db.find('attachments', { 'meta.cardId': cardId }).filter(a => /\.svg$/.test(a.name || '') || a.type === 'image/svg+xml');
}

test('Add attachment / Drawing: a new drawing on the whole window, saved as an SVG attachment', async ({ boardPage: page, board }) => {
  const bp = new BoardPage(page);
  const cp = new CardPage(page);
  await bp.clickCard(board.listIds[0], 'Alpha Card');
  await cp.waitForOpen();
  const card = db.findOne('cards', { boardId: board.boardId, title: 'Alpha Card' });
  const details = page.locator('.card-details');
  const header = details.locator('.js-toggle-card-section[data-section="attachments"]');
  await expect(header).toBeVisible();
  if (await header.locator('.fa-caret-right').count()) await header.click();
  await details.locator('.attachment-gallery .js-add-attachment').click();
  await page.locator('.js-pop-over .js-attach-drawing').click();

  const popup = drawingPopup(page);
  await expect(popup).toHaveClass(/pop-over--maximized/);
  await expect(popup.locator('.js-new-drawing')).toHaveCount(0, { timeout: 1000 });
  const box = await popup.boundingBox();
  const viewport = page.viewportSize();
  expect(box.width).toBeGreaterThan(viewport.width - 40);

  await stroke(page, [0.1, 0.2], [0.8, 0.6]);
  await expect(lines(page)).toHaveCount(1);
  await popup.locator('.js-drawing-save').click();
  await expect(popup).toHaveCount(0, { timeout: 15_000 });
  await expect.poll(async () => (await svgAttachmentsOf(card._id)).length, { timeout: 15_000 }).toBe(1);
  const saved = db.findOne('cards', { _id: card._id }).drawings.slice(-1)[0];
  expect(saved.svgAttachmentId).toBeTruthy();
  expect(saved.strokes.length).toBe(1);
});

test('Add Card: one card gets a Drawing button that opens the new card and draws on it', async ({ boardPage: page, board }) => {
  const composerOpen = page.locator('a.open-minicard-composer.js-open-inlined-form').first();
  await composerOpen.click();
  const textarea = page.locator('textarea.minicard-composer-textarea.js-card-title').first();
  const button = page.locator('.js-add-card-drawing').first();

  // Negative: two cards to add, no Drawing.
  await textarea.fill('First\nSecond');
  const separate = page.locator('.js-multiline-title-mode[value="separate"]').first();
  if (await separate.count()) await separate.check();
  if ((await textarea.evaluate(el => el.value.split('\n').length)) > 1 && (await separate.count())) {
    await expect(button).toHaveCount(0);
  }

  await textarea.fill('Drawn card');
  await expect(button).toBeVisible();
  await button.click();

  const popup = drawingPopup(page);
  await expect(popup).toHaveClass(/pop-over--maximized/, { timeout: 15_000 });
  await expect.poll(() => db.findOne('cards', { boardId: board.boardId, title: 'Drawn card' }), { timeout: 15_000 }).toBeTruthy();
  const card = db.findOne('cards', { boardId: board.boardId, title: 'Drawn card' });
  await expect(page).toHaveURL(new RegExp(card._id));

  await stroke(page, [0.2, 0.2], [0.6, 0.7]);
  await popup.locator('.js-drawing-save').click();
  await expect(popup).toHaveCount(0, { timeout: 15_000 });
  await expect.poll(async () => (await svgAttachmentsOf(card._id)).length, { timeout: 15_000 }).toBe(1);
});

test('the eraser takes away a line, and a palm draws nothing after the pen', async ({ boardPage: page, board }) => {
  const bp = new BoardPage(page);
  const cp = new CardPage(page);
  await bp.clickCard(board.listIds[0], 'Alpha Card');
  await cp.waitForOpen();
  await cp.root.locator('.js-open-card-details-menu').first().click();
  await page.locator('.js-pop-over .js-card-drawing').click();
  const popup = drawingPopup(page);
  await expect(popup).toBeVisible();

  await stroke(page, [0.1, 0.5], [0.9, 0.5], 'pen', 7);
  await stroke(page, [0.1, 0.8], [0.9, 0.8], 'pen', 7);
  await expect(lines(page)).toHaveCount(2);

  // Palm rejection: a touch after the pen leaves no line.
  await stroke(page, [0.2, 0.2], [0.4, 0.3], 'touch', 11);
  await expect(lines(page)).toHaveCount(2);

  // The eraser: across the first line only.
  await popup.locator('.js-drawing-eraser').click();
  await expect(popup.locator('.js-drawing-eraser')).toHaveClass(/is-active/);
  await stroke(page, [0.5, 0.4], [0.5, 0.6], 'pen', 7);
  await expect(lines(page)).toHaveCount(1);
});
