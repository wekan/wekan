import Cards from '/models/cards';
import Boards from '/models/boards';
import { assertFieldWrite, modifiedCard } from '/server/lib/adminOnlyCustomFields';
import { allowIsBoardMemberWithWriteAccess, denyCrossBoardMove } from '/server/lib/utils';
import { canUserSeeBoard } from '/server/lib/visibleBoardIds';
import { tripCanary, tripCanaryDeny } from '/server/lib/canary';
import { canEditCardOrLinkedCard } from '/server/lib/linkedCardPermission';
const { workerMayUpdateCard } = require('/models/lib/workerCardWrite');
import { recordLinkedWriteDenial } from '/models/lib/linkedWritePolicy';

async function denyUnauthorizedCardLink(userId, type, linkedId) {
  if (type !== 'cardType-linkedCard') return false;
  const source = typeof linkedId === 'string' && await Cards.findOneAsync(linkedId);
  const board = source && await Boards.findOneAsync(source.boardId);
  if (allowIsBoardMemberWithWriteAccess(userId, board)) return false;
  recordLinkedWriteDenial('ddp:card-link');
  return true;
}

Cards.deny({
  async insert(userId, doc) {
    return await denyUnauthorizedCardLink(userId, doc.type, doc.linkedId);
  },
  async update(userId, doc, fields, modifier) {
    if (!fields.some(field => field === 'type' || field === 'linkedId')) return false;
    const set = modifier.$set || {};
    return await denyUnauthorizedCardLink(userId, set.type || doc.type, set.linkedId || doc.linkedId);
  },
  fetch: ['type', 'linkedId'],
});

// GHSA-jvv9-498p-hxrg: may this user name that card as a parent? Only if they
// may see the board it is on — the same question the `board` publication asks
// before sending an ancestor card.
export async function canUserSeeParentCard(userId, parentId) {
  if (!parentId) return true;
  const parent = await Cards.findOneAsync(parentId, { fields: { boardId: 1 } });
  // A parent that does not exist is not something to point at either.
  if (!parent) return false;
  return await canUserSeeBoard(userId, parent.boardId);
}

// Every parent id a card write names: $set parentId, and (#3626) every id in
// parentIds however it is written - $set, $addToSet or $push, one id or $each.
export function parentIdsWritten(modifier) {
  const ids = [];
  const add = value => {
    if (typeof value === 'string') ids.push(value);
    else if (Array.isArray(value)) value.forEach(add);
    else if (value && typeof value === 'object' && Array.isArray(value.$each)) value.$each.forEach(add);
    else if (value !== undefined && value !== null && value !== '') ids.push(value);
  };
  if (modifier && modifier.$set) {
    if (modifier.$set.parentId) add(modifier.$set.parentId);
    add(modifier.$set.parentIds);
  }
  for (const op of ['$addToSet', '$push']) {
    if (modifier && modifier[op]) add(modifier[op].parentIds);
  }
  return ids;
}

// The deny-rule form: true means "refuse this write".
export async function denyInvisibleParentCard(userId, modifier) {
  for (const parentId of parentIdsWritten(modifier)) {
    // A non-string parent id is not something to point at either.
    if (typeof parentId !== 'string' || !parentId) return true;
    if (!(await canUserSeeParentCard(userId, parentId))) return true;
  }
  return false;
}

// Centralized update policy for Cards
// Security: deny any direct client updates to 'vote' fields; require write access otherwise
//
// #3189: the `modifier` argument is read as well now. A Worker has `write: false`
// in the capability table and always will - the role is not "can edit cards" - but
// the board schema defines it as "move card, assign himself to card and comment",
// and both of those are card UPDATES. So an update that a Worker is allowed to
// make is recognised by WHAT IT WRITES (models/lib/workerCardWrite.js): a move, or
// their own name into `assignees`. Everything else is refused exactly as before.
export const canUpdateCard = async function(userId, doc, fields, modifier) {
  if (!userId) return false;
  const fieldNames = fields || [];
  // Block direct updates to voting fields; voting must go through Meteor method 'cards.vote'
  // A canary: the UI never writes these directly, so reaching here is somebody
  // trying the field instead of the method (docs/Security/Remediation/WeKan.md §12).
  if (fieldNames.some(f => typeof f === 'string' && (f === 'vote' || f.indexOf('vote.') === 0))) {
    return tripCanary('card.vote-field', { userId });
  }
  // Block direct updates to poker fields; poker must go through Meteor methods
  if (fieldNames.some(f => typeof f === 'string' && (f === 'poker' || f.indexOf('poker.') === 0))) {
    return tripCanary('card.poker-field', { userId });
  }
  // ReadOnly users cannot edit cards
  const board = await Boards.findOneAsync(doc.boardId);
  if (await canEditCardOrLinkedCard(userId, doc, board)) return true;
  // #3189: a Worker, doing one of the two things a Worker is for. The client
  // already offers it - the assignee popup shows a Worker their own name and
  // nobody else's - and the write was being thrown away here, so the card sprang
  // back to its previous assignee in front of them.
  if (board && board.hasWorker && board.hasWorker(userId)) {
    return workerMayUpdateCard(userId, modifier);
  }
  return false;
};

Cards.allow({
  async insert(userId, doc) {
    // ReadOnly users cannot create cards
    return allowIsBoardMemberWithWriteAccess(userId, await Boards.findOneAsync(doc.boardId));
  },
  async update(userId, doc, fields, modifier) {
    return await canUpdateCard(userId, doc, fields, modifier);
  },
  async remove(userId, doc) {
    // ReadOnly users cannot delete cards
    return allowIsBoardMemberWithWriteAccess(userId, await Boards.findOneAsync(doc.boardId));
  },
  fetch: ['boardId'],
});

// Security (GHSA-gm7v-pc38-53jr): the allow rule above only checks write access
// on the card's SOURCE board, so a client could move a card into a private board
// it is not a member of by setting a new boardId. Deny any cross-board move where
// the caller lacks write access to the destination board.
//
// Security (GHSA-jvv9-498p-hxrg): the same shape of hole one field over.
// `parentId` may name a card on ANOTHER board, and write access here says
// nothing about read access there — so pointing a card at a card on a private
// board made the board publication walk that private board's ancestor chain and
// send its full card documents to everyone subscribed to THIS board. Deny a
// parent whose board the caller cannot see. (The publication no longer sends
// those ancestors either; this stops the bridge being built in the first place.)
Cards.deny({
  async update(userId, doc, fieldNames, modifier) {
    if (await denyCrossBoardMove(userId, modifier)) {
      return tripCanaryDeny('card.cross-board-move', { userId });
    }
    if (await denyInvisibleParentCard(userId, modifier)) {
      return tripCanaryDeny('card.invisible-parent', { userId });
    }
    return false;
  },
  fetch: [],
});

// A card created on one board naming ANOTHER board's list or swimlane: its
// creation activity carries that list's and swimlane's titles, and the
// board's rules see them, so a member of one board could read the names of a
// private board's lists by id (2026-10-03, BoardBleed sibling). The server's
// own copies check their destination (server/lib/cardCopyDestination.js);
// no client sends such an insert, so it is recorded as an attempt.
async function namesForeignContainer(doc) {
  const Lists = require('/models/lists').default;
  const Swimlanes = require('/models/swimlanes').default;
  for (const [collection, id] of [[Lists, doc.listId], [Swimlanes, doc.swimlaneId]]) {
    if (typeof id !== 'string' || !id) continue;
    const container = await collection.findOneAsync(id, { fields: { boardId: 1 } });
    if (container && container.boardId !== doc.boardId) return true;
  }
  return false;
}
Cards.deny({
  async insert(userId, doc) {
    if (doc && await namesForeignContainer(doc)) return tripCanaryDeny('card.foreign-placement', { userId });
    return false;
  },
  fetch: [],
});

// Same rule on INSERT: a card can be created with a parentId already set.
Cards.deny({
  async insert(userId, doc) {
    if (!doc) return false;
    // #3626: every parent in parentIds too.
    const ids = [doc.parentId, ...(Array.isArray(doc.parentIds) ? doc.parentIds : [])].filter(Boolean);
    for (const parentId of ids) {
      if (!(await canUserSeeParentCard(userId, parentId))) return tripCanaryDeny('card.invisible-parent', { userId });
    }
    return false;
  },
  fetch: [],
});

// #3141: a non board-admin must not be able to set an "Admin only" custom
// field's VALUE even via a direct client collection write (card.setCustomField()
// writes `customFields.<index>.value` straight through Cards.updateAsync on the
// client for text/number/dropdown/stringtemplate fields) - a UI-only hide is not
// real access control, since client HTML/JS is visible and bypassable.
export async function denyAdminOnlyCustomFieldValueWrite(userId, doc, modifier) {
  try {
    await assertFieldWrite(userId, doc, modifiedCard(doc, modifier), 'ddp:cards.update');
    return false;
  } catch (error) {
    if (error.error === 'not-authorized') return true;
    throw error;
  }
}

Cards.deny({
  async insert(userId, doc) {
    try { await assertFieldWrite(userId, null, doc, 'ddp:cards.insert'); return false; }
    catch (error) { if (error.error === 'not-authorized') return true; throw error; }
  },
  async update(userId, doc, fieldNames, modifier) {
    if (!fieldNames.some(name => name === 'customFields' || name === 'boardId')) return false;
    return denyAdminOnlyCustomFieldValueWrite(userId, doc, modifier);
  },
  fetch: ['boardId', 'customFields'],
});
