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
