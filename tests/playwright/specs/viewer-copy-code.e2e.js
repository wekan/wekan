'use strict';
// #6753: the copy button of a code block in a card description copies the
// block and stays on the page. It is an <a href="#"> inside the viewer, and the
// viewer's link handler opened that href - the board again - in a new tab.
const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const { openBoard } = require('../helpers/auth');

test('copying a code block opens no tab and copies its text (#6753)', async ({ boardPage: page, board, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']).catch(() => {});
  const card = db.findOne('cards', { boardId: board.boardId });
  db.updateOne('cards', { _id: card._id }, { $set: { description: [
    'Commands', '', '```', 'sudo snap refresh wekan', '```', '', '[jump](#nowhere)',
  ].join('\n') } });
  await openBoard(page, board.boardId, board.slug);
  await page.locator('.minicard', { hasText: card.title }).first().locator('.minicard-title').click();
  const viewer = page.locator('.card-details .viewer', { hasText: 'Commands' }).first();
  const copy = viewer.locator('a.js-copy-code');
  await expect(copy).toHaveCount(1);

  const pagesBefore = context.pages().length;
  const url = page.url();
  await copy.click();
  // Negative: no new tab, no navigation, and the description did not open
  // for editing.
  await page.waitForTimeout(500);
  expect(context.pages().length).toBe(pagesBefore);
  expect(page.url()).toBe(url);
  await expect(page.locator('.card-details form.inlined-form')).toHaveCount(0);
  const copied = await page.evaluate(() => navigator.clipboard.readText().catch(() => null));
  if (copied !== null) expect(copied.trim()).toBe('sudo snap refresh wekan');

  // A link to a place on the page does not open a tab either (when the
  // sanitizer keeps it as a link at all).
  const jump = viewer.locator('a[href^="#"]', { hasText: 'jump' });
  if (await jump.count()) {
    await jump.click();
    await page.waitForTimeout(500);
    expect(context.pages().length).toBe(pagesBefore);
  }
});
