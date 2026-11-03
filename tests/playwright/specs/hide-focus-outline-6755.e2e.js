'use strict';

// #6755: the blue focus ring is on by default, and Member Settings / Change Settings
// has a per-member switch that hides it for that member only.
const { test, expect } = require('../fixtures');
const db = require('../helpers/db');

// The outline of the first minicard link after the keyboard moved focus to it.
async function ringOf(page) {
  await page.evaluate(() => document.activeElement && document.activeElement.blur());
  await page.keyboard.press('Tab');
  return page.evaluate(() => {
    const style = getComputedStyle(document.activeElement);
    return { outlineStyle: style.outlineStyle, outlineWidth: style.outlineWidth, shadow: style.boxShadow, tag: document.activeElement.tagName };
  });
}

test('#6755: the focus ring shows until the member hides it in Change Settings, and only for them', async ({ boardPage: page, user }) => {
  db.updateOne('users', { _id: user.id }, { $unset: { 'profile.hideFocusOutline': '' } });
  await expect.poll(() => page.evaluate(() => Meteor.user()?.profile?.hideFocusOutline === undefined)).toBe(true);
  await expect(page.locator('body')).not.toHaveClass(/has-hide-focus-outline/);
  const shown = await ringOf(page);
  expect(shown.outlineStyle, 'a focused control has the ring by default').toBe('solid');
  expect(shown.shadow).not.toBe('none');

  await page.locator('.js-open-header-member-menu').first().click();
  await page.locator('.js-change-settings').click();
  await expect(page.locator('.js-toggle-hide-focus-outline .fa-check'), 'checked while the ring is shown').toBeVisible();
  await page.locator('.js-toggle-hide-focus-outline').click();
  await expect.poll(() => db.findOne('users', { _id: user.id }).profile.hideFocusOutline).toBe(true);
  await expect(page.locator('.js-toggle-hide-focus-outline .fa-check')).toHaveCount(0);
  await page.locator('.pop-over .js-close-pop-over').first().click();
  await expect(page.locator('body')).toHaveClass(/has-hide-focus-outline/);
  const hidden = await ringOf(page);
  expect(hidden.outlineStyle, 'hidden: no outline').toBe('none');
  expect(hidden.shadow, 'hidden: no halo').toBe('none');

  // And back: the ring returns.
  await page.locator('.js-open-header-member-menu').first().click();
  await page.locator('.js-change-settings').click();
  await page.locator('.js-toggle-hide-focus-outline').click();
  await expect.poll(() => db.findOne('users', { _id: user.id }).profile.hideFocusOutline).toBe(false);
  await page.locator('.pop-over .js-close-pop-over').first().click();
  await expect(page.locator('body')).not.toHaveClass(/has-hide-focus-outline/);
  expect((await ringOf(page)).outlineStyle).toBe('solid');
});

test('#6755 negative: one member hiding the ring does not hide it for another', async ({ browser, user, user2, board }) => {
  db.updateOne('users', { _id: user.id }, { $set: { 'profile.hideFocusOutline': true } });
  db.addBoardMember({ boardId: board.boardId, userId: user2.id, isAdmin: false });
  const { loginWithToken, openBoard } = require('../helpers/auth');
  const context = await browser.newContext();
  const page = await context.newPage();
  await loginWithToken(page, user2.id, user2.token);
  await openBoard(page, board.boardId, board.slug);
  await expect(page.locator('body')).not.toHaveClass(/has-hide-focus-outline/);
  expect((await ringOf(page)).outlineStyle).toBe('solid');
  await context.close();
});
