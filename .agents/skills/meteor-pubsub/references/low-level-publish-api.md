# Low-level publish API

When a publish function needs to join, transform asynchronously, or react to
external sources, return nothing and drive the publication imperatively.

## Methods on `this`

- `this.added(collectionName, id, fields)`: announce a document.
- `this.changed(collectionName, id, fields)`: update fields.
- `this.removed(collectionName, id)`: drop a document.
- `this.ready()`: signal initial population complete.
- `this.onStop(fn)`: register a teardown.
- `this.error(err)`: stop the subscription and send the error to the client.
- `this.stop()`: end the subscription.
- `this.userId`, `this.connection`: identity.

## Pattern

```javascript
Meteor.publish("feed", async function () {
  const handle = await Posts.find().observeChangesAsync({
    added:   (id, doc) => this.added("posts", id, doc),
    changed: (id, doc) => this.changed("posts", id, doc),
    removed: (id) => this.removed("posts", id),
  });
  this.ready();
  this.onStop(() => handle.stop());
});
```

Always pair `observeChangesAsync` with `onStop`. Leaks otherwise.

## Async callback ordering

Initial `added` callbacks can be awaited while the observer is attaching, but
live notifications do not wait for an async callback before scheduling later
changes. Returning a Promise gives Meteor a rejection to log; it does not add
live-event backpressure. Serialize dependent work yourself:

```javascript
Meteor.publish("feed", async function () {
  let work = Promise.resolve();
  const enqueue = (task) => {
    work = work.then(task).catch((error) => this.error(error));
    return work;
  };

  const handle = await Posts.find().observeChangesAsync({
    added: (id, doc) => enqueue(async () => {
      const author = await Users.findOneAsync(doc.authorId, {
        fields: { username: 1 },
      });
      this.added("feed", id, { ...doc, authorName: author?.username });
    }),
    changed: (id, fields) => enqueue(async () => {
      this.changed("feed", id, fields);
    }),
    removed: (id) => enqueue(async () => {
      this.removed("feed", id);
    }),
  });

  this.ready();
  this.onStop(() => handle.stop());
});
```

Keep independent callbacks synchronous when no asynchronous join is needed.
If one queued task fails, `this.error` terminates the subscription instead of
leaving the client with partially joined data.

---
Source: https://github.com/meteor/meteor/blob/devel/v3-docs/docs/api/meteor.md#publish-and-subscribe
