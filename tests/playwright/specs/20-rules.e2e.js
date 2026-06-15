'use strict';

/**
 * Spec 20 — Rules (automation)
 *
 * Covers:
 *  - The Rules page opens as a fullscreen board-scoped page (/b/:id/:slug/rules)
 *  - Creating an event rule (trigger -> action) adds it to the rules list
 *  - The Import / Export dialog opens and offers JSON/CSV export
 *  - Selecting rules and the visual Workflow view work
 */

const { test, expect } = require('../fixtures');

async function openRulesPage(page, board) {
  await page.goto(`/b/${board.boardId}/${board.slug}/rules`, { waitUntil: 'commit' });
  // The rules list (or its empty-state) renders inside the fullscreen page.
  await page.locator('.rules-page').waitFor({ timeout: 20_000 });
}

test.describe('Rules', () => {
  test('Rules opens as a fullscreen page with the board rules header', async ({ boardPage, board }) => {
    await openRulesPage(boardPage, board);
    // Header bar title and the page wrapper are present (not a modal overlay).
    await expect(boardPage.locator('.rules-page')).toBeVisible();
    await expect(boardPage.locator('#modal')).toHaveCount(0);
  });

  test('can create an event rule and see it in the list', async ({ boardPage, board }) => {
    await openRulesPage(boardPage, board);

    // Name the rule and go to the trigger step.
    await boardPage.locator('#ruleTitle').fill('Top on create');
    await boardPage.locator('.js-goto-trigger').click();

    // Board trigger: "when a card is created" -> go to action.
    await boardPage.locator('.js-add-create-trigger.js-goto-action').first().click();

    // Board action: generic "move card to top/bottom of its list" -> save.
    await boardPage.locator('.js-add-gen-move-action.js-goto-rules').first().click();

    // The new rule appears in the list.
    await expect(boardPage.locator('.rules-lists-item')).toHaveCount(1, { timeout: 15_000 });
  });

  test('Import / Export dialog offers JSON and CSV export', async ({ boardPage, board }) => {
    await openRulesPage(boardPage, board);
    await boardPage.locator('.js-rules-import-export').click();
    const popup = boardPage.locator('.js-pop-over');
    await expect(popup).toBeVisible({ timeout: 10_000 });
    await expect(popup.locator('.js-rules-export-json')).toBeVisible();
    await expect(popup.locator('.js-rules-export-csv')).toBeVisible();
  });

  test('a board button rule renders a runnable button in the board header', async ({ boardPage, board }) => {
    await openRulesPage(boardPage, board);

    // Name the rule, go to the trigger step, choose the "Buttons" trigger tab.
    await boardPage.locator('#ruleTitle').fill('My board button');
    await boardPage.locator('.js-goto-trigger').click();
    await boardPage.locator('.js-set-button-triggers').click();

    // Configure a board button and continue to the action step.
    await boardPage.locator('#button-label').fill('Do the thing');
    await boardPage.locator('#button-type').selectOption('board');
    await boardPage.locator('.js-add-button-trigger.js-goto-action').click();

    // Pick any board action to complete the rule.
    await boardPage.locator('.js-add-gen-move-action.js-goto-rules').first().click();
    await expect(boardPage.locator('.rules-lists-item')).toHaveCount(1, { timeout: 15_000 });

    // Back on the board, the board button appears in the header and is clickable.
    await boardPage.goto(`/b/${board.boardId}/${board.slug}`, { waitUntil: 'commit' });
    const btn = boardPage.locator('.js-run-board-button');
    await expect(btn).toBeVisible({ timeout: 20_000 });
    await expect(btn).toContainText('Do the thing');
    // Clicking runs the rule via the rules.runButton method without error.
    await btn.click();
  });

  test('can select all rules and switch to the workflow view', async ({ boardPage, board }) => {
    await openRulesPage(boardPage, board);

    // Create a rule first so there is something to select / visualise.
    await boardPage.locator('#ruleTitle').fill('Rule A');
    await boardPage.locator('.js-goto-trigger').click();
    await boardPage.locator('.js-add-create-trigger.js-goto-action').first().click();
    await boardPage.locator('.js-add-gen-move-action.js-goto-rules').first().click();
    await expect(boardPage.locator('.rules-lists-item')).toHaveCount(1, { timeout: 15_000 });

    // Select all -> the rule checkbox becomes checked.
    await boardPage.locator('.js-rules-select-all').click();
    await expect(boardPage.locator('.js-rule-select').first()).toBeChecked();

    // Toggle the visual workflow view.
    await boardPage.locator('.js-rules-toggle-view').click();
    await expect(boardPage.locator('.rules-workflow')).toBeVisible({ timeout: 10_000 });
    await expect(boardPage.locator('.workflow-rule')).toHaveCount(1);
  });
});
