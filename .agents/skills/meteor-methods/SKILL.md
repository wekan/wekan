---
name: meteor-methods
description: >
  Use when authoring or debugging Meteor methods (Meteor.methods, Meteor.call,
  Meteor.callAsync). Triggers on argument validation with check(), optimistic
  UI stubs, latency compensation, Meteor.Error handling, and DDPRateLimiter.
  Use this skill when the user asks about server-side mutation, asks about
  rate limiting RPC, or asks about wrapping a method with auth checks.
metadata:
  author: meteor
  kind: knowledge
  meteor: ">=3.0"
  area: data
  tagline: "Author and debug Meteor methods (argument `check()`, optimistic stubs, latency compensation, `Meteor.Error`, `DDPRateLimiter`)."
  bundle: ["essentials", "fullstack"]
  docs_synced_at: "2026-08-25"
license: MIT
---

# Meteor methods

Methods are Meteor's primitive for server-side mutation called from the client.
In Meteor 3 they are async on the server. Latency compensation still works via
client-side stubs.

## Decision flow

1. Is this code mutating server data? Use a method.
2. Does the client need to read the result before the server replies? Write
   a client stub with the same name; it mutates the local Minimongo collection
   and the change is reverted if the server disagrees.
3. Does the method accept untrusted input? Validate every argument with
   `check()`. Otherwise the agent should refuse to write the method.
4. Is the method rate-sensitive? Add a `DDPRateLimiter.addRule`.

## Scaffold

```javascript
import { Meteor } from "meteor/meteor";
import { check, Match } from "meteor/check";

Meteor.methods({
  async addItem(payload) {
    check(payload, {
      title: String,
      qty: Match.Integer,
    });
    if (!this.userId) {
      throw new Meteor.Error("not-authorized");
    }
    const _id = await Items.insertAsync({
      ...payload,
      ownerId: this.userId,
      createdAt: new Date(),
    });
    return _id;
  },
});
```

## Calling from the client

```javascript
try {
  const id = await Meteor.callAsync("addItem", { title: "Hi", qty: 1 });
  setLocalId(id);
} catch (err) {
  if (err && typeof err === "object" && "error" in err) {
    console.error(err.error, err.reason, err.details);
  } else {
    console.error("local or transport failure", err);
  }
}
```

## Optimistic UI

Define the same method on the client. The client stub runs immediately against
the local Minimongo; the server's authoritative result reverts any divergence.

```javascript
// client/methods.js
import { Meteor } from "meteor/meteor";
import { Random } from "meteor/random";
Meteor.methods({
  addItem(payload) {
    Items.insert({
      ...payload,
      _id: Random.id(),
      ownerId: Meteor.userId(),
      createdAt: new Date(),
    });
  },
});
```

Synchronous stubs are simplest when they only need synchronous Minimongo.
Async stubs are also supported by `callAsync` and are useful when the same
method definition runs on client and server with `*Async` collection calls.
An async stub may await microtask-based local work, but it must not wait on
`fetch`, timers, IndexedDB, workers, or other browser macrotask APIs. Run
external I/O outside the stub.

## Rate limiting

```javascript
import { DDPRateLimiter } from "meteor/ddp-rate-limiter";

DDPRateLimiter.addRule(
  {
    type: "method",
    name: "addItem",
    userId: (userId) => Boolean(userId),
  },
  5,        // operations
  10000,    // per 10s
);
```

Meteor 3.5+ permits async matcher functions for database-backed decisions. On
Meteor 3.0 through 3.4, matchers must stay synchronous; use a fixed rule,
precomputed synchronous state, or upgrade instead of awaiting Mongo in a
matcher.

Meteor awaits async matchers sequentially on the incoming connection's message
queue. Project only required fields and keep the lookup fast. A rejected
matcher Promise errors the invocation; test that path explicitly.

See `references/rate-limiting.md` for the rule-object schema and
per-connection vs per-user keys.

## Error handling

Throw `Meteor.Error(code, reason, details?)` for an intentional client-visible
failure. A plain `Error` is logged on the server and sanitized for the client
as `Meteor.Error(500, "Internal server error")`; its original message and
stack are not exposed. `Meteor.Error` carries its code, reason, and details.
Do not assume every `callAsync` rejection has that shape: callback misuse,
transport failures, and local stub exceptions can produce native or arbitrary
errors. Narrow the caught value before reading Meteor-specific fields.

## Anti-patterns

- Methods without `check()` on every argument. Reject the method in code
  review.
- Reusing a method for both authenticated and unauthenticated calls. Split
  into two methods.
- Awaiting browser macrotask APIs such as `fetch` or timers inside a client
  stub. Async stubs are valid, but those APIs let unrelated code run before
  the optimistic simulation finishes.
- Calling `Meteor.user()` inside an async method body. Use `this.userId`.

## See also

- `references/check-and-validate.md`
- `references/rate-limiting.md`
- `references/eval-cases.md`
