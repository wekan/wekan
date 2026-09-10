// Board View / Timeline (Step 1): reconstruct what a board's cards looked
// like at an arbitrary past moment, by REPLAYING the existing Activities log
// backwards from the card's CURRENT state, rather than storing separate
// snapshots. This keeps the feature storage-free: WeKan already writes one
// Activity per meaningful change (see models/cards.js / server/models/cards.js),
// so "state as of time T" is just "current state, with every activity that
// happened after T undone, newest first".
//
// This module is PURE AND READ-ONLY. It never touches Mongo/Meteor, never
// mutates its inputs, and never deletes or writes an Activity. Every function
// here takes plain arrays/objects and returns new plain objects.
//
// Which activityTypes this can undo, and what each one records (read from the
// current codebase, not guessed):
//
//   createCard          - the card did not exist before this activity's time.
//   a-changedTitle       - { oldValue, value }              -> title
//   a-changedDescription - { oldValue, value }              -> description
//   a-dueAt               - { timeKey: 'dueAt', timeValue, timeOldValue } -> dueAt
//   moveCard              - { oldListId, listId, oldSwimlaneId, swimlaneId }
//   archivedCard          - archived flipped true
//   restoredCard          - archived flipped false (so before it, archived was true)
//   joinMember/unjoinMember     - { memberId }   -> members
//   joinAssignee/unjoinAssignee - { assigneeId } -> assignees
//   addedLabel/removedLabel     - { labelId }    -> labelIds
//
// Known limitations (stated rather than guessed, per the feature spec):
//   - moveCardBoard (a card moved to a DIFFERENT board) is not undone: this
//     function reconstructs one board's history, and a card that has since
//     left the board cannot be "moved back" without knowing whether the
//     board itself allows it. Such activities are recorded on the returned
//     card's `unreversedActivityTypes` so a caller can flag the limitation.
//   - setCustomField/unsetCustomField are not undone (custom field values are
//     out of this feature's required field set: title, description, listId,
//     swimlaneId, labelIds, members, dueAt, archived).
//   - deleteCard (permanent delete) cannot be reconstructed at all, because a
//     permanently deleted card is not present in `currentCards` for this
//     function to start from. Such cards are simply absent from the result,
//     same as they are absent from the live board today.

const UNDOABLE_ACTIVITY_TYPES = new Set([
  'createCard',
  'a-changedTitle',
  'a-changedDescription',
  'a-dueAt',
  'moveCard',
  'archivedCard',
  'restoredCard',
  'joinMember',
  'unjoinMember',
  'joinAssignee',
  'unjoinAssignee',
  'addedLabel',
  'removedLabel',
]);

// The known-but-not-reversible types, so a caller can distinguish "we saw
// this and chose not to reverse it" from "we don't know this type at all".
const KNOWN_UNREVERSIBLE_ACTIVITY_TYPES = new Set([
  'moveCardBoard',
  'setCustomField',
  'unsetCustomField',
  'deleteCard',
]);

function toTime(value) {
  if (!value) return 0;
  const d = value instanceof Date ? value : new Date(value);
  const t = d.getTime();
  return Number.isNaN(t) ? 0 : t;
}

function cloneArray(arr) {
  return Array.isArray(arr) ? arr.slice() : [];
}

function removeOne(arr, value) {
  const out = cloneArray(arr);
  const idx = out.indexOf(value);
  if (idx !== -1) out.splice(idx, 1);
  return out;
}

function addOnce(arr, value) {
  const out = cloneArray(arr);
  if (value !== undefined && value !== null && !out.includes(value)) {
    out.push(value);
  }
  return out;
}

// Undo a single activity on a reconstructed card projection. Returns a NEW
// projection object; never mutates `state`.
function undoActivity(state, activity) {
  switch (activity.activityType) {
    case 'createCard':
      return { ...state, existed: false };
    case 'a-changedTitle':
      return { ...state, title: activity.oldValue || '' };
    case 'a-changedDescription':
      return { ...state, description: activity.oldValue || '' };
    case 'a-dueAt':
      if (activity.timeKey !== 'dueAt') return state;
      return { ...state, dueAt: activity.timeOldValue || null };
    case 'moveCard':
      return {
        ...state,
        listId: activity.oldListId !== undefined ? activity.oldListId : state.listId,
        swimlaneId:
          activity.oldSwimlaneId !== undefined
            ? activity.oldSwimlaneId
            : state.swimlaneId,
      };
    case 'archivedCard':
      return { ...state, archived: false };
    case 'restoredCard':
      return { ...state, archived: true };
    case 'joinMember':
      return { ...state, members: removeOne(state.members, activity.memberId) };
    case 'unjoinMember':
      return { ...state, members: addOnce(state.members, activity.memberId) };
    case 'joinAssignee':
      return {
        ...state,
        assignees: removeOne(state.assignees, activity.assigneeId),
      };
    case 'unjoinAssignee':
      return { ...state, assignees: addOnce(state.assignees, activity.assigneeId) };
    case 'addedLabel':
      return { ...state, labelIds: removeOne(state.labelIds, activity.labelId) };
    case 'removedLabel':
      return { ...state, labelIds: addOnce(state.labelIds, activity.labelId) };
    default:
      return state;
  }
}

/**
 * Reconstruct board card state as of `asOfTimestamp`.
 *
 * @param {Array} currentCards - the board's CURRENT card documents (each with
 *   at least _id, title, description, listId, swimlaneId, labelIds, members,
 *   assignees, dueAt, archived, boardId).
 * @param {Array} activities - the board's FULL activity log (any order).
 * @param {Date|string|number} asOfTimestamp - the point in time to reconstruct.
 * @returns {{asOf: Date, cards: Array}} one projection per input card, each:
 *   { _id, existed, title, description, listId, swimlaneId, labelIds,
 *     members, assignees, dueAt, archived, unreversedActivityTypes }
 *   `existed` is false when a createCard activity after asOfTimestamp proves
 *   the card did not exist yet; such cards should be hidden by the caller.
 */
export function reconstructBoardStateAt(currentCards, activities, asOfTimestamp) {
  const asOfTime = toTime(asOfTimestamp);
  const allActivities = Array.isArray(activities) ? activities : [];

  const cards = (Array.isArray(currentCards) ? currentCards : []).map(card => {
    const future = allActivities
      .filter(a => a && a.cardId === card._id && toTime(a.createdAt) > asOfTime)
      // Newest first, so undoing walks strictly backwards through history.
      .sort((a, b) => toTime(b.createdAt) - toTime(a.createdAt));

    let state = {
      _id: card._id,
      existed: true,
      title: card.title || '',
      description: card.description || '',
      listId: card.listId,
      swimlaneId: card.swimlaneId,
      labelIds: cloneArray(card.labelIds),
      members: cloneArray(card.members),
      assignees: cloneArray(card.assignees),
      dueAt: card.dueAt || null,
      archived: !!card.archived,
      unreversedActivityTypes: [],
    };

    for (const activity of future) {
      if (UNDOABLE_ACTIVITY_TYPES.has(activity.activityType)) {
        state = undoActivity(state, activity);
      } else if (
        KNOWN_UNREVERSIBLE_ACTIVITY_TYPES.has(activity.activityType) &&
        !state.unreversedActivityTypes.includes(activity.activityType)
      ) {
        state = {
          ...state,
          unreversedActivityTypes: [
            ...state.unreversedActivityTypes,
            activity.activityType,
          ],
        };
      }
    }

    return state;
  });

  return {
    asOf: asOfTime ? new Date(asOfTime) : null,
    cards,
  };
}

export { UNDOABLE_ACTIVITY_TYPES, KNOWN_UNREVERSIBLE_ACTIVITY_TYPES };
