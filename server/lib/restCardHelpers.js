// Pure, Meteor-free helpers behind the REST card fixes. Kept dependency-free so
// they can be unit-tested standalone (mocha + chai) without booting Meteor.
//
//   #5398 normalizeMoveParams  - one consistent set of board-move params
//   #5399 computeTopSort        - sort value that lands a card on TOP of a list
//   #5537 parseCardDate         - parse an ISO date string into a Date that persists

/**
 * #5399 Moving a card to another list via the API must put it on TOP of the
 * destination list, the same way the Move Card dialog does
 * (getMinSort(listId) then move(..., minOrder - 1)).
 *
 * Given the existing sort values of the destination list's cards, returns a
 * sort value strictly less than the current minimum, so the moved card lands on
 * top. When the destination list is empty there is nothing to be on top of, so
 * it returns 0 (matching how a fresh list starts).
 *
 * @param {number[]} existingSorts sort values of the cards already in the list
 * @returns {number} a sort value placing the card on top
 */
export function computeTopSort(existingSorts) {
  const sorts = (Array.isArray(existingSorts) ? existingSorts : [])
    .filter(s => typeof s === 'number' && !Number.isNaN(s));
  if (sorts.length === 0) {
    return 0;
  }
  return Math.min(...sorts) - 1;
}

/**
 * #5398 The PUT/edit card handler historically read the board-move parameters
 * under several inconsistent names. This normalizes the request body into a
 * single, consistent shape and tells the caller whether a full cross
 * board/swimlane/list move was requested (all three present) versus a
 * same-board list and/or swimlane change.
 *
 * The external API contract is unchanged: it still accepts the documented
 * `newBoardId` / `newSwimlaneId` / `newListId` (full move) and `listId` /
 * `swimlaneId` (same-board move) form fields.
 *
 * @param {object} body the request body
 * @returns {{
 *   newBoardId: (string|undefined),
 *   newSwimlaneId: (string|undefined),
 *   newListId: (string|undefined),
 *   listId: (string|undefined),
 *   swimlaneId: (string|undefined),
 *   isBoardMove: boolean,
 * }}
 */
export function normalizeMoveParams(body) {
  const b = body || {};
  const newBoardId = b.newBoardId || undefined;
  const newSwimlaneId = b.newSwimlaneId || undefined;
  const newListId = b.newListId || undefined;
  return {
    newBoardId,
    newSwimlaneId,
    newListId,
    listId: b.listId || undefined,
    swimlaneId: b.swimlaneId || undefined,
    isBoardMove: !!(newBoardId && newSwimlaneId && newListId),
  };
}

/**
 * #5537 A card date (receivedAt / startAt / dueAt / endAt) sent to the REST API
 * arrives as a string, but the Cards schema types these fields as `Date`. A raw
 * string written via $set is stripped by schema cleaning, so the date reverts
 * (never persists). This parses a value into a real Date so it persists.
 *
 * Accepts a Date (returned as-is), an ISO 8601 string, or a numeric epoch
 * (ms, or a numeric string). Returns null for empty/invalid input so callers
 * can distinguish "could not parse" from a valid date.
 *
 * @param {(string|number|Date)} value
 * @returns {(Date|null)}
 */
export function parseCardDate(value) {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }
  if (value === null || value === undefined || value === '') {
    return null;
  }
  // Numeric epoch (or numeric string) -> treat as ms since epoch.
  if (typeof value === 'number') {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed === '') {
      return null;
    }
    // Pure-number string => epoch ms; otherwise parse as a date string (ISO).
    const asNumber = Number(trimmed);
    const d =
      !Number.isNaN(asNumber) && /^-?\d+$/.test(trimmed)
        ? new Date(asNumber)
        : new Date(trimmed);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  return null;
}
