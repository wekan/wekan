- [**OTHER LDAP Settings**](LDAP-AD-Simple-Auth) and [**RELATED Search Filter Settings**](https://github.com/wekan/wekan/issues/3908#issuecomment-887545168):

```
- LDAP_USER_SEARCH_FILTER=(objectClass=user)
- LDAP_EMAIL_FIELD=mail
```

- [Original PR](https://github.com/wekan/wekan/pull/3909). Thanks to indika-dev.
- [Added settings for all remainin Wekan Standalone (non-Sandstorm) platforms](https://github.com/wekan/wekan/commit/fe40f35d6d9b6293f3bdbf5bc0f3e8e708c59518) and Docs to this wiki page. Thanks to xet7.
- When enabled, LDAP_BASEDN is not needed. Example: `true`
- Also change `mydomain.com` to your domain.
- If you use LDAP Sync, also change those settings.

## Docker

Uncomment settings lines this wasy at [docker-compose.yml](https://github.com/wekan/wekan/blob/main/docker-compose.yml) to enable:
```
      #-----------------------------------------------------------------
      # ==== LDAP AD Simple Auth ====
      #
      # Set to true, if you want to connect with Active Directory by Simple Authentication.
      # When using AD Simple Auth, LDAP_BASEDN is not needed.
      #
      # Example:
      #- LDAP_AD_SIMPLE_AUTH=true
      #
      # === LDAP User Authentication ===
      #
      # a) Option to login to the LDAP server with the user's own username and password, instead of
      #    an administrator key. Default: false (use administrator key).
      #
      # b) When using AD Simple Auth, set to true, when login user is used for binding,
      #    and LDAP_BASEDN is not needed.
      #
      # Example:
      #- LDAP_USER_AUTHENTICATION=true
      #
      # Which field is used to find the user for the user authentication. Default: uid.
      #- LDAP_USER_AUTHENTICATION_FIELD=uid
      #
      # === LDAP Default Domain ===
      #
      # a) In case AD SimpleAuth is configured, the default domain is appended to the given
      #    loginname for creating the correct username for the bind request to AD.
      #
      # b) The default domain of the ldap it is used to create email if the field is not map
      #     correctly with the LDAP_SYNC_USER_DATA_FIELDMAP
      #
      # Example :
      #- LDAP_DEFAULT_DOMAIN=mydomain.com
      #
      #-----------------------------------------------------------------
```

## Snap

Wekan, enable:
```
sudo snap set wekan ldap-ad-simple-auth='true'

sudo snap set wekan ldap-user-authentication='true'

sudo snap set wekan ldap-default-domain='mydomain.com'
```
Wekan, disable:
```
sudo snap unset wekan ldap-ad-simple-auth

sudo snap unset wekan ldap-user-authentication

sudo snap unset wekan ldap-default-domain
```

[Wekan Gantt GPL](https://github.com/wekan/wekan/issues/2870#issuecomment-721364824), enable:
```
sudo snap set wekan-gantt-gpl ldap-ad-simple-auth='true'

sudo snap set wekan-gantt-gpl ldap-user-authentication='true'

sudo snap set wekan-gantt-gpl ldap-default-domain='mydomain.com'
```
Wekan Gantt GPL, disable:
```
sudo snap unset wekan-gantt-gpl ldap-ad-simple-auth

sudo snap unset wekan-gantt-gpl ldap-user-authentication

sudo snap unset wekan-gantt-gpl ldap-default-domain
```
