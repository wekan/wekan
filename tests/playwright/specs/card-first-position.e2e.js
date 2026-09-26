'use strict';
const { test, expect } = require('../fixtures');
const BoardPage = require('../pages/BoardPage');
const CardPage = require('../pages/CardPage');

for (const rtl of [false, true]) {
  for (const fallback of [false, true]) {
    test(`${rtl ? 'RTL' : 'LTR'} card first paint uses ${fallback ? 'fallback' : 'preferred'} side`, async ({ boardPage: page, board }) => {
      await page.setViewportSize({ width: 1920, height: 1000 });
      // Fix the source rectangle so both-side-fit and preferred-side-full cases
      // are deterministic independently of the board's saved column widths.
      const minicard = new BoardPage(page).minicard(board.listIds[0], 'Alpha Card');
      await minicard.evaluate((el, { rtl, fallback }) => {
        document.documentElement.dir = rtl ? 'rtl' : 'ltr';
        const left = fallback ? (rtl ? 20 : 1640) : (rtl ? 650 : 1000);
        Object.assign(el.style, { position: 'fixed', left: `${left}px`, right: 'auto', top: '200px', width: '250px', zIndex: '2000' });
        window.cardOpeningSamples = [];
        const sample = () => {
          for (const panel of document.querySelectorAll('.board-wrapper > .js-card-details')) {
            if (getComputedStyle(panel).visibility !== 'hidden') {
              const rect = panel.getBoundingClientRect();
              window.cardOpeningSamples.push({ left: rect.left, width: rect.width });
            }
          }
          window.cardOpeningFrame = requestAnimationFrame(sample);
        };
        sample();
      }, { rtl, fallback });
      const anchor = await minicard.boundingBox();
      await minicard.click();
      const cp = new CardPage(page);
      await expect(cp.root).toBeVisible();
      await expect.poll(() => page.evaluate(() => window.cardOpeningSamples.length)).toBeGreaterThan(2);
      const samples = await page.evaluate(() => {
        cancelAnimationFrame(window.cardOpeningFrame);
        return window.cardOpeningSamples;
      });
      const leftSide = rtl !== fallback;
      for (const rect of samples) {
        const expected = leftSide ? anchor.x - 8 - rect.width : anchor.x + anchor.width + 8;
        expect(Math.abs(rect.left - expected)).toBeLessThanOrEqual(1);
      }
    });
  }
}
