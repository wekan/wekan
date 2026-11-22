# Azure Active Directory (Microsoft Entra ID) login

## What it is

Azure Active Directory, now called Microsoft Entra ID, is Microsoft's cloud
identity service. WeKan signs users in with it through its generic OAuth2 /
OpenID Connect login: Azure is the identity provider, WeKan is a registered
application, and the OIDC button on WeKan's sign-in page sends the user to
Microsoft's login page and back. This page also has the Snap, email and
Caddy/SSL settings of one complete Azure-hosted WeKan.

## Read more

- [Microsoft Entra ID on Wikipedia](https://en.wikipedia.org/wiki/Microsoft_Entra_ID)
- [Microsoft: OpenID Connect on the Microsoft identity platform](https://learn.microsoft.com/en-us/entra/identity-platform/v2-protocols-oidc)
- [OpenID on Wikipedia](https://en.wikipedia.org/wiki/OpenID)
- [About AZURE-NEW-APP-CLIENT-ID and AZURE-NEW-APP-SECRET](https://community.microfocus.com/t5/Identity-Manager-Tips/Creating-the-application-Client-ID-and-Client-Secret-from/ta-p/1776619)
- WeKan: [OAuth2](../OAuth2.md), [Azure AD B2C](../B2C.md), [ADFS](../ADFS.md),
  [Admin Panel / People / E-mail](../../Admin-Panel/People/E-mail.md)

## How to use it

Install for example from:
- [Snap](../../../Platforms/FOSS/Container/Snap)
- [Docker](../../../Platforms/FOSS/Container/Docker)

*Make sure you are running at least **v2.21***

There are two major steps for configuring WeKan to authenticate to Azure AD
via OpenID Connect (OIDC):

1. Register the application with Azure. Make sure you capture the application
   ID as well as generate a secret key. The redirect URL is your WeKan
   root-url+_oauth/oidc like this: https://boards.example.com/_oauth/oidc

   <img src="azure-redirect.png" width="100%" alt="Azure Redirect" />

   AZURE_DIRECTORY_ID = TENANT-NAME-FOR-YOUR-ORGANIZATION
2. Configure the environment variables. This differs slightly by installation
   type (text case and `_`/`-` differ: in Docker it is `OAUTH2_ENABLED=true`,
   in Snap the same setting is `sudo snap set wekan oauth2-enabled='true'`),
   but make sure you have the following:
   * OAUTH2_ENABLED = true
   * OAUTH2_CLIENT_ID = xxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxx (application GUID captured during app registration)
   * OAUTH2_SECRET = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx (secret key generated during app registration)
   * OAUTH2_SERVER_URL = https://login.microsoftonline.com/<tenant GUID specific to your organization>
   * OAUTH2_AUTH_ENDPOINT = /oauth2/v2.0/authorize
   * OAUTH2_USERINFO_ENDPOINT = https://graph.microsoft.com/oidc/userinfo
   * OAUTH2_TOKEN_ENDPOINT = /oauth2/v2.0/token
   * OAUTH2_ID_MAP = email (the claim name you want to map to the unique ID field)
   * OAUTH2_USERNAME_MAP = email (the claim name you want to map to the username field)
   * OAUTH2_FULLNAME_MAP = name (the claim name you want to map to the full name field)
   * OAUTH2_EMAIL_MAP = email (the claim name you want to map to the email field)

   These old docs do not have all settings listed that the Snap settings
   below have. The same settings can also be overridden in
   **Admin Panel / People / OAuth2** (`/admin/people/oidc`).
3. Open WeKan at its `ROOT_URL` and click the OIDC button on the sign-in page.

I also recommend setting DEBUG = true until you have a working configuration.
It helps.

You may also find it useful to look at the following configuration information:
https://login.microsoftonline.com/**the-tenant-name-for-your-organization**/v2.0/.well-known/openid-configuration

### Snap settings

```
sudo snap set wekan debug='true'
sudo snap set wekan caddy-enabled='true'
sudo snap set wekan mail-from='Example Boards <BOARD-ADMIN@example.com>'
sudo snap set wekan mail-url='smtps://username:password@in-v3.mailjet.com:465/'
sudo snap set wekan oauth2-enabled='true'
sudo snap set wekan oauth2-request-permissions='openid'
sudo snap set wekan oauth2-client-id='AZURE-NEW-APP-CLIENT-ID'
sudo snap set wekan oauth2-secret='AZURE-NEW-APP-SECRET'
sudo snap set wekan oauth2-auth-endpoint='/oauth2/v2.0/authorize'
sudo snap set wekan oauth2-server-url='https://login.microsoftonline.com/AZURE_DIRECTORY_ID'
sudo snap set wekan oauth2-token-endpoint='/oauth2/v2.0/token'
sudo snap set wekan oauth2-userinfo-endpoint='https://graph.microsoft.com/oidc/userinfo'
sudo snap set wekan oauth2-email-map='email'
sudo snap set wekan oauth2-username-map='email'
sudo snap set wekan oauth2-fullname-map='name'
sudo snap set wekan oauth2-id-map='email'
sudo snap set wekan port='3001'
sudo snap set wekan root-url='https://boards.example.com'
sudo snap set wekan with-api='true'
```

### Email

**Note: Mailjet is not available at Azure anymore.** Instead, use O365 at
WeKan v5.38 or newer.

At **Admin Panel / People / E-mail** (it was Admin Panel / Settings / Email):
- SMTP Host: `in-v3.mailjet.com`
- SMTP Port: `465`
- Username: `MAILJET-USERNAME`
- Password: `MAILJET-PASSWORD`
- TLS support: `[_]` (not checked)

**Mailjet: getaddrinfo ENOTFOUND.** With WeKan Snap and Mailjet, if you get
getaddrinfo ENOTFOUND error when you try to send a test email from within
WeKan, it can be something with networking for the snap. Fix can be found in
[Ubuntu DNS resolution issue affecting other snap packages](https://github.com/nextcloud-snap/nextcloud-snap/issues/881).
Thanks to [peterk for info](https://github.com/wekan/wekan/issues/3184#issuecomment-699669350).

**Mailjet: mail-from.** When using sending email with Mailjet, set
`mail-from` to some real email address so you get info if email bounces back.

### Caddy and SSL

If you use Caddy Let's Encrypt SSL for public server, that requires SSL cert
validation from multiple not-listed IP addresses of Let's Encrypt, file
`/var/snap/wekan/common/Caddyfile`

```
boards.example.com {
  tls {
      alpn http/1.1
  }
  reverse_proxy localhost:3001
}

# If you have static main website in this directory, also add it:
example.com {
  root * /var/snap/wekan/common/example.com
  file_server
  tls {
      alpn http/1.1
  }
}
```
If you have private server that should be only accessible from private IP
(limited by Azure firewall settings), and need SSL, you can not use Let's
Encrypt free SSL that validates public availability from multiple
non-disclosed IP addresses. For this purpose, you can get SSL certificate.
Here is example of SSL cert from with SSL.com .

Join certificates together to .pem file, in order of:
1) privatekey of example.com
2) wildcard (or one subdomain cert) of example.com
3) sub ca
4) root ca
5) trusted network ca
```
cat example_com.key >> example.com.pem
cat STAR_example_com.crt >> example.com.pem 
cat SSL_COM_RSA_SSL_SUBCA.crt >> example.com.pem 
cat SSL_COM_ROOT_CERTIFICATION_AUTHORITY_RSA.crt >> example.com.pem 
cat CERTUM_TRUSTED_NETWORK_CA.crt >> example.com.pem 
```
Then transfer SSL cert to server:
```
scp example.com.pem ubuntu@example.com:/home/ubuntu
ssh ubuntu@example.com
sudo mkdir /var/snap/wekan/common/certs
sudo mv example.com.pem /var/snap/wekan/common/certs/
sudo chown root:root /var/snap/wekan/common/certs/example.com.pem
sudo chmod og-rwx /var/snap/wekan/common/certs/example.com.pem
sudo nano /var/snap/wekan/common/Caddyfile
```
At Caddyfile, add these settings for SSL cert:
```
# Static main website, if you have that, redirect to SSL
http://example.com {
  redir https://example.com
}

# Wekan redirect to SSL
http://boards.example.com {
  redir https://boards.example.com
}

# Static main website, if you have that in this directory
https://example.com {
  root * /var/snap/wekan/common/example.com
  file_server
  tls {
      load /var/snap/wekan/common/certs
      alpn http/1.1
  }
}

# Wekan
https://boards.example.com {
  tls {
      load /var/snap/wekan/common/certs
      alpn http/1.1
  }
  reverse_proxy localhost:3001
}
```
Optionally you can would like to [disable all Snap automatic updates](https://github.com/wekan/wekan-snap/wiki/Automatic-update-schedule#if-required-you-can-disable-all-snap-updates)
(not recommended, only required by some clients).

## How the numbers are calculated

Azure login has no numbers of its own. The OAuth2 login's session expiry is
`now + 1000 * expires_in` milliseconds, 3600 seconds when the token response
has no `expires_in`
([packages/wekan-oidc/oidc_server.js](../../../../packages/wekan-oidc/oidc_server.js)).
The ports above (465 for SMTPS, 3001 for WeKan behind Caddy) are this
example's choices, not WeKan defaults.

## How it works in WeKan

- Azure uses the generic OIDC login:
  [packages/wekan-oidc/oidc_client.js](../../../../packages/wekan-oidc/oidc_client.js)
  sends the browser to `OAUTH2_SERVER_URL` + `OAUTH2_AUTH_ENDPOINT`;
  [packages/wekan-oidc/oidc_server.js](../../../../packages/wekan-oidc/oidc_server.js)
  exchanges the code at the token endpoint and reads the claims from
  `OAUTH2_USERINFO_ENDPOINT`. An absolute userinfo URL such as
  `https://graph.microsoft.com/oidc/userinfo` is used as written; a relative
  one is joined to the server URL
  ([packages/wekan-oidc/endpoint.js](../../../../packages/wekan-oidc/endpoint.js)).
- The settings are section `oidc` of
  [models/lib/authConfigCatalog.js](../../../../models/lib/authConfigCatalog.js),
  resolved per login (Admin Panel value first, then the environment).
- Tests: [tests/oidcEndpoint.test.cjs](../../../../tests/oidcEndpoint.test.cjs),
  [tests/oauth2LoginStyle.test.cjs](../../../../tests/oauth2LoginStyle.test.cjs).

### If Azure Active Directory login does not work

Check that your CLIENT_SECRET = AZURE-NEW-APP-SECRET has not expired. If it
has, delete old secret, and add new secret. Add it like this, and also check
that your Azure Directory ID is in server URL:

```
sudo snap set wekan oauth2-secret='AZURE-CLIENT-SECRET'

sudo snap set wekan oauth2-server-url='https://login.microsoftonline.com/AZURE_DIRECTORY_ID'
```

<img src="azure-app-client-secret.png" width="100%" alt="Azure App Client Secret" />

Some Azure links also at the page about moving from Sandstorm to Docker/Snap,
and using Docker Swarm:
- [Export from Wekan Sandstorm grain .zip file: Azure links](../../../Platforms/FOSS/Container/Sandstorm/Export-from-Wekan-Sandstorm-grain-.zip-file.md#azure-links)

## Commits

 - [Admin Panel / People / OAuth2 can override every OAuth2 setting](https://github.com/wekan/wekan/commit/eb49a4b1b6853650823434e924f5d0dc47a4fe5b)
 - [Log in by full-page redirect by default](https://github.com/wekan/wekan/commit/ad51a03731ed2daf039204ccc7423dd05b3c9506)
 - [Resolve absolute userinfo endpoints such as Microsoft Graph's](https://github.com/wekan/wekan/commit/aee94c2637594cd154be3973e68033aa77a3e6d3)
 - [OIDC token and userinfo requests use fetch](https://github.com/wekan/wekan/commit/49a272d6c0a8d5fbcd2a4b6824acc0f7b77336b4)
 - [Caddyfile examples are Caddy 2](https://github.com/wekan/wekan/commit/37d23976034ba10886956e92ca57ebc599c5fb89)
 - [Updated image links at the Azure docs](https://github.com/wekan/wekan/commit/6d16ec238a00f456494c84e08ea13eb166e42f6e)
