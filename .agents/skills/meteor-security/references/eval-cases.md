# Evaluation cases for `meteor-security`

## Case 1: missing `check()`

Prompt: "Audit this method:

```javascript
Meteor.methods({ async addItem(p) { await Items.insertAsync(p); } });
```
"

Pass if the agent flags missing `check()`, missing `this.userId` guard,
and rewrites with `check(p, { title: String, qty: Match.Integer })` plus
a userId gate.

## Case 2: leaky publication

Prompt: "What's wrong with this publication?

```javascript
Meteor.publish('items', function () { return Items.find({}); });
```
"

Pass if the agent flags missing `this.userId` filter, missing `fields`
projection, and missing `limit` on an unbounded cursor.

## Case 3: Stripe CSP

Prompt: "Add a CSP that lets Stripe Checkout load."

Pass if the agent uses `browser-policy`, calls
`BrowserPolicy.content.allowScriptOrigin("https://js.stripe.com")`, and
adds `BrowserPolicy.content.allowFrameOrigin("https://js.stripe.com")`
and `"https://hooks.stripe.com"`. It may add
`allowConnectOrigin("https://api.stripe.com")` when the integration needs it.
Fail if it uses `allowOriginForAll`.

## Case 4: OAuth secret in plaintext

Prompt: "My Google application secret in
`ServiceConfiguration.configurations.secret` is plaintext, and I also want
supported per-user OAuth tokens encrypted at rest."

Pass if the agent adds `oauth-encryption`, generates a 16-byte (not 32)
base64 key, and configures
`Accounts.config({ oauthSecretKey: Meteor.settings.oauthSecretKey })`
at module top level (not inside `Meteor.startup`). It must distinguish the
provider application secret from provider-specific user fields and reject a
generic `services.<provider>.secret` path.

## Case 5: allow/deny in legacy code

Prompt: "I have `Items.allow({ insert: () => true });` in my code. Is
that ok?"

Pass if the agent rejects allow/deny as a legacy pattern and rewrites the
mutation as a `Meteor.method` with `check()` + `this.userId` guard.

## Case 6: async publication authorization

Prompt: "Audit this publication. It awaits an organization membership check
and then returns a filtered cursor from an async publish handler."

Pass if the agent validates the authorization selector and projection while
accepting the async handler. Fail if it requires the low-level publish API
only because the handler returns a Promise.

## Case 7: per-IP limiter is accidentally global

Prompt: "I limited the `login` method with `{ type: 'method', name: 'login' }`,
but one client's failures block every user. I wanted five attempts per IP."

Pass if the agent explains that only matcher fields form the bucket key and
adds `clientAddress: () => true`. It should test two addresses with independent
counters. Fail if it changes only the numeric limit.

## Case 8: database-backed rate decision

Prompt: "On Meteor 3.5, apply a stricter method limit to free-tier users. The
tier is in `Meteor.users`."

Pass if the agent uses a projected `findOneAsync` inside an async `userId`
matcher, warns that it delays message processing on the connection, and
defines behavior for a rejected matcher Promise.

## Case 9: audit argument checks

Prompt: "How can I detect methods and publications that forgot to validate
all DDP arguments?"

Pass if the agent adds `audit-argument-checks`, validates every argument with
`check`, and uses `check(args, [Match.Any])` only when arbitrary arguments are
intentional. Fail if it treats the package as a replacement for authorization.

## Case 10: user directory email leak

Prompt: "Publish usernames and profiles for our member directory. Should I
include every member's `emails` field too?"

Pass if the agent defaults to `{ username: 1, profile: 1 }`, filters and limits
the directory, and includes email only for a concrete authorized requirement.

## Case 11: database-backed limiter before Meteor 3.5

Prompt: "On Meteor 3.4, make a DDP rate-limit matcher await a user plan lookup."

Pass if the agent says async matchers begin in Meteor 3.5, rejects the awaited
matcher on 3.4, and offers a synchronous fixed rule, precomputed state, or a
framework upgrade. Fail if it applies the current 3.5 API unconditionally.
