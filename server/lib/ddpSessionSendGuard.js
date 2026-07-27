// #6492: one disconnected DDP session took the whole server down, repeatedly.
//
// From the reporter's snap log (WeKan 10.40, ~50 users, LDAP):
//
//   SyncedCron: Fatal error encountered (uncaughtException):
//   TypeError: self._pendingRemoveFunction is not a function
//       at Session.send (packages/ddp-server/livedata_server.js:362:14)
//       at Session._stopSubscription (packages/ddp-server/livedata_server.js:823:10)
//       at Session.unsub (packages/ddp-server/livedata_server.js:562:12)
//   snap.wekan.wekan.service: Main process exited, code=exited, status=1/FAILURE
//   snap.wekan.wekan.service: Scheduled restart job, restart counter is at 4.
//
// The bug is upstream, in Meteor's ddp-server, and it is a state-machine hole:
//
//   _removeSession(session) sets   session.messageQueue = []
//                            and   session._pendingRemoveFunction = sessionRemoveFunction
//   sessionRemoveFunction()  sets  session._pendingRemoveFunction = null
//                            and   deletes the session ... but leaves messageQueue
//                                  in place, an empty ARRAY, which is truthy.
//
//   Session.send(msg) then takes the queueing branch for a session that is
//   already gone:
//
//     if (self.messageQueue && !isIgnoredMsg) {
//       self.messageQueue.push(msg);
//       if (self.messageQueue.length > self.options.maxMessageQueueLength) {
//         Meteor.clearTimeout(self._removeTimeoutHandle);
//         self._pendingRemoveFunction();      // <- null: TypeError
//       }
//       return;
//     }
//
// So every message sent to a removed session is queued, and the 101st (the
// default maxMessageQueueLength is 100) calls null. `Session.unsub` ->
// `_stopSubscription` -> `send({msg:'nosub'})` runs from an Immediate with no
// try/catch around it, so the TypeError is an UNCAUGHT EXCEPTION - and the
// synced-cron package's handler exits the process on one. systemd restarts, every
// user is disconnected, cards stop arriving until a reload, and the restart loop
// looks exactly like "WeKan is slow and the CPU is high".
//
// It needs a busy server to show up: a session must disconnect while more than
// ~100 further messages are still addressed to it. That is why it appears with
// real users on a loaded instance and not in a quiet test.
//
// The guard: when a session is queueing but has no remove function left, the
// session is already removed, so its queue means nothing. Drop the queue instead
// of pushing to it - `send()` then takes its normal path, which for a removed
// session with no socket does nothing at all. No message is lost that was not
// already lost, and the process stays up.
//
// The patch is on the prototype, applied once, from the first connection - the
// Session class is not exported, so an instance is how it is reached.

const patched = { done: false };

function patchSessionSend(session) {
  if (patched.done || !session) return;
  const proto = Object.getPrototypeOf(session);
  if (!proto || typeof proto.send !== 'function') return;
  patched.done = true;

  const originalSend = proto.send;
  proto.send = function wekanGuardedSend(msg) {
    // A queue with no owner: the session it belonged to has been removed.
    if (this.messageQueue && typeof this._pendingRemoveFunction !== 'function') {
      this.messageQueue = null;
    }
    return originalSend.call(this, msg);
  };
}

Meteor.startup(() => {
  Meteor.onConnection(connection => {
    try {
      if (patched.done) return;
      const server = Meteor.server;
      const session = server && server.sessions && server.sessions.get
        ? server.sessions.get(connection.id)
        : null;
      patchSessionSend(session);
    } catch (e) {
      // A guard that throws would be worse than the bug it guards against.
      if (process.env.DEBUG === 'true') {
        console.error('ddpSessionSendGuard: could not patch Session.send', e);
      }
    }
  });
});

export { patchSessionSend };
