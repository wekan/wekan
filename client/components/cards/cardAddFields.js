import './cardDetails.jade';
import { ReactiveCache } from '/imports/reactiveCache';
import { Utils } from '/client/lib/utils';

// docs/Features/Cards/Card-Fields.md: an opened card shows only the fields it
// has data in - and what its board always shows (by default its description,
// attachments and comments), empty or not - and "+ Add" chooses the rest. The rules are models/lib/cardShownFields.js.
const f = require('/models/lib/cardShownFields');

// What lives in other collections, for "has data".
function countOf(list) {
  if (!list) return 0;
  if (typeof list.length === 'number') return list.length;
  return typeof list.count === 'function' ? list.count() : 0;
}

export function cardFieldCounts(card) {
  if (!card || !card._id) return {};
  return {
    checklists: typeof card.checklists === 'function' ? countOf(card.checklists()) : 0,
    subtasks: typeof card.subtasks === 'function' ? countOf(card.subtasks()) : 0,
    textNotes: countOf(ReactiveCache.getCardTextNotes({ cardId: card._id })),
    // For a board that does not always show these: shown when there are some.
    attachments: typeof card.attachments === 'function' ? countOf(card.attachments()) : 0,
    comments: typeof card.comments === 'function' ? countOf(card.comments()) : 0,
  };
}

// The card's document, with its methods, for a template's data.
function cardOf(data) {
  if (!data || !data._id) return null;
  return ReactiveCache.getCard(data._id) || data;
}

// What decides which fields `card` shows: its DATA, which a linked card keeps
// on its source card (members, labels, dates, custom fields, checklists ...),
// and its own choices (shownFields / hiddenFields, set on the card opened).
// Reading the linked card's own empty document hid every field its source
// has (the #1946/#6613 browser test). Returns { card, counts }.
export function shownFieldsOf(card) {
  if (!card) return { card: null, counts: {} };
  const real = typeof card.getRealCard === 'function' ? (card.getRealCard() || card) : card;
  if (real === card) return { card, counts: cardFieldCounts(card) };
  return {
    card: { ...real, shownFields: card.shownFields, hiddenFields: card.hiddenFields },
    counts: cardFieldCounts(real),
  };
}

// The board as this card sees it (cardShownFields.js boardForCard).
export function cardBoardView(data) {
  const board = Utils.getCurrentBoard();
  const card = cardOf(data);
  if (!board || !card || card.boardId !== board._id) return board;
  const view = shownFieldsOf(card);
  return f.boardForCard(board, view.card, view.counts);
}

// The opened card and each of its section templates read `currentBoard`; this
// template-level helper answers before the global one, so every
// `currentBoard.allowsX` in them asks this card's view - and a template not
// listed here (the minicard, the board) is unchanged.
export const CARD_FIELD_TEMPLATES = Object.freeze([
  'cardDetails', 'cardFieldSectionLabels', 'cardFieldSectionDates', 'cardFieldSectionMembers',
  'cardFieldSectionDependencies', 'cardFieldSectionSort', 'cardFieldSectionCustomFields',
  'cardFieldSectionVoteAndPoker', 'cardFieldSectionDescription', 'cardCommentsSection',
]);
CARD_FIELD_TEMPLATES.forEach(name => {
  Template[name].helpers({
    currentBoard() {
      const tpl = Template.instance();
      return cardBoardView(tpl && tpl.data);
    },
  });
});

// Whether this card shows the field `key` - for a section with no board flag
// of its own to read (the Scrum fields, cardDetails.js orderedCardFieldSections).
export function cardShowsField(data, key) {
  const card = cardOf(data);
  if (!card) return true;
  const view = shownFieldsOf(card);
  return f.isShown(key, view.card, view.counts, Utils.getCurrentBoard());
}

// "+ Add" opens Board Settings / Card - the same popup - for this card: its
// sections, each row's "Show on Minicard" and "Show on Card", and whether this
// card shows the field (client/components/sidebar/sidebar.js). Overriding
// `currentData` is what reaches the popup's data context (as Board Settings'
// own opener does).
Template.cardDetails.events({
  'click .js-open-card-add-fields'(event) {
    const card = cardOf(Template.currentData());
    if (!card) return;
    const data = { card };
    Popup.open('boardCardSettings').call({ currentData: () => data }, event);
  },
});
