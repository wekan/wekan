- [More RocketChat fixes here](https://github.com/wekan/wekan/wiki/RocketChat)
- [OAuth2 small bug](https://github.com/wekan/wekan/issues/1874) - currently OAuth2 works mostly

# OAuth2 providers

You can use some OAuth2 providers for logging into Wekan, for example:
- [Auth0](OAuth2#auth0) - works
- [Rocket.Chat](OAuth2#rocketchat-providing-oauth2-login-to-wekan) - works
- [GitLab](OAuth2#gitlab-providing-oauth2-login-to-wekan) - works
- Google - not tested yet
- [LemonLDAP::NG](OAuth2#lemonldapng) - works

You can ask your identity provider (LDAP, SAML etc) do they support adding OAuth2 application like Wekan.

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

## Rocket.Chat providing OAuth2 login to Wekan

- [More RocketChat fixes here](https://github.com/wekan/wekan/wiki/RocketChat)
- [RocketChat Skip Install Registration Wizard Fix](https://github.com/RocketChat/Rocket.Chat/issues/31163#issuecomment-1848364117)

> So for someone using snap, it means creating a file `/var/snap/rocketchat-server/common/override-setup-wizard.env ` (the name of the file itself could be anything as long as it has an .env extension) and setting its content to `OVERWRITE_SETTING_Show_Setup_Wizard=completed`
> 
> Then, restarting the server by `systemctl restart snap.rocketchat-server.rocketchat-server.service`

- [RocketChat Webhook workaround](https://github.com/wekan/univention/issues/15)

Also, if you have Rocket.Chat using LDAP/SAML/Google/etc for logging into Rocket.Chat, then same users can login to Wekan when Rocket.Chat is providing OAuth2 login to Wekan.

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
Email settings [ARE NOT REQUIRED](Troubleshooting-Mail), Wekan works without setting up Email.
```
sudo snap set wekan mail-url='smtps://user:pass@MAILSERVER.YOURDOMAIN.COM:453'
sudo snap set wekan mail-from='Wekan Boards <support@YOURDOMAIN.COM>'
```
Edit Caddyfile:
```
sudo nano /var/snap/wekan/common/Caddyfile
```
Add Caddy config. This uses free Let's Encrypt SSL. You can also use [free CloudFlare wildcard SSL or any other SSL cert](Caddy-Webserver-Config).
```
boards.yourdomain.com {
        proxy / localhost:3001 {
          websocket
          transparent
        }
}

chat.yourdomain.com {
        proxy / localhost:3000 {
          websocket
          transparent
        }
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

<img src="https://wekan.github.io/oauth2-login.png" width="60%" alt="Wekan login to Rocket.Chat" />

### 6) Set your Full Name

Currently Full Name is not preserved, so you need to change it.

1) Click `Your username / Profile`

2) Add info and Save.

<img src="https://wekan.github.io/oauth2-profile-settings.png" width="60%" alt="Wekan login to Rocket.Chat" />

### 7) Add more login options to Rocket.Chat

1) At Rocket.Chat, Click: (3 dots) Options / Administration

2) There are many options at OAuth menu. Above and below of OAuth are also CAS, LDAP and SAML.

<img src="https://wekan.github.io/oauth-rocketchat-options.png" width="100%" alt="Wekan login to Rocket.Chat" />

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
