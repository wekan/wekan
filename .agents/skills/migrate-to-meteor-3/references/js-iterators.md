# Iterators with `await`

Naive `Array.prototype.forEach`, `Array.prototype.map`, `Array.prototype.filter`,
and `Array.prototype.find` do **not** make their containing function async
just because the callback is marked `async`. The iterator returns synchronously;
the callback's Promise is discarded.

## `forEach`

```javascript
// BROKEN: returns before any awaited work resolves
items.forEach(async (item) => {
  await processItem(item);
});
```

Replace with `for...of`:

```javascript
for (const item of items) {
  await processItem(item);
}
```

This runs the items serially. If order does not matter and you want
concurrency, use `Promise.all`:

```javascript
await Promise.all(items.map((item) => processItem(item)));
```

## `map`

```javascript
// BROKEN: result is an array of Promises, not values
const ids = users.map(async (u) => await Users.insertAsync(u));
```

Two correct shapes:

```javascript
// concurrent
const ids = await Promise.all(
  users.map((u) => Users.insertAsync(u)),
);

// serial
const ids = [];
for (const u of users) {
  ids.push(await Users.insertAsync(u));
}
```

For large arrays, prefer the serial form to avoid hammering Mongo with N
parallel writes.

## `filter`

`Array.prototype.filter` cannot be awaited. Two patterns:

```javascript
// concurrent then prune
const checks = await Promise.all(
  items.map(async (it) => ({ it, keep: await predicate(it) })),
);
const kept = checks.filter((c) => c.keep).map((c) => c.it);

// serial
const kept = [];
for (const it of items) {
  if (await predicate(it)) kept.push(it);
}
```

## `find`

```javascript
// BROKEN
const hit = items.find(async (it) => await match(it));
```

Replace with `for...of`:

```javascript
let hit;
for (const it of items) {
  if (await match(it)) {
    hit = it;
    break;
  }
}
```

## `reduce`

Reduce with an async callback usually wants an accumulator that is itself
a Promise:

```javascript
// serial reduce
const sum = await items.reduce(async (accP, item) => {
  const acc = await accP;
  return acc + await score(item);
}, Promise.resolve(0));
```

For readability, prefer `for...of` with an explicit accumulator.

## Cursor methods are different

Meteor cursor iterators on the server already have async siblings. Use
those instead of converting a `cursor.fetch()` array to a Promise loop:

```javascript
await cursor.forEachAsync(async (doc) => { /* ... */ });
const mapped = await cursor.mapAsync(async (doc) => { /* ... */ });
```

These properly await each callback.

---
Source: https://github.com/meteor/meteor/blob/devel/v3-docs/v3-migration-docs/migrating-to-async-in-v2/index.md
