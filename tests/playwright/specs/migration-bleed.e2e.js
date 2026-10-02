'use strict';
// MigrationBleed (2026-10-02): the attachment migration progress methods sent
// whole stored attachment documents - storage paths included - to anybody who
// could read the board. They answer with attachment ids only.
const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const { loginWithToken, openBoard } = require('../helpers/auth');

test('migration progress carries attachment ids, not stored documents', async ({ page, user, board }) => {
  const id = `migleak${Date.now()}`;
  const card = db.find('cards', { boardId: board.boardId })[0];
  // An old-shape attachment (no meta.listId) is one the migration reports.
  db.insertOne('attachments', { _id: id, name: 'old.txt', size: 1, type: 'text/plain', userId: user.id,
    meta: { boardId: board.boardId, cardId: card._id },
    versions: { original: { path: '/srv/wekan/files/attachments/secret-path', name: 'old.txt', size: 1, type: 'text/plain', storage: 'fs' } } });
  try {
    await loginWithToken(page, user.id, user.token);
    await openBoard(page, board.boardId, board.slug);
    const answers = await page.evaluate(async boardId => ({
      progress: await Meteor.callAsync('attachmentMigration.getProgress', boardId),
      unconverted: await Meteor.callAsync('attachmentMigration.getUnconvertedAttachments', boardId),
    }), board.boardId);
    expect(answers.unconverted).toEqual([{ _id: id }]);
    expect(answers.progress.unconvertedAttachments).toEqual([{ _id: id }]);
    expect(JSON.stringify(answers)).not.toContain('secret-path');
  } finally {
    db.deleteMany('attachments', { _id: id });
  }
});
