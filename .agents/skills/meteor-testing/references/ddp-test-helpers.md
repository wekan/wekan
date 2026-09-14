# DDP-based test helpers

`--full-app` mode runs the whole app alongside tests. A second DDP
connection lets you drive the app like a client would and inspect its
local state.

## Connect to the running app

```javascript
import { DDP } from "meteor/ddp-client";

const conn = DDP.connect(Meteor.absoluteUrl());
```

`conn` is a stand-alone DDP client. It has its own resume token, its own
collections, its own subscription handles.

Register each named collection against that connection before subscribing:

```javascript
import { Mongo } from "meteor/mongo";

const RemoteItems = new Mongo.Collection("items", { connection: conn });
```

## Wait for a subscription to be ready

```javascript
import { Tracker } from "meteor/tracker";

function ready(sub) {
  return new Promise((resolve) => {
    const computation = Tracker.autorun((c) => {
      if (sub.ready()) {
        c.stop();
        resolve();
      }
    });
  });
}

const sub = conn.subscribe("items.mine");
await ready(sub);
```

## Inspect the resulting documents

```javascript
const docs = RemoteItems.find().fetch();
```

Do not inspect `conn._stores`, `._docs`, or `conn.connection`. The first two
are private internals, and `DDP.connect` returns the connection directly, so
there is no nested `.connection`. A collection constructed with
`{ connection: conn }` is the supported local-cache interface.

## Method invocation on a separate connection

```javascript
await conn.callAsync("items.add", { title: "x", qty: 1 });
```

This goes over the wire, hits the real method handler, and the result is
the value the method resolved to.

## Disconnect

```javascript
conn.disconnect();
```

Call this in `after` / `afterEach` so the test process exits cleanly.

## When to use which

| Need                                    | Use                                                              |
|-----------------------------------------|------------------------------------------------------------------|
| Test a method's logic                   | `Meteor.server.method_handlers[name].apply(ctx, args)` directly. |
| Test a publication's cursor             | `Meteor.server.publish_handlers[name].apply({ userId }, [])`.    |
| Test the full DDP path (auth, ratelimits, multi-user merge) | `DDP.connect(Meteor.absoluteUrl())` + `--full-app`. |
| Test client reactivity through DDP      | `--full-app` + `DDP.connect` + Tracker autorun.                  |

Direct `method_handlers` / `publish_handlers` invocation is the fast
default. Reach for `--full-app` and `DDP.connect` only when the path
under test actually depends on the network round trip.

---
Source: https://github.com/meteor/meteor/blob/devel/v3-docs/docs/tutorials/testing/testing.md
