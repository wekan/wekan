import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { Session } from 'meteor/session';
import { FlowRouter } from 'meteor/ostrio:flow-router-extra';
import { TAPi18n } from '/imports/i18n';
import { ReactiveCache } from '/imports/reactiveCache';
import { formatDateForDisplay } from '/client/lib/dateDisplay';
import { loadSinceLastVisit, previousVisit } from '/client/lib/boardVisits';
import './sidebarSinceLastVisit.jade';

// docs/Features/General/Since-Last-Visit/Since-Last-Visit.md

Template.sinceLastVisitSidebar.onCreated(function () {
  this.cards = new ReactiveVar([]);
  this.isLoading = new ReactiveVar(true);
  this.autorun(() => {
    const boardId = Session.get('currentBoard');
    previousVisit(boardId);
    this.isLoading.set(true);
    loadSinceLastVisit(boardId, groups => {
      if (this.view.isDestroyed) return;
      this.isLoading.set(false);
      this.cards.set(groups);
    });
  });
});

Template.sinceLastVisitSidebar.helpers({
  cards() { return Template.instance().cards.get(); },
  isLoading() { return Template.instance().isLoading.get(); },
  sentence(change) { return TAPi18n.__(change.key, { list: change.list }); },
  when(at) { return formatDateForDisplay(at, true, value => value.toLocaleString()); },
});

Template.sinceLastVisitSidebar.events({
  'click .js-open-since-visit-card'(event) {
    event.preventDefault();
    const boardId = Session.get('currentBoard');
    const board = ReactiveCache.getBoard(boardId);
    FlowRouter.go('card', { boardId, slug: (board && board.slug) || 'board', cardId: event.currentTarget.dataset.cardId });
  },
});
