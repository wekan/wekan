import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { FlowRouter } from 'meteor/ostrio:flow-router-extra';
import { TAPi18n } from '/imports/i18n';
import { ReactiveCache } from '/imports/reactiveCache';
import Cards from '/models/cards';
import Checklists from '/models/checklists';
import ChecklistItems from '/models/checklistItems';
import { Filter } from '/client/lib/filter';
import { Utils } from '/client/lib/utils';
import { boardFlagOn } from '/client/lib/boardFlagOn';
import './fromText.jade';

// docs/Features/Cards/Checklist-From-Description.md and
// docs/Features/Cards/Action-Items.md. The lines are found by the pure
// models/lib/descriptionListItems.js and models/lib/actionItems.js; this makes
// the checklist, the subtasks or the cards through the same calls the card's
// own forms use, so every permission rule applies as it does there.
const { descriptionListItems } = require('/models/lib/descriptionListItems');
const { actionItems } = require('/models/lib/actionItems');

function realCard(card) {
  return card && card.getRealCard ? card.getRealCard() : card;
}

function boardUsernames(card) {
  const board = card && ReactiveCache.getBoard(card.boardId);
  const members = board && board.activeMembers ? board.activeMembers() : [];
  return members.map(m => ReactiveCache.getUser(m.userId)).filter(Boolean).map(u => u.username);
}

export function descriptionChecklistItems(card) {
  const real = realCard(card);
  if (!real || !boardFlagOn('allowsChecklistFromDescriptionOnCard', real.boardId)) return [];
  return descriptionListItems(real.getDescription ? real.getDescription() : real.description);
}

// The action items of a comment ({ text, cardId }) or of a card's description.
export function actionItemsOf(input) {
  // A comment ({ text, cardId }), a card, or a menu's { card }.
  const source = input && input.card && input.text === undefined ? input.card : input;
  if (!source) return [];
  const card = realCard(source.cardId && source.text !== undefined ? ReactiveCache.getCard(source.cardId) : source);
  if (!card || !boardFlagOn('allowsActionItemsOnCard', card.boardId)) return [];
  const text = source.text !== undefined ? source.text : (card.getDescription ? card.getDescription() : card.description);
  return actionItems(text, boardUsernames(card));
}

// {{#if descriptionChecklistItemsOf card}} and {{#if actionItemsOf this}}.
Template.registerHelper('descriptionChecklistItemsOf', card => descriptionChecklistItems(card));
Template.registerHelper('actionItemsOf', source => actionItemsOf(source));

Template.checklistFromDescriptionPopup.helpers({
  items() { return descriptionChecklistItems(ReactiveCache.getCard(this.cardId) || this.card); },
});

Template.checklistFromDescriptionPopup.events({
  async 'click .js-make-description-checklist'(event) {
    event.preventDefault();
    const card = realCard(ReactiveCache.getCard(this.cardId) || this.card);
    const items = descriptionChecklistItems(card);
    if (!card || !items.length) return;
    const sort = Utils.calculateIndexData(card.lastChecklist(), null).base;
    const checklistId = await new Promise((resolve, reject) => {
      Checklists.insert({ cardId: card._id, title: TAPi18n.__('checklist'), sort },
        (err, id) => (err ? reject(err) : resolve(id)));
    });
    let itemSort = 0;
    for (const item of items) {
      ChecklistItems.insert({ title: item.title, checklistId, cardId: card._id, sort: itemSort, isFinished: item.checked });
      itemSort += 1;
    }
    Popup.back();
  },
  async 'click .js-make-description-subtasks'(event) {
    event.preventDefault();
    const card = realCard(ReactiveCache.getCard(this.cardId) || this.card);
    for (const item of descriptionChecklistItems(card)) {
      const id = await Meteor.callAsync('addSubtaskCard', card._id, item.title, false);
      if (id) Filter.addException(id);
    }
    Popup.back();
  },
});

Template.actionItemsPopup.helpers({
  items() { return actionItemsOf(this).map((item, index) => ({ ...item, index })); },
});

Template.actionItemsPopup.events({
  async 'click .js-create-action-items'(event, tpl) {
    event.preventDefault();
    const source = this.card && this.text === undefined ? this.card : this;
    const card = realCard(source.cardId && source.text !== undefined ? ReactiveCache.getCard(source.cardId) : source);
    if (!card) return;
    const picked = new Set(tpl.$('.js-action-item:checked').toArray().map(el => Number(el.dataset.index)));
    const items = actionItemsOf(source).filter((item, index) => picked.has(index));
    const board = ReactiveCache.getBoard(card.boardId);
    const first = ReactiveCache.getCards({ listId: card.listId, swimlaneId: card.swimlaneId, archived: false },
      { sort: { sort: 1 }, limit: 1 })[0];
    let sort = first && typeof first.sort === 'number' ? first.sort - 1 : 0;
    const url = FlowRouter.url('card', { boardId: card.boardId, slug: (board && board.slug) || 'board', cardId: card._id });
    const description = TAPi18n.__('action-items-from', { card: `[${card.title}](${url})` });
    // Top of the list, in the order written: the last line is added first.
    for (const item of [...items].reverse()) {
      const user = item.username && ReactiveCache.getUser({ username: item.username });
      const _id = await Cards.insertAsync({
        title: item.title,
        description,
        members: user ? [user._id] : [],
        labelIds: [],
        customFields: [],
        listId: card.listId,
        boardId: card.boardId,
        swimlaneId: card.swimlaneId,
        sort,
        type: 'cardType-card',
        cardNumber: await board.getNextCardNumber(),
        linkedId: '',
      });
      if (_id) Filter.addException(_id);
      sort -= 1;
    }
    Popup.back();
  },
});
