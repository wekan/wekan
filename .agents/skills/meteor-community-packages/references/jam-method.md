# `jam:method`

Use `jam:method` for schema-backed methods, optimistic UI, hooks, pipelines,
and package-level rate limits. Read the [Meteor guide](https://docs.meteor.com/community-packages/jam-method)
for the maintained baseline and the [upstream repository](https://github.com/jamauro/method)
for the current release, complete API, and issues.

## Baseline

- Built for Meteor 3 and documented as compatible with Meteor 2.
- Supports `jam:easy-schema`, `check`, Zod, SimpleSchema, or a custom validator.
- Methods are authenticated by default. Set `open: true` only for an
  intentionally public method.
- Methods run optimistically by default. `serverOnly: true` disables client
  execution but does not guarantee that shared implementation code is absent
  from the client bundle.

```bash
meteor add jam:method
```

```javascript
import { createMethod } from "meteor/jam:method";

export const createTodo = createMethod({
  name: "todos.create",
  schema: { text: String },
  async run({ text }) {
    return Todos.insertAsync({ text, ownerId: this.userId });
  },
});
```

## Package-specific behavior

- `before` receives the original input. `after` receives the run result and a
  context containing the original input. `.pipe()` forwards each function's
  result to the next function.
- Arrow functions lose the method invocation `this`. Use method syntax or an
  ordinary function when the handler reads `this.userId` or other context.
- `rateLimit: { limit, interval }` configures a package method limit.
- Calls use `Meteor.applyAsync` with `returnStubValue: true` and
  `throwStubExceptions: true` by default.
- In Meteor 3+, a call can expose `stubPromise` and `serverPromise` when the UI
  must react separately to the optimistic and authoritative results.
- With `jam:offline`, method queuing and replay are integrated automatically.

## Required checks

- A method setup response **MUST** include a focused test plan. Cover an
  authenticated allowed call, logged-out and unauthorized rejection, invalid
  input, and the server or stub failure relevant to the method. When project
  files are unavailable, provide a concrete test outline rather than omitting
  the tests.
- Keep secret-bearing helpers under a `/server` path or load them dynamically.
  `serverOnly: true` alone controls execution, not source visibility.
- Add explicit resource authorization even though login is required by default.
- Decide whether the operation is safe for optimistic execution and replay.
- Test the handler with `.call(context, args)` and cover logged-out, invalid,
  unauthorized, stub failure, and server failure paths.
- Use `meteor-methods` and `meteor-security` for core method guarantees.

For a `serverOnly` secret-helper question, do not finish after explaining the
bundle boundary. Include a focused test outline using the package's documented
`.call(context, args)` form:

```javascript
await chargeCustomer.call({ userId: "allowed-user" }, { amount: 100 });
await assert.rejects(
  () => chargeCustomer.call({ userId: null }, { amount: 100 }),
  /auth/,
);
```

Add the resource-level unauthorized, invalid-input, and billing-service failure
cases for the actual method.

---
Source: https://github.com/meteor/meteor/blob/devel/v3-docs/docs/community-packages/jam-method.md
