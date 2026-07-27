'use strict';

// #6492: "TypeError: self._pendingRemoveFunction is not a function" took the
// server down, again and again, on a busy instance.
//
// Meteor's ddp-server removes a disconnected session in two steps:
//
//   _removeSession(session)  ->  session.messageQueue = []
//                                session._pendingRemoveFunction = remove
//   remove()                 ->  session._pendingRemoveFunction = null
//                                sessions.delete(session.id)
//                                ... and messageQueue is left in place
//
// so a REMOVED session still has a truthy queue. Session.send then queues to it,
// and the message after maxMessageQueueLength calls `_pendingRemoveFunction()` -
// which is now null. That throws from an Immediate (unsub -> _stopSubscription ->
// send), i.e. uncaught, and the process exits.
//
// This replays that state machine against the guard: a queue with no owner is
// dropped, so send() takes its ordinary path instead of calling null.
//
// Run: node tests/ddpSessionSendGuard.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }
const read = rel => fs.readFileSync(path.join(__dirname, '..', rel), 'utf8');

// --- Meteor's Session.send, as it is in ddp-server (the part that matters) ----
function makeSession({ maxMessageQueueLength = 100 } = {}) {
  return {
    id: 's1',
    socket: null,
    sentCount: 0,
    messageQueue: null,
    _pendingRemoveFunction: null,
    _removeTimeoutHandle: null,
    options: { maxMessageQueueLength },
    sent: [],
    send(msg) {
      if (this.messageQueue) {
        this.messageQueue.push(msg);
        if (this.messageQueue.length > this.options.maxMessageQueueLength) {
          this._pendingRemoveFunction();          // upstream: no typeof check
        }
        return;
      }
      if (this.socket) this.sent.push(msg);
    },
  };
}

// The guard this repo installs, applied to that same send().
function guard(session) {
  const original = session.send.bind(session);
  session.send = function guardedSend(msg) {
    if (this.messageQueue && typeof this._pendingRemoveFunction !== 'function') {
      this.messageQueue = null;
    }
    return original(msg);
  }.bind(session);
  return session;
}

// _removeSession + its remove function, as upstream writes them.
function removeSession(session) {
  session.messageQueue = [];
  const remove = () => {
    session._removeTimeoutHandle = null;
    session._pendingRemoveFunction = null;        // ... messageQueue stays
  };
  session._pendingRemoveFunction = remove;
  return remove;
}

console.log('ddpSessionSendGuard:');

test('the upstream bug is real: a removed session throws on the 101st message', () => {
  const session = makeSession();
  const remove = removeSession(session);
  remove();                                       // the grace period expired
  assert.strictEqual(session._pendingRemoveFunction, null);
  assert.ok(Array.isArray(session.messageQueue), 'the queue outlives the session');
  assert.throws(() => {
    for (let i = 0; i <= 100; i += 1) session.send({ msg: 'nosub', id: `${i}` });
  }, /not a function/, 'this is the crash from the report');
});

test('with the guard, the same sequence does not throw', () => {
  const session = guard(makeSession());
  const remove = removeSession(session);
  remove();
  for (let i = 0; i <= 250; i += 1) session.send({ msg: 'nosub', id: `${i}` });
  assert.strictEqual(session.messageQueue, null, 'the ownerless queue is dropped');
  assert.deepStrictEqual(session.sent, [], 'and nothing is sent to a socket that is gone');
});

test('a session that is still queueing for a real reconnect keeps its queue', () => {
  // The queue is the point of the disconnect grace period: messages sent while
  // the client is away are replayed when it comes back. The guard must not touch
  // that case - only the one where the remove function is already gone.
  const session = guard(makeSession());
  removeSession(session);                          // disconnected, remove pending
  for (let i = 0; i < 5; i += 1) session.send({ msg: 'added', id: `${i}` });
  assert.strictEqual(session.messageQueue.length, 5, 'still queued for the replay');
  assert.strictEqual(typeof session._pendingRemoveFunction, 'function');
});

test('an overflow while the remove function IS there still removes the session', () => {
  const session = guard(makeSession({ maxMessageQueueLength: 10 }));
  let removed = 0;
  session.messageQueue = [];
  session._pendingRemoveFunction = () => { removed += 1; session._pendingRemoveFunction = null; };
  for (let i = 0; i <= 10; i += 1) session.send({ msg: 'added', id: `${i}` });
  assert.strictEqual(removed, 1, 'upstream behaviour is unchanged when it is valid');
});

test('a live session sends as usual', () => {
  const session = guard(makeSession());
  session.socket = {};
  session.send({ msg: 'connected' });
  assert.deepStrictEqual(session.sent, [{ msg: 'connected' }]);
});

test('the guard is installed on the server, once, and cannot itself throw', () => {
  const src = read('server/lib/ddpSessionSendGuard.js');
  assert.ok(/typeof this\._pendingRemoveFunction !== 'function'/.test(src),
    'the check that replaces the unguarded call');
  assert.ok(/this\.messageQueue = null;/.test(src), 'and what it does instead');
  assert.ok(/Meteor\.onConnection/.test(src),
    'the Session class is not exported - an instance is how the prototype is reached');
  assert.ok(/patched\.done/.test(src), 'patched once, not once per connection');
  assert.ok(/catch \(e\)/.test(src), 'a guard that throws would be worse than the bug');
  assert.ok(read('server/imports.js').includes("import '/server/lib/ddpSessionSendGuard';"),
    'and it must actually be loaded');
});

console.log(`\n${passed} tests passed`);
