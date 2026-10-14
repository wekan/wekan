// Board View / Version Control: the board as a GitHub / Gitea issue tracker
// (client/components/boards/versionControlView.*,
// docs/Features/Board/Version-Control-View.md). Reading needs nothing new -
// the cards, labels, comments and attachments are the board's own, already
// published to whoever can see the board. Only two writes need the server:
//
//   vcsCreateIssue    New issue: a card in the board's open list
//   vcsSetIssueState  Close / Reopen: the card moves to the closed / open list
//
// Both write through the ordinary collections, not `.direct`, so the change
// history hooks (server/models/changeHistoryHooks.js) record them and the
// History tab - the board's history table - can undo them like any other move.
import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
import { ReactiveCache } from '/imports/reactiveCache';
import Cards from '/models/cards';
import { cardCreation } from '/models/cards';
import Lists from '/models/lists';
import { allowIsBoardMemberWithWriteAccess } from '/server/lib/utils';

const { cleanNewIssue, stateTarget, isSyncedIssue } = require('/models/lib/versionControlView');

async function writableBoard(userId, boardId) {
  const board = await ReactiveCache.getBoard(boardId);
  if (!userId || !board || !allowIsBoardMemberWithWriteAccess(userId, board)) throw new Meteor.Error('not-authorized');
  return board;
}

// The list a state lives in, made when the board has none (a board that was
// not imported from a tracker has no "Closed" list until an issue is closed).
async function listFor(board, state) {
  const lists = await ReactiveCache.getLists({ boardId: board._id, archived: false }, { sort: { sort: 1 } });
  const target = stateTarget(lists || [], state);
  if (target.listId) return target.listId;
  const last = (lists || []).reduce((max, l) => Math.max(max, Number(l.sort) || 0), -1);
  return Lists.insertAsync({
    title: target.create, boardId: board._id, sort: last + 1, archived: false, createdAt: new Date(),
  });
}

Meteor.methods({
  async vcsCreateIssue(boardId, input) {
    check(boardId, String);
    check(input, { title: String, body: Match.Optional(String), labelIds: Match.Optional([String]) });
    const userId = this.userId;
    const board = await writableBoard(userId, boardId);
    let issue;
    try {
      issue = cleanNewIssue(input);
    } catch (e) {
      throw new Meteor.Error(e.message);
    }
    const known = new Set((board.labels || []).map(l => l._id));
    const listId = await listFor(board, 'open');
    const swimlane = await board.getDefaultSwimlineAsync();
    if (!listId || !swimlane) throw new Meteor.Error('vcs-no-list');
    const siblings = await ReactiveCache.getCards({ boardId: board._id, listId, archived: false });
    const cardId = await Cards.insertAsync({
      title: issue.title,
      description: issue.body,
      boardId: board._id,
      listId,
      swimlaneId: swimlane._id,
      userId,
      labelIds: issue.labelIds.filter(id => known.has(id)),
      sort: (siblings || []).length,
      cardNumber: await board.getNextCardNumber(),
    });
    const created = await ReactiveCache.getCard(cardId);
    if (created) await cardCreation(userId, created);
    return { cardId };
  },

  async vcsSetIssueState(cardId, state) {
    check(cardId, String);
    check(state, Match.OneOf('open', 'closed'));
    const userId = this.userId;
    const card = await ReactiveCache.getCard(cardId);
    if (!card) throw new Meteor.Error('not-found');
    const board = await writableBoard(userId, card.boardId);
    // A synced issue is closed and reopened in its tracker, and the next sync
    // brings the state: moving the card out of its synced list would make
    // the sync see the issue as gone.
    if (isSyncedIssue(card)) throw new Meteor.Error('vcs-synced-issue');
    // An archived card is a closed issue; reopening it restores it.
    if (state === 'open' && card.archived) await card.restore();
    const listId = await listFor(board, state);
    if (listId && listId !== card.listId) {
      await Cards.updateAsync(card._id, { $set: { listId, dateLastActivity: new Date() } });
    }
    return { listId };
  },
});
