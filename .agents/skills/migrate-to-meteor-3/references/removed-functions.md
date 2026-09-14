# Functions removed in Meteor 3.x

Meteor 3 removed the synchronous Mongo APIs on the server and the
Fibers-dependent helpers. This is the canonical replacement list.

## Mongo collections (server)

| Removed                       | Replacement                                  |
|-------------------------------|----------------------------------------------|
| `Collection.find(q).fetch()`  | `await Collection.find(q).fetchAsync()`      |
| `Collection.findOne(q)`       | `await Collection.findOneAsync(q)`           |
| `Collection.insert(doc)`      | `await Collection.insertAsync(doc)`          |
| `Collection.update(q, mod)`   | `await Collection.updateAsync(q, mod)`       |
| `Collection.remove(q)`        | `await Collection.removeAsync(q)`            |
| `Collection.upsert(q, mod)`   | `await Collection.upsertAsync(q, mod)`       |
| `cursor.count()` (server)     | `await cursor.countAsync()`                  |
| `cursor.forEach(fn)` (server) | `await cursor.forEachAsync(fn)`              |
| `cursor.map(fn)` (server)     | `await cursor.mapAsync(fn)`                  |

Client-side Minimongo retains the synchronous API.

## User helpers

| Removed                  | Replacement                |
|--------------------------|----------------------------|
| `Meteor.user()` (server) | `await Meteor.userAsync()` |

`Meteor.userId()` was not replaced with an async API. It remains synchronous
inside a method or publication and reads the current invocation. Prefer
`this.userId` there for explicit context. Outside those invocation scopes,
pass the user ID into the async function; `Meteor.userIdAsync()` does not
exist.

## Accounts

Server administration APIs that lost synchronous forms:

| Removed                              | Replacement                                   |
|--------------------------------------|-----------------------------------------------|
| `Accounts.setPassword(uid, p, opts)` | `await Accounts.setPasswordAsync(uid, p, opts)` |
| `Accounts.addEmail(uid, addr)`       | `await Accounts.addEmailAsync(uid, addr)`     |

Use `await Accounts.createUserAsync(options)` for explicit server-side user
creation. Do not apply this table to client login flows:

- Client `Accounts.createUser(options, callback)` remains supported, and
  `Accounts.createUserAsync(options)` is also available.
- Client `Accounts.changePassword(old, next, callback)` remains
  callback-shaped.
- `Meteor.loginWithPassword(user, password, callback)` remains supported.
  `Meteor.loginWithPasswordAsync` was added in Meteor 3.5.

## Email

| Removed                  | Replacement                          |
|--------------------------|--------------------------------------|
| `Email.send(options)`    | `await Email.sendAsync(options)`     |

## Assets

| Removed                    | Replacement                            |
|----------------------------|----------------------------------------|
| `Assets.getText(path)`     | `await Assets.getTextAsync(path)`      |
| `Assets.getBinary(path)`   | `await Assets.getBinaryAsync(path)`    |

## Mongo index management

| Removed                                | Replacement                                 |
|----------------------------------------|---------------------------------------------|
| `Collection._ensureIndex(spec, opts?)` | `await Collection.createIndexAsync(spec, opts?)` |

## Fibers helpers

- `Meteor._sleepForMs`: removed. Use `await new Promise(r => setTimeout(r, ms))`.
- `Meteor.wrapAsync`: removed. Use the underlying async API directly.
- `Future` (from `fibers/future`): removed. The package no longer ships.

---
Source: https://github.com/meteor/meteor/blob/devel/v3-docs/v3-migration-docs/api/removed-functions.md
