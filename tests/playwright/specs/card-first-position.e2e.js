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
      // A subscription can replace the board DOM just after it loads; then the
      // click reaches a detached minicard and nothing opens - and the NEW
      // minicard does not have the fixed rectangle either. So place and click
      // it again, measuring its anchor afresh, until the card really opens.
      const cp = new CardPage(page);
      let anchor;
      for (let attempt = 0; ; attempt++) {
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
        anchor = await minicard.boundingBox();
        await minicard.click();
        try {
          await cp.root.waitFor({ state: 'visible', timeout: 5_000 });
          break;
        } catch (error) {
          if (attempt === 2) throw error;
          await page.evaluate(() => cancelAnimationFrame(window.cardOpeningFrame));
        }
      }
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
