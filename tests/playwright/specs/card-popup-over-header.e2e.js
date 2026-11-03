'use strict';

// An opened card covers the header bars in every browser. A card opened as a POPUP
// (Session popupCardId: a search result, a table row, a Roadmap/Gantt bar) used to
// open at top: 97px - BELOW the header - and, collapsed, was a bar floating over the
// swimlane. It now docks at the top like every other opened card. Desktop mode is
// forced, as the mobile/desktop toggle does.
const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const BoardPage = require('../pages/BoardPage');

// Where the card is, where the header is, and what is topmost where they overlap.
async function stacking(page) {
  return page.evaluate(() => {
    const card = document.querySelector('.card-details');
    const header = document.querySelector('#header-quick-access');
    const c = card.getBoundingClientRect();
    const h = header.getBoundingClientRect();
    const y = Math.round((Math.max(c.top, h.top) + Math.min(c.bottom, h.bottom)) / 2);
    const x = Math.round(c.left + Math.min(40, c.width / 2));
    const overlaps = Math.min(c.bottom, h.bottom) > Math.max(c.top, h.top) + 4;
    const top = overlaps ? document.elementFromPoint(x, y) : null;
    return {
      cardTop: Math.round(c.top), headerBottom: Math.round(h.bottom), overlaps,
      cardIsTopmost: !!top && card.contains(top), popup: card.classList.contains('card-details-popup'),
      z: getComputedStyle(card).zIndex,
    };
  });
}

test('a card opened as a popup covers the header, expanded and collapsed', async ({ boardPage: page, board }) => {
  await page.evaluate(() => localStorage.setItem('wekan-mobile-mode', 'false'));
  await page.reload();
  const bp = new BoardPage(page);
  await bp.clickCard(board.listIds[0], 'Alpha Card');
  const card = db.findOne('cards', { boardId: board.boardId, title: 'Alpha Card' });
  await page.evaluate(id => Session.set('popupCardId', id), card._id);
  await expect(page.locator('.card-details.card-details-popup')).toBeVisible();
  await expect(page.locator('body')).toHaveClass(/desktop-mode/);

  const open = await stacking(page);
  expect(open.popup).toBe(true);
  expect(open.cardTop, 'docked at the top, not at 97px below the header').toBeLessThan(open.headerBottom);
  expect(open.cardTop).toBeLessThanOrEqual(16);
  expect(open.overlaps, 'it overlaps the header').toBe(true);
  expect(open.cardIsTopmost, 'and is drawn over it').toBe(true);
  expect(Number(open.z)).toBeGreaterThan(1000);

  // Collapsed: only the title bar is left, and it too is over the header, not below it.
  await page.locator('.card-details .card-collapse-toggle').first().click();
  await expect(page.locator('.card-details.card-details-collapsed')).toBeVisible();
  const collapsed = await stacking(page);
  expect(collapsed.cardTop).toBeLessThanOrEqual(16);
  expect(collapsed.overlaps).toBe(true);
  expect(collapsed.cardIsTopmost).toBe(true);
});
