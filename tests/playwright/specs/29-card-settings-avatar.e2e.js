'use strict';

/**
 * Spec 29 — Card Settings "Mark as complete" on minicards, and the Admin Panel
 * avatar-upload block.
 *
 *  - allowsDueCompleteOnMinicard: the card "Mark as complete" toggle is hidden on
 *    minicards by default, and shown when "Show at Minicard" is enabled in
 *    Board Settings > Card Settings.
 *  - #4740 limitSettings.avatarsUploadBlocked: admins can block users from
 *    uploading new avatars (Admin Panel > Attachments > Transfer limits); off by
 *    default so avatars stay enabled.
 */

const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const { openBoard } = require('../helpers/auth');
const BoardPage = require('../pages/BoardPage');

test.describe('Card Settings: "Mark as complete" on minicards', () => {
  test('complete toggle is hidden on minicards by default', async ({ loggedInPage, user }) => {
    const b = db.seedBoard({ ownerId: user.id, cardTitlesPerList: [['Done Me']] });
    try {
      await openBoard(loggedInPage, b.boardId, b.slug);
      const bp = new BoardPage(loggedInPage);
      // Wait for the minicard to render, then assert the toggle is absent.
      await expect
        .poll(async () =>
          (await bp.cardTitlesInList(b.listIds[0]).allInnerTexts()).map(s => s.trim()).join(','),
        )
        .toBe('Done Me');
      await expect(
        bp.list(b.listIds[0]).locator('.js-toggle-card-complete'),
      ).toHaveCount(0);
    } finally {
      db.cleanup({ boardIds: [b.boardId] });
    }
  });

  test('enabling "Show at Minicard" shows the complete toggle on minicards', async ({ loggedInPage, user }) => {
    const b = db.seedBoard({ ownerId: user.id, cardTitlesPerList: [['Done Me']] });
    try {
      db.updateOne('boards', { _id: b.boardId }, { $set: { allowsDueCompleteOnMinicard: true } });
      await openBoard(loggedInPage, b.boardId, b.slug);
      const bp = new BoardPage(loggedInPage);
      await expect(
        bp.list(b.listIds[0]).locator('.js-toggle-card-complete').first(),
      ).toBeVisible({ timeout: 15_000 });
    } finally {
      db.cleanup({ boardIds: [b.boardId] });
    }
  });
});

test.describe('#4740 Admin Panel: block avatar uploads', () => {
  // The setting is a global singleton document; reset it after each test so it
  // does not leak into other specs (no document = not blocked = avatars enabled).
  test.afterEach(() => {
    db.deleteMany('attachmentStorageSettings', {});
  });

  function isAvatarUploadBlocked(page) {
    return page.evaluate(
      () =>
        new Promise(resolve => {
          Meteor.call('isAvatarUploadBlocked', (err, res) =>
            resolve(err ? `ERROR:${err.reason || err.message}` : res),
          );
        }),
    );
  }

  test('avatar uploads are enabled by default', async ({ loggedInPage }) => {
    db.deleteMany('attachmentStorageSettings', {});
    expect(await isAvatarUploadBlocked(loggedInPage)).toBe(false);
  });

  test('avatarsUploadBlocked setting blocks avatar uploads', async ({ loggedInPage }) => {
    db.deleteMany('attachmentStorageSettings', {});
    db.insertOne('attachmentStorageSettings', {
      limitSettings: { avatarsUploadBlocked: true },
    });
    expect(await isAvatarUploadBlocked(loggedInPage)).toBe(true);
  });
});
