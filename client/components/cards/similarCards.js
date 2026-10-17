import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { Session } from 'meteor/session';
import { FlowRouter } from 'meteor/ostrio:flow-router-extra';
import { ReactiveCache } from '/imports/reactiveCache';
import { boardFlagOn } from '/client/lib/boardFlagOn';
import './similarCards.jade';

// docs/Features/Cards/Similar-Cards.md. Both templates ask the server
// (server/methods/similarCards.js), which applies the board's read rules.

const WAIT_MS = 400;

function openCard(cardId) {
  const boardId = Session.get('currentBoard');
  const board = ReactiveCache.getBoard(boardId);
  FlowRouter.go('card', { boardId, slug: (board && board.slug) || 'board', cardId });
}

Template.similarCardRow.events({
  'click .js-open-similar-card'(event) {
    event.preventDefault();
    openCard(event.currentTarget.dataset.cardId);
  },
});

// The opened card: asked again when its title or description changes.
Template.similarCards.onCreated(function () {
  this.results = new ReactiveVar([]);
  this.loading = new ReactiveVar(true);
  this.autorun(() => {
    const { cardId } = Template.currentData();
    const card = ReactiveCache.getCard(cardId);
    if (!card) return;
    // Read so the autorun follows them.
    const signature = `${card.title}\u0000${card.description || ''}`;
    clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      Meteor.call('cards.similar', card.boardId, { cardId }, (err, rows) => {
        if (this.view.isDestroyed) return;
        this.loading.set(false);
        this.results.set(err ? [] : rows || []);
        this.signature = signature;
      });
    }, this.signature === undefined ? 0 : WAIT_MS);
  });
});

Template.similarCards.onDestroyed(function () {
  clearTimeout(this.timer);
});

Template.similarCards.helpers({
  results() { return Template.instance().results.get(); },
  loading() { return Template.instance().loading.get(); },
});

// The add-card form: asked when typing pauses, for the one title being typed.
Template.similarCardsHint.onCreated(function () {
  this.results = new ReactiveVar([]);
});

Template.similarCardsHint.onRendered(function () {
  const tpl = this;
  const form = tpl.firstNode && (tpl.firstNode.parentElement || tpl.firstNode.parentNode)?.closest('form');
  if (!form) return;
  tpl.form = form;
  const { selector } = tpl.data;
  tpl.update = () => {
    clearTimeout(tpl.timer);
    const input = form.querySelector(selector);
    const title = input ? input.value.trim() : '';
    const boardId = Session.get('currentBoard');
    if (title.length < 3 || title.includes('\n') || !boardFlagOn('allowsSimilarCardsOnMinicard')) {
      tpl.results.set([]);
      return;
    }
    tpl.timer = setTimeout(() => {
      Meteor.call('cards.similar', boardId, { title }, (err, rows) => {
        if (tpl.view.isDestroyed) return;
        // Only the answer for what is still typed.
        const now = form.querySelector(selector);
        if (!now || now.value.trim() !== title) return;
        tpl.results.set(err ? [] : rows || []);
      });
    }, WAIT_MS);
  };
  tpl.listener = event => {
    if (event.target && event.target.matches && event.target.matches(selector)) tpl.update();
  };
  form.addEventListener('input', tpl.listener);
  form.addEventListener('title-due-refresh', tpl.update);
});

Template.similarCardsHint.onDestroyed(function () {
  clearTimeout(this.timer);
  if (this.form && this.listener) this.form.removeEventListener('input', this.listener);
  if (this.form && this.update) this.form.removeEventListener('title-due-refresh', this.update);
});

Template.similarCardsHint.helpers({
  results() { return Template.instance().results.get(); },
});
