# OAuth services

Each provider ships its own `accounts-<service>` package and a
`Meteor.loginWith<Service>()` client API. Configure credentials via
`ServiceConfiguration.configurations.upsertAsync` on the server.

## Provider packages

| Provider | Atmosphere package | Client API                |
|----------|--------------------|---------------------------|
| Google   | `accounts-google`  | `Meteor.loginWithGoogle`  |
| GitHub   | `accounts-github`  | `Meteor.loginWithGithub`  |
| Facebook | `accounts-facebook`| `Meteor.loginWithFacebook`|
| Twitter  | `accounts-twitter` | `Meteor.loginWithTwitter` |
| Apple    | `accounts-apple`   | `Meteor.loginWithApple`   |
| Meetup   | `accounts-meetup`  | `Meteor.loginWithMeetup`  |
| Weibo    | `accounts-weibo`   | `Meteor.loginWithWeibo`   |

Add `service-configuration` once for all providers.

## Configuration

```javascript
import { ServiceConfiguration } from "meteor/service-configuration";

await ServiceConfiguration.configurations.upsertAsync(
  { service: "google" },
  {
    $set: {
      clientId: process.env.GOOGLE_CLIENT_ID,
      secret: process.env.GOOGLE_CLIENT_SECRET,
      loginStyle: "popup",
    },
  },
);
```

Same pattern for every provider; only the `service` key and the
provider-specific credential fields change.

`loginStyle`:

- `"popup"`: the user stays on the page; preferred for desktop.
- `"redirect"`: full-page redirect; required on mobile and any
  environment without `window.close` / `window.opener`.

## Client login

```javascript
Meteor.loginWithGoogle(
  { requestPermissions: ["email", "profile"] },
  (err) => {
    if (err) console.error(err);
  },
);
```

`requestPermissions` is the OAuth scopes array. Optional per provider.

## Meteor 3.6 login diagnostics

These fixes are verified on beta.3; beta.1 lacks them. Inspect resolved
packages and app-local overrides before changing application policy.

| Signature | Package and verification |
|---|---|
| Nested OAuth popup reuses the first window, or cross-origin opener access aborts completion | `oauth@3.0.5-beta360.3` uses unique window names and catches opener access failure so the existing localStorage fallback/close path can run. Verify the full login on the intended origins. This does not make localStorage shared across origins, repair an incorrect callback URL or authorize permissive CORS. |
| Login-failure hook receives a Promise as `attempt.user` | `accounts-base@3.4.0-beta360.3` awaits the user lookup before hooks. Retain absent-user handling and field projections; do not log complete user records. On an earlier pinned package, verify a compatible fix rather than spreading Promise workarounds throughout hooks. |
| Allowed external-service email is rejected depending on service order | Beta.3 Accounts keeps a successful service-email match. A nonempty `user.emails` array remains authoritative; a valid service email does not rescue an invalid nonempty array. Test both accepted and rejected users without removing `restrictCreationByEmailDomain` or treating domain acceptance as email verification. |

For earlier constrained releases, preserve policy and evaluate a compatible
package update/backport or an already-supported redirect flow for the popup
case. Do not force a beta upgrade or remove origin restrictions to hide it.

## Encryption at rest

Add `oauth-encryption` and pass a 16-byte base64 key:

```bash
# Generate
meteor node -e "console.log(require('crypto').randomBytes(16).toString('base64'))"
```

```javascript
// server, at module top level (not inside Meteor.startup)
Accounts.config({
  oauthSecretKey: Meteor.settings.oauthSecretKey,
});
```

At startup, `accounts-oauth` seals the provider application secret in
`ServiceConfiguration.configurations.secret`. Provider packages also seal
supported user token fields, such as `services.github.accessToken` or Twitter's
`accessTokenSecret`. There is no generic `services.<provider>.secret` field in
`Meteor.users`; inspect the provider schema before checking ciphertext.

---
Source: https://github.com/meteor/meteor/blob/devel/v3-docs/docs/packages/service-configuration.md
Source: https://github.com/meteor/meteor/blob/devel/v3-docs/docs/generators/changelog/versions/3.6.0.md
