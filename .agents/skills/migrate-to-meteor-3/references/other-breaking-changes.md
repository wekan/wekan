# Other breaking changes

Smaller breaking changes from the Meteor 3 upgrade that do not warrant
their own reference but still bite. Skim this once after the framework
flip; come back when a specific symptom matches.

## `Meteor.EnvironmentVariable.withValue` placement

Affects package authors that wrap `Meteor.publish`, `Meteor.methods`, or other
Meteor primitives to propagate dynamic context into a handler. In Meteor 3,
`withValue` uses `AsyncLocalStorage.run`; its context follows the callback's
Promise through `await`.

When patching `Meteor.publish`, place `withValue` at the wrapper's top level
around the call to the original `publish`. Do not introduce that scope inside
the invoked publication handler. Meteor establishes its own publication
invocation context before calling the handler, and the nested placement broke
packages that needed `Meteor.userId()` or another invocation value.

Wrong: introducing `withValue` inside the invoked handler:

```javascript
function patchPublish(publish) {
  return function (name, func, ...args) {
    return publish.call(this, name, function (...handlerArgs) {
      return _publishConnectionId.withValue(this?.connection?.id, () =>
        func.apply(this, handlerArgs)
      );
    }, ...args);
  };
}
```

Right: scope the complete patched registration flow and return its result:

```javascript
function patchPublish(publish) {
  return function (name, func, ...args) {
    return _publishConnectionId.withValue(this?.connection?.id, () =>
      publish.call(this, name, function (...handlerArgs) {
        return func.apply(this, handlerArgs);
      }, ...args)
    );
  };
}
```

Regression-test the invoked publication before and after an `await`. Its
`Meteor.userId()` or `DDP._CurrentPublicationInvocation` value must remain
consistent with the handler's `this.userId`. A direct `EnvironmentVariable`
test should likewise read the scoped value on both sides of an `await`.

## Mongo driver 6.x: callbacks removed on `rawCollection`

Meteor 3 ships MongoDB Node driver 6.x. The driver removed callback-style
overloads for every async operation. If your code drops to `rawCollection`
or `rawDatabase` for native driver access, rewrite the call sites:

```javascript
// Meteor 2.x: callback
Posts.rawCollection().findOne({ _id }, (err, doc) => { /* ... */ });

// Meteor 3.x: promise
const doc = await Posts.rawCollection().findOne({ _id });
```

The same applies to `rawCollection().aggregate(...).toArray(cb)`,
`insertOne(doc, cb)`, `bulkWrite(ops, cb)`, etc. If a third-party package
still passes a callback into a driver call, fork and rewrite.

## CLI changes

### `--vue2` flag removed

`meteor create --vue2` no longer exists. Vue 2 reached end of life in
December 2023. For Vue, use `meteor create --vue` (Vue 3).

### `meteor reset` no longer wipes Mongo by default

`meteor reset` now clears only the local build cache. The local MongoDB
data survives. To also wipe the database (the Meteor 2.x default), pass
`--db`:

```bash
meteor reset           # clears build cache only
meteor reset --db      # clears build cache AND local Mongo
```

Update any CI or development scripts that rely on `meteor reset` wiping
the database.

## Release-specific Node baseline

Meteor 3 does not have one Node baseline across every minor release:

| Meteor release | Bundled Node |
|----------------|--------------|
| 3.0             | Node 20     |
| 3.1 through 3.4 | Node 22     |
| 3.5+            | Node 24     |

Run `meteor node --version` in the target app and use that version in CI,
native dependency builds, and container images. Audit `engines.node` and
native packages whenever the target Meteor release changes Node major.

## "Cannot enlarge memory array" during `meteor update`

Running `meteor update --release=3.x` directly from a heavy 2.x project
sometimes crashes with:

```
MINISAT-out: Cannot enlarge memory arrays.
abort() at Error
```

The version-constraint solver (`minisat`) runs out of memory while
resolving the upgrade against a large `.meteor/packages` file. The fix
is to reduce the package surface before the upgrade:

1. Remove every Atmosphere package the app no longer uses.
2. Update or fork remaining packages to declare
   `api.versionsFrom(['2.x', '3.0'])` so the solver has fewer
   alternatives to consider.
3. Retry the upgrade. If it still fails, comment out non-core packages
   in `.meteor/packages`, upgrade, then re-add them one by one.

This is the same root cause as "the install just hangs forever" reports.

## `Meteor.bindEnvironment` for external callbacks

`Meteor.bindEnvironment` captures Meteor dynamic-variable values at the moment
the wrapper is created and restores those values when the callback later runs.
It does not discover the identity of a future method or publication
invocation, and it does not change JavaScript's `this` binding.

Create the wrapper inside the invocation whose environment must be preserved.
For identity, capture `this.userId` explicitly so a long-lived callback does
not depend on implicit request context:

```javascript
import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';

Meteor.methods({
  startImport(jobId) {
    check(jobId, String);
    if (!this.userId) throw new Meteor.Error('not-authorized');

    const userId = this.userId;
    externalSdk.once(jobId, Meteor.bindEnvironment(async (payload) => {
      await Posts.insertAsync({ payload, createdBy: userId });
    }));
  },
});
```

A wrapper created by top-level registration captures the top-level
environment, which normally has no user invocation. For a global event emitter
or background queue, put the authenticated identity in the job or event data
and pass it explicitly. Use `bindEnvironment` only for dynamic variables that
exist when the callback is registered.

## Monkey-patching from `Meteor.startup()`

Code that monkey-patches a Meteor API (intercepting `Meteor.publish`,
wrapping `Accounts.createUser`, etc.) must run after the API is loaded.
On 3.x, package load order is less forgiving than on 2.x; patches at the
top of a file may fire before the target API exists.

Wrap the patch in `Meteor.startup`:

```javascript
import { Meteor } from 'meteor/meteor';

Meteor.startup(() => {
  const original = Meteor.publish;
  Meteor.publish = function (name, handler, ...rest) {
    return original.call(this, name, async function (...args) {
      // patched behavior
      return handler.apply(this, args);
    }, ...rest);
  };
});
```

Symptom: the patch is in the codebase but the wrapped behavior never
runs. The patch fired before the target API loaded, so `Meteor.publish`
was `undefined` at patch time and the assignment was a no-op.

## NPM installer

Use `npx meteor` as the primary cross-platform command. The documented
`curl https://install.meteor.com/ | sh` command remains an alternative for
Linux and macOS; do not describe it as phased out. Do not add the npm Meteor
installer to the application's `package.json`.

Match the host Node prerequisite to the selected CLI version. Current Meteor
3.5 installation docs require Node 24+, while earlier Meteor 3 tool releases
bundle earlier Node majors as shown above.

---
Source: https://github.com/meteor/meteor/blob/devel/v3-docs/v3-migration-docs/breaking-changes/index.md
