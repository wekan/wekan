## Sign in with Apple using OAuth2/OIDC

- Original issue: https://github.com/wekan/wekan/issues/2458
- [Apple: Configure Sign in with Apple for the web](https://developer.apple.com/documentation/sign_in_with_apple/configure_your_environment)
- [Apple: Generate and validate tokens](https://developer.apple.com/documentation/sign_in_with_apple/generate_and_validate_tokens)
- [Apple: Authenticating users with Sign in with Apple](https://developer.apple.com/documentation/sign_in_with_apple/authenticating-users-with-sign-in-with-apple)

Sign in with Apple exposes standard OpenID Connect endpoints, so it is
configured as a Wekan generic OAuth2/OIDC provider like Keycloak or Authelia
(see [OAuth2.md](./OAuth2.md)). Its fixed, non-discoverable endpoints are:
- `authorization_endpoint`: `https://appleid.apple.com/auth/authorize`
- `token_endpoint`: `https://appleid.apple.com/auth/token`

Apple has no public `userinfo_endpoint`; the user's identity is carried in the
`id_token` (a signed JWT) that the token endpoint returns, which Wekan already
reads: `OAUTH2_USERINFO_ENDPOINT` may be left unset, and
`OAUTH2_ADFS_ENABLED=true` (despite the name, this flag simply tells Wekan's
OIDC client "read claims from the access/id token instead of calling a
userinfo endpoint" - the same mechanism ADFS and Azure AD B2C use) makes Wekan
decode the claims (`sub`, `email`, `email_verified`, ...) straight out of the
token response instead of calling a userinfo endpoint.

## Two things Apple does differently from every other Wekan OAuth2 provider

1. **The client secret is not a static string - it is a JWT your server must
   sign.** Every other provider documented under `docs/Features/Login/` issues
   a plain `OAUTH2_SECRET` value that Wekan sends to the token endpoint as-is.
   Apple instead requires a compact JWT, signed with **ES256**, using a
   *private key* you download once from the [Apple Developer
   portal](https://developer.apple.com/account/resources/authkeys/list) (Keys
   → "Sign in with Apple" key), containing:
   - `iss`: your Apple **Team ID**
   - `sub`: your **Services ID** (the OAuth2 `client_id`)
   - `aud`: `https://appleid.apple.com`
   - `kid`: the key's Key ID, and `alg: ES256` in the JWT header
   - `iat`/`exp`: issued-at and expiry (Apple allows up to ~6 months; Wekan
     mints a short-lived one fresh on every token-exchange request instead)

   Wekan generates this JWT itself (`models/lib/oauth2ClientSecretJwt.js`,
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
   included `scope=name` (and the user chose "Share My Email"/full name in
   Apple's consent dialog rather than "Hide My Email"). Nothing Apple-specific
   is needed for this in Wekan: `Accounts.onCreateUser`
   (`server/models/users.js`) copies the OIDC `fullname`/`email` claims into
   the Wekan user's own `profile.fullname` / `emails` fields **once, at
   account creation**, and never overwrites them again on later logins (that
   hook only runs when the user document is first created - see
   `updateOrCreateUserFromExternalService` in `accounts-base`, which on a
   returning user only touches `services.oidc.*`, not `profile.*`). So the
   name captured on the first Apple sign-in is what Wekan keeps, even though
   `services.oidc.fullname` itself goes back to empty on every later login
   where Apple sends no name claim.

## Docker

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
      - OAUTH2_ADFS_ENABLED=true
      - OAUTH2_ID_MAP=sub
      - OAUTH2_EMAIL_MAP=email
      - OAUTH2_FULLNAME_MAP=name
      - OAUTH2_REQUEST_PERMISSIONS=openid name email
```

Apple's authorization endpoint requires the request to use `response_mode=form_post`
whenever the `name`/`email` scopes are requested; if your Wekan instance needs
those on first login and the popup flow does not complete, try
`OAUTH2_LOGIN_STYLE=redirect` (see [OAuth2.md](./OAuth2.md)).

## Others

Similar like above Docker; set the equivalent environment variables/snap
config keys for your platform, following [OAuth2.md](./OAuth2.md).
