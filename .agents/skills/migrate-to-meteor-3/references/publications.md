# Publications and cursor internals

Most publish functions return a cursor and Meteor handles the rest. Apps
that grew on Meteor 2.x sometimes drove publications imperatively with
`this.added` / `this.changed` / `this.removed`, often dipping into the
cursor's internal `_cursorDescription` for the collection name. That
internal API is unreliable on Meteor 3 and may return `undefined`,
silently breaking the publication.

## Prefer returning a cursor

Whenever the publication can be expressed as a single filtered cursor,
return it. Meteor wires up `added` / `changed` / `removed` automatically:

```javascript
Meteor.publish('posts.recent', function (limit) {
  return Posts.find({}, { limit, sort: { createdAt: -1 } });
});
```

Meteor 3 supports both conventional and async publish handlers. Await setup
work, then return a cursor or array of cursors:

```javascript
Meteor.publish('posts.byTeam', async function (teamId) {
  const membership = await Memberships.findOneAsync({
    teamId,
    userId: this.userId,
  });
  if (!membership) return this.ready();
  return Posts.find({ teamId });
});
```

Meteor awaits the handler Promise before processing the returned cursor.
Use the low-level API only when the result cannot be expressed as a returned
cursor, such as per-document async joins or a custom external data source.

## Preserve framework-bound `this`

Meteor invokes method and publication handlers with an invocation context.
Arrow functions ignore that binding, so an arrow that reads `this.userId`,
`this.connection`, `this.ready()`, `this.added()`, or another context member is
incorrect even when its body is otherwise async-compatible.

Before changing handlers, use an AST scan to find:

- an arrow passed directly to `Meteor.publish`;
- an arrow-valued property in an object passed to `Meteor.methods`;
- a `ThisExpression` owned by that outer arrow.

Change only the context-owning handler to an ordinary function:

```javascript
Meteor.publish('items.mine', function () {
  if (!this.userId) return this.ready();
  return Items.find({ ownerId: this.userId });
});

Meteor.methods({
  async 'items.create'(input) {
    return Items.insertAsync({ ...input, ownerId: this.userId });
  },
});
```

Do not rewrite an arrow that never uses framework context merely because it is
a handler. Preserve nested arrows inside an ordinary handler when they
intentionally capture the handler's `this`. Validate one authenticated and one
unauthenticated call or subscription so the test proves the bound context, not
only compilation.

## Avoid `_cursorDescription`

The internal pattern:

```javascript
// fragile in Meteor 3
async function publishNonReactively(sub, cursor) {
  await cursor.forEachAsync((doc) => {
    sub.added(cursor._cursorDescription.collectionName, doc._id, doc);
  });
  sub.ready();
}
```

`_cursorDescription.collectionName` is internal and not guaranteed.
Pass the collection name explicitly instead:

```javascript
async function publishNonReactively(sub, collectionName, ...cursors) {
  for (const cursor of cursors) {
    await cursor.forEachAsync((doc) => {
      sub.added(collectionName, doc._id, doc);
    });
  }
  sub.ready();
}

// usage:
Meteor.publish('posts.featured', function () {
  return publishNonReactively(this, 'posts', Posts.find({ featured: true }));
});
```

Or, better, return the cursor and let Meteor handle the wiring.

## Cursor transforms must be sync

A cursor `transform` runs on every document. In Meteor 3 it must be
synchronous:

```javascript
// BROKEN: async transform
Posts.find({}, {
  transform: async (doc) => {
    doc.author = await Users.findOneAsync(doc.authorId);
    return doc;
  },
});
```

Produces Promise-shaped documents or publication/serialization failures.
Two options:

1. Keep the transform synchronous. Run the join in a separate publication
   or on the client.
2. Drop to the low-level publish API and join inside an
   `observeChangesAsync` handler.

## Low-level publish API

```javascript
Meteor.publish('feed', async function () {
  const handle = await Posts.find().observeChangesAsync({
    added:   (id, doc) => this.added('posts', id, doc),
    changed: (id, doc) => this.changed('posts', id, doc),
    removed: (id)      => this.removed('posts', id),
  });
  this.ready();
  this.onStop(() => handle.stop());
});
```

Always stop an `observeChangesAsync` handle from `this.onStop`. Without the
teardown, the observer leaks.

## Authorization

Filter inside the publish body. The publish function is the only chokepoint
that runs before data leaves the server:

```javascript
Meteor.publish('items.mine', function () {
  if (!this.userId) return this.ready();
  return Items.find(
    { ownerId: this.userId },
    { fields: { title: 1, qty: 1 } },
  );
});
```

Project `fields` whenever the collection contains columns the subscriber
must not receive.

---
Source: https://github.com/meteor/meteor/blob/devel/v3-docs/docs/api/meteor.md
