# `meteor-rpc`

Use `meteor-rpc` for end-to-end typed methods and publications in React apps.
Read the [Meteor guide](https://docs.meteor.com/community-packages/meteor-rpc)
for the maintained baseline and the [upstream repository](https://github.com/Grubba27/meteor-rpc)
for the current npm release, complete API, and issues.

## Baseline

- npm package for Meteor 2.8+.
- Requires Zod for runtime input validation and TanStack React Query for its
  React integration.
- A root `createModule()` has no namespace. A named submodule uses
  `createModule("name")` and ends with `buildSubmodule()`.
- Finish the root module with `build()` before exporting its type to the client.
- `addMethod` and `addPublication` wrap Meteor methods and publications. Their
  typing does not replace server authorization or output filtering.

```bash
meteor npm install meteor-rpc @tanstack/react-query zod
```

```typescript
import { createModule } from "meteor-rpc";
import { z } from "zod";

export const server = createModule()
  .addMethod("echo", z.string(), (value) => value)
  .build();

export type Server = typeof server;
```

```typescript
import { createClient } from "meteor-rpc";
import type { Server } from "/imports/api/server";

const api = createClient<Server>();
const value = await api.echo("hello");
```

## Required checks

- Confirm the installed `meteor-rpc`, Zod, React, and TanStack React Query
  versions in the lockfile before using an upstream example.
- Configure the React Query provider before using package hooks.
- Use a specific Zod schema, including `z.void()` for no arguments. Do not use
  `z.any()` only to bypass a missing contract.
- Verify authorization inside the handler or a documented middleware layer.
- Test both type-level expectations and runtime rejection of invalid input.
- Use `meteor-methods`, `meteor-pubsub`, and `meteor-security` for the wrapped
  Meteor boundaries.

---
Source: https://github.com/meteor/meteor/blob/devel/v3-docs/docs/community-packages/meteor-rpc.md
