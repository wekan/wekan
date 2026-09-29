// The visible half of keyboard undo/redo recovery (client/lib/historyKeyRequest.js).
// An undo or redo whose reply never came stays in sessionStorage and is
// retried by the next keystroke - but nothing on screen said so, so the person
// could not tell that their Ctrl+Z was still waiting. The notice
// (historyRecoveryNotice) shows while the current board has such a request,
// with "Try again", which repeats the SAME request ID and so cannot undo a
// second change, and "Forget it", which drops the request.
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
