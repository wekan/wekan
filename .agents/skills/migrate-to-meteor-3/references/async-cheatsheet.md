# Async cheatsheet

Quick lookup for the sync-to-async rewrite Meteor 3 requires on the server.

| Surface                | Sync (2.x, server)              | Async (3.x, server)                     |
|------------------------|---------------------------------|-----------------------------------------|
| Mongo read             | `c.find(q).fetch()`             | `await c.find(q).fetchAsync()`          |
| Mongo single read      | `c.findOne(q)`                  | `await c.findOneAsync(q)`               |
| Mongo write            | `c.insert(d)`                   | `await c.insertAsync(d)`                |
| Mongo update           | `c.update(q, m)`                | `await c.updateAsync(q, m)`             |
| Mongo delete           | `c.remove(q)`                   | `await c.removeAsync(q)`                |
| Mongo upsert           | `c.upsert(q, m)`                | `await c.upsertAsync(q, m)`             |
| Cursor enumeration     | `cursor.forEach(fn)`            | `await cursor.forEachAsync(fn)`         |
| Cursor count           | `cursor.count()`                | `await cursor.countAsync()`             |
| Cursor map             | `cursor.map(fn)`                | `await cursor.mapAsync(fn)`             |
| RPC                    | `Meteor.call('m', ...args, cb)` | `await Meteor.callAsync('m', ...args)`  |
| RPC with options       | `Meteor.apply(...)`             | `await Meteor.applyAsync(...)`          |
| User identity (server) | `Meteor.user()`                 | `await Meteor.userAsync()`              |
| Accounts create (server) | `Accounts.createUser(o)`      | `await Accounts.createUserAsync(o)`     |
| Accounts password set  | `Accounts.setPassword(...)`     | `await Accounts.setPasswordAsync(...)`  |
| Accounts add email     | `Accounts.addEmail(uid, addr)`  | `await Accounts.addEmailAsync(uid, addr)` |
| Email                  | `Email.send(opts)`              | `await Email.sendAsync(opts)`           |
| Mongo index            | `Collection._ensureIndex(spec)` | `await Collection.createIndexAsync(spec)` |
| Asset, text            | `Assets.getText(path)`          | `await Assets.getTextAsync(path)`       |
| Asset, binary          | `Assets.getBinary(path)`        | `await Assets.getBinaryAsync(path)`     |

Client Minimongo keeps its synchronous API. Client RPC may still move from a
callback to `callAsync`, and `Accounts.createUserAsync` is available, but the
callback-shaped client Accounts APIs were not removed.

---
Source: https://github.com/meteor/meteor/blob/devel/v3-docs/v3-migration-docs/migrating-to-async-in-v2/index.md
