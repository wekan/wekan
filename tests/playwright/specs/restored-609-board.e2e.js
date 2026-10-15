'use strict';

// A board restored from WeKan 6.09 (upgrade report: after a 6.09 to 10.85
// dump and restore, one board with attachments showed only the loading
// animation). tests/fixtures/restored/wekan-6.09-board.json holds documents
// shaped exactly as 6.09 wrote them - derived from `git show v6.09:models/...`:
// CollectionFS attachments (cfs.attachments.filerecord + GridFS), a cover
// pointing at a filerecord, lists with swimlaneId '', members without the
// newer role flags, customFields by boardIds. They are restored into the
// test database as they are, and the board must load: the publication
// becomes ready, and the page shows the lists, not the spinner or the
// "could not be loaded" message.

const fs = require('node:fs');
const path = require('node:path');
const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const { navigateInApp } = require('../helpers/auth');

const FIXTURE = path.resolve(__dirname, '../../fixtures/restored/wekan-6.09-board.json');

// The fixture's ids, made unique for this run; its user is the test's user.
function restore(userId) {
  const suffix = db.uid('r');
  let text = fs.readFileSync(FIXTURE, 'utf8');
  const { collections } = JSON.parse(text);
  const ids = new Set();
  for (const docs of Object.values(collections)) for (const doc of docs) if (typeof doc._id === 'string') ids.add(doc._id);
  ids.delete('U609');
  text = text.replace(/"U609"/g, JSON.stringify(userId));
  for (const id of [...ids].sort((a, b) => b.length - a.length)) text = text.split(`"${id}"`).join(`"${id}-${suffix}"`);
  const restored = JSON.parse(text).collections;
  delete restored.users;
  // GridFS ids are ObjectIds; a fresh pair per run.
  const oid = () => ({ $oid: require('node:crypto').randomBytes(12).toString('hex') });
  const fileId = oid();
  for (const f of restored['cfs_gridfs.attachments.files'] || []) f._id = fileId;
  for (const c of restored['cfs_gridfs.attachments.chunks'] || []) { c._id = oid(); c.files_id = fileId; }
  for (const r of restored['cfs.attachments.filerecord'] || []) if (r.copies && r.copies.attachments) r.copies.attachments.key = fileId.$oid;
  for (const [name, docs] of Object.entries(restored)) if (docs.length) db.insertMany(name, docs);
  return { restored, boardId: restored.boards[0]._id, slug: restored.boards[0].slug || 'board' };
}

test('a board restored from WeKan 6.09, with CollectionFS attachments, loads', async ({ page, user }) => {
  const { loginWithToken } = require('../helpers/auth');
  const { restored, boardId, slug } = restore(user.id);
  try {
    await loginWithToken(page, user.id, user.token);
    // The publication itself: ready, or the error it stopped with.
    const result = await page.evaluate(id => new Promise(resolve => {
      const handle = Meteor.subscribe('board', id, false, {
        onReady() {
          const local = Meteor.connection._mongo_livedata_collections;
          resolve({ ready: true, board: !!local.boards?.findOne({ _id: id }), cards: local.cards?.find({ boardId: id }).count() || 0 });
          handle.stop();
        },
        onStop(error) { resolve({ ready: false, error: error ? `${error.error} ${error.reason || error.message}` : 'stopped' }); },
      });
    }), boardId);
    expect(result).toEqual({ ready: true, board: true, cards: restored.cards.length });

    // The page: lists and cards, not the spinner and not the load error.
    await navigateInApp(page, `/b/${boardId}/${slug}`);
    for (const list of restored.lists) {
      await expect(page.locator('.list-header-name, .js-list-name', { hasText: list.title }).first()).toBeVisible();
    }
    for (const card of restored.cards.filter(c => !c.archived)) {
      await expect(page.locator('.minicard', { hasText: card.title }).first()).toBeVisible();
    }
    await expect(page.locator('.big-message', { hasText: 'could not be loaded' })).toHaveCount(0);
  } finally {
    for (const [name, docs] of Object.entries(restored)) {
      for (const doc of docs) db.deleteOne(name, { _id: doc._id });
    }
  }
});
