REM ------------------------------------------------------------

REM NOTE: THIS .BAT DOES NOT WORK !!
REM Use instead this webpage instructions to build on Windows:
REM https://github.com/wekan/wekan/wiki/Install-Wekan-from-source-on-Windows
REM Please add fix PRs, like config of MongoDB etc.

REM ------------------------------------------------------------

REM # Debug OIDC OAuth2 etc.
REM SET DEBUG=true

REM ------------------------------------------------------------

SET MONGO_URL=mongodb://127.0.0.1:27017/wekan
SET ROOT_URL=http://127.0.0.1:2000/
SET MAIL_URL=smtp://user:pass@mailserver.example.com:25/
SET MAIL_FROM=admin@example.com
SET PORT=2000

REM # If you disable Wekan API with false, Export Board does not work.
SET WITH_API=true

REM # ==== PASSWORD BRUTE FORCE PROTECTION ====
REM #https://atmospherejs.com/lucasantoniassi/accounts-lockout
REM #Defaults below. Uncomment to change. wekan/server/accounts-lockout.js
REM SET ACCOUNTS_LOCKOUT_KNOWN_USERS_FAILURES_BEFORE=3
REM SET ACCOUNTS_LOCKOUT_KNOWN_USERS_PERIOD=60
REM SET ACCOUNTS_LOCKOUT_KNOWN_USERS_FAILURE_WINDOW=15
REM SET ACCOUNTS_LOCKOUT_UNKNOWN_USERS_FAILURES_BERORE=3
REM SET ACCOUNTS_LOCKOUT_UNKNOWN_USERS_LOCKOUT_PERIOD=60
REM SET ACCOUNTS_LOCKOUT_UNKNOWN_USERS_FAILURE_WINDOW=15

REM # Optional: Integration with Matomo https://matomo.org that is installed to your server
REM # The address of the server where Matomo is hosted.
REM # example: - MATOMO_ADDRESS=https://example.com/matomo
REM SET MATOMO_ADDRESS=

REM # The value of the site ID given in Matomo server for Wekan
REM # example: - MATOMO_SITE_ID=12345
REM SET MATOMO_SITE_ID=

REM # The option do not track which enables users to not be tracked by matomo
REM # example:  - MATOMO_DO_NOT_TRACK=false
REM SET MATOMO_DO_NOT_TRACK=

REM # The option that allows matomo to retrieve the username:
REM # example: MATOMO_WITH_USERNAME=true
REM SET MATOMO_WITH_USERNAME=false

REM # Enable browser policy and allow one trusted URL that can have iframe that has Wekan embedded inside.
REM # Setting this to false is not recommended, it also disables all other browser policy protections
REM # and allows all iframing etc. See wekan/server/policy.js
SET BROWSER_POLICY_ENABLED=true

REM # When browser policy is enabled, HTML code at this Trusted URL can have iframe that embeds Wekan inside.
REM SET TRUSTED_URL=

REM # What to send to Outgoing Webhook, or leave out. Example, that includes all that are default: cardId,listId,oldListId,boardId,comment,user,card,commentId .
REM # example: WEBHOOKS_ATTRIBUTES=cardId,listId,oldListId,boardId,comment,user,card,commentId
REM SET WEBHOOKS_ATTRIBUTES=

REM ------------------------------------------------------------

REM # Enable the OAuth2 connection
REM # OAuth2 docs: https://github.com/wekan/wekan/wiki/OAuth2
REM # example: OAUTH2_ENABLED=true
REM SET OAUTH2_ENABLED=false

REM # OAuth2 Client ID, for example from Rocket.Chat. Example: abcde12345
REM # example: OAUTH2_CLIENT_ID=abcde12345
REM SET OAUTH2_CLIENT_ID=

REM # OAuth2 Secret, for example from Rocket.Chat: Example: 54321abcde
REM # example: OAUTH2_SECRET=54321abcde
REM SET OAUTH2_SECRET=

REM # OAuth2 Server URL, for example Rocket.Chat. Example: https://chat.example.com
REM # example: OAUTH2_SERVER_URL=https://chat.example.com
REM SET OAUTH2_SERVER_URL=

REM # OAuth2 Authorization Endpoint. Example: /oauth/authorize
REM # example: OAUTH2_AUTH_ENDPOINT=/oauth/authorize
REM SET OAUTH2_AUTH_ENDPOINT=

REM # OAuth2 Userinfo Endpoint. Example: /oauth/userinfo
REM # example: OAUTH2_USERINFO_ENDPOINT=/oauth/userinfo
REM SET OAUTH2_USERINFO_ENDPOINT=

REM # OAuth2 Token Endpoint. Example: /oauth/token
REM # example: OAUTH2_TOKEN_ENDPOINT=/oauth/token
REM SET OAUTH2_TOKEN_ENDPOINT=

REM ------------------------------------------------------------

REM # LDAP_ENABLE : Enable or not the connection by the LDAP
REM # example : LDAP_ENABLE=true
REM SET LDAP_ENABLE=false

REM # LDAP_PORT : The port of the LDAP server
REM # example : LDAP_PORT=389
REM SET LDAP_PORT=389

REM # LDAP_HOST : The host server for the LDAP server
REM # example : LDAP_HOST=localhost
REM SET LDAP_HOST=

REM # LDAP_BASEDN : The base DN for the LDAP Tree
REM # example : LDAP_BASEDN=ou=user,dc=example,dc=org
REM SET LDAP_BASEDN=

REM # LDAP_LOGIN_FALLBACK : Fallback on the default authentication method
REM # example : LDAP_LOGIN_FALLBACK=true
REM SET LDAP_LOGIN_FALLBACK=false

REM # LDAP_RECONNECT : Reconnect to the server if the connection is lost
REM # example : LDAP_RECONNECT=false
REM SET LDAP_RECONNECT=true

REM # LDAP_TIMEOUT : Overall timeout, in milliseconds
REM # example : LDAP_TIMEOUT=12345
REM SET LDAP_TIMEOUT=10000

REM # LDAP_IDLE_TIMEOUT : Specifies the timeout for idle LDAP connections in milliseconds
REM # example : LDAP_IDLE_TIMEOUT=12345
REM SET LDAP_IDLE_TIMEOUT=10000

REM # LDAP_CONNECT_TIMEOUT : Connection timeout, in milliseconds
REM # example : LDAP_CONNECT_TIMEOUT=12345
REM SET LDAP_CONNECT_TIMEOUT=10000

REM # LDAP_AUTHENTIFICATION : If the LDAP needs a user account to search
REM # example : LDAP_AUTHENTIFICATION=true
REM SET LDAP_AUTHENTIFICATION=false

REM # LDAP_AUTHENTIFICATION_USERDN : The search user DN
REM # example: LDAP_AUTHENTIFICATION_USERDN=cn=admin,dc=example,dc=org
REM SET LDAP_AUTHENTIFICATION_USERDN=

REM # LDAP_AUTHENTIFICATION_PASSWORD : The password for the search user
REM # example : AUTHENTIFICATION_PASSWORD=admin
REM SET LDAP_AUTHENTIFICATION_PASSWORD=

REM # LDAP_LOG_ENABLED : Enable logs for the module
REM # example : LDAP_LOG_ENABLED=true
REM SET LDAP_LOG_ENABLED=false

REM # LDAP_BACKGROUND_SYNC : If the sync of the users should be done in the background
REM # example : LDAP_BACKGROUND_SYNC=true
REM SET LDAP_BACKGROUND_SYNC=false

REM # LDAP_BACKGROUND_SYNC_INTERVAL : At which interval does the background task sync in milliseconds
REM # example : LDAP_BACKGROUND_SYNC_INTERVAL=12345
REM SET LDAP_BACKGROUND_SYNC_INTERVAL=100

REM # LDAP_BACKGROUND_SYNC_KEEP_EXISTANT_USERS_UPDATED :
REM # example : LDAP_BACKGROUND_SYNC_KEEP_EXISTANT_USERS_UPDATED=true
REM SET LDAP_BACKGROUND_SYNC_KEEP_EXISTANT_USERS_UPDATED=false

REM # LDAP_BACKGROUND_SYNC_IMPORT_NEW_USERS :
REM # example : LDAP_BACKGROUND_SYNC_IMPORT_NEW_USERS=true
REM SET LDAP_BACKGROUND_SYNC_IMPORT_NEW_USERS=false

REM # LDAP_ENCRYPTION : If using LDAPS
REM # example : LDAP_ENCRYPTION=ssl
REM SET LDAP_ENCRYPTION=false

REM # LDAP_CA_CERT : The certification for the LDAPS server. Certificate needs to be included in this docker-compose.yml file.
REM # example : LDAP_CA_CERT=-----BEGIN CERTIFICATE-----MIIE+zCCA+OgAwIBAgIkAhwR/6TVLmdRY6hHxvUFWc0+Enmu/Hu6cj+G2FIdAgIC...-----END CERTIFICATE-----
REM SET LDAP_CA_CERT=

REM # LDAP_REJECT_UNAUTHORIZED : Reject Unauthorized Certificate
REM # example : LDAP_REJECT_UNAUTHORIZED=true
REM SET LDAP_REJECT_UNAUTHORIZED=false

REM # LDAP_USER_SEARCH_FILTER : Optional extra LDAP filters. Don't forget the outmost enclosing parentheses if needed
REM # example : LDAP_USER_SEARCH_FILTER=
REM SET LDAP_USER_SEARCH_FILTER=

REM # LDAP_USER_SEARCH_SCOPE : base (search only in the provided DN), one (search only in the provided DN and one level deep), or sub (search the whole subtree)
REM # example : LDAP_USER_SEARCH_SCOPE=one
REM SET LDAP_USER_SEARCH_SCOPE=

REM # LDAP_USER_SEARCH_FIELD : Which field is used to find the user
REM # example : LDAP_USER_SEARCH_FIELD=uid
REM SET LDAP_USER_SEARCH_FIELD=

REM # LDAP_SEARCH_PAGE_SIZE : Used for pagination (0=unlimited)
REM # example : LDAP_SEARCH_PAGE_SIZE=12345
REM SET LDAP_SEARCH_PAGE_SIZE=0

REM # LDAP_SEARCH_SIZE_LIMIT : The limit number of entries (0=unlimited)
REM #33 example : LDAP_SEARCH_SIZE_LIMIT=12345
REM SET LDAP_SEARCH_SIZE_LIMIT=0

REM # LDAP_GROUP_FILTER_ENABLE : Enable group filtering
REM # example : LDAP_GROUP_FILTER_ENABLE=true
REM SET LDAP_GROUP_FILTER_ENABLE=false

REM # LDAP_GROUP_FILTER_OBJECTCLASS : The object class for filtering
REM # example : LDAP_GROUP_FILTER_OBJECTCLASS=group
REM SET LDAP_GROUP_FILTER_OBJECTCLASS=

REM # LDAP_GROUP_FILTER_GROUP_ID_ATTRIBUTE :
REM # example :
REM SET LDAP_GROUP_FILTER_GROUP_ID_ATTRIBUTE=

REM # LDAP_GROUP_FILTER_GROUP_MEMBER_ATTRIBUTE :
REM # example :
REM SET LDAP_GROUP_FILTER_GROUP_MEMBER_ATTRIBUTE=

REM # LDAP_GROUP_FILTER_GROUP_MEMBER_FORMAT :
REM # example :
REM SET LDAP_GROUP_FILTER_GROUP_MEMBER_FORMAT=

REM # LDAP_GROUP_FILTER_GROUP_NAME :
REM # example :
REM SET LDAP_GROUP_FILTER_GROUP_NAME=

REM # LDAP_UNIQUE_IDENTIFIER_FIELD : This field is sometimes class GUID (Globally Unique Identifier)
REM # example : LDAP_UNIQUE_IDENTIFIER_FIELD=guid
REM SET LDAP_UNIQUE_IDENTIFIER_FIELD=

REM # LDAP_UTF8_NAMES_SLUGIFY : Convert the username to utf8
REM # example : LDAP_UTF8_NAMES_SLUGIFY=false
REM SET LDAP_UTF8_NAMES_SLUGIFY=true

REM # LDAP_USERNAME_FIELD : Which field contains the ldap username
REM # example : LDAP_USERNAME_FIELD=username
REM SET LDAP_USERNAME_FIELD=

REM # LDAP_MERGE_EXISTING_USERS :
REM # example : LDAP_MERGE_EXISTING_USERS=true
REM SET LDAP_MERGE_EXISTING_USERS=false

REM # LDAP_EMAIL_MATCH_ENABLE : allow existing account matching by e-mail address when username does not match
REM # example: LDAP_EMAIL_MATCH_ENABLE=true
REM SET LDAP_EMAIL_MATCH_ENABLE=false

REM # LDAP_EMAIL_MATCH_REQUIRE : require existing account matching by e-mail address when username does match
REM # example: LDAP_EMAIL_MATCH_REQUIRE=true
REM SET LDAP_EMAIL_MATCH_REQUIRE=false

REM # LDAP_EMAIL_MATCH_VERIFIED : require existing account email address to be verified for matching
REM # example: LDAP_EMAIL_MATCH_VERIFIED=true
REM SET LDAP_EMAIL_MATCH_VERIFIED=false

REM # LDAP_EMAIL_FIELD : which field contains the LDAP e-mail address
REM # example: LDAP_EMAIL_FIELD=mail
REM SET LDAP_EMAIL_FIELD=

REM # LDAP_SYNC_USER_DATA :
REM # example : LDAP_SYNC_USER_DATA=true
REM SET LDAP_SYNC_USER_DATA=false

REM # LDAP_SYNC_USER_DATA_FIELDMAP :
REM # example : LDAP_SYNC_USER_DATA_FIELDMAP={"cn":"name", "mail":"email"}
REM SET LDAP_SYNC_USER_DATA_FIELDMAP=

REM # LDAP_SYNC_GROUP_ROLES :
REM # example :
REM # SET LDAP_SYNC_GROUP_ROLES=

REM # LDAP_DEFAULT_DOMAIN : The default domain of the ldap it is used to create email if the field is not map correctly with the LDAP_SYNC_USER_DATA_FIELDMAP
REM # example :
REM SET LDAP_DEFAULT_DOMAIN=

REM # Enable/Disable syncing of admin status based on ldap groups:
REM SET LDAP_SYNC_ADMIN_STATUS=true

REM # Comma separated list of admin group names to sync.
REM SET LDAP_SYNC_ADMIN_GROUPS=group1,group2

REM # Login to LDAP automatically with HTTP header.
REM # In below example for siteminder, at right side of = is header name.
REM SET HEADER_LOGIN_ID=HEADERUID
REM SET HEADER_LOGIN_FIRSTNAME=HEADERFIRSTNAME
REM SET HEADER_LOGIN_LASTNAME=HEADERLASTNAME
REM SET HEADER_LOGIN_EMAIL=HEADEREMAILADDRESS

REM ------------------------------------------------

REM # LOGOUT_WITH_TIMER : Enables or not the option logout with timer
REM # example : LOGOUT_WITH_TIMER=true
REM SET LOGOUT_WITH_TIMER=

REM # LOGOUT_IN : The number of days
REM # example : LOGOUT_IN=1
REM SET LOGOUT_IN=

REM # LOGOUT_ON_HOURS : The number of hours
REM # example : LOGOUT_ON_HOURS=9
REM SET LOGOUT_ON_HOURS=

REM # LOGOUT_ON_MINUTES : The number of minutes
REM # example : LOGOUT_ON_MINUTES=55
REM SET LOGOUT_ON_MINUTES=

cd .build\bundle
node main.js
cd ..\..
