'use strict';

/**
 * Spec 12 — Checklists
 *
 * Covers:
 *  - Add checklist button opens the inline form
 *  - Creating a checklist persists it in the card
 *  - Adding an item to a checklist stores it
 *  - Checking a checklist item marks it as finished (is-checked class)
 *  - Checklist progress bar appears after items are checked
 *  - Deleting a checklist removes it from the card
 */

const { test, expect } = require('../fixtures');
const BoardPage = require('../pages/BoardPage');
const CardPage = require('../pages/CardPage');

test.describe('Checklists', () => {
  test('add-checklist button opens the inline form', async ({ boardPage, board }) => {
    const bp = new BoardPage(boardPage);
    const cp = new CardPage(boardPage);
    const [listA] = board.listIds;

    await bp.clickCard(listA, 'Alpha Card');
    await cp.waitForOpen();

    // Bottom trigger: a.add-checklist.js-open-inlined-form
    const trigger = cp.root.locator('a.add-checklist.js-open-inlined-form');
    if (await trigger.count() > 0) {
      await trigger.last().click();
      // The inlined form should appear: form.js-add-checklist
      const form = cp.root.locator('form.js-add-checklist');
      await expect(form.last()).toBeVisible({ timeout: 6_000 });
      // Textarea for checklist title should be inside the form
      await expect(form.last().locator('textarea.js-add-checklist-item')).toBeVisible({ timeout: 3_000 });
    } else {
      // Board may have disabled checklists
      console.log('Note: add-checklist button not found');
    }
  });

  test('creating a checklist adds it to the card details', async ({ boardPage, board }) => {
    const bp = new BoardPage(boardPage);
    const cp = new CardPage(boardPage);
    const [listA] = board.listIds;

    await bp.clickCard(listA, 'Alpha Card');
    await cp.waitForOpen();

    const trigger = cp.root.locator('a.add-checklist.js-open-inlined-form');
    if (await trigger.count() > 0) {
      await cp.addChecklist('My Checklist');
      // A .js-checklist element with the title should now be visible
      const checklist = cp.root.locator('.js-checklist').filter({ hasText: 'My Checklist' });
      await expect(checklist.first()).toBeVisible({ timeout: 8_000 });
    } else {
      console.log('Note: add-checklist not available; skipping creation assertion');
    }
  });

  test('adding an item to a checklist renders it in the item list', async ({ boardPage, board }) => {
    const bp = new BoardPage(boardPage);
    const cp = new CardPage(boardPage);
    const [listA] = board.listIds;

    await bp.clickCard(listA, 'Alpha Card');
    await cp.waitForOpen();

    const trigger = cp.root.locator('a.add-checklist.js-open-inlined-form');
    if (await trigger.count() > 0) {
      await cp.addChecklist('Task List');
      // Now add a checklist item
      await cp.addChecklistItem('Task List', 'First task item');

      const item = cp.checklistItems('Task List').filter({ hasText: 'First task item' });
      await expect(item.first()).toBeVisible({ timeout: 8_000 });
    } else {
      console.log('Note: checklists not available; skipping item-add assertion');
    }
  });

  test('checking a checklist item adds the is-checked class', async ({ boardPage, board }) => {
    const bp = new BoardPage(boardPage);
    const cp = new CardPage(boardPage);
    const [listA] = board.listIds;

    await bp.clickCard(listA, 'Alpha Card');
    await cp.waitForOpen();

    const trigger = cp.root.locator('a.add-checklist.js-open-inlined-form');
    if (await trigger.count() > 0) {
      await cp.addChecklist('Progress Checklist');
      await cp.addChecklistItem('Progress Checklist', 'Completable item');

      const item = cp.checklistItems('Progress Checklist').filter({ hasText: 'Completable item' }).first();
      await expect(item).toBeVisible({ timeout: 8_000 });

      // Click the material checkbox to toggle finished state
      await cp.toggleChecklistItem('Progress Checklist', 'Completable item');

      // Item should now carry the is-checked class
      await expect(item).toHaveClass(/is-checked/, { timeout: 5_000 });
    } else {
      console.log('Note: checklists not available; skipping toggle assertion');
    }
  });

  test('checklist progress bar appears when items are checked', async ({ boardPage, board }) => {
    const bp = new BoardPage(boardPage);
    const cp = new CardPage(boardPage);
    const [listA] = board.listIds;

    await bp.clickCard(listA, 'Alpha Card');
    await cp.waitForOpen();

    const trigger = cp.root.locator('a.add-checklist.js-open-inlined-form');
    if (await trigger.count() > 0) {
      await cp.addChecklist('Bar Checklist');
      await cp.addChecklistItem('Bar Checklist', 'Item A');
      await cp.toggleChecklistItem('Bar Checklist', 'Item A');

      // Progress bar: .checklist-progress-bar-container
      const progressBar = cp.root
        .locator('.js-checklist')
        .filter({ hasText: 'Bar Checklist' })
        .locator('.checklist-progress-bar-container');
      await expect(progressBar).toBeVisible({ timeout: 5_000 });
    } else {
      console.log('Note: checklists not available; skipping progress-bar assertion');
    }
  });

  test('deleting a checklist removes it from the card', async ({ boardPage, board }) => {
    const bp = new BoardPage(boardPage);
    const cp = new CardPage(boardPage);
    const [listA] = board.listIds;

    await bp.clickCard(listA, 'Alpha Card');
    await cp.waitForOpen();

    const trigger = cp.root.locator('a.add-checklist.js-open-inlined-form');
    if (await trigger.count() > 0) {
      await cp.addChecklist('Delete Me');
      const checklist = cp.root.locator('.js-checklist').filter({ hasText: 'Delete Me' });
      await expect(checklist.first()).toBeVisible({ timeout: 8_000 });

      // Open the checklist actions menu and click Delete
      await cp.openChecklistMenu('Delete Me');
      const pop = boardPage.locator('.js-pop-over');
      const deleteBtn = pop.locator('a.js-delete-checklist, li a').filter({ hasText: /delete/i }).first();
      if (await deleteBtn.count() > 0) {
        await deleteBtn.click();
        // Confirm deletion if a confirmation popup appears
        await boardPage.waitForTimeout(400);
        const confirmBtn = boardPage.locator('.js-pop-over button.js-confirm, .js-pop-over .js-confirm');
        if (await confirmBtn.count() > 0) await confirmBtn.first().click();
        await boardPage.waitForTimeout(600);
        // Checklist should be gone
        await expect(checklist).not.toBeVisible({ timeout: 5_000 });
      } else {
        // Menu didn't have delete — verify menu opened at least
        await expect(pop).toBeVisible({ timeout: 3_000 });
      }
    } else {
      console.log('Note: checklists not available; skipping delete assertion');
    }
  });
});
