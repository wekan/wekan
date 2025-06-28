### Install for example from:
- [Snap](Snap)
- [Docker](Docker)

*Make sure you are running at least **v2.21***

### Redirect URL

[About AZURE-NEW-APP-CLIENT-ID and AZURE-NEW-APP-SECRET](https://community.microfocus.com/t5/Identity-Manager-Tips/Creating-the-application-Client-ID-and-Client-Secret-from/ta-p/1776619). The redirect URL is your Wekan root-url+_oauth/oidc like this: https://boards.example.com/_oauth/oidc

<img src="https://wekan.github.io/azure-redirect.png" width="100%" alt="Wekan logo" />

AZURE_DIRECTORY_ID = TENANT-NAME-FOR-YOUR-ORGANIZATION

### If Azure Active Directory login does not work

Check that your CLIENT_SECRET = AZURE-NEW-APP-SECRET has not expired. If it has, delete old secret, and add new secret.
Add it like this, and also check that your Azure Directory ID is in server URL:

```
sudo snap set wekan oauth2-secret='AZURE-CLIENT-SECRET'

sudo snap set wekan oauth2-server-url='https://login.microsoftonline.com/AZURE_DIRECTORY_ID'
```

<img src="https://wekan.github.io/azure-app-client-secret.png" width="100%" alt="Azure App Client Secret" />


###


## Note: Mailjet is not available at Azure anymore

Instead, use O365 at upcoming Wekan v5.38 or newer.

### Mailjet: getaddrinfo ENOTFOUND

With Wekan Snap and Mailjet, if you get getaddrinfo ENOTFOUND error when you try to send a test email from within Wekan, it can be something with networking for the snap. Fix can be found in [Ubuntu DNS resolution issue affecting other snap packages](https://github.com/nextcloud/nextcloud-snap/issues/881). Thanks to [peterk for info](https://github.com/wekan/wekan/issues/3184#issuecomment-699669350).

### Mailjet: mail-from

When using sending email with Mailjet, set `mail-from` to some real email address so you get info if email bounces back.

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
sudo snap set wekan richer-card-comment-editor='false'
sudo snap set wekan root-url='https://boards.example.com'
sudo snap set wekan with-api='true'
```

At Admin Panel / Settings / Email:
- SMTP Host: `in-v3.mailjet.com`
- SMTP Port: `465`
- Username: `MAILJET-USERNAME`
- Password: `MAILJET-PASSWORD`
- TLS Support: `[_]` (not checked)

If you use Caddy Let's Encrypt SSL for public server, that requires SSL cert validation from multiple not-listed IP addresses of Let's Encrypt, file `/var/snap/wekan/common/Caddyfile`

```
boards.example.com {
  tls {
      alpn http/1.1
  }
  proxy / localhost:3001 {
    websocket
    transparent
  }
}

# If you have static main website in this directory, also add it:
example.com {
  root /var/snap/wekan/common/example.com
  tls {
      alpn http/1.1
  }
}
```
If you have private server that should be only accessible from private IP (limited by Azure firewall settings), and need SSL, you can not use Let's Encrypt free SSL that validates public availability from multiple non-disclosed IP addresses. For this purpose, you can get SSL certificate. Here is example of SSL cert from with SSL.com .

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
  root /var/snap/wekan/common/example.com
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
  proxy / localhost:3001 {
    websocket
    transparent
  }
}
```
Optionally you can would like to [disable all Snap automatic updates](https://github.com/wekan/wekan-snap/wiki/Automatic-update-schedule#if-required-you-can-disable-all-snap-updates) (not recommended, only required by some clients).

### There are two major steps for configuring Wekan to authenticate to Azure AD via OpenID Connect (OIDC)

Note: These old docs below don't have all settings listed that above new Snap settings have. Text case and _- is different, for example at Docker there is `OAUTH2_ENABLED=true` when at Snap same setting is `sudo snap set wekan oauth-enabled='true'`

1. Register the application with Azure. Make sure you capture the application ID as well as generate a secret key.
2. Configure the environment variables.  This differs slightly by installation type, but make sure you have the following:
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

I also recommend setting DEBUG = true until you have a working configuration.  It helps.

You may also find it useful to look at the following configuration information:
https://login.microsoftonline.com/**the-tenant-name-for-your-organization**/v2.0/.well-known/openid-configuration

Some Azure links also at wiki page about moving from Sandstorm to Docker/Snap , and using Docker Swarm:
- https://github.com/wekan/wekan/wiki/Export-from-Wekan-Sandstorm-grain-.zip-file#azure-links