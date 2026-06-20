/**
 * Pure, dependency-free helper for remapping board-level labels across boards.
 *
 * This module intentionally has NO Meteor / collection imports so it can be
 * imported directly by unit tests (mocha + chai) without a running app, while
 * still being the single source of truth used by models/swimlanes.js when a
 * swimlane (and its cards) is copied to ANOTHER board.
 *
 * #5158 "Copy Swimlane does not copy labels".
 *
 * Board labels are referenced by id on each card (card.labelIds), but label ids
 * are board-scoped. When content moves to another board the assignments must be
 * remapped by NAME to the destination board's labels. Source labels whose name
 * is missing on the destination board cannot be mapped, so they are reported so
 * the caller can create them first.
 */

/**
 * Map source label ids to destination label ids by (non-empty) name.
 *
 * @param {Array<{_id:string,name?:string}>} sourceLabels - labels of the source board
 * @param {Array<string>} sourceLabelIds - label ids referenced (e.g. a card's labelIds)
 * @param {Array<{_id:string,name?:string}>} destLabels - labels of the destination board
 * @returns {{mappedIds: Array<string>, missingNames: Array<string>}}
 *   mappedIds: destination label ids whose name matches a referenced source label
 *   missingNames: names of referenced source labels that have no match on dest
 */
export function remapLabelIds(sourceLabels, sourceLabelIds, destLabels) {
  const src = Array.isArray(sourceLabels) ? sourceLabels : [];
  const ids = Array.isArray(sourceLabelIds) ? sourceLabelIds : [];
  const dest = Array.isArray(destLabels) ? destLabels : [];

  // Names of the referenced source labels, ignoring unnamed labels: an unnamed
  // label can never be matched by name and would otherwise wrongly select every
  // unnamed label on the destination board.
  const referencedNames = src
    .filter(label => label && ids.includes(label._id) && label.name)
    .map(label => label.name);

  // Build a name -> destination id lookup (first match wins for duplicates).
  const destByName = new Map();
  for (const label of dest) {
    if (label && label.name && !destByName.has(label.name)) {
      destByName.set(label.name, label._id);
    }
  }

  const mappedIds = [];
  const missingNames = [];
  for (const name of referencedNames) {
    if (destByName.has(name)) {
      mappedIds.push(destByName.get(name));
    } else if (!missingNames.includes(name)) {
      missingNames.push(name);
    }
  }

  return { mappedIds, missingNames };
}
