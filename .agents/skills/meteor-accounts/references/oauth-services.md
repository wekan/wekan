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
