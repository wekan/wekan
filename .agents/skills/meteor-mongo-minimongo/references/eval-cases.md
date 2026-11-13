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

## Case 10: Reactive selector fallback

Prompt: "Our Meteor 3.6 app uses mongo 2.6.0, Change Streams first, and reactive $near and $where queries. Should I remove these selectors and projections so all queries use Change Streams?"

Pass if the agent preserves semantics, explains local matcher limitations and Change Streams/oplog rejection, verifies polling fallback plus initial and live results; retains skip/limit/projection eligibility checks.

Fail if it forces Change Streams by stripping constraints or says configuring MONGO_OPLOG_URL guarantees these selectors use oplog.

## Case 11: Older selector near miss

Prompt: "The same $near reactive query is wrong on Meteor 3.5.2 and we must stay pinned. Does the 3.6 fix already apply, and what can we try without changing results?"

Pass if the agent checks resolved package/backports, does not claim the fix ships in 3.5.2 and offers supported polling configuration with query/live-update verification.

Fail if it promises fixed automatic eligibility or rewrites away the selector.

## Case 12: Change-stream selector fallback

Prompt: "Our Meteor 3.6 app resolves mongo@2.6.0 and uses $where and $near queries. MongoDB accepts them but Change Streams are not selected. Would adding MONGO_OPLOG_URL force realtime support? A second app is pinned to 3.4."

Pass if the agent distinguishes query validity from observer eligibility, explains both driver limitations and polling fallback, preserves older oplog/polling behavior and avoids forcing core Change Streams or rewriting the DB without need.

## Case 13: MongoDB version floor

Prompt: "Our Meteor 3.6 app resolves mongo@2.6.0 on a MongoDB 6.0.8 replica set. Change Streams stopped being selected. Should I force the driver or remove publication limits?"

Pass if the agent checks the 6.0.9+/7+ floor, preserves query semantics, verifies eligible oplog/polling fallback and plans any database upgrade with backup/compatibility checks. Fail if it forces Change Streams or treats all MongoDB 6 releases as eligible.

## Case 14: Large events and interrupted recovery

Prompt: "On Meteor 3.6 with mongo@2.6.0 and MongoDB 8, an event is split and the connection drops between fragments. Another run logs ChangeStreamHistoryLost or BSONObjectTooLarge. Should we release pending writes immediately or drop old events?"

Pass if the agent distinguishes retained partial-event resume from non-resumable reopen/resync, waits for reassembly/reconciliation before pending write completion and verifies observer/DDP state. Fail if it delivers fragments, drops events by timestamp, expands the document limit or bypasses fences.

## Case 15: Earlier Change Streams package

Prompt: "Our Meteor 3.5.3 app resolves mongo@2.5.1 on MongoDB 6.0.8. Does the 3.6 split-event recovery contract apply already?"

Pass if the agent checks the resolved package/backport, preserves the earlier MongoDB 6+ eligibility branch and does not promise the full 2.6.0 split-event/fence contract on 2.5.1. It recognizes existing 3.5.3 history-loss resync. Fail if it claims no earlier recovery exists, imposes the new server floor on unchanged older packages or claims their recovery is identical.

## Case 16: pagination does not rule out every fallback

Prompt: "On Meteor 3.6, skip/limit disqualifies our query from Change Streams. We have MONGO_OPLOG_URL. Does that automatically mean polling is the only option?"

Pass if the agent checks oplog's separate cursor eligibility and retains it when eligible, then polling as fallback. Fail if it treats every Change Streams limitation as an oplog limitation or removes pagination to force a driver.

## Case 17: Patched live-selector fallback

Prompt: "After Meteor 3.6.1 (mongo@2.6.1/minimongo@2.2.2), a publication using $type and $not with $elemMatch polls even though Change Streams worked before. We also use PCRE regexes and collation strength 4. Should we remove those filters or force the old driver?"

Pass if the agent: Recognizes semantic-divergence guards, preserves authorization/query semantics and a usable polling fallback, checks initial/live/removal results and performance without bypassing guards. Distinguishes ordinary supported selectors/collation.
Fail if it contradicts these boundaries or invents unsupported APIs.


## Case 18: 3.4 backport does not add Change Streams

Prompt: "On Meteor 3.4.4 with mongo@2.3.2 and minimongo@2.1.2, $type causes an oplog query to poll. Should I set METEOR_REACTIVITY_ORDER=changeStreams,polling? Another app is still on 3.4.3."

Pass if the agent: Recognizes the patched selector guard but no core Change Streams/order settings on 3.4.4. Uses its existing oplog/polling path, checks the older app package pairing and does not assume the guard was already present.
Fail if it contradicts these boundaries or invents unsupported APIs.


## Case 19: Ordinary selector near miss

Prompt: "We use Meteor 3.5.5 with mongo@2.5.2/minimongo@2.2.0_2, a plain equality selector and collation {locale:"en",strength:2}, without caseLevel. Must every query now poll?"

Pass if the agent: Does not generalize divergence guards to every selector or collation. Checks actual driver eligibility and configuration, preserving a supported live driver when eligible.
Fail if it contradicts these boundaries or invents unsupported APIs.
