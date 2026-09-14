# `Meteor.call` vs `Meteor.callAsync`

In Meteor 2.x, `Meteor.call('name', ...args, callback)` was the canonical client
invocation. In Meteor 3.x, prefer `Meteor.callAsync('name', ...args)`, which
returns a `Promise`.

## Client-side rewrites

| 2.x                                              | 3.x                                                  |
|--------------------------------------------------|------------------------------------------------------|
| `Meteor.call('m', a, b, (err, res) => ...)`      | `try { const res = await Meteor.callAsync('m', a, b) } catch (err) { ... }` |
| `Meteor.call('m', a, b)` (fire-and-forget)       | `Meteor.callAsync('m', a, b).catch(console.error)`   |
| `Meteor.apply('m', args, opts, cb)`              | `await Meteor.applyAsync('m', args, opts)`           |

## Server-side rewrites

On the server, `Meteor.call` runs inline (no DDP round trip). Use `callAsync`
for consistency and to make the call site `await`-able.

## Optimistic UI

`callAsync` participates in latency compensation the same way `call` did. If
the method has a client-side stub, the stub runs immediately and the local
collection writes are visible before the server round trip resolves.

## Error shape

Intentional client-visible server failures should throw `Meteor.Error`, whose
rejection exposes `.error`, `.reason`, and `.details`. Do not assume every
rejection has that shape. A local stub exception, API misuse, or transport
failure can produce a native or arbitrary error. Narrow the value first:

```javascript
try {
  await Meteor.callAsync('orders.create', input);
} catch (error) {
  if (error && typeof error === 'object' && 'error' in error) {
    reportMeteorError(error.error, error.reason, error.details);
  } else {
    reportUnexpectedError(error);
  }
}
```

## When to keep `Meteor.call`

Only when interoperating with a library that requires a callback. New code
should always use `callAsync`.

## Method stub macrotask ban

In Meteor 3 the client-side stub of a method must complete within one
microtask tick. The runtime watches for stubs that yield to a macrotask
and logs:

```
Method stub (<method name>) took too long and could cause unexpected problems.
```

These APIs are banned inside a stub body:

- `fetch` and `XMLHttpRequest`
- `setTimeout`, `setInterval`, `setImmediate`
- `indexedDB`
- Web Workers and `Worker.postMessage`

Async stubs are supported. They may await work that settles without yielding
to a browser macrotask, including `*Async` Minimongo writes used by a shared
client/server method definition. Do external I/O after `callAsync` resolves.
Keep the stub limited to deterministic local state changes.

Symptom: the optimistic update flashes (the local write is reverted)
even though the server method succeeds. The stub yielded to a macrotask
and Meteor discarded its writes.

---
Source: https://github.com/meteor/meteor/blob/devel/v3-docs/v3-migration-docs/breaking-changes/call-x-callAsync.md
