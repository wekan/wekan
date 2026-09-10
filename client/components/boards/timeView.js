import { ReactiveVar } from 'meteor/reactive-var';
import { TAPi18n } from '/imports/i18n';
const { translateGroupLabel } = require('/models/lib/chartCalculations');

// Board view "Time" - split out of "Statistics" so time tracking has its own
// place in the board-view menu. The summary counts come from the server
// `boardStatus` method, same subscription pattern as statsView.js. The
// by-assignee/by-card breakdown (#812: "reporting total hours by resource
// and task type") and PDF/Excel export reuse the same `boardChartData`
// method and `/api/boards/:boardId/charts/:chartKey/export*` routes every
// other board report chart already uses (chartKey 'time') - one export
// pipeline for every chart, not a second one just for this view.
Template.timeView.onCreated(function() {
  this.status = new ReactiveVar(null);
  this.breakdown = new ReactiveVar(null);
  this.autorun(() => {
    const boardId = Session.get('currentBoard');
    if (boardId) {
      Meteor.call('boardStatus', boardId, (err, res) => {
        if (!err && res) this.status.set(res);
      });
      Meteor.call('boardChartData', boardId, 'time', (err, res) => {
        if (!err && res) this.breakdown.set(res);
      });
    }
  });
});

function statsNum(key) {
  const s = Template.instance().status.get();
  return s ? (s[key] || 0) : '…';
}

Template.timeView.events({
  // See statsView.js: stop the board canvas's drag-to-scroll from swallowing
  // the pointer/touch events that native text selection needs.
  'mousedown .stats-view'(event) {
    event.stopPropagation();
  },
  'touchstart .stats-view'(event) {
    event.stopPropagation();
  },
});

Template.timeView.helpers({
  cardsWithTimeSpent() { return statsNum('cardsWithTimeSpent'); },
  overtimeCards() { return statsNum('overtimeCards'); },
  timeSpentTotal() {
    const s = Template.instance().status.get();
    if (!s) return '…';
    const n = Number(s.timeSpentTotal) || 0;
    return `${n} h`;
  },
  hasTimeBreakdown() {
    const breakdown = Template.instance().breakdown.get();
    return !!(breakdown && (breakdown.byAssignee.length || breakdown.byCard.length));
  },
  byAssignee() {
    const breakdown = Template.instance().breakdown.get();
    return breakdown ? breakdown.byAssignee : [];
  },
  byCard() {
    const breakdown = Template.instance().breakdown.get();
    return breakdown ? breakdown.byCard : [];
  },
  // The "none" sentinel from models/lib/chartCalculations.js's
  // NO_ASSIGNEE_GROUP - translated the same way the Dashboard view's own
  // assignee breakdown already does (client/components/boards/charts/
  // boardCharts.js), so a real assignee name always passes through
  // unchanged and only the sentinel is ever translated.
  assigneeLabel(label) {
    return translateGroupLabel(label, key => TAPi18n.__(key));
  },
  // #812 export, matching every other board report chart's export buttons
  // (client/components/boards/charts/boardCharts.js's own exportUrl helper).
  timeExportUrl(format) {
    const boardId = Session.get('currentBoard');
    if (!boardId) return '';
    const path = format === 'PDF' ? 'exportPDF' : 'exportExcel';
    const params = new URLSearchParams({
      authToken: Accounts._storedLoginToken() || '',
      lang: TAPi18n.getLanguage ? TAPi18n.getLanguage() : 'en',
      tz: Intl.DateTimeFormat().resolvedOptions().timeZone || '',
      dateFormat: (Meteor.user() && Meteor.user().profile && Meteor.user().profile.dateFormat) || 'YYYY-MM-DD',
    });
    return `/api/boards/${boardId}/charts/time/${path}?${params.toString()}`;
  },
});
