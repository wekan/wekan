import './historyRecoveryNotice.jade';
import { ReactiveVar } from 'meteor/reactive-var';
import { Tracker } from 'meteor/tracker';
import { pendingHistoryRequest, refreshPendingHistoryRequest, forgetPendingHistoryRequest } from '/client/lib/historyKeyRecovery';
import { undoRedoLast } from '/client/lib/keyboard';

Template.historyRecoveryNotice.onCreated(function () {
  this.busy = new ReactiveVar(false);
  // A request left from before a reload shows as soon as its board is open.
  this.autorun(() => {
    Session.get('currentBoard');
    Tracker.nonreactive(() => refreshPendingHistoryRequest());
  });
});

Template.historyRecoveryNotice.helpers({
  pending() {
    const request = pendingHistoryRequest.get();
    if (!request || request.boardId !== Session.get('currentBoard')) return null;
    return { messageKey: request.direction === 'redo' ? 'history-request-pending-redo' : 'history-request-pending-undo' };
  },
  busy() {
    return Template.instance().busy.get();
  },
});

Template.historyRecoveryNotice.events({
  async 'click .js-history-retry'(event, tpl) {
    const request = pendingHistoryRequest.get();
    if (!request) return;
    tpl.busy.set(true);
    // The same direction as the waiting request: planKeystroke then resends
    // that request's own ID instead of making a new one.
    try { await undoRedoLast(request.direction); } finally { tpl.busy.set(false); }
  },
  'click .js-history-forget'() {
    forgetPendingHistoryRequest();
  },
});
