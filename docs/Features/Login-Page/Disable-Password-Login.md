# Disable Password Login

## What it is

At login screen, do not show password login, and refuse it on the server.
Only show login button (OAuth2, LDAP, etc). This is for a WeKan where everybody signs in through an identity
provider, so the username and password fields would only confuse people.

## Read more

There is no outside article about this; it is a WeKan setting. Related WeKan
pages:

- [Admin Panel / People / Login](../Admin-Panel/People/Login.md)
- [OAuth2](OAuth2.md), [LDAP](LDAP.md), [Header Login](Header-Login.md),
  [Windows SSO](WindowsSSO.md)

## How to use it

Set `PASSWORD_LOGIN_ENABLED` to `false` for your platform, or in
**Admin Panel / People / Login** (`/admin/people/login`), where a saved value
wins over the environment variable. Then reload the sign-in page.

**Snap**

```
sudo snap set wekan password-login-enabled='false'
```
[wekan-help](../../../snap-src/bin/wekan-help#L816)

**Docker**
```
- PASSWORD_LOGIN_ENABLED=false
```
[docker-compose.yml](../../../docker-compose.yml#L998)

**Windows On-Premise**

[Offline](../../Platforms/Propietary/OS/Windows/Offline.md)
```
SET PASSWORD_LOGIN_ENABLED=false
```
[start-wekan.bat](../../../start-wekan.bat#L807)

**Linux On-Premise**

[Raspberry Pi](../../Platforms/FOSS/HW/RaspberryPi/Raspberry-Pi.md)
```
export PASSWORD_LOGIN_ENABLED=false
```
[start-wekan.sh](../../../start-wekan.sh#L844)

## How the numbers are calculated

This setting has no numbers. Its default is `true` (the password form is
shown); only the exact value `false` hides it.

## How it works in WeKan

- [server/models/settings.js](../../../server/models/settings.js) method
  `isPasswordLoginEnabled` returns `!(authEnv('PASSWORD_LOGIN_ENABLED') ===
  'false')`; `authEnv` reads the Admin Panel value first, then the
  environment variable ([server/lib/authConfig.js](../../../server/lib/authConfig.js),
  field `passwordLoginEnabled` of section `login` in
  [models/lib/authConfigCatalog.js](../../../models/lib/authConfigCatalog.js)).
- [client/components/main/layouts.js](../../../client/components/main/layouts.js)
  keeps the password form (`.at-pwd-form`) hidden and shows it only when the
  method does not answer `false`, waiting for the form to render first; an
  error answer shows the form rather than leaving the page with no fields at
  all.
- It is enforced on the server too, not only hidden
  ([models/lib/passwordLoginPolicy.js](../../../models/lib/passwordLoginPolicy.js)):
  a DDP sign-in through the password service (`login`, and also
  `resetPassword`, `verifyEmail` and `createUser`) is refused by an
  `Accounts.validateLoginAttempt` hook in
  [server/authentication.js](../../../server/authentication.js), whether the
  password was right or not, and `POST /users/login`
  ([server/apiAuthRoutes.js](../../../server/apiAuthRoutes.js)) answers 403
  `password-login-disabled` before it looks up any user. With LDAP on, a
  username sent to `POST /users/login` goes to the directory only, and the LDAP
  handler's own `LDAP_LOGIN_FALLBACK` keeps working, because that is an LDAP
  decision of the operator. Meteor's `forgotPassword` is refused too: the reset
  link would only lead to a refused sign-in. Every refusal shows in
  **Admin Panel / Problems** as *Password login disabled*. See
  [Settings enforced on the server](../Admin-Panel/Settings-Enforced-On-Server.md).
- Tests: [tests/authConfigCatalog.test.cjs](../../../tests/authConfigCatalog.test.cjs)
  (the setting is in the catalog and on every platform),
  [tests/passwordLoginPolicy.test.cjs](../../../tests/passwordLoginPolicy.test.cjs)
  (the decision, and every server path that checks a password) and
  [server/lib/tests/passwordLoginDisabled.tests.js](../../../server/lib/tests/passwordLoginDisabled.tests.js)
  (a DDP and a REST sign-in refused on a running server).

## Commits

 - [Admin Panel / People / Login overrides PASSWORD_LOGIN_ENABLED](https://github.com/wekan/wekan/commit/eb49a4b1b6853650823434e924f5d0dc47a4fe5b)
 - [Hide password login with the PASSWORD_LOGIN_ENABLED variable](https://github.com/wekan/wekan/commit/3e817257ef6d7a527aaad040cdcdcc642caea3c1)
