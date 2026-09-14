---
name: meteor-mongo-minimongo
description: >
  Use when authoring or debugging Mongo queries in Meteor 3. Triggers on
  Mongo.Collection, find/findOne, server async vs client Minimongo sync,
  oplog vs change streams, indexes, selectors, modifiers, projections.
  Use this skill when the user asks about Mongo on the server or asks about
  Minimongo on the client.
metadata:
  author: meteor
  kind: knowledge
  meteor: ">=3.0"
  area: data
  tagline: "Write and debug Mongo queries in Meteor 3 (server async vs Minimongo, oplog vs change streams, indexes, selectors, modifiers)."
  bundle: ["essentials", "fullstack"]
  docs_synced_at: "2026-09-08"
license: MIT
---

# Mongo and Minimongo

Meteor ships two implementations of the Mongo API in one codebase. The server
talks to MongoDB through an async driver. The client runs Minimongo, an
in-memory synchronous Mongo emulator that holds the documents that
subscriptions have shipped.

## Decision flow

1. Where does this code run?
   - Server-only: use `await Collection.*Async(...)`.
   - Client-only: use `Collection.*(...)` synchronously.
   - Isomorphic (`import` in shared code): use `await Collection.*Async(...)`.
     On the client the work is local but still Promise-based; on the server it
     talks to Mongo.
2. Does the query select more than a page of documents? Add `{ limit, skip }`
   and an index that matches the selector.
3. Are you reading from a publication on the client? Use `find().fetch()`
   (sync) without `await`. The data is already local.

## Server reads

```javascript
const doc  = await Posts.findOneAsync(id);
const list = await Posts.find({ ownerId }, {
  fields: { title: 1 }, sort: { createdAt: -1 }, limit: 50,
}).fetchAsync();
const count = await Posts.find({ ownerId }).countAsync();
```

## Server writes

```javascript
const _id = await Posts.insertAsync({ title, ownerId });
await Posts.updateAsync({ _id }, { $set: { title } });
await Posts.removeAsync({ _id });
```

## Client reads (Minimongo)

The async API is isomorphic. Prefer it in shared code so the same line works
on the server.

```javascript
const doc = await Posts.findOneAsync(id);                 // works in shared/client/server
const list = await Posts.find({ ownerId }).fetchAsync();
```

On the client, the operation reads in-memory Minimongo but the async API still
returns a real Promise. Code after `await` resumes in a later microtask. The
sync API also works client-side, but only there:

```javascript
const doc = Posts.findOne(id);                            // client-only
const list = Posts.find({ ownerId }).fetch();             // client-only
```

Pick sync when the calling scope is naturally sync and forcing `await`
would cascade async into a render path. Common cases:

- React render functions and hooks that consume reactive data.
- Blaze template helpers.
- Tracker autoruns.

Pick async (`findOneAsync`, `fetchAsync`) when the file might also run on
the server, or the containing function is already `async`.

## Indexes

Indexes are server-side. Create them on app startup:

```javascript
import { Meteor } from "meteor/meteor";
import { Posts } from "/imports/api/posts";

Meteor.startup(async () => {
  await Posts.createIndexAsync({ ownerId: 1, createdAt: -1 });
  await Posts.createIndexAsync({ slug: 1 }, { unique: true });
});
```

Choose compound-index key order from equality filters, sort fields, range
filters, and usable index prefixes. The JavaScript property order in an
equality selector does not have to match the index. Verify the chosen plan in
the Mongo shell (`meteor mongo`) with
`db.posts.find(...).explain("executionStats")`.

## Reactivity source: oplog or change streams

The core driver boundary is release-specific:

| Meteor | Reactive behavior |
|---|---|
| 3.0 through 3.4 | Uses oplog when `MONGO_OPLOG_URL` is configured; otherwise polling. Core change streams and reactivity-order settings are unavailable. |
| 3.5+ | Chooses a driver per query in the default order below. |

Meteor 3.5+ defaults to:

```text
changeStreams -> oplog -> polling
```

Change streams require MongoDB 6+ on a replica set or sharded cluster, an
unordered observer, no `skip` or `limit`, and a selector Minimongo can compile.
An ineligible query falls through to the next configured driver. Oplog is
available only when `MONGO_OPLOG_URL` is configured.

On Meteor 3.5+, override the app-wide order with
`METEOR_REACTIVITY_ORDER=oplog,polling` or:

```json
{
  "packages": {
    "mongo": {
      "reactivity": ["oplog", "polling"]
    }
  }
}
```

On Meteor 3.5+, the `disable-oplog` package removes only the oplog step. It
does not disable change streams. Use `reactivity: ["polling"]` to force
polling. On Meteor 3.0 through 3.4, do not add these settings; upgrade first.

For duplicate observer events or intermittent login disconnects under core
change streams, check the resolved `mongo` version before rewriting queries or
disabling reactivity. `mongo@2.5.1` (Meteor 3.5.2) fixes replay of events already
covered by a causal primary snapshot. Earlier 3.5 packages lack that fix;
upgrade and rerun the failing sequence. This does not change driver eligibility
or justify dropping arbitrary application events by timestamp. Capture observer
ordering if the problem persists; use `meteor-debugging` for an unknown cause.

## Collation (Meteor 3.5+)

Use `collation` for locale-aware or case-insensitive selectors and sorting on
both Mongo and Minimongo. Back the server query with an index created using
the same collation:

```javascript
const collation = { locale: "en", strength: 2 };
const users = await Users.find(
  { email: "Alice@Example.COM" },
  { collation },
).fetchAsync();

await Users.createIndexAsync({ email: 1 }, { collation });
```

Minimongo supports `locale`, strength 1 through 3, `caseLevel`,
`numericOrdering`, and `caseFirst`. Other Mongo collation options are
server-only and are ignored by Minimongo.

## Anti-patterns

- Use sync Mongo on the server. Removed in Meteor 3.
- Use sync Mongo (`findOne`, `insert`, `update`, `remove`) in shared code.
  Breaks the moment the file is imported on the server.
- Unbounded `find` on the server. Always `limit`.
- Forget `fields` projection when publishing. Always project.
- Assume the async Minimongo API resumes inline. It returns a Promise even
  though the underlying read is local.

## See also

- `references/server-vs-client.md`
- `references/selectors-modifiers.md`
- `references/eval-cases.md`
