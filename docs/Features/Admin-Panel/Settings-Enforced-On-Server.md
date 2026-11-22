# Settings enforced on the server

## What it is

Which Admin Panel and board settings that turn something **off** are refused
by the server, and which only change what the interface shows.

A setting that only hides a button is not a setting: anybody who calls the
method, the publication or the REST route behind the button still gets what
the button did. So a setting that turns something off, or restricts who may do
it, is decided on the server too - in the Meteor method, the publication, the
REST route, the login handler or the allow/deny rule that the hidden button
would have used. The interface hiding it is the visible half; the server
refusing it is the half a crafted call meets.

A few settings are display preferences on purpose. They are listed below too,
with the reason, so that "display only" is a decision and not a gap.

## Read more

- [Defense in depth](https://en.wikipedia.org/wiki/Defense_in_depth_(computing))
  and [Security through obscurity](https://en.wikipedia.org/wiki/Security_through_obscurity)
  on Wikipedia - why a hidden button is not a refusal.
- [OWASP: Insecure direct object references](https://owasp.org/www-project-web-security-testing-guide/latest/4-Web_Application_Security_Testing/05-Authorization_Testing/04-Testing_for_Insecure_Direct_Object_References)
  and [CWE-284: Improper Access Control](https://cwe.mitre.org/data/definitions/284.html).
- WeKan: [Who sees and can do what](Who-Sees-What.md),
  [Admin Panel / Problems](Problems/README.md),
  [Disable password login](../Login-Page/Disable-Password-Login.md).

## How to use it

Nothing to turn on: every setting below is enforced as soon as it is saved.

1. Change the setting in the Admin Panel (or the board's settings) as usual.
2. The interface hides what the setting turned off.
3. A call that still asks for it - a page left open from before the change,
   an API client, a crafted request - is refused by the server.
4. Where no screen can produce that call any more, the refusal is an attempt
   and shows in **Admin Panel / Problems** under the name in the table. Each
   row there is a summary, not one line per refusal: how many, since when, and
   who. None of these refusals disables the account, because a page left open
   from before the change sends the same call.

**Login settings**

| Setting | What the server refuses | Problems |
| --- | --- | --- |
| People / Login: `PASSWORD_LOGIN_ENABLED` = false | Every sign-in through the password service: the DDP `login` with a password, and the sign-ins that `resetPassword`, `verifyEmail` and `createUser` make, whether the password was right or not; `POST /users/login` answers 403 `password-login-disabled` before it looks up any user. LDAP keeps working: with LDAP on, a username sent to `POST /users/login` goes to the directory only, and the LDAP handler's own `LDAP_LOGIN_FALLBACK` is an LDAP decision of the operator. Meteor's `forgotPassword` is refused too. | Password login disabled |
| People / Login: Forgot password unticked | Meteor's `forgotPassword` method, which e-mails a reset link. A reset link an administrator sent still works. | Forgot password disabled |
| People / Login: Self delete user account unticked | `removeUser` and `anonymizeUser` on your own account, and `DELETE /api/users/:userId` when an administrator names their own id. Administrators too: the profile draws the buttons for nobody while it is off. Deleting another user from Admin Panel / People is unchanged. | Disabled setting |
| (always) The last site administrator | Deleting or anonymizing your own account when you are the only site administrator - it used to skip the check that deleting somebody else had. Not recorded: the buttons are there, so it is ordinary use. | - |
| People / Login: Username Change unticked | A direct client write of your own `username` (`Users.update`), the way round the `setUsername` method, which already refused. E-mail addresses are never written that way. | Disabled setting |

## How the numbers are calculated

Problems counts every refused call once in the row of its kind; the actor
tally names the account (when the call had one) and the address it came from.

## How it works in WeKan

- [models/lib/passwordLoginPolicy.js](../../../models/lib/passwordLoginPolicy.js)
  decides the login settings: `passwordLoginRefusal` for a DDP sign-in,
  `restPasswordLoginRoute` for `POST /users/login`, `forgotPasswordRefusal`
  for `forgotPassword`. [server/authentication.js](../../../server/authentication.js)
  asks it in an `Accounts.validateLoginAttempt` hook and in a wrapper around
  Meteor's `forgotPassword` method; [server/apiAuthRoutes.js](../../../server/apiAuthRoutes.js)
  asks it before the user lookup.
- [models/lib/selfAccountRemoval.js](../../../models/lib/selfAccountRemoval.js)
  decides deleting or anonymizing your own account (`selfRemovalRefusal`),
  asked by `removeUser`, by `anonymizeUser` through
  [models/lib/userAnonymization.js](../../../models/lib/userAnonymization.js)
  and by `DELETE /api/users/:userId` in
  [server/models/users.js](../../../server/models/users.js). The username
  write is a `Users.deny` rule in
  [server/permissions/users.js](../../../server/permissions/users.js).
- The Problems names are keys of
  [models/lib/securityCategories.js](../../../models/lib/securityCategories.js),
  recorded with `securityLog.record({ key, action: 'blocked', ... })`.
- Tests: [tests/passwordLoginPolicy.test.cjs](../../../tests/passwordLoginPolicy.test.cjs)
  (the decisions, and every server path that checks a local password asks
  them) and [server/lib/tests/passwordLoginDisabled.tests.js](../../../server/lib/tests/passwordLoginDisabled.tests.js)
  (a DDP and a REST sign-in refused on a running server);
  [tests/selfAccountRemoval.test.cjs](../../../tests/selfAccountRemoval.test.cjs)
  (the rule, and every server file that removes or anonymizes users asks it)
  and [server/lib/tests/selfAccountRemoval.tests.js](../../../server/lib/tests/selfAccountRemoval.tests.js).
