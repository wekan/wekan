---
name: meteor-debugging
description: >
  Use when diagnosing an unexplained failure in a Meteor 3 application before
  the failing layer or fix is known. Triggers on server crashes, client-only
  errors, stuck subscriptions, DDP or WebSocket disconnects, Minimongo/server
  data mismatches, hanging or flaky tests, slow builds, --inspect, console.log,
  .only, Playwright traces, or requests to debug a Meteor app. Use this skill
  when evidence must distinguish Meteor tool, server, client, data, test,
  browser, mobile, or production boundaries. For test setup and authoring use
  meteor-testing; after confirming a domain cause, hand the repair to the
  owning skill.
metadata:
  author: meteor
  kind: workflow
  meteor: ">=3.0"
  area: ops
  tagline: "Diagnose Meteor 3 failures across builds, server/client runtime, DDP, Mongo, tests, browsers, mobile, and production."
  bundle: ["essentials", "fullstack", "ops"]
  docs_synced_at: "2026-09-11"
license: MIT
---

# Debug Meteor applications

Find the first failing boundary before changing behavior. Produce a stable
reproduction, evidence for one cause, and a verification target. Then use the
skill that owns the repair.

## Diagnosis loop

1. Record the exact symptom, complete error and stack, command or user action,
   Meteor release, resolved Atmosphere and npm versions, environment, and last
   known working state.
2. Reproduce with the narrowest stable command or action before editing.
3. Classify the first uncertain boundary with the table below.
4. Read existing evidence before adding instrumentation. Compare client and
   server output, recent changes, and passing versus failing environments.
5. Add one targeted observation only when current evidence cannot answer the
   question. Do not combine a diagnostic change with a speculative fix.
6. State one falsifiable hypothesis and the observation that would reject it.
7. Change one variable, reproduce, and trace a bad value or event backward to
   its origin.
8. Fix the confirmed cause through the owning skill. Add a regression at the
   lowest reliable layer when the failure can recur.
9. Re-run the focused reproduction, then the affected suite or
   production-like check. Remove temporary diagnostics and artifacts.

If several evidence-backed hypotheses fail, revisit the boundary map and
assumptions before stacking mitigations or widening the change.

## Select the boundary

| Symptom | First evidence | Read |
|---|---|---|
| Build stalls, compilation error, rebuild regression, Rspack or SWC failure | Full build output, `--verbose`, exact release and build-package versions | [Build debugging](references/build-debugging.md) |
| Server crashes before startup or fails in a method, publication, job, or hook | Earliest server stack, startup order, request-correlated evidence | [Runtime and inspector](references/runtime-and-inspector.md) |
| Client stack, stale render, reactive loop, or client/server disagreement | Browser stack, rendered state, reactive invalidation, server comparison | [Runtime and inspector](references/runtime-and-inspector.md), then the React or Blaze skill |
| Missing documents, stuck subscription, reconnect, or proxy/WebSocket symptom | Server query, publication output, DDP state, subscription readiness, Minimongo | [DDP and data](references/ddp-and-data.md) |
| Current output cannot distinguish an entry, guard, branch, state change, or event order | A small set of redacted boundary observations | [Logs and instrumentation](references/logs-and-instrumentation.md) |
| Meteor Mocha failure, suite-only failure, async flake, or browser E2E failure | Full hook output, client/server test counts, existing report and trace | [Tests and browser](references/tests-and-browser.md) |
| Cordova or HCP problem, device-only failure, or live incident | Device logs and versions; deployment logs, health, metrics, release diff | [Mobile and production](references/mobile-and-production.md) |

A syntax error needs its stack, not browser tracing. A browser-only hydration
race needs client evidence, not a server inspector. Use the smallest tool that
can reject the current hypothesis.

## Evidence rules

- Label runtime side and operation in temporary logs. Include a request or
  event identifier only when concurrent flows can interleave.
- Record selected, redacted fields. Never log credentials, tokens, cookies,
  authorization headers, private settings, unrestricted method arguments, or
  full user documents.
- Treat `console.log` as temporary instrumentation. Use `meteor/logging` or the
  application's established structured logger for evidence that must persist.
- Use `.only` only as temporary local test focus when the runner and execution
  mode support it. Remove it and run the broader suite before handoff.
- Prefer observable readiness over sleeps: subscription ready, settled method,
  expected document, visible UI, or a specific browser event.
- Inspect existing Playwright reports and traces before starting an interactive
  browser. For a `playwright-cli` request, first check whether the executable
  is available. If it is unavailable, obtain authority before installation or
  browser downloads. Explicitly report that availability result and request
  the authority rather than only asking for the application URL. Use it only
  for a real browser boundary.
- For an authorized ad hoc `playwright-cli` reproduction: **MUST** run
  `snapshot`, `console`, and `requests`, start tracing before the failing
  action, stop tracing immediately after it, and close the browser session.
  Do not substitute source inspection for this browser evidence or omit the
  trace because the console or network already suggests a cause.
- Use only an application path or URL the user placed in scope. If the current
  workspace has no app and the prompt gives no URL, ask for one. Do not scan
  unrelated directories, processes, or ports to discover an application.
- Read through `meteor shell` and `meteor mongo` before mutating. Never use
  `meteor reset --db` as a diagnostic shortcut.
- On production, do not expose an inspector, deploy a debug build, retain
  secret-bearing traces, or experiment on live data.

## Handoffs

| Confirmed cause | Continue with |
|---|---|
| Test setup, design, driver, fixture, or new regression structure | `meteor-testing` |
| SWC, Rspack, watcher, cache, build graph, or generated handoff | `meteor-modern-build-stack` or `migrate-to-rspack` |
| Confirmed Cordova platform, native plugin/configuration, device networking, signing, or native HCP compatibility | `meteor-native` |
| Method, publication, Mongo/Minimongo, React, Blaze, accounts, or security | Matching domain skill |
| Galaxy, container, proxy, environment, health check, or rollout | `meteor-deployment` |
| Documented community package behavior | `meteor-community-packages`, then the upstream repository |
| Pure Node.js, browser, database, or runner failure with no Meteor boundary | General debugging guidance |

## Cleanup

Before handoff:

1. Remove only the logs, `debugger` statements, `.only` markers, pauses,
   temporary routes, and debug settings added for this investigation.
2. Delete or protect screenshots, traces, profiles, saved browser state, and
   dumps according to their data sensitivity.
3. Re-run the original reproduction and the affected suite.
4. Report the confirmed cause, evidence, fix, verification, and any remaining
   uncertainty.

## Anti-patterns

- Edit the assertion before checking setup, async completion, and skipped
  client coverage.
- Add logs across the application without a hypothesis.
- Serialize every runtime object indiscriminately. Circular values, reactive
  wrappers, getters, binary data, and large documents need selected snapshots.
- Treat a focused passing test as success when the suite still fails.
- Add arbitrary sleeps, broad selectors, retries, or heap increases until the
  symptom disappears.
- Install browser tooling or scaffold tests for a server, build, or database
  failure.

## References

- [Runtime and inspector](references/runtime-and-inspector.md)
- [Logs and instrumentation](references/logs-and-instrumentation.md)
- [Tests and browser](references/tests-and-browser.md)
- [Build debugging](references/build-debugging.md)
- [DDP and data](references/ddp-and-data.md)
- [Mobile and production](references/mobile-and-production.md)
- [Evaluation cases](references/eval-cases.md)
