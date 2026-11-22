# LDAP AD Simple Auth

## What it is

AD Simple Auth lets WeKan log in to Microsoft Active Directory with the user's
own username and password, written as `username@mydomain.com`, instead of
with a service account and a full distinguished name. When it is enabled,
`LDAP_BASEDN` is not needed for that bind. It is a mode of WeKan's
[LDAP](LDAP.md) login.

## Read more

- [Active Directory on Wikipedia](https://en.wikipedia.org/wiki/Active_Directory)
- [Lightweight Directory Access Protocol on Wikipedia](https://en.wikipedia.org/wiki/Lightweight_Directory_Access_Protocol)
- [Microsoft: LDAP search filter syntax](https://learn.microsoft.com/en-us/windows/win32/adsi/search-filter-syntax)
- [**OTHER LDAP Settings**](./LDAP.md) and [**RELATED Search Filter Settings**](https://github.com/wekan/wekan/issues/3908#issuecomment-887545168):

```
- LDAP_USER_SEARCH_FILTER=(objectClass=user)
- LDAP_EMAIL_FIELD=mail
```

- [Original PR](https://github.com/wekan/wekan/pull/3909). Thanks to indika-dev.
- [Added settings for all remainin Wekan Standalone (non-Sandstorm) platforms](https://github.com/wekan/wekan/commit/fe40f35d6d9b6293f3bdbf5bc0f3e8e708c59518) and Docs to this wiki page. Thanks to xet7.

## How to use it

1. Enable LDAP itself as in [LDAP](LDAP.md) (`LDAP_ENABLE=true`,
   `LDAP_HOST`, `LDAP_PORT`, ...).
2. Set `LDAP_AD_SIMPLE_AUTH=true` and `LDAP_USER_AUTHENTICATION=true`. When
   enabled, LDAP_BASEDN is not needed. Example: `true`
3. Set `LDAP_DEFAULT_DOMAIN` - also change `mydomain.com` to your domain.
4. If you use LDAP Sync, also change those settings.
5. All of these can also be set in **Admin Panel / People / LDAP**
   (`/admin/people/ldap`); **Test connection** there tries the settings in
   effect.

**Docker**

Uncomment settings lines this way at [docker-compose.yml](../../../docker-compose.yml) to enable:
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

**Snap**

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

## How the numbers are calculated

There are no numbers; the two values WeKan builds are strings
([packages/wekan-ldap/server/ldap.js](../../../packages/wekan-ldap/server/ldap.js),
[packages/wekan-ldap/server/sync.js](../../../packages/wekan-ldap/server/sync.js)):

- **Bind name**: with AD Simple Auth it is `<login name>@<LDAP_DEFAULT_DOMAIN>`;
  without it, `<LDAP_USER_AUTHENTICATION_FIELD>=<escaped login name>,<LDAP_BASEDN>`.
- **Email of a new account**, in this order: the email from
  `LDAP_SYNC_USER_DATA_FIELDMAP`, else the entry's `mail` when it contains `@`,
  else `<username>@<LDAP_DEFAULT_DOMAIN>`; with none of those the login stops
  with "there is no email to create an account".

## How it works in WeKan

- `bindUserIfNecessary()` in
  [packages/wekan-ldap/server/ldap.js](../../../packages/wekan-ldap/server/ldap.js)
  does the user bind only when `LDAP_USER_AUTHENTICATION` is on. It refuses
  empty credentials first, and requires `LDAP_BASEDN` unless
  `LDAP_AD_SIMPLE_AUTH` is on.
- The settings are fields `adSimpleAuth`, `userAuthentication`,
  `userAuthenticationField` and `defaultDomain` of section `ldap` in
  [models/lib/authConfigCatalog.js](../../../models/lib/authConfigCatalog.js).
- Tests: [tests/ldapAuthenticationBoundary.test.cjs](../../../tests/ldapAuthenticationBoundary.test.cjs),
  [tests/ldapEmailFieldmap.test.cjs](../../../tests/ldapEmailFieldmap.test.cjs).

## Commits

 - [Reject LDAP empty credentials and enforce directory groups](https://github.com/wekan/wekan/commit/679a8b349960a64f03eabb9ae3c24d115be8915a)
 - [Admin Panel overrides for LDAP_* variables, and a Test LDAP Connection button](https://github.com/wekan/wekan/commit/ac363f979f3f73102e305302796eb6c65c5eefcb)
 - [Escape the user name in the LDAP bind DN (filter injection fix)](https://github.com/wekan/wekan/commit/0b0e16c3eae28bbf453d33a81a9c58ce7db6d5bb)
 - [AD Simple Auth: settings for all WeKan Standalone platforms](https://github.com/wekan/wekan/commit/fe40f35d6d9b6293f3bdbf5bc0f3e8e708c59518)
 - [Merge the AD Simple Auth pull request](https://github.com/wekan/wekan/commit/f6c36d6edd68da90c953038010b3f2a32dafab75)
 - [Comment on the additional use of LDAP_DEFAULT_DOMAIN](https://github.com/wekan/wekan/commit/0555b7e34c0ca2b533d4a597e60c03ee64f7d919)
 - [AD Simple Auth is working](https://github.com/wekan/wekan/commit/fe7962e10a30d82966477dafd3d3b1177d2fb715)
