'use strict';
const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const { loginWithToken, openBoard } = require('../helpers/auth');
for (const theme of ['belize', 'nephritis', 'dark', 'cleanlight']) {
  test(`Board Settings action buttons follow ${theme} foreground and background`, async ({ page, user, board }) => {
    db.updateOne('users', { _id: user.id }, { $set: { 'profile.globalThemeColor': theme } });
    await loginWithToken(page, user.id, user.token);
    await openBoard(page, board.boardId, board.slug);
    await expect(page.locator(`#js-list-${board.listIds[0]}`)).toBeVisible();
    for (const section of ['Swimlane', 'List', 'Card']) {
      await page.evaluate(section => {
        Popup.close();
        Popup.open(`board${section}Settings`)({ currentTarget: document.body, target: document.body, preventDefault() {}, stopPropagation() {} });
      }, section);
      const button = page.locator('.board-settings-column-actions button').first();
      await expect(button).toBeVisible();
      const foreground = theme === 'cleanlight' ? 'rgb(26, 26, 26)' : 'rgb(255, 255, 255)';
      const backgrounds = { belize: 'rgb(41, 128, 185)', nephritis: 'rgb(39, 174, 96)', dark: 'rgb(44, 62, 81)', cleanlight: 'rgb(190, 190, 190)' };
      for (const state of ['normal', 'hover', 'focus', 'active']) {
        if (state === 'hover') await button.hover();
        if (state === 'focus') { await page.mouse.move(0, 0); await button.focus(); }
        if (state === 'active') { await button.hover(); await page.mouse.down(); }
        await expect(button).toHaveCSS('color', foreground);
        await expect(button).toHaveCSS('background-color', backgrounds[theme]);
        if (state === 'active') await page.mouse.up();
      }
      // Ordinary form text must retain its neutral foreground.
      const inputColor = await button.evaluate(el => {
        const input = document.createElement('textarea');
        el.parentElement.appendChild(input);
        const color = getComputedStyle(input).color;
        input.remove();
        return color;
      });
      expect(inputColor).not.toBe('rgb(255, 255, 255)');
    }
  });
}
