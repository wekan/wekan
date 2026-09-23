# Logs and instrumentation

Read this reference when existing output cannot distinguish a runtime entry,
guard, branch, state transition, boundary, or event order.

## Add the smallest observation

| Question | Observation point |
|---|---|
| Did the flow start? | Handler, method, publication, job, or reactive entry |
| Why did it stop? | Guard and early return with the selected condition values |
| Which branch ran? | Branch name and values that select it |
| Where did the value change? | Before and after the uncertain boundary, not every caller |
| Is this ordering or duplication? | Opaque event ID, phase, counter, and timestamp only when time matters |

Keep diagnostics behavior-neutral. Reproduce and read them before editing the
logic.

```javascript
console.log("[server items.add] before insert", {
  requestId,
  hasUserId: Boolean(this.userId),
  itemId,
  quantity,
});
```

Select and redact fields. Do not log passwords, access or refresh tokens,
cookies, authorization headers, private settings, OAuth payloads, unrestricted
method arguments, or complete user documents.

Raw objects shown by browser tools can reflect later mutation. Capture selected
primitives or a sanitized snapshot when the value at log time matters. Do not
require `JSON.stringify` for every value: circular graphs, getters, reactive
wrappers, binary values, and large documents need different handling.

## Reactive and concurrent paths

- Guard or sample diagnostics inside `Tracker.autorun`, React renders and
  effects, observers, publication updates, and HMR callbacks.
- Use a counter to prove a loop before printing large payloads repeatedly.
- Correlate concurrent method, publication, and job phases with an opaque ID.
- Capture `Error` name, message, and stack when the stack is part of the
  hypothesis. Do not swallow or downgrade the original failure.

## Server lifecycle events on Meteor 3.6-beta.1

See the tagged [package guide](https://github.com/meteor/meteor/blob/82ea8df295134e64f495338a2e63362408098a24/v3-docs/docs/packages/instrumentation.md)
and [API reference](https://github.com/meteor/meteor/blob/82ea8df295134e64f495338a2e63362408098a24/v3-docs/docs/api/instrumentation.md).

With the beta's `instrumentation@0.0.1-beta360.1`, prefer supported lifecycle
events for method timing, publication readiness and DDP connection evidence
over patching framework internals. Inspect `.meteor/versions` first. Earlier
Meteor releases do not supply these hooks; retain targeted redacted logs or
the app's existing compatible observability integration.

```bash
meteor add instrumentation
```

Import only from a server entry and register once:

```javascript
import { Instrumentation } from "meteor/instrumentation";

const handle = Instrumentation.on("method.end", (event) => {
  if (event.durationMs > 200) {
    console.warn("[server slow method]", {
      name: event.name,
      traceId: event.traceId,
      durationMs: event.durationMs,
    });
  }
});

// Call when this observation is no longer needed, not after every event.
export function stopTiming() {
  handle.stop();
}
```

| Question | Events / correlation |
|---|---|
| Which invocation is slow or fails? | `method.start`, `method.end`, `method.error`; match `traceId`, not method name alone. Completion events carry `durationMs`. |
| Is a subscription ready, stopped or errored? | `publication.start`, `.ready`, `.stop`, `.error`; preserve `subscriptionId`, `traceId` and phase. This measures lifecycle, not every observer update. |
| Is this a connection lifetime problem? | `ddp.connection.open`, `.close`; correlate `connectionId`, with `durationMs` on close. Do not expect invocation trace fields on connection events. |
| How does a handler's log join the lifecycle? | `Instrumentation.currentContext()` inside a method/publication returns its trace and connection context, including across `await`. Outside an invocation all fields are null. Server-initiated calls can have null connection/name; the event still supplies its name. |

Listeners are best-effort and never awaited. Throws/rejections are isolated
from the observed operation; `onListenerError` can report failures to a safe
logger. Keep listeners cheap: synchronous work still runs on the server.
Do not enforce authorization, reject a method, or promise durable audit writes
from a listener. Keep validation and access checks in the actual handler.
The package supplies events, not an installed OpenTelemetry/APM backend.

Arguments, results and IP addresses are off by default. Prefer selected
metadata. If a payload is necessary, project approved fields per method:

```javascript
Instrumentation.configureMethod("orders.lookup", {
  captureArgs: ([orderId]) => ({ orderId }),
});
```

Projectors receive defensive copies and outputs still pass through a bounded,
cycle-safe preview. Bounded size is not generic secret redaction. Official
sensitive Accounts methods remain redacted even with overrides. Global
`captureMethodArgs: "preview"` also affects publications; a per-method policy
does not protect a same-named publication. `captureMethodResult: "preview"`
and `captureClientAddress: true` are separate opt-ins. Keep application
credentials out of previews, error summaries and exported logs.

Stop temporary handles during cleanup. `METEOR_INSTRUMENTATION_DISABLED=1`
disables emission initially; `Instrumentation.configure({ enabled: false })`
can disable it at runtime. Runtime configuration can override the environment
default. Bound and clean up any application-maintained correlation maps.

## Persistent structured logs

Use the application's established logger for maintained observability. Meteor's
standard package is available when the app adds `logging`:

```bash
meteor add logging
```

```javascript
import { Log } from "meteor/logging";

Log.info({
  message: "items.add completed",
  app: "SERVER",
  requestId,
  itemId,
});
```

`Log.debug` is not displayed in production. Do not depend on it for production
incident evidence. Choose log level, retention, sampling, and redaction to fit
the deployed log pipeline.

## Cleanup

Review the diff and remove only investigation diagnostics. Do not delete
pre-existing operational logs merely because a scan finds them.

```bash
rg -n 'console\.(log|debug|warn|error)|\bdebugger\b' \
  --glob '!node_modules/**' --glob '!.meteor/**'
```

Retain a diagnostic only when it has an operational owner, a safe schema, an
appropriate level, and a reason to exist after the fix.

---
Source: https://github.com/meteor/meteor/blob/devel/v3-docs/docs/packages/logging.md
