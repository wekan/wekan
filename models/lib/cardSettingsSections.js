'use strict';

// Board Settings / Card - also opened from an opened card's "+ Add" - as the
// Admin Panel's left menu and right pane (docs/Features/Cards/Card-Fields.md):
// the left menu lists these sections, the right pane the rows of the open one,
// each row with its "Show on Minicard" and "Show on Card" checkbox and order
// arrows; each section with a checkbox of its own, whether it is shown at all
// on that side (hiddenSectionsOf below).
//
// Every row of models/lib/cardSettingsRows.js is in exactly one section
// (tests/cardSettingsCoverage.test.cjs). Card (`general`) also holds what is
// not a field: asking for a move reason and the Draggable table.
//
// ONE SECTION MODEL, BOTH SIDES (2026-10-28). The opened card and the minicard
// draw these sections, in the board's section order of that side
// (`cardSettingsSectionOrder` for Show on Card, `minicardSettingsSectionOrder`
// for Show on Minicard), and each section's fields in that side's row order
// (models/lib/cardFieldOrder.js) - so what Card Settings lists, and how it is
// dragged, is what the card and the minicard show. The opened card heads each
// section with its icon and title; the minicard, which is compact, has no
// headings, only the grouping and the order.
//
// Pure: no Meteor.

const { CARD_SETTINGS_ROWS } = require('./cardSettingsRows');

// THE ORDER OF THIS TABLE IS THE OPENED CARD'S DEFAULT SECTION ORDER. Since
// 2026-10-28 the opened card draws exactly these sections, in the board's
// `cardSettingsSectionOrder` (Card Settings, Show on Card), and a board that
// never dragged one gets this order - so it is the order the opened card drew
// its fields in before it used Card Settings' sections, as far as the new
// grouping allows: Labels (labels, stickers, location) first, then the dates,
// the people, Card (dependencies, card sorting by number and the list - the
// old "Sort" group), Time (spent time and the two timers, also from "Sort"),
// Custom Fields, Vote, Planning Poker, Description, Scrum, and the old fixed
// tail: Checklists, Subtasks, Attachments (with Text notes) and Comments.
// The minicard has its own default (DEFAULT_SECTION_ORDER.minicard below).
// tests/cardSectionsOnCard.test.cjs pins both.
const SECTIONS = Object.freeze([
  { id: 'labels', icon: 'fa-tag', labelKey: 'labels',
    keys: ['labels', 'labelsAboveTitle', 'labelText', 'labelTextPersonal', 'stickers', 'location', 'cardColor'] },
  { id: 'date', icon: 'fa-calendar', labelKey: 'date',
    keys: ['receivedDate', 'startDate', 'dueDate', 'endDate', 'dueComplete', 'dueFromTitle', 'atRisk', 'forecast'] },
  { id: 'members', icon: 'fa-users', labelKey: 'members',
    keys: ['members', 'assignee', 'creator', 'requestedBy', 'assignedBy', 'suggestedMembers'] },
  // Card: what is not a field (asking for a move reason, the Draggable table,
  // in its hamburger) and the card's own rows.
  { id: 'card', icon: 'fa-id-card-o', labelKey: 'card', general: true,
    keys: ['cardNumber', 'collapse', 'parentCard', 'linkedCard', 'dependencies', 'cardSortingByNumber',
      'showLists', 'listTitle', 'swimlaneName', 'cardButtons', 'similarCards'] },
  { id: 'time', icon: 'fa-clock-o', labelKey: 'time',
    keys: ['spentTime', 'flowtime', 'pomodoro'] },
  { id: 'customFields', icon: 'fa-list-alt', labelKey: 'custom-fields',
    keys: ['customFields'] },
  { id: 'vote', icon: 'fa-thumbs-up', labelKey: 'vote-question',
    keys: ['vote'] },
  { id: 'poker', icon: 'fa-check-square', labelKey: 'poker-question', keys: ['poker'] },
  { id: 'description', icon: 'fa-file-text-o', labelKey: 'description',
    keys: ['descriptionTitle', 'descriptionText', 'descriptionBadge'] },
  { id: 'scrum', icon: 'fa-repeat', labelKey: 'scrum-settings',
    keys: ['scrumSprint', 'scrumPastSprints', 'scrumRelease', 'scrumIssueType', 'scrumAcceptanceCriteria', 'scrumBacklogRank'] },
  { id: 'checklists', icon: 'fa-check', labelKey: 'checklists',
    keys: ['checklists', 'checklistTitle', 'checklistDueDate', 'checklistCount', 'checklistFromDescription'] },
  { id: 'subtasks', icon: 'fa-sitemap', labelKey: 'subtasks', keys: ['subtasks'] },
  { id: 'attachments', icon: 'fa-paperclip', labelKey: 'attachments',
    keys: ['cover', 'attachments', 'attachmentCount', 'attachmentPreviews', 'attachmentDetails', 'textNotes', 'whiteboard'] },
  { id: 'comments', icon: 'fa-comment-o', labelKey: 'comments',
    keys: ['comments', 'commentCount', 'unreadComments', 'activities', 'actionItems'] },
]);

const sectionOf = key => SECTIONS.find(s => s.keys.includes(key)) || null;

// What a section's hamburger in Card Settings holds besides Card's own (Ask
// for a reason, the Draggable table): the section's BOARD settings - Card
// Settings is Board Settings / Card, about every card of the board, and has no
// card. `template` is drawn in the hamburger's panel, under the section's line
// (sidebar.jade cardSettingsInlinePanel) - the settings themselves, not a link
// to a popup of them.
//
// (Until 2026-10-28 Card Settings was also drawn on the opened card, and these
// held that card's actions too - Filter: Subtasks, Edit voting, Card kind,
// Edit custom fields, Link fields... Those live in the card's own section
// hamburgers in cardDetails; Create Field is the "+" under Custom Fields'
// items, cardSettingsCustomFields.js.) tests/cardSectionActions.test.cjs.
const CARD_ACTIONS = Object.freeze({
  subtasks: [
    { id: 'subtaskSettings', template: 'boardSubtaskSettingsBody', icon: 'fa-cog', label: ['subtask-settings'], board: true },
  ],
});

function cardActionsOf(sectionId) {
  return CARD_ACTIONS[sectionId] || [];
}

// A row's label inside its section: the parts that only repeat the section's
// own name are left out - "Scrum settings: Sprint" is "Sprint" under Scrum
// settings - unless that would leave nothing.
function labelInSection(row, section) {
  const parts = (row && row.label) || [];
  if (!section || parts.length < 2) return parts;
  const rest = parts.filter(k => k !== section.labelKey);
  return rest.length ? rest : parts;
}

// The section's rows, in the table's order.
function rowsOfSection(sectionId) {
  const section = SECTIONS.find(s => s.id === sectionId);
  if (!section) return [];
  return section.keys
    .map(key => CARD_SETTINGS_ROWS.find(r => r.key === key))
    .filter(Boolean);
}

// The default section order of each side when the board stores none. The
// card's is the table's order (see above). The minicard's is the order its
// fields were drawn in before it used Card Settings' sections, as far as the
// grouping allows - each section where its first field used to be: the Scrum
// blocks, the dates line (Date, then Time for its Spent time), Labels, Custom
// Fields, the people, the checklists, then the old badge strip (Card's
// dependencies and sorting number, the comment count, Vote, Poker, the
// attachment count, Subtasks) and Description's text.
const DEFAULT_SECTION_ORDER = Object.freeze({
  card: Object.freeze(SECTIONS.map(s => s.id)),
  minicard: Object.freeze(['scrum', 'date', 'time', 'labels', 'customFields', 'members', 'checklists',
    'card', 'comments', 'vote', 'poker', 'attachments', 'subtasks', 'description']),
});

// Where each side's section order is stored on the board.
const SECTION_ORDER_FIELD = Object.freeze({
  card: 'cardSettingsSectionOrder',
  minicard: 'minicardSettingsSectionOrder',
});

const sideOf = side => (side === 'minicard' ? 'minicard' : 'card');

// The order of the sections on `side` ('card', the default, or 'minicard'),
// as the board stores it (written when Card Settings drags one section above
// another, the way a checklist is dragged above another): the stored ids that
// are sections, each once, then every section it does not name in the side's
// default order - so a section added later still appears, and a board that
// never dragged one has the default. Returns the ids.
function sectionOrder(stored, side) {
  const known = DEFAULT_SECTION_ORDER[sideOf(side)];
  const seen = new Set();
  const ids = (Array.isArray(stored) ? stored : [])
    .filter(id => typeof id === 'string' && known.includes(id) && !seen.has(id) && seen.add(id));
  return [...ids, ...known.filter(id => !seen.has(id))];
}

// `board`'s section order on `side`.
function sectionOrderOf(board, side) {
  return sectionOrder(board ? board[SECTION_ORDER_FIELD[sideOf(side)]] : undefined, side);
}

// `sections` (SECTIONS, or a filtered list of them) in the stored order.
function orderedSections(sections, stored, side) {
  const order = sectionOrder(stored, side);
  return [...sections].sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));
}

// The order to store after a drop: `shownIds` are the sections Card Settings
// shows, top to bottom as they were dropped. It may show only some (a field
// turned off for the whole instance can leave a section with no row), so the
// shown ones take the places the shown ones had and every other section keeps
// its own place.
function sectionOrderAfterDrop(stored, shownIds, side) {
  const order = sectionOrder(stored, side);
  const dropped = Array.isArray(shownIds) ? shownIds : [];
  const shown = sectionOrder(dropped, side).filter(id => dropped.includes(id));
  const shownSet = new Set(shown);
  let next = 0;
  return order.map(id => (shownSet.has(id) ? shown[next++] : id));
}

// The fields of section `sectionId` on `side`, in the order Card Settings
// lists that section's rows (cardSettingsRows.js rowsForSide over `flatOrder`,
// the side's canonical field order from models/lib/cardFieldOrder.js): what
// the opened card and the minicard iterate inside each section, so the two
// cannot disagree with Card Settings. Rows without that side are left out.
function sectionFieldsOn(side, flatOrder, sectionId) {
  const section = SECTIONS.find(s => s.id === sectionId);
  if (!section) return [];
  const { rowsForSide } = require('./cardSettingsRows');
  return rowsForSide(sideOf(side), Array.isArray(flatOrder) ? flatOrder : [])
    .filter(row => section.keys.includes(row.key))
    .map(row => row.key);
}

// ── Whether a whole section is shown, per side ──────────────────────────────
// Each section's title in Card Settings has a checkbox of its own, left of the
// title: whether the WHOLE section is shown on the side Card Settings shows
// (Show on Card or Show on Minicard). Unticked on Show on Card, the section is
// missing from every opened card of the board, whatever its rows are ticked;
// unticked on Show on Minicard, from every minicard. The two sides are
// independent. The rows keep their own ticks while their section is hidden,
// so ticking the section back shows exactly what was shown before. The board
// stores the hidden sections of each side:
//
//   cardSettingsHiddenOnCard:     [sectionId]
//   cardSettingsHiddenOnMinicard: [sectionId]
//
// models/lib/cardShownFields.js boardForCard / boardForMinicard apply them.

const SIDES = Object.freeze(['card', 'minicard']);
const HIDDEN_SECTIONS_FIELD = Object.freeze({
  card: 'cardSettingsHiddenOnCard',
  minicard: 'cardSettingsHiddenOnMinicard',
});
const SECTION_IDS = Object.freeze(SECTIONS.map(s => s.id));

// A stored list of section ids, as it may be kept: only known ids, each once,
// in the table's order.
function normaliseHiddenSections(stored) {
  const list = Array.isArray(stored) ? stored : [];
  return SECTION_IDS.filter(id => list.includes(id));
}

// The sections `board` hides on `side` ('card' or 'minicard').
function hiddenSectionsOf(board, side) {
  const field = HIDDEN_SECTIONS_FIELD[side];
  if (!field || !board) return [];
  return normaliseHiddenSections(board[field]);
}

// Whether `board` shows section `id` on `side` at all.
function sectionShown(board, side, id) {
  return !hiddenSectionsOf(board, side).includes(id);
}

// The list to store after ticking (shown = true) or unticking section `id`.
// An unknown id changes nothing.
function hiddenSectionsAfter(stored, id, shown) {
  const now = new Set(normaliseHiddenSections(stored));
  if (SECTION_IDS.includes(id)) {
    if (shown) now.delete(id);
    else now.add(id);
  }
  return SECTION_IDS.filter(s => now.has(s));
}

// The row keys whose section `board` hides on `side` - only the rows that
// have that side (cardSettingsRows.js), so a card-only helper is never
// counted as hidden from the minicard.
function rowKeysHiddenBySections(board, side) {
  const hidden = hiddenSectionsOf(board, side);
  if (!hidden.length) return [];
  return hidden
    .flatMap(id => rowsOfSection(id))
    .filter(row => row && row[side])
    .map(row => row.key);
}

// A section with exactly ONE row on the shown side is drawn as one line in
// Card Settings: one checkbox, its name, one hamburger - no caret, no count,
// no nested item.
function isSingleRowSection(rows) {
  return Array.isArray(rows) && rows.length === 1;
}

// That one line's checkbox: ticked when the row's own flag is on AND its
// section is not hidden on that side - so it reads exactly "this field is
// shown on this side".
function singleLineChecked(board, side, id, rowChecked) {
  return Boolean(rowChecked) && sectionShown(board, side, id);
}

module.exports = {
  SECTIONS, sectionOf, labelInSection, rowsOfSection, CARD_ACTIONS, cardActionsOf,
  sectionOrder, sectionOrderOf, orderedSections, sectionOrderAfterDrop, sectionFieldsOn,
  DEFAULT_SECTION_ORDER, SECTION_ORDER_FIELD,
  SIDES, HIDDEN_SECTIONS_FIELD, SECTION_IDS, normaliseHiddenSections, hiddenSectionsOf,
  sectionShown, hiddenSectionsAfter, rowKeysHiddenBySections, isSingleRowSection, singleLineChecked,
};
