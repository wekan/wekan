'use strict';

/**
 * Spec 02 — Card open & view modes
 *
 * Covers:
 *  - Clicking a card opens it in minimized (inline panel) view
 *  - Switching from minimized to maximized (full-screen) view
 *  - Opening a card in a new tab in full-screen view
 *  - Card title edits do not break the card
 *  - Minicard titles save inline, while blank titles remain unchanged
 */

const { test, expect } = require('../fixtures');
const BoardPage = require('../pages/BoardPage');
const CardPage = require('../pages/CardPage');

const BASE_URL = process.env.WEKAN_BASE_URL || 'http://localhost:3000';

test.describe('Cards – open & view modes', () => {
  test('#3576: mobile Search back returns directly to the board', async ({
    boardPage,
  }) => {
    await boardPage.setViewportSize({ width: 390, height: 844 });
    await boardPage.evaluate(() =>
      localStorage.setItem('wekan-mobile-mode', 'true'),
    );
    await boardPage.reload({ waitUntil: 'networkidle' });

    await boardPage.locator('.js-open-search-view').click();
    await expect(boardPage.locator('.board-sidebar')).toHaveClass(/is-open/);
    await expect(boardPage.locator('.js-search-term-form')).toBeVisible();
    await boardPage.locator('.board-sidebar .js-back-home').click();

    await expect(boardPage.locator('.board-sidebar')).not.toHaveClass(/is-open/);
    await expect(boardPage.locator('.board-canvas')).toBeVisible();
    await expect(boardPage.locator('.board-sidebar .js-search-term-form'))
      .not.toBeVisible();
  });

  test('clicking a minicard opens the card detail panel', async ({ boardPage, board }) => {
    const bp = new BoardPage(boardPage);
    const cp = new CardPage(boardPage);

    await bp.clickCard(board.listIds[0], 'Alpha Card');
    await cp.waitForOpen();
    const title = await cp.getTitle();
    expect(title).toContain('Alpha Card');
  });

  test('card opens without the maximized class by default (minimized view)', async ({ boardPage, board }) => {
    const bp = new BoardPage(boardPage);
    const cp = new CardPage(boardPage);

    await bp.clickCard(board.listIds[0], 'Alpha Card');
    await cp.waitForOpen();

    const maximizedEl = cp.isMaximized();
    await expect(maximizedEl).not.toBeVisible();
  });

  test('maximize button switches card to full-screen view', async ({ boardPage, board }) => {
    const bp = new BoardPage(boardPage);
    const cp = new CardPage(boardPage);

    await bp.clickCard(board.listIds[0], 'Alpha Card');
    await cp.waitForOpen();
    await cp.maximize();

    await expect(cp.isMaximized()).toBeVisible({ timeout: 5_000 });
  });

  test('minimize button collapses the maximized card back', async ({ boardPage, board }) => {
    const bp = new BoardPage(boardPage);
    const cp = new CardPage(boardPage);

    await bp.clickCard(board.listIds[0], 'Alpha Card');
    await cp.waitForOpen();
    await cp.maximize();
    await expect(cp.isMaximized()).toBeVisible({ timeout: 5_000 });

    await cp.minimize();
    await boardPage.waitForTimeout(600);
    await expect(cp.isMaximized()).not.toBeVisible();
  });

  test('copy-link button produces a URL that opens the card in full-screen view', async ({ boardPage, board, context }) => {
    const bp = new BoardPage(boardPage);
    const cp = new CardPage(boardPage);

    await bp.clickCard(board.listIds[0], 'Alpha Card');
    await cp.waitForOpen();

    // Copy the link from the card's actions MENU. It was an `<a href>` in the
    // card's title header, named only by a tooltip; it is a named row of the
    // hamburger menu now and copies with JavaScript, so there is no href to
    // read - what it puts in the clipboard is the absolute url.
    // docs/Features/Page/Board-Item-Links.md
    const copied = await cp.copyLink();
    expect(copied).toBeTruthy();
    expect(copied).toMatch(/\/b\/[^/]+\/[^/]+\/[^/]+$/);
    const href = new URL(copied).pathname;

    // Open the card URL in a new tab (simulates Ctrl+Click).
    // New pages share browser cookies but not Meteor's localStorage session,
    // so we authenticate before navigating - with a resume token of its OWN.
    // The seeded user has one token and the first page is already using it;
    // two real browsers would each have their own, and sharing one means
    // anything that ends one session ends the other's too.
    const { loginWithToken: login, waitForMeteor } = require('../helpers/auth');
    const db = require('../helpers/db');
    const newPage = await context.newPage();
    await login(newPage, board.owner.id, db.addResumeToken(board.owner.id));
    // 'commit' + waitForMeteor rather than 'networkidle': the card is rendered
    // by the client after its subscriptions land, which is not a network event
    // the browser can be idle about.
    await newPage.goto(`${BASE_URL}${href}`, { waitUntil: 'commit' });
    await waitForMeteor(newPage);
    const newCp = new CardPage(newPage);
    await newCp.waitForOpen();
    await expect(newCp.root).toBeVisible({ timeout: 10_000 });
    await newPage.close();
  });

  test('editing the card title does not break the card', async ({ boardPage, board }) => {
    const bp = new BoardPage(boardPage);
    const cp = new CardPage(boardPage);

    await bp.clickCard(board.listIds[0], 'Alpha Card');
    await cp.waitForOpen();

    const newTitle = 'Alpha Card – Renamed';
    await cp.editTitle(newTitle);

    // Card panel should still be visible
    await cp.waitForOpen();
    const title = await cp.getTitle();
    expect(title).toContain('Renamed');
  });

  test('editing a minicard title inline saves that card (#6604)', async ({ boardPage, board }) => {
    const bp = new BoardPage(boardPage);
    const [listA] = board.listIds;
    const card = bp.minicard(listA, 'Alpha Card');
    const cardId = await card.getAttribute('data-card-id');

    await card.locator('.minicard-title-text').click();
    const editingCard = bp.list(listA).locator(`.js-minicard[data-card-id="${cardId}"]`);
    const editor = editingCard.locator('textarea.js-edit-minicard-title');
    await expect(editor).toBeVisible({ timeout: 5_000 });
    await editor.fill('Alpha Card - Inline renamed');
    await editingCard.locator('button.js-submit-edit-minicard-title').click();

    await expect(bp.minicard(listA, 'Alpha Card - Inline renamed')).toBeVisible({
      timeout: 8_000,
    });
    await expect(boardPage.locator('.js-card-details')).not.toBeVisible();
  });

  test('#6639: a markdown link in a minicard title opens instead of editing', async ({
    boardPage,
    board,
  }) => {
    const bp = new BoardPage(boardPage);
    const [listA] = board.listIds;
    const card = bp.minicard(listA, 'Alpha Card');
    await card.locator('.minicard-title-text').click();
    const editor = card.locator('textarea.js-edit-minicard-title');
    await expect(editor).toBeVisible({ timeout: 5_000 });
    await editor.fill('[Wekan](https://example.invalid/card-title-link)');
    await card.locator('button.js-submit-edit-minicard-title').click();

    const linkedCard = bp.list(listA).locator('.js-minicard', { hasText: 'Wekan' });
    const link = linkedCard.locator('.minicard-title-text .viewer a');
    await expect(link).toBeVisible({ timeout: 8_000 });
    await boardPage.evaluate(() => {
      window.__wekanTitleLinkOpened = null;
      window.open = href => { window.__wekanTitleLinkOpened = href; return null; };
    });
    await link.click();

    await expect(linkedCard.locator('textarea.js-edit-minicard-title')).not.toBeVisible();
    expect(await boardPage.evaluate(() => window.__wekanTitleLinkOpened))
      .toContain('https://example.invalid/card-title-link');
  });

  test('a blank inline minicard title is rejected (negative)', async ({ boardPage, board }) => {
    const bp = new BoardPage(boardPage);
    const [listA] = board.listIds;
    const card = bp.minicard(listA, 'Alpha Card');
    const cardId = await card.getAttribute('data-card-id');

    await card.locator('.minicard-title-text').click();
    const editingCard = bp.list(listA).locator(`.js-minicard[data-card-id="${cardId}"]`);
    const editor = editingCard.locator('textarea.js-edit-minicard-title');
    await expect(editor).toBeVisible({ timeout: 5_000 });
    await editor.fill('   ');
    await editingCard.locator('button.js-submit-edit-minicard-title').click();

    await expect(bp.minicard(listA, 'Alpha Card')).toBeVisible({ timeout: 5_000 });
    await expect(boardPage.locator('.js-card-details')).not.toBeVisible();
  });

  test('closing the card detail panel hides it', async ({ boardPage, board }) => {
    const bp = new BoardPage(boardPage);
    const cp = new CardPage(boardPage);

    await bp.clickCard(board.listIds[0], 'Alpha Card');
    await cp.waitForOpen();
    await cp.close();

    await expect(cp.root).not.toBeVisible({ timeout: 5_000 });
    // Board lists should still be intact
    expect(await bp.allLists().count()).toBeGreaterThanOrEqual(1);
  });
});
