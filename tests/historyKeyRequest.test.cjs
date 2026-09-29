'use strict';

// Keyboard undo/redo with persisted request IDs (client/lib/historyKeyRequest.js).
// Run: node tests/historyKeyRequest.test.cjs
//
// Ctrl+Z / Ctrl+Y called changeHistory.undoLast/redoLast without a request ID,
// so a reply lost to a disconnect or reload left the user pressing again and
// undoing a SECOND change. Each keystroke now carries an ID kept in
// sessionStorage until the server answers; an unanswered request is retried
// with the same ID before anything new is sent. Non-Scrum rows, which keyed
// requests do not cover yet, fall back to the unkeyed call.

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

function memoryStorage() {
  const data = new Map();
  return {
    getItem: k => (data.has(k) ? data.get(k) : null),
    setItem: (k, v) => data.set(k, String(v)),
    removeItem: k => data.delete(k),
    data,
  };
}
const meteorError = error => Object.assign(new Error(String(error)), { error });

async function main() {
  const m = await import('../client/lib/historyKeyRequest.js');
  const now = 1_800_000_000_000;

  // IDs satisfy the server's format.
  for (let i = 0; i < 50; i += 1) assert.match(m.newHistoryRequestId(), /^[A-Za-z0-9_-]{16,128}$/);
  assert.notEqual(m.newHistoryRequestId(), m.newHistoryRequestId());

  // Planning.
  const pendingUndo = { boardId: 'b1', direction: 'undo', requestId: 'key-aaaaaaaaaaaaaaaaaaaa', at: now - 1000 };
  assert.deepEqual(m.planKeystroke(null, { boardId: 'b1', direction: 'undo', newId: 'key-new-0000000000000', now }).calls,
    [{ boardId: 'b1', direction: 'undo', requestId: 'key-new-0000000000000', at: now }]);
  assert.deepEqual(m.planKeystroke(pendingUndo, { boardId: 'b1', direction: 'undo', newId: 'key-new-0000000000000', now }).calls,
    [pendingUndo], 'pressing again retries instead of undoing a second change');
  assert.equal(m.planKeystroke(pendingUndo, { boardId: 'b1', direction: 'redo', newId: 'key-new-0000000000000', now }).calls.length, 2,
    'an unanswered undo settles before a redo is sent');
  assert.equal(m.planKeystroke(pendingUndo, { boardId: 'b2', direction: 'undo', newId: 'key-new-0000000000000', now }).calls[0].boardId, 'b2',
    "another board's request is not replayed here");
  const stale = { ...pendingUndo, at: now - m.HISTORY_KEY_REQUEST_MAX_AGE_MS - 1 };
  assert.equal(m.planKeystroke(stale, { boardId: 'b1', direction: 'undo', newId: 'key-new-0000000000000', now }).calls[0].requestId,
    'key-new-0000000000000', 'an old unanswered keystroke is not replayed');
  for (const bad of [null, {}, { ...pendingUndo, requestId: 'short' }, { ...pendingUndo, direction: 'sideways' },
    { ...pendingUndo, at: now + 5 }, { ...pendingUndo, at: 'x' }]) {
    assert.equal(m.validStoredRequest(bad, now), false);
  }

  // Reply classification.
  assert.equal(m.settleReply(undefined), 'done');
  assert.equal(m.settleReply(meteorError('scrum-history-request-unsupported')), 'unsupported');
  assert.equal(m.settleReply(meteorError('scrum-history-request-conflict')), 'done');
  assert.equal(m.settleReply(meteorError('too-many-requests')), 'retry');
  assert.equal(m.settleReply(new Error('disconnected')), 'retry');

  // A lost reply, a reload, then the same keystroke: the same ID is sent again.
  const storage = memoryStorage();
  const sent = [];
  let fail = true;
  const call = async (method, boardId, requestId) => {
    sent.push([method, boardId, requestId]);
    if (fail) throw new Error('connection lost');
    return { undone: true };
  };
  assert.equal(await m.runKeystroke({ storage, call, boardId: 'b1', direction: 'undo', newId: 'key-first-00000000000', now }), 'pending');
  assert.equal(m.readStoredRequest(storage, now).requestId, 'key-first-00000000000');
  fail = false;
  assert.equal(await m.runKeystroke({ storage, call, boardId: 'b1', direction: 'undo', newId: 'key-second-0000000000', now: now + 5000 }), 'settled');
  assert.deepEqual(sent.map(s => s[2]), ['key-first-00000000000', 'key-first-00000000000']);
  assert.equal(m.readStoredRequest(storage, now), null);

  // A non-Scrum row: the keyed call is refused unchanged, then the unkeyed one runs.
  sent.length = 0;
  const unsupported = async (method, boardId, requestId) => {
    sent.push([method, boardId, requestId]);
    if (requestId) throw meteorError('scrum-history-request-unsupported');
    return { undone: true };
  };
  await m.runKeystroke({ storage, call: unsupported, boardId: 'b1', direction: 'redo', newId: 'key-redo-000000000000', now });
  assert.deepEqual(sent, [['changeHistory.redoLast', 'b1', 'key-redo-000000000000'], ['changeHistory.redoLast', 'b1', undefined]]);
  assert.equal(m.readStoredRequest(storage, now), null);

  // A definitive server error is not retried forever.
  await m.runKeystroke({ storage, call: async () => { throw meteorError('not-authorized'); }, boardId: 'b1', direction: 'undo', newId: 'key-denied-0000000000', now });
  assert.equal(m.readStoredRequest(storage, now), null);

  // Blocked storage never throws out of a keystroke.
  const blocked = { getItem() { throw new Error('blocked'); }, setItem() { throw new Error('blocked'); }, removeItem() { throw new Error('blocked'); } };
  assert.equal(await m.runKeystroke({ storage: blocked, call: async () => ({}), boardId: 'b1', direction: 'undo', newId: 'key-blocked-000000000', now }), 'settled');

  // The keyboard uses it for both shortcuts.
  const keyboard = fs.readFileSync(path.join(__dirname, '../client/lib/keyboard.js'), 'utf8');
  assert.match(keyboard, /runKeystroke\(\{/);
  // The storage accessor moved to client/lib/historyKeyRecovery.js, which the
  // recovery notice shares, so both read the same pending request.
  assert.match(keyboard, /const storage = historyRequestStorage\(\);/);
  assert.match(fs.readFileSync(path.join(__dirname, '../client/lib/historyKeyRecovery.js'), 'utf8'), /window\.sessionStorage/);
  assert.match(keyboard, /undoRedoLast\('undo'\)/);
  assert.match(keyboard, /undoRedoLast\('redo'\)/);
  assert.doesNotMatch(keyboard, /Meteor\.call\(method, boardId, \(\) => \{\}\)/, 'no unkeyed fire-and-forget call remains');

  console.log('  ok - keyboard undo/redo retries unanswered requests with the same ID');
}

main().catch(error => { console.error(error); process.exitCode = 1; });
