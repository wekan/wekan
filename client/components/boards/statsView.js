import { ReactiveCache } from '/imports/reactiveCache';
import { TAPi18n } from '/imports/i18n';
import { ReactiveVar } from 'meteor/reactive-var';
import { Utils } from '/client/lib/utils';
import { formatDateTime } from '/imports/lib/dateUtils';

// Board view "Statistics" (Tilastot) — a full-width board view (like Swimlanes /
// Lists / Calendar / Gantt / Table) showing the board's status: its card-loading
// mode, counts (swimlanes, lists, cards, labels, members, custom fields) and a
// time-spent summary. Counts come from the server `boardStatus` method so they are
// accurate even in lazy mode, where the browser only holds the visible card window.
Template.statsView.onCreated(function() {
  this.status = new ReactiveVar(null);
  this.drilldown = new ReactiveVar(null);
  this.drilldownLoading = new ReactiveVar(false);
  this.autorun(() => {
    const boardId = Session.get('currentBoard');
    if (boardId) {
      Meteor.call('boardStatus', boardId, (err, res) => {
        if (!err && res) this.status.set(res);
      });
    }
  });
});

function loadDrilldown(instance, dimension, key, label, skip = 0) {
  const boardId = Session.get('currentBoard');
  if (!boardId) return;
  instance.drilldownLoading.set(true);
  Meteor.call('boardDashboardCards', boardId, dimension, key, skip, 10, (error, result) => {
    instance.drilldownLoading.set(false);
    if (error || !result) return;
    const board = Utils.getCurrentBoard();
    instance.drilldown.set({
      dimension,
      key,
      label,
      ...result,
      items: result.items.map(card => ({
        ...card,
        url: board ? `/b/${board._id}/${board.slug}/${card._id}` : '#',
        dueLabel: card.dueAt ? formatDateTime(card.dueAt) : '',
      })),
    });
  });
}

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
  'click .js-dashboard-bucket'(event, instance) {
    event.preventDefault();
    loadDrilldown(
      instance,
      event.currentTarget.dataset.dimension,
      event.currentTarget.dataset.key,
      event.currentTarget.dataset.label,
    );
  },
  'click .js-dashboard-next'(event, instance) {
    event.preventDefault();
    const current = instance.drilldown.get();
    if (current) loadDrilldown(
      instance,
      current.dimension,
      current.key,
      current.label,
      current.skip + current.limit,
    );
  },
  'click .js-dashboard-previous'(event, instance) {
    event.preventDefault();
    const current = instance.drilldown.get();
    if (current) loadDrilldown(
      instance,
      current.dimension,
      current.key,
      current.label,
      Math.max(0, current.skip - current.limit),
    );
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
  dashboardSections() {
    const dimensions = Template.instance().status.get()?.dashboard?.dimensions;
    if (!dimensions) return [];
    const titles = {
      list: 'dashboard-by-list',
      member: 'dashboard-by-member',
      label: 'dashboard-by-label',
      due: 'dashboard-by-due',
    };
    return Object.entries(dimensions).map(([dimension, buckets]) => {
      const max = Math.max(1, ...buckets.map(bucket => bucket.count));
      return {
        dimension,
        title: TAPi18n.__(titles[dimension]),
        empty: !buckets.length,
        buckets: buckets.map(bucket => ({
          ...bucket,
          label: dimension === 'due' ? TAPi18n.__(bucket.label) : bucket.label,
          widthStyle: `width:${Math.max(8, (bucket.count / max) * 100)}%`,
        })),
      };
    });
  },
  dashboardMapCount() {
    return Template.instance().status.get()?.dashboard?.mapPointTotal || 0;
  },
  drilldown() {
    const result = Template.instance().drilldown.get();
    if (!result) return null;
    return {
      ...result,
      start: result.total ? result.skip + 1 : 0,
      end: Math.min(result.total, result.skip + result.items.length),
      hasPrevious: result.skip > 0,
      hasNext: result.skip + result.items.length < result.total,
    };
  },
  drilldownLoading() {
    return Template.instance().drilldownLoading.get();
  },
  timeSpentTotal() {
    const s = Template.instance().status.get();
    if (!s) return '…';
    const n = Number(s.timeSpentTotal) || 0;
    return `${n} h`;
  },
});
