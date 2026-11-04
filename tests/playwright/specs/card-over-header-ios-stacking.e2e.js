'use strict';

// iPad Safari and Chrome (both WebKit) make every SCROLLING element - #content, the
// board wrapper - a stacking context of its own. The opened card is inside them, so its
// z-index (2001) is compared only there, and the header (#header-quick-access, z-index
// 1000, a flex item of body and so a stacking context too) is painted over the card: its top row - the collapse caret, the card
// number, the menu, maximize and X - sat behind the header bar (boards.wekan.team,
// iPad Chrome, 2026-11-04). Other browsers do not do it. The trap is simulated here with
// isolation: isolate, which makes the same stacking context, so Chromium and WebKit
// show what the iPad does. Desktop mode, forced as the toggle does.
const { test, expect } = require('../fixtures');
const BoardPage = require('../pages/BoardPage');

async function overHeader(page) {
  return page.evaluate(() => {
    const card = document.querySelector('.card-details');
    const header = document.querySelector('#header-quick-access');
    const c = card.getBoundingClientRect();
    const h = header.getBoundingClientRect();
    const top = Math.max(c.top, h.top);
    const bottom = Math.min(c.bottom, h.bottom);
    if (bottom - top < 8) return { overlaps: false };
    // The card's own header row: the caret, the number, the menu and X are drawn there.
    const y = Math.round(top + 6);
    const x = Math.round(c.left + Math.min(40, c.width / 2));
    const hit = document.elementFromPoint(x, y);
    const closeBtn = card.querySelector('.js-close-card-details').getBoundingClientRect();
    const closeHit = document.elementFromPoint(Math.round(closeBtn.left + closeBtn.width / 2), Math.round(Math.max(closeBtn.top, h.top) + 4));
    return {
      overlaps: true,
      cardIsTopmost: !!hit && card.contains(hit),
      closeButtonIsTopmost: !!closeHit && card.contains(closeHit),
      cardTop: Math.round(c.top), headerBottom: Math.round(h.bottom),
    };
  });
}

for (const trap of ['#content', '.board-wrapper', '#content, .board-wrapper']) {
  test(`the opened card covers the header when ${trap} is a stacking context (iOS WebKit), open and collapsed`, async ({ boardPage: page, board }) => {
    await page.evaluate(() => localStorage.setItem('wekan-mobile-mode', 'false'));
    await page.reload();
    await new BoardPage(page).clickCard(board.listIds[0], 'Alpha Card');
    await expect(page.locator('.card-details')).toBeVisible();
    await expect(page.locator('body')).toHaveClass(/desktop-mode/);
    await page.addStyleTag({ content: `${trap} { isolation: isolate; }` });

    const open = await overHeader(page);
    expect(open.overlaps, 'the docked card overlaps the header').toBe(true);
    expect(open.cardIsTopmost, `the card is drawn over the header (card top ${open.cardTop}, header bottom ${open.headerBottom})`).toBe(true);
    expect(open.closeButtonIsTopmost, 'and its close button can be reached').toBe(true);

    await page.locator('.card-details .card-collapse-toggle').first().click();
    await expect(page.locator('.card-details.card-details-collapsed')).toBeVisible();
    const collapsed = await overHeader(page);
    expect(collapsed.overlaps).toBe(true);
    expect(collapsed.cardIsTopmost, 'collapsed too').toBe(true);
  });
}

test('with no card open the header is where it was (negative)', async ({ boardPage: page }) => {
  await expect(page.locator('.card-details')).toHaveCount(0);
  const z = await page.evaluate(() => getComputedStyle(document.querySelector('#header-quick-access')).zIndex);
  expect(z, 'the header keeps its own level while no card is open').toBe('1000');
});
