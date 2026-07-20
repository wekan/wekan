'use strict';

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
const { loginWithToken } = require('../helpers/auth');

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
      await page.goto(`${BASE_URL}/b/${board.boardId}/${board.slug}/rules`, { waitUntil: 'networkidle' });

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

  test('#6489: Rules Workflow view renders the palette and can add a rule', async ({ page, adminUser }) => {
    const board = await db.seedBoard({ ownerId: adminUser.id, title: 'Rules Workflow Board' });
    try {
      await loginWithToken(page, adminUser.id, adminUser.token);
      await page.goto(`${BASE_URL}/b/${board.boardId}/${board.slug}/rules`, { waitUntil: 'networkidle' });

      // Switch to the Workflow view.
      await page.locator('.js-rules-toggle-view').click();

      // The palette renders. Before the import fix, paletteLabel() threw
      // "ReferenceError: TAPi18n is not defined", so triggerPalette()/actionPalette()
      // rendered no chips at all — this assertion catches exactly that.
      const triggerChips = page.locator('.js-trigger-chip');
      const actionChips = page.locator('.js-action-chip');
      await expect(triggerChips.first()).toBeVisible({ timeout: 15_000 });
      await expect(actionChips.first()).toBeVisible();

      // Build a rule: drag a trigger into the When slot and an action into the Then
      // slot, then Add Rule.
      await triggerChips.first().dragTo(page.locator('.js-when-slot'));
      await actionChips.first().dragTo(page.locator('.js-then-slot'));
      await page.locator('.js-workflow-rule-title').fill('Workflow Rule 1');
      const addBtn = page.locator('.js-create-workflow-rule');
      await expect(addBtn).toBeEnabled({ timeout: 10_000 });
      await addBtn.click();

      // The new rule appears in the board rules list and is persisted.
      await expect(page.locator('.js-rule-node')).toHaveCount(1, { timeout: 10_000 });
      await expect
        .poll(() => db.find('rules', { boardId: board.boardId }).length, { timeout: 10_000 })
        .toBeGreaterThanOrEqual(1);
    } finally {
      db.deleteMany('rules', { boardId: board.boardId });
      db.deleteMany('triggers', { boardId: board.boardId });
      db.deleteMany('actions', { boardId: board.boardId });
      db.cleanup({ boardIds: [board.boardId] });
    }
  });
});
