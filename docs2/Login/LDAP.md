## LDAP info

- [LDAP sync script, that also correctly removes users](https://github.com/wekan/wekan/blob/main/docs/Login/ldap-sync/ldap-sync.py)
- [LDAP AD Simple Auth](LDAP-AD-Simple-Auth) 2021-07-24 and related [Search Filter Settings](https://github.com/wekan/wekan/issues/3908#issuecomment-887545168):

```
- LDAP_USER_SEARCH_FILTER=(objectClass=user)
- LDAP_EMAIL_FIELD=mail
```

- [MS AD with Windows 2012 server](https://github.com/wekan/wekan/issues/3292#issuecomment-703246384)
- [Additional info about LDAP docs here](https://github.com/wekan/wekan-ldap/issues/77)
- [LDAP issues](https://github.com/wekan/wekan-ldap/issues)
- [Univention LDAP related issues](https://github.com/wekan/univention/issues)
- [Teams/Organizations feature related LDAP plans](https://github.com/wekan/wekan/issues/802). Needs info from LDAP experts to describe how LDAP works.
- [Wekan LDAP code](https://github.com/wekan/wekan/tree/main/packages/wekan-ldap)

***

## Snap

LDAP is available on Snap Stable channel. Settings can be seen with command `wekan.help` and from repo https://github.com/wekan/wekan-ldap . More settings at https://github.com/wekan/wekan-snap/wiki/Supported-settings-keys

You see all settings with:
```
wekan.help | less
```
For root-url, see [Settings](Settings)

For Caddy/Wekan/RocketChat Snap settings, see [Snap install page](https://github.com/wekan/wekan-snap/wiki/Install), [OAuth2 page](OAuth2#snap) and [Caddy page](Caddy-Webserver-Config). Instead of Caddy you can also use [Nginx](Nginx-Webserver-Config) or [Apache](Apache).

## LDAP Filter settings

For better working LDAP filter setting than those below, settings info here:
https://github.com/wekan/univention/issues/5

### Active Directory LDAP part
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
# LDAP_BACKGROUND_SYNC_INTERVAL : At which interval does the background task sync in milliseconds
# The format must be as specified in:
# https://bunkat.github.io/later/parsers.html#text
#sudo snap set wekan ldap-background-sync-interval='every 1 hours'
# At which interval does the background task sync in milliseconds.
# If not in use, Leave this unset, so it uses default, and does not crash.
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

### FreeIPA v4.6.6

[Source](https://github.com/wekan/wekan/issues/3357)

```bash
snap set wekan ldap-enable='true'
snap set wekan ldap-host='ldap.example.com'

# Use 'tls' and port 389 for STARTTLS, which is more secure than standard LDAPS.
snap set wekan ldap-port='389'
snap set wekan ldap-encryption='tls'

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
# LDAP_BACKGROUND_SYNC_INTERVAL : At which interval does the background task sync in milliseconds
# The format must be as specified in:
# https://bunkat.github.io/later/parsers.html#text
#sudo snap set wekan ldap-background-sync-interval='every 1 hours'
# At which interval does the background task sync in milliseconds.
# If not in use, Leave this unset, so it uses default, and does not crash.
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

### OpenLDAP
[Source](https://github.com/wekan/wekan/issues/2822#issuecomment-564451384)
```
sudo snap set wekan default-authentication-method='ldap'
sudo snap set wekan ldap-authentication='true'
sudo snap set wekan ldap-authentication-password='********'
sudo snap set wekan ldap-authentication-userdn='cn=admin,dc=*******,dc=lan'
sudo snap set wekan ldap-background-sync='true'
sudo snap set wekan ldap-background-sync-import-new-users='true'
# LDAP_BACKGROUND_SYNC_INTERVAL : At which interval does the background task sync in milliseconds
# The format must be as specified in:
# https://bunkat.github.io/later/parsers.html#text
#sudo snap set wekan ldap-background-sync-interval='every 1 hours'
# At which interval does the background task sync in milliseconds.
# If not in use, Leave this unset, so it uses default, and does not crash.
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

## Docker

LDAP login works now by using this docker-compose.yml file:
https://raw.githubusercontent.com/wekan/wekan/edge/docker-compose.yml
adding ROOT_URL, LDAP settings etc to that file.

Using this docker-compose:
https://docs.docker.com/compose/install/

With this command:
``` 
docker-compose up -d --no-build
```

## Bugs and Feature Requests

[LDAP Bugs and Feature Requests](https://github.com/wekan/wekan-ldap/issues)
## Example LDAP settings for Docker

Note: Some newer settings could be missing from example below. Someone could copy newest missing settings from docker-compose.yml above to example below. Some examples are also at closed and open issues at https://github.com/wekan/wekan-ldap/issues

```
version: '2'

services:

  wekandb:
    # All Wekan data is stored in MongoDB. For backup and restore, see:
    #   https://github.com/wekan/wekan/wiki/Export-Docker-Mongo-Data
    image: mongo:4.0.3
    container_name: wekan-db
    restart: always
    command: mongod --smallfiles --oplogSize 128
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
    # Docker Hub, usually broken:
    #image: wekanteam/wekan:latest
    #
    # Quay, usually works, updates faster:
    image: quay.io/wekan/wekan:meteor-1.8
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
      #   see https://github.com/wekan/wekan/wiki/Troubleshooting-Mail
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
      # LDAP_BACKGROUND_SYNC_INTERVAL : At which interval does the background task sync in milliseconds
      # The format must be as specified in:
      # https://bunkat.github.io/later/parsers.html#text
      #- LDAP_BACKGROUND_SYNC_INTERVAL=every 1 hours
      # At which interval does the background task sync in milliseconds.
      # Leave this unset, so it uses default, and does not crash.
      # https://github.com/wekan/wekan/issues/2354#issuecomment-515305722
      - LDAP_BACKGROUND_SYNC_INTERVAL=''
      # LDAP_BACKGROUND_SYNC_KEEP_EXISTANT_USERS_UPDATED : 
      # example : LDAP_BACKGROUND_SYNC_KEEP_EXISTANT_USERS_UPDATED=true
      - LDAP_BACKGROUND_SYNC_KEEP_EXISTANT_USERS_UPDATED=false
      # LDAP_BACKGROUND_SYNC_IMPORT_NEW_USERS : 
      # example : LDAP_BACKGROUND_SYNC_IMPORT_NEW_USERS=true
      - LDAP_BACKGROUND_SYNC_IMPORT_NEW_USERS=false
      # LDAP_ENCRYPTION : If using LDAPS
      # example : LDAP_ENCRYPTION=true
      - LDAP_ENCRYPTION=false
      # LDAP_CA_CERT : The certification for the LDAPS server
      # example : LDAP_CA_CERT=-----BEGIN CERTIFICATE-----MIIE+zCCA+OgAwIBAgIkAhwR/6TVLmdRY6hHxvUFWc0+Enmu/Hu6cj+G2FIdAgIC...-----END CERTIFICATE-----
      #- LDAP_CA_CERT=''
      # LDAP_REJECT_UNAUTHORIZED : Reject Unauthorized Certificate
      # example : LDAP_REJECT_UNAUTHORIZED=true
      - LDAP_REJECT_UNAUTHORIZED=false
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
      # LDAP_GROUP_FILTER_ENABLE : Enable group filtering
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

