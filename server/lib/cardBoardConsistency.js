// Pure, dependency-injected helper (no Meteor imports) so it can be unit tested
// directly with plain Node. Used by the Cards.before.update hook wired in
// server/models/cards.js (via models/cards.js).
//
// #5874: a cross-board card move must never leave the card pointing at the
// *source* board's swimlane/list. The move/copy dialog resolves its target
// board's swimlanes/lists from the client cache, which can still be empty when
// the user confirms (the destination board's publishComposite('board') data has
// not merged yet) — so it sends boardId=B while swimlaneId/listId still belong
// to board A. The card then lives on board B but is invisible in every normal
// view there, and clicking it reopens board A: effectively data loss.
//
// This function inspects the pending Mongo update modifier for a real boardId
// change and, when the resulting swimlane/list do not belong to the destination
// board, rewrites modifier.$set so they fall back to that board's default
// swimlane and first list. It is corrective only: a move whose targets already
// belong to the destination board leaves the modifier untouched.

/**
 * @param {object}   doc        the pre-update card document
 * @param {string[]} fieldNames the field names present in the modifier
 * @param {object}   modifier   the Mongo update modifier (mutated in place)
 * @param {object}   deps async lookups, all keyed by the destination board:
 *   - swimlaneBelongs(swimlaneId, boardId) => Promise<boolean>
 *   - listBelongs(listId, boardId) => Promise<boolean>
 *   - getDefaultSwimlaneId(boardId) => Promise<string|undefined>
 *   - getFirstListId(boardId) => Promise<string|undefined>
 * @return {Promise<object>} the patch applied to modifier.$set (empty if none)
 */
async function applyCardBoardConsistency(doc, fieldNames, modifier, deps) {
  if (!doc || !modifier || !modifier.$set) return {};
  if (!Array.isArray(fieldNames) || !fieldNames.includes('boardId')) return {};

  const newBoardId = modifier.$set.boardId;
  if (!newBoardId || newBoardId === doc.boardId) return {};

  const newSwimlaneId =
    modifier.$set.swimlaneId !== undefined ? modifier.$set.swimlaneId : doc.swimlaneId;
  const newListId =
    modifier.$set.listId !== undefined ? modifier.$set.listId : doc.listId;

  const swimlaneOk =
    !!newSwimlaneId && !!(await deps.swimlaneBelongs(newSwimlaneId, newBoardId));
  const listOk = !!newListId && !!(await deps.listBelongs(newListId, newBoardId));

  const patch = {};
  if (swimlaneOk && listOk) return patch;

  if (!swimlaneOk) {
    const fallback = await deps.getDefaultSwimlaneId(newBoardId);
    if (fallback) patch.swimlaneId = fallback;
  }
  if (!listOk) {
    const fallback = await deps.getFirstListId(newBoardId);
    if (fallback) patch.listId = fallback;
  }

  Object.assign(modifier.$set, patch);
  return patch;
}

module.exports = { applyCardBoardConsistency };
