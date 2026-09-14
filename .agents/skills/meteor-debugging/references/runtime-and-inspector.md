# Runtime and inspector

Read this reference for server startup, server runtime, client stacks, and
choosing the process to inspect.

## Process map

| Process | Evidence and tool |
|---|---|
| Meteor tool and bundler | Build output, `--verbose`, profiles, and build-specific logging. The server inspector does not attach here. |
| Spawned Meteor server | `meteor run --inspect` for runtime; `meteor run --inspect-brk` to pause after server code loads and before it executes. Default inspector port is 9229. |
| Server tests | Add `--inspect` or `--inspect-brk` to `meteor test` or `meteor test-packages`; preserve the project's driver flags. |
| Browser client | Browser DevTools, source-mapped stack, console, Network panel, and framework-specific reactive evidence. |

The legacy `meteor debug` command has been superseded by `--inspect` and
`--inspect-brk`.

```bash
meteor run --inspect
meteor run --inspect-brk
meteor run --inspect=9230
meteor test --driver-package meteortesting:mocha --inspect
```

Use a distinct port when another inspector is active. Do not bind or forward a
Node inspector to an untrusted network. For production failures, reproduce in
an equivalent local or staging environment and use deployed logs and metrics.

## Startup versus runtime

Use `--inspect-brk` when the failure happens during imports, startup hooks,
method or publication registration, or the first server statements. Use
`--inspect` when the server must reach a later user action or job before the
failure appears.

At a breakpoint, capture only state needed for the hypothesis. Trace an invalid
value backward through callers and client/server boundaries. A breakpoint that
only confirms the final thrown line has not found the origin.

## Client versus server

Do not infer one side from the other:

1. Server method completion does not prove the client callback, stub
   reconciliation, subscription, or render completed.
2. A client exception does not prove the publication or method failed.
3. Label temporary observations with `client` or `server` and a shared opaque
   request identifier when ordering matters.
4. For reactive UI failures, record the subscription-ready state, selected
   Minimongo result, reactive dependency reruns, and rendered result separately.

Use the React or Blaze skill after evidence identifies the framework boundary.

## Shell and debug bundles

`meteor shell` attaches a server REPL to a running local app. Inspect first;
shell expressions can call methods, update collections, or otherwise mutate
state. Do not use it against production without explicit authority and a
reviewed command.

`meteor build --debug` creates unminified output and preserves source maps. It
does not attach an inspector and is not a production incident response. Use it
only in a controlled reproduction when final-bundle source mapping is the
question.

---
Source: https://github.com/meteor/meteor/blob/devel/v3-docs/docs/cli/index.md
