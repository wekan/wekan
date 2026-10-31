'use strict';
// #6835: Member Settings / Change Settings reads as a list of settings: each
// row an icon on the first line of its words, the check mark at the end, a
// wrapped line an ordinary line high, and a rule between rows.
const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const { loginWithToken, openBoard } = require('../helpers/auth');

for (const language of ['fa', 'en']) {
  test(`Change Settings: aligned icons, compact wrapped lines, divided rows (${language})`, async ({ page, user, board }) => {
    db.updateOne('users', { _id: user.id }, { $set: { 'profile.language': language, 'profile.showDesktopDragHandles': true } });
    await loginWithToken(page, user.id, user.token);
    await openBoard(page, board.boardId, board.slug);
    await page.locator('.js-open-header-member-menu').first().click();
    await page.locator('.js-change-settings').first().click();
    const pop = page.locator('.pop-over[data-popup="changeSettingsPopup"]');
    await expect(pop).toBeVisible();
    if (process.env.WEKAN_SHOT_6835) await pop.screenshot({ path: process.env.WEKAN_SHOT_6835.replace('LANG', language) });
    const rows = pop.locator('.change-settings-list > li > a');
    const n = await rows.count();
    expect(n).toBeGreaterThan(5);
    for (let i = 0; i < n; i++) {
      const m = await rows.nth(i).evaluate(a => {
        const icon = a.querySelector('i.fa:first-child').getBoundingClientRect();
        const range = document.createRange();
        const text = [...a.childNodes].find(node => node.nodeType === 3 && node.textContent.trim());
        range.selectNodeContents(text);
        const lines = [...range.getClientRects()];
        const style = getComputedStyle(a);
        return {
          iconTop: icon.top, firstLineTop: lines[0].top, firstLineBottom: lines[0].bottom,
          lineCount: new Set(lines.map(r => Math.round(r.top))).size,
          height: a.getBoundingClientRect().height, lineHeight: parseFloat(style.lineHeight),
          divider: getComputedStyle(a.parentElement).borderTopStyle,
        };
      });
      // The icon is on the first line of the words, not centred on the row.
      expect(m.iconTop).toBeGreaterThanOrEqual(m.firstLineTop - 4);
      expect(m.iconTop).toBeLessThan(m.firstLineBottom);
      // A wrapped line is an ordinary line high, not 33px.
      expect(m.lineHeight).toBeLessThan(28);
      expect(m.height).toBeLessThan(m.lineCount * m.lineHeight + 24);
      if (i > 0) expect(m.divider, `row ${i}`).toBe('solid');
    }
    // Negative: the member menu kept beside it in the same popup is untouched.
    const menuRow = pop.locator('.pop-over-list:not(.change-settings-list) > li > a.js-change-settings');
    if (await menuRow.count()) {
      expect(await menuRow.evaluate(a => getComputedStyle(a).lineHeight)).not.toBe('normal');
      expect(await menuRow.evaluate(a => getComputedStyle(a.parentElement).borderTopStyle)).toBe('none');
    }
  });
}
