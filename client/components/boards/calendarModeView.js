// #3194: Calendar Mode (see calendarModeView.jade, models/lib/calendarMode.js).
import { ReactiveVar } from 'meteor/reactive-var';
import { FlowRouter } from 'meteor/ostrio:flow-router-extra';
import { TAPi18n } from '/imports/i18n';
import { ReactiveCache } from '/imports/reactiveCache';
import { Utils } from '/client/lib/utils';
import { Filter } from '/client/lib/filter';
const { calendarModeDays, shiftAnchor, cardsByDueDay, RANGES } = require('/models/lib/calendarMode');

// The month or week a viewer chose is remembered in this browser only.
const RANGE_KEY = 'calendarModeRange';
const storedRange = () => {
  try { const range = window.localStorage.getItem(RANGE_KEY); return RANGES.includes(range) ? range : 'month'; } catch (e) { return 'month'; }
};

const firstDayOfWeek = () => {
  const user = ReactiveCache.getCurrentUser();
  const day = user && typeof user.getStartDayOfWeek === 'function' ? user.getStartDayOfWeek() : 1;
  return Number.isInteger(day) && day >= 0 && day <= 6 ? day : 1;
};

Template.calendarModeView.onCreated(function () {
  this.anchor = new ReactiveVar(new Date());
  this.range = new ReactiveVar(storedRange());
  this.days = () => calendarModeDays({ anchor: this.anchor.get(), range: this.range.get(), firstDay: firstDayOfWeek() });
});

Template.calendarModeView.helpers({
  isRange(range) {
    return Template.instance().range.get() === range;
  },
  rangeTitle() {
    const tpl = Template.instance();
    const anchor = tpl.anchor.get();
    const locale = TAPi18n.getLanguage();
    try {
      if (tpl.range.get() === 'week') {
        const { weeks } = tpl.days();
        const fmt = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', year: 'numeric' });
        return `${fmt.format(weeks[0][0].date)} - ${fmt.format(weeks[0][6].date)}`;
      }
      return new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(anchor);
    } catch (e) {
      return anchor.toDateString();
    }
  },
  weekdayNames() {
    const { weeks } = Template.instance().days();
    const locale = TAPi18n.getLanguage();
    return weeks[0].map(day => {
      try { return new Intl.DateTimeFormat(locale, { weekday: 'short' }).format(day.date); } catch (e) { return ''; }
    });
  },
  weeks() {
    return Template.instance().days().weeks;
  },
  // The cards due on this day, in the board's order. Read once per render
  // from the board's due cards in the shown range, with the board Filter.
  cardsOn(key) {
    const tpl = Template.instance();
    const board = Utils.getCurrentBoard();
    if (!board) return [];
    const { start, end } = tpl.days();
    const filter = Filter.isActive() ? Filter._getMongoSelector() : undefined;
    const cards = board.cardsDueInBetween(start, end, filter);
    const listSort = {};
    ReactiveCache.getLists({ boardId: board._id }).forEach(list => { listSort[list._id] = list.sort; });
    const byDay = cardsByDueDay(typeof cards.fetch === 'function' ? cards.fetch() : cards, listSort);
    return byDay.get(key) || [];
  },
  cardUrl() {
    const board = Utils.getCurrentBoard();
    return board ? FlowRouter.path('card', { boardId: board._id, slug: board.slug, cardId: this._id }) : '#';
  },
  cardLabels() {
    const board = Utils.getCurrentBoard();
    const labels = (board && board.labels) || [];
    return (this.labelIds || []).map(id => labels.find(label => label._id === id)).filter(Boolean);
  },
});

Template.calendarModeView.events({
  'click .js-calendar-mode-today'(event, tpl) { tpl.anchor.set(new Date()); },
  'click .js-calendar-mode-prev'(event, tpl) { tpl.anchor.set(shiftAnchor(tpl.anchor.get(), tpl.range.get(), -1)); },
  'click .js-calendar-mode-next'(event, tpl) { tpl.anchor.set(shiftAnchor(tpl.anchor.get(), tpl.range.get(), 1)); },
  'click .js-calendar-mode-range'(event, tpl) {
    const range = event.currentTarget.dataset.range;
    if (!RANGES.includes(range)) return;
    tpl.range.set(range);
    try { window.localStorage.setItem(RANGE_KEY, range); } catch (e) { /* per-browser convenience only */ }
  },
  // A card opens in this tab, beside the calendar, as on the Calendar view.
  'click .js-calendar-mode-card'(event) {
    event.preventDefault();
    FlowRouter.go(event.currentTarget.getAttribute('href'));
  },
});
