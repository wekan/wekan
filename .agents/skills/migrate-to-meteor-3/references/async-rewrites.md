# Sync-to-async rewrite mechanics

Meteor 3 removed the synchronous Mongo API on the server. Replace each sync
Mongo call with its `*Async` sibling. Every caller that consumes the resulting
value must await it. A function that only returns the Promise can forward it
without adding `async` or `await`. Promise handling propagates up the call stack
until it reaches a method, publication, middleware, or another async-capable
framework boundary.

## Decision flow

1. Rewrite the leaf server API to its `*Async` sibling.
2. Find every caller of the changed function, including indirect callers.
3. Caller consumes the resolved value: mark it `async` and add `await`.
4. Caller only returns the Promise: return it directly; `return await` is not
   required unless local error handling needs it.
5. Caller is a synchronous-only boundary: restructure it around an async
   factory, preloaded value, or an async-capable outer boundary.
6. Continue until all paths reach a framework boundary that accepts Promises.
7. Client-side Minimongo supports both sync and async APIs. Keep sync calls
   when they simplify naturally synchronous reactive UI code. Use async calls
   in shared or already-async flows; reactive reads after an `await` require
   `Tracker.withComputation`. See `client-reactivity.md`.
8. Inside a method or publication, prefer `this.userId` over
   `Meteor.userId()`. The async server context can lose the implicit user.

## Propagate through the caller chain

Before migration, each caller receives a resolved value synchronously:

```javascript
function findOrder(id) {
  return Orders.findOne(id);
}

function calculateTotal(id) {
  const order = findOrder(id);
  return order.lines.reduce((total, line) => total + line.amount, 0);
}

function buildInvoice(id) {
  return { orderId: id, total: calculateTotal(id) };
}

Meteor.methods({
  createInvoice(id) {
    return buildInvoice(id);
  },
});
```

After converting the leaf API, propagate Promise handling through every caller
that consumes the result:

```javascript
function findOrder(id) {
  return Orders.findOneAsync(id);
}

async function calculateTotal(id) {
  const order = await findOrder(id);
  return order.lines.reduce((total, line) => total + line.amount, 0);
}

async function buildInvoice(id) {
  const total = await calculateTotal(id);
  return { orderId: id, total };
}

Meteor.methods({
  async createInvoice(id) {
    return buildInvoice(id);
  },
});
```

`findOrder` only forwards the Promise, so it does not need the `async` keyword.
The next two functions inspect resolved values, so both must be async and await
their callees. The method is the framework boundary and can return the final
Promise. When independent calls exist at one level, use `Promise.all` instead
of introducing unnecessary sequential waits.

## Synchronous-only boundaries

Constructors cannot be async. Move loading into an async factory and keep the
constructor synchronous:

```javascript
class Invoice {
  constructor(order) {
    this.order = order;
  }

  static async create(orderId) {
    const order = await Orders.findOneAsync(orderId);
    return new Invoice(order);
  }
}

const invoice = await Invoice.create(orderId);
```

Apply the same rule to callbacks. Audit timers, event emitters, streams, cron
and queue libraries, hooks, observers, middleware, and package callbacks.
Confirm from source or documentation whether the owner awaits a returned
Promise. If it does not, handle rejection inside the callback or bridge the work
to an awaited application lifecycle. Treat `void task().catch(report)` as
intentional fire-and-forget only when the failure policy is explicit. Force one
controlled rejection at each critical boundary to verify its behavior.

## Audit operation semantics after codemods

Do not validate a mechanical rewrite only by checking that the new method ends
in `Async`. Compare the operation and arguments with the original call.

- Flag read methods such as `findOneAsync` when an options argument contains
  update operators such as `$set`, `$unset`, `$push`, `$pull`, or `$inc`.
- Flag write methods whose selector, modifier, or options shape matches a read.
- Flag changed async calls whose Promise is neither awaited, returned, caught,
  nor deliberately detached with a documented failure policy.
- Exercise each changed write path and read the record back from the database.

Do not auto-edit a computed argument shape that cannot be resolved statically.
Report it for review.

## `allow` and `deny` during a staged migration

Prefer replacing `Collection.allow` and `Collection.deny` with authenticated
methods. When legacy rules must survive, treat them as a version boundary. Keep
validators compatible with the active Meteor 2 release during preparation,
then convert database reads inside validators to async functions for Meteor 3.
Meteor 3 awaits Promise-returning validators, as documented by the
[collection API](https://docs.meteor.com/api/collections). Test one allowed and
one denied client mutation after the release flip. Validators without database
access may remain synchronous.

## Async framework boundaries

Meteor methods and publish handlers may return Promises. Meteor also awaits a
Promise returned by a server `Meteor.startup` hook. Propagate critical startup
work to that boundary instead of starting it and returning `undefined`:

```javascript
Meteor.startup(async () => {
  try {
    await Migrations.migrateTo("latest");
  } catch (error) {
    console.error("Migration failed", error);
    throw error;
  }
});
```

Do not catch and swallow a failure that must stop startup. Browser event
systems usually do not await an async handler, so catch rejected method calls
inside the handler or deliberately forward them to application error state.

## Server rewrites

```javascript
const doc  = await Posts.findOneAsync(id);
const list = await Posts.find(q, { fields, sort, limit }).fetchAsync();
const _id  = await Posts.insertAsync(doc);
await Posts.updateAsync(q, mod);
await Posts.removeAsync(q);
await Posts.upsertAsync(q, mod);
```

Cursor methods on the server are async too:

```javascript
await cursor.forEachAsync(fn);
await cursor.mapAsync(fn);
await cursor.countAsync();
```

## Iterators with await

Naive `forEach` / `map` / `filter` callbacks marked `async` do not block the
iterator. See `js-iterators.md`.

## Fibers helpers

The Fibers-era helpers are gone:

| Removed                  | Replacement                                          |
|--------------------------|------------------------------------------------------|
| `Meteor._sleepForMs(ms)` | `await new Promise(r => setTimeout(r, ms))`          |
| `Meteor.wrapAsync(fn)`   | Call the underlying async API directly.              |
| `Promise.await(promise)` | `await promise`                                      |
| `Future` (`fibers/future`) | The package no longer ships. Refactor to async.    |

## Common errors

- `TypeError: Collection.findOne is not a function`: server-side sync API
  removed. Use `findOneAsync` and `await`.
- Application code receives a Promise where it expects a document: the
  consuming caller is not awaiting. Mark that caller `async` and await the
  call.
- `Meteor.call` returns `undefined` on the client: use
  `await Meteor.callAsync(...)` or provide a callback.
- `ReferenceError: Fiber is not defined`: a package or app file still
  references Fibers. Remove the dependency and rewrite the function.

## HTTP and timers

`HTTP.get`/`HTTP.post` are removed. Use native `fetch`:

```javascript
const res  = await fetch(url, { headers });
const data = await res.json();
```

Fetch resolves for HTTP error statuses. Check `res.ok` or the expected status
before treating the request as successful. Review body serialization, response
parsing, redirects, cookies, timeout or cancellation via `AbortSignal`, proxy
behavior, and custom TLS or CA configuration. Preserve the error contract that
callers expect. Test success, non-2xx, malformed response, and network failure.

`Meteor.defer(fn)` for fire-and-forget work survives, but for bulk fan-out
prefer `await Promise.all(items.map(processOne))`.

---
Source: https://github.com/meteor/meteor/blob/devel/v3-docs/v3-migration-docs/migrating-to-async-in-v2/index.md
