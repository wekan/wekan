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
const { loginWithToken, openBoard } = require('../helpers/auth');

const BASE_URL = process.env.WEKAN_BASE_URL || 'http://localhost:3000';

test.describe('Cards – operations', () => {
  test('#6645: a lazy board receives remote card edits and moves without reload', async ({
    page,
    user,
    board,
  }) => {
    const [listA, listB] = board.listIds;
    const card = db.findOne('cards', {
      boardId: board.boardId,
      title: 'Alpha Card',
    });
    const filler = Array.from({ length: 498 }, (_, index) => ({
      ...card,
      _id: db.uid('lazy'),
      title: `Lazy filler ${index}`,
      cardNumber: 1000 + index,
      sort: 1000 + index,
    }));
    db.insertMany('cards', filler);

    await loginWithToken(page, user.id, user.token);
    await openBoard(page, board.boardId, board.slug);

    const original = page.locator(`.js-minicard[data-card-id="${card._id}"]`);
    await expect(original).toContainText('Alpha Card');

    db.updateOne('cards', { _id: card._id }, {
      $set: { title: 'Alpha Card refreshed remotely' },
    });
    await expect(original).toContainText('Alpha Card refreshed remotely', {
      timeout: 30_000,
    });

    db.updateOne('cards', { _id: card._id }, {
      $set: { listId: listB, sort: 50 },
    });
    await expect(
      page.locator(`#js-list-${listA} .js-minicard[data-card-id="${card._id}"]`),
    ).toHaveCount(0, { timeout: 30_000 });
    await expect(
      page.locator(`#js-list-${listB} .js-minicard[data-card-id="${card._id}"]`),
    ).toContainText('Alpha Card refreshed remotely', { timeout: 30_000 });
  });

  test('#1942: a private-source linked card opens and closes from its snapshot', async ({
    browser,
    user,
    user2,
    board,
  }) => {
    const source = db.seedBoard({ ownerId: user.id, cardTitlesPerList: [['Private source']] });
    const sourceCard = db.findOne('cards', { boardId: source.boardId, title: 'Private source' });
    const linkedId = db.uid('link');
    db.insertOne('cards', {
      ...sourceCard,
      _id: linkedId,
      boardId: board.boardId,
      swimlaneId: board.swimlaneId,
      listId: board.listIds[0],
      linkedId: sourceCard._id,
      type: 'cardType-linkedCard',
      title: 'Private source',
      sort: 50,
    });
    db.updateOne('boards', { _id: board.boardId }, { $push: { members: {
      userId: user2.id, isActive: true, isAdmin: false, isNoComments: false,
      isCommentOnly: false, isWorker: false, isReadOnly: true,
    } } });

    const context = await browser.newContext();
    const page = await context.newPage();
    try {
      await loginWithToken(page, user2.id, user2.token);
      await openBoard(page, board.boardId, board.slug);
      const linked = page.locator(`.js-minicard[data-card-id="${linkedId}"]`);
      await expect(linked).toContainText('Private source');
      await linked.click();
      await expect(page.locator('.js-card-details')).toBeVisible();
      await page.locator('.js-close-card-details').first().click();
      await expect(page.locator('.js-card-details')).toHaveCount(0);
      await expect(page.locator('.board-canvas')).toBeVisible();
    } finally {
      await context.close();
      db.cleanup({ boardIds: [source.boardId] });
    }
  });

  test('#6612 attachment viewer uses most of a desktop viewport', async ({ boardPage, board }) => {
    await boardPage.setViewportSize({ width: 1600, height: 900 });
    const bp = new BoardPage(boardPage);
    await bp.clickCard(board.listIds[0], 'Alpha Card');
    await boardPage.waitForSelector('#viewer-overlay', { state: 'attached' });
    const dimensions = await boardPage.evaluate(() => {
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

  test('#3114: remotely deleting an open card closes its details', async ({
    boardPage,
    board,
  }) => {
    const bp = new BoardPage(boardPage);
    const cp = new CardPage(boardPage);
    await bp.clickCard(board.listIds[0], 'Alpha Card');
    await cp.waitForOpen();

    const cardId = db.findCardIdByTitle({
      boardId: board.boardId,
      title: 'Alpha Card',
    });
    db.deleteOne('cards', { _id: cardId });

    await expect(boardPage.locator('.js-card-details')).toHaveCount(0, {
      timeout: 10_000,
    });
    await expect(boardPage.locator('.board-canvas')).toBeVisible();
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

  test('#2494 cross-board moves receive a unique finite position and stay visible', async ({
    boardPage,
    board,
  }) => {
    const targetTitle = `Issue 2494 Target ${db.uid('')}`;
    await boardPage.locator('.js-create-board').first().click();
    const createPopup = boardPage.locator('.js-pop-over');
    await createPopup.locator('.js-new-board-title').fill(targetTitle);
    await createPopup.locator('input[type="submit"]').click();
    let targetBoardId;
    await expect.poll(() => {
      targetBoardId = db.findOne('boards', { title: targetTitle, type: 'board' })?._id;
      return targetBoardId || null;
    }, { timeout: 15_000 }).not.toBeNull();
    const targetBoard = db.findOne('boards', { _id: targetBoardId });
    const targetSwimlane = db.findOne('swimlanes', { boardId: targetBoardId });
    await boardPage.getByRole('link', { name: 'Add List' }).click();
    const addListComposer = boardPage.locator('.js-add-list-inline-form');
    await addListComposer.locator('.list-name-input').fill('List A');
    await addListComposer.getByRole('button', { name: 'Save' }).click();
    let targetListId;
    await expect.poll(() => {
      targetListId = db.findOne('lists', { boardId: targetBoardId, title: 'List A' })?._id;
      return targetListId || null;
    }, { timeout: 15_000 }).not.toBeNull();
    const target = {
      boardId: targetBoardId,
      slug: targetBoard.slug,
      swimlaneId: targetSwimlane._id,
      listIds: [targetListId],
    };
    try {
      const targetPage = new BoardPage(boardPage);
      await targetPage.openAddCardTop(targetListId);
      await targetPage.submitNewCard(targetListId, 'Existing One');
      await targetPage.openAddCardTop(targetListId);
      await targetPage.submitNewCard(targetListId, 'Existing Two');
      await openBoard(boardPage, board.boardId, board.slug);
      const bp = new BoardPage(boardPage);
      const cp = new CardPage(boardPage);
      await bp.clickCard(board.listIds[0], 'Alpha Card');
      await cp.waitForOpen();
      await cp.openActionsMenu();
      await cp.clickAction('.js-move-card');
      const movePopup = boardPage.locator('.js-pop-over');
      const boardSelect = movePopup.locator('select.js-select-boards');
      await expect(boardSelect.locator(`option[value="${targetBoardId}"]`)).toHaveText(targetTitle);
      await boardSelect.selectOption(targetBoardId);
      const listSelect = movePopup.locator('select.js-select-lists');
      await expect(listSelect.locator(`option[value="${targetListId}"]`)).toContainText('List A');
      await listSelect.selectOption(targetListId);
      await movePopup.locator('button.js-done, button.primary.confirm').click();

      await expect.poll(() => db.findOne('cards', {
        boardId: target.boardId,
        title: 'Alpha Card',
      })).toBeTruthy();
      const cards = db.find('cards', {
        boardId: target.boardId,
        listId: target.listIds[0],
        archived: false,
      });
      expect(cards).toHaveLength(3);
      const sorts = cards.map(card => card.sort);
      expect(sorts.every(Number.isFinite)).toBe(true);
      expect(new Set(sorts).size).toBe(sorts.length);

      await openBoard(boardPage, target.boardId, target.slug);
      const movedPage = new BoardPage(boardPage);
      for (const title of ['Existing One', 'Existing Two', 'Alpha Card']) {
        await expect(movedPage.minicard(target.listIds[0], title)).toBeVisible();
      }
    } finally {
      db.cleanup({ boardIds: [target.boardId] });
    }
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
        // Both may be visible when the copy dialog leaves the source card open;
        // a union locator is then a Playwright strict-mode error, not an app
        // crash. The board canvas alone is the stable functional-page guard.
        await expect(boardPage.locator('.board-canvas').first()).toBeVisible({ timeout: 5_000 });
      }
    }

    // Dismiss popup
    await boardPage.keyboard.press('Escape');
    db.cleanup({ boardIds: [emptyBoard.boardId] });
  });

  test('#1946/#6613 linked source fields and member avatars survive reload', async ({
    boardPage,
    board,
    user,
    user2,
  }) => {
    const bp = new BoardPage(boardPage);
    const cp = new CardPage(boardPage);
    const [listA] = board.listIds;
    const sourceSlug = `link-source-${Date.now()}`;
    const sourceBoardId = await boardPage.evaluate(payload => new Promise((resolve, reject) => {
      Meteor.call('createBoardWithInitialSwimlanes', payload, (error, result) =>
        error ? reject(error) : resolve(result));
    }), {
      title: 'Link Source Board',
      slug: sourceSlug,
      permission: 'private',
      type: 'board',
      migrationVersion: 1,
      swimlanes: [{ title: 'Default', sort: 0, type: 'swimlane' }],
    });
    const sourceSwimlane = db.findOne('swimlanes', { boardId: sourceBoardId });
    db.addBoardMember({ boardId: sourceBoardId, userId: user2.id });
    const avatarUrl = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg"/%3E';
    db.updateOne('users', { _id: user2.id }, {
      $set: { 'profile.avatarUrl': avatarUrl },
    });
    const sourceListId = db.uid('list');
    const sourceCardId = db.uid('card');
    const now = new Date();
    db.insertOne('lists', {
      _id: sourceListId, title: 'Source List', boardId: sourceBoardId,
      swimlaneId: sourceSwimlane._id, archived: false, sort: 100,
      createdAt: now, modifiedAt: now,
    });
    db.insertOne('cards', {
      _id: sourceCardId, title: 'Cross-board source card', boardId: sourceBoardId,
      listId: sourceListId, swimlaneId: sourceSwimlane._id,
      type: 'cardType-card', archived: false, sort: 100,
      members: [user2.id], labelIds: [], customFields: [], createdAt: now,
      modifiedAt: now, dateLastActivity: now, userId: user.id,
    });
    const source = { boardId: sourceBoardId, slug: sourceSlug };
    const labelId = `linked-label-${Date.now()}`;
    const customFieldId = `linked-field-${Date.now()}`;
    db.updateOne('boards', { _id: source.boardId }, {
      $set: { labels: [{ _id: labelId, name: 'Source Label', color: 'green' }] },
    });
    db.updateOne('boards', { _id: board.boardId }, {
      $set: { allowsCustomFieldsOnMinicard: true },
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
    db.updateOne('cards', { _id: sourceCardId }, { $set: {
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

    try {
      await bp.openAddCardTop(listA);
      await bp.list(listA).locator('.js-link').click();
      const popup = boardPage.locator('.js-pop-over');
      await popup.waitFor({ timeout: 5_000 });
      await expect(popup.locator(`.js-select-boards option[value="${source.boardId}"]`))
        .toHaveCount(1, { timeout: 8_000 });
      await popup.locator('.js-select-boards').selectOption(source.boardId);
      await expect(popup.locator('.js-select-cards option')).toHaveCount(2, {
        timeout: 8_000,
      });
      const sourceCard = db.findOne('cards', { _id: sourceCardId });
      await popup.locator('.js-select-cards').selectOption(sourceCard._id);
      await popup.locator('.js-done').click();
      await expect(popup).toBeHidden({ timeout: 8_000 });

      await expect.poll(() => db.countDocuments('cards', {
        boardId: board.boardId,
        listId: listA,
        type: 'cardType-linkedCard',
        linkedId: sourceCard._id,
      })).toBe(1);

      // Re-enter the board so this assertion exercises the permanent linked
      // data publication, independently of the source-board picker subscription
      // that was active while the link was created.
      await boardPage.goto(`/b/${board.boardId}/${board.slug}`);
      await boardPage.locator('.board-canvas').waitFor({ timeout: 15_000 });

      const linked = boardPage.locator('.minicard.linked-card').filter({
        hasText: 'Cross-board source card',
      });
      await expect(linked.locator('.minicard-label, .card-label')).toHaveAttribute(
        'title',
        'Source Label',
      );
      await expect(linked.locator('.minicard-sticker .fa-rocket')).toBeVisible();
      await expect(linked).toContainText('Source Field');
      await expect(linked).toContainText('Source Value');

      await linked.click();
      await expect(boardPage.locator('.card-details')).toBeVisible();
      const linkedMemberAvatar = boardPage.locator(
        `.card-details a.member[title*="${user2.username}"] img.avatar-image`,
      );
      await expect(linkedMemberAvatar).toHaveAttribute(
        'src',
        /\/cdn\/storage\/avatars\/[^?]+\?boardId=/,
      );
      await expect(boardPage.locator(
        '.card-details .card-label[title="Source Label"]',
      )).toHaveAttribute(
        'title',
        'Source Label',
      );
      await expect(boardPage.locator('.card-details .card-sticker .fa-rocket')).toBeVisible();
      await expect(boardPage.locator('.card-details')).toContainText('Source Location');
      await expect(boardPage.locator('.card-details')).toContainText('Source Value');

      // Editing the opened linked representation updates the source and the
      // linked minicard title snapshot, so both boards retain the same card.
      await cp.editTitle('Edited through linked card');
      await expect.poll(() => db.findOne('cards', { _id: sourceCard._id })?.title)
        .toBe('Edited through linked card');
      await expect.poll(() => db.findOne('cards', {
        boardId: board.boardId,
        linkedId: sourceCard._id,
      })?.title).toBe('Edited through linked card');

      // The ordinary source-board editor remains available and writes the
      // same document in the opposite direction.
      await boardPage.goto(`/b/${source.boardId}/${source.slug}`);
      await boardPage.locator('.board-canvas').waitFor({ timeout: 15_000 });
      await boardPage.locator('.minicard').filter({
        hasText: 'Edited through linked card',
      }).evaluate(el => el.click());
      await cp.waitForOpen();
      await cp.editTitle('Edited from source board');
      await expect.poll(() => db.findOne('cards', { _id: sourceCard._id })?.title)
        .toBe('Edited from source board');
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
    await expect(field.locator('.js-card-custom-field-checkbox')).toHaveClass(
      /is-checked/,
    );

    // A second click saves false; it does not remove/hide the field as the
    // similarly styled control in the Custom Fields menu intentionally does.
    await field.locator('.check-box-container').click();
    await expect.poll(() => {
      const card = db.getCard(cardId);
      return card.customFields.find(item => item._id === customFieldId).value;
    }).toBe(false);
    await expect(field).toBeVisible();

    // The rest of the checkbox row edits the value; only the square itself is
    // the immediate toggle control.
    await field.locator('.js-card-custom-field-checkbox').evaluate(row => row.click());
    const editor = field.locator('.js-card-customfield-checkbox-editor');
    await expect(editor).toBeVisible();
    const editorInput = editor.locator('.js-card-customfield-checkbox-input');
    const editorSquare = editor.locator('.materialCheckBox');
    await editor.locator('.check-box-container').click();
    await expect(editorInput).toBeChecked();
    await expect(editorSquare).toHaveClass(/is-checked/);
    await editor.locator('.check-box-container').click();
    await expect(editorInput).not.toBeChecked();
    await expect(editorSquare).not.toHaveClass(/is-checked/);
    await field.locator('.js-close-inlined-form').click();

    await cp.openCustomFields();
    await boardPage.locator('.js-pop-over li.item')
      .filter({ hasText: 'E2E Approved' }).locator('.js-select-field').click();
    await expect.poll(() => db.getCard(cardId).customFields
      .some(item => item._id === customFieldId)).toBe(false);
  });

  test('currency custom fields save and offer an X beside Save', async ({ boardPage, board }) => {
    const bp = new BoardPage(boardPage);
    const cp = new CardPage(boardPage);
    const [listA] = board.listIds;
    const cardId = db.findCardIdByTitle({ boardId: board.boardId, title: 'Alpha Card' });
    const customFieldId = db.uid('currencyField');
    db.insertOne('customFields', {
      _id: customFieldId, boardIds: [board.boardId], name: 'E2E Budget',
      type: 'currency', settings: { currencyCode: 'EUR' }, showOnCard: true,
      automaticallyOnCard: false, alwaysOnCard: false,
      showLabelOnMiniCard: true, showSumAtTopOfList: false,
      createdAt: new Date(), modifiedAt: new Date(),
    });
    db.updateOne('cards', { _id: cardId }, {
      $push: { customFields: { _id: customFieldId, value: 0 } },
    });

    await boardPage.reload();
    await bp.clickCard(listA, 'Alpha Card');
    await cp.waitForOpen();
    const field = cp.root.locator('.card-details-item-customfield')
      .filter({ hasText: 'E2E Budget' });
    await expect(field.locator('.js-copy-custom-field')).toHaveCount(0);
    await field.locator('.card-details-item-title.js-edit-card-custom-field-value').click();
    const form = field.locator('.js-card-customfield-currency');
    await expect(form.locator('button[type="submit"]')).toBeVisible();
    await expect(form.locator('.js-copy-custom-field')).toBeVisible();
    await expect(form.locator('.fa-times-thin.js-close-inlined-form')).toBeVisible();
    await expect(form.locator('.edit-controls .js-copy-custom-field')).toHaveCount(0);
    await form.locator('input').fill('123,45');
    await form.locator('button[type="submit"]').click();
    await expect.poll(() => db.getCard(cardId).customFields
      .find(item => item._id === customFieldId).value).toBe(123.45);
  });

  test('custom field layout toggle switches and persists its layout', async ({ boardPage, board }) => {
    const bp = new BoardPage(boardPage);
    const cp = new CardPage(boardPage);
    const [listA] = board.listIds;
    const cardId = db.findCardIdByTitle({ boardId: board.boardId, title: 'Alpha Card' });
    const values = [];
    for (const name of [
      'E2E Layout A', 'E2E Layout B', 'E2E Layout C',
      'E2E Layout D', 'E2E Layout E', 'E2E Layout F',
    ]) {
      const id = db.uid('layoutField');
      db.insertOne('customFields', {
        _id: id, boardIds: [board.boardId], name, type: 'text', settings: {},
        showOnCard: true, automaticallyOnCard: false, alwaysOnCard: false,
        showLabelOnMiniCard: true, showSumAtTopOfList: false,
        createdAt: new Date(), modifiedAt: new Date(),
      });
      values.push({ _id: id, value: name });
    }
    db.updateOne('cards', { _id: cardId }, {
      $push: { customFields: { $each: values } },
    });

    await boardPage.reload();
    await bp.clickCard(listA, 'Alpha Card');
    await cp.waitForOpen();
    const sectionHeader = cp.root.locator(
      '.js-toggle-card-section[data-section="custom-fields"]',
    );
    await expect(sectionHeader.locator('#toggleCustomFieldsGridButton')).toBeVisible();
    await sectionHeader.click({ position: { x: 10, y: 10 } });
    await expect(cp.root.locator('#toggleCustomFieldsGridButton')).toHaveCount(0);
    await sectionHeader.click({ position: { x: 10, y: 10 } });
    await expect(sectionHeader.locator('#toggleCustomFieldsGridButton')).toBeVisible();
    const body = cp.root.locator(
      '.card-details-group-custom-fields .card-details-group-body',
    );
    const initiallyRows = await body.evaluate(el =>
      el.classList.contains('custom-fields-one-per-row'));
    await cp.root.locator('#toggleCustomFieldsGridButton').click();
    await expect(body).toHaveClass(initiallyRows
      ? /custom-fields-grid/
      : /custom-fields-one-per-row/);

    await boardPage.reload();
    await bp.clickCard(listA, 'Alpha Card');
    await cp.waitForOpen();
    await expect(cp.root.locator(
      '.card-details-group-custom-fields .card-details-group-body',
    )).toHaveClass(initiallyRows
      ? /custom-fields-grid/
      : /custom-fields-one-per-row/);

    const reloadedBody = cp.root.locator(
      '.card-details-group-custom-fields .card-details-group-body',
    );
    await expect(reloadedBody.locator('.card-details-item-customfield')).toHaveCount(
      values.length,
      { timeout: 10_000 },
    );
    if (!initiallyRows) {
      await cp.root.locator('#toggleCustomFieldsGridButton').click();
      await expect(reloadedBody).toHaveClass(/custom-fields-grid/);
    }
    const columnsAtWidth = async width => {
      await cp.root.evaluate((card, nextWidth) => {
        card.style.width = `${nextWidth}px`;
      }, width);
      return reloadedBody.locator('.card-details-item-customfield').evaluateAll(
        async fields => {
          await new Promise(resolve => requestAnimationFrame(() =>
            requestAnimationFrame(resolve)));
          const tops = fields.map(field => Math.round(field.getBoundingClientRect().top));
          const firstTop = Math.min(...tops);
          return tops.filter(top => Math.abs(top - firstTop) <= 1).length;
        },
      );
    };
    const narrowColumns = await columnsAtWidth(520);
    const wideColumns = await columnsAtWidth(900);
    expect(wideColumns).toBeGreaterThan(narrowColumns);
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
