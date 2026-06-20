/**
 * Pure, dependency-free helpers for copying cards and editing card dates.
 *
 * This module intentionally has NO Meteor / collection imports so it can be
 * imported directly by unit tests (mocha + chai) without a running app, while
 * still being the single source of truth used by models/cards.js.
 */

/**
 * #2970 "Copy card selects all labels".
 *
 * When a card is copied to another board, its labels must be remapped by NAME
 * to the destination board's labels. Labels that have no name must be skipped,
 * otherwise every unnamed label on the destination board would get wrongly
 * selected (mirrors the guard already used by Cards.move()).
 *
 * @param {Array<{_id:string,name?:string}>} destBoardLabels - labels of the destination board
 * @param {Array<string>} sourceLabelNames - names of the labels on the source card
 * @returns {Array<string>} ids of destination-board labels whose (non-empty) name matches a source label name
 */
export function filterCopiedLabelIds(destBoardLabels, sourceLabelNames) {
  const labels = Array.isArray(destBoardLabels) ? destBoardLabels : [];
  const names = Array.isArray(sourceLabelNames) ? sourceLabelNames : [];
  return labels
    .filter(label => label && label.name && names.includes(label.name))
    .map(label => label._id);
}

/**
 * #4561 "link card due date bug".
 *
 * Date mutations (set/unset of received/start/due/end) on a linked card must
 * target the REAL underlying card document, not the link placeholder. This
 * resolves the id the same way Card.getRealId() does: linkedId for a linked
 * card, otherwise the card's own _id.
 *
 * @param {{_id?:string, linkedId?:string, type?:string}} card
 * @returns {string|undefined} the real card id to update
 */
export function resolveRealCardId(card) {
  const c = card || {};
  if (c.type === 'cardType-linkedCard') {
    return c.linkedId;
  }
  return c._id;
}

/**
 * #5364 "Copy card: show as thumb / cover not cloned".
 *
 * When attachments are copied, they get fresh ids. The card's coverId still
 * points at the OLD attachment id, so the cover is lost unless it is remapped
 * to the corresponding NEW attachment id.
 *
 * @param {string|undefined} oldCoverId - coverId of the source card
 * @param {Object<string,string>} oldToNewAttachmentId - map old attachment id -> new attachment id
 * @returns {string|undefined} the remapped coverId, or undefined when there is no cover / no match
 */
export function remapCoverId(oldCoverId, oldToNewAttachmentId) {
  if (!oldCoverId) {
    return undefined;
  }
  const map = oldToNewAttachmentId || {};
  return map[oldCoverId];
}
