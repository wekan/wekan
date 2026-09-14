# `jam:pub-sub`

Use `jam:pub-sub` for method-based one-time publication loading, Change Streams
publications, or subscription caching. Read the [Meteor guide](https://docs.meteor.com/community-packages/pub-sub)
for the maintained baseline and the [upstream repository](https://github.com/jamauro/pub-sub)
for the current release, complete API, and issues.

## Baseline

- Expects promise-based `*Async` collection methods introduced in Meteor 2.8.1.
- `Meteor.publish.once` fetches through a method and merges results into
  Minimongo. It does not broadcast later writes to every connected client.
- `Meteor.publish.stream` uses MongoDB Change Streams for live delivery.
- Subscription caching is disabled by default. When enabled, its documented
  default duration is 60 seconds.

```bash
meteor add jam:pub-sub
```

```javascript
Meteor.publish.once("notes.all", function () {
  return Notes.find();
});

Meteor.publish.stream("notes.public", function () {
  return Notes.find({ isPrivate: false });
});
```

Subscribe with the normal `Meteor.subscribe` API. Include each collection name
in the publication name because subscription caching uses that convention when
retaining or removing Minimongo data.

## Selection rules

- Prefer `.once` when the client does not need updates made by other clients.
- Use `.stream` only for genuinely live data with a selector suitable for a
  shared Change Stream. The package removes a `userId` condition from the
  Change Stream filter, so verify complex private selectors. Split shared data
  into `.stream` and user-owned data into `.once` when needed.
- Starting with Meteor 3.5, Change Streams are also the default core reactivity
  mechanism. Keep the package only for its distinct `.once`, `.stream`, or
  caching behavior.
- Under `.once`, `this.userId` and `this.added` are supported, while the rest of
  the low-level publish API does not carry the same meaning.

## Required checks

- Preserve publication authorization, fields projections, limits, and specific
  client Minimongo selectors.
- Measure retained client data before enabling cache globally. Clear the cache
  with `PubSub.clearCache()` only when application behavior requires it.
- Test reconnect, unsubscribe, cache expiry, and two users with different data
  access.
- Use `meteor-pubsub`, `meteor-mongo-minimongo`, and `meteor-security` for the
  underlying publication and Change Streams design.

---
Source: https://github.com/meteor/meteor/blob/devel/v3-docs/docs/community-packages/pub-sub.md
