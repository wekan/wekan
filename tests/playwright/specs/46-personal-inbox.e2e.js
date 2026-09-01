'use strict';

const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const { loginWithToken } = require('../helpers/auth');

const BASE_URL = process.env.WEKAN_BASE_URL || 'http://localhost:3000';

function cleanupInbox(userId) {
  const boardId = `personal-inbox-${userId}`;
  db.deleteMany('attachments', { 'meta.boardId': boardId });
  db.deleteMany('cards', { boardId });
  db.deleteMany('lists', { boardId });
  db.deleteMany('swimlanes', { boardId });
  db.deleteMany('boards', { _id: boardId });
}

test.describe('Personal Inbox', () => {
  test('captures with provenance and moves the real card to a permitted list', async ({
    page,
    user,
    user2,
    board,
  }) => {
    const title = `Inbox contract ${Date.now()}`;
    cleanupInbox(user.id);
    cleanupInbox(user2.id);
    try {
      await loginWithToken(page, user.id, db.addResumeToken(user.id));
      await page.goto(`${BASE_URL}/inbox`, { waitUntil: 'networkidle' });

      await page.locator('.js-personal-inbox-title').fill(title);
      await page.locator('.js-personal-inbox-source-url')
        .fill('https://trello.com/c/parity-source');
      await page.locator('.js-personal-inbox-description')
        .fill('Persistent capture created through the product UI.');
      await page.locator('.js-personal-inbox-attachment').setInputFiles({
        name: 'inbox-source-note.txt',
        mimeType: 'text/plain',
        buffer: Buffer.from('Personal Inbox attachment contract.\n'),
      });
      await page.locator('.js-personal-inbox-submit').click();

      const item = page.locator('.js-personal-inbox-card', { hasText: title });
      await expect(item).toBeVisible({ timeout: 15_000 });
      const captured = db.findOne('cards', { title, capturedBy: user.id });
      expect(captured.boardId).toBe(`personal-inbox-${user.id}`);
      expect(captured.captureSourceType).toBe('quick-capture');
      expect(captured.captureSourceUrl).toBe('https://trello.com/c/parity-source');
      await expect.poll(() => db.countDocuments('attachments', {
        'meta.cardId': captured._id,
        name: 'inbox-source-note.txt',
      })).toBe(1);

      // Negative permission path: another authenticated user receives neither
      // the card nor authority to move it, even to a board id they know.
      await loginWithToken(page, user2.id, user2.token);
      await page.goto(`${BASE_URL}/inbox`, { waitUntil: 'networkidle' });
      await expect(page.locator('.js-personal-inbox-card', { hasText: title }))
        .toHaveCount(0);
      const denied = await page.evaluate(
        args => Meteor.callAsync(
          'personalInbox.move',
          args.cardId,
          args.boardId,
          args.listId,
        ).then(() => 'allowed').catch(error => error.error || error.reason),
        { cardId: captured._id, boardId: board.boardId, listId: board.listIds[0] },
      );
      expect(denied).toBe('not-authorized');

      await loginWithToken(page, user.id, user.token);
      await page.goto(`${BASE_URL}/inbox`, { waitUntil: 'networkidle' });
      const ownedItem = page.locator('.js-personal-inbox-card', { hasText: title });
      await expect(ownedItem).toBeVisible();
      await page.setViewportSize({ width: 375, height: 812 });
      await ownedItem.scrollIntoViewIfNeeded();
      await expect(ownedItem).toBeInViewport();

      const moveForm = ownedItem.locator('.js-personal-inbox-move');
      await moveForm.locator('.js-personal-inbox-board').selectOption(board.boardId);
      await moveForm.locator('.js-personal-inbox-list').selectOption(board.listIds[0]);
      await moveForm.locator('button[type="submit"]').click();
      await expect(ownedItem).toHaveCount(0, { timeout: 15_000 });

      await expect.poll(() => {
        const moved = db.findOne('cards', { _id: captured._id });
        return moved && `${moved.boardId}:${moved.listId}:${moved.captureSourceType}`;
      }).toBe(`${board.boardId}:${board.listIds[0]}:quick-capture`);
      const movedAttachment = db.findOne('attachments', { 'meta.cardId': captured._id });
      expect(movedAttachment.meta.boardId).toBe(board.boardId);
      expect(movedAttachment.meta.listId).toBe(board.listIds[0]);
    } finally {
      db.deleteMany('cards', { title });
      cleanupInbox(user.id);
      cleanupInbox(user2.id);
    }
  });
});
