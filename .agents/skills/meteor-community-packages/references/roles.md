# Core `roles`

Use the core `roles` package for role, permission, hierarchy, and scope checks
on Meteor 3.1+. Read the [Meteor package guide](https://docs.meteor.com/packages/roles)
for the current API, the [core source](https://github.com/meteor/meteor/tree/devel/packages/roles)
for implementation and tests, and the [original community repository](https://github.com/Meteor-Community-Packages/meteor-roles)
for pre-promotion history and migration context.

## Baseline

- Core package since Meteor 3.1.0, previously `alanning:roles`.
- Server-side mutation and lookup APIs are async. Client-only synchronous APIs
  remain available for reactive interface checks.
- Roles can form hierarchies and can be global or isolated by scope.
- Client checks control presentation only. Methods and publications must repeat
  authorization on the server.

```bash
meteor add roles
```

```javascript
import { Roles } from "meteor/roles";

await Roles.createRoleAsync("posts.edit", { unlessExists: true });
await Roles.addUsersToRolesAsync(userId, "posts.edit", "team-a");

const allowed = await Roles.userIsInRoleAsync(
  userId,
  "posts.edit",
  "team-a",
);
```

Publish only assignments needed by the current user or authorized scope. The
assignment collection is `Meteor.roleAssignment`.

## Migration from `alanning:roles`

1. Upgrade `alanning:roles` to version 3.6 and complete its pending migrations.
2. Convert server-side role operations to their async APIs.
3. Back up role and assignment data before changing packages.
4. Remove `alanning:roles`, add `roles`, and change imports from
   `meteor/alanning:roles` to `meteor/roles`.
5. Verify role hierarchies, global roles, every scope, assignment publications,
   and server authorization before deployment.

On Meteor 3.0.x, the core package is unavailable. Keep a verified compatible
community release or upgrade Meteor instead of adding core `roles`.

## Required checks

- Prefer granular permissions when broad roles cannot express exceptions
  safely.
- Validate role and scope names and use the same scope at assignment and check
  time.
- Test inherited, global, scoped, missing, removed, and cross-tenant roles.
- Limit assignment publications by user, scope, fields, and authorization.
- Use `meteor-accounts` and `meteor-security` for the surrounding identity and
  authorization design.

---
Source: https://github.com/meteor/meteor/blob/devel/v3-docs/docs/packages/roles.md
