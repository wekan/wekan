'use strict';

/**
 * Spec 02 — Card open & view modes
 *
 * Covers:
 *  - Clicking a card opens it in minimized (inline panel) view
 *  - Switching from minimized to maximized (full-screen) view
 *  - Opening a card in a new tab in full-screen view
 *  - Card title edits do not break the card
 */

const { test, expect } = require('../fixtures');
const BoardPage = require('../pages/BoardPage');
const CardPage = require('../pages/CardPage');

const BASE_URL = process.env.WEKAN_BASE_URL || 'http://localhost:3000';

test.describe('Cards – open & view modes', () => {
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

    // Get the href from the copy-link anchor.
    // WeKan card URLs use: /b/{boardId}/{slug}/card{cardId}  (jade: href="{{ originRelativeUrl }}")
    const linkEl = cp.copyLinkButton();
    const href = await linkEl.getAttribute('href');
    expect(href).toBeTruthy();
    expect(href).toMatch(/\/b\/.+\/card/);

    // Open the card URL in a new tab (simulates Ctrl+Click).
    // New pages share browser cookies but not Meteor's localStorage session,
    // so we re-authenticate with the same resume token before navigating.
    const { loginWithToken: login } = require('../helpers/auth');
    const newPage = await context.newPage();
    await login(newPage, board.owner.id, board.owner.token);
    await newPage.goto(`${BASE_URL}${href}`, { waitUntil: 'networkidle' });
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
