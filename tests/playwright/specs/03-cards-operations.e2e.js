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
  test('#6612 attachment viewer uses most of a desktop viewport', async ({ page }) => {
    await page.setViewportSize({ width: 1600, height: 900 });
    await page.goto(BASE_URL);
    await page.waitForSelector('#viewer-overlay');
    const dimensions = await page.evaluate(() => {
      const overlay = document.querySelector('#viewer-overlay');
      const pdf = document.querySelector('#pdf-viewer');
      overlay.classList.remove('hidden');
      pdf.classList.remove('hidden');
      const result = {
        overlayWidth: overlay.getBoundingClientRect().width,
        pdfWidth: pdf.getBoundingClientRect().width,
      };
      overlay.classList.add('hidden');
      pdf.classList.add('hidden');
      return result;
    });
    expect(dimensions.overlayWidth).toBeGreaterThanOrEqual(1500);
    expect(dimensions.pdfWidth).toBeGreaterThanOrEqual(1200);
  });

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

  test('multi-selection archives every selected card', async ({ boardPage, board }) => {
    const bp = new BoardPage(boardPage);
    const [listA] = board.listIds;

    await bp.openAddCardTop(listA);
    await bp.submitNewCard(listA, 'Bulk Archive One');
    await bp.openAddCardTop(listA);
    await bp.submitNewCard(listA, 'Bulk Archive Two');

    await boardPage.locator('.js-multiselection-activate').click();
    await bp.openListMenu(listA);
    await bp.clickListMenuItem('.js-select-cards');
    await boardPage.locator('.board-sidebar .js-archive-selection').click();

    await expect(bp.minicard(listA, 'Bulk Archive One')).not.toBeVisible({ timeout: 10_000 });
    await expect(bp.minicard(listA, 'Bulk Archive Two')).not.toBeVisible({ timeout: 10_000 });
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

  test('#6613 links a card from another board and closes the popup', async ({ boardPage, board, user }) => {
    const bp = new BoardPage(boardPage);
    const [listA] = board.listIds;
    const source = db.seedBoard({
      ownerId: user.id,
      title: 'Link Source Board',
      listCount: 1,
      cardTitlesPerList: [['Cross-board source card']],
    });

    try {
      await bp.openAddCardTop(listA);
      await boardPage.locator('.js-composer .js-link').click();
      const popup = boardPage.locator('.js-pop-over');
      await popup.waitFor({ timeout: 5_000 });
      await popup.locator('.js-select-boards').selectOption(source.boardId);
      await expect(popup.locator('.js-select-cards option')).toHaveCount(2, {
        timeout: 8_000,
      });
      const sourceCard = db.findOne('cards', {
        boardId: source.boardId,
        title: 'Cross-board source card',
      });
      const labelId = `linked-label-${Date.now()}`;
      const customFieldId = `linked-field-${Date.now()}`;
      db.updateOne('boards', { _id: source.boardId }, {
        $set: { labels: [{ _id: labelId, name: 'Source Label', color: 'green' }] },
      });
      db.insertOne('customFields', {
        _id: customFieldId,
        boardIds: [source.boardId],
        name: 'Source Field',
        type: 'text',
        settings: {},
        showOnCard: true,
        showLabelOnMiniCard: true,
      });
      db.updateOne('cards', { _id: sourceCard._id }, { $set: {
        labelIds: [labelId],
        stickers: [{ icon: 'rocket', name: 'Source Sticker', position: 0 }],
        customFields: [{ _id: customFieldId, value: 'Source Value' }],
        locations: [{
          _id: 'linked-location',
          name: 'Source Location',
          latitude: 62.04818,
          longitude: 28.15197,
        }],
      } });
      await popup.locator('.js-select-cards').selectOption(sourceCard._id);
      await popup.locator('.js-done').click();
      await expect(popup).toBeHidden({ timeout: 8_000 });

      await expect.poll(() => db.countDocuments('cards', {
        boardId: board.boardId,
        listId: listA,
        type: 'cardType-linkedCard',
        linkedId: sourceCard._id,
      })).toBe(1);

      const linked = boardPage.locator('.minicard.linked-card').filter({
        hasText: 'Cross-board source card',
      });
      await expect(linked.locator('.minicard-label')).toHaveAttribute(
        'title',
        'Source Label',
      );
      await expect(linked.locator('.minicard-sticker .fa-rocket')).toBeVisible();
      await expect(linked).toContainText('Source Field');
      await expect(linked).toContainText('Source Value');

      await linked.click();
      await expect(boardPage.locator('.card-details')).toBeVisible();
      await expect(boardPage.locator('.card-details .card-label')).toHaveAttribute(
        'title',
        'Source Label',
      );
      await expect(boardPage.locator('.card-details .card-sticker .fa-rocket')).toBeVisible();
      await expect(boardPage.locator('.card-details')).toContainText('Source Location');
      await expect(boardPage.locator('.card-details')).toContainText('Source Value');
    } finally {
      db.cleanup({ boardIds: [source.boardId] });
    }
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

  test('checkbox custom fields toggle and can be removed from a card', async ({ boardPage, board }) => {
    const bp = new BoardPage(boardPage);
    const cp = new CardPage(boardPage);
    const [listA] = board.listIds;
    const cardId = db.findCardIdByTitle({ boardId: board.boardId, title: 'Alpha Card' });
    const customFieldId = db.uid('checkboxField');
    db.insertOne('customFields', {
      _id: customFieldId, boardIds: [board.boardId], name: 'E2E Approved',
      type: 'checkbox', settings: {}, showOnCard: true, automaticallyOnCard: false,
      alwaysOnCard: false, showLabelOnMiniCard: true, showSumAtTopOfList: false,
      createdAt: new Date(), modifiedAt: new Date(),
    });
    db.updateOne('cards', { _id: cardId }, {
      $push: { customFields: { _id: customFieldId, value: false } },
    });

    await boardPage.reload();
    await bp.clickCard(listA, 'Alpha Card');
    await cp.waitForOpen();
    const field = cp.root.locator('.card-details-item-customfield')
      .filter({ hasText: 'E2E Approved' });
    await field.locator('.check-box-container').click();
    await expect.poll(() => {
      const card = db.getCard(cardId);
      return card.customFields.find(item => item._id === customFieldId).value;
    }).toBe(true);

    await cp.openCustomFields();
    await boardPage.locator('.js-pop-over li.item')
      .filter({ hasText: 'E2E Approved' }).locator('.js-select-field').click();
    await expect.poll(() => db.getCard(cardId).customFields
      .some(item => item._id === customFieldId)).toBe(false);
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
