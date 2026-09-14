---
name: meteor-pubsub
description: >
  Use when authoring or debugging Meteor publications and subscriptions
  (Meteor.publish, Meteor.subscribe). Triggers on publication strategies
  (SERVER_MERGE, NO_MERGE, NO_MERGE_NO_HISTORY), the low-level publish API
  (added/changed/removed), cursor authorization, reactive joins, leaked
  documents. Use this skill when the user asks about pub/sub or asks about
  reactive data fetching.
metadata:
  author: meteor
  kind: knowledge
  meteor: ">=3.0"
  area: data
  tagline: "Author and debug publications/subscriptions (publish strategies, low-level `added/changed/removed`, authorization, reactive joins)."
  bundle: ["essentials", "fullstack"]
  docs_synced_at: "2026-08-25"
license: MIT
---

# Meteor publications and subscriptions

Publications stream a set of documents to subscribed clients and keep them
live. The publication is the only place server-side authorization can
filter rows before they reach the client.

## Decision flow

1. Does the client need this data reactively? If no, prefer a method (one-shot
   read). If yes, use a publication.
2. Is the data user-specific? Filter by `this.userId` inside the publish
   function. Without that filter, documents leak across users.
3. Can the publication be expressed as a single cursor? Return it directly.
4. Does it need one async lookup before choosing a cursor? Use an async
   publish handler, await the lookup, then return the cursor.
5. Does it need per-document async joins, custom aggregation output, or an
   external reactive source? Drop to the low-level `this.added` /
   `this.changed` / `this.removed` API.

## Scaffold

```javascript
import { Meteor } from "meteor/meteor";
import { Items } from "/imports/api/items";

Meteor.publish("items.mine", function () {
  if (!this.userId) {
    return this.ready();
  }
  return Items.find(
    { ownerId: this.userId },
    { fields: { title: 1, qty: 1, updatedAt: 1 }, sort: { updatedAt: -1 } },
  );
});
```

Project `fields` whenever the collection contains columns the subscriber
must not receive.

Async publish handlers may also return a cursor:

```javascript
Meteor.publish("items.byTeam", async function (teamId) {
  const member = await Memberships.findOneAsync({
    teamId,
    userId: this.userId,
  });
  if (!member) return this.ready();
  return Items.find({ teamId }, { fields: { title: 1, qty: 1 } });
});
```

Meteor awaits the handler before processing the returned cursor.

## Subscribing

```javascript
import { Meteor } from "meteor/meteor";

const handle = Meteor.subscribe("items.mine");
// React / Blaze / Svelte hooks observe handle.ready() and the local cursor.
handle.stop();
```

## Publication strategies

Set per-collection with `Meteor.server.setPublicationStrategy`. Three options:

```javascript
import { DDPServer } from "meteor/ddp-server";

Meteor.server.setPublicationStrategy(
  "items",
  DDPServer.publicationStrategies.NO_MERGE,
);
```

| Strategy             | When to use                                                                 |
|----------------------|-----------------------------------------------------------------------------|
| `SERVER_MERGE`       | Default. Tracks merged document fields across publications and sends deltas. |
| `NO_MERGE`           | Tracks sent document IDs so unsubscribe can remove them. Use when the collection is owned by one publication. |
| `NO_MERGE_NO_HISTORY`| Remembers nothing and sends no removals on stop. Reserve for send-and-forget queues where stale client documents are intentional. |

See `references/publication-strategies.md`.

## Low-level publish API

For joins or async work:

```javascript
Meteor.publish("feed", async function () {
  const cursor = Posts.find({}, { fields: { title: 1, authorId: 1 } });
  const observer = await cursor.observeChangesAsync({
    added: async (id, doc) => {
      const author = await Users.findOneAsync(doc.authorId, {
        fields: { username: 1 },
      });
      this.added("feed", id, { ...doc, authorName: author?.username });
    },
    changed: (id, changes) => this.changed("feed", id, changes),
    removed: (id) => this.removed("feed", id),
  });

  this.ready();
  this.onStop(() => observer.stop());
});
```

Note: cursor `transform` functions remain synchronous. Use a separate
publication or the low-level API for per-document async joins.

Live observer delivery does not wait for one async callback before later
changes arrive. If ordering or backpressure matters, serialize the work with a
per-subscription Promise queue. Attach an error policy and stop the observer
from `this.onStop`; see `references/low-level-publish-api.md`.

## Anti-patterns

- Publish without a `this.userId` filter when data is user-specific.
- Publish sensitive or unnecessary columns. Add a `fields` projection when
  the full document is not part of the publication contract.
- Confuse an async publish handler with an async cursor transform. Meteor
  awaits the handler Promise, but each transform callback must return a
  document synchronously.
- Use cursor transforms for async joins. Transforms are synchronous; the
  low-level API is the right tool.
- Subscribe to large unbounded collections. Page the data with `limit`/`skip`.

## See also

- `references/publication-strategies.md`
- `references/low-level-publish-api.md`
- `references/eval-cases.md`
