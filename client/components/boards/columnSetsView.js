import { ReactiveVar } from 'meteor/reactive-var';
import { Random } from 'meteor/random';
import { ReactiveCache } from '/imports/reactiveCache';
import { Utils } from '/client/lib/utils';
import Boards from '/models/boards';
import Cards from '/models/cards';

const cs = require('/models/lib/columnSets');

// #211: the Column sets board view.
Template.columnSetsView.onCreated(function () {
  this.setId = new ReactiveVar(null);
});

function currentSet(tpl) {
  const board = Utils.getCurrentBoard();
  const all = cs.sets(board);
  return all.find(s => s._id === tpl.setId.get()) || all[0] || null;
}

function saveSets(next) {
  const board = Utils.getCurrentBoard();
  if (board && next) Boards.update(board._id, { $set: { columnSets: next } });
}

Template.columnSetsView.helpers({
  columnSets() { return cs.sets(Utils.getCurrentBoard()); },
  isCurrentSet() { const set = currentSet(Template.instance()); return !!(set && set._id === this._id); },
  currentSet() { return currentSet(Template.instance()); },
  colors() { return cs.COLORS; },
  isBoardAdmin() { return !!ReactiveCache.getCurrentUser()?.isBoardAdmin(); },
  canWrite() { const board = Utils.getCurrentBoard(); return !!board && Utils.currentUserCan('write', board); },
  columns() {
    const tpl = Template.instance();
    const set = currentSet(tpl);
    const board = Utils.getCurrentBoard();
    if (!set || !board) return [];
    const cards = ReactiveCache.getCards({ boardId: board._id, archived: false, type: 'cardType-card' }, { sort: { sort: 1 } });
    const all = cs.sets(board);
    return cs.columnsWithCards(set, cards).map(column => ({ ...column,
      cards: column.cards.map(card => ({ _id: card._id, title: card.title, otherBadges: cs.otherSetBadges(card, all, set._id) })) }));
  },
});

Template.columnSetsView.events({
  'change .js-column-set-select'(event, tpl) {
    tpl.setId.set(event.currentTarget.value);
  },
  'click .js-add-column-set-button, submit .js-add-column-set'(event, tpl) {
    event.preventDefault();
    const id = Random.id();
    const next = cs.addColumnSet(cs.sets(Utils.getCurrentBoard()), tpl.$('.js-column-set-name').val(), id);
    if (!next) return;
    saveSets(next);
    tpl.setId.set(id);
    tpl.$('.js-column-set-name').val('');
  },
  'click .js-add-column-button, submit .js-add-column'(event, tpl) {
    event.preventDefault();
    const set = currentSet(tpl);
    if (!set) return;
    const next = cs.addColumn(cs.sets(Utils.getCurrentBoard()), set._id, tpl.$('.js-column-title').val(),
      tpl.$('.js-column-color').val(), Random.id());
    if (!next) return;
    saveSets(next);
    tpl.$('.js-column-title').val('');
  },
  'click .js-remove-column'(event, tpl) {
    event.preventDefault();
    const set = currentSet(tpl);
    if (set) saveSets(cs.removeColumn(cs.sets(Utils.getCurrentBoard()), set._id, event.currentTarget.dataset.columnId));
  },
  'click .js-remove-column-set'(event, tpl) {
    event.preventDefault();
    const set = currentSet(tpl);
    if (set && confirm(`${set.name}?`)) saveSets(cs.removeColumnSet(cs.sets(Utils.getCurrentBoard()), set._id));
    tpl.setId.set(null);
  },
  'dragstart .js-column-sets-card'(event) {
    const dt = event.originalEvent && event.originalEvent.dataTransfer;
    if (dt) { dt.setData('text/plain', event.currentTarget.dataset.cardId); dt.effectAllowed = 'move'; }
  },
  'dragover .js-column-sets-drop'(event) {
    event.preventDefault();
  },
  'drop .js-column-sets-drop'(event, tpl) {
    event.preventDefault();
    const dt = event.originalEvent && event.originalEvent.dataTransfer;
    const cardId = dt && dt.getData('text/plain');
    const set = currentSet(tpl);
    const modifier = cs.placeModifier(set, event.currentTarget.dataset.columnId || null);
    if (cardId && modifier) Cards.update(cardId, modifier);
  },
  'click .js-column-sets-open-card'(event) {
    event.preventDefault();
    const cardId = event.currentTarget.dataset.cardId;
    const board = Utils.getCurrentBoard();
    Meteor.subscribe('popupCardData', cardId, {
      onReady() {
        Session.set('popupCardId', cardId);
        if (board) Session.set('popupCardBoardId', board._id);
        if (!Popup.isOpen()) Popup.open('cardDetails')(event);
      },
    });
  },
});
