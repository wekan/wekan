'use strict';
// The ? of a feature place (docs/Features/Help-Button.md,
// models/lib/featureHelp.js): a click opens the big "How it works" popup with
// "What is it?" and "How it works?" and their texts, Escape closes it and gives
// the focus back to the ?, and under a right-to-left language the ? is on the
// other side. tests/featureHelp.test.cjs pins the data and the markup.
const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const { loginWithToken, openBoard } = require('../helpers/auth');

const viewHelp = page => page.locator('.js-open-feature-help[data-feature-help="board-view-swimlanes"]');

async function boardIn(page, user, board, lang) {
  db.updateOne('users', { _id: user.id }, { $set: { 'profile.language': lang, 'profile.boardView': 'board-view-swimlanes' } });
  await loginWithToken(page, user.id, user.token);
  await openBoard(page, board.boardId, board.slug);
  await expect.poll(() => page.evaluate(() => document.documentElement.getAttribute('dir') || 'ltr'),
    { timeout: 15_000 }).toBe(lang === 'ar' ? 'rtl' : 'ltr');
}

test('the ? opens How it works with both headings, and Escape gives the focus back', async ({ page, user, board }) => {
  await boardIn(page, user, board, 'en');
  const btn = viewHelp(page);
  await expect(btn).toBeVisible({ timeout: 20_000 });
  await expect(btn).toHaveAttribute('title', 'How it works?');
  await expect(btn).toHaveAttribute('aria-label', 'How it works?');
  const box = await btn.boundingBox();
  expect(box.width).toBeGreaterThanOrEqual(24);
  expect(box.height).toBeGreaterThanOrEqual(24);

  // Negative: nothing is open before the click.
  await expect(page.locator('.pop-over[data-popup="featureHelpPopup"]')).toHaveCount(0);
  await btn.click();
  const pop = page.locator('.pop-over[data-popup="featureHelpPopup"]');
  await expect(pop).toBeVisible();
  await expect(pop.locator('.header-title')).toHaveText('How it works');
  const headings = pop.locator('h2.feature-help-heading');
  await expect(headings).toHaveText(['What is it?', 'How it works?']);
  const texts = pop.locator('p.feature-help-text');
  await expect(texts).toHaveCount(2);
  for (const text of await texts.allTextContents()) {
    expect(text.length).toBeGreaterThan(40);
    expect(text).not.toMatch(/http|www\.|\.md|help-board-view/);
  }
  // The text is text: no link inside the popup's content.
  await expect(pop.locator('.feature-help-content a')).toHaveCount(0);

  await page.keyboard.press('Escape');
  await expect(pop).toHaveCount(0);
  await expect(btn).toBeFocused();
});

test('a ? inside a popup opens its help on top, and Escape goes back to that popup', async ({ page, user, board }) => {
  await boardIn(page, user, board, 'en');
  const menuBtn = page.locator('.board-sidebar .js-open-board-menu');
  if (!(await menuBtn.isVisible().catch(() => false))) {
    await page.locator('.js-toggle-page-sidebar').first().click();
  }
  await menuBtn.click();
  const menu = page.locator('.pop-over[data-popup="boardMenuPopup"]');
  await expect(menu).toBeVisible();
  const help = menu.locator('.header .js-open-feature-help[data-feature-help="board-settings"]');
  await expect(help).toBeVisible();
  // Never on top of the close button.
  const [h, x] = [await help.boundingBox(), await menu.locator('.header .close-btn').boundingBox()];
  expect(h.x + h.width <= x.x || x.x + x.width <= h.x).toBe(true);
  await help.click();
  await expect(page.locator('.pop-over[data-popup="featureHelpPopup"] h2.feature-help-heading').first()).toHaveText('What is it?');
  await page.keyboard.press('Escape');
  await expect(menu).toBeVisible();
  await expect(menu.locator('.header .js-open-feature-help')).toBeFocused();
});

test('under Arabic the ? is mirrored to the other side of the Board View menu', async ({ page, user, board }) => {
  const sideOf = async () => {
    const btn = await viewHelp(page).boundingBox();
    const menu = await page.locator('.js-toggle-board-view').first().boundingBox();
    return btn.x > menu.x ? 'right' : 'left';
  };
  await boardIn(page, user, board, 'en');
  await expect(viewHelp(page)).toBeVisible({ timeout: 20_000 });
  expect(await sideOf()).toBe('right');

  await boardIn(page, user, board, 'ar');
  await expect(viewHelp(page)).toBeVisible({ timeout: 20_000 });
  expect(await sideOf()).toBe('left');
  await viewHelp(page).click();
  const pop = page.locator('.pop-over[data-popup="featureHelpPopup"]');
  // Translated, and not the English words.
  await expect(pop.locator('h2.feature-help-heading').first()).not.toHaveText('What is it?');
  await page.keyboard.press('Escape');
});
