# Passwordless request boundaries

Check both packages in `.meteor/versions`. All pairs below validate
`requestLoginTokenForUser` before account lookup/creation and include it in
the default Accounts rate rule; atomic completion is a separate capability.

| Meteor | `accounts-passwordless` | `accounts-base` | Atomic completion |
|---|---|---|---|
| 3.4.4 | 3.1.0_2 | 3.2.2 | No |
| 3.5.5 | 3.1.1_2 | 3.3.2 | No |
| 3.6 (feature floor) | 3.1.2 | 3.4.0 | Yes |
| 3.6.1 (current 3.6 target) | 3.1.2 | 3.4.1 | Yes |

Preserve an explicitly constrained release. Earlier packages need explicit
validation and abuse protection or a compatible upgrade.

The public client wrapper accepts a documented
string selector convenience and normalizes it; the schema below describes
the direct DDP payload. Preserve supported `options.extra` data used by
token URLs/email templates; options are not a boolean-only whitelist.
Validate application-specific `extra` fields at their consumer before using
them in links or templates; the core request schema does not enforce the app's
custom data contract.

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
successful token delivery. The pairings above use a default Accounts rule of five requests
per ten seconds per matched method per DDP connection: both method name
and connection ID contribute to the bucket. The methods share a rule, not
one combined counter. It is not a per-user or per-IP mail quota. Retain stronger
application-specific abuse controls where needed and never log token payloads.
Use the limiter's returned reset timing for backoff. Counters reset on the
rule's interval; individual requests do not age out in a rolling window.

The cookie endpoint's 30-per-ten-second address limit is independent. Calling
`Accounts.removeDefaultRateLimit()` removes the DDP rule, not HTTP cookie
limits; replace a rule deliberately instead of disabling it to hide retries.

## Callback errors and sign-in completion

`Accounts.requestLoginTokenForUser` is a callback API. Wrap it explicitly
when a caller needs a Promise:

```javascript
function requestToken(email) {
  return new Promise((resolve, reject) => {
    Accounts.requestLoginTokenForUser({
      selector: { email },
      userData: {},
      options: { userCreationDisabled: true },
    }, (error) => error ? reject(error) : resolve());
  });
}

try {
  await requestToken(email);
} catch (error) {
  if (error.error === "too-many-requests") {
    // Show a cooldown instead of immediately resubmitting.
  } else {
    // Report validation or delivery failure without logging credentials.
  }
}
```

After a successful request, use `Meteor.passwordlessLoginWithToken` with
the matching selector and received token. Configure the sender/template
before testing delivery. Earlier packages retain their callback flow and
verified explicit abuse controls.

## One-time completion and 2FA

With `accounts-passwordless@3.1.2` (Meteor 3.6), both email codes and the
user-level token passed to `Accounts.onCreateLoginToken` are consumed by a
conditional atomic write. Concurrent submissions cannot both succeed. A used
or replaced token requires a new request; do not restore its database fields
or turn an expired-token error into a successful login.

| Outcome | Client behavior and email state |
|---|---|
| `no-2fa-code` / `invalid-2fa-code` for an account with 2FA | Prompt for a valid code and retry with the same login token. These failures do not consume it. This applies to user-level tokens too. |
| Successful email-code login | Consumes the token and verifies that email address. |
| Successful user-level token login | Consumes the token without marking any email verified. Delivery through a custom hook is not proof of email ownership. |
| Concurrent attempt loses the conditional write | Treat as expired/used; only the winning login succeeds. |

```javascript
Meteor.passwordlessLoginWithTokenAnd2faCode(
  { email }, token, code,
  (error) => { if (error) showLoginError(error.error); },
);
```

Use the selector matching the issued token (`{ id: userId }` for a user-level
flow). Keep tokens out of logs. Earlier packages, including the 3.5.3
`accounts-passwordless@3.1.1`, lack this complete atomic-consumption contract;
check resolved versions and a compatible fix before relying on it. Client
button disabling helps UX but cannot enforce one-time use across connections.

---
Source: https://github.com/meteor/meteor/blob/devel/v3-docs/docs/api/accounts.md
Source: https://github.com/meteor/meteor/blob/devel/v3-docs/docs/generators/changelog/versions/3.6.0.md
Source: https://github.com/meteor/meteor/blob/devel/v3-docs/docs/packages/accounts-passwordless.md
