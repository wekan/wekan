'use strict';

/**
 * #6750 - the `d` keyboard shortcut opens the Due date editor of the opened
 * card, but only when the user has keyboard shortcuts enabled and is not
 * typing in a field. The help list (?) names it.
 */

const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const { loginWithToken, openBoard } = require('../helpers/auth');
const BoardPage = require('../pages/BoardPage');
const CardPage = require('../pages/CardPage');

const dueDatePopup = page => page.locator('.js-pop-over').filter({
  has: page.locator('.selected-calendar-picker, .js-calendar-day'),
});

async function openAlphaCard(page, user, board, shortcutsOn) {
  // Seeded users have keyboard shortcuts switched off in their profile.
  db.updateOne('users', { _id: user.id }, { $set: { 'profile.keyboardShortcuts': shortcutsOn } });
  await loginWithToken(page, user.id, user.token);
  await openBoard(page, board.boardId, board.slug);
  const bp = new BoardPage(page);
  const cp = new CardPage(page);
  await bp.clickCard(board.listIds[0], 'Alpha Card');
  await cp.waitForOpen();
  await expect(cp.root.locator('.card-details-item-due')).toBeVisible();
  // Leave no link or button focused: shortcuts deliberately skip those.
  await page.evaluate(() => document.activeElement && document.activeElement.blur());
  return cp;
}

test.describe('#6750 due date keyboard shortcut', () => {
  test('d opens the Due date editor of the opened card and is listed in the help', async ({ page, user, board }) => {
    const cp = await openAlphaCard(page, user, board, true);
    await page.keyboard.press('d');
    const pop = dueDatePopup(page);
    await expect(pop).toBeVisible({ timeout: 8_000 });
    await expect(pop.locator('.js-calendar-day').first()).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(pop).toBeHidden();

    // The same shortcut on a card that already has a due date opens its editor.
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    await cp.setDueDate(today);
    await expect(cp.root.locator('.card-details-item-due a.js-edit-date')).toBeVisible();
    await page.evaluate(() => document.activeElement && document.activeElement.blur());
    await page.keyboard.press('Shift+D');
    await expect(dueDatePopup(page)).toBeVisible({ timeout: 8_000 });
    await page.keyboard.press('Escape');

    await page.goto('/shortcuts');
    await expect(page.locator('.shortcuts-list-item').filter({ has: page.locator('kbd', { hasText: /^d$/ }) }))
      .toContainText('due date');
  });

  test('negative: nothing opens when keyboard shortcuts are disabled', async ({ page, user, board }) => {
    await openAlphaCard(page, user, board, false);
    await page.keyboard.press('d');
    await page.waitForTimeout(800);
    await expect(dueDatePopup(page)).toHaveCount(0);
  });

  test('negative: typing d in the card title or a comment does not open it', async ({ page, user, board }) => {
    const cp = await openAlphaCard(page, user, board, true);
    await cp.root.locator('.js-card-title .js-open-inlined-form, .card-details-title-edit-zone').first().click();
    const title = cp.root.locator('.js-card-details-title textarea, .js-card-details-title input').first();
    await title.focus();
    // WebKit puts the caret at the start of the field on focus, Chromium at
    // the end; type at the end in both.
    await title.evaluate(el => el.setSelectionRange(el.value.length, el.value.length));
    await page.keyboard.type('dd');
    await page.waitForTimeout(500);
    await expect(dueDatePopup(page)).toHaveCount(0);
    await expect(title).toHaveValue(/dd$/);
    await page.keyboard.press('Escape');

    const comment = cp.root.locator('form.js-new-comment-form textarea').first();
    if (await comment.count()) {
      await comment.click();
      await page.keyboard.type('d');
      await page.waitForTimeout(500);
      await expect(dueDatePopup(page)).toHaveCount(0);
    }
  });

  // #6755: "d" did nothing until the card was opened. On a hovered minicard it
  // opens that card and its Due date editor.
  test('d on a hovered minicard opens the card and its Due date editor (#6755)', async ({ page, user, board }) => {
    // #6755: a user whose profile has no keyboardShortcuts value has them ON.
    db.updateOne('users', { _id: user.id }, { $unset: { 'profile.keyboardShortcuts': '' } });
    const card = db.findOne('cards', { boardId: board.boardId, title: 'Alpha Card' });
    await loginWithToken(page, user.id, user.token);
    await openBoard(page, board.boardId, board.slug);
    await page.locator('.js-minicard', { hasText: 'Alpha Card' }).first().hover();
    await page.evaluate(() => document.activeElement && document.activeElement.blur());
    await page.keyboard.press('d');
    await expect(page).toHaveURL(new RegExp(`/${card._id}$`));
    await expect(dueDatePopup(page)).toBeVisible({ timeout: 8_000 });
    await page.keyboard.press('Escape');
  });

  // #6840: on a slow server the card's details render a few hundred
  // milliseconds after the route names it. `d` pressed right after opening
  // another card found no control yet and did nothing - or flashed a popup
  // shut. It waits for that card's control now, and the popup stays open.
  // #6840: on a slow server the card's details render a few hundred
  // milliseconds after the click that opens it. `d` pressed right away found
  // no control yet and did nothing - or flashed a popup shut. It waits for
  // that card's control now, and the popup stays open.
  test('d right after clicking a card open, on a slow connection, opens and keeps its Due date editor (#6840)', async ({ page, user, board, browserName }) => {
    // The slow connection is emulated through the Chrome DevTools Protocol.
    test.skip(browserName !== 'chromium', 'network emulation needs Chromium');
    db.updateOne('users', { _id: user.id }, { $unset: { 'profile.keyboardShortcuts': '' } });
    await loginWithToken(page, user.id, user.token);
    await openBoard(page, board.boardId, board.slug);
    await expect(page.locator('.js-minicard', { hasText: 'Gamma Card' })).toBeVisible();
    const cdp = await page.context().newCDPSession(page);
    await cdp.send('Network.enable');
    await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 300, downloadThroughput: 500000, uploadThroughput: 500000 });
    for (const title of ['Alpha Card', 'Beta Card', 'Gamma Card']) {
      // A real click, and `d` at once - as a person does.
      await page.locator('.js-minicard', { hasText: title }).first().click();
      await page.evaluate(() => document.activeElement && document.activeElement.blur());
      await page.keyboard.press('d');
      await expect(page.locator(`section.js-card-details[aria-label$=": ${title}"]`)).toBeVisible({ timeout: 15_000 });
      await expect(dueDatePopup(page)).toBeVisible({ timeout: 8_000 });
      // Still open a moment later: not a flash.
      await page.waitForTimeout(1500);
      await expect(dueDatePopup(page)).toBeVisible();
      // Negative (#6686): closing the card still closes a popup opened for it.
      await page.locator('.js-card-details .js-close-card-details').first().evaluate(el => el.click());
      await expect(dueDatePopup(page)).toHaveCount(0, { timeout: 8_000 });
      await expect(page.locator('section.js-card-details')).toHaveCount(0, { timeout: 8_000 });
    }
  });

  // #6755 comment 6559698117: after a popup opened from a minicard was closed,
  // shortcuts did nothing until a reload. The minicard is a link, so the click
  // on its menu left that link focused, and the shortcut filter refused every
  // key while a link or button had the focus. No blur here - that is the point.
  test('d still works after a minicard popup is opened and closed, with its link focused (#6755)', async ({ page, user, board }) => {
    db.updateOne('users', { _id: user.id }, { $unset: { 'profile.keyboardShortcuts': '' } });
    const card = db.findOne('cards', { boardId: board.boardId, title: 'Alpha Card' });
    await loginWithToken(page, user.id, user.token);
    await openBoard(page, board.boardId, board.slug);
    const minicard = page.locator('.js-minicard', { hasText: 'Alpha Card' }).first();
    await minicard.hover();
    await minicard.locator('.js-open-minicard-details-menu').click();
    const menu = page.locator('.js-pop-over');
    await expect(menu).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(menu).toHaveCount(0);
    // The reported state: the minicard's own link keeps the focus (the blue
    // outline in the report). Where the browser already left it there this
    // changes nothing; where it did not, this is the same state made directly.
    await minicard.focus();
    expect(await page.evaluate(() => document.activeElement?.matches('a.js-minicard[href]')),
      'the minicard link has the focus').toBe(true);
    await minicard.hover();
    await page.keyboard.press('d');
    await expect(page).toHaveURL(new RegExp(`/${card._id}$`));
    await expect(dueDatePopup(page)).toBeVisible({ timeout: 8_000 });
    await page.keyboard.press('Escape');
  });

  // Negative (A01): Space on a focused BUTTON still activates the button and is
  // not taken by the board's Space shortcut, which toggles the hovered card's
  // member - the reason focused controls are guarded at all.
  test('negative: Space on a focused button activates the button, not the Space shortcut (#6755)', async ({ page, user, board }) => {
    db.updateOne('users', { _id: user.id }, { $unset: { 'profile.keyboardShortcuts': '' } });
    await loginWithToken(page, user.id, user.token);
    await openBoard(page, board.boardId, board.slug);
    const membersBefore = db.findOne('cards', { boardId: board.boardId, title: 'Alpha Card' }).members || [];
    const clicked = await page.evaluate(() => {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = 'probe';
      button.addEventListener('click', () => { window.__probeClicks = (window.__probeClicks || 0) + 1; });
      document.body.appendChild(button);
      button.focus();
      return document.activeElement === button;
    });
    expect(clicked).toBe(true);
    await page.locator('.js-minicard', { hasText: 'Alpha Card' }).first().hover();
    await page.evaluate(() => document.querySelector('body > button:last-of-type').focus());
    await page.keyboard.press('Space');
    await expect.poll(() => page.evaluate(() => window.__probeClicks || 0)).toBe(1);
    await page.waitForTimeout(800);
    expect(db.findOne('cards', { boardId: board.boardId, title: 'Alpha Card' }).members || []).toEqual(membersBefore);
  });

  test('negative: d over a minicard does nothing when shortcuts are disabled (#6755)', async ({ page, user, board }) => {
    db.updateOne('users', { _id: user.id }, { $set: { 'profile.keyboardShortcuts': false } });
    await loginWithToken(page, user.id, user.token);
    await openBoard(page, board.boardId, board.slug);
    const url = page.url();
    await page.locator('.js-minicard', { hasText: 'Alpha Card' }).first().hover();
    await page.evaluate(() => document.activeElement && document.activeElement.blur());
    await page.keyboard.press('d');
    await page.waitForTimeout(800);
    expect(page.url()).toBe(url);
    await expect(dueDatePopup(page)).toHaveCount(0);
  });
});
