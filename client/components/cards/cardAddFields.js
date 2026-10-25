import './cardDetails.jade';
import './cardAddFields.jade';
import { ReactiveVar } from 'meteor/reactive-var';
import { ReactiveCache } from '/imports/reactiveCache';
import { TAPi18n } from '/imports/i18n';
import { Utils } from '/client/lib/utils';
import Cards from '/models/cards';
import { leftMenuData, paneTitle } from '/models/lib/leftMenu';

// docs/Features/Cards/Card-Fields.md: an opened card shows only the fields it
// has data in - and its description, attachments and comments, empty or not -
// and "+ Add" chooses the rest. The rules are models/lib/cardShownFields.js.
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
  };
}

// The card's document, with its methods, for a template's data.
function cardOf(data) {
  if (!data || !data._id) return null;
  return ReactiveCache.getCard(data._id) || data;
}

// The board as this card sees it (cardShownFields.js boardForCard).
export function cardBoardView(data) {
  const board = Utils.getCurrentBoard();
  const card = cardOf(data);
  if (!board || !card || card.boardId !== board._id) return board;
  return f.boardForCard(board, card, cardFieldCounts(card));
}

// The opened card and each of its section templates read `currentBoard`; this
// template-level helper answers before the global one, so every
// `currentBoard.allowsX` in them asks this card's view - and a template not
// listed here (the minicard, the board) is unchanged.
export const CARD_FIELD_TEMPLATES = Object.freeze([
  'cardDetails', 'cardFieldSectionLabels', 'cardFieldSectionDates', 'cardFieldSectionMembers',
  'cardFieldSectionDependencies', 'cardFieldSectionSort', 'cardFieldSectionCustomFields',
  'cardFieldSectionVoteAndPoker', 'cardFieldSectionDescription',
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
  return !card || f.isShown(key, card, cardFieldCounts(card));
}

Template.cardDetails.events({
  'click .js-open-card-add-fields': Popup.open('cardAddFields'),
});

Template.cardAddFieldsPopup.onCreated(function () {
  this.section = new ReactiveVar(null);
  // The one checkbox that animates: the one just clicked. A pane opened shows
  // its ticks as they are - its rows are reused from the last pane, and a tick
  // that changes there must not play the animation.
  this.animating = new ReactiveVar(null);
});

function sectionOf(tpl) {
  const board = Utils.getCurrentBoard();
  const sections = f.addSections(board);
  const chosen = tpl.section.get();
  return (sections.find(s => s.id === chosen) || sections[0] || {}).id;
}

function menuOf(board) {
  return f.addSections(board).map(s => ({ id: s.id, icon: s.icon, labelKey: s.labelKey }));
}

Template.cardAddFieldsPopup.helpers({
  menuItems() {
    const tpl = Template.instance();
    return leftMenuData(menuOf(Utils.getCurrentBoard()), sectionOf(tpl), 'js-card-add-fields-menu');
  },
  paneTitleData() {
    const tpl = Template.instance();
    return paneTitle(menuOf(Utils.getCurrentBoard()), sectionOf(tpl));
  },
  rows() {
    const tpl = Template.instance();
    const card = cardOf(Template.currentData());
    return f.addRows(Utils.getCurrentBoard(), card, sectionOf(tpl), cardFieldCounts(card));
  },
  isAnimating(key) { return Template.instance().animating.get() === key; },
  rowLabel() {
    return (this.label || []).map(k => TAPi18n.__(k)).join(this.labelSeparator || ' ');
  },
});

Template.cardAddFieldsPopup.events({
  'click .js-card-add-fields-menu'(event, tpl) {
    event.preventDefault();
    tpl.animating.set(null);
    tpl.section.set(event.currentTarget.dataset.id);
  },
  async 'click .js-card-add-field'(event, tpl) {
    event.preventDefault();
    tpl.animating.set(event.currentTarget.dataset.key);
    const card = cardOf(Template.currentData());
    const key = event.currentTarget.dataset.key;
    if (!card || !f.FIELD_KEYS.includes(key)) return;
    const counts = cardFieldCounts(card);
    const next = f.cardFieldsAfter(card, key, !f.isShown(key, card, counts), counts);
    await Cards.updateAsync(card._id, { $set: next });
  },
});
