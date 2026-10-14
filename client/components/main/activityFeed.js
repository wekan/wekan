import { ReactiveVar } from 'meteor/reactive-var';
import { FlowRouter } from 'meteor/ostrio:flow-router-extra';
import { TAPi18n } from '/imports/i18n';
import { formatDateForDisplay } from '/client/lib/dateDisplay';

const { activitySentenceKey, withoutUnfilledPlaceholders, humanActivityType } = require('/models/lib/activityFeed');

const PAGE = 50;

// #2026 / #1377: the all-boards activity feed, a page at a time.
Template.activityFeed.onCreated(function () {
  this.entries = new ReactiveVar([]);
  this.hasMore = new ReactiveVar(false);
  this.load = before => Meteor.call('allBoardsActivityFeed', { limit: PAGE, ...(before ? { before } : {}) }, (error, page) => {
    if (error) return;
    this.entries.set([...(before ? this.entries.get() : []), ...(page || [])]);
    this.hasMore.set((page || []).length === PAGE);
  });
  this.load();
});

Template.activityFeed.helpers({
  entries() { return Template.instance().entries.get(); },
  hasMore() { return Template.instance().hasMore.get(); },
  timeText() { return this.createdAt ? formatDateForDisplay(new Date(this.createdAt), true) : ''; },
  // The same sentence the notifications use for this kind of activity, with
  // what it names filled in (models/lib/activityFeed.js feedParams).
  description() {
    const key = this.sentenceKey || activitySentenceKey(this.activityType);
    const params = this.params || { card: this.cardTitle, list: this.listTitle, board: this.boardTitle };
    const text = TAPi18n.__(key, params);
    // A kind of activity with no sentence of its own reads as its words.
    if (text === key) return humanActivityType(this.activityType);
    return withoutUnfilledPlaceholders(text);
  },
  cardUrl() {
    return FlowRouter.path('card', { boardId: this.boardId, slug: this.boardSlug, cardId: this.cardId });
  },
});

Template.activityFeed.events({
  // The card opens from its title, unless a link inside the title was clicked.
  'click .js-activity-feed-card'(event) {
    const link = event.target.closest && event.target.closest('a[href]');
    if (link && event.currentTarget.contains(link)) return;
    event.preventDefault();
    FlowRouter.go(event.currentTarget.dataset.url);
  },
  'keydown .js-activity-feed-card'(event) {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    event.currentTarget.click();
  },
  'click .js-activity-feed-more'(event, tpl) {
    event.preventDefault();
    const list = tpl.entries.get();
    const last = list[list.length - 1];
    if (last) tpl.load(new Date(last.createdAt));
  },
});
