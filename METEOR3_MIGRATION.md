# Meteor 3.0 Migration Guide

Reference document capturing patterns, constraints, and lessons learned during the async migration of WeKan from Meteor 2.16 toward Meteor 3.0 readiness.

---

## 1. Dual-Compatibility Strategy

WeKan runs on **Meteor 2.16 with Blaze 2.x**. The goal is dual compatibility: changes must work on 2.16 now and remain compatible with a future Meteor 3.0 upgrade.

**Key constraint:** Blaze 2.x does NOT support async template helpers. Client-side code must receive synchronous data.

---

## 2. ReactiveCache Facade Pattern

`ReactiveCache` dispatches to `ReactiveCacheServer` (async MongoDB) or `ReactiveCacheClient` (sync Minimongo).

**Rule:** Facade methods must NOT be `async`. They return a Promise on the server and data on the client. Server callers `await`; client code uses the return value directly.

```javascript
// CORRECT:
getBoard(boardId) {
  if (Meteor.isServer) {
    return ReactiveCacheServer.getBoard(boardId);  // Returns Promise
  } else {
    return ReactiveCacheClient.getBoard(boardId);  // Returns data
  }
}

// WRONG:
async getBoard(boardId) { ... }  // Wraps client return in Promise too!
```

---

## 3. Model Helpers (Collection.helpers)

Model helpers defined via `Collection.helpers({})` are used by Blaze templates. They must NOT be `async`.

```javascript
// CORRECT:
Cards.helpers({
  board() {
    return ReactiveCache.getBoard(this.boardId);  // Promise on server, data on client
  },
});

// WRONG:
Cards.helpers({
  async board() {  // Blaze gets Promise instead of data
    return await ReactiveCache.getBoard(this.boardId);
  },
});
```

**Server-side callers** of these helpers must `await` the result:
```javascript
// In a Meteor method or hook (server-only):
const board = await card.board();
```

---

## 4. Allow/Deny Callbacks Must Be Synchronous

Meteor 2.x evaluates allow/deny callbacks synchronously. An `async` callback returns a Promise:
- **allow** callback returning Promise (truthy) → always passes
- **deny** callback returning Promise (truthy) → always denies

**Rule:** Never use `async` in allow/deny. Replace `ReactiveCache` calls with direct sync Mongo calls.

```javascript
// CORRECT:
Cards.allow({
  insert(userId, doc) {
    return allowIsBoardMemberWithWriteAccess(userId, Boards.findOne(doc.boardId));
  },
  fetch: ['boardId'],
});

// WRONG:
Cards.allow({
  async insert(userId, doc) {
    return allowIsBoardMemberWithWriteAccess(userId, await ReactiveCache.getBoard(doc.boardId));
  },
});
```

### Sync alternatives for common patterns:

| Async (broken in allow/deny) | Sync replacement |
|------------------------------|------------------|
| `await ReactiveCache.getBoard(id)` | `Boards.findOne(id)` |
| `await ReactiveCache.getCard(id)` | `Cards.findOne(id)` |
| `await ReactiveCache.getCurrentUser()` | `Meteor.users.findOne(userId)` |
| `await ReactiveCache.getBoards({...})` | `Boards.find({...}).fetch()` |
| `await card.board()` | `Boards.findOne(card.boardId)` |

**Note:** These sync Mongo calls (`findOne`, `find().fetch()`) are available in Meteor 2.x. In Meteor 3.0, they will be replaced by `findOneAsync` / `find().fetchAsync()`, which will require allow/deny callbacks to be reworked again (or replaced by Meteor 3.0's new permission model).

---

## 5. Server-Only Code CAN Be Async

Code that runs exclusively on the server can safely use `async`/`await`:

- `Meteor.methods({})` — method bodies
- `Meteor.publish()` — publication functions
- `JsonRoutes.add()` — REST API handlers
- `Collection.before.*` / `Collection.after.*` — collection hooks (via `matb33:collection-hooks`)
- Standalone server functions

```javascript
Meteor.methods({
  async createCard(data) {
    const board = await ReactiveCache.getBoard(data.boardId);  // OK
    // ...
  },
});
```

---

## 6. forEach with await Anti-Pattern

`Array.forEach()` does not handle async callbacks — iterations run concurrently without awaiting.

```javascript
// WRONG:
items.forEach(async (item) => {
  await processItem(item);  // Runs all in parallel, not sequentially
});

// CORRECT:
for (const item of items) {
  await processItem(item);  // Runs sequentially
}
```

---

## 7. Client-Side Collection Updates

Meteor requires client-side collection updates to use `_id` as the selector:

```javascript
// CORRECT:
Lists.updateAsync(listId, { $set: { title: newTitle } });

// WRONG - fails with "Untrusted code may only update documents by ID":
Lists.updateAsync({ _id: listId, boardId: boardId }, { $set: { title: newTitle } });
```

---

## 8. Sync Meteor 2.x APIs to Convert for 3.0

These Meteor 2.x sync APIs will need conversion when upgrading to Meteor 3.0:

| Meteor 2.x (sync) | Meteor 3.0 (async) |
|--------------------|--------------------|
| `Collection.findOne()` | `Collection.findOneAsync()` |
| `Collection.find().fetch()` | `Collection.find().fetchAsync()` |
| `Collection.insert()` | `Collection.insertAsync()` |
| `Collection.update()` | `Collection.updateAsync()` |
| `Collection.remove()` | `Collection.removeAsync()` |
| `Collection.upsert()` | `Collection.upsertAsync()` |
| `Meteor.user()` | `Meteor.userAsync()` |
| `Meteor.userId()` | Remains sync |

**Current status:** Server-side code already uses async patterns via `ReactiveCache`. The sync `findOne()` calls in allow/deny callbacks will need to be addressed when Meteor 3.0's allow/deny system supports async (or is replaced).

---

## 9. Files Reference

Key files involved in the async migration:

| File | Role |
|------|------|
| `imports/reactiveCache.js` | ReactiveCache facade + Server/Client/Index implementations |
| `server/lib/utils.js` | Permission helper functions (`allowIsBoardMember*`) |
| `models/*.js` | Collection schemas, helpers, allow/deny, hooks, methods |
| `server/publications/*.js` | Meteor publications |
| `server/rulesHelper.js` | Rule trigger/action evaluation |
| `server/cronMigrationManager.js` | Cron-based migration jobs |
