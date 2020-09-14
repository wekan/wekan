@ECHO OFF

REM ------------------------------------------------------------

REM # Debug OIDC OAuth2 etc.
REM SET DEBUG=true

REM ------------------------------------------------------------

SET ROOT_URL=http://localhost
SET PORT=80
SET MONGO_URL=mongodb://127.0.0.1:27017/wekan

REM https://github.com/wekan/wekan/wiki/Troubleshooting-Mail
REM SET MAIL_URL=smtps://username:password@email-smtp.eu-west-1.amazonaws.com:587/
REM SET MAIL_FROM="Wekan Boards <info@example.com>"

REM # If you disable Wekan API with false, Export Board does not work.
SET WITH_API=true

REM # ==== RICH TEXT EDITOR IN CARD COMMENTS ====
REM # https://github.com/wekan/wekan/pull/2560
SET RICHER_CARD_COMMENT_EDITOR=false

REM # ==== CARD OPENED, SEND WEBHOOK MESSAGE ====
SET CARD_OPENED_WEBHOOK_ENABLED=false

REM # ==== Allow to shrink attached/pasted image ====
REM # https://github.com/wekan/wekan/pull/2544
REM SET MAX_IMAGE_PIXEL=1024
REM SET IMAGE_COMPRESS_RATIO=80

REM # ==== PASSWORD BRUTE FORCE PROTECTION ====
REM #https://atmospherejs.com/lucasantoniassi/accounts-lockout
REM #Defaults below. Uncomment to change. wekan/server/accounts-lockout.js
REM SET ACCOUNTS_LOCKOUT_KNOWN_USERS_FAILURES_BEFORE=3
REM SET ACCOUNTS_LOCKOUT_KNOWN_USERS_PERIOD=60
REM SET ACCOUNTS_LOCKOUT_KNOWN_USERS_FAILURE_WINDOW=15
REM SET ACCOUNTS_LOCKOUT_UNKNOWN_USERS_FAILURES_BERORE=3
REM SET ACCOUNTS_LOCKOUT_UNKNOWN_USERS_LOCKOUT_PERIOD=60
REM SET ACCOUNTS_LOCKOUT_UNKNOWN_USERS_FAILURE_WINDOW=15

REM # ==== NOTIFICATION TRAY AFTER READ DAYS BEFORE REMOVE =====
REM # Number of days after a notification is read before we remove it.
REM # Default: 2
REM SET NOTIFICATION_TRAY_AFTER_READ_DAYS_BEFORE_REMOVE=2

REM # ==== BIGEVENTS DUE ETC NOTIFICATIONS =====
REM # https://github.com/wekan/wekan/pull/2541
REM # Introduced a system env var BIGEVENTS_PATTERN default as "NONE",
REM # so any activityType matches the pattern, system will send out
REM # notifications to all board members no matter they are watching
REM # or tracking the board or not. Owner of the wekan server can
REM # disable the feature by setting this variable to "NONE" or
REM # change the pattern to any valid regex. i.e. '|' delimited
REM # activityType names.
REM # a) Example
REM SET BIGEVENTS_PATTERN=due
REM # b) All
REM SET BIGEVENTS_PATTERN=received|start|due|end
REM # c) Disabled
SET BIGEVENTS_PATTERN=NONE

REM # ==== EMAIL DUE DATE NOTIFICATION =====
REM # https://github.com/wekan/wekan/pull/2536
REM # System timelines will be showing any user modification for
REM # dueat startat endat receivedat, also notification to
REM # the watchers and if any card is due, about due or past due.
REM # Notify due days, default is None.
REM # SET NOTIFY_DUE_DAYS_BEFORE_AND_AFTER=2,0
REM # Notify due at hour of day. Default every morning at 8am. Can be 0-23.
REM # If env variable has parsing error, use default. Notification sent to watchers.
REM SET NOTIFY_DUE_AT_HOUR_OF_DAY=8

REM # ==== EMAIL NOTIFICATION TIMEOUT, ms =====
REM # Defaut: 30000 ms = 30s
REM SET EMAIL_NOTIFICATION_TIMEOUT=30000

REM # CORS: Set Access-Control-Allow-Origin header. Example: *
REM SET CORS=*
REM # To enable the Set Access-Control-Allow-Headers header. "Authorization,Content-Type" is required for cross-origin use of the API.
REM SET CORS_ALLOW_HEADERS=Authorization,Content-Type
REM # To enable the Set Access-Control-Expose-Headers header.  This is not needed for typical CORS situations. Example: *
REM SET CORS_EXPOSE_HEADERS=*

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

REM # Use OAuth2 ADFS additional changes. Also needs OAUTH2_ENABLED=true setting.
REM SET OAUTH2_ADFS_ENABLED=false

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


REM # OAUTH2 ID Token Whitelist Fields.
REM SET OAUTH2_ID_TOKEN_WHITELIST_FIELDS=[]

REM # OAUTH2 Request Permissions.
REM SET OAUTH2_REQUEST_PERMISSIONS='openid profile email'

REM # OAuth2 ID Mapping
REM SET OAUTH2_ID_MAP=

REM # OAuth2 Username Mapping
REM SET OAUTH2_USERNAME_MAP=

REM # OAuth2 Fullname Mapping
REM SET OAUTH2_FULLNAME_MAP=

REM # OAuth2 Email Mapping
REM SET OAUTH2_EMAIL_MAP=

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

REM # The search user DN - You need quotes when you have spaces in parameters
REM # 2 examples:
REM SET LDAP_AUTHENTIFICATION_USERDN="CN=ldap admin,CN=users,DC=domainmatter,DC=lan"
REM SET LDAP_AUTHENTIFICATION_USERDN="CN=wekan_adm,OU=serviceaccounts,OU=admin,OU=prod,DC=mydomain,DC=com"

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
REM # At which interval does the background task sync in milliseconds.
REM # Leave this unset, so it uses default, and does not crash.
REM # https://github.com/wekan/wekan/issues/2354#issuecomment-515305722
SET LDAP_BACKGROUND_SYNC_INTERVAL=''

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

REM # Option to login to the LDAP server with the user's own username and password, instead of an administrator key. Default: false (use administrator key).
REM SET LDAP_USER_AUTHENTICATION=true

REM # Which field is used to find the user for the user authentication. Default: uid.
REM SET LDAP_USER_AUTHENTICATION_FIELD=uid

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

REM ------------------------------------------------

REM # Enable/Disable password login form.
REM SET PASSWORD_LOGIN_ENABLED=true

REM ------------------------------------------------

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

REM SET CAS_ENABLED=true
REM SET CAS_BASE_URL=https://cas.example.com/cas
REM SET CAS_LOGIN_URL=https://cas.example.com/login
REM SET CAS_VALIDATE_URL=https://cas.example.com/cas/p3/serviceValidate

REM SET SAML_ENABLED=true
REM SET SAML_PROVIDER=
REM SET SAML_ENTRYPOINT=
REM SET SAML_ISSUER=
REM SET SAML_CERT=
REM SET SAML_IDPSLO_REDIRECTURL=
REM SET SAML_PRIVATE_KEYFILE=
REM SET SAML_PUBLIC_CERTFILE=
REM SET SAML_IDENTIFIER_FORMAT=
REM SET SAML_LOCAL_PROFILE_MATCH_ATTRIBUTE=
REM SET SAML_ATTRIBUTES=

node main.js
