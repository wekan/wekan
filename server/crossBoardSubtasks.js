// #1931: an existing card from ANOTHER board as a subtask, for a user who may
// write both boards. The same-board picker works from the open board's cards;
// a card of another board is looked up and attached here, with every check
// on the server: write access to the parent's and the child's board, no loop
// through any parent, and only an ordinary card.
import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
import { DDPRateLimiter } from 'meteor/ddp-rate-limiter';
import Boards from '/models/boards';
import Cards from '/models/cards';
import { allowIsBoardMemberWithWriteAccess } from '/server/lib/utils';

const { cardParentIds, withParentAdded, collectAllAncestorIds, wouldCreateParentCycle } = require('/models/lib/cardParents');

const NOT_ATTACHABLE = ['template-card', 'cardType-linkedCard', 'cardType-linkedBoard'];

async function writableBoard(userId, boardId) {
  const board = boardId && await Boards.findOneAsync(boardId);
  return board && !board.archived && allowIsBoardMemberWithWriteAccess(userId, board) ? board : null;
}

Meteor.methods({
  // Cards of `boardId` the caller may attach under `parentCardId`.
  async crossBoardSubtaskCandidates(parentCardId, boardId, term) {
    check(parentCardId, String);
    check(boardId, String);
    check(term, Match.Optional(String));
    if (!this.userId) throw new Meteor.Error('not-authorized');
    const parent = await Cards.findOneAsync(parentCardId, { fields: { boardId: 1, parentId: 1, parentIds: 1 } });
    if (!parent || !(await writableBoard(this.userId, parent.boardId)) || !(await writableBoard(this.userId, boardId))) {
      throw new Meteor.Error('not-authorized');
    }
    const ancestors = await collectAllAncestorIds(cardParentIds(parent),
      ids => Cards.find({ _id: { $in: ids } }, { fields: { parentId: 1, parentIds: 1 } }).fetchAsync());
    const selector = { boardId, archived: false, type: { $nin: NOT_ATTACHABLE },
      _id: { $nin: [parentCardId, ...ancestors] }, parentId: { $ne: parentCardId }, parentIds: { $ne: parentCardId } };
    const q = String(term || '').trim().slice(0, 100);
    if (q) selector.title = { $regex: q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' };
    return Cards.find(selector, { fields: { title: 1 }, sort: { sort: 1 }, limit: 50 }).fetchAsync();
  },

  async addCrossBoardSubtask(parentCardId, childCardId) {
    check(parentCardId, String);
    check(childCardId, String);
    if (!this.userId) throw new Meteor.Error('not-authorized');
    const parent = await Cards.findOneAsync(parentCardId);
    const child = await Cards.findOneAsync(childCardId);
    if (!parent || !child || child.archived || NOT_ATTACHABLE.includes(child.type)) throw new Meteor.Error('not-found');
    if (!(await writableBoard(this.userId, parent.boardId)) || !(await writableBoard(this.userId, child.boardId))) {
      throw new Meteor.Error('not-authorized');
    }
    const ancestors = await collectAllAncestorIds(cardParentIds(parent),
      ids => Cards.find({ _id: { $in: ids } }, { fields: { parentId: 1, parentIds: 1 } }).fetchAsync());
    if (wouldCreateParentCycle(child._id, parent._id, ancestors)) throw new Meteor.Error('subtask-cycle');
    await Cards.updateAsync(child._id, { $set: withParentAdded(child, parent._id) });
    return true;
  },
});

for (const name of ['crossBoardSubtaskCandidates', 'addCrossBoardSubtask']) {
  DDPRateLimiter.addRule({ type: 'method', name, connectionId: () => true }, 30, 10000);
}
