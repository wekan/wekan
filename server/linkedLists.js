// #2809: linked whole lists (models/lib/linkedList.js).
import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { DDPRateLimiter } from 'meteor/ddp-rate-limiter';
import Boards from '/models/boards';
import Cards from '/models/cards';
import Lists from '/models/lists';
import { allowIsBoardMemberWithWriteAccess } from '/server/lib/utils';
import { canWriteInList } from '/server/lib/listPermissionGate';

const { isLinkedList, validLink } = require('/models/lib/linkedList');

async function visibleBoard(userId, boardId) {
  const board = boardId && await Boards.findOneAsync(boardId);
  return board && !board.archived && typeof board.isVisibleBy === 'function' && board.isVisibleBy({ _id: userId }) ? board : null;
}

// The source list's cards, and its board's labels for the minicards - only
// to a subscriber who may see BOTH boards.
Meteor.publish('linkedListCards', async function (listId) {
  check(listId, String);
  if (!this.userId) return this.ready();
  const list = await Lists.findOneAsync(listId);
  if (!isLinkedList(list)) return this.ready();
  if (!(await visibleBoard(this.userId, list.boardId)) || !(await visibleBoard(this.userId, list.linkedBoardId))) return this.ready();
  return [
    Cards.find({ boardId: list.linkedBoardId, listId: list.linkedListId, archived: false }, { limit: 1000 }),
    Boards.find({ _id: list.linkedBoardId }, { fields: { title: 1, slug: 1, labels: 1, permission: 1, members: 1, color: 1 } }),
  ];
});

Meteor.methods({
  // The lists of a board the caller sees, for the "link a list" picker.
  async linkableLists(boardId) {
    check(boardId, String);
    if (!this.userId) throw new Meteor.Error('not-authorized');
    if (!(await visibleBoard(this.userId, boardId))) throw new Meteor.Error('not-authorized');
    return Lists.find({ boardId, archived: { $ne: true }, linkedListId: { $exists: false } },
      { fields: { title: 1 }, sort: { sort: 1 }, limit: 500 }).fetchAsync();
  },

  // Make a linked list on `boardId` mirroring `sourceListId` of `sourceBoardId`.
  async createLinkedList(input) {
    check(input, { boardId: String, sourceBoardId: String, sourceListId: String });
    if (!this.userId) throw new Meteor.Error('not-authorized');
    const board = await Boards.findOneAsync(input.boardId);
    if (!board || board.archived || !allowIsBoardMemberWithWriteAccess(this.userId, board)) throw new Meteor.Error('not-authorized');
    if (!(await visibleBoard(this.userId, input.sourceBoardId))) throw new Meteor.Error('not-authorized');
    const sourceList = await Lists.findOneAsync(input.sourceListId);
    if (!validLink({ ...input, sourceList })) throw new Meteor.Error('linked-list-invalid');
    const last = await Lists.findOneAsync({ boardId: board._id, archived: { $ne: true } }, { sort: { sort: -1 }, fields: { sort: 1 } });
    return Lists.insertAsync({
      title: sourceList.title || '',
      boardId: board._id,
      sort: last && Number.isFinite(last.sort) ? last.sort + 1 : 0,
      type: 'linked',
      linkedBoardId: input.sourceBoardId,
      linkedListId: input.sourceListId,
    });
  },

  // A card typed into a linked list goes to the source list, by the source
  // board's rules.
  async addCardToLinkedList(listId, title) {
    check(listId, String);
    check(title, String);
    if (!this.userId) throw new Meteor.Error('not-authorized');
    const list = await Lists.findOneAsync(listId);
    if (!isLinkedList(list)) throw new Meteor.Error('not-found');
    if (!(await visibleBoard(this.userId, list.boardId))) throw new Meteor.Error('not-authorized');
    const source = await Boards.findOneAsync(list.linkedBoardId);
    const sourceList = await Lists.findOneAsync({ _id: list.linkedListId, boardId: list.linkedBoardId, archived: { $ne: true } });
    if (!source || source.archived || !sourceList) throw new Meteor.Error('not-found');
    if (!(await canWriteInList(this.userId, source, sourceList._id))) throw new Meteor.Error('not-authorized');
    const clean = title.replace(/\s+/g, ' ').trim().slice(0, 1000);
    if (!clean) throw new Meteor.Error('linked-list-empty-title');
    const swimlane = await source.getDefaultSwimlineAsync();
    const last = await Cards.findOneAsync({ listId: sourceList._id, archived: false }, { sort: { sort: -1 }, fields: { sort: 1 } });
    return Cards.insertAsync({ title: clean, boardId: source._id, listId: sourceList._id, swimlaneId: swimlane && swimlane._id,
      sort: last && Number.isFinite(last.sort) ? last.sort + 1 : 0, type: 'cardType-card',
      cardNumber: await source.getNextCardNumber(), userId: this.userId });
  },
});

for (const name of ['createLinkedList', 'addCardToLinkedList', 'linkableLists']) {
  DDPRateLimiter.addRule({ type: 'method', name, connectionId: () => true }, 20, 10000);
}
