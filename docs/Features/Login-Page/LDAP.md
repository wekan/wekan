# LDAP

## What it is

LDAP login lets people sign in to WeKan with the username and password they
already have in the organization's directory: Active Directory, OpenLDAP,
FreeIPA, 389 DS, Univention and others. WeKan checks the password against the
directory, creates the WeKan account at the first login, and can keep names,
emails, admin status, Organizations and Teams in step with the directory's
users and groups, also by a background sync while nobody logs in.

## Read more

- [Lightweight Directory Access Protocol on Wikipedia](https://en.wikipedia.org/wiki/Lightweight_Directory_Access_Protocol)
- [Active Directory on Wikipedia](https://en.wikipedia.org/wiki/Active_Directory)
- [Microsoft: LDAP search filter syntax](https://learn.microsoft.com/en-us/windows/win32/adsi/search-filter-syntax)
- [ldapts](https://github.com/ldapts/ldapts), the LDAP client library WeKan uses
- [later.js text parser](https://bunkat.github.io/later/parsers.html), the
  format of `LDAP_BACKGROUND_SYNC_INTERVAL` text
- [LDAP sync script, that also correctly removes users](./ldap-sync/ldap-sync.py)
- [LDAP AD Simple Auth](./LDAP-AD-Simple-Auth.md) 2021-07-24 and related [Search Filter Settings](https://github.com/wekan/wekan/issues/3908#issuecomment-887545168):

```
- LDAP_USER_SEARCH_FILTER=(objectClass=user)
- LDAP_EMAIL_FIELD=mail
```

- [MS AD with Windows 2012 server](https://github.com/wekan/wekan/issues/3292#issuecomment-703246384)
- [Additional info about LDAP docs here](https://github.com/wekan/wekan-ldap/issues/77)
- [LDAP issues](https://github.com/wekan/wekan-ldap/issues)
- [Univention LDAP related issues](https://github.com/wekan/univention/issues)
- [Teams/Organizations feature related LDAP plans](https://github.com/wekan/wekan/issues/802). Needs info from LDAP experts to describe how LDAP works.
- [Wekan LDAP code](../../../packages/wekan-ldap)
- WeKan: [LDAP AD Simple Auth](LDAP-AD-Simple-Auth.md),
  [Admin Panel / People / Login](../Admin-Panel/People/Login.md),
  [Organizations](../Admin-Panel/People/Organizations.md),
  [Teams](../Admin-Panel/People/Teams.md)

## How to use it

1. Set at least `LDAP_ENABLE=true`, `LDAP_HOST`, `LDAP_PORT`,
   `LDAP_ENCRYPTION` and `LDAP_BASEDN`, and how users are found
   (`LDAP_USER_SEARCH_FIELD`, `LDAP_USER_SEARCH_FILTER`, `LDAP_USERNAME_FIELD`,
   `LDAP_EMAIL_FIELD`, ...), either with a service account
   (`LDAP_AUTHENTIFICATION=true`, `LDAP_AUTHENTIFICATION_USERDN`,
   `LDAP_AUTHENTIFICATION_PASSWORD`) or with the user's own bind
   (`LDAP_USER_AUTHENTICATION=true`). The examples below show complete sets for
   Active Directory, FreeIPA and OpenLDAP.
2. Or set them in **Admin Panel / People / LDAP** (`/admin/people/ldap`): a
   saved value wins over the environment variable, and **Default** gives the
   variable back.
3. Click **Test LDAP Connection** there to try the settings in effect.
4. Make LDAP the method of the sign-in button: `DEFAULT_AUTHENTICATION_METHOD=ldap`
   (snap `default-authentication-method='ldap'`), or choose it in Admin Panel /
   People / Login.
5. Sign in on the sign-in page with the directory username and password.
6. Optional: turn on background sync (`LDAP_BACKGROUND_SYNC=true`), and click
   **Sync LDAP users now** in Admin Panel / People / LDAP to run it at once.

### Snap

LDAP is available on Snap Stable channel. Settings can be seen with command `wekan.help` and from repo https://github.com/wekan/wekan-ldap . More settings at https://github.com/wekan/wekan-snap/wiki/Supported-settings-keys

You see all settings with:
```
wekan.help | less
```
For root-url, see [Settings](../../Platforms/Webserver/Settings.md)

For Caddy/Wekan/RocketChat Snap settings, see [Snap install page](https://github.com/wekan/wekan-snap/wiki/Install), [OAuth2 page](./OAuth2.md#snap) and [Caddy page](../../Platforms/Webserver/Caddy.md). Instead of Caddy you can also use [Nginx](../../Platforms/Webserver/Nginx.md) or [Apache](../../Platforms/Webserver/Apache.md).

### LDAP Filter settings

For better working LDAP filter setting than those below, settings info here:
https://github.com/wekan/univention/issues/5

#### Active Directory LDAP part
[Source](https://github.com/wekan/wekan/issues/2822#issuecomment-568314135)
```
sudo snap set wekan ldap-enable='true'
sudo snap set wekan default-authentication-method='ldap'
sudo snap set wekan ldap-port='389'
sudo snap set wekan ldap-host='192.168.1.100'
sudo snap set wekan ldap-basedn='OU=Domain Users,DC=sub,DC=domain,DC=tld'
sudo snap set wekan ldap-login-fallback='false'
sudo snap set wekan ldap-reconnect='true'
sudo snap set wekan ldap-timeout='10000'
sudo snap set wekan ldap-idle-timeout='10000'
sudo snap set wekan ldap-connect-timeout='10000'
sudo snap set wekan ldap-authentication='true'
sudo snap set wekan ldap-authentication-userdn='CN=LDAP-User,OU=Service Accounts,DC=sub,DC=domain,DC=tld'
sudo snap set wekan ldap-authentication-password='<password>'
sudo snap set wekan ldap-log-enabled='true'
sudo snap set wekan ldap-background-sync='true'
# LDAP_BACKGROUND_SYNC_INTERVAL : How often the background task syncs: milliseconds (3600000 = hourly) or text
# Text is later.js text, quotes allowed, as specified in:
# https://bunkat.github.io/later/parsers.html#text
#sudo snap set wekan ldap-background-sync-interval='every 1 hours'
# Milliseconds (3600000 = hourly) or later.js text such as every 1 hours.
# If not in use, leave this unset: it uses the default (hourly).
# https://github.com/wekan/wekan/issues/2354#issuecomment-515305722
#sudo snap set wekan ldap-background-sync-interval=''
sudo snap set wekan ldap-background-sync-interval='every 1 hours'
sudo snap set wekan ldap-background-sync-keep-existant-users-updated='true'
sudo snap set wekan ldap-background-sync-import-new-users='true'
sudo snap set wekan ldap-encryption='false'
sudo snap set wekan ldap-user-search-field='sAMAccountName'
sudo snap set wekan ldap-username-field='sAMAccountName'
sudo snap set wekan ldap-fullname-field='cn'
```

#### FreeIPA v4.6.6

[Source](https://github.com/wekan/wekan/issues/3357)

```bash
snap set wekan ldap-enable='true'
snap set wekan ldap-host='ldap.example.com'

# Use 'starttls' and port 389 to negotiate TLS with STARTTLS.
snap set wekan ldap-port='389'
snap set wekan ldap-encryption='starttls'

snap set wekan ldap-timeout='10000'
snap set wekan ldap-idle-timeout='10000'
snap set wekan ldap-connect-timeout='10000'
snap set wekan ldap-authentication='true'
snap set wekan ldap-authentication-userdn='uid=ldapuser,cn=users,cn=accounts,dc=example, dc=com'
snap set wekan ldap-authentication-password='password'

# This must be set to "false" for self-signed certificates to work - enable it
# for better security if you are using a certificate verified by a commercial
# Certificate Authority (like DigiCert, Let's Encrypt, etc.)
snap set wekan ldap-reject-unauthorized='false'


# This must be the plaintext certificate data, which you can get by running the
# follwing command:
#     cat ca.example.com.pem | tr -d '\n'
# This removes the hidden newline characters, and allows you to copy it
# straight from your terminal and past it into the snap set command.
#
# Pointing it to a file doesn't work - I tried.
snap set wekan ldap-ca-cert='-----BEGIN CERTIFICATE-----[blahblahblah]-----END CERTIFICATE-----'

snap set wekan ldap-log-enabled='true'
snap set wekan ldap-basedn='dc=example,dc=com'
snap set wekan ldap-background-sync='true'
snap set wekan ldap-background-sync-keep-existant-users-updated='true'
snap set wekan ldap-background-sync-import-new-users='true'
# LDAP_BACKGROUND_SYNC_INTERVAL : How often the background task syncs: milliseconds (3600000 = hourly) or text
# Text is later.js text, quotes allowed, as specified in:
# https://bunkat.github.io/later/parsers.html#text
#sudo snap set wekan ldap-background-sync-interval='every 1 hours'
# Milliseconds (3600000 = hourly) or later.js text such as every 1 hours.
# If not in use, leave this unset: it uses the default (hourly).
# https://github.com/wekan/wekan/issues/2354#issuecomment-515305722
#sudo snap set wekan ldap-background-sync-interval=''
snap set wekan ldap-background-sync-interval='every 1 hours'
snap set wekan ldap-merge-existing-users='true'
snap set wekan ldap-user-search-field='uid'
snap set wekan ldap-user-search-filter='(&(objectclass=person))'
snap set wekan ldap-user-search-scope='sub'
snap set wekan ldap-username-field='uid'
snap set wekan ldap-fullname-field='displayName'
snap set wekan ldap-email-field='mail'
snap set wekan ldap-sync-user-data='true'
snap set wekan ldap-sync-user-data-fieldmap='{"displayName":"name", "mail":"email", "initials":"initials"}'
```

#### OpenLDAP
[Source](https://github.com/wekan/wekan/issues/2822#issuecomment-564451384)
```
sudo snap set wekan default-authentication-method='ldap'
sudo snap set wekan ldap-authentication='true'
sudo snap set wekan ldap-authentication-password='********'
sudo snap set wekan ldap-authentication-userdn='cn=admin,dc=*******,dc=lan'
sudo snap set wekan ldap-background-sync='true'
sudo snap set wekan ldap-background-sync-import-new-users='true'
# LDAP_BACKGROUND_SYNC_INTERVAL : How often the background task syncs: milliseconds (3600000 = hourly) or text
# Text is later.js text, quotes allowed, as specified in:
# https://bunkat.github.io/later/parsers.html#text
#sudo snap set wekan ldap-background-sync-interval='every 1 hours'
# Milliseconds (3600000 = hourly) or later.js text such as every 1 hours.
# If not in use, leave this unset: it uses the default (hourly).
# https://github.com/wekan/wekan/issues/2354#issuecomment-515305722
#sudo snap set wekan ldap-background-sync-interval=''
sudo snap set wekan ldap-background-sync-interval='every 1 hours'
sudo snap set wekan ldap-basedn='dc=*****,dc=lan'
sudo snap set wekan ldap-email-field='mail'
sudo snap set wekan ldap-enable='true'
sudo snap set wekan ldap-fullname-field='cn'
sudo snap set wekan ldap-group-filter-enable='false'
sudo snap set wekan ldap-group-filter-id-attribute='cn'
sudo snap set wekan ldap-group-filter-objectclass='groupOfUniqueNames'
sudo snap set wekan ldap-host='192.168.100.7'
sudo snap set wekan ldap-log-enabled='false'
sudo snap set wekan ldap-login-fallback='true'
sudo snap set wekan ldap-merge-existing-users='true'
sudo snap set wekan ldap-port='389'
sudo snap set wekan ldap-sync-admin-groups='administrator'
sudo snap set wekan ldap-user-search-field='uid'
sudo snap set wekan ldap-user-search-filter='(&(objectclass=inetOrgPerson))'
sudo snap set wekan ldap-user-search-scope='sub'
sudo snap set wekan ldap-username-field='uid'
```

### Docker

LDAP login works now by using this docker-compose.yml file:
[docker-compose.yml](../../../docker-compose.yml) (the `edge`
branch address this page used to link no longer exists), adding ROOT_URL, LDAP settings etc to that file.

Using this docker-compose:
https://docs.docker.com/compose/install/

With this command:
``` 
docker-compose up -d --no-build
```

### Example LDAP settings for Docker

Note: Some newer settings could be missing from example below. Someone could copy newest missing settings from docker-compose.yml above to example below. Some examples are also at closed and open issues at https://github.com/wekan/wekan-ldap/issues

```
services:

  wekandb:
    # All Wekan data is stored in MongoDB. For backup and restore, see:
    #   [Export Docker Mongo Data](../../Platforms/FOSS/Container/Docker/Export-Docker-Mongo-Data.md)
    # MongoDB 7. For the replica set that Meteor's change streams use, and for
    # FerretDB (the default database), see docker-compose-mongodb-v7.yml and
    # docker-compose.yml at the repository root.
    image: mongo:7
    container_name: wekan-db
    restart: always
    command: mongod --oplogSize 128
    networks:
      - wekan-tier
    expose:
      - 27017
    volumes:
      - wekan-db:/data/db
      - wekan-db-dump:/dump

  wekan:
    # Wekan container only has Node.js and related code,
    # there is no data stored here.
    #
    # Also at Quay (quay.io/wekan/wekan) and Docker Hub (wekanteam/wekan).
    image: ghcr.io/wekan/wekan:latest
    container_name: wekan-app
    restart: always
    networks:
      - wekan-tier
    #---------------------------------------------------------------
    # For running Wekan in different port like 3000, use: 3000:80
    ports:
      - 3000:3000
    environment:
      #---------------------------------------------------------------
      # == ROOT_URL SETTING ==
      # Change ROOT_URL to your real Wekan URL, for example:
      #   http://example.com
      #   http://example.com/wekan
      #   http://192.168.1.100
      #---------------------------------------------------------------
      - ROOT_URL=
      #---------------------------------------------------------------
      # == PORT SETTING ==
      # Not needed on Docker, but if you had installed from source,
      #   you could also have setup Wekan Node.js port at localhost
      #   with setting: PORT=3001
      #   and have Nginx proxy to port 3001, see Wekan wiki.
      #---------------------------------------------------------------
      - PORT=3000
      #---------------------------------------------------------------
      # == MONGO URL AND OPLOG SETTINGS ==
      # https://github.com/wekan/wekan-mongodb/issues/2#issuecomment-378343587
      # We've fixed our CPU usage problem today with an environment
      # change around Wekan. I wasn't aware during implementation
      # that if you're using more than 1 instance of Wekan
      # (or any MeteorJS based tool) you're supposed to set
      # MONGO_OPLOG_URL as an environment variable.
      # Without setting it, Meteor will perform a pull-and-diff
      # update of it's dataset. With it, Meteor will update from
      # the OPLOG. See here
      #   https://blog.meteor.com/tuning-meteor-mongo-livedata-for-scalability-13fe9deb8908
      # After setting
      # MONGO_OPLOG_URL=mongodb://<username>:<password>@<mongoDbURL>/local?authSource=admin&replicaSet=rsWekan
      # the CPU usage for all Wekan instances dropped to an average
      # of less than 10% with only occasional spikes to high usage
      # (I guess when someone is doing a lot of work)
      #---------------------------------------------------------------
      - MONGO_URL=mongodb://wekandb:27017/wekan
      #---------------------------------------------------------------
      # - MONGO_OPLOG_URL=mongodb://<username>:<password>@<mongoDbURL>/local?authSource=admin&replicaSet=rsWekan
      #---------------------------------------------------------------
      # == EMAIL SETTINGS ==
      # Email settings are required in both MAIL_URL and Admin Panel,
      #   see [Troubleshooting Mail](../Email/Troubleshooting-Mail.md)
      #   For SSL in email, change smtp:// to smtps://
      # NOTE: Special characters need to be url-encoded in MAIL_URL.
      #---------------------------------------------------------------
      - MAIL_URL='smtp://<mail_url>:25/?ignoreTLS=true&tls={rejectUnauthorized:false}'
      - MAIL_FROM='Wekan Notifications <noreply.wekan@mydomain.com>'

      #---------------------------------------------------------------
      # == WEKAN API ==
      # Wekan Export Board works when WITH_API='true'.
      # If you disable Wekan API, Export Board does not work.
      - WITH_API=true
      #---------------------------------------------------------------
      ## Optional: Integration with Matomo https://matomo.org that is installed to your server
      ## The address of the server where Matomo is hosted:
      # - MATOMO_ADDRESS=https://example.com/matomo
      ## The value of the site ID given in Matomo server for Wekan
      # - MATOMO_SITE_ID=123456789
      ## The option do not track which enables users to not be tracked by matomo"
      # - MATOMO_DO_NOT_TRACK=false
      ## The option that allows matomo to retrieve the username:
      # - MATOMO_WITH_USERNAME=true
      #---------------------------------------------------------------
      # Enable browser policy and allow one trusted URL that can have iframe that has Wekan embedded inside.
      # Setting this to false is not recommended, it also disables all other browser policy protections
      # and allows all iframing etc. See wekan/server/policy.js
      - BROWSER_POLICY_ENABLED=true
      # When browser policy is enabled, HTML code at this Trusted URL can have iframe that embeds Wekan inside.
      - TRUSTED_URL=''
      #---------------------------------------------------------------
      # What to send to Outgoing Webhook, or leave out. Example, that includes all that are default: cardId,listId,oldListId,boardId,comment,user,card,commentId . 
      # example: WEBHOOKS_ATTRIBUTES=cardId,listId,oldListId,boardId,comment,user,card,commentId  
      - WEBHOOKS_ATTRIBUTES=''
      #---------------------------------------------------------------
      # LDAP_ENABLE : Enable or not the connection by the LDAP
      # example : LDAP_ENABLE=true
      - LDAP_ENABLE=true
      # LDAP_PORT : The port of the LDAP server
      # example : LDAP_PORT=389
      - LDAP_PORT=389
      # LDAP_HOST : The host server for the LDAP server
      # example : LDAP_HOST=localhost
      - LDAP_HOST=<ldap_host_fqdn>
      # LDAP_BASEDN : The base DN for the LDAP Tree
      # example : LDAP_BASEDN=ou=user,dc=example,dc=org
      - LDAP_BASEDN=ou=prod,dc=mydomain,dc=com
      # LDAP_GROUP_BASEDN : Where the GROUPS are, when they are not under
      # LDAP_BASEDN. Leave unset when users and groups share one subtree - then
      # the group searches use LDAP_BASEDN, exactly as before. Set it when the
      # directory keeps them apart (ou=groups beside ou=people), or the group
      # searches find nothing and LDAP_GROUP_FILTER_ENABLE refuses every login.
      # example : LDAP_GROUP_BASEDN=ou=groups,dc=example,dc=org
      #- LDAP_GROUP_BASEDN=ou=groups,dc=mydomain,dc=com
      # LDAP_LOGIN_FALLBACK : Fallback on the default authentication method
      # example : LDAP_LOGIN_FALLBACK=true
      - LDAP_LOGIN_FALLBACK=false
      # LDAP_RECONNECT : Reconnect to the server if the connection is lost
      # example : LDAP_RECONNECT=false
      - LDAP_RECONNECT=true
      # LDAP_TIMEOUT : Overall timeout, in milliseconds
      # example : LDAP_TIMEOUT=12345
      - LDAP_TIMEOUT=10000
      # LDAP_IDLE_TIMEOUT : Specifies the timeout for idle LDAP connections in milliseconds
      # example : LDAP_IDLE_TIMEOUT=12345
      - LDAP_IDLE_TIMEOUT=10000
      # LDAP_CONNECT_TIMEOUT : Connection timeout, in milliseconds
      # example : LDAP_CONNECT_TIMEOUT=12345
      - LDAP_CONNECT_TIMEOUT=10000
      # LDAP_AUTHENTIFICATION : If the LDAP needs a user account to search
      # example : LDAP_AUTHENTIFICATION=true
      - LDAP_AUTHENTIFICATION=true
      # LDAP_AUTHENTIFICATION_USERDN : The search user DN
      # example : LDAP_AUTHENTIFICATION_USERDN=cn=admin,dc=example,dc=org
      - LDAP_AUTHENTIFICATION_USERDN=cn=wekan_adm,ou=serviceaccounts,ou=admin,ou=prod,dc=mydomain,dc=com
      # LDAP_AUTHENTIFICATION_PASSWORD : The password for the search user
      # example : AUTHENTIFICATION_PASSWORD=admin
      - LDAP_AUTHENTIFICATION_PASSWORD=pwd
      # LDAP_LOG_ENABLED : Enable logs for the module
      # example : LDAP_LOG_ENABLED=true
      - LDAP_LOG_ENABLED=true
      # LDAP_BACKGROUND_SYNC : If the sync of the users should be done in the background
      # example : LDAP_BACKGROUND_SYNC=true
      - LDAP_BACKGROUND_SYNC=false
      # LDAP_BACKGROUND_SYNC_INTERVAL : How often the background task syncs: milliseconds (3600000 = hourly) or text
      # Text is later.js text, quotes allowed, as specified in:
      # https://bunkat.github.io/later/parsers.html#text
      #- LDAP_BACKGROUND_SYNC_INTERVAL=every 1 hours
      # Unset or empty uses the default (hourly). A value it cannot read is logged
      # and the default is used; it no longer stops WeKan (#2354).
      # https://github.com/wekan/wekan/issues/2354#issuecomment-515305722
      - LDAP_BACKGROUND_SYNC_INTERVAL=''
      # LDAP_BACKGROUND_SYNC_KEEP_EXISTANT_USERS_UPDATED : 
      # example : LDAP_BACKGROUND_SYNC_KEEP_EXISTANT_USERS_UPDATED=true
      - LDAP_BACKGROUND_SYNC_KEEP_EXISTANT_USERS_UPDATED=false
      # LDAP_BACKGROUND_SYNC_IMPORT_NEW_USERS : 
      # example : LDAP_BACKGROUND_SYNC_IMPORT_NEW_USERS=true
      - LDAP_BACKGROUND_SYNC_IMPORT_NEW_USERS=false
      # LDAP_ENCRYPTION : Connection encryption. Accepted values:
      #   'true'     : LDAPS, TLS from the first byte (usually port 636)
      #   'starttls' : connect unencrypted (usually port 389), then upgrade with STARTTLS
      #   'false'    : no encryption (default; strongly advised against)
      # Deprecated but still working: 'ssl' (same as 'true'), 'tls' (same as 'starttls').
      # Any other value logs a warning and means no encryption.
      # example : LDAP_ENCRYPTION=true
      - LDAP_ENCRYPTION=false
      # LDAP_CA_CERT : The certification for the LDAPS server
      # example : LDAP_CA_CERT=-----BEGIN CERTIFICATE-----MIIE+zCCA+OgAwIBAgIkAhwR/6TVLmdRY6hHxvUFWc0+Enmu/Hu6cj+G2FIdAgIC...-----END CERTIFICATE-----
      #- LDAP_CA_CERT=''
      # LDAP_REJECT_UNAUTHORIZED : Reject Unauthorized Certificate. Default true:
      # the LDAPS / StartTLS server certificate is verified. For a self-signed
      # or private CA, put the CA in LDAP_CA_CERT rather than turning this off.
      # Only the exact value false disables verification.
      - LDAP_REJECT_UNAUTHORIZED=true
      # LDAP_USER_SEARCH_FILTER : Optional extra LDAP filters. Don't forget the outmost enclosing parentheses if needed
      # example : LDAP_USER_SEARCH_FILTER=
      - LDAP_USER_SEARCH_FILTER=
      # LDAP_USER_SEARCH_SCOPE : Base (search only in the provided DN), one (search only in the provided DN and one level deep), or subtree (search the whole subtree)
      # example : LDAP_USER_SEARCH_SCOPE=one
      - LDAP_USER_SEARCH_SCOPE=
      # LDAP_USER_SEARCH_FIELD : Which field is used to find the user
      # example : LDAP_USER_SEARCH_FIELD=uid
      - LDAP_USER_SEARCH_FIELD=sAMAccountName
      # LDAP_SEARCH_PAGE_SIZE : Used for pagination (0=unlimited)
      # example : LDAP_SEARCH_PAGE_SIZE=12345
      - LDAP_SEARCH_PAGE_SIZE=0
      # LDAP_SEARCH_SIZE_LIMIT : The limit number of entries (0=unlimited)
      # example : LDAP_SEARCH_SIZE_LIMIT=12345
      - LDAP_SEARCH_SIZE_LIMIT=0
      # LDAP_GROUP_FILTER_ENABLE : Enable the login restriction group filter.
      # When true, only members of LDAP_GROUP_FILTER_GROUP_NAME are allowed to log in.
      # NOTE: This flag ONLY controls the login restriction. Admin status sync
      # (LDAP_SYNC_ADMIN_STATUS / LDAP_SYNC_ADMIN_GROUPS) and group->role sync
      # (LDAP_SYNC_GROUP_ROLES) query LDAP groups independently and do NOT require
      # this flag to be true. The group filter metadata below
      # (LDAP_GROUP_FILTER_OBJECTCLASS, LDAP_GROUP_FILTER_GROUP_MEMBER_ATTRIBUTE,
      # LDAP_GROUP_FILTER_GROUP_MEMBER_FORMAT, LDAP_GROUP_FILTER_GROUP_ID_ATTRIBUTE)
      # must still be configured for any group search to work.
      # example : LDAP_GROUP_FILTER_ENABLE=true
      - LDAP_GROUP_FILTER_ENABLE=false
      # LDAP_GROUP_FILTER_OBJECTCLASS : The object class for filtering
      # example : LDAP_GROUP_FILTER_OBJECTCLASS=group
      - LDAP_GROUP_FILTER_OBJECTCLASS=
      # LDAP_GROUP_FILTER_GROUP_ID_ATTRIBUTE : 
      # example : 
      - LDAP_GROUP_FILTER_GROUP_ID_ATTRIBUTE=
      # LDAP_GROUP_FILTER_GROUP_MEMBER_ATTRIBUTE : 
      # example : 
      - LDAP_GROUP_FILTER_GROUP_MEMBER_ATTRIBUTE=
      # LDAP_GROUP_FILTER_GROUP_MEMBER_FORMAT : 
      # example : 
      - LDAP_GROUP_FILTER_GROUP_MEMBER_FORMAT=
      # LDAP_GROUP_FILTER_NESTED : Active Directory nested groups (#6744). When true, a user who is a member of
      # LDAP_GROUP_FILTER_GROUP_NAME through another group (team group -> access
      # group) is a member too: the group searches use AD's
      # LDAP_MATCHING_RULE_IN_CHAIN (1.2.840.113556.1.4.1941). Needs a DN-valued
      # member attribute (member, with LDAP_GROUP_FILTER_GROUP_MEMBER_FORMAT=dn).
      # Also applies to admin status, group->role and org/team sync. Default: false.
      # example : LDAP_GROUP_FILTER_NESTED=true
      - LDAP_GROUP_FILTER_NESTED=false
      # LDAP_GROUP_FILTER_GROUP_NAME : 
      # example : 
      - LDAP_GROUP_FILTER_GROUP_NAME=
      # LDAP_UNIQUE_IDENTIFIER_FIELD : This field is sometimes class GUID (Globally Unique Identifier)
      # example : LDAP_UNIQUE_IDENTIFIER_FIELD=guid
      - LDAP_UNIQUE_IDENTIFIER_FIELD=
      # LDAP_UTF8_NAMES_SLUGIFY : Convert the username to utf8
      # example : LDAP_UTF8_NAMES_SLUGIFY=false
      - LDAP_UTF8_NAMES_SLUGIFY=true
      # LDAP_USERNAME_FIELD : Which field contains the ldap username
      # example : LDAP_USERNAME_FIELD=username
      - LDAP_USERNAME_FIELD=sAMAccountName
      # LDAP_MERGE_EXISTING_USERS : 
      # example : LDAP_MERGE_EXISTING_USERS=true
      - LDAP_MERGE_EXISTING_USERS=false
      # LDAP_SYNC_USER_DATA : 
      # example : LDAP_SYNC_USER_DATA=true
      - LDAP_SYNC_USER_DATA=false
      # LDAP_SYNC_USER_DATA_FIELDMAP : 
      # example : LDAP_SYNC_USER_DATA_FIELDMAP={"cn":"name", "mail":"email"}
      # LDAP_SYNC_GROUP_ROLES : 
      # example : 
      - LDAP_SYNC_GROUP_ROLES=''
      # LDAP_DEFAULT_DOMAIN : The default domain of the ldap it is used to create email if the field is not map correctly with the LDAP_SYNC_USER_DATA_FIELDMAP
      # example : 
      - LDAP_DEFAULT_DOMAIN=mydomain.com
#---------------------------------------------------------------
 
    depends_on:
      - wekandb
      - wekanproxy


  wekanproxy:
    image: nginx:1.12
    container_name: wekan-proxy
    restart: always
    networks:
      - wekan-tier
    ports:
      - 443:443
      - 80:80 
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/conf.d/default.conf:ro
      - ./nginx/ssl/ssl.conf:/etc/nginx/conf.d/ssl/ssl.conf:ro
      - ./nginx/ssl/testvm-ehu.crt:/etc/nginx/conf.d/ssl/certs/mycert.crt:ro
      - ./nginx/ssl/testvm-ehu.key:/etc/nginx/conf.d/ssl/certs/mykey.key:ro
      - ./nginx/ssl/pphrase:/etc/nginx/conf.d/ssl/pphrase:ro

#------------------------------------------------------------------
#  When using Wekan both at office LAN and remote VPN:
#    1) Have above Wekan docker container config with LAN IP address
#    2) Copy all of above Wekan config below, change name to different
#       like wekan2 or wekanvpn, and change ROOT_URL to server VPN IP
#       address.
#    3) This way both Wekan containers can use same MongoDB database
#       and see the same Wekan boards.
#    4) You could also add 3rd Wekan container for 3rd network etc.
#------------------------------------------------------------------
#  wekan2:
#    ....COPY CONFIG FROM ABOVE TO HERE...
#    environment:
#      - ROOT_URL='http://10.10.10.10'
#      ...COPY CONFIG FROM ABOVE TO HERE...

volumes:
  wekan-db:
    driver: local
  wekan-db-dump:
    driver: local

networks:
  wekan-tier:
    driver: bridge
```

## How the numbers are calculated

- **Background sync interval**
  ([packages/wekan-ldap/server/syncSchedule.js](../../../packages/wekan-ldap/server/syncSchedule.js)):
  unset means at minute 0 of every hour. A number is milliseconds (3600000 =
  hourly). An interval below one minute logs a warning, because it re-syncs
  the whole directory that often. An interval over 1.5 days is rounded to
  whole days. Other values must be one the scheduler can keep exactly - 1, 2,
  3, 4, 5, 6, 10, 12, 15, 20 or 30 seconds or minutes, 1, 2, 3, 4, 6, 8 or 12
  hours, or 1 day - and any other value is moved to the nearest of those
  (nearest on a logarithmic scale) with a warning. Text such as
  `every 1 hours` is later.js text.
- **Timeouts**: `LDAP_TIMEOUT`, `LDAP_IDLE_TIMEOUT` and `LDAP_CONNECT_TIMEOUT`
  are milliseconds (the examples use 10000 = 10 seconds).
- **Paged search**: with `LDAP_SEARCH_PAGE_SIZE` greater than 0 the directory
  is read in pages of that many entries; a paged search without a size uses
  250 ([packages/wekan-ldap/server/ldap.js](../../../packages/wekan-ldap/server/ldap.js)).
  `LDAP_SEARCH_SIZE_LIMIT`, when set, caps the entries one search returns.
- **Ports**: LDAPS (`LDAP_ENCRYPTION=true`) is normally 636, plain and
  STARTTLS normally 389.
- **Group name patterns** in `LDAP_SYNC_ORGANIZATIONS_GROUPS` and
  `LDAP_SYNC_TEAMS_GROUPS`: `*` matches any number of characters and `?`
  exactly one.
- **Nested groups** use the Active Directory matching rule OID
  `1.2.840.113556.1.4.1941` (`LDAP_MATCHING_RULE_IN_CHAIN`), which follows
  group-in-group membership to any depth.

## How it works in WeKan

- [packages/wekan-ldap](../../../packages/wekan-ldap) is the LDAP login:
  [server/loginHandler.js](../../../packages/wekan-ldap/server/loginHandler.js)
  handles `Meteor.loginWithLDAP`, [server/ldap.js](../../../packages/wekan-ldap/server/ldap.js)
  binds and searches with ldapts, [server/sync.js](../../../packages/wekan-ldap/server/sync.js)
  creates and updates the WeKan user and runs the background sync,
  [server/testConnection.js](../../../packages/wekan-ldap/server/testConnection.js)
  is the `ldap_test_connection` method and
  [server/syncUser.js](../../../packages/wekan-ldap/server/syncUser.js) the
  `ldap_sync_now` method, both for admins only.
- Every `LDAP_*` setting is read through `authEnv()`: the Admin Panel value
  first, then the environment variable
  ([server/lib/authConfig.js](../../../server/lib/authConfig.js), section
  `ldap` of [models/lib/authConfigCatalog.js](../../../models/lib/authConfigCatalog.js)).
  The bind password is never sent to the browser.
- [server/ldapGroupSync.js](../../../server/ldapGroupSync.js)
  (`setUserOrgsTeamsFromLdap`) mirrors LDAP groups into the user's
  Organizations and Teams.
- Refused attempts (empty credentials, a user outside the allowed groups,
  ...) are summarized in Admin Panel / Problems.

### LDAP transport encryption

Set `LDAP_ENCRYPTION` to one of these values:

- `true` — connect with TLS immediately, normally on port 636 (LDAPS).
- `starttls` — connect normally, then negotiate TLS with STARTTLS, normally on
  port 389.
- `false` — use an unencrypted connection. Avoid this outside a trusted local
  network.

The legacy values `ssl` (LDAPS) and `tls` (STARTTLS) still work so existing
deployments do not break, but WeKan logs a deprecation warning naming the value
above that should replace them. An unknown value logs a warning and does not
silently enable encryption. LDAPS and STARTTLS can negotiate the same modern
TLS protocols; STARTTLS is not inherently more secure than LDAPS.

#### A private or company certificate authority

The LDAP server's certificate is verified (`LDAP_REJECT_UNAUTHORIZED` defaults
to `true`). WeKan trusts the certificate authorities Node.js ships with and,
since #6762, also those installed on the server. So a company root CA works
the same way it does for every other program:

```
sudo cp company-root-ca.crt /usr/local/share/ca-certificates/
sudo update-ca-certificates
sudo snap restart wekan        # or restart the Docker container / service
```

The file must end in `.crt`. If the LDAP server sends only its own certificate,
install the intermediate CA the same way. Fedora and RHEL use
`/etc/pki/ca-trust/source/anchors/` and `update-ca-trust`. Instead, the CA can
be given to WeKan alone in `LDAP_CA_CERT` (snap:
`sudo snap set wekan ldap-ca-cert="$(cat company-root-ca.pem)"`). Either is
better than turning verification off.

### LDAP background sync, Organizations and Teams sync

These settings extend LDAP background sync and let LDAP groups be mirrored into
Wekan Organizations and Teams. They are read as environment variables (Docker /
Source). On Snap use the lower-case dash-separated equivalent (for example
`ldap-sync-organizations`).

When the user base DN also contains LDAP groups, set
`LDAP_USER_SEARCH_FILTER` to the directory's user class, for example
`(objectClass=user)` for Active Directory or `(objectClass=inetOrgPerson)` for
OpenLDAP. WeKan also refuses known group object classes returned by an
over-broad search, so they cannot be imported as user accounts.

- `LDAP_BACKGROUND_SYNC_DISABLE_NONEXISTANT_USERS` (default `false`) — when
  `true`, background sync disables Wekan users that a successful LDAP search
  confirms are no longer present, and re-enables them if they reappear. This
  makes LDAP authoritative for active/inactive status and requires
  `LDAP_BACKGROUND_SYNC_KEEP_EXISTANT_USERS_UPDATED=true`. Lookup errors,
  missing identifier settings and ambiguous matches abort the run instead of
  disabling accounts.

  The lookup uses `LDAP_USER_SEARCH_FILTER`, exactly like login does, so an
  account the filter excludes counts as no longer present. That is how an
  account **disabled in the directory** is disabled in WeKan too. For Active
  Directory, exclude disabled accounts in the filter:

  ```
  LDAP_USER_SEARCH_FILTER=(&(objectCategory=person)(objectClass=user)(!(userAccountControl:1.2.840.113556.1.4.803:=2)))
  ```

  For OpenLDAP with the ppolicy overlay, `(!(pwdAccountLockedTime=*))` does the
  same; for 389 DS / FreeIPA, `(!(nsAccountLock=TRUE))`.

  A user that WeKan disabled for inactivity (`USERS_DISABLE_INACTIVE_AFTER_DAYS`)
  is *not* re-enabled by background sync; an administrator re-enables it.
- `LDAP_SYNC_ORGANIZATIONS` (default `false`) — when `true`, a user's LDAP groups
  are synced into that user's Wekan **Organizations**.
- `LDAP_SYNC_ORGANIZATIONS_GROUPS` (default empty) — comma-separated list of LDAP
  group names/patterns to sync as Organizations. Leave empty to sync all of the
  user's groups. Supports wildcards: `*` (any number of characters) and `?`
  (single character).
- `LDAP_SYNC_TEAMS` (default `false`) — when `true`, a user's LDAP groups are
  synced into that user's Wekan **Teams**.
- `LDAP_SYNC_TEAMS_GROUPS` (default empty) — comma-separated list of LDAP group
  names/patterns to sync as Teams. Leave empty to sync all of the user's
  groups. Supports wildcards: `*` (any number of characters) and `?` (single
  character).

Notes:

- LDAP admin status (`LDAP_SYNC_ADMIN_STATUS` / `LDAP_SYNC_ADMIN_GROUPS`) is now
  also kept up to date during background sync, not only at sign-in.
- LDAP group-filter values are now escaped, so a DN or `cn` that contains
  parentheses no longer breaks sign-in.

### Authentication boundary checks

Both LDAP login modes require non-empty string credentials; empty passwords
cannot request an unauthenticated bind through the user login flow. Passwords
are never trimmed. Intentional anonymous service searches remain supported.
Both modes require exactly one user entry and enforce configured login-group
restrictions. Group refusal cannot fall back to a cached local password.
Service-search mode checks membership before rebinding as the user.

Blocked credential and group-policy attempts are summarized in Admin Panel /
Problems. See the [authentication boundary audit](../../Security/Authentication-Boundary-Audit-2026-09-27.md)
for validation coverage and deployment limitations.

### Admin Panel overrides

Every `LDAP_*` setting above can also be set in **Admin Panel / People / LDAP**
(`/admin/people/ldap`). A value saved there wins over the environment variable;
an empty field, or **Default**, gives the environment variable back. The page
says for each setting which one is in effect, and **Test LDAP Connection** tries
the settings in effect. The bind password is never sent to the browser - the page
shows only whether one is set and where it comes from. Changes apply to the
next login; background sync is rescheduled at once.

Before this, the LDAP page offered only eight settings, and none of them
applied: the server read them with a call Meteor 3 refuses, and fell back to
the environment variables without saying so.

### Bind password from a file

`LDAP_AUTHENTIFICATION_PASSWORD_FILE` names a file that holds the search user's
password - a Docker or Kubernetes secret mounted as a file, for example
`/run/secrets/ldap_auth_password`. WeKan reads it at each login, so the password
is never an environment variable, and a rotated file applies to the next
login. One trailing line break is ignored. `LDAP_AUTHENTIFICATION_PASSWORD`, when
set, wins over the file, and a password saved in Admin Panel / People / LDAP
wins over both; the page shows which one is used, and when the file cannot be
read. On the snap: `snap set wekan
ldap-authentication-password-file='/var/snap/wekan/common/secrets/ldap_auth_password'`.

### Active Directory nested groups

`LDAP_GROUP_FILTER_GROUP_MEMBER_ATTRIBUTE=member` matches only DIRECT members of
`LDAP_GROUP_FILTER_GROUP_NAME`. In Active Directory, access is usually granted
through nested groups: a user is in a team group, and the team group is a member
of the application access group. To accept those users, set:

```
LDAP_GROUP_FILTER_NESTED=true
LDAP_GROUP_FILTER_GROUP_MEMBER_ATTRIBUTE=member
LDAP_GROUP_FILTER_GROUP_MEMBER_FORMAT=dn
```

The group searches then use Active Directory's `LDAP_MATCHING_RULE_IN_CHAIN`,
`(member:1.2.840.113556.1.4.1941:=<user DN>)`, which follows group-in-group
membership to any depth. The same searches feed admin status sync, group->role
sync and Organizations/Teams sync, so those see nested groups too: a user who
is in an `LDAP_SYNC_ADMIN_GROUPS` group through another group becomes an admin.

This matching rule is an Active Directory feature. OpenLDAP, FreeIPA and Samba
directories without it keep `LDAP_GROUP_FILTER_NESTED=false`, the default.

Writing the rule into the attribute itself,
`LDAP_GROUP_FILTER_GROUP_MEMBER_ATTRIBUTE=member:1.2.840.113556.1.4.1941:`,
also works and is used as written; `LDAP_GROUP_FILTER_NESTED=true` is the
documented way.

**Upgrading from before v12.08:** with `LDAP_USER_AUTHENTICATION=true`, versions
before v12.08 did not check `LDAP_GROUP_FILTER_ENABLE` at all, so every directory
user could log in - including members of nested groups, and also users in no
allowed group. v12.08 enforces the group filter (DirectoryGroupBleed). An Active
Directory deployment that grants access through nested groups needs
`LDAP_GROUP_FILTER_NESTED=true` after upgrading, or those users are refused and
appear in Admin Panel / Problems as `ldap.group-denied`
([#6744](https://github.com/wekan/wekan/issues/6744)).

### Tests

[tests/ldapAuthenticationBoundary.test.cjs](../../../tests/ldapAuthenticationBoundary.test.cjs),
[tests/ldapBackgroundSync.test.cjs](../../../tests/ldapBackgroundSync.test.cjs),
[tests/ldapSyncSchedule.test.cjs](../../../tests/ldapSyncSchedule.test.cjs),
[tests/ldapEncryptionSetting.test.cjs](../../../tests/ldapEncryptionSetting.test.cjs),
[tests/ldapRejectUnauthorizedDefault.test.cjs](../../../tests/ldapRejectUnauthorizedDefault.test.cjs),
[tests/ldapNestedGroups.test.cjs](../../../tests/ldapNestedGroups.test.cjs),
[tests/ldapGroupBaseDn.test.cjs](../../../tests/ldapGroupBaseDn.test.cjs),
[tests/ldapGroupAllowlist.test.cjs](../../../tests/ldapGroupAllowlist.test.cjs),
[tests/ldapAdminGroups.test.cjs](../../../tests/ldapAdminGroups.test.cjs),
[tests/ldapAccountBinding.test.cjs](../../../tests/ldapAccountBinding.test.cjs),
[tests/ldapConnectionRelease.test.cjs](../../../tests/ldapConnectionRelease.test.cjs),
[tests/ldapSyncNow.test.cjs](../../../tests/ldapSyncNow.test.cjs),
[tests/ldapTestConnectionProbe.test.cjs](../../../tests/ldapTestConnectionProbe.test.cjs),
[tests/ldapAdminOverrideSecurity.test.cjs](../../../tests/ldapAdminOverrideSecurity.test.cjs),
[tests/playwright/specs/30-ldap-orgs-teams.e2e.js](../../../tests/playwright/specs/30-ldap-orgs-teams.e2e.js),
[tests/playwright/specs/ldap-login-form.e2e.js](../../../tests/playwright/specs/ldap-login-form.e2e.js).

## Integration tests

See [local login protocol tests](Testing.md) for example identities, actual
request/response checks, failure cases and deployment limitations.

## Bugs and Feature Requests

[LDAP Bugs and Feature Requests](https://github.com/wekan/wekan-ldap/issues)

## Commits

 - [A reused login name no longer opens the previous owner's account](https://github.com/wekan/wekan/commit/e91c14cd9a7bff84121de2e2d3d4f09a37e3e314)
 - [LDAP sync honours its search filter; inactive users can be disabled](https://github.com/wekan/wekan/commit/b933a69cd4953543cece844865ab7dc72eb4a6c1)
 - [Background sync imports users again, and keeps the interval it is given](https://github.com/wekan/wekan/commit/a944be18173392ea072c6b5851d668b1e5770bc3)
 - [A sync interval in milliseconds no longer stops WeKan](https://github.com/wekan/wekan/commit/7dfd942ff67717164bf9b3c18f058d6a6cf2f4a6)
 - [Trust the operating system's certificate authorities for TLS](https://github.com/wekan/wekan/commit/8ab7d467143ec2d376e5dfacaeddac456d91aa71)
 - [LDAP- and OIDC-synced team members become members of the team's boards](https://github.com/wekan/wekan/commit/d560e2fcf869a54bf2e8b4f51086cddaae4e80e4)
 - [Add a Sync LDAP users now button to Admin Panel / People / LDAP](https://github.com/wekan/wekan/commit/95147fc9995ebb40d3b4804ce6bf6fa3f97ad2f7)
 - [Test connection proves the directory answered without a service account](https://github.com/wekan/wekan/commit/9d27f4be4da46d306578096aebeac24148972bda)
 - [Read the bind password from a *_FILE](https://github.com/wekan/wekan/commit/031440665618f6e3492033ff65db26e8ea18c4bb)
 - [Override every login environment variable in Admin Panel / People](https://github.com/wekan/wekan/commit/eb49a4b1b6853650823434e924f5d0dc47a4fe5b)
 - [Accept nested Active Directory groups in the group filter](https://github.com/wekan/wekan/commit/dc2e7592a3fb7a262255e1a773472c8ee231411b)
 - [Show LDAP diagnostics in production when LDAP logging is on](https://github.com/wekan/wekan/commit/66925f0bded0d2931ab8a04c69ff6986767aa966)
 - [Verify LDAP server certificates by default](https://github.com/wekan/wekan/commit/daf6593adf55b2e398f6b4ccca6a97d5f2b495eb)
 - [Reject empty credentials and enforce directory groups](https://github.com/wekan/wekan/commit/679a8b349960a64f03eabb9ae3c24d115be8915a)
 - [Admin Panel overrides for LDAP_* variables, and a Test LDAP Connection button](https://github.com/wekan/wekan/commit/ac363f979f3f73102e305302796eb6c65c5eefcb)
 - [Exclude LDAP groups from user synchronization](https://github.com/wekan/wekan/commit/1485251958aaa3372a010672b25cdc394949a549)
 - [Fail closed on incomplete group filters](https://github.com/wekan/wekan/commit/433348c66770d1ac00c4edd3229c794ccf53d9c8)
 - [Close the encryption setting ambiguity: true, starttls, false](https://github.com/wekan/wekan/commit/7fb9ad1d75e3d2dc99bdb28ca32bdff583b4fa14)
 - [Groups may live in their own subtree (LDAP_GROUP_BASEDN)](https://github.com/wekan/wekan/commit/8b2e0038df5513c6cd9b409e063f1c9e3183514c)
 - [Every LDAP user no longer becomes an admin](https://github.com/wekan/wekan/commit/e901ebd3fbb601485c0ecae7160c82376929f2e1)
 - [The connection leak that exhausted the directory server is fixed](https://github.com/wekan/wekan/commit/7374b7e00d473b1b8b979695d5bbb0cabae247ff)
 - [Group allowlist with wildcards](https://github.com/wekan/wekan/commit/2513c782f70fccdbf137605717bb6d7dd178606f)
 - [A username with a hyphen no longer becomes a dot](https://github.com/wekan/wekan/commit/0119e62da5b6021d6a1fd7f67a9e6960efa50322)
 - [Escape group-filter values so parentheses in a DN or cn work](https://github.com/wekan/wekan/commit/6a89da85e614793edd9e1f6f30abea02281a8eed)
 - [Optionally sync LDAP groups as Organizations or Teams](https://github.com/wekan/wekan/commit/bc8167166dab343d194f3f84e47b5fc3a1a02f9d)
 - [Optionally disable LDAP users that disappeared from the directory](https://github.com/wekan/wekan/commit/f9bfd370aa34ef2ca6d3c64a9cfa18bdc76c8429)
 - [Keep LDAP admin status updated during background sync](https://github.com/wekan/wekan/commit/8d28106dd532a5a31bdd52a68bb397ac8249956c)
 - [Use ldapts instead of ldapjs](https://github.com/wekan/wekan/commit/217cd7bcb6f61ef1673cbf53180ac6249c315461)
 - [SyncLDAPBleed security fix](https://github.com/wekan/wekan/commit/146905a459106b5d00b4f09453a6554255e6965a)
 - [LDAP filter injection fix in LDAP auth](https://github.com/wekan/wekan/commit/0b0e16c3eae28bbf453d33a81a9c58ce7db6d5bb)
