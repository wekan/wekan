import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import Boards from '/models/boards';
import { allowIsBoardAdminOrSiteAdmin } from '/server/lib/utils';

// Board keys (#2449, #2450; every board has one, decided 2026-10-14): a new
// board gets one suggested from its title, every board from before gets one at
// startup, and a board admin can change it (setBoardKey). Pure rules in
// models/lib/boardKey.js.
//
// Keys are unique. Every key this server writes goes through one queue, so
// two boards created at the same moment cannot take the same key; the check
// against the database happens inside that queue.
const { suggestKey, keyPrefix, planBoardKeys, isValidKey, normalizeKey } = require('/models/lib/boardKey');
import { ensureIndex } from '/server/lib/mongoStartup';

const BATCH = 1000;
const escapeRegExp = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

let queue = Promise.resolve();
const serial = job => {
  const next = queue.then(job, job);
  queue = next.catch(() => {});
  return next;
};

// #6767: the keys in use that could collide - only those starting like the
// suggestion (an index range on `key`), not every key of the instance, which
// made every new board read all of them.
async function takenKeys(exceptBoardId, prefix) {
  const selector = prefix ? { key: { $regex: `^${escapeRegExp(prefix)}` } } : { key: { $exists: true } };
  const docs = await Boards.rawCollection().find(selector, { projection: { key: 1 } }).toArray();
  return new Set(docs.filter(d => d._id !== exceptBoardId && d.key).map(d => d.key));
}

function assignKey(boardId) {
  return serial(async () => {
    const board = await Boards.findOneAsync(boardId, { fields: { title: 1, key: 1 } });
    if (!board || isValidKey(board.key)) return board && board.key;
    const key = suggestKey(board.title, await takenKeys(boardId, keyPrefix(board.title)));
    await Boards.direct.updateAsync(boardId, { $set: { key } });
    return key;
  });
}

// #6767: every board without a key, at once - the keys in use read ONCE, the
// new ones planned in memory (models/lib/boardKey.js planBoardKeys, linear),
// and written in batches. Each write sets a key only where there still is
// none, so a key a board admin set meanwhile is never replaced. In the same
// queue as every other key write, so nothing can take a planned key between
// the plan and the write. It used to re-read every key for every board: on
// 32,500 boards, hours of slow queries.
async function backfillKeys() {
  return serial(async () => {
    const missingSelector = { $or: [{ key: { $exists: false } }, { key: null }, { key: '' }] };
    const missing = await Boards.rawCollection().find(missingSelector, { projection: { title: 1 } }).toArray();
    if (!missing.length) return 0;
    const plan = planBoardKeys(missing, await takenKeys(null, ''));
    let written = 0;
    for (let i = 0; i < plan.length; i += BATCH) {
      const ops = plan.slice(i, i + BATCH).map(({ _id, key }) => ({
        updateOne: { filter: { _id, ...missingSelector }, update: { $set: { key } } },
      }));
      // eslint-disable-next-line no-await-in-loop
      const result = await Boards.rawCollection().bulkWrite(ops, { ordered: false });
      written += result.modifiedCount || 0;
    }
    return written;
  });
}

Boards.after.insert((userId, doc) => {
  if (!isValidKey(doc.key)) assignKey(doc._id).catch(error => console.error('board key:', error));
});

// Every board from before keys existed gets one, in the background.
Meteor.startup(() => {
  Meteor.defer(async () => {
    try {
      // The key lookups above are index ranges, not collection scans.
      await ensureIndex(Boards, { key: 1 });
      const written = await backfillKeys();
      if (written) console.log(`Board keys: gave ${written} boards a key.`);
    } catch (error) {
      console.error('Board keys: could not give every board a key:', error);
    }
  });
});

Meteor.methods({
  async setBoardKey(boardId, input) {
    check(boardId, String);
    check(input, String);
    const board = await Boards.findOneAsync(boardId);
    if (!board || !(await allowIsBoardAdminOrSiteAdmin(this.userId, board))) throw new Meteor.Error('not-authorized');
    const key = normalizeKey(input);
    if (!isValidKey(key)) throw new Meteor.Error('board-key-invalid');
    return serial(async () => {
      if ((await takenKeys(boardId, key)).has(key)) throw new Meteor.Error('board-key-taken');
      await Boards.updateAsync(boardId, { $set: { key } });
      return key;
    });
  },
});

export { assignKey, backfillKeys };
