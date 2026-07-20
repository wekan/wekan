import { ReactiveCache } from '/imports/reactiveCache';
import { TAPi18n } from '/imports/i18n';
import { ReactiveVar } from 'meteor/reactive-var';
import { Utils } from '/client/lib/utils';

// Board view "Statistics" (Tilastot) — a full-width board view (like Swimlanes /
// Lists / Calendar / Gantt / Table) showing the board's status: its card-loading
// mode, counts (swimlanes, lists, cards, labels, members, custom fields) and a
// time-spent summary. Counts come from the server `boardStatus` method so they are
// accurate even in lazy mode, where the browser only holds the visible card window.
Template.statsView.onCreated(function() {
  this.status = new ReactiveVar(null);
  this.autorun(() => {
    const boardId = Session.get('currentBoard');
    if (boardId) {
      Meteor.call('boardStatus', boardId, (err, res) => {
        if (!err && res) this.status.set(res);
      });
    }
  });
});

// Read one numeric field from the resolved status, or a placeholder while loading.
function statsNum(key) {
  const s = Template.instance().status.get();
  return s ? (s[key] || 0) : '…';
}

Template.statsView.events({
  // The board canvas uses drag-to-scroll (the `dragscroll` class), which otherwise
  // swallows pointer/touch drags and prevents selecting text. Stop these events from
  // reaching it so the browser's native selection works — with the mouse (drag) and
  // on touch (long-press) — and any value can be copied to the clipboard.
  'mousedown .stats-view'(event) {
    event.stopPropagation();
  },
  'touchstart .stats-view'(event) {
    event.stopPropagation();
  },
});

Template.statsView.helpers({
  boardTitle() {
    const board = Utils.getCurrentBoard();
    return board ? board.title : '';
  },
  loadingModeLabel() {
    const s = Template.instance().status.get();
    if (!s) return '…';
    const inEffect = s.lazy
      ? TAPi18n.__('cards-loading-lazy')
      : TAPi18n.__('cards-loading-all');
    return s.mode === 'auto' ? `${inEffect} (${TAPi18n.__('cards-loading-auto')})` : inEffect;
  },
  swimlaneCount() { return statsNum('swimlanes'); },
  listCount() { return statsNum('lists'); },
  cardCount() { return statsNum('cards'); },
  archivedCardCount() { return statsNum('archivedCards'); },
  labelCount() { return statsNum('labels'); },
  memberCount() { return statsNum('members'); },
  customFieldCount() { return statsNum('customFields'); },
  cardsWithTimeSpent() { return statsNum('cardsWithTimeSpent'); },
  overtimeCards() { return statsNum('overtimeCards'); },
  timeSpentTotal() {
    const s = Template.instance().status.get();
    if (!s) return '…';
    const n = Number(s.timeSpentTotal) || 0;
    return `${n} h`;
  },
});
