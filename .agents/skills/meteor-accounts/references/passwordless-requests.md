# Passwordless request boundaries

Meteor 3.6-beta.1 pairs `accounts-passwordless@3.1.2-beta360.1` with
`accounts-base@3.4.0-beta360.1`. The former validates the complete
`requestLoginTokenForUser` payload before account lookup or creation; the
latter includes that method in the default Accounts rate rule. Check both
resolved versions in `.meteor/versions` before relying on these protections.
Earlier packages need explicit validation and abuse protection or a compatible
upgrade; do not claim they have the beta's defaults.

## Custom caller contract

| Field | Requirement |
|---|---|
| Top-level payload | Only documented `selector`, `userData`, `options`; no extra top-level fields. |
| `selector` | Exactly one nonempty `id`, `username` or `email` string. No Mongo operators or combined selectors. |
| `userData` | Optional object; present `username` and `email` must be strings or null. Additional user data can be included. |
| `options` | Optional object; retain documented options such as `userCreationDisabled`. Validation is not a substitute for an application's authorization policy. |

Use the public `Accounts.requestLoginTokenForUser` client wrapper where
possible. For sign-in-only flows retain `options.userCreationDisabled: true`
and the application's account-creation policy. Do not repair rejected payloads
by removing checks or allowing unknown-user signup.

Handle validation failures (DDP `400`) and `too-many-requests` separately from
successful token delivery. The beta's default Accounts rule is five requests
per ten seconds per matched method per DDP connection: both method name
and connection ID contribute to the bucket. The methods share a rule, not
one combined counter. It is not a per-user or per-IP mail quota. Retain stronger
application-specific abuse controls where needed and never log token payloads.
Use the limiter's returned reset timing for backoff. Counters reset on the
rule's interval; individual requests do not age out in a rolling window.

The cookie endpoint's 30-per-ten-second address limit is independent. Calling
`Accounts.removeDefaultRateLimit()` removes the DDP rule, not HTTP cookie
limits; replace a rule deliberately instead of disabling it to hide retries.

---
Source: https://github.com/meteor/meteor/blob/devel/v3-docs/docs/api/accounts.md
Source: https://github.com/meteor/meteor/blob/devel/v3-docs/docs/generators/changelog/versions/3.6.0.md
