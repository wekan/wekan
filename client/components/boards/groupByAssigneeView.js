import { formatDateForDisplay } from '/client/lib/dateDisplay';
import { ReactiveCache } from '/imports/reactiveCache';
import { ReactiveVar } from 'meteor/reactive-var';
import { TAPi18n } from '/imports/i18n';
const { translateGroupLabel } = require('/models/lib/chartCalculations');

// Board view "Group by Assignee" (#4688: "Feature Request: Grouping cards by
// assignee") - a read-only, team-meeting-friendly overview that lists the
// board's non-archived cards under a heading per assignee (a card with
// several assignees appears under each, a card with none falls into the
// "No assignee" group). The grouping itself is computed server-side by the
// shared `boardChartData` method/chartKey pipeline every other board report
// chart already uses (server/lib/boardChartData.js,
// models/lib/chartCalculations.js's computeCardsByAssigneeGroup), so this
// view reuses the same grouping/translation logic as the Dashboard view's
// "by assignee" breakdown and the Time view's hours-by-assignee breakdown
// rather than recomputing it. Deliberately simple: title + due date + an
// overtime marker per card, no drag-and-drop, no export - clicking a card
// navigates to it like every other board view.
Template.groupByAssigneeView.onCreated(function() {
  this.groups = new ReactiveVar(null);
  this.autorun(() => {
    const boardId = Session.get('currentBoard');
    if (boardId) {
      Meteor.call('boardChartData', boardId, 'groupByAssignee', (err, res) => {
        if (!err && res) this.groups.set(res.groups || []);
      });
    }
  });
});

Template.groupByAssigneeView.events({
  // See statsView.js: stop the board canvas's drag-to-scroll from swallowing
  // the pointer/touch events that native text selection needs.
  'mousedown .stats-view'(event) {
    event.stopPropagation();
  },
  'touchstart .stats-view'(event) {
    event.stopPropagation();
  },
});

Template.groupByAssigneeView.helpers({
  isLoading() {
    return Template.instance().groups.get() === null;
  },
  hasGroups() {
    const groups = Template.instance().groups.get();
    return !!(groups && groups.length);
  },
  groups() {
    return Template.instance().groups.get() || [];
  },
  // The "none" sentinel from models/lib/chartCalculations.js's
  // NO_ASSIGNEE_GROUP, translated the same way the Dashboard/Time views
  // already do - a real assignee name always passes through unchanged.
  groupLabel(label) {
    return translateGroupLabel(label, key => TAPi18n.__(key));
  },
  formatDueAt(dueAt) {
    return dueAt ? formatDateForDisplay(dueAt, true, date => moment(date).format('llll')) : '';
  },
  cardUrl(cardId) {
    const boardId = Session.get('currentBoard');
    const board = boardId && ReactiveCache.getBoard(boardId);
    if (!board) return '#';
    return FlowRouter.path('card', {
      boardId: board._id,
      slug: board.slug,
      cardId,
    });
  },
});
