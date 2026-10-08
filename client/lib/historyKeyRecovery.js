// The visible half of keyboard undo/redo recovery (client/lib/historyKeyRequest.js).
// An undo or redo whose reply never came stays in sessionStorage and is
// retried by the next keystroke - but nothing on screen said so, so the person
// could not tell that their Ctrl+Z was still waiting. The notice
// (historyRecoveryNotice) shows while the current board has such a request,
// with "Try again", which repeats the SAME request ID and so cannot undo a
// second change, and "Forget it", which drops the request.
import { Meteor } from 'meteor/meteor';
import { ReactiveVar } from 'meteor/reactive-var';
import { readStoredRequest, writeStoredRequest } from '/client/lib/historyKeyRequest';

export const pendingHistoryRequest = new ReactiveVar(null);

const memory = { value: null, getItem() { return this.value; }, setItem(k, v) { this.value = v; }, removeItem() { this.value = null; } };
export function historyRequestStorage() {
  try { return window.sessionStorage || memory; } catch (e) { return memory; }
}

export function refreshPendingHistoryRequest(storage = historyRequestStorage()) {
  pendingHistoryRequest.set(readStoredRequest(storage));
}

export function forgetPendingHistoryRequest(storage = historyRequestStorage()) {
  writeStoredRequest(storage, null);
  refreshPendingHistoryRequest(storage);
}

// A Scrum History undo or redo that stopped on a conflict keeps a checkpoint
// on the server that blocks every Scrum edit on its board, and retrying it
// fails the same way each time (server/lib/scrumHistoryRecovery.js). The
// notice shows it to anyone who can write on the board, and to a board
// administrator the two ways out: roll back, or keep the board as it is.
export const scrumHistoryCheckpoint = new ReactiveVar(null);
const callServer = (...args) => Meteor.callAsync(...args);

export async function refreshScrumHistoryCheckpoint(boardId, call = callServer) {
  let report = null;
  if (boardId) {
    try { report = await call('scrum.inspectHistoryCheckpoint', boardId); } catch (e) { report = null; }
  }
  const shown = report && report.present && report.stuck ? { ...report, boardId } : null;
  scrumHistoryCheckpoint.set(shown);
  return shown;
}

// Resolve the checkpoint the notice showed, by its key: one already resolved
// (by another administrator or server) is a no-op on the server, never
// another checkpoint.
export async function resolveScrumHistoryCheckpoint(checkpoint, action, call = callServer) {
  try {
    return await call('scrum.resolveHistoryCheckpoint', checkpoint.boardId, checkpoint.key, action);
  } finally {
    await refreshScrumHistoryCheckpoint(checkpoint.boardId, call);
  }
}
