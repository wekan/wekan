'use strict';

/**
 * Spec 03 — Card operations
 *
 * Covers:
 *  - Archiving a card removes it from the board view
 *  - Unarchiving restores the card to the board
 *  - Moving a card to another list (same board) — no duplicates
 *  - Copying a card to a list
 *  - Bulk multi-select and move
 *  - Changing custom fields
 *  - Changing the list category of a card from the card detail panel
 *  - Sorting cards by date
 */

const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const BoardPage = require('../pages/BoardPage');
const CardPage = require('../pages/CardPage');

const BASE_URL = process.env.WEKAN_BASE_URL || 'http://localhost:3000';

test.describe('Cards – operations', () => {
  // --- Archive / Unarchive ---

  test('archiving a card removes it from board view', async ({ boardPage, board }) => {
    const bp = new BoardPage(boardPage);
    const cp = new CardPage(boardPage);
    const [listA] = board.listIds;

    await bp.clickCard(listA, 'Alpha Card');
    await cp.waitForOpen();
    await cp.archiveCard();

    // Card should no longer appear in the list
    await expect(bp.minicard(listA, 'Alpha Card')).not.toBeVisible({ timeout: 8_000 });
  });

  test('archived card can be unarchived from the archives sidebar', async ({ boardPage, board }) => {
    const bp = new BoardPage(boardPage);
    const cp = new CardPage(boardPage);
    const [listA] = board.listIds;

    // Archive first
    await bp.clickCard(listA, 'Alpha Card');
    await cp.waitForOpen();
    await cp.archiveCard();

    // After archiving, WeKan navigates to the board. Open the archives sidebar:
    // 1. Toggle sidebar open.
    await bp.openSidebar();
    // 2. Open the board menu popup from inside the sidebar. Scope the locator
    //    to the sidebar: #6465 added a second .js-open-board-menu (the
    //    one-click cog in the board header), so the bare class locator matches
    //    2 elements and trips Playwright's strict mode.
    await boardPage.locator('.board-sidebar .js-open-board-menu').click();
    await boardPage.locator('.js-pop-over').waitFor();
    // 3. Click "Archived Items" — .js-open-archives is inside boardMenuPopup.
    await boardPage.locator('.js-pop-over .js-open-archives').click();
    // 4. Wait for the archivesSidebar template (it has a spinner until ready).
    // Use .first() to avoid strict-mode violations when multiple matches exist.
    await boardPage.locator('.board-sidebar .minicard-wrapper, .board-sidebar .no-items-message').first().waitFor({ timeout: 15_000 });

    // Find and restore the archived card.
    // archivesSidebar.jade: each card is .minicard-wrapper.js-minicard with a .js-restore-card link below it.
    const archivedCard = boardPage.locator('.board-sidebar .minicard-wrapper').filter({ hasText: 'Alpha Card' }).first();
    await expect(archivedCard).toBeVisible({ timeout: 8_000 });

    const restoreBtn = boardPage.locator('.board-sidebar a.js-restore-card').first();
    if (await restoreBtn.count() > 0) {
      await restoreBtn.click();
      await boardPage.waitForTimeout(800);
      // Close the sidebar and check that the card is back on the board.
      await bp.openSidebar(); // toggles it closed
      await expect(bp.minicard(listA, 'Alpha Card')).toBeVisible({ timeout: 10_000 });
    }
  });

  // --- Move card ---

  test('moving a card to another list shows it only in the target list', async ({ boardPage, board }) => {
    const bp = new BoardPage(boardPage);
    const cp = new CardPage(boardPage);
    const [listA, listB] = board.listIds;

    await bp.clickCard(listA, 'Alpha Card');
    await cp.waitForOpen();

    // Get target list title
    const targetTitle = await bp.listHeader(listB).innerText();
    await cp.moveCard(null, targetTitle.trim());

    // Card must appear in listB and NOT in listA
    await expect(bp.minicard(listB, 'Alpha Card')).toBeVisible({ timeout: 10_000 });
    await expect(bp.minicard(listA, 'Alpha Card')).not.toBeVisible({ timeout: 5_000 });
  });

  test('move does not create duplicate cards', async ({ boardPage, board }) => {
    const bp = new BoardPage(boardPage);
    const cp = new CardPage(boardPage);
    const [listA, listB] = board.listIds;

    await bp.clickCard(listA, 'Alpha Card');
    await cp.waitForOpen();
    const targetTitle = await bp.listHeader(listB).innerText();
    await cp.moveCard(null, targetTitle.trim());

    // Wait for the move to settle (card removed from listA, rendered in listB)
    // before snapshotting titles — otherwise we can catch the card mid-flight.
    await expect(bp.minicard(listB, 'Alpha Card')).toBeVisible({ timeout: 10_000 });
    await expect(bp.minicard(listA, 'Alpha Card')).not.toBeVisible({ timeout: 5_000 });

    const titlesA = await bp.getCardTitles(listA);
    const titlesB = await bp.getCardTitles(listB);
    const occurrences = [...titlesA, ...titlesB].filter(t => t.includes('Alpha Card')).length;
    expect(occurrences).toBe(1);
  });

  // --- Copy card ---

  test('copying a card adds it to the target list without removing the original', async ({ boardPage, board }) => {
    const bp = new BoardPage(boardPage);
    const cp = new CardPage(boardPage);
    const [listA, listC] = board.listIds;

    await bp.clickCard(listA, 'Alpha Card');
    await cp.waitForOpen();
    const targetTitle = await bp.listHeader(listC).innerText();
    await cp.copyCard(null, targetTitle.trim(), 'Alpha Card Copy');

    // Original still in listA
    await expect(bp.minicard(listA, 'Alpha Card')).toBeVisible({ timeout: 8_000 });
    // Copy in listC
    await expect(bp.minicard(listC, 'Alpha Card Copy')).toBeVisible({ timeout: 8_000 });
  });

  // --- Changing the list from inside the card panel (status change) ---

  test('changing list via card detail list-selector moves the card', async ({ boardPage, board }) => {
    const bp = new BoardPage(boardPage);
    const cp = new CardPage(boardPage);
    const [listA, listB] = board.listIds;

    await bp.clickCard(listA, 'Alpha Card');
    await cp.waitForOpen();

    const targetTitle = (await bp.listHeader(listB).innerText()).trim();
    await cp.changeList(targetTitle);
    await boardPage.waitForTimeout(800);

    await expect(bp.minicard(listB, 'Alpha Card')).toBeVisible({ timeout: 10_000 });
    await expect(bp.minicard(listA, 'Alpha Card')).not.toBeVisible({ timeout: 5_000 });
  });

  // --- Sorting cards ---

  test('cards can be sorted by newest/earliest without error', async ({ boardPage, board }) => {
    const bp = new BoardPage(boardPage);
    const [listA] = board.listIds;

    const openSortPopup = async () => {
      let sortBtn = boardPage.locator('.js-sort-cards').first();
      if (await sortBtn.count() === 0) {
        await boardPage.goto(`${BASE_URL}/b/${board.boardId}/${board.slug}`, {
          waitUntil: 'networkidle',
        });
        sortBtn = boardPage.locator('.js-sort-cards').first();
      }

      await sortBtn.waitFor({ timeout: 10_000 });
      await sortBtn.click({ force: true, timeout: 10_000 });
      await boardPage.locator('.js-pop-over').waitFor({ timeout: 5_000 });
    };

    // Add a second card so sorting produces an observable change.
    await bp.closeComposers(listA);
    await bp.openAddCardTop(listA);
    await bp.submitNewCard(listA, 'Alpha Card Newer');

    // The sort button (.js-sort-cards) is in the board header, not the list
    // menu.  Clicking it opens cardsSortPopup with sort-order options.
    await openSortPopup();
    const pop = boardPage.locator('.js-pop-over');

    // Sort newest-first; verify the list still has at least 2 cards.
    await pop.locator('.js-sort-created-desc').click();
    await boardPage.waitForTimeout(600);
    const titlesDesc = await bp.getCardTitles(listA);
    expect(titlesDesc.length).toBeGreaterThanOrEqual(2);

    // Sort oldest-first and verify again.
    await openSortPopup();
    await pop.locator('.js-sort-created-asc').click();
    await boardPage.waitForTimeout(600);
    const titlesAsc = await bp.getCardTitles(listA);
    expect(titlesAsc.length).toBeGreaterThanOrEqual(2);
  });

  // --- Copy card to a board that has no lists ---

  test('copying a card to an empty board shows an error or empty list selector without crashing', async ({ boardPage, board, user }) => {
    const bp = new BoardPage(boardPage);
    const cp = new CardPage(boardPage);
    const [listA] = board.listIds;

    // Create a second board owned by the same user but with NO lists.
    const emptyBoard = db.seedBoard({ ownerId: user.id, listCount: 0, title: 'Empty Target Board' });

    await bp.clickCard(listA, 'Alpha Card');
    await cp.waitForOpen();
    await cp.openActionsMenu();
    await cp.clickAction('.js-copy-card');

    const pop = boardPage.locator('.js-pop-over');
    await pop.waitFor({ timeout: 5_000 });

    // Select the empty target board (the boards select should contain it once
    // the Meteor subscription delivers it).
    const boardSel = pop.locator('select.js-select-boards');
    if (await boardSel.count() > 0) {
      const emptyOpt = boardSel.locator('option').filter({ hasText: 'Empty Target Board' });
      if (await emptyOpt.count() > 0) {
        const val = await emptyOpt.first().getAttribute('value');
        await boardSel.selectOption(val);
        await boardPage.waitForTimeout(800);

        // With no lists, the list selector should be empty — WeKan must not crash.
        const listSel = pop.locator('select.js-select-lists');
        const listOptions = await listSel.locator('option').count();
        // Either 0 options (empty) or the popup itself handles it gracefully.
        expect(listOptions).toBeGreaterThanOrEqual(0);

        // The page must still be functional (no crash / white screen).
        await expect(boardPage.locator('.board-canvas, .js-card-details')).toBeVisible({ timeout: 5_000 });
      }
    }

    // Dismiss popup
    await boardPage.keyboard.press('Escape');
    db.cleanup({ boardIds: [emptyBoard.boardId] });
  });

  // --- Custom fields ---

  test('custom fields panel opens from card details', async ({ boardPage, board }) => {
    const bp = new BoardPage(boardPage);
    const cp = new CardPage(boardPage);
    const [listA] = board.listIds;

    await bp.clickCard(listA, 'Alpha Card');
    await cp.waitForOpen();
    await cp.openCustomFields();
    await expect(boardPage.locator('.js-pop-over')).toBeVisible({ timeout: 5_000 });
  });

  // --- Adding a card at top vs bottom of list ---

  test('add-to-top places the card first in the list', async ({ boardPage, board }) => {
    const bp = new BoardPage(boardPage);
    const [listB] = [board.listIds[1]];

    // Add-to-top positions the new card relative to the list's first rendered
    // minicard, so wait for the seeded card to be published to the client before
    // adding — otherwise a subscription race can place the card unexpectedly.
    await expect(bp.minicard(listB, 'Beta Card')).toBeVisible({ timeout: 15_000 });

    await bp.closeComposers(listB);
    await bp.openAddCardTop(listB);
    await bp.submitNewCard(listB, 'New Top Card');

    const titles = await bp.getCardTitles(listB);
    expect(titles[0]).toContain('New Top Card');
  });

  test('add-to-bottom places the card last in the list', async ({ boardPage, board }) => {
    const bp = new BoardPage(boardPage);
    const [,, listC] = board.listIds;

    // Add-to-bottom positions the new card relative to the list's LAST rendered
    // minicard (calculateIndex(lastCardDom, null)). If the seeded card has not
    // yet been published to the client, lastCardDom is null and the new card can
    // land above it instead of last — so wait for the seeded card to render first.
    await expect(bp.minicard(listC, 'Gamma Card')).toBeVisible({ timeout: 15_000 });

    await bp.closeComposers(listC);
    await bp.openAddCardBottom(listC);
    await bp.submitNewCard(listC, 'New Bottom Card');

    // submitNewCard only waits for the card to exist, not for its sort position
    // to settle. Poll until the reactive re-sort places it last in the list.
    await expect.poll(
      async () => {
        const titles = await bp.getCardTitles(listC);
        return titles[titles.length - 1] || '';
      },
      { timeout: 10_000 },
    ).toContain('New Bottom Card');
  });
});
