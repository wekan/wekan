'use strict';

// The whiteboard (docs/Features/Cards/Whiteboard.md): opened from the card's
// drawing, under the header bar, and two people in two browsers drawing on it
// at the same moment - each sees both lines, Undo takes away only one's own.

const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const { loginWithToken, openBoard } = require('../helpers/auth');
const BoardPage = require('../pages/BoardPage');
const CardPage = require('../pages/CardPage');

async function openWhiteboard(page, board, title) {
  const bp = new BoardPage(page);
  const cp = new CardPage(page);
  await bp.clickCard(board.listIds[0], title);
  await cp.waitForOpen();
  await cp.root.locator('.js-open-card-details-menu').first().click();
  await page.locator('.js-pop-over .js-card-drawing').click();
  await page.locator('.js-pop-over .js-open-whiteboard').first().click();
  const wb = page.locator('.js-card-whiteboard');
  await expect(wb).toBeVisible({ timeout: 15_000 });
  return wb;
}

async function drawLine(page, from, to) {
  const box = await page.locator('.js-whiteboard-surface').boundingBox();
  const at = ([x, y]) => [box.x + box.width * x, box.y + box.height * y];
  await page.mouse.move(...at(from));
  await page.mouse.down();
  for (let i = 1; i <= 8; i += 1) {
    await page.mouse.move(...at([from[0] + ((to[0] - from[0]) * i) / 8, from[1] + ((to[1] - from[1]) * i) / 8]));
  }
  await page.mouse.up();
}

test('two people draw on one whiteboard at once', async ({ boardPage, board, user, browser }) => {
  const alpha = db.findOne('cards', { boardId: board.boardId, title: 'Alpha Card' });
  db.updateOne('cards', { _id: alpha._id }, { $set: { drawings: [{ _id: 'wb1', strokes: [], width: 800, height: 500, updatedAt: new Date() }] } });
  const other = db.seedUser();
  db.addBoardMember({ boardId: board.boardId, userId: other.id });

  const wb1 = await openWhiteboard(boardPage, board, 'Alpha Card');
  // Under the header bar, not over it.
  const header = await boardPage.locator('#header-quick-access').boundingBox();
  expect(Math.round((await wb1.boundingBox()).y)).toBeGreaterThanOrEqual(Math.round(header.y + header.height) - 1);
  await expect(boardPage.locator('#header-quick-access')).toBeVisible();

  const context = await browser.newContext();
  const page2 = await context.newPage();
  try {
    await loginWithToken(page2, other.id, other.token);
    await openBoard(page2, board.boardId, board.slug);
    const wb2 = await openWhiteboard(page2, board, 'Alpha Card');

    // The same moment: both pens down before either is lifted.
    await Promise.all([drawLine(boardPage, [0.1, 0.2], [0.4, 0.3]), drawLine(page2, [0.5, 0.6], [0.9, 0.8])]);
    await expect.poll(() => (db.findOne('cards', { _id: alpha._id }).drawings[0].strokes || []).map(s => s.userId).sort(),
      { timeout: 15_000 }).toEqual([user.id, other.id].sort());
    await expect(wb1.locator('path')).toHaveCount(2, { timeout: 15_000 });
    await expect(wb2.locator('path')).toHaveCount(2, { timeout: 15_000 });

    // Undo takes away only one's own line, on both screens.
    await wb1.locator('.js-whiteboard-undo').click();
    await expect.poll(() => db.findOne('cards', { _id: alpha._id }).drawings[0].strokes.map(s => s.userId), { timeout: 15_000 })
      .toEqual([other.id]);
    await expect(wb2.locator('path')).toHaveCount(1, { timeout: 15_000 });

    // Escape closes it.
    await boardPage.keyboard.press('Escape');
    await expect(boardPage.locator('.js-card-whiteboard')).toHaveCount(0);
  } finally {
    await context.close();
  }
});

test('a line from somebody who may not edit the card is refused (negative)', async ({ boardPage, board }) => {
  const alpha = db.findOne('cards', { boardId: board.boardId, title: 'Alpha Card' });
  db.updateOne('cards', { _id: alpha._id }, { $set: { drawings: [{ _id: 'wb2', strokes: [], width: 800, height: 500 }] } });
  const ask = () => boardPage.evaluate(id => Meteor.callAsync('cards.whiteboardAddStroke', id, 'wb2',
    { _id: 'line1', color: '#000000', width: 2, points: [[1, 1], [2, 2]] }).then(() => 'ok', e => e.error), alpha._id);
  db.updateOne('boards', { _id: board.boardId }, { $set: { allowsWhiteboardOnCard: false } });
  expect(await ask()).toBe('not-authorized');
  db.updateOne('boards', { _id: board.boardId }, { $unset: { allowsWhiteboardOnCard: 1 } });
  expect(await ask()).toBe('ok');
  expect(db.findOne('cards', { _id: alpha._id }).drawings[0].strokes).toHaveLength(1);
});
