'use strict';
const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const { loginWithToken, openBoard } = require('../helpers/auth');

for (const theme of ['belize', 'pomegranate', 'dark', 'custom']) {
  test(`flow chart actions use shared primary button colors: ${theme}`, async ({ page, user, board }) => {
    db.updateOne('users', { _id: user.id }, { $set: {
      'profile.globalThemeColor': theme === 'custom' ? 'belize' : theme,
      'profile.globalThemeCustomColors': theme === 'custom' ? ['#663399'] : [],
    } });
    await loginWithToken(page, user.id, user.token);
    await openBoard(page, board.boardId, board.slug);
    for (const slug of ['monte-carlo', 'size-cycle-time']) {
      await page.locator('.js-toggle-board-view').first().click();
      await page.locator(`.pop-over .js-open-${slug}-view`).click();
      const button = page.locator('.chart-options button[type=submit]');
      await expect(button).toBeVisible();
      await expect(button).toHaveClass(/primary/);
      const expected = await button.evaluate(el => {
        const reference = document.createElement('button');
        reference.type = 'submit';
        reference.className = 'primary';
        reference.textContent = 'Theme reference';
        el.parentElement.appendChild(reference);
        const style = getComputedStyle(reference);
        const colors = { background: style.backgroundColor, color: style.color };
        reference.remove();
        return colors;
      });
      if (theme === 'custom') expect(expected.background).toBe('rgb(102, 51, 153)');
      if (theme === 'belize') expect(expected.background).toBe('rgb(33, 102, 148)');
      for (const state of ['normal', 'hover', 'focus']) {
        if (state === 'hover') await button.hover();
        if (state === 'focus') { await page.mouse.move(0, 0); await button.focus(); }
        await expect(button).toHaveCSS('color', expected.color);
        await expect(button).toHaveCSS('background-color', expected.background);
      }
      await expect(button).toHaveCSS('color', 'rgb(255, 255, 255)');
    }
  });
}
