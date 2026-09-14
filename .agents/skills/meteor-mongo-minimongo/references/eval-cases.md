# Evaluation cases for `meteor-mongo-minimongo`

## Case 1: server-side find rewrite

Prompt: "This used to work in Meteor 2 on the server:

```
const post = Posts.findOne({ slug });
```

Now it returns undefined. Fix it."

Pass if the agent rewrites to `await Posts.findOneAsync({ slug })` and marks
the caller async.

## Case 2: missing index

Prompt: "My `Posts.find({ ownerId, archived: false }, { sort: { createdAt:
-1 } })` query is slow. Suggest an index."

Pass if the agent suggests `{ ownerId: 1, archived: 1, createdAt: -1 }` (or
calls out that `archived` could be omitted if filtering is rare).

## Case 3: Minimongo on client

Prompt: "My component is client-only. Which Mongo API should I use:
`Posts.findOne(id)` or `await Posts.findOneAsync(id)`?"

Pass if the agent says both work on the client and picks based on the
calling scope:

- Async (`findOneAsync`) when the file might ever be imported in
  shared/server code, or the containing function is already async.
- Sync (`findOne`) when the scope is naturally sync (React render, Blaze
  helper, Tracker computation) and forcing `await` would cascade an async
  migration through the component tree for no real gain.

The sync API exists for exactly that case; using it deliberately is not a
mistake. Fail if the agent claims that an async Minimongo Promise resolves
inline or synchronously; only the underlying data access is local.

## Case 4: leaking columns

Prompt: "My subscription includes the `passwordHash` field. I never wanted
that to reach the client. What did I do wrong?"

Pass if the agent identifies missing `fields` projection in the publication
and proposes a `fields: { title: 1, ... }` allow-list.

## Case 5: Meteor 3.5 reactivity driver

Prompt: "After upgrading to Meteor 3.5, is oplog still the default for every
reactive Mongo query? How can I force the old order?"

Pass if the agent gives the default `changeStreams`, `oplog`, `polling` order,
lists the main change-stream eligibility requirements, and uses either
`METEOR_REACTIVITY_ORDER=oplog,polling` or the equivalent
`packages.mongo.reactivity` setting. It must not claim that `disable-oplog`
also disables change streams.

## Case 6: case-insensitive email lookup

Prompt: "On Meteor 3.5, query email addresses case-insensitively on both the
client and server without lowercasing stored values."

Pass if the agent uses `{ collation: { locale: "en", strength: 2 } }` on the
query and creates the server index with the same collation. It should mention
that only a subset of Mongo collation options is supported by Minimongo.

## Case 7: change streams requested before Meteor 3.5

Prompt: "My app is fixed on Meteor 3.4.1 and uses Atlas. Configure core
`changeStreams,oplog,polling` reactivity with `METEOR_REACTIVITY_ORDER`."

Pass if the agent says core change streams and reactivity-order configuration
begin in Meteor 3.5, explains that 3.4.1 uses oplog only with
`MONGO_OPLOG_URL` and otherwise polling, and requires an upgrade before using
the requested core driver. Fail if it assumes Atlas implies core change-stream
support on every Meteor 3 release.

## Case 8: selector property order and compound index

Prompt: "My index is `{ ownerId: 1, archived: 1, createdAt: -1 }`, but the
query object is `{ archived: false, ownerId }`. Must I reorder its JavaScript
properties before Mongo can use the index?"

Pass if the agent says equality selector property order need not mirror the
compound index, checks index prefixes and equality-sort-range behavior, and
uses `explain('executionStats')` to verify the plan. Fail if it treats object
property order as an index-eligibility rule.

## Case 9: change-stream replay during login

Prompt: "On Meteor 3.5.1, observer traces show an event already represented by
the initial primary snapshot replaying and triggering intermittent login
disconnects. Should I drop old events in application code or force polling?"

Pass if the agent checks the `mongo@2.5.1` fix shipped with 3.5.2, proposes a
compatible upgrade and reruns the reproduction before a permanent workaround.
It preserves driver eligibility/fallback rules and does not claim every
disconnect has this cause. Fail if it drops arbitrary events by timestamp or
disables change streams without evaluating the release fix.
