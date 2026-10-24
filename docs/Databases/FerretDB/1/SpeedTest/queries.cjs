'use strict';

// The common WeKan database queries the speed test times, each as WeKan's own
// code sends it. Where WeKan builds the selector with a pure helper
// (models/lib/boardVisibilitySelectors.js, cardSortTiebreaker.js) the helper is
// called, so the query cannot drift from the one the app makes.
//
// Every query has PARAMETERS chosen from the data plan (data.cjs) - the biggest
// boards, the busiest users, and a fixed sample of ordinary ones - so every
// database is asked exactly the same questions. `ordered: false` marks a query
// whose result order the app does not depend on; its answer is compared as a set.

const path = require('path');

const ROOT = path.resolve(__dirname, '../../../../..');
const { boardVisibilitySelectors, starredPublicBoardSelector } = require(path.join(ROOT, 'models/lib/boardVisibilitySelectors.js'));
const { withoutMembershipSelectors } = require(path.join(ROOT, 'models/lib/boardPermission.js'));
const { sortWithIdTiebreaker } = require(path.join(ROOT, 'models/lib/cardSortTiebreaker.js'));
const { EPOCH, DAY } = require('./data.cjs');

// server/publications/boards.js: the All Boards page ('remaining' menu, no search,
// sorted by title) - the selector, its count and its first page.
function allBoardsSelector(user) {
  const clauses = boardVisibilitySelectors({ userId: user._id, includePublic: false });
  const starred = starredPublicBoardSelector(user.starredBoards);
  if (starred) clauses.push(starred);
  return {
    archived: false,
    type: 'board',
    ...(clauses.length === 1 ? clauses[0] : { $or: clauses }),
    _id: { $nin: [] },
  };
}

// server/publications/cards.js `dueCards` (allUsers = false): the boards the user
// may see, then their due cards. No board here is assigned-only, so the board
// scope is the plain boardId list the publication uses then.
async function dueCards(db, user) {
  const visible = await db.collection('boards').find({
    $or: [
      ...withoutMembershipSelectors(true),
      { members: { $elemMatch: { userId: user._id, isActive: true } } },
    ],
  }, { projection: { _id: 1, members: 1 } }).toArray();
  const boardIds = visible.map(b => b._id);
  return db.collection('cards').find({
    type: 'cardType-card',
    archived: false,
    dueAt: { $exists: true, $nin: [null, ''] },
    $and: [
      { boardId: { $in: boardIds } },
      { $or: [
        { members: user._id }, { assignees: user._id }, { requesters: user._id },
        { assigners: user._id }, { userId: user._id },
      ] },
    ],
  }, {
    sort: { dueAt: 1 },
    limit: 200,
    projection: { title: 1, dueAt: 1, boardId: 1, listId: 1, swimlaneId: 1, members: 1, assignees: 1, userId: 1, archived: 1, type: 1 },
  }).toArray();
}

const QUERIES = [
  { id: 'login', title: 'Login', what: 'users.findOne({ username }) - Meteor accounts-base at sign-in',
    params: 'users', ordered: true,
    run: (db, p) => db.collection('users').findOne({ username: p.user.username }) },
  { id: 'user', title: 'User by id', what: 'users.findOne({ _id }) - every method and publication asks who is calling',
    params: 'users', ordered: true,
    run: (db, p) => db.collection('users').findOne({ _id: p.user._id }) },
  { id: 'allBoardsCount', title: 'All Boards count', what: 'boards.countDocuments(All Boards selector)',
    params: 'users', ordered: true,
    run: (db, p) => db.collection('boards').countDocuments(allBoardsSelector(p.user)) },
  { id: 'allBoardsPage', title: 'All Boards page', what: 'boards.find(All Boards selector).sort({ title, _id }).limit(30), ids only',
    params: 'users', ordered: true,
    run: (db, p) => db.collection('boards').find(allBoardsSelector(p.user), {
      projection: { _id: 1 }, sort: { title: 1, _id: 1 }, limit: 30,
    }).toArray() },
  { id: 'board', title: 'Board by id', what: 'boards.findOne({ _id }) - opening a board',
    params: 'boards', ordered: true,
    run: (db, p) => db.collection('boards').findOne({ _id: p.board._id }) },
  { id: 'lists', title: 'Board lists', what: 'lists.find({ boardId, archived: false }).sort({ sort, _id })',
    params: 'boards', ordered: true,
    run: (db, p) => db.collection('lists').find({ boardId: p.board._id, archived: false }, { sort: { sort: 1, _id: 1 } }).toArray() },
  { id: 'swimlanes', title: 'Board swimlanes', what: 'swimlanes.find({ boardId, archived: false }).sort({ sort, _id })',
    params: 'boards', ordered: true,
    run: (db, p) => db.collection('swimlanes').find({ boardId: p.board._id, archived: false }, { sort: { sort: 1, _id: 1 } }).toArray() },
  { id: 'boardCards', title: 'Board cards', what: 'cards.find({ boardId, archived: false }) - the board publication, every card',
    params: 'boards', ordered: false,
    run: (db, p) => db.collection('cards').find({ boardId: p.board._id, archived: false }).toArray() },
  { id: 'cardWindow', title: 'Card window', what: 'cards.find({ boardId, archived: false, listId, swimlaneId }).sort({ sort, _id }).limit(25), ids - lazy loading',
    params: 'boards', ordered: true,
    run: (db, p) => db.collection('cards').find({
      boardId: p.board._id, archived: false, listId: p.board.listId, swimlaneId: p.board.swimlaneId,
    }, { sort: sortWithIdTiebreaker({ sort: 1 }), limit: 25, projection: { _id: 1 } }).toArray() },
  { id: 'cardCount', title: 'Card count', what: 'cards.countDocuments({ boardId, archived: false })',
    params: 'boards', ordered: true,
    run: (db, p) => db.collection('cards').countDocuments({ boardId: p.board._id, archived: false }) },
  { id: 'cardsPerList', title: 'Cards per list', what: 'aggregate $match { boardId, archived: false } + $group by listId - All Boards card counters',
    params: 'boards', ordered: true,
    run: (db, p) => db.collection('cards').aggregate([
      { $match: { boardId: p.board._id, archived: false } },
      { $group: { _id: '$listId', count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]).toArray() },
  { id: 'card', title: 'Card by id', what: 'cards.findOne({ _id }) - opening a card',
    params: 'boards', ordered: true,
    run: (db, p) => db.collection('cards').findOne({ _id: p.board.cardId }) },
  { id: 'search', title: 'Card search', what: 'cards.find({ boardId, archived: false, title: /word/i }).sort({ sort, _id }).limit(50)',
    params: 'boards', ordered: true,
    run: (db, p) => db.collection('cards').find({
      boardId: p.board._id, archived: false, title: { $regex: p.board.word, $options: 'i' },
    }, { sort: { sort: 1, _id: 1 }, limit: 50 }).toArray() },
  { id: 'dueCards', title: 'Due Cards', what: 'the dueCards publication: visible boards, then their due cards sorted by dueAt',
    params: 'users', ordered: true,
    run: (db, p) => dueCards(db, p.user) },
  { id: 'people', title: 'People page', what: 'users.find({}).sort({ createdAt: -1 }).skip(n).limit(10) + count - Admin Panel / People',
    params: 'pages', ordered: true,
    run: async (db, p) => {
      const users = db.collection('users');
      const [total, page] = await Promise.all([
        users.countDocuments({}),
        users.find({}, { sort: { createdAt: -1 }, skip: p.page * 10, limit: 10, projection: { username: 1, createdAt: 1 } }).toArray(),
      ]);
      return { total, page };
    } },
  // Writes. Each call changes a DIFFERENT card (the pass and the parameter decide
  // which), so no update is a no-op that one engine could skip and another not.
  { id: 'updateCard', title: 'Edit card', what: 'cards.updateOne({ _id }, { $set: { title, modifiedAt } })',
    params: 'boards', ordered: true, write: true,
    run: async (db, p, pass) => {
      const r = await db.collection('cards').updateOne({ _id: p.board.cardIds[pass % p.board.cardIds.length] },
        { $set: { title: `Edited ${pass}`, modifiedAt: new Date(EPOCH + DAY + pass) } });
      return { matched: r.matchedCount, modified: r.modifiedCount };
    } },
  { id: 'moveCard', title: 'Move card', what: 'cards.updateOne({ _id }, { $set: { listId, swimlaneId, sort, modifiedAt } })',
    params: 'boards', ordered: true, write: true,
    run: async (db, p, pass) => {
      const r = await db.collection('cards').updateOne({ _id: p.board.cardIds[(pass + 1) % p.board.cardIds.length] },
        { $set: { listId: p.board.listId, swimlaneId: p.board.swimlaneId, sort: 100000 + pass, modifiedAt: new Date(EPOCH + DAY + pass) } });
      return { matched: r.matchedCount, modified: r.modifiedCount };
    } },
  { id: 'insertCard', title: 'Add card', what: 'cards.insertOne({ ...a new card })',
    params: 'boards', ordered: true, write: true,
    run: async (db, p, pass) => {
      const _id = `speedtest${p.index}x${pass}`;
      const r = await db.collection('cards').insertOne({
        _id, title: `New card ${pass}`, boardId: p.board._id, listId: p.board.listId, swimlaneId: p.board.swimlaneId,
        sort: 200000 + pass, archived: false, type: 'cardType-card', members: [], assignees: [], labelIds: [],
        customFields: [], userId: p.board.userId, createdAt: new Date(EPOCH + DAY), modifiedAt: new Date(EPOCH + DAY),
      });
      return { id: r.insertedId };
    } },
];

// What a write left behind, read back after the run, so "the same data" also
// covers what the writes stored, not only what they answered.
async function writtenState(db) {
  return db.collection('cards').find({
    $or: [{ title: /^Edited / }, { sort: { $gte: 100000 } }],
  }, { sort: { _id: 1 } }).toArray();
}

module.exports = { QUERIES, writtenState, allBoardsSelector };
