// Keyboard undo/redo (Ctrl+Z / Ctrl+Y) with caller-persisted request IDs.
//
// changeHistory.undoLast/redoLast accept an optional request ID: the server
// binds it to the History row it selects first, so repeating the SAME ID after
// a lost reply or a reload returns the original result instead of undoing a
// second change. The ID only helps if it outlives the uncertainty, so an
// unanswered keystroke's request is kept in sessionStorage until the server
// gives an answer, and is retried before anything new is sent.
//
// Keyed requests currently cover Scrum History only; the server refuses any
// other row with `scrum-history-request-unsupported` without changing
// anything, and the keystroke then falls back to the ordinary unkeyed call.
// Everything here is pure except the storage accessors, which tolerate a
// browser that blocks storage.

export const HISTORY_KEY_REQUEST_STORAGE = 'wekan-history-key-request';
// An unanswered keystroke older than this is not replayed: minutes later it no
// longer says what the user wants, and dropping it changes nothing on the
// server (the request either ran there already or never arrived).
export const HISTORY_KEY_REQUEST_MAX_AGE_MS = 10 * 60 * 1000;

// A request ID the server accepts: [A-Za-z0-9_-]{16,128}.
export function newHistoryRequestId(random = () => Math.random()) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let id = 'key-';
  for (let i = 0; i < 28; i += 1) id += alphabet[Math.floor(random() * alphabet.length) % alphabet.length];
  return id;
}

export function validStoredRequest(value, now = Date.now()) {
  return Boolean(value && typeof value === 'object'
    && Number.isFinite(value.at) && value.at <= now && now - value.at <= HISTORY_KEY_REQUEST_MAX_AGE_MS
    && typeof value.boardId === 'string' && value.boardId
    && (value.direction === 'undo' || value.direction === 'redo')
    && typeof value.requestId === 'string' && /^[A-Za-z0-9_-]{16,128}$/.test(value.requestId));
}

// What one keystroke sends. An unanswered request for the same board is
// retried first. When it is for the same direction, the retry IS this
// keystroke: the user pressed again because nothing seemed to happen, and a
// second undo would take back a change they did not ask to take back.
export function planKeystroke(stored, { boardId, direction, newId, now = Date.now() }) {
  const pending = validStoredRequest(stored, now) && stored.boardId === boardId ? stored : null;
  const fresh = { boardId, direction, requestId: newId, at: now };
  if (!pending) return { calls: [fresh] };
  if (pending.direction === direction) return { calls: [pending] };
  return { calls: [pending, fresh] };
}

// How a reply settles a request.
//   done        - the server answered; forget the request
//   unsupported - not Scrum History: forget it and make the unkeyed call
//   retry       - no answer (disconnect, timeout, rate limit): keep it
export function settleReply(error) {
  if (!error) return 'done';
  const code = error && error.error;
  if (code === 'scrum-history-request-unsupported') return 'unsupported';
  if (code === undefined || code === null || code === 'too-many-requests' || code === 503 || code === 'timeout') return 'retry';
  return 'done';
}

export function readStoredRequest(storage, now = Date.now()) {
  try {
    const value = JSON.parse(storage.getItem(HISTORY_KEY_REQUEST_STORAGE) || 'null');
    return validStoredRequest(value, now) ? value : null;
  } catch (e) {
    return null;
  }
}

export function writeStoredRequest(storage, value) {
  try {
    if (value) storage.setItem(HISTORY_KEY_REQUEST_STORAGE, JSON.stringify(value));
    else storage.removeItem(HISTORY_KEY_REQUEST_STORAGE);
  } catch (e) { /* storage blocked: the request is simply not retried after a reload */ }
}

// Send one keystroke's calls in order. `call(method, boardId, requestId?)`
// returns a promise. Stops at the first call whose outcome stays unknown, so
// a new request is never stacked on top of an unsettled one.
export async function runKeystroke({ storage, call, boardId, direction, newId, now = Date.now() }) {
  const { calls } = planKeystroke(readStoredRequest(storage, now), { boardId, direction, newId, now });
  for (const request of calls) {
    const method = request.direction === 'undo' ? 'changeHistory.undoLast' : 'changeHistory.redoLast';
    writeStoredRequest(storage, request);
    let outcome;
    try {
      await call(method, request.boardId, request.requestId);
      outcome = 'done';
    } catch (error) {
      outcome = settleReply(error);
    }
    if (outcome === 'retry') return 'pending';
    writeStoredRequest(storage, null);
    if (outcome === 'unsupported') {
      try { await call(method, request.boardId); } catch (e) { /* the unkeyed path reports nothing either */ }
    }
  }
  return 'settled';
}
