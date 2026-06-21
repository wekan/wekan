'use strict';

/**
 * Spec 34 — Checklist text selection must not close the card (#5686)
 *
 * Regression for "Chrome: Selecting text in checklist closes card": selecting
 * the text of a checklist item and releasing the mouse OUTSIDE the card pane
 * used to close the card. Root cause: the checklist items template calls
 * `evt.stopPropagation()` on mousedown, so the `cardDetailsIsDragging` guard
 * never engaged and the document-level "click outside to close" handler closed
 * the card. The fix keeps the card open whenever a live text selection is
 * anchored inside the card pane (see client/lib/cardCloseGuard.js).
 *
 * The control test confirms the guard is specific: a plain click on the board
 * outside the card (no text selected) still closes the card.
 */

const { test, expect } = require('../fixtures');
const BoardPage = require('../pages/BoardPage');
const CardPage = require('../pages/CardPage');

// Returns a point that is over the board canvas but clearly OUTSIDE the card
// detail pane, so releasing/clicking there is treated as "outside the card".
async function outsidePoint(page, cardBox) {
  const canvas = await page.locator('.board-canvas').first().boundingBox();
  // Prefer a point to the left of the card (the board lists live there).
  const x = Math.max((canvas?.x ?? 0) + 8, cardBox.x - 60);
  const y = cardBox.y + Math.min(120, cardBox.height / 2);
  return { x: Math.min(x, cardBox.x - 5), y };
}

test.describe('Checklist text selection (#5686)', () => {
  test('selecting checklist item text and releasing outside keeps the card open', async ({
    boardPage,
    board,
  }) => {
    const bp = new BoardPage(boardPage);
    const cp = new CardPage(boardPage);
    const [listA] = board.listIds;

    await bp.clickCard(listA, 'Alpha Card');
    await cp.waitForOpen();

    const trigger = cp.root.locator('a.add-checklist.js-open-inlined-form');
    if ((await trigger.count()) === 0) {
      console.log('Note: checklists disabled on this board; skipping #5686 test');
      return;
    }

    await cp.addChecklist('Selectable List');
    await cp.addChecklistItem('Selectable List', 'Drag to select this checklist text');

    const itemTitle = cp.root
      .locator('.js-checklist-item .item-title')
      .filter({ hasText: 'Drag to select this checklist text' })
      .first();
    await itemTitle.waitFor({ timeout: 8_000 });

    const itemBox = await itemTitle.boundingBox();
    const cardBox = await cp.root.boundingBox();
    expect(itemBox, 'checklist item should have a bounding box').not.toBeNull();
    expect(cardBox, 'card pane should have a bounding box').not.toBeNull();

    const release = await outsidePoint(boardPage, cardBox);

    // Simulate a real text-selection drag: press on the checklist item text,
    // drag across it, then continue outside the card and release there.
    await boardPage.mouse.move(itemBox.x + 6, itemBox.y + itemBox.height / 2);
    await boardPage.mouse.down();
    await boardPage.mouse.move(
      itemBox.x + itemBox.width - 6,
      itemBox.y + itemBox.height / 2,
      { steps: 8 },
    );
    await boardPage.mouse.move(release.x, release.y, { steps: 12 });
    await boardPage.mouse.up();

    // The card detail pane must still be open.
    await expect(cp.root).toBeVisible({ timeout: 5_000 });
    // And some text should actually have been selected (sanity for the gesture).
    const selected = await boardPage.evaluate(() =>
      (window.getSelection && window.getSelection().toString()) || '',
    );
    expect(selected.length, 'a text selection should have been made').toBeGreaterThan(0);
  });

  test('control: a plain click on the board outside the card closes it', async ({
    boardPage,
    board,
  }) => {
    const bp = new BoardPage(boardPage);
    const cp = new CardPage(boardPage);
    const [listA] = board.listIds;

    await bp.clickCard(listA, 'Alpha Card');
    await cp.waitForOpen();

    // Clear any leftover selection so the close guard does not engage.
    await boardPage.evaluate(() => window.getSelection && window.getSelection().removeAllRanges());

    const cardBox = await cp.root.boundingBox();
    const click = await outsidePoint(boardPage, cardBox);
    await boardPage.mouse.click(click.x, click.y);

    await expect(cp.root).toBeHidden({ timeout: 8_000 });
  });
});
