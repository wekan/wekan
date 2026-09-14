# `jam:offline`

Use `jam:offline` to persist selected Minimongo data in IndexedDB and replay
method work after reconnect. Read the [Meteor guide](https://docs.meteor.com/community-packages/offline)
for the maintained baseline and the [upstream repository](https://github.com/jamauro/offline)
for the current release, complete API, and issues.

## Baseline

- The Meteor guide states no Meteor release floor. Verify the current package
  release before adoption.
- Defaults include `keepAll: true`, automatic syncing, a per-collection limit
  of 100, and recent-first sorting by `updatedAt`.
- `.keep(filter, { sort, limit })` narrows persisted records for one collection.
  `Collection.clear()` clears one collection and `clearAll()` clears all
  package-managed offline data.
- Import configuration and collection `.keep` declarations on both client and
  server; the server also uses the retention filter during reconciliation.
- `Offline` supplies `configure`. Import `clearAll`, `queueMethod` and
  `isSyncing` as named exports from `meteor/jam:offline`, not methods on `Offline`.
- Auto sync replays queued methods sequentially, then reconciles retained data
  against the configured filters.

```bash
meteor add jam:offline
```

```javascript
// Shared module imported by both client and server.
import { Offline } from "meteor/jam:offline";

Offline.configure({
  keepAll: false,
  autoSync: true,
  handleSyncErrors({ replayErrors, keepErrors }) {
    reportOfflineErrors({ replayErrors, keepErrors });
  },
});

Todos.keep(
  { ownerId: Meteor.userId() },
  { sort: { updatedAt: -1 }, limit: 50 },
);
```

## Replay and reconciliation

- Queue only while disconnected, but invoke the isomorphic method in both
  states: queuing alone does not run its optimistic client stub.
  `Meteor.callAsync` has no options argument; use `applyAsync` for `noRetry`.
- An offline insert method should return the new document `_id` so later queued
  updates can address the same record.
- `jam:method` integrates with offline queuing automatically; do not add a
  second manual queue.
- Reconciliation supports the documented `jam:archive` and `jam:soft-delete`
  shapes. Configure custom archive or deletion fields explicitly.
- `isSyncing()` is reactive. Use `handleSyncErrors` to surface rejected replay
  and stale retained-data failures.
- A service worker is separate. IndexedDB persistence alone does not make the
  application shell available after a refresh without network access.

Manual client invocation, with `args` as the method-argument array:

```javascript
import { queueMethod } from "meteor/jam:offline";

if (!Meteor.status().connected) queueMethod(name, ...args);
const invocation = Meteor.applyAsync(name, args, { noRetry: true });
```

Handle invocation failures separately from later replay errors. Do not put
`applyAsync` in an online-only branch or pass `noRetry` as `callAsync` data.

## Required checks

- Verify the current `jam:offline` release before selecting its configuration
  or replay APIs because the Meteor guide states no release floor.
- Treat IndexedDB as user-readable device storage. Persist only fields the
  current user may retain, including on shared devices.
- Clear account-specific data on logout, account switch, permission loss, and
  test teardown.
- Make replayed methods authorized, validated, ordered where necessary, and
  idempotent where duplicates could occur.
- Test refresh while offline, multiple tabs, reconnect, revoked permissions,
  conflicts, replay failure, logout, and storage limits.

---
Source: https://github.com/meteor/meteor/blob/devel/v3-docs/docs/community-packages/offline.md
