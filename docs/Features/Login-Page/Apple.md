# Sign in with Apple using OAuth2/OIDC

## What it is

Sign in with Apple lets people log in with their Apple Account. Apple speaks
standard OpenID Connect, so WeKan configures it as a generic OAuth2/OIDC
provider like Keycloak or Authelia (see [OAuth2.md](./OAuth2.md)). Apple
differs from the other providers in two ways: its client secret is a short
JWT that the WeKan server signs itself, and it sends the user's name only on
the very first authorization.

## Read more

- [Sign in with Apple on Wikipedia](https://en.wikipedia.org/wiki/Sign_in_with_Apple)
- [Apple: Configuring your environment for Sign in with Apple](https://developer.apple.com/documentation/signinwithapple/configuring-your-environment-for-sign-in-with-apple)
- [Apple: Creating a client secret](https://developer.apple.com/documentation/accountorganizationaldatasharing/creating-a-client-secret)
- [Apple: Authenticating users with Sign in with Apple](https://developer.apple.com/documentation/sign_in_with_apple/authenticating-users-with-sign-in-with-apple)
- [JSON Web Token on Wikipedia](https://en.wikipedia.org/wiki/JSON_Web_Token)
- Original issue: [#2458](https://github.com/wekan/wekan/issues/2458)
- WeKan: [OAuth2](OAuth2.md), [ADFS](ADFS.md) (the token-claims setting Apple reuses)

The two Apple links this page had before,
`.../sign_in_with_apple/configure_your_environment` and
`.../sign_in_with_apple/generate_and_validate_tokens`, answer 404 now; the
first two Apple links above are their current pages.

## How to use it

1. In the [Apple Developer portal](https://developer.apple.com/account/resources/authkeys/list),
   create a Services ID (it is the OAuth2 `client_id`), add
   `https://<your WeKan ROOT_URL>/_oauth/oidc` as its return URL, and create a
   "Sign in with Apple" key. Download the key's `.p8` file once and note its
   Key ID and your Team ID.
2. Put the `.p8` file where the WeKan server can read it.
3. Set the settings below. They can also be overridden in
   **Admin Panel / People / OAuth2** (`/admin/people/oidc`).
4. Open WeKan at its `ROOT_URL` and click the OIDC button on the sign-in page.

Apple's fixed, non-discoverable endpoints are:
- `authorization_endpoint`: `https://appleid.apple.com/auth/authorize`
- `token_endpoint`: `https://appleid.apple.com/auth/token`

Apple has no public `userinfo_endpoint`; the user's identity is carried in the
`id_token` (a signed JWT) that the token endpoint returns.
`OAUTH2_USERINFO_ENDPOINT` is left unset: Apple has no userinfo endpoint, and
its `access_token` is opaque. WeKan sees the Apple address in
`OAUTH2_SERVER_URL` and reads the claims (`sub`, `email`, `email_verified`,
...) from the `id_token` the token endpoint returns
([models/lib/oidcProviderMode.js](../../../models/lib/oidcProviderMode.js)).
The ID token comes straight from Apple's token endpoint over TLS, which
OpenID Connect Core 3.1.3.7 accepts in place of checking its signature. Any
other provider that keeps its claims in the ID token can ask for the same with
`OAUTH2_CLAIMS_IN_ID_TOKEN=true`. A setup made from the earlier version of this
page, with `OAUTH2_ADFS_ENABLED=true`, keeps working.

**Docker**

[docker-compose.yml](../../../docker-compose.yml)

```
      - OAUTH2_ENABLED=true
      - OAUTH2_CLIENT_ID=<your Services ID>
      - OAUTH2_SECRET_JWT_KEY_PATH=/path/to/AuthKey_XXXXXXXXXX.p8
      - OAUTH2_SECRET_JWT_ISSUER=<your Apple Team ID>
      - OAUTH2_SECRET_JWT_KEY_ID=<the key's Key ID>
      - OAUTH2_SERVER_URL=https://appleid.apple.com
      - OAUTH2_AUTH_ENDPOINT=/auth/authorize
      - OAUTH2_TOKEN_ENDPOINT=/auth/token
      - OAUTH2_ID_MAP=sub
      - OAUTH2_EMAIL_MAP=email
      - OAUTH2_FULLNAME_MAP=name
      - OAUTH2_REQUEST_PERMISSIONS=openid name email
```

Apple's authorization endpoint requires `response_mode=form_post` whenever the
`name`/`email` scopes are requested. WeKan sends it for the Apple address by
itself; `OAUTH2_RESPONSE_MODE` (`query`, `fragment` or `form_post`) sets it for
any provider. Apple then POSTs the answer back, which Meteor's OAuth handler
reads like a query. Keep the default `OAUTH2_LOGIN_STYLE=redirect`: the popup
flow may not complete (see [OAuth2.md](./OAuth2.md)). This has not been
verified end to end against Apple's servers; `tests/oidcProviderMode.test.cjs`
pins the decisions and that the OIDC package uses them.

**Others** - similar like above Docker; set the equivalent environment
variables/snap config keys for your platform, following [OAuth2.md](./OAuth2.md).

### Two things Apple does differently from every other WeKan OAuth2 provider

1. **The client secret is not a static string - it is a JWT your server must
   sign.** Every other provider documented under `docs/Features/Login-Page/`
   issues a plain `OAUTH2_SECRET` value that WeKan sends to the token endpoint
   as-is. Apple instead requires a compact JWT, signed with **ES256**, using a
   *private key* you download once from the Apple Developer portal (Keys →
   "Sign in with Apple" key), containing:
   - `iss`: your Apple **Team ID**
   - `sub`: your **Services ID** (the OAuth2 `client_id`)
   - `aud`: `https://appleid.apple.com`
   - `kid`: the key's Key ID, and `alg: ES256` in the JWT header
   - `iat`/`exp`: issued-at and expiry (Apple allows up to ~6 months; WeKan
     mints a short-lived one fresh on every token-exchange request instead)

   WeKan generates this JWT itself
   ([packages/wekan-oidc/oauth2ClientSecretJwt.js](../../../packages/wekan-oidc/oauth2ClientSecretJwt.js),
   using only Node's built-in `crypto` module - no external dependency) when
   `OAUTH2_SECRET_JWT_KEY_PATH` is set, and falls back to the plain
   `OAUTH2_SECRET` exactly as before when it is not. **This is opt-in and
   changes nothing for Keycloak, Authelia, Nextcloud or any other provider
   that keeps using a static `OAUTH2_SECRET`.**

   | Env var | Required | Meaning |
   | --- | --- | --- |
   | `OAUTH2_SECRET_JWT_KEY_PATH` | to opt in | Path to the `.p8` private key file downloaded from Apple (PEM/PKCS8 text). Setting this is what turns the feature on. |
   | `OAUTH2_SECRET_JWT_ISSUER` | yes, once opted in | Your Apple Team ID. |
   | `OAUTH2_SECRET_JWT_KEY_ID` | yes, once opted in | The Key ID (`kid`) of the private key above. |
   | `OAUTH2_SECRET_JWT_AUDIENCE` | no | Defaults to `https://appleid.apple.com`. |
   | `OAUTH2_SECRET_JWT_SUBJECT` | no | Defaults to `OAUTH2_CLIENT_ID` (your Services ID). |
   | `OAUTH2_SECRET_JWT_EXPIRES_IN` | no | Seconds until the minted JWT expires. Defaults to `300` (5 minutes) - it only needs to outlive the single token-exchange request it is generated for. |

   When `OAUTH2_SECRET_JWT_KEY_PATH` is set, `OAUTH2_SECRET` itself is not used
   and may be left empty.

2. **Apple returns the user's name only on the very first authorization**,
   never again on later logins - and only when your authorization request
   included `scope=name` (and the user chose to share the name in Apple's
   consent dialog rather than "Hide My Email"). Nothing Apple-specific is
   needed for this in WeKan: `Accounts.onCreateUser`
   ([server/models/users.js](../../../server/models/users.js)) copies the OIDC
   `fullname`/`email` claims into the WeKan user's own `profile.fullname` /
   `emails` fields **once, at account creation**, and never overwrites them
   again on later logins (that hook only runs when the user document is first
   created - see `updateOrCreateUserFromExternalService` in `accounts-base`,
   which on a returning user only touches `services.oidc.*`, not
   `profile.*`). So the name captured on the first Apple sign-in is what
   WeKan keeps, even though `services.oidc.fullname` itself goes back to empty
   on every later login where Apple sends no name claim.

## How the numbers are calculated

From [packages/wekan-oidc/oauth2ClientSecretJwt.js](../../../packages/wekan-oidc/oauth2ClientSecretJwt.js):

- `iat` is the current time in whole seconds, `Math.floor(Date.now() / 1000)`.
- `exp = iat + max(1, OAUTH2_SECRET_JWT_EXPIRES_IN)`; an unset or non-numeric
  value gives 300 seconds.
- The ES256 signature is SHA-256 over `base64url(header) + "." +
  base64url(claims)`, in the 64-byte IEEE P1363 (r‖s) form JWTs use.

The session expiry, as for every OAuth2 login, is `now + 1000 * expires_in`
milliseconds, 3600 seconds when the token response has none.

## How it works in WeKan

- [packages/wekan-oidc/oidc_server.js](../../../packages/wekan-oidc/oidc_server.js)
  `resolveClientSecret()` calls `maybeGenerateOauth2ClientSecretJwt()` for
  every token exchange; it returns `null` when `OAUTH2_SECRET_JWT_KEY_PATH`
  is unset, and the stored `OAUTH2_SECRET` is used instead. The key file is
  read on every exchange, so a replaced key applies to the next login.
- The `OAUTH2_SECRET_JWT_*` settings are in section `oidc` of
  [models/lib/authConfigCatalog.js](../../../models/lib/authConfigCatalog.js)
  and can be overridden in Admin Panel / People / OAuth2.
- `serviceData.email_verified` is copied from the token, and the
  `Accounts.onCreateUser` hook refuses to merge an OIDC login into an existing
  local account on an unverified email (GHSA-mp7g-hj5q-gxhq).
- Tests: [tests/oauth2ClientSecretJwt.test.cjs](../../../tests/oauth2ClientSecretJwt.test.cjs)
  (claims, header, signature verified with the public key, defaults),
  [tests/oidcProfileMerge.test.cjs](../../../tests/oidcProfileMerge.test.cjs).

## Commits

 - [Admin Panel / People / OAuth2 can override the OAUTH2_SECRET_JWT_* settings](https://github.com/wekan/wekan/commit/eb49a4b1b6853650823434e924f5d0dc47a4fe5b)
 - [Log in by full-page redirect by default](https://github.com/wekan/wekan/commit/ad51a03731ed2daf039204ccc7423dd05b3c9506)
 - [The client-secret JWT module moves into the wekan-oidc package](https://github.com/wekan/wekan/commit/ccb5c28b7689d4428db6448c71987b1891eaf19f)
 - [Add Sign in with Apple: server-signed ES256 JWT client secret](https://github.com/wekan/wekan/commit/517bee3f0b34feba020ee6369c8f3bc848426abf)
 - [An OIDC login is not merged into a local account on an unverified email](https://github.com/wekan/wekan/commit/73204d4e0a7d77a1b186b3d76e8eaf2f3e7c9fd9)
