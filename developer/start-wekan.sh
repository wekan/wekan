#!/bin/bash

function wekan_repo_check(){
      git_remotes="$(git remote show 2>/dev/null)"
      res=""
      for i in $git_remotes; do
            res="$(git remote get-url $i | sed 's/.*wekan\/wekan.*/wekan\/wekan/')"
            if [[ "$res" == "wekan/wekan" ]]; then
                break
            fi
      done

      if [[ "$res" != "wekan/wekan" ]]; then
            echo "$PWD is not a wekan repository"
            exit;
      fi
}

# If you want to restart even on crash, uncomment while and done lines.
#while true; do
      wekan_repo_check
      cd .build/bundle
      export MONGO_URL='mongodb://127.0.0.1:27019/wekan'
      #---------------------------------------------
      # Production: https://example.com/wekan
      # Local: http://localhost:2000
      #export ipaddress=$(ifdata -pa eth0)
      export ROOT_URL='http://localhost:2000'
      #---------------------------------------------
      # https://github.com/wekan/wekan/wiki/Troubleshooting-Mail
      # https://github.com/wekan/wekan-mongodb/blob/master/docker-compose.yml
      export MAIL_URL='smtp://user:pass@mailserver.example.com:25/'
      #---------------------------------------------
      #export KADIRA_OPTIONS_ENDPOINT=http://127.0.0.1:11011
      #---------------------------------------------
      # This is local port where Wekan Node.js runs, same as below on Caddyfile settings.
      export PORT=2000
      #---------------------------------------------
      # Wekan Export Board works when WITH_API=true.
      # If you disable Wekan API with false, Export Board does not work.
      export WITH_API='true'
      #---------------------------------------------
      # CORS: Set Access-Control-Allow-Origin header. Example: *
      #- CORS=*
      #---------------------------------------------
      ## Optional: Integration with Matomo https://matomo.org that is installed to your server
      ## The address of the server where Matomo is hosted:
      ##export MATOMO_ADDRESS=https://example.com/matomo
      #export MATOMO_ADDRESS=
      ## The value of the site ID given in Matomo server for Wekan
      # Example: export MATOMO_SITE_ID=123456789
      #export MATOMO_SITE_ID=''
      ## The option do not track which enables users to not be tracked by matomo"
      #Example: export MATOMO_DO_NOT_TRACK=false
      #export MATOMO_DO_NOT_TRACK=true
      ## The option that allows matomo to retrieve the username:
      # Example: export MATOMO_WITH_USERNAME=true
      #export MATOMO_WITH_USERNAME='false'
      # Enable browser policy and allow one trusted URL that can have iframe that has Wekan embedded inside.
      # Setting this to false is not recommended, it also disables all other browser policy protections
      # and allows all iframing etc. See wekan/server/policy.js
      # Default value: true
      export BROWSER_POLICY_ENABLED=true
      # When browser policy is enabled, HTML code at this Trusted URL can have iframe that embeds Wekan inside.
      # Example: export TRUSTED_URL=http://example.com
      export TRUSTED_URL=''
      # What to send to Outgoing Webhook, or leave out. Example, that includes all that are default: cardId,listId,oldListId,boardId,comment,user,card,commentId .
      # Example: export WEBHOOKS_ATTRIBUTES=cardId,listId,oldListId,boardId,comment,user,card,commentId
      export WEBHOOKS_ATTRIBUTES=''
      #---------------------------------------------
      # OAuth2 docs: https://github.com/wekan/wekan/wiki/OAuth2
      # OAuth2 Client ID, for example from Rocket.Chat. Example: abcde12345
      # example: export OAUTH2_CLIENT_ID=abcde12345
      #export OAUTH2_CLIENT_ID=''
      # OAuth2 Secret, for example from Rocket.Chat: Example: 54321abcde
      # example: export OAUTH2_SECRET=54321abcde
      #export OAUTH2_SECRET=''
      # OAuth2 Server URL, for example Rocket.Chat. Example: https://chat.example.com
      # example: export OAUTH2_SERVER_URL=https://chat.example.com
      #export OAUTH2_SERVER_URL=''
      # OAuth2 Authorization Endpoint. Example: /oauth/authorize
      # example: export OAUTH2_AUTH_ENDPOINT=/oauth/authorize
      #export OAUTH2_AUTH_ENDPOINT=''
      # OAuth2 Userinfo Endpoint. Example: /oauth/userinfo
      # example: export OAUTH2_USERINFO_ENDPOINT=/oauth/userinfo
      #export OAUTH2_USERINFO_ENDPOINT=''
      # OAuth2 Token Endpoint. Example: /oauth/token
      # example: export OAUTH2_TOKEN_ENDPOINT=/oauth/token
      #export OAUTH2_TOKEN_ENDPOINT=''
      #---------------------------------------------
      # LDAP_ENABLE : Enable or not the connection by the LDAP
      # example :  export LDAP_ENABLE=true
      #export LDAP_ENABLE=false
      # LDAP_PORT : The port of the LDAP server
      # example :  export LDAP_PORT=389
      #export LDAP_PORT=389
      # LDAP_HOST : The host server for the LDAP server
      # example :  export LDAP_HOST=localhost
      #export LDAP_HOST=
      # LDAP_BASEDN : The base DN for the LDAP Tree
      # example :  export LDAP_BASEDN=ou=user,dc=example,dc=org
      #export LDAP_BASEDN=
      # LDAP_LOGIN_FALLBACK : Fallback on the default authentication method
      # example :  export LDAP_LOGIN_FALLBACK=true
      #export LDAP_LOGIN_FALLBACK=false
      # LDAP_RECONNECT : Reconnect to the server if the connection is lost
      # example :  export LDAP_RECONNECT=false
      #export LDAP_RECONNECT=true
      # LDAP_TIMEOUT : Overall timeout, in milliseconds
      # example :  export LDAP_TIMEOUT=12345
      #export LDAP_TIMEOUT=10000
      # LDAP_IDLE_TIMEOUT : Specifies the timeout for idle LDAP connections in milliseconds
      # example :  export LDAP_IDLE_TIMEOUT=12345
      #export LDAP_IDLE_TIMEOUT=10000
      # LDAP_CONNECT_TIMEOUT : Connection timeout, in milliseconds
      # example :  export LDAP_CONNECT_TIMEOUT=12345
      #export LDAP_CONNECT_TIMEOUT=10000
      # LDAP_AUTHENTIFICATION : If the LDAP needs a user account to search
      # example :  export LDAP_AUTHENTIFICATION=true
      #export LDAP_AUTHENTIFICATION=false
      # LDAP_AUTHENTIFICATION_USERDN : The search user DN
      # example :  export LDAP_AUTHENTIFICATION_USERDN=cn=admin,dc=example,dc=org
      #export LDAP_AUTHENTIFICATION_USERDN=
      # LDAP_AUTHENTIFICATION_PASSWORD : The password for the search user
      # example : AUTHENTIFICATION_PASSWORD=admin
      #export LDAP_AUTHENTIFICATION_PASSWORD=
      # LDAP_LOG_ENABLED : Enable logs for the module
      # example :  export LDAP_LOG_ENABLED=true
      #export LDAP_LOG_ENABLED=false
      # LDAP_BACKGROUND_SYNC : If the sync of the users should be done in the background
      # example :  export LDAP_BACKGROUND_SYNC=true
      #export LDAP_BACKGROUND_SYNC=false
      # LDAP_BACKGROUND_SYNC_INTERVAL : At which interval does the background task sync in milliseconds
      # example :  export LDAP_BACKGROUND_SYNC_INTERVAL=12345
      #export LDAP_BACKGROUND_SYNC_INTERVAL=100
      # LDAP_BACKGROUND_SYNC_KEEP_EXISTANT_USERS_UPDATED :
      # example :  export LDAP_BACKGROUND_SYNC_KEEP_EXISTANT_USERS_UPDATED=true
      #export LDAP_BACKGROUND_SYNC_KEEP_EXISTANT_USERS_UPDATED=false
      # LDAP_BACKGROUND_SYNC_IMPORT_NEW_USERS :
      # example :  export LDAP_BACKGROUND_SYNC_IMPORT_NEW_USERS=true
      #export LDAP_BACKGROUND_SYNC_IMPORT_NEW_USERS=false
      # LDAP_ENCRYPTION : If using LDAPS
      # example :  export LDAP_ENCRYPTION=ssl
      #export LDAP_ENCRYPTION=false
      # LDAP_CA_CERT : The certification for the LDAPS server. Certificate needs to be included in this docker-compose.yml file.
      # example :  export LDAP_CA_CERT=-----BEGIN CERTIFICATE-----MIIE+zCCA+OgAwIBAgIkAhwR/6TVLmdRY6hHxvUFWc0+Enmu/Hu6cj+G2FIdAgIC...-----END CERTIFICATE-----
      #export LDAP_CA_CERT=
      # LDAP_REJECT_UNAUTHORIZED : Reject Unauthorized Certificate
      # example :  export LDAP_REJECT_UNAUTHORIZED=true
      #export LDAP_REJECT_UNAUTHORIZED=false
      # LDAP_USER_SEARCH_FILTER : Optional extra LDAP filters. Don't forget the outmost enclosing parentheses if needed
      # example :  export LDAP_USER_SEARCH_FILTER=
      #export LDAP_USER_SEARCH_FILTER=
      # LDAP_USER_SEARCH_SCOPE : base (search only in the provided DN), one (search only in the provided DN and one level deep), or sub (search the whole subtree)
      # example :  export LDAP_USER_SEARCH_SCOPE=one
      #export LDAP_USER_SEARCH_SCOPE=
      # LDAP_USER_SEARCH_FIELD : Which field is used to find the user
      # example :  export LDAP_USER_SEARCH_FIELD=uid
      #export LDAP_USER_SEARCH_FIELD=
      # LDAP_SEARCH_PAGE_SIZE : Used for pagination (0=unlimited)
      # example :  export LDAP_SEARCH_PAGE_SIZE=12345
      #export LDAP_SEARCH_PAGE_SIZE=0
      # LDAP_SEARCH_SIZE_LIMIT : The limit number of entries (0=unlimited)
      # example :  export LDAP_SEARCH_SIZE_LIMIT=12345
      #export LDAP_SEARCH_SIZE_LIMIT=0
      # LDAP_GROUP_FILTER_ENABLE : Enable group filtering
      # example :  export LDAP_GROUP_FILTER_ENABLE=true
      #export LDAP_GROUP_FILTER_ENABLE=false
      # LDAP_GROUP_FILTER_OBJECTCLASS : The object class for filtering
      # example :  export LDAP_GROUP_FILTER_OBJECTCLASS=group
      #export LDAP_GROUP_FILTER_OBJECTCLASS=
      # LDAP_GROUP_FILTER_GROUP_ID_ATTRIBUTE :
      # example :
      #export LDAP_GROUP_FILTER_GROUP_ID_ATTRIBUTE=
      # LDAP_GROUP_FILTER_GROUP_MEMBER_ATTRIBUTE :
      # example :
      #export LDAP_GROUP_FILTER_GROUP_MEMBER_ATTRIBUTE=
      # LDAP_GROUP_FILTER_GROUP_MEMBER_FORMAT :
      # example :
      #export LDAP_GROUP_FILTER_GROUP_MEMBER_FORMAT=
      # LDAP_GROUP_FILTER_GROUP_NAME :
      # example :
      #export LDAP_GROUP_FILTER_GROUP_NAME=
      # LDAP_UNIQUE_IDENTIFIER_FIELD : This field is sometimes class GUID (Globally Unique Identifier)
      # example :  export LDAP_UNIQUE_IDENTIFIER_FIELD=guid
      #export LDAP_UNIQUE_IDENTIFIER_FIELD=
      # LDAP_UTF8_NAMES_SLUGIFY : Convert the username to utf8
      # example :  export LDAP_UTF8_NAMES_SLUGIFY=false
      #export LDAP_UTF8_NAMES_SLUGIFY=true
      # LDAP_USERNAME_FIELD : Which field contains the ldap username
      # example :  export LDAP_USERNAME_FIELD=username
      #export LDAP_USERNAME_FIELD=
      # LDAP_FULLNAME_FIELD : Which field contains the ldap fullname
      # example :  export LDAP_FULLNAME_FIELD=fullname
      #export LDAP_FULLNAME_FIELD=
      # LDAP_MERGE_EXISTING_USERS :
      # example :  export LDAP_MERGE_EXISTING_USERS=true
      #export LDAP_MERGE_EXISTING_USERS=false
      # LDAP_SYNC_USER_DATA :
      # example :  export LDAP_SYNC_USER_DATA=true
      #export LDAP_SYNC_USER_DATA=false
      # LDAP_SYNC_USER_DATA_FIELDMAP :
      # example :  export LDAP_SYNC_USER_DATA_FIELDMAP={"cn":"name", "mail":"email"}
      #export LDAP_SYNC_USER_DATA_FIELDMAP=
      # LDAP_SYNC_GROUP_ROLES :
      # example :
      #export LDAP_SYNC_GROUP_ROLES=
      # LDAP_DEFAULT_DOMAIN : The default domain of the ldap it is used to create email if the field is not map correctly with the LDAP_SYNC_USER_DATA_FIELDMAP
      # example :
      #export LDAP_DEFAULT_DOMAIN=
      # LOGOUT_WITH_TIMER : Enables or not the option logout with timer
      # example : LOGOUT_WITH_TIMER=true
      #- LOGOUT_WITH_TIMER=
      # LOGOUT_IN : The number of days
      # example : LOGOUT_IN=1
      #- LOGOUT_IN=
      #- LOGOUT_ON_HOURS=
      # LOGOUT_ON_MINUTES : The number of minutes
      # example : LOGOUT_ON_MINUTES=55
      #- LOGOUT_ON_MINUTES=

      node main.js
      # & >> ../../wekan.log
      cd ../..
#done
