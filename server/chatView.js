// Board View / Chat, the channel tree (models/lib/chatView.js buildChannelTree):
// which cards on the member's boards have a conversation, how many messages
// each has and how many of them this member has not read yet, and, for a board
// the member opens in the tree, all of its swimlanes, lists and cards.
//
// Only what the member may read: boards they see in All Boards; on a board
// where they see only cards assigned to them, only those; on a board where
// their role reads no comments, no conversation at all.
import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { DDPRateLimiter } from 'meteor/ddp-rate-limiter';
import Cards from '/models/cards';
import CardComments from '/models/cardComments';
import Lists from '/models/lists';
import Swimlanes from '/models/swimlanes';
import Boards from '/models/boards';
import { ReactiveCache } from '/imports/reactiveCache';
import { visibleAllBoards } from '/server/allBoardsFacets';

const { isAssignedOnlyMember } = require('/models/lib/boardCardScope');

const MAX_CHANNELS = 5000;
const MAX_BOARD_CARDS = 3000;

const readsComments = (board, userId) => {
  const member = (board.members || []).find(m => m && m.userId === userId);
  return !(member && member.isNoComments);
};

// { cardId: { count, lastAt } } for the cards of these boards that have comments.
async function commentTotals(boardIds) {
  const totals = {};
  try {
    const rows = await CardComments.rawCollection().aggregate([
      { $match: { boardId: { $in: boardIds } } },
      { $group: { _id: '$cardId', n: { $sum: 1 }, lastAt: { $max: '$createdAt' } } },
    ]).toArray();
    for (const row of rows) if (row && row._id) totals[row._id] = { count: row.n, lastAt: row.lastAt };
  } catch (error) {
    // Aggregation may be unavailable on some storage backends: fold in memory.
    const comments = await CardComments.find({ boardId: { $in: boardIds } }, { fields: { cardId: 1, createdAt: 1 } }).fetchAsync();
    for (const c of comments) {
      const t = totals[c.cardId] || (totals[c.cardId] = { count: 0, lastAt: null });
      t.count += 1;
      if (!t.lastAt || (c.createdAt && c.createdAt > t.lastAt)) t.lastAt = c.createdAt;
    }
  }
  return totals;
}

async function visibleBoardsFor(userId) {
  const user = await ReactiveCache.getUser(userId);
  if (!user) return { user: null, boards: [] };
  return { user, boards: await visibleAllBoards(user, { title: 1, slug: 1, members: 1, permission: 1 }) };
}

// The cards an assigned-only member sees on such a board.
async function assignedCardIds(boardIds, userId) {
  if (!boardIds.length) return new Set();
  const cards = await Cards.find({ boardId: { $in: boardIds }, $or: [{ assignees: userId }, { members: userId }] },
    { fields: { _id: 1 } }).fetchAsync();
  return new Set(cards.map(c => c._id));
}

Meteor.methods({
  async chatViewChannels() {
    if (!this.userId) throw new Meteor.Error('not-authorized');
    const { user, boards } = await visibleBoardsFor(this.userId);
    if (!user) return { boards: [], channels: [], swimlanes: [], lists: [] };
    const talking = boards.filter(b => readsComments(b, this.userId));
    const limitedBoards = talking.filter(b => isAssignedOnlyMember(b, this.userId)).map(b => b._id);
    const mine = await assignedCardIds(limitedBoards, this.userId);
    const totals = await commentTotals(talking.map(b => b._id));
    const cardIds = Object.keys(totals).slice(0, MAX_CHANNELS);
    const cards = (await Cards.find({ _id: { $in: cardIds }, archived: false },
      { fields: { title: 1, boardId: 1, swimlaneId: 1, listId: 1, sort: 1 } }).fetchAsync())
      .filter(card => !limitedBoards.includes(card.boardId) || mine.has(card._id));
    // Unread: messages from others after this member last opened the card -
    // every one of them on a card never opened (models/lib/unreadComments.js).
    const views = (user.profile && user.profile.cardLastViews) || {};
    const candidates = cards.filter(card => {
      const seen = views[card._id] ? new Date(views[card._id]) : null;
      const last = totals[card._id].lastAt ? new Date(totals[card._id].lastAt) : null;
      return !seen || (last && last > seen);
    }).map(card => card._id);
    const unread = {};
    if (candidates.length) {
      const fresh = await CardComments.find({ cardId: { $in: candidates }, userId: { $ne: this.userId } },
        { fields: { cardId: 1, createdAt: 1 } }).fetchAsync();
      for (const c of fresh) {
        const seen = views[c.cardId] ? new Date(views[c.cardId]) : null;
        if (!seen || (c.createdAt && new Date(c.createdAt) > seen)) unread[c.cardId] = (unread[c.cardId] || 0) + 1;
      }
    }
    const swimlaneIds = [...new Set(cards.map(c => c.swimlaneId).filter(Boolean))];
    const listIds = [...new Set(cards.map(c => c.listId).filter(Boolean))];
    const swimlanes = await Swimlanes.find({ _id: { $in: swimlaneIds } }, { fields: { title: 1, boardId: 1, sort: 1 } }).fetchAsync();
    const lists = await Lists.find({ _id: { $in: listIds } }, { fields: { title: 1, boardId: 1, sort: 1 } }).fetchAsync();
    return {
      boards: boards.map(b => ({ _id: b._id, title: b.title || '', slug: b.slug || 'board' })),
      channels: cards.map(card => ({ cardId: card._id, boardId: card.boardId, swimlaneId: card.swimlaneId, listId: card.listId,
        title: card.title || '', sort: card.sort, comments: totals[card._id].count, unread: unread[card._id] || 0 })),
      swimlanes: swimlanes.map(s => ({ _id: s._id, boardId: s.boardId, title: s.title || '', sort: s.sort })),
      lists: lists.map(l => ({ _id: l._id, boardId: l.boardId, title: l.title || '', sort: l.sort })),
    };
  },

  // A board's whole structure, for a board opened in the tree with all its
  // cards shown - so the first message can be written on any card.
  async chatViewBoardChannels(boardId) {
    check(boardId, String);
    if (!this.userId) throw new Meteor.Error('not-authorized');
    const { boards } = await visibleBoardsFor(this.userId);
    const board = boards.find(b => b._id === boardId);
    if (!board) throw new Meteor.Error('not-authorized');
    let cards = await Cards.find({ boardId, archived: false, type: { $ne: 'template-card' } },
      { fields: { title: 1, swimlaneId: 1, listId: 1, sort: 1 }, sort: { sort: 1 }, limit: MAX_BOARD_CARDS }).fetchAsync();
    if (isAssignedOnlyMember(board, this.userId)) {
      const mine = await assignedCardIds([boardId], this.userId);
      cards = cards.filter(c => mine.has(c._id));
    }
    const swimlanes = await Swimlanes.find({ boardId, archived: false }, { fields: { title: 1, sort: 1 } }).fetchAsync();
    const lists = await Lists.find({ boardId, archived: false }, { fields: { title: 1, sort: 1, swimlaneId: 1 } }).fetchAsync();
    return {
      swimlanes: swimlanes.map(s => ({ _id: s._id, boardId, title: s.title || '', sort: s.sort })),
      lists: lists.map(l => ({ _id: l._id, boardId, title: l.title || '', sort: l.sort, swimlaneId: l.swimlaneId || '' })),
      cards: cards.map(c => ({ cardId: c._id, boardId, swimlaneId: c.swimlaneId, listId: c.listId, title: c.title || '', sort: c.sort })),
    };
  },
});

// The conversation of a card opened in the Chat view from any board the
// member sees - the board page publishes only its own board's comments - with
// its writers' names and pictures. The same limits as the tree.
Meteor.publish('chatViewCardComments', async function (cardId) {
  check(cardId, String);
  if (!this.userId) return this.ready();
  const card = await Cards.findOneAsync(cardId, { fields: { boardId: 1, assignees: 1, members: 1 } });
  const board = card && await Boards.findOneAsync(card.boardId);
  if (!board || !(await board.isVisibleBy({ _id: this.userId })) || !readsComments(board, this.userId)) return this.ready();
  if (isAssignedOnlyMember(board, this.userId) &&
      !(card.assignees || []).includes(this.userId) && !(card.members || []).includes(this.userId)) return this.ready();
  const comments = CardComments.find({ cardId, boardId: card.boardId });
  const authors = [...new Set((await comments.fetchAsync()).map(c => c.userId).filter(Boolean))];
  return [comments, Meteor.users.find({ _id: { $in: authors } },
    { fields: { username: 1, 'profile.fullname': 1, 'profile.avatarUrl': 1, 'profile.initials': 1 } })];
});

DDPRateLimiter.addRule({ type: 'method', name: name => ['chatViewChannels', 'chatViewBoardChannels'].includes(name),
  connectionId: () => true }, 30, 10000);
