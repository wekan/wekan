- [More RocketChat fixes here](../Webhooks/Chat/RocketChat.md)
- [OAuth2 small bug](https://github.com/wekan/wekan/issues/1874) - currently OAuth2 works mostly

# OAuth2 providers

You can use some OAuth2 providers for logging into Wekan, for example:
- [Auth0](./OAuth2.md#auth0) - works
- [Rocket.Chat](./OAuth2.md#rocketchat-providing-oauth2-login-to-wekan) - works
- [GitLab](./OAuth2.md#gitlab-providing-oauth2-login-to-wekan) - works
- Google - not tested yet
- [LemonLDAP::NG](./OAuth2.md#lemonldapng) - works
- [Authelia](./Authelia.md) - works
- [Apple (Sign in with Apple)](./Apple.md) - works

You can ask your identity provider (LDAP, SAML etc) do they support adding OAuth2 application like Wekan.

## OAuth2/OIDC auto-registration and admin groups

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

## GitLab providing OAuth2 login to Wekan

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

## Bitbucket providing OAuth2 login to WeKan

[#1324](https://github.com/wekan/wekan/issues/1324). Bitbucket Cloud logs in to
WeKan through these generic OAuth2 settings; it needs no provider of its own.

1. In Bitbucket: **Workspace settings → OAuth consumers → Add consumer**.
   - **Callback URL**: `https://wekan.example.com/_oauth/oidc` (your
     `ROOT_URL` followed by `/_oauth/oidc`).
   - **This is a private consumer**: on.
   - **Permissions**: *Account: Read*, and *Account: Email* if you want the
     email scope.
   - Save, and open the consumer for its **Key** and **Secret**.
2. Set WeKan's environment (or Admin Panel → Authentication → OAuth2):

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

## Rocket.Chat providing OAuth2 login to Wekan

- [More RocketChat fixes here](../Webhooks/Chat/RocketChat.md)
- [RocketChat Skip Install Registration Wizard Fix](https://github.com/RocketChat/Rocket.Chat/issues/31163#issuecomment-1848364117)

> So for someone using snap, it means creating a file `/var/snap/rocketchat-server/common/override-setup-wizard.env ` (the name of the file itself could be anything as long as it has an .env extension) and setting its content to `OVERWRITE_SETTING_Show_Setup_Wizard=completed`
> 
> Then, restarting the server by `systemctl restart snap.rocketchat-server.rocketchat-server.service`

- [RocketChat Webhook workaround](https://github.com/wekan/univention/issues/15)

Also, if you have Rocket.Chat using LDAP/SAML/Google/etc for logging into Rocket.Chat, then same users can login to Wekan when Rocket.Chat is providing OAuth2 login to Wekan.

### Rocket.Chat signing in with SAML (G Suite / Google Workspace), then WeKan

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
   Panel → Authentication → OAuth2. With redirect, the whole browser tab goes
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

If there is existing username/password account in Wekan, OAuth2 merges both logins.

Source: [OAuth2 Pull Request](https://github.com/wekan/wekan/pull/1578)

# Docker

https://github.com/wekan/wekan-mongodb/blob/master/docker-compose.yml#L146-L166

# Snap

### 1) Install Rocket.Chat

[Rocket.Chat Snap](https://rocket.chat/docs/installation/manual-installation/ubuntu/snaps/) has Node at port 3000 and mongodb at port 27017.
```
sudo snap install rocketchat-server
sudo systemctl disable rocketchat-server.rocketchat-caddy
sudo systemctl stop rocketchat-server.rocketchat-caddy
```

### 2) Install Wekan

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

### 3) Add Rocket.Chat settings

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

### 4) Add Wekan settings
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
sudo snap set wekan oauth2-id-map='preffered_username'
sudo snap set wekan oauth2-username-map='preffered_username'
sudo snap set wekan oauth2-fullname-map='preffered_username'
sudo snap set wekan oauth2-email-map='email'
```
### If login does not work, debug it
```
sudo snap set wekan debug='true'
```
Click Oidc button. Then:
```
sudo snap logs wekan.wekan
sudo systemctl status snap.wekan.wekan
```

### 5) Login to Wekan

1) Go to https://boards.example.com

2) Click `Sign in with Oidc`

3) Click `Authorize` . This is asked only first time when logging in to Wekan with Rocket.Chat.

<img src="https://wekan.fi/oauth2-login.png" width="60%" alt="Wekan login to Rocket.Chat" />

### 6) Set your Full Name

Currently Full Name is not preserved, so you need to change it.

1) Click `Your username / Profile`

2) Add info and Save.

<img src="https://wekan.fi/oauth2-profile-settings.png" width="60%" alt="Wekan login to Rocket.Chat" />

### 7) Add more login options to Rocket.Chat

1) At Rocket.Chat, Click: (3 dots) Options / Administration

2) There are many options at OAuth menu. Above and below of OAuth are also CAS, LDAP and SAML.

<img src="https://wekan.fi/oauth-rocketchat-options.png" width="100%" alt="Wekan login to Rocket.Chat" />

# Auth0

[Auth0](https://auth0.com) can provide PasswordlessEmail/Google/Facebook/LinkedIn etc login options to Wekan.

### 1) Auth0 / Applications / Add / Regular Web Application / Auth0 Settings

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

2) Auth0 Dashboard => Rules => Add Rule

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

### 3) Snap settings, change to it from above client-id, secret, server-url and web-origin (=namespace for rules function above).

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

### 4) Auth0 ID provider to Custom OAuth RocketChat

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

# Spring Authorization Server

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

# lemonldapng

Official documentation : https://lemonldap-ng.org/documentation/latest/applications/wekan

## Wekan Config

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

## LemonLDAP::NG Config

You need to set a new OpenID Connect Relay Party (RP) with theses parameters : 

* Client ID: the same you set in Wekan configuration (same as OAUTH2_CLIENT_ID)
* Client Secret: the same you set in Wekan configuration (same as OAUTH2_SECRET)
* Add the following exported attributes
    * name: session attribute containing the user's full name
    * email: session attribute containing the user's email or _singleMail

See LLNG doc for more details
