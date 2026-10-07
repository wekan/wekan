'use strict';
const { openRulesMenuEntry } = require('../helpers/rulesMenu');

/**
 * Spec 44 — Board Rules page (#6489, #6490).
 *
 *  - #6489: Rules → Workflow view renders the trigger/action palette (it threw
 *    "ReferenceError: TAPi18n is not defined" before the import fix, so the palette
 *    rendered nothing) and a rule can be built and added.
 *  - #6490: in the Rules list view, Delete and "View rule" act on the CLICKED rule,
 *    not the first one (the handlers used the parent data context, so the id was null
 *    — delete failed with "Match failed" and View always opened the first rule).
 */

const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const { loginWithToken, navigateInApp } = require('../helpers/auth');

const BASE_URL = process.env.WEKAN_BASE_URL || 'http://localhost:3000';

function seedRules(boardId) {
  const ids = {
    trgA: 'e2e-trg-alpha', trgB: 'e2e-trg-beta',
    actA: 'e2e-act-alpha', actB: 'e2e-act-beta',
    ruleA: 'e2e-rule-alpha', ruleB: 'e2e-rule-beta',
  };
  const now = new Date();
  // Idempotent: clear any leftovers from a previous run.
  db.deleteMany('triggers', { _id: { $in: [ids.trgA, ids.trgB] } });
  db.deleteMany('actions', { _id: { $in: [ids.actA, ids.actB] } });
  db.deleteMany('rules', { _id: { $in: [ids.ruleA, ids.ruleB] } });

  db.insertMany('triggers', [
    { _id: ids.trgA, boardId, desc: 'trigger alpha', activityType: 'createCard', createdAt: now, modifiedAt: now },
    { _id: ids.trgB, boardId, desc: 'trigger beta', activityType: 'createCard', createdAt: now, modifiedAt: now },
  ]);
  db.insertMany('actions', [
    { _id: ids.actA, boardId, desc: 'action alpha', actionType: 'moveCardToTop', createdAt: now, modifiedAt: now },
    { _id: ids.actB, boardId, desc: 'action beta', actionType: 'moveCardToTop', createdAt: now, modifiedAt: now },
  ]);
  db.insertMany('rules', [
    { _id: ids.ruleA, title: 'Rule Alpha', boardId, triggerId: ids.trgA, actionId: ids.actA, createdAt: now, modifiedAt: now },
    { _id: ids.ruleB, title: 'Rule Beta', boardId, triggerId: ids.trgB, actionId: ids.actB, createdAt: now, modifiedAt: now },
  ]);
  return ids;
}

function cleanupRules(ids) {
  db.deleteMany('triggers', { _id: { $in: [ids.trgA, ids.trgB] } });
  db.deleteMany('actions', { _id: { $in: [ids.actA, ids.actB] } });
  db.deleteMany('rules', { _id: { $in: [ids.ruleA, ids.ruleB] } });
}

test.describe('Board Rules', () => {
  test.use({ storageState: undefined });

  test('#6490: Rules list — Delete and View act on the clicked rule, not the first', async ({ page, adminUser }) => {
    const board = await db.seedBoard({ ownerId: adminUser.id, title: 'Rules List Board' });
    const ids = seedRules(board.boardId);
    try {
      await loginWithToken(page, adminUser.id, adminUser.token);
      await navigateInApp(page, `/b/${board.boardId}/${board.slug}/rules`);

      // Both rules are listed (default = list view).
      const items = page.locator('ul.rules-list li.rules-lists-item');
      await expect(items.filter({ hasText: 'Rule Alpha' })).toBeVisible({ timeout: 15_000 });
      await expect(items.filter({ hasText: 'Rule Beta' })).toBeVisible();

      // View the SECOND rule (Beta) — its details must show Beta's trigger/action,
      // not the first rule's (the bug always opened the first rule).
      await page.locator(`button.js-goto-details[data-rule-id="${ids.ruleB}"]`).click();
      const details = page.locator('.triggers-content');
      await expect(details).toContainText('Trigger beta', { timeout: 10_000 });
      await expect(details).not.toContainText('Trigger alpha');
      // Back to the list.
      await page.locator('button.js-goback').click();

      // Delete the SECOND rule (Beta). Before the fix this sent null and failed with
      // "Match failed"; now it removes exactly Beta and leaves Alpha.
      await page.locator(`button.js-delete-rule[data-rule-id="${ids.ruleB}"]`).click();
      await expect(page.locator('ul.rules-list li.rules-lists-item').filter({ hasText: 'Rule Beta' }))
        .toHaveCount(0, { timeout: 10_000 });
      await expect(page.locator('ul.rules-list li.rules-lists-item').filter({ hasText: 'Rule Alpha' }))
        .toBeVisible();

      // Confirmed server-side: Beta is gone, Alpha remains.
      await expect
        .poll(() => db.find('rules', { _id: { $in: [ids.ruleA, ids.ruleB] } }).map(r => r._id).sort().join(','),
          { timeout: 10_000 })
        .toBe(ids.ruleA);
    } finally {
      cleanupRules(ids);
      db.cleanup({ boardIds: [board.boardId] });
    }
  });

  test('#6749: Rules list — Select all / Unselect all visibly tick and untick every rule', async ({ page, adminUser }) => {
    const board = await db.seedBoard({ ownerId: adminUser.id, title: 'Rules Select All Board' });
    const ids = seedRules(board.boardId);
    try {
      await loginWithToken(page, adminUser.id, adminUser.token);
      await navigateInApp(page, `/b/${board.boardId}/${board.slug}/rules`);
      const boxes = page.locator('ul.rules-list li.rules-lists-item input.js-rule-select');
      await expect(boxes).toHaveCount(2, { timeout: 15_000 });

      // The bug: forms.css hid every native checkbox, so the boxes these buttons
      // change were never on screen. toBeChecked() alone passed while they were
      // invisible - visibility and a real size are what the reporter could not see.
      for (const box of await boxes.all()) {
        await expect(box).toBeVisible();
        const size = await box.boundingBox();
        expect(size && size.width).toBeGreaterThan(8);
        expect(size && size.height).toBeGreaterThan(8);
        await expect(box).not.toBeChecked();
      }

      await page.locator('.js-rules-select-all').click();
      for (const box of await boxes.all()) {
        await expect(box).toBeVisible();
        await expect(box).toBeChecked();
      }

      await page.locator('.js-rules-select-none').click();
      for (const box of await boxes.all()) {
        await expect(box).toBeVisible();
        await expect(box).not.toBeChecked();
      }

      // A single rule can be ticked by hand, and Select all then completes it.
      await boxes.first().click();
      await expect(boxes.first()).toBeChecked();
      await expect(boxes.nth(1)).not.toBeChecked();
      await page.locator('.js-rules-select-all').click();
      await expect(boxes.nth(1)).toBeChecked();
    } finally {
      cleanupRules(ids);
      db.cleanup({ boardIds: [board.boardId] });
    }
  });

  test('#6489: Rules Workflow view renders the palette and can add a rule', async ({ page, adminUser }) => {
    const board = await db.seedBoard({ ownerId: adminUser.id, title: 'Rules Workflow Board' });
    try {
      await loginWithToken(page, adminUser.id, adminUser.token);
      await navigateInApp(page, `/b/${board.boardId}/${board.slug}/rules`);

      // Switch to the Workflow view, from Board Settings / Rules in the board sidebar.
      await openRulesMenuEntry(page, 'js-open-rules-workflow-view');

      // The palette renders with LABELLED chips. This is the exact signature of the
      // #6489 bug: before the import fix, paletteLabel() threw "ReferenceError:
      // TAPi18n is not defined" inside the triggerPalette()/actionPalette() helpers,
      // so the each rendered no chips at all (and persistRule threw the same way).
      const triggerChips = page.locator('.js-trigger-chip');
      const actionChips = page.locator('.js-action-chip');
      await expect(triggerChips.first()).toBeVisible({ timeout: 15_000 });
      await expect(actionChips.first()).toBeVisible();
      expect(await triggerChips.count()).toBeGreaterThan(0);
      expect(await actionChips.count()).toBeGreaterThan(0);
      // The chip labels are non-empty translated strings (paletteLabel worked).
      expect(((await triggerChips.first().innerText()) || '').trim().length).toBeGreaterThan(0);
      expect(((await actionChips.first().innerText()) || '').trim().length).toBeGreaterThan(0);
      // The builder slots and Add Rule control are present (the view is functional).
      await expect(page.locator('.js-when-slot')).toBeVisible();
      await expect(page.locator('.js-then-slot')).toBeVisible();
      await expect(page.locator('.js-create-workflow-rule')).toBeVisible();
    } finally {
      db.deleteMany('rules', { boardId: board.boardId });
      db.deleteMany('triggers', { boardId: board.boardId });
      db.deleteMany('actions', { boardId: board.boardId });
      db.cleanup({ boardIds: [board.boardId] });
    }
  });
});
