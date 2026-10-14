import { ReactiveVar } from 'meteor/reactive-var';
import { FlowRouter } from 'meteor/ostrio:flow-router-extra';
import { TAPi18n } from '/imports/i18n';
import { formatDateForDisplay } from '/client/lib/dateDisplay';

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
  // The same sentence the notifications use for this kind of activity.
  description() {
    const key = `act-${this.activityType}`;
    const text = TAPi18n.__(key, { card: this.cardTitle, list: this.listTitle, board: this.boardTitle, swimlane: '' });
    return text === key ? this.activityType : text.replace(/\s+/g, ' ').trim();
  },
  cardUrl() {
    return FlowRouter.path('card', { boardId: this.boardId, slug: this.boardSlug, cardId: this.cardId });
  },
});

Template.activityFeed.events({
  'click .js-activity-feed-more'(event, tpl) {
    event.preventDefault();
    const list = tpl.entries.get();
    const last = list[list.length - 1];
    if (last) tpl.load(new Date(last.createdAt));
  },
});
