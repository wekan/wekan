import { Template } from 'meteor/templating';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { ReactiveVar } from 'meteor/reactive-var';
import { TAPi18n } from '/imports/i18n';

Template.archiveContributions.onCreated(function() {
  this.year = new ReactiveVar(new Date().getUTCFullYear());
  this.refresh = new ReactiveVar(0);
  this.result = new ReactiveVar(null);
  this.error = new ReactiveVar(false);
  this.selected = new ReactiveVar(null);
  this.dismissed = new ReactiveVar(null);
  this.request = 0;
  this.autorun(() => {
    const boardId = Session.get('currentBoard');
    const year = this.year.get();
    this.refresh.get();
    const request = ++this.request;
    this.result.set(null);
    this.selected.set(null);
    this.error.set(false);
    if (!boardId) return;
    Meteor.call('archivedCardContributions', boardId, year, (error, result) => {
      if (this.destroyed || request !== this.request) return;
      this.error.set(!!error);
      if (!error) this.result.set(result);
    });
  });
});
Template.archiveContributions.onDestroyed(function() { this.destroyed = true; });
Template.archiveContributions.events({
  'submit .js-archive-year'(event, instance) {
    event.preventDefault();
    if (!event.currentTarget.reportValidity()) return;
    instance.year.set(Number(event.currentTarget.elements.year.value));
    instance.refresh.set(instance.refresh.get() + 1);
  },
  'mouseenter .archive-day, focus .archive-day, click .archive-day'(event, instance) {
    // Scrolling a focused cell can move another cell under the pointer. Keep
    // the keyboard selection until focus leaves it or the user clicks a cell.
    const focused = instance.find('.archive-day:focus');
    if (event.type === 'mouseenter' && focused && focused !== event.currentTarget) return;
    const date = event.currentTarget.dataset.date;
    instance.dismissed.set(null);
    instance.selected.set(instance.result.get()?.days.find(day => day.date === date) || null);
  },
  'keydown .archive-day'(event, instance) {
    if (event.key === 'Escape') {
      instance.dismissed.set(event.currentTarget.dataset.date);
      instance.selected.set(null);
    }
  },
});
Template.archiveContributions.helpers({
  year() { return Template.instance().year.get(); },
  error() { return Template.instance().error.get(); },
  ready() { return !!Template.instance().result.get(); },
  tooltipClass(date) {
    const instance = Template.instance();
    return instance.dismissed.get() === date || instance.selected.get()?.date !== date
      ? 'archive-tooltip-dismissed' : '';
  },
  selected() { return Template.instance().selected.get(); },
  months() {
    const locale = TAPi18n.getLanguage() || 'en';
    let formatter;
    try { formatter = new Intl.DateTimeFormat(locale, { month: 'short', timeZone: 'UTC' }); }
    catch (error) { formatter = new Intl.DateTimeFormat('en', { month: 'short', timeZone: 'UTC' }); }
    return Array.from({ length: 12 }, (_, month) => formatter.format(new Date(Date.UTC(2000, month, 1))));
  },
  rows() {
    const report = Template.instance().result.get();
    if (!report) return [];
    const days = new Map(report.days.map(day => [day.date, day]));
    return Array.from({ length: 31 }, (_, index) => ({ day: index + 1,
      cells: Array.from({ length: 12 }, (_, month) => {
        const date = `${report.year}-${String(month + 1).padStart(2, '0')}-${String(index + 1).padStart(2, '0')}`;
        const day = days.get(date);
        return day ? { ...day, description: `${date} UTC · ${TAPi18n.__('cards')}: ${day.count}` } : null;
      }),
    }));
  },
});
