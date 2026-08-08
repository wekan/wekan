import { Meteor } from 'meteor/meteor';
import { ReactiveCache } from '/imports/reactiveCache';
const { boardVisibilitySelectors } = require('/models/lib/boardVisibilitySelectors');

// "Which of these boards may this user see?" — asked with the SAME selectors as
// the All Boards list and the `board` publication, so a board is visible here
// exactly when it is visible there: public, an active membership, or an ACTIVE
// org/team/domain share.
//
// GHSA-jvv9-498p-hxrg: a card's `parentId` could point at a card on ANOTHER
// board, and nothing checked that the person setting it, or the people
// subscribed to the child board, were allowed to see that other board. The
// board publication walks the whole ancestor chain to render a subtask's path
// (#3453) and published the full ancestor card documents to every subscriber of
// the child board — so writing one id into one field bridged a private board's
// cards into another board's DDP feed. Both ends of that now ask this question:
// the write refuses an invisible parent, and the publication refuses to send
// ancestors from a board the subscriber cannot see.

/**
 * @param {string} userId
 * @param {string[]} boardIds
 * @return {Promise<Set<string>>} the subset of boardIds the user may see
 */
export async function visibleBoardIds(userId, boardIds) {
  const ids = (Array.isArray(boardIds) ? boardIds : [])
    .filter(id => typeof id === 'string' && id);
  if (ids.length === 0) {
    return new Set();
  }

  const user = userId ? await ReactiveCache.getUser(userId) : null;
  const $or = boardVisibilitySelectors({
    userId: user ? userId : null,
    orgIds: user && typeof user.orgIds === 'function' ? user.orgIds() : [],
    teamIds: user && typeof user.teamIds === 'function' ? user.teamIds() : [],
    emailDomains:
      user && typeof user.emailDomains === 'function' ? user.emailDomains() : [],
  });

  // An anonymous caller still sees public boards, so $or is never empty.
  const boards = await ReactiveCache.getBoards(
    { _id: { $in: ids }, $or },
    { fields: { _id: 1 } },
  );

  return new Set((boards || []).map(board => board._id));
}

/**
 * @param {string} userId
 * @param {string} boardId
 * @return {Promise<boolean>}
 */
export async function canUserSeeBoard(userId, boardId) {
  if (!boardId) return false;
  const visible = await visibleBoardIds(userId, [boardId]);
  return visible.has(boardId);
}

/**
 * Refuse a `parentId` that names a card on a board this user cannot see.
 * Throws so both the DDP mutation and the REST handler stop before writing;
 * the REST layer maps `Forbidden`/`NotFound` to 403/404
 * (server/lib/apiResponseHelpers.js httpStatusForError).
 *
 * @param {string} userId the actor
 * @param {string} parentId the proposed parent card id
 */
export async function assertParentCardIsVisible(userId, parentId) {
  if (!parentId) return;

  const parent = await ReactiveCache.getCard(parentId);
  if (!parent) {
    const error = new Meteor.Error('NotFound', 'Parent card not found');
    error.statusCode = 404;
    throw error;
  }

  if (!(await canUserSeeBoard(userId, parent.boardId))) {
    const error = new Meteor.Error(
      'Forbidden',
      'You are not allowed to use a card from that board as a parent.',
    );
    error.statusCode = 403;
    throw error;
  }
}
