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
  docs_synced_at: "2026-11-13"
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
7. Replace permissive client-write rules with authenticated methods. Keep
   protective `deny` rules until an equivalent method-only policy is active;
   Accounts can add an owner-only `profile` allowance even without an app
   `allow` rule. See the profile policy below.

## Framework security patches

Check package versions. For 3.4.4/3.5.5/3.6.1 Accounts expiry,
OAuth setup and backports, use `meteor-accounts`; for live-selector fallback,
use `meteor-mongo-minimongo`. Security backports do not include every 3.6 feature.

## Accounts collection and profile policy

In Meteor 3.6's fixed Accounts pairing, custom users collections receive account
indexes and, when client mutation methods exist, the default owner-only profile
allowance. Configure the collection on both runtimes before installing guards.
Keep `Meteor.users.deny({ update: () => true })` on the selected collection when
all client profile writes must be blocked, until an equivalent policy is proven.
`defineMutationMethods: false` supplies a method-only collection without those
validators; Meteor 3.6 still creates account indexes. Earlier packages require
checking their setup behavior. See `meteor-accounts` for collection identity,
secondary Accounts instances and package boundaries. Never trust roles stored
in a client-editable profile.

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

The default rule (5 in 10s per matched method per DDP connection for login / signup / password
reset) ships with `accounts-base`. Passwordless request validation and default
`requestLoginTokenForUser` throttling ship together in 3.6 and backports
3.5.5/3.4.4. Inspect both resolved packages; use `meteor-accounts` for pairings
and atomic-completion differences. Earlier packages need explicit validation
and abuse protection. Handle callback rate errors without immediate retries. Remove the
default rule with `Accounts.removeDefaultRateLimit()` only if you replace it.

For cookie hardening on `accounts-base@3.4.0` (3.6) or the `3.3.2`
backport (3.5.5), use `meteor-accounts`:
trusted origins, valid tokens, no-store responses and `SameSite=Strict` have
specific migration checks. Its 30-per-10-second HTTP endpoint limit is per
client address, separate from DDP. HttpOnly storage does not stop active
same-origin XSS from obtaining the resume token used for DDP authentication.

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

- Permissive client-write rules for sensitive data. Replace with guarded
  methods; do not remove protective denial before proving equivalent policy.
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
