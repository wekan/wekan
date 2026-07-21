'use strict';

/**
 * Spec 22 — Card & list features that were documented but untested
 *
 * Covers documented features with no prior e2e coverage:
 *  - Stickers           (docs/Features/Stickers/Stickers.md)
 *  - Card Locations     (docs/Features/Locations/Locations.md)
 *  - Complete checkbox  (docs/Features/Cards/Cards.md)
 *  - WIP Limits         (docs/Features/WipLimit/WipLimit.md)
 */

const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const BoardPage = require('../pages/BoardPage');
const CardPage = require('../pages/CardPage');

test.describe('Card & list features', () => {
  test('a sticker can be added to a card', async ({ boardPage, board }) => {
    const bp = new BoardPage(boardPage);
    const cp = new CardPage(boardPage);
    await bp.clickCard(board.listIds[0], 'Alpha Card');
    await cp.waitForOpen();

    // Open the stickers picker and choose the first sticker.
    await boardPage.locator('.js-add-stickers').click();
    const pop = boardPage.locator('.js-pop-over');
    await pop.waitFor({ timeout: 10_000 });
    await pop.locator('.js-select-sticker').first().click();

    // The chosen sticker now renders in the card's stickers section.
    await expect(boardPage.locator('.card-stickers .card-sticker').first()).toBeVisible({
      timeout: 10_000,
    });
  });

  test('a location can be added to a card', async ({ boardPage, board }) => {
    const bp = new BoardPage(boardPage);
    const cp = new CardPage(boardPage);
    await bp.clickCard(board.listIds[0], 'Alpha Card');
    await cp.waitForOpen();

    await boardPage.locator('.js-add-location').click();
    const pop = boardPage.locator('.js-pop-over');
    await pop.waitFor({ timeout: 10_000 });
    await pop.locator('.js-location-latitude').fill('60.17');
    await pop.locator('.js-location-longitude').fill('24.94');
    // Fill the name LAST and confirm it stuck before submitting. On WebKit the popup
    // can reactively re-render just after opening and wipe the first-filled field —
    // the name was previously filled first and lost (lat/lng, filled after, survived),
    // so the location saved with coordinates but no name.
    await pop.locator('.js-location-name').fill('WeKan HQ');
    await expect(pop.locator('.js-location-name')).toHaveValue('WeKan HQ');
    await pop.locator('.js-submit-location').click();

    // The location appears in the card's Location section.
    await expect(boardPage.locator('.card-locations .card-location-name')).toContainText(
      'WeKan HQ',
      { timeout: 10_000 },
    );
  });

  test('the minicard complete checkbox toggles', async ({ boardPage, board }) => {
    // The "Mark as complete" toggle is shown on minicards only when the board's
    // "Show at Minicard" option (allowsDueCompleteOnMinicard) is enabled; enable
    // it so the toggle renders (it reactively appears via the oplog).
    db.updateOne('boards', { _id: board.boardId }, { $set: { allowsDueCompleteOnMinicard: true } });
    const bp = new BoardPage(boardPage);
    const minicard = bp.minicard(board.listIds[0], 'Alpha Card');
    await minicard.waitFor({ timeout: 15_000 });

    const toggle = minicard.locator('.js-toggle-card-complete');
    await expect(toggle).toBeVisible();
    await toggle.click();

    // After toggling, the material checkbox shows the checked state.
    await expect(
      minicard.locator('.js-toggle-card-complete .materialCheckBox.is-checked'),
    ).toBeVisible({ timeout: 10_000 });
  });

  test('a WIP limit can be enabled on a list', async ({ boardPage, board }) => {
    const bp = new BoardPage(boardPage);
    await bp.openListMenu(board.listIds[0]);
    await boardPage.locator('.js-pop-over .js-set-wip-limit').click();

    const pop = boardPage.locator('.js-pop-over');
    await pop.locator('.js-enable-wip-limit').click();

    // Enabling reveals the numeric limit field; set it and apply.
    const value = pop.locator('input.wip-limit-value');
    await expect(value).toBeVisible({ timeout: 10_000 });
    await value.fill('5');
    await pop.locator('input.wip-limit-apply').click();
    await boardPage.waitForTimeout(500);

    // Reopen the menu: the WIP limit is now enabled (shows the checkmark state).
    await bp.openListMenu(board.listIds[0]);
    await boardPage.locator('.js-pop-over .js-set-wip-limit').click();
    await expect(boardPage.locator('.js-pop-over input.wip-limit-value')).toHaveValue('5', {
      timeout: 10_000,
    });
  });
});
