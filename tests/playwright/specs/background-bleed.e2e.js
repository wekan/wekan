'use strict';
// BackgroundBleed (2026-10-02): a board admin could point their board's
// background at another board's attachment and download it through the
// background API.
const fs = require('fs');
const path = require('path');
const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const { loginWithToken, openBoard } = require('../helpers/auth');

const dir = path.join(process.env.WEKAN_FILES_PATH || path.join(__dirname, '..', '..', '..', '.build', 'bundle', 'files'), 'attachments');

test('another board\'s attachment cannot become, or be read as, a background', async ({ page, request, user, user2, board }) => {
  const victim = db.seedBoard({ ownerId: user2.id, cardTitlesPerList: [['Secret']] });
  const id = `bgbleed${Date.now()}`;
  fs.mkdirSync(dir, { recursive: true });
  const stored = path.join(dir, id);
  fs.writeFileSync(stored, 'private victim file');
  db.insertOne('attachments', { _id: id, name: 'secret.txt', size: 19, type: 'text/plain',
    meta: { boardId: victim.boardId, cardId: db.find('cards', { boardId: victim.boardId })[0]._id },
    versions: { original: { path: stored, name: 'secret.txt', size: 19, type: 'text/plain', extension: 'txt', storage: 'fs' } } });
  try {
    await loginWithToken(page, user.id, user.token);
    await openBoard(page, board.boardId, board.slug);
    const set = await page.evaluate(async ({ boardId, id }) => {
      try { await Meteor.callAsync('/boards/update', { _id: boardId }, { $set: { backgroundImageId: id } }); return 'set'; }
      catch (error) { return 'denied'; }
    }, { boardId: board.boardId, id });
    expect(set).toBe('denied');
    expect(db.getBoard(board.boardId).backgroundImageId || '').not.toBe(id);
    // A pointer that was planted before the fix is not served either.
    db.updateOne('boards', { _id: board.boardId }, { $set: { backgroundImageId: id } });
    const res = await request.get(`/api/attachment/download-background/${board.boardId}`, {
      headers: { Authorization: `Bearer ${user.token}` },
    });
    expect(res.status()).toBe(404);
    expect(await res.text()).not.toContain('private victim file');
    await expect.poll(() => db.findOne('eventlog', { bleed: 'BackgroundBleed' })?.count).toBeGreaterThanOrEqual(1);
  } finally {
    db.updateOne('boards', { _id: board.boardId }, { $set: { backgroundImageId: '' } });
    db.deleteOne('attachments', { _id: id });
    fs.rmSync(stored, { force: true });
    db.cleanup({ boardIds: [victim.boardId] });
  }
});
