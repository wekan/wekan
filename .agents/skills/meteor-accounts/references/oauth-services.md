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

## Production service configuration

Meteor 3.4.4 (`accounts-base@3.2.2`), 3.5.5 (`3.3.2`) and 3.6.1
(`3.4.1`) restrict client calls to `configureLoginService` to development
by default. The `accounts-ui` setup dialog can therefore fail in production
even though normal provider login remains supported.

Configure provider credentials in server code or private `Meteor.settings`.
The server-only `Accounts.config({ allowClientServiceConfiguration: true })`
opt-in restores client configuration, including an unauthenticated visitor's
ability to claim the first configuration. Do not enable it as the routine
production repair; it is not an administrator authorization check. Setting
it to `false` also disables the development dialog. Server-originated calls
remain allowed.

Earlier package pairings lack this protection and reject the unknown
`allowClientServiceConfiguration` option in `Accounts.config`.
Prepare server-owned configuration and a compatible upgrade rather than
assuming an unconfigured production service is protected.

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

Meteor 3.6 includes these fixes. Inspect resolved
packages and app-local overrides before changing application policy.

| Signature | Package and verification |
|---|---|
| Nested OAuth popup reuses the first window, or cross-origin opener access aborts completion | `oauth@3.0.5` uses unique window names and catches opener access failure so the existing localStorage fallback/close path can run. Verify the full login on the intended origins. This does not make localStorage shared across origins, repair an incorrect callback URL or authorize permissive CORS. |
| Login-failure hook receives a Promise as `attempt.user` | `accounts-base@3.4.0` awaits the user lookup before hooks. Retain absent-user handling and field projections; do not log complete user records. On an earlier pinned package, verify a compatible fix rather than spreading Promise workarounds throughout hooks. |
| Allowed external-service email is rejected depending on service order | 3.6 Accounts keeps a successful service-email match. A nonempty `user.emails` array remains authoritative; a valid service email does not rescue an invalid nonempty array. Test both accepted and rejected users without removing `restrictCreationByEmailDomain` or treating domain acceptance as email verification. |

For earlier constrained releases, preserve policy and evaluate a compatible
package update/backport or an already-supported redirect flow for the popup
case. Do not force a release upgrade or remove origin restrictions to hide it.

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

## Native Google and Facebook tokens

Inspect `.meteor/versions`: Meteor 3.6 ships `google-oauth@1.5.1` and
`facebook-oauth@1.12.1`. The native token checks are also present in Meteor
3.5.3's `google-oauth@1.5.0` and `facebook-oauth@1.12.0`; do not label them
exclusive to 3.6. Earlier packages need a verified compatible fix.

| Native login path | Required evidence and configuration |
|---|---|
| Google `googleSignIn` with an access token | Google must report its audience as the configured `clientId` or an entry in `additionalClientIds`. Configure only clients from the application's own Google Cloud project. |
| Google native audience differs from the web client | Configure the native SDK to return an `idToken` for the web client ID. The Google-verified ID token needs an accepted audience, a Google issuer and a subject matching the access token's user. Alternatively, explicitly allow the app's own native client IDs. |
| Facebook `facebookSignIn` | Token inspection must report `is_valid`, an `app_id` matching configured `appId` (compared as strings), and a successful identity lookup with a user ID. A valid token for another app is rejected. |

For Google, extend the server-only service configuration when needed:

```javascript
await ServiceConfiguration.configurations.updateAsync(
  { service: "google" },
  { $set: {
    additionalClientIds: [process.env.GOOGLE_IOS_CLIENT_ID,
                          process.env.GOOGLE_ANDROID_CLIENT_ID],
  } },
);
```

Include only configured, verified client IDs. Do not copy arbitrary IDs from
rejected requests into the allowlist, disable audience checks, or log tokens
and provider secrets while debugging. Network/verification errors fail closed.
Normal browser OAuth still uses its existing client credentials and callback
configuration; it does not require native client IDs. Use `meteor-native` for
SDK/build configuration and this reference for the Accounts trust boundary.

---
Source: https://github.com/meteor/meteor/blob/devel/v3-docs/docs/packages/service-configuration.md
Source: https://github.com/meteor/meteor/blob/devel/v3-docs/docs/generators/changelog/versions/3.6.0.md
Source: https://github.com/meteor/meteor/blob/devel/v3-docs/docs/packages/accounts-google.md
Source: https://github.com/meteor/meteor/blob/devel/v3-docs/docs/packages/accounts-facebook.md
