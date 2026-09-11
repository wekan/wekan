## Login with Google, GitHub, Facebook, Twitter, Meteor, Weibo and Meetup

Meteor's accounts system ships a login package for each of these providers
(`accounts-google`, `accounts-github`, `accounts-facebook`, `accounts-twitter`,
`accounts-meteor-developer`, `accounts-weibo`, `accounts-meetup`). WeKan wires
all seven in, so each one is a "Sign in with ..." button on the login page as
soon as it is enabled and given the app credentials the provider issued.

This is separate from the generic [OAuth2 / OIDC](OAuth2.md) login
(`OAUTH2_*`), which talks to any OpenID Connect server you point it at
(Keycloak, Authelia, Azure, Nextcloud, ...). The providers on this page have
their own fixed endpoints inside Meteor's packages, so all you give WeKan is the
app id and the secret. Both kinds can be on at the same time.

```
  browser                     WeKan                        provider
    |  click "Sign in with X"   |                              |
    |-------------------------->|                              |
    |  popup (or redirect) to   |                              |
    |  the provider's login     |                              |
    |------------------------------------------------------------>
    |                           |   redirect back to           |
    |                           |   <ROOT_URL>/_oauth/<service>|
    |<------------------------------------------------------------
    |-------------------------->|  exchange code for the       |
    |                           |  profile with the secret     |
    |                           |----------------------------->|
    |                           |<-----------------------------|
    |  logged in                |  find or create the user     |
    |<--------------------------|                              |
```

## Register the app at the provider

Every provider wants an "OAuth app" created on its developer site, and every
one of them asks for the *callback URL* (also called redirect URI or
authorized redirect URI). It is always

```
<ROOT_URL>/_oauth/<service>
```

where `<ROOT_URL>` is WeKan's `ROOT_URL` (for example
`https://boards.example.com`) and `<service>` is the name in the table below.
The URL must match character for character, including `https://` and any port.

| Provider | `<service>` | Where to create the app | Id variable |
| --- | --- | --- | --- |
| Google | `google` | https://console.cloud.google.com/apis/credentials (OAuth client ID, type "Web application") | `OAUTH_GOOGLE_CLIENT_ID` |
| GitHub | `github` | https://github.com/settings/developers ("OAuth Apps") | `OAUTH_GITHUB_CLIENT_ID` |
| Facebook | `facebook` | https://developers.facebook.com/apps/ (add the "Facebook Login" product) | `OAUTH_FACEBOOK_APP_ID` |
| Twitter / X | `twitter` | https://developer.x.com/en/portal/dashboard (OAuth 1.0a, "Web App" with sign-in enabled) | `OAUTH_TWITTER_CONSUMER_KEY` |
| Meteor Developer | `meteor-developer` | https://www.meteor.com/ (developer account, "OAuth applications") | `OAUTH_METEOR_DEVELOPER_CLIENT_ID` |
| Weibo | `weibo` | https://open.weibo.com/ | `OAUTH_WEIBO_CLIENT_ID` |
| Meetup | `meetup` | https://www.meetup.com/api/oauth/list/ | `OAUTH_MEETUP_CLIENT_ID` |

Google also needs the OAuth consent screen filled in, and GitHub wants a
"Homepage URL", which is simply `ROOT_URL`. Meetup and Weibo may take a
few days to approve a new app.

## Environment variables

Each provider has the same four variables. `<PROVIDER>` is `GOOGLE`,
`GITHUB`, `FACEBOOK`, `TWITTER`, `METEOR_DEVELOPER`, `WEIBO` or `MEETUP`.

| Variable | Meaning |
| --- | --- |
| `OAUTH_<PROVIDER>_ENABLED` | `true` shows the "Sign in with ..." button. Default `false`. |
| `OAUTH_<PROVIDER>_CLIENT_ID` | The app id the provider issued. Facebook calls it `OAUTH_FACEBOOK_APP_ID`, Twitter `OAUTH_TWITTER_CONSUMER_KEY`. |
| `OAUTH_<PROVIDER>_SECRET` | The app secret. |
| `OAUTH_<PROVIDER>_SECRET_FILE` | Read the secret from this file instead (Docker secrets), for example `/run/secrets/oauth_google_secret`. Used when `OAUTH_<PROVIDER>_SECRET` is empty. |

And three settings that apply to all of them at once:

| Variable | Meaning |
| --- | --- |
| `OAUTH_PROVIDERS_LOGIN_STYLE` | `popup` (default) opens the provider in a popup window; `redirect` leaves the page and comes back. Use `redirect` where popups are blocked, for example inside an iframe or on some phones. |
| `OAUTH_PROVIDERS_MERGE_EXISTING_USERS` | Default `false`: a provider login whose email already belongs to a WeKan account made another way (password, LDAP, OAuth2, ...) is refused. `true` links the provider to that account instead. This is the same rule as `OAUTH2_MERGE_EXISTING_USERS`: only enable it when you trust every enabled provider to have verified the email, or an attacker who controls an account at one provider with your user's email gets your user's boards. |
| `PASSWORDLESS_ENABLED` | Not a provider, but the other Meteor accounts login: a one-time code by email. See [Passwordless](Passwordless.md). |

They are commented out, with these explanations, in every place WeKan is
configured: `docker-compose.yml` (and the FerretDB / MongoDB variants),
`Dockerfile`, `start-wekan.sh`, `start-wekan.bat`, the Snap
(`snap set wekan oauth-google-enabled='true'` and so on, `wekan.help` lists
them all) and the Sandstorm package definition.

A minimal Docker Compose example for Google:

```yaml
services:
  wekan:
    environment:
      - ROOT_URL=https://boards.example.com
      - OAUTH_GOOGLE_ENABLED=true
      - OAUTH_GOOGLE_CLIENT_ID=1234567890-abcdefg.apps.googleusercontent.com
      - OAUTH_GOOGLE_SECRET_FILE=/run/secrets/oauth_google_secret
    secrets:
      - oauth_google_secret

secrets:
  oauth_google_secret:
    file: ./secrets/oauth_google_secret
```

with the callback URL `https://boards.example.com/_oauth/google` registered in
the Google Cloud console.

## Admin Panel overrides

Admin Panel / People / Login has a section per provider with the same
fields, plus the login style, the merge switch and passwordless. A value saved
there wins over the environment variable, so an administrator can enable a
provider, or rotate a secret, without restarting WeKan. Leave a field empty in
the Admin Panel to fall back to the environment variable. This is how the
`LDAP_*` and `OAUTH2_*` settings already behave.

The same settings are scriptable over the REST API, global admin only:
`GET /api/admin/oauth-providers` reports which source is in effect for every
field (the secret only as "is set"), `PUT /api/admin/oauth-providers/:providerKey`
saves one provider and `PUT /api/admin/passwordless` switches passwordless -
see [REST API](../../API/REST-API.md#admin-panel-oauth-login-providers-and-passwordless).

## What the user sees

- The login page shows one button per enabled provider under the password
  form. Hide the password form with `PASSWORD_LOGIN_ENABLED=false` when the
  providers are the only way in ([Disable Password Login](Disable-Password-Login.md)).
- A first login creates the WeKan user from the provider's profile: the
  username from the provider's login name where it has one (GitHub, Twitter,
  Meetup) or the email's local part otherwise, and the full name from the
  profile. The user is a normal user; make them admin in Admin Panel / People.
- Google, GitHub, Facebook and Meteor Developer return a (verified) email;
  Twitter, Weibo and Meetup may not, in which case the user gets no email and
  must add one in Member Settings before notifications work.
- Registration rules apply: if Admin Panel / People / Registration is set to
  invite-only, a provider login for an unknown email is refused the same way a
  password sign-up would be.

## Troubleshooting

- *"redirect_uri_mismatch"* or *"The redirect URI is not registered"*: the
  callback URL at the provider is not exactly `<ROOT_URL>/_oauth/<service>`.
  Check `ROOT_URL` (scheme, host, port, no trailing path) and register that.
- The popup closes and nothing happens: the browser blocked third-party
  cookies for the popup, or WeKan is inside an iframe. Set
  `OAUTH_PROVIDERS_LOGIN_STYLE=redirect`.
- *"Login refused: an account with this email already exists"*: that is
  `OAUTH_PROVIDERS_MERGE_EXISTING_USERS=false` doing its job. Either the user
  logs in the way the account was made, or the administrator enables merging
  for providers whose emails they trust.
- The button is missing: the provider is not enabled, in the environment or
  in the Admin Panel, or the Admin Panel has it explicitly switched off (an
  Admin Panel value wins over the environment).

## Related

- [OAuth2 / OIDC](OAuth2.md) for any OpenID Connect server
- [Passwordless](Passwordless.md) for the one-time code by email
- [Google login](Google-login.md), the older Google notes
- [Disable Password Login](Disable-Password-Login.md)
