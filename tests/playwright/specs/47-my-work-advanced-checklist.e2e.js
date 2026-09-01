'use strict';

const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const { loginWithToken } = require('../helpers/auth');

const BASE_URL = process.env.WEKAN_BASE_URL || 'http://localhost:3000';

test.describe('My Work and Advanced Checklist', () => {
  test('scopes metadata writes and aggregates assigned checklist work', async ({
    page,
    user,
    user2,
    board,
  }) => {
    const cardId = db.findCardIdByTitle({
      boardId: board.boardId,
      title: 'Alpha Card',
    });
    const checklistId = db.uid('workchecklist');
    const itemId = db.uid('workitem');
    const now = new Date();
    const dueAt = new Date(now.getTime() + 48 * 60 * 60 * 1000);
    const remindAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    db.insertOne('checklists', {
      _id: checklistId,
      title: 'My Work E2E',
      cardId,
      boardId: board.boardId,
      sort: 0,
      createdAt: now,
      modifiedAt: now,
    });
    db.insertOne('checklistItems', {
      _id: itemId,
      title: 'Permission-scoped checklist work',
      checklistId,
      cardId,
      boardId: board.boardId,
      sort: 0,
      isFinished: false,
      createdAt: now,
      modifiedAt: now,
    });

    try {
      await loginWithToken(page, user2.id, user2.token);
      const denied = await page.evaluate(
        args => Meteor.callAsync(
          'checklistItems.setWorkMetadata',
          args.itemId,
          args.payload,
        ).then(() => 'allowed').catch(error => error.error || error.reason),
        {
          itemId,
          payload: { assigneeId: user2.id, dueAt, remindAt },
        },
      );
      expect(denied).toBe('not-authorized');

      await loginWithToken(page, user.id, user.token);
      const callResult = await page.evaluate(
        args => Meteor.callAsync('checklistItems.setWorkMetadata', args.itemId, args.payload)
          .then(result => ({ ok: true, result }))
          .catch(error => ({
            ok: false,
            error: error.error,
            reason: error.reason,
            details: error.details,
            message: error.message,
          })),
        {
          itemId,
          payload: { assigneeId: user.id, dueAt, remindAt },
        },
      );
      expect(callResult).toEqual(expect.objectContaining({ ok: true }));
      const result = callResult.result;
      expect(result.itemId).toBe(itemId);

      await page.goto(`${BASE_URL}/my-work`, { waitUntil: 'networkidle' });
      const workItem = page.locator('.my-work-entry', {
        hasText: 'Permission-scoped checklist work',
      });
      await expect(workItem).toBeVisible({ timeout: 15_000 });
      await expect(workItem).toContainText('Alpha Card');

      await page.locator('.js-my-work-filter[data-filter="upcoming"]').click();
      await expect(workItem).toBeVisible();
      await page.locator('.js-my-work-filter[data-filter="assigned"]').click();
      await expect(workItem).toBeVisible();

      await page.setViewportSize({ width: 375, height: 812 });
      await workItem.scrollIntoViewIfNeeded();
      await expect(workItem).toBeInViewport();

      const stored = db.findOne('checklistItems', { _id: itemId });
      expect(stored.assigneeId).toBe(user.id);
      expect(new Date(stored.dueAt).toISOString()).toBe(dueAt.toISOString());
      expect(new Date(stored.remindAt).toISOString()).toBe(remindAt.toISOString());
    } finally {
      db.deleteMany('activities', { checklistItemId: itemId });
      db.deleteOne('checklistItems', { _id: itemId });
      db.deleteOne('checklists', { _id: checklistId });
    }
  });
});
