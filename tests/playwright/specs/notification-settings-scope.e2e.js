'use strict';
const { test, expect } = require('../fixtures');
const db = require('../helpers/db');

test('#6658 notification options persist in the member and board scopes', async ({ boardPage: page, user, board }) => {
  for (const scope of ['member', 'board']) {
    await page.evaluate(scope => {
      Popup.close();
      const opener = document.body;
      Popup.open('notificationSettings', { dataContext: { scope } })({
        currentTarget: opener, target: opener, preventDefault() {},
      });
    }, scope);
    const popup = page.locator('.notification-settings-popup');
    const option = popup.locator('[data-service="email"][data-value="false"]');
    await option.click();
    await expect(option.locator('.materialCheckBox')).toHaveClass(/is-checked/);
    const readValue = () => scope === 'member'
      ? db.findOne('users', { _id: user.id }).profile.notifyOverrideEmail
      : db.findOne('boards', { _id: board.boardId }).notifyOverrideEmail;
    await expect.poll(readValue).toBe(false);
    await popup.locator('[data-service="email"][data-value=""]').click();
    await expect.poll(readValue).toBeUndefined();
  }
});
