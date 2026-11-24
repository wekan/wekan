# OAuth2 providers

## What it is

OAuth2 / OpenID Connect (OIDC) login lets people sign in to WeKan with an
account of another service, the identity provider, instead of a WeKan
password: the sign-in page gets a **Sign in with Oidc** button (its text is
set in Admin Panel / People / Login, **OIDC button text**), the provider asks
who they are, and WeKan creates or finds the matching account. Unlike the
fixed [OAuth providers](OAuth-Providers.md) (Google, GitHub, ...), this is
generic: you give WeKan the provider's address and endpoints.

You can use some OAuth2 providers for logging into Wekan, for example:
- [Auth0](./OAuth2.md#auth0) - works
- [Rocket.Chat](./OAuth2.md#rocketchat-providing-oauth2-login-to-wekan) - works
- [GitLab](./OAuth2.md#gitlab-providing-oauth2-login-to-wekan) - works
- Google - not tested yet
- [LemonLDAP::NG](./OAuth2.md#lemonldapng) - works
- [Authelia](./Authelia.md) - works
- [Apple (Sign in with Apple)](./Apple.md) - works

You can ask your identity provider (LDAP, SAML etc) do they support adding OAuth2 application like Wekan.

## Read more

- [OAuth at Wikipedia](https://en.wikipedia.org/wiki/OAuth) and
  [OpenID Connect at Wikipedia](https://en.wikipedia.org/wiki/OpenID)
- [The OAuth 2.0 Authorization Framework, RFC 6749](https://datatracker.ietf.org/doc/html/rfc6749)
  and [how OpenID Connect works](https://openid.net/developers/how-connect-works/)
- [OAuth2 Pull Request](https://github.com/wekan/wekan/pull/1578), where it
  started
- [More RocketChat fixes here](../Board-Sidebar/Board-Settings/Outgoing-Webhooks/Chat/RocketChat.md)
- [OAuth2 small bug](https://github.com/wekan/wekan/issues/1874) - currently OAuth2 works mostly
- Provider pages: [Autologin](autologin.md), [ADFS](ADFS.md), [Apple](Apple.md),
  [Authelia](Authelia.md), [Azure](Azure/README.md), [B2C](B2C.md),
  [Keycloak](Keycloak/README.md), [Nextcloud](Nextcloud.md),
  [Oracle Identity Cloud](Oracle-Identity-Cloud.md), [Oracle OIM](Oracle-OIM.md),
  [Zitadel](Zitadel.md)

## How to use it

1. At the identity provider, register WeKan as an application (client) and
   set its redirect URI to your `ROOT_URL` followed by `/_oauth/oidc`, for
   example `https://wekan.example.com/_oauth/oidc`. Take the client id and
   secret.
2. Set `OAUTH2_ENABLED=true`, `OAUTH2_CLIENT_ID`, `OAUTH2_SECRET` (or
   `OAUTH2_SECRET_FILE`), `OAUTH2_SERVER_URL`, `OAUTH2_AUTH_ENDPOINT`,
   `OAUTH2_TOKEN_ENDPOINT`, `OAUTH2_USERINFO_ENDPOINT`, the claim maps
   `OAUTH2_ID_MAP`, `OAUTH2_USERNAME_MAP`, `OAUTH2_FULLNAME_MAP`,
   `OAUTH2_EMAIL_MAP`, and `OAUTH2_REQUEST_PERMISSIONS`, in the environment
   (Snap: `sudo snap set wekan oauth2-client-id=...`, and the same for each setting) or in **Admin Panel / People /
   OAuth2**, where a saved value wins over the environment and applies to the
   next login without a restart.
3. Click **Sign in with Oidc** on the sign-in page. With `DEBUG=true` the
   server log shows the exchange.

The provider examples below show the values for each provider.

### OAuth2/OIDC auto-registration and admin groups

These settings control who is allowed to log in via OAuth2/OIDC and who becomes a
Wekan admin. They are read as environment variables (Docker / Source). On Snap use
the lower-case dash-separated equivalent (for example `oauth2-admin-groups`).

- `OAUTH2_AUTO_REGISTRATION` (default `true`) — when `false`, OAuth2/OIDC login is
  refused for users that do not already have a Wekan account (matched by verified
  email address). Use this when accounts must be provisioned in Wekan first.
- `OAUTH2_ADMIN_GROUPS` (default empty) — comma/space-separated list of OIDC group
  names whose members become Wekan admins. This mirrors `LDAP_SYNC_ADMIN_GROUPS`
  for OAuth2/OIDC.
- `OAUTH2_DEFAULT_ORGANIZATION` (default empty) — an existing organization,
  by short name, display name or id, that every account created by an
  OAuth2/OIDC login joins (#5339). Users of one identity provider, such as a
  Nextcloud, often share no email domain, so the organization's
  "auto-add users with domain name" cannot group them. An organization that
  does not exist is not created; the login goes on and the server log says so.
  Also in Admin Panel / People / OAuth2.
- `OAUTH2_LOGIN_STYLE` (default `redirect`) — `redirect` leaves the WeKan page
  for the provider and comes back; `popup` opens the provider in a popup
  window. Redirect is the default because it works in more places: Google's
  and other providers' sign-in pages can send a `Cross-Origin-Opener-Policy`
  header that makes the popup look closed at once, so the login never finishes
  and the user is back on the sign-in page, and popups fail where they are
  blocked, inside an iframe and on some phones. Set `popup` only to keep the
  WeKan page open during the login. Also in Admin Panel / People / OAuth2.

### GitLab providing OAuth2 login to Wekan

[Thanks to derhelge who figured out GitLab login](https://github.com/wekan/wekan/issues/3156).

[GitLab login related debugging](https://github.com/wekan/wekan/issues/3321)

These are the settings (snap installation):
```shell
sudo snap set wekan oauth2-enabled='true'
sudo snap set wekan oauth2-client-id='xxx'
sudo snap set wekan oauth2-secret='xxx'
sudo snap set wekan oauth2-server-url='https://gitlab.example.com/'
sudo snap set wekan oauth2-auth-endpoint='oauth/authorize'
sudo snap set wekan oauth2-userinfo-endpoint='oauth/userinfo'
sudo snap set wekan oauth2-token-endpoint='oauth/token'
sudo snap set wekan oauth2-id-map='sub'
sudo snap set wekan oauth2-username-map='nickname'
sudo snap set wekan oauth2-fullname-map='name'
sudo snap set wekan oauth2-email-map='email'
sudo snap set wekan oauth2-request-permissions='openid profile email'
```
And in GitLab you have to set the same scopes inside the created Application:
* openid
* profile
* email

The redirect URL is described in the wekan wiki: https://wekan.example.com/_oauth/oidc

### Bitbucket providing OAuth2 login to WeKan

[#1324](https://github.com/wekan/wekan/issues/1324). Bitbucket Cloud logs in to
WeKan through these generic OAuth2 settings; it needs no provider of its own.

1. In Bitbucket: **Workspace settings → OAuth consumers → Add consumer**.
   - **Callback URL**: `https://wekan.example.com/_oauth/oidc` (your
     `ROOT_URL` followed by `/_oauth/oidc`).
   - **This is a private consumer**: on.
   - **Permissions**: *Account: Read*, and *Account: Email* if you want the
     email scope.
   - Save, and open the consumer for its **Key** and **Secret**.
2. Set WeKan's environment (or Admin Panel / People / OAuth2):

```
OAUTH2_ENABLED=true
OAUTH2_CLIENT_ID=<the consumer's Key>
OAUTH2_SECRET=<the consumer's Secret>
OAUTH2_SERVER_URL=https://bitbucket.org
OAUTH2_AUTH_ENDPOINT=/site/oauth2/authorize
OAUTH2_TOKEN_ENDPOINT=/site/oauth2/access_token
OAUTH2_USERINFO_ENDPOINT=https://api.bitbucket.org/2.0/user
OAUTH2_REQUEST_PERMISSIONS=account
OAUTH2_ID_MAP=uuid
OAUTH2_USERNAME_MAP=nickname
OAUTH2_FULLNAME_MAP=display_name
OAUTH2_EMAIL_MAP=email
```

The user information is on another host than the login pages
(`api.bitbucket.org`), which is why that endpoint is a full URL: an endpoint
given as a full URL is used as it is (`packages/wekan-oidc/endpoint.js`).
Bitbucket accepts the client secret in the token request, as WeKan sends it.

**Email.** Bitbucket's `/2.0/user` does not include the email address (it is
at a separate endpoint), so `OAUTH2_EMAIL_MAP=email` finds nothing and a
Bitbucket login has no email until the person adds one in Member Settings.
For the same reason `OAUTH2_ALLOWED_EMAIL_DOMAINS` can not be used with
Bitbucket: a login without an email does not match a domain. Since 2019
Bitbucket no longer returns `username`. `nickname` is the closest, and `uuid`
is the stable id.

### Rocket.Chat providing OAuth2 login to Wekan

- [RocketChat Skip Install Registration Wizard Fix](https://github.com/RocketChat/Rocket.Chat/issues/31163#issuecomment-1848364117)

> So for someone using snap, it means creating a file `/var/snap/rocketchat-server/common/override-setup-wizard.env ` (the name of the file itself could be anything as long as it has an .env extension) and setting its content to `OVERWRITE_SETTING_Show_Setup_Wizard=completed`
> 
> Then, restarting the server by `systemctl restart snap.rocketchat-server.rocketchat-server.service`

- [RocketChat Webhook workaround](https://github.com/wekan/univention/issues/15)

Also, if you have Rocket.Chat using LDAP/SAML/Google/etc for logging into Rocket.Chat, then same users can login to Wekan when Rocket.Chat is providing OAuth2 login to Wekan.

#### Rocket.Chat signing in with SAML (G Suite / Google Workspace), then WeKan

[#6549](https://github.com/wekan/wekan/issues/6549): WeKan → Rocket.Chat
(OAuth2) → Google (SAML) is a chain of three sign-ins, and it only completes
when each step returns to the page that started it. The symptom when it does
not: "Sign in with Oidc" seems to do nothing unless you were already logged in
to Rocket.Chat, while Rocket.Chat's log and the Google Admin Console both show a
successful SAML login.

What happens: with the *popup* login style, WeKan opens Rocket.Chat's
`/oauth/authorize` page in a popup. Rocket.Chat is not logged in, so it starts
its own SAML login with Google, which leaves the authorize page. When Google
returns, Rocket.Chat is now logged in, but the authorize request that WeKan
waits for is gone, so WeKan never gets a code. Logging in to Rocket.Chat first
works only because the authorize page then has nothing to leave for.

Configure it like this:

1. **Use the redirect login style.** It is the default in current WeKan. Check
   that nothing sets it back to popup:
   ```
   sudo snap set wekan oauth2-login-style='redirect'
   ```
   Docker / environment: `OAUTH2_LOGIN_STYLE=redirect`. It is also in Admin
   Panel / People / OAuth2. With redirect, the whole browser tab goes
   WeKan → Rocket.Chat → Google → Rocket.Chat → WeKan, and nothing is lost on
   the way.
2. **In Rocket.Chat → Administration → SAML**, set the *Custom Provider*
   *Custom Entry Point* to the G Suite SSO URL, and check that Rocket.Chat's
   own SAML login completes in a plain browser tab before chaining WeKan to it.
   If that step fails on its own, WeKan's step cannot succeed.
3. **In the G Suite / Google Workspace SAML app**, the ACS URL is Rocket.Chat's
   `https://chat.example.com/_saml/validate/<provider>`, and the Entity ID is
   Rocket.Chat's *Custom Issuer*. Google must send the e-mail address as the
   NameID, because WeKan maps the account by `OAUTH2_EMAIL_MAP='email'` from
   Rocket.Chat's user info.
4. **In Rocket.Chat → Administration → OAuth Apps**, the WeKan app's Redirect
   URI is exactly `https://boards.example.com/_oauth/oidc`, the same scheme and
   host as WeKan's `ROOT_URL`.
5. Same `ROOT_URL` scheme everywhere: WeKan, Rocket.Chat and both SAML URLs on
   `https://`. A mixed http/https chain drops the session cookie on the way back.

If the chain still stops, set `sudo snap set wekan debug='true'`, click the
Oidc button once, and read `sudo snap logs wekan.wekan` together with
Rocket.Chat's SAML log. A line with `profile:` in WeKan's log means the code
reached WeKan. No such line means the authorize step never returned (step 1 or 2).

To avoid the chain altogether, WeKan can use Google directly: Google OIDC
(`OAUTH2_SERVER_URL=https://accounts.google.com`) or WeKan's own SAML login
with the G Suite app ([SAML](SAML.md)).

If there is an existing username/password account in Wekan with the same email,
OAuth2 merges both logins only when `OAUTH2_MERGE_EXISTING_USERS=true` and the
provider says the email is verified (`email_verified`); by default the OAuth2
login is refused instead (see "How it works in WeKan" below).

Source: [OAuth2 Pull Request](https://github.com/wekan/wekan/pull/1578)

#### Docker

The `OAUTH2_*` lines, commented out, in [docker-compose.yml](../../../docker-compose.yml).

#### Snap

##### 1) Install Rocket.Chat

[Rocket.Chat Snap](https://rocket.chat/docs/installation/manual-installation/ubuntu/snaps/) has Node at port 3000 and mongodb at port 27017.
```
sudo snap install rocketchat-server
sudo systemctl disable rocketchat-server.rocketchat-caddy
sudo systemctl stop rocketchat-server.rocketchat-caddy
```

##### 2) Install Wekan

[Wekan Snap](https://github.com/wekan/wekan-snap/wiki/Install) has Node at port 3001 and MongoDB at port 27019.
```
sudo snap install wekan
sudo snap set wekan root-url='https://BOARDS.YOURDOMAIN.COM'
sudo snap set wekan port='3001'
sudo snap set core refresh.schedule=02:00-04:00
sudo snap set wekan with-api='true'
```
Email settings [ARE NOT REQUIRED](../Email/Troubleshooting-Mail.md), Wekan works without setting up Email.
```
sudo snap set wekan mail-url='smtps://user:pass@MAILSERVER.YOURDOMAIN.COM:453'
sudo snap set wekan mail-from='Wekan Boards <support@YOURDOMAIN.COM>'
```
Edit Caddyfile:
```
sudo nano /var/snap/wekan/common/Caddyfile
```
Add Caddy config. This uses free Let's Encrypt SSL. You can also use [free CloudFlare wildcard SSL or any other SSL cert](../../Platforms/Webserver/Caddy.md).
```
boards.yourdomain.com {
        reverse_proxy localhost:3001
}

chat.yourdomain.com {
        reverse_proxy localhost:3000
}
```
Enable Wekan's Caddy:
```
sudo snap set wekan caddy-enabled='true'
```

##### 3) Add Rocket.Chat settings

Login to Rocket.Chat at https://chat.yourdomain.com .

Accept chat URL to be https://chat.yourdomain.com .

Click: (3 dots) Options / Administration / OAuth Apps / NEW APPLICATION

CHANGE BELOW ONLY THOSE THAT ARE UPPER CASE, AND URLs TO LOWER CASE.

Add settings:

```
Active: [X] True
Application Name: WEKAN
Redirect URI: https://BOARDS.YOURDOMAIN.COM/_oauth/oidc
Client ID: abcde12345         <=== Rocket.Chat generates random text to here
Client Secret: 54321abcde     <=== Rocket.Chat generates random text to here
Authorization URL: https://CHAT.YOURDOMAIN.COM/oauth/authorize
Access Token URL: https://CHAT.YOURDOMAIN.COM/oauth/token
```
Save Changes.

##### 4) Add Wekan settings
Copy below commands to `auth.sh` textfile, make it executeable `chmod +x auth.sh` and run it with `./auth.sh`.

CHANGE BELOW ONLY THOSE THAT ARE UPPER CASE, AND URLs TO LOWER CASE.
```
sudo snap set wekan oauth2-enabled='true'
sudo snap set wekan oauth2-client-id='YOUR-CLIENT-ID'
sudo snap set wekan oauth2-secret='YOUR-CLIENT-SECRET'
sudo snap set wekan oauth2-server-url='https://CHAT.YOURDOMAIN.COM/'
sudo snap set wekan oauth2-auth-endpoint='oauth/authorize'
sudo snap set wekan oauth2-userinfo-endpoint='oauth/userinfo'
sudo snap set wekan oauth2-token-endpoint='oauth/token'
sudo snap set wekan oauth2-id-map='preferred_username'
sudo snap set wekan oauth2-username-map='preferred_username'
sudo snap set wekan oauth2-fullname-map='preferred_username'
sudo snap set wekan oauth2-email-map='email'
```
##### If login does not work, debug it
```
sudo snap set wekan debug='true'
```
Click Oidc button. Then:
```
sudo snap logs wekan.wekan
sudo systemctl status snap.wekan.wekan
```

##### 5) Login to Wekan

1) Go to https://boards.example.com

2) Click `Sign in with Oidc`

3) Click `Authorize` . This is asked only first time when logging in to Wekan with Rocket.Chat.

<img src="https://wekan.fi/oauth2-login.png" width="60%" alt="Wekan login to Rocket.Chat" />

##### 6) Set your Full Name

Currently Full Name is not preserved, so you need to change it.

1) Click `Your username / Profile`

2) Add info and Save.

<img src="https://wekan.fi/oauth2-profile-settings.png" width="60%" alt="Wekan login to Rocket.Chat" />

##### 7) Add more login options to Rocket.Chat

1) At Rocket.Chat, Click: (3 dots) Options / Administration

2) There are many options at OAuth menu. Above and below of OAuth are also CAS, LDAP and SAML.

<img src="https://wekan.fi/oauth-rocketchat-options.png" width="100%" alt="Wekan login to Rocket.Chat" />

### Auth0

[Auth0](https://auth0.com) can provide PasswordlessEmail/Google/Facebook/LinkedIn etc login options to Wekan.

#### 1) Auth0 / Applications / Add / Regular Web Application / Auth0 Settings

CHANGE BELOW ONLY THOSE THAT ARE UPPER CASE, AND URLs TO LOWER CASE.
```
Client ID:                                 <== Copy to below snap settings
Secret:                                    <== Copy to below snap settings
Account url: YOURACCOUNT.eu.auth0.com      <== Copy to below snap settings
Application Logo:                          <== Add your logo
Application Type: Single Page Application
Token Endpoint Authentication Method: Post
Allowed Callback URLs: https://BOARDS.YOURDOMAIN.COM/_oauth/oidc  <== Change your Wekan address
Allowed Web Origins: https://BOARDS.YOURDOMAIN.COM                <== Change your Wekan address
Use Auth0 instead of the IdP to do Single Sign On: [X]
```
If you  need more info, they are at bottom of the page Advanced Settings / Endpoint / OAuth

#### 2) Auth0 Dashboard => Rules => Add Rule

CHANGE BELOW ONLY THOSE THAT ARE UPPER CASE, AND URLs TO LOWER CASE.

Rule Name: Encrich Wekan login
```
  function (user, context, callback) {
    // Only use this rule for Auth0 Dashboard / Applications / WekanApplication
    if(context.clientName !== 'YOUR-APPLICATION-NAME'){
      return callback(null, user, context);
    }
    user.user_metadata = user.user_metadata || {};
    var ns = "https://BOARDS.YOURDOMAIN.COM/";
    context.idToken[ns + "id"] = user.user_id;
    context.idToken[ns + "email"] = user.email;
    context.idToken[ns + "name"] = user.name || user.user_metadata.name;
    context.idToken[ns + "picture"] = user.picture;
    callback(null, user, context);
  }
```

#### 3) Snap settings, change to it from above client-id, secret, server-url and web-origin (=namespace for rules function above).

Note: namespace works for multiple apps. For example, you can use same namespace url for many different wekan board apps that have different client-id etc, and different board url, and still use same namespace url like https://boards.example.com .

CHANGE BELOW ONLY THOSE THAT ARE UPPER CASE. 
```
sudo snap set wekan oauth2-client-id='YOUR-CLIENT-ID'
sudo snap set wekan oauth2-secret='YOUR-SECRET'
sudo snap set wekan oauth2-server-url='https://YOURACCOUNT.eu.auth0.com'
sudo snap set wekan oauth2-auth-endpoint='/authorize'
sudo snap set wekan oauth2-userinfo-endpoint='/userinfo'
sudo snap set wekan oauth2-token-endpoint='/oauth/token'
sudo snap set wekan oauth2-id-map='https://BOARDS.YOURDOMAIN.COM/id'
sudo snap set wekan oauth2-username-map='https://BOARDS.YOURDOMAIN.COM/email'
sudo snap set wekan oauth2-fullname-map='https://BOARDS.YOURDOMAIN.COM/name'
sudo snap set wekan oauth2-email-map='https://BOARDS.EXAMPLE.COM/email'
```
For login to work, you need to:
- Create first Admin user
- Add other users with REST API or Password registration
- Login with OIDC button
- Have Auth0 configured for passwordless email login (on some other login)

#### 4) Auth0 ID provider to Custom OAuth RocketChat

These do work currently so that Auth0 passwordless login to RocketChat does work,
but there is some additional code also that is not added as PR to RocketChat yet.
Code mainly has generating custom authorization cookie from user email with addition to
RocketChat API, and using it and login_token + rc_token to check on RocketChat login page
using router repeating trigger so that if those cookies exist then automatically login
user in using RocketChat Custom OAuth2.

CHANGE BELOW ONLY THOSE THAT ARE UPPER CASE, AND URLs TO LOWER CASE.
```
Enable: [X] True
URL: https://YOURACCOUNT.eu.auth0.com/
Token Path: oauth/token
Token Sent Via: Payload
Identity Token Sent Via: Same as "Token Sent Via"
Identity Path: userinfo
Authorize Path: authorize
Scope: openid profile email
ID: YOUR-ACCOUNT-ID
Secret: YOUR-ACCOUNT-SECRET
Login Style: Redirect
Button Text: JOIN CHAT
Button Text Color: #FFFFFF
Button Color: #000000
Username field: (empty)
Merge users: [X] True
```

### Spring Authorization Server

Spring Authorization Server's default protocol paths differ from the generic
Doorkeeper example. With an uncustomized server on port 9000, use:

```text
OAUTH2_SERVER_URL=http://localhost:9000
OAUTH2_AUTH_ENDPOINT=/oauth2/authorize
OAUTH2_TOKEN_ENDPOINT=/oauth2/token
OAUTH2_USERINFO_ENDPOINT=/userinfo
OAUTH2_REQUEST_PERMISSIONS=openid profile email
OAUTH2_ID_MAP=sub
OAUTH2_USERNAME_MAP=email
OAUTH2_EMAIL_MAP=email
OAUTH2_FULLNAME_MAP=name
```

Register `${ROOT_URL}/_oauth/oidc` as the redirect URI, for example
`http://localhost:3000/_oauth/oidc`. A 404 at Spring's `/error` endpoint before
the callback normally means an incorrect authorization endpoint. The UserInfo
endpoint also has to be enabled in Spring Authorization Server, including its
required JWT decoder/resource-server support.

Endpoint settings may be paths relative to `OAUTH2_SERVER_URL` or complete
`http://` / `https://` URLs. WeKan preserves complete URLs and joins relative
paths with exactly one slash.

### lemonldapng

Official documentation : https://lemonldap-ng.org/documentation/latest/applications/wekan

#### Wekan Config

Basically, you need to set theses variables to your wekan env : 

```
OAUTH2_ENABLED: TRUE
OAUTH2_CLIENT_ID: ClientID
OAUTH2_SECRET: Secret
OAUTH2_SERVER_URL: https://auth.example.com/
OAUTH2_AUTH_ENDPOINT: oauth2/authorize
OAUTH2_USERINFO_ENDPOINT: oauth2/userinfo
OAUTH2_TOKEN_ENDPOINT: oauth2/token
OAUTH2_ID_MAP: sub
```

#### LemonLDAP::NG Config

You need to set a new OpenID Connect Relay Party (RP) with theses parameters : 

* Client ID: the same you set in Wekan configuration (same as OAUTH2_CLIENT_ID)
* Client Secret: the same you set in Wekan configuration (same as OAUTH2_SECRET)
* Add the following exported attributes
    * name: session attribute containing the user's full name
    * email: session attribute containing the user's email or _singleMail

See LLNG doc for more details

## How the numbers are calculated

- **Token lifetime**: the provider's `expires_in` seconds; a provider that
  sends none gets the OAuth2 default of 3600 seconds
  (`packages/wekan-oidc/oidc_server.js`).
- **Scopes**: `OAUTH2_REQUEST_PERMISSIONS`, default `openid profile email`;
  one layer of surrounding quotes is removed, commas count as separators,
  whitespace is collapsed and duplicates dropped
  (`models/lib/oauth2Scopes.js`, \#6545).
- **Endpoints**: a relative endpoint is joined to `OAUTH2_SERVER_URL` with
  exactly one slash; a full `http://` / `https://` URL is used as it is
  (`packages/wekan-oidc/endpoint.js`).
- **Defaults**: `OAUTH2_ENABLED=false`, `OAUTH2_LOGIN_STYLE=redirect`,
  `OAUTH2_AUTO_REGISTRATION=true`, `OAUTH2_MERGE_EXISTING_USERS=false`,
  `OAUTH2_AVATAR_MAP=picture`, `PROPAGATE_OIDC_DATA=false`
  (`models/lib/authConfigCatalog.js`).
- **Email domains**: `OAUTH2_ALLOWED_EMAIL_DOMAINS` is a comma-separated list;
  the email's domain must be exactly one of them, and a malformed list refuses
  every login.

## How it works in WeKan

- [packages/wekan-oidc/oidc_server.js](../../../packages/wekan-oidc/oidc_server.js) -
  the token exchange (standard, Oracle OIM's Basic header, or a signed JWT
  client secret for Apple), the user info (or the access token's claims for
  ADFS and B2C), the claim maps, `email_verified`, the avatar, and the group,
  organization and team propagation with `PROPAGATE_OIDC_DATA`. Those
  propagation methods refuse any call from a client connection
  (GHSA-cv95-8h7c-2ffq).
- [packages/wekan-oidc/oidc_client.js](../../../packages/wekan-oidc/oidc_client.js) -
  `Meteor.loginWithOidc` in the browser, popup or redirect.
- [packages/wekan-oidc/endpoint.js](../../../packages/wekan-oidc/endpoint.js),
  [emailDomainPolicy.js](../../../packages/wekan-oidc/emailDomainPolicy.js),
  [oauth2ClientSecretJwt.js](../../../packages/wekan-oidc/oauth2ClientSecretJwt.js) -
  endpoint joining, the email domain rule, the JWT client secret.
- [server/authentication.js](../../../server/authentication.js) -
  `reconfigureOidc` writes the `oidc` service configuration from the settings
  in effect, or removes it when OAuth2 is off.
- [server/models/users.js](../../../server/models/users.js) -
  `Accounts.onCreateUser`: matches an existing account by email only, links it
  only with `OAUTH2_MERGE_EXISTING_USERS=true` and a verified email
  (GHSA-mp7g-hj5q-gxhq), otherwise refuses with `oidc-email-already-in-use`;
  refuses unknown users when `OAUTH2_AUTO_REGISTRATION=false`; joins
  `OAUTH2_DEFAULT_ORGANIZATION`; sets admin from `OAUTH2_ADMIN_GROUPS`.
- Tests: [tests/oidcEndpoint.test.cjs](../../../tests/oidcEndpoint.test.cjs),
  [tests/oidcBleed.test.cjs](../../../tests/oidcBleed.test.cjs),
  [tests/oidcEmailDomainPolicy.test.cjs](../../../tests/oidcEmailDomainPolicy.test.cjs),
  [tests/oidcProfileMerge.test.cjs](../../../tests/oidcProfileMerge.test.cjs),
  [tests/oidcNullUserinfo.test.cjs](../../../tests/oidcNullUserinfo.test.cjs),
  [tests/oidcLoginStateIsolation.test.cjs](../../../tests/oidcLoginStateIsolation.test.cjs),
  [tests/oauth2LoginStyle.test.cjs](../../../tests/oauth2LoginStyle.test.cjs),
  [tests/oauth2ClientSecretJwt.test.cjs](../../../tests/oauth2ClientSecretJwt.test.cjs),
  [tests/oauthDefaultOrganization.test.cjs](../../../tests/oauthDefaultOrganization.test.cjs),
  [tests/oauth2RocketChatSamlChainDocs.test.cjs](../../../tests/oauth2RocketChatSamlChainDocs.test.cjs).

## Commits

 - [Override every login environment variable in Admin Panel / People](https://github.com/wekan/wekan/commit/eb49a4b1b6853650823434e924f5d0dc47a4fe5b)
 - [How WeKan, Rocket.Chat and a G Suite SAML login chain together](https://github.com/wekan/wekan/commit/03b83c14c18d130779d01b92d13f82e74257deb4)
 - [Bitbucket login through the generic OAuth2 settings](https://github.com/wekan/wekan/commit/f715e95b4016fe4b7d6486167de88cc929bb6cc1)
 - [Log in by full-page redirect by default](https://github.com/wekan/wekan/commit/ad51a03731ed2daf039204ccc7423dd05b3c9506)
 - [Accounts created by an OAuth2/OIDC login join a default organization](https://github.com/wekan/wekan/commit/dfcd115ff3e0cef22e0b12a4b6324ce1117bdec5)
 - [Email domain restrictions for on-premise OAuth2](https://github.com/wekan/wekan/commit/2fd461fa5582fcdca820cc2dcacaae0e605a66b8)
 - [Sign in with Apple: a server-signed JWT client secret](https://github.com/wekan/wekan/commit/517bee3f0b34feba020ee6369c8f3bc848426abf)
 - [OIDC and account metadata security boundaries](https://github.com/wekan/wekan/commit/12f2fddc2c179bcc53fa8f31bfcb43a320b9fdff)
 - [Absolute and Spring OIDC endpoints](https://github.com/wekan/wekan/commit/aee94c2637594cd154be3973e68033aa77a3e6d3)
 - [A provider that refuses the request says so, instead of "'ocs' of null"](https://github.com/wekan/wekan/commit/a50b483ff92786886acf2faf99e7072e6b2c9607)
 - [Clean up OAuth2 scopes written with quotes](https://github.com/wekan/wekan/commit/98bce97141f808430f9ea2fe1116af23b2338f89)
 - [Import the OIDC picture as the avatar at login](https://github.com/wekan/wekan/commit/e0c76099f04eae64905f51569e35b8c1dfaf1058)
 - [Set admin from OAuth2/OIDC groups with OAUTH2_ADMIN_GROUPS](https://github.com/wekan/wekan/commit/82f028cbea6b0fd0c83d1b0e30c4d047eb93fdee)
 - [Fix GHSA-cv95-8h7c-2ffq: OIDC methods callable by any user](https://github.com/wekan/wekan/commit/305864f0c77456ad0f2c1e616266c8a06749c951)
 - [Fix GHSA-mp7g-hj5q-gxhq: no unconditional email-based account merge](https://github.com/wekan/wekan/commit/73204d4e0a7d77a1b186b3d76e8eaf2f3e7c9fd9)
 - [Migrate the OIDC login from HTTP to fetch](https://github.com/wekan/wekan/commit/49a272d6c0a8d5fbcd2a4b6824acc0f7b77336b4)
 - [Migrate the OIDC login to Meteor 3's async API](https://github.com/wekan/wekan/commit/0fcdf47545a61ab30b10e86b6a4fdb7324cfc2da)
 - [Azure AD B2C login using OAuth2](https://github.com/wekan/wekan/commit/93be112a9454c894c1ce3146ed377e6a6aeca64a)
 - [Add the user to a default board after login](https://github.com/wekan/wekan/commit/00826660b47f04aead0f02838884ada1e24580f7)
 - [Fix the OIDC login loop for integer user ids](https://github.com/wekan/wekan/commit/f2a92be01a753c5752284d221706c6efb0dd60a7)
 - [Group routine in the wekan-oidc package](https://github.com/wekan/wekan/commit/d90e78e4179fbcb3d926eaf53d97af6cfe59fb43)
 - [Redirect to the OIDC provider for single sign-on](https://github.com/wekan/wekan/commit/84d51393e4270cb287dfabb1d03750a85c02b1b7)
 - [Update teams from OIDC](https://github.com/wekan/wekan/commit/f90875d8ef5cbfb7b9a7e54a7be633a2d3ddfa80)
 - [With ORACLE_OIM_ENABLED, set OAUTH2_REQUEST_PERMISSIONS freely](https://github.com/wekan/wekan/commit/1b429b3f99c32840ebb0ff9a29015aa8c28ec644)
