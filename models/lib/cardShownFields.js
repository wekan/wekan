'use strict';

// Which fields an opened card shows (docs/Features/Cards/Card-Fields.md).
//
// An opened card shows only what it HAS: a field with data in it - a due date,
// labels, a checklist - is shown, an empty one is not. Four are always there,
// empty or not, because they are what a card is for: the description (its
// title and its text), the attachments with their Add attachment, and the
// comments. The cover is shown when the card has one.
//
// Above the card's fields, under its cover, "+ Add" opens Board Settings /
// Card - the same popup - for this card: beside each row's board-wide "Show on
// Minicard" and "Show on Card", whether THIS card shows the field. Ticking an
// empty field shows it on this card, to be filled in; unticking a field with
// data hides it from this card. The card keeps both choices:
//
//   shownFields:  [key]  shown although empty
//   hiddenFields: [key]  hidden although it has data
//
// Board Settings / Card still decides what a card of the board CAN show: a
// field turned off there is shown on no card. The rows not in FIELD_KEYS
// (Collapse, Labels text, the attachment previews, the badges, the helpers
// such as Similar cards) change how a shown field looks or help to fill it;
// they follow Board Settings / Card alone.
//
// HOW IT HIDES. The card's templates read `currentBoard.allowsDueDate` and so
// on. The opened card and its section templates get their own `currentBoard`
// (client/components/cards/cardDetails.js): this card's view of the board,
// whose flags read false for the fields this card does not show - the same
// overlay as Admin Panel / Visibility / Features (cardFieldVisibility.js), one
// level down. The board document is never changed.
//
// Pure CommonJS: tests/cardShownFields.test.cjs.

const { CARD_SETTINGS_ROWS } = require('./cardSettingsRows');

// The fields a card shows by its own data or choice - the rest of Board
// Settings / Card's rows (modifiers, badges, helpers) follow the board alone.
// The popup's sections are models/lib/cardSettingsSections.js.
const FIELD_KEYS = Object.freeze([
  'receivedDate', 'startDate', 'dueDate', 'endDate', 'dueComplete',
  'members', 'assignee', 'creator', 'requestedBy', 'assignedBy',
  'labels', 'stickers', 'location',
  'descriptionTitle', 'descriptionText',
  'checklists', 'subtasks',
  'cover', 'attachments', 'textNotes',
  'spentTime', 'flowtime', 'pomodoro',
  'customFields',
  'vote', 'poker',
  'scrumSprint', 'scrumPastSprints', 'scrumRelease', 'scrumIssueType', 'scrumAcceptanceCriteria', 'scrumBacklogRank',
  'comments', 'activities',
  'cardNumber', 'dependencies', 'cardSortingByNumber', 'showLists', 'swimlaneName',
]);

// Shown on every card, empty or not.
const ALWAYS = Object.freeze(['descriptionTitle', 'descriptionText', 'attachments', 'comments']);

const filled = v => (Array.isArray(v) ? v.length > 0 : v !== undefined && v !== null && v !== '' && v !== false);
const scrumOf = card => (card && card.scrum && typeof card.scrum === 'object' ? card.scrum : {});

// Whether `card` has data in the field `key`. What lives in other collections
// (checklists, subtasks, text notes) comes as counts the caller looked up.
function hasData(key, card, counts = {}) {
  const c = card || {};
  const scrum = scrumOf(c);
  switch (key) {
    case 'receivedDate': return filled(c.receivedAt);
    case 'startDate': return filled(c.startAt);
    case 'dueDate': return filled(c.dueAt);
    case 'endDate': return filled(c.endAt);
    case 'dueComplete': return c.dueComplete === true;
    case 'members': return filled(c.members);
    case 'assignee': return filled(c.assignees);
    case 'requestedBy': return filled(c.requestedBy) || filled(c.requesters);
    case 'assignedBy': return filled(c.assignedBy) || filled(c.assigners);
    case 'labels': return filled(c.labelIds);
    case 'stickers': return filled(c.stickers);
    case 'location': return filled(c.locationName) || filled(c.locationAddress) || filled(c.locations)
      || (Number.isFinite(c.locationLatitude) && Number.isFinite(c.locationLongitude));
    case 'checklists': return (counts.checklists || 0) > 0;
    case 'subtasks': return (counts.subtasks || 0) > 0;
    case 'cover': return filled(c.coverId);
    case 'textNotes': return (counts.textNotes || 0) > 0;
    case 'spentTime': return Number(c.spentTime) > 0;
    case 'flowtime': return filled(c.flowStartAt);
    case 'pomodoro': return filled(c.pomodoroStartAt) || Number(c.pomodoroCount) > 0;
    case 'customFields': return (Array.isArray(c.customFields) ? c.customFields : [])
      .some(f => f && filled(f.value) && !(Array.isArray(f.value) && !f.value.length));
    case 'vote': return filled(c.vote && c.vote.question);
    case 'poker': return filled(c.poker && c.poker.question);
    case 'dependencies': return filled(c.cardDependencies);
    case 'scrumSprint': return filled(scrum.sprintId);
    case 'scrumPastSprints': return filled(scrum.pastSprintIds);
    case 'scrumRelease': return filled(scrum.releaseId) || filled(scrum.releaseIds);
    case 'scrumIssueType': return filled(scrum.issueType);
    case 'scrumAcceptanceCriteria': return filled(scrum.acceptanceCriteria);
    case 'scrumBacklogRank': return Number.isFinite(scrum.backlogRank);
    // Always shown, and nothing to measure.
    case 'descriptionTitle': case 'descriptionText': case 'attachments': case 'comments': return true;
    // Shown only when added: a creator, a number, the history - every card has
    // them, so having them is not a reason to show them.
    default: return false;
  }
}

const listOf = v => (Array.isArray(v) ? v.filter(k => FIELD_KEYS.includes(k)) : []);

// Whether this card shows `key` (before Board Settings / Card is asked).
function isShown(key, card, counts) {
  if (!FIELD_KEYS.includes(key)) return true; // not a per-card field: the board decides
  if (listOf(card && card.hiddenFields).includes(key)) return false;
  if (listOf(card && card.shownFields).includes(key)) return true;
  return ALWAYS.includes(key) || hasData(key, card, counts);
}

// The card's two lists after ticking (show = true) or unticking `key`. Only
// a choice that differs from what the data would decide is kept.
function cardFieldsAfter(card, key, show, counts) {
  let shown = listOf(card && card.shownFields).filter(k => k !== key);
  let hidden = listOf(card && card.hiddenFields).filter(k => k !== key);
  if (!FIELD_KEYS.includes(key)) return { shownFields: shown, hiddenFields: hidden };
  const byData = ALWAYS.includes(key) || hasData(key, card, counts);
  if (show && !byData) shown = [...shown, key];
  if (!show && byData) hidden = [...hidden, key];
  return { shownFields: shown, hiddenFields: hidden };
}

const rowOf = key => CARD_SETTINGS_ROWS.find(r => r.key === key);

// Whether the board lets its cards show `key` at all (Board Settings / Card,
// as the board read returns it, Admin Panel / Visibility applied).
function boardAllows(board, key) {
  const spec = rowOf(key) && rowOf(key).card;
  if (!board || !spec) return false;
  if (spec.scrum) {
    // A Scrum field is shown only when turned on (scrumFields.js visibleFields).
    const visibility = board.scrum && board.scrum.visibility;
    return Boolean(visibility && visibility[spec.scrum] === true);
  }
  const value = board[spec.field];
  // As the templates read it: a plain flag the board never set is the row's
  // default; any other field is shown when it is true (`if currentBoard.allowsX`).
  if (value === undefined && spec.flag) return spec.default !== false;
  return Boolean(value);
}

const cache = typeof WeakMap === 'function' ? new WeakMap() : null;

// The board as THIS card sees it: the flags of the fields the card does not
// show read false. The same object when it shows everything the board allows;
// otherwise a copy with the board's prototype, so every board helper still
// works, cached per board and per set of hidden fields.
function boardForCard(board, card, counts) {
  if (!board || typeof board !== 'object') return board;
  const hidden = FIELD_KEYS.filter(k => !isShown(k, card, counts));
  if (!hidden.length) return board;
  const signature = hidden.join(',');
  const perBoard = cache && cache.get(board);
  if (perBoard && perBoard[signature]) return perBoard[signature];
  const overrides = {};
  let scrumVisibility = null;
  hidden.forEach(key => {
    const spec = rowOf(key) && rowOf(key).card;
    if (!spec) return;
    if (spec.scrum) {
      scrumVisibility = scrumVisibility || {};
      scrumVisibility[spec.scrum] = false;
    } else {
      overrides[spec.field] = false;
    }
  });
  const view = Object.assign(Object.create(Object.getPrototypeOf(board)), board, overrides);
  if (scrumVisibility) {
    const scrum = board.scrum && typeof board.scrum === 'object' ? board.scrum : {};
    view.scrum = { ...scrum, visibility: { ...(scrum.visibility || {}), ...scrumVisibility } };
  }
  if (cache) cache.set(board, { ...(perBoard || {}), [signature]: view });
  return view;
}

module.exports = {
  FIELD_KEYS, ALWAYS, hasData, isShown, cardFieldsAfter, boardAllows, boardForCard,
};
