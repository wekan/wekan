---
name: meteor-security
description: >
  Use when auditing or hardening a Meteor 3 application. Triggers on
  missing check() on method arguments, missing this.userId guards on
  publications, browser-policy CSP, DDPRateLimiter rules, oauth-encryption
  via Accounts.config oauthSecretKey, audit-argument-checks, allow/deny
  legacy patterns, BrowserPolicy.content.disallowInlineScripts,
  BrowserPolicy.framing.disallow. Use this skill when the user asks about
  hardening, asks about a security review, or asks about CSP for a
  third-party script (Stripe, Google Maps, fonts).
metadata:
  author: meteor
  kind: knowledge
  meteor: ">=3.0"
  area: security
  tagline: "Audit and harden Meteor 3 apps (`check()` coverage, `this.userId` guards, browser-policy CSP, rate limits, oauth-encryption)."
  bundle: ["essentials", "fullstack"]
  docs_synced_at: "2026-08-25"
license: MIT
---

# Meteor security

Meteor's security model is opinionated: the server holds authority, the
client cannot be trusted, and the only places that filter data before it
reaches users are methods (write paths) and publications (read paths).

## Decision flow

1. Audit every method: does it `check()` every argument and guard on
   `this.userId` or `Meteor.userId()` when authentication matters?
2. Audit every publication: does it filter by `this.userId` (when
   user-specific) and project columns with `fields`?
3. Add `audit-argument-checks` in dev to catch missing `check()`.
4. Add `browser-policy` and configure CSP.
5. Add `DDPRateLimiter` rules for sensitive methods (login, password
   reset, resource creation).
6. If the app uses OAuth, set `oauthSecretKey` to encrypt provider
   secrets at rest.
7. Remove `allow` / `deny` rules. They are legacy and easy to misuse;
   use methods instead.

## Method guard checklist

```javascript
import { Meteor } from "meteor/meteor";
import { check, Match } from "meteor/check";

Meteor.methods({
  async updateProfile(payload) {
    check(payload, { displayName: String, bio: Match.Optional(String) });
    if (!this.userId) {
      throw new Meteor.Error("not-authorized");
    }
    await Meteor.users.updateAsync(this.userId, { $set: { profile: payload } });
  },
  async updateAddress(payload) {
    check(payload, String);
    if (!Meteor.userId()) {
      throw new Meteor.Error("not-authorized");
    }
    await Meteor.users.updateAsync(Meteor.userId(), { $set: { address: payload } });
  },
});
```

Reject any method that does not match: `check` on every argument, userId
gate when needed, `Meteor.Error(code, reason)` for failures, `*Async`
Mongo on the server.

## Publication guard checklist

```javascript
Meteor.publish("items.mine", function () {
  if (!this.userId) return this.ready();
  return Items.find(
    { ownerId: this.userId },
    { fields: { title: 1, qty: 1 }, limit: 200 },
  );
});
```

Reject any publication that returns an unbounded cursor, omits the field
projection, or skips a userId filter on user-specific data.

## CSP via `browser-policy`

```bash
meteor add browser-policy
```

```javascript
// server top-level or inside Meteor.startup
import { BrowserPolicy } from "meteor/browser-policy-common";
import { Meteor } from "meteor/meteor";

Meteor.startup(async () => {
  await BrowserPolicy.content.disallowInlineScripts();
  BrowserPolicy.content.disallowEval();
  BrowserPolicy.framing.disallow();
});
```

`BrowserPolicy` is server-only. Configure it during module initialization or
startup so every request receives one deterministic process-wide policy. The
current implementation invalidates its cached CSP after a mutation, but do not
mutate this global policy per request or per user. See
`references/browser-policy-csp.md` for recipes (Stripe, Google Maps,
fonts, inline-style allowance).

## DDPRateLimiter for sensitive methods

```javascript
import { DDPRateLimiter } from "meteor/ddp-rate-limiter";

DDPRateLimiter.addRule(
  {
    type: "method",
    name: "login",
    clientAddress: () => true,
  },
  5,
  60000,                  // 5 attempts per 60s, per IP
);
```

Only matcher fields contribute to the rate-limit bucket key. Without
`clientAddress`, `connectionId`, or `userId`, every matching caller shares one
global bucket. Meteor 3.5+ permits async matcher functions for database-backed
decisions; keep their queries fast because the connection waits for them. On
Meteor 3.0 through 3.4, matchers must stay synchronous. Use a fixed rule,
precomputed synchronous state, or upgrade rather than awaiting Mongo there.

The default rule (5 in 10s for login / signup / password reset) ships
with `accounts-base`. Remove with `Accounts.removeDefaultRateLimit()`
only if you replace it.

## OAuth secret encryption

Add `oauth-encryption` and pass a 16-byte base64 key (NOT 32 bytes) to
`Accounts.config` at module top level (not inside `Meteor.startup`):

```bash
meteor node -e "console.log(require('crypto').randomBytes(16).toString('base64'))"
```

```javascript
import { Accounts } from "meteor/accounts-base";

Accounts.config({
  oauthSecretKey: Meteor.settings.oauthSecretKey,
});
```

At startup, `accounts-oauth` seals an unsealed provider application secret at
`ServiceConfiguration.configurations.secret`. Provider packages also seal
supported per-user token fields, such as `services.github.accessToken` or
Twitter's `accessTokenSecret`. There is no generic
`Meteor.users.services.<provider>.secret` field. Inspect the provider schema
before asserting which user credential is encrypted.

## `audit-argument-checks`

```bash
meteor add audit-argument-checks
```

Throws if any method or publication runs without `check()` covering
every argument. Methods that legitimately accept arbitrary input declare
this explicitly:

```javascript
Meteor.methods({
  rawLog(...args) {
    check(args, [Match.Any]);
    // ...
  },
});
```

## Anti-patterns

- `Collection.allow` / `Collection.deny` rules. Legacy; easy to combine
  into a soft-fail. Replace with methods.
- `Meteor.settings.public.<secret>`. The client sees `public`. Move
  secrets to the top level of `settings.json`.
- Publish the entire `Meteor.users` collection. Always project (e.g.
  `fields: { username: 1, profile: 1 }`) and filter. Publish email only to
  the owning user or another explicitly authorized audience.
- Use `BrowserPolicy.content.allowOriginForAll` for a third-party script. It
  grants the origin to every current content directive. Allow only the script,
  frame, connect, image, style, or font directives the integration needs.
- Methods that accept callback-shaped arguments. Functions cannot travel
  over DDP.
- Call `Accounts.config({ oauthSecretKey })` inside `Meteor.startup`.
  Must be at module top level so it loads before the OAuth packages
  read it.

## See also

- `references/method-and-publish-guards.md`
- `references/browser-policy-csp.md`
- `references/eval-cases.md`
- Related skills: `meteor-methods`, `meteor-pubsub`, `meteor-accounts`.
