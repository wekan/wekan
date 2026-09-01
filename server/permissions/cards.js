import Cards from '/models/cards';
import Boards from '/models/boards';
import { allowIsBoardMemberWithWriteAccess, denyCrossBoardMove } from '/server/lib/utils';
import { canUserSeeBoard } from '/server/lib/visibleBoardIds';
import { tripCanary, tripCanaryDeny } from '/server/lib/canary';
const { workerMayUpdateCard } = require('/models/lib/workerCardWrite');

const CAPTURE_PROVENANCE_FIELDS = [
  'captureSourceType',
  'captureSourceUrl',
  'captureEmailFrom',
  'captureEmailMessageId',
  'captureEmailAttachments',
  'capturedAt',
  'capturedBy',
];

function touchesCaptureProvenance(fields) {
  return (fields || []).some(field =>
    CAPTURE_PROVENANCE_FIELDS.some(
      protectedField => field === protectedField || field.startsWith(`${protectedField}.`),
    ),
  );
}

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

// The deny-rule form: true means "refuse this write".
export async function denyInvisibleParentCard(userId, modifier) {
  const set = modifier && modifier.$set;
  if (!set) return false;
  const parentId = set.parentId;
  // Not setting a parent, or clearing it — nothing to check.
  if (typeof parentId !== 'string' || !parentId) return false;
  return !(await canUserSeeParentCard(userId, parentId));
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
  if (allowIsBoardMemberWithWriteAccess(userId, board)) return true;
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
    // Capture provenance is server-authored and survives every move. A board
    // member may edit the card, but may not rewrite where/when/by whom it was
    // captured through a direct client collection update.
    if (touchesCaptureProvenance(fieldNames)) return true;
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

// Same rule on INSERT: a card can be created with a parentId already set.
Cards.deny({
  async insert(userId, doc) {
    if (
      doc &&
      CAPTURE_PROVENANCE_FIELDS.some(field =>
        Object.prototype.hasOwnProperty.call(doc, field),
      )
    ) {
      return true;
    }
    if (!doc || !doc.parentId) return false;
    if (await canUserSeeParentCard(userId, doc.parentId)) return false;
    return tripCanaryDeny('card.invisible-parent', { userId });
  },
  fetch: [],
});
