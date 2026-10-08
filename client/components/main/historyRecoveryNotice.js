import './historyRecoveryNotice.jade';
import { ReactiveVar } from 'meteor/reactive-var';
import { Tracker } from 'meteor/tracker';
import { TAPi18n } from '/imports/i18n';
import { Utils } from '/client/lib/utils';
import { pendingHistoryRequest, refreshPendingHistoryRequest, forgetPendingHistoryRequest,
  scrumHistoryCheckpoint, refreshScrumHistoryCheckpoint, resolveScrumHistoryCheckpoint } from '/client/lib/historyKeyRecovery';
import { undoRedoLast } from '/client/lib/keyboard';

Template.historyRecoveryNotice.onCreated(function () {
  this.busy = new ReactiveVar(false);
  this.checkpointError = new ReactiveVar('');
  // A request left from before a reload shows as soon as its board is open.
  this.autorun(() => {
    Session.get('currentBoard');
    Tracker.nonreactive(() => refreshPendingHistoryRequest());
  });
  // A stopped Scrum History checkpoint, looked up when a board opens for
  // someone who can write on it, and again whenever a keyboard undo or redo
  // was answered or left waiting - the moment one may have stopped.
  this.autorun(() => {
    const boardId = Session.get('currentBoard');
    pendingHistoryRequest.get();
    const canWrite = !!boardId && Utils.canModifyBoard();
    Tracker.nonreactive(() => {
      this.checkpointError.set('');
      if (canWrite) refreshScrumHistoryCheckpoint(boardId);
      else scrumHistoryCheckpoint.set(null);
    });
  });
});

Template.historyRecoveryNotice.helpers({
  pending() {
    const request = pendingHistoryRequest.get();
    if (!request || request.boardId !== Session.get('currentBoard')) return null;
    return { messageKey: request.direction === 'redo' ? 'history-request-pending-redo' : 'history-request-pending-undo' };
  },
  checkpoint() {
    const checkpoint = scrumHistoryCheckpoint.get();
    if (!checkpoint || checkpoint.boardId !== Session.get('currentBoard')) return null;
    return checkpoint;
  },
  // Above the waiting-request notice when both show.
  checkpointPlacement() {
    const request = pendingHistoryRequest.get();
    return request && request.boardId === Session.get('currentBoard') ? 'history-checkpoint-notice-raised' : '';
  },
  checkpointError() {
    return Template.instance().checkpointError.get();
  },
  busy() {
    return Template.instance().busy.get();
  },
});

async function resolve(tpl, action) {
  const checkpoint = scrumHistoryCheckpoint.get();
  if (!checkpoint || tpl.busy.get()) return;
  tpl.busy.set(true);
  tpl.checkpointError.set('');
  try {
    await resolveScrumHistoryCheckpoint(checkpoint, action);
  } catch (error) {
    tpl.checkpointError.set(error.reason || error.message || TAPi18n.__('error'));
  } finally {
    tpl.busy.set(false);
  }
}

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
  async 'click .js-history-checkpoint-rollback'(event, tpl) {
    await resolve(tpl, 'rollback');
  },
  async 'click .js-history-checkpoint-discard'(event, tpl) {
    // Keeping the board as it is can leave half of an undo or redo in place;
    // the person confirms that, as for other changes that cannot be undone.
    if (!window.confirm(TAPi18n.__('scrum-history-checkpoint-discard-confirm'))) return;
    await resolve(tpl, 'discard');
  },
});
