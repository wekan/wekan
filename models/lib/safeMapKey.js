'use strict';
// Server-wide prototype pollution (2026-10-02, PrototypeBleed): the per-user
// layout methods keep maps keyed by the ids a client sends -
// profile.collapsedLists[boardId][listId] and their siblings - and wrote them
// with `if (!map[boardId]) map[boardId] = {}; map[boardId][listId] = value`.
// With boardId '__proto__', map[boardId] IS Object.prototype, so the second
// write set a property on every object in the server process - any logged-in
// user could add `isAdmin`, a role flag or a MongoDB option key to all objects
// until a restart.
//
// A key used to index such a map must be an own, ordinary key: never one of
// the names that reach a prototype, and never one MongoDB refuses in a stored
// key ('.' or a leading '$') anyway. Pure: tests/prototypeBleed.test.cjs.
const UNSAFE = new Set(['__proto__', 'constructor', 'prototype']);

function isSafeMapKey(key) {
  return typeof key === 'string' && key.length > 0 && key.length <= 256 &&
    !UNSAFE.has(key) && !key.includes('.') && !key.startsWith('$');
}

function assertSafeMapKey(...keys) {
  for (const key of keys) {
    if (!isSafeMapKey(key)) {
      try {
        if (typeof require === 'function') {
          // eslint-disable-next-line global-require
          require('/server/lib/securityLog').record({
            key: 'injection.prototype', action: 'blocked', source: 'map key',
            detail: `refused map key ${JSON.stringify(String(key)).slice(0, 40)}`,
          });
        }
      } catch (e) { /* logging must never break the guard; absent on the client */ }
      const error = new Error('invalid-map-key');
      error.error = 'invalid-map-key';
      throw error;
    }
  }
  return true;
}

module.exports = { isSafeMapKey, assertSafeMapKey };
