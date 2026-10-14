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
const { suggestKey, isValidKey, normalizeKey } = require('/models/lib/boardKey');

let queue = Promise.resolve();
const serial = job => {
  const next = queue.then(job, job);
  queue = next.catch(() => {});
  return next;
};

async function takenKeys(exceptBoardId = null) {
  const docs = await Boards.find({ key: { $exists: true } }, { fields: { key: 1 } }).fetchAsync();
  return new Set(docs.filter(d => d._id !== exceptBoardId && d.key).map(d => d.key));
}

function assignKey(boardId) {
  return serial(async () => {
    const board = await Boards.findOneAsync(boardId, { fields: { title: 1, key: 1 } });
    if (!board || isValidKey(board.key)) return board && board.key;
    const key = suggestKey(board.title, await takenKeys(boardId));
    await Boards.direct.updateAsync(boardId, { $set: { key } });
    return key;
  });
}

Boards.after.insert((userId, doc) => {
  if (!isValidKey(doc.key)) assignKey(doc._id).catch(error => console.error('board key:', error));
});

// Every board from before keys existed gets one, in the background.
Meteor.startup(() => {
  Meteor.defer(async () => {
    try {
      const missing = await Boards.find({ $or: [{ key: { $exists: false } }, { key: null }, { key: '' }] }, { fields: { _id: 1 } }).fetchAsync();
      for (const { _id } of missing) await assignKey(_id);
      if (missing.length) console.log(`Board keys: gave ${missing.length} boards a key.`);
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
      if ((await takenKeys(boardId)).has(key)) throw new Meteor.Error('board-key-taken');
      await Boards.updateAsync(boardId, { $set: { key } });
      return key;
    });
  },
});

export { assignKey };
