# Passwordless login: a one-time code by email

## What it is

Meteor's `accounts-passwordless` package lets a user sign in with a code that
WeKan emails them, instead of a password. WeKan wires it in behind one switch,
`PASSWORDLESS_ENABLED`. The email is a login factor, so this is only as strong
as the user's mailbox. It is a convenience for people who forget passwords,
not a second factor; for that see
[Two-Factor Authentication](Two-Factor-Authentication.md).

## Read more

- [One-time password at Wikipedia](https://en.wikipedia.org/wiki/One-time_password)
- [Meteor accounts-passwordless documentation](https://docs.meteor.com/packages/accounts-passwordless.html)
- [OAuth Providers](OAuth-Providers.md): Google, GitHub, Facebook, Twitter,
  Meteor Developer, Weibo, Meetup
- [Forgot Password](Forgot-Password.md), which uses the same outgoing email

## How to use it

**Turn it on (administrator)**

1. Make outgoing email work first: `MAIL_URL`, or the Admin Panel / People /
   E-mail settings. Test with a "forgot password" email before enabling this.
2. Set the switch:

   | Variable | Meaning |
   | --- | --- |
   | `PASSWORDLESS_ENABLED` | `true` adds "Email me a sign-in code" to the login page. Default `false`. |

   It can be overridden in **Admin Panel / People / Passwordless login**
   ("Email a one-time sign-in code instead of a password"), and a value set
   there wins over the environment variable.

   `PASSWORDLESS_ENABLED` is commented out, with the explanation above, in
   `docker-compose.yml` (and the FerretDB / MongoDB variants), `Dockerfile`,
   `start-wekan.sh`, `start-wekan.bat`, the Snap
   (`snap set wekan passwordless-enabled='true'`) and the Sandstorm package
   definition.
3. To have only passwordless and the social providers, and no password form
   at all, also set `PASSWORD_LOGIN_ENABLED=false`
   ([Disable Password Login](Disable-Password-Login.md)).

**Sign in with a code (user)**

1. On the sign-in page type your address in **Email address** and click
   **Email me a sign-in code**.
2. The page says "We emailed you a sign-in code". Open the email.
3. Type the code in **Enter the code from the email** and click **Sign in
   with code**. **Cancel** goes back to the address.

```
  browser                        WeKan                       mail server
    |  email address               |                              |
    |----------------------------->|  10-character code, valid   |
    |                              |  for 15 minutes, sent to     |
    |                              |  that address                |
    |                              |----------------------------->|
    |  user reads the code         |                              |
    |  in their inbox              |                              |
    |  types the code              |                              |
    |----------------------------->|  code matches and is not     |
    |                              |  expired: log in             |
    |  logged in                   |                              |
    |<-----------------------------|                              |
```

What it does and does not do:

- An existing WeKan user with that email logs in as themselves; no password
  is asked and no password is set or changed.
- An unknown email creates a new user, subject to the registration rules in
  Admin Panel / People / Login (**Self-Registration**): with invite-only
  registration no account is created, exactly like a password sign-up, while
  existing users can still ask for a code.
- The code is single-use and short-lived. Asking for a new one invalidates the
  old one.

## How the numbers are calculated

- **Code length**: 10 characters (`tokenSequenceLength: 10` in
  `server/accounts-common.js`), over a trillion possible values. It used to be
  6 hex characters, 16.7 million values (CodeBleed).
- **Code lifetime**: 15 minutes (`loginTokenExpirationHours: 0.25`); it used
  to be an hour.
- **Request limit**: 5 code requests per minute per client address
  (`DDPRateLimiter` rule for `requestLoginTokenForUser` in
  `server/lib/oauthProviders.js`), on top of Meteor's per-connection limit, so
  fresh connections cannot turn it into a mail flood. A refused request is
  shown in Admin Panel → Problems (`brute.passwordless-request`).
- A failed code is **not** counted by [Accounts Lockout](Accounts-Lockout.md);
  the length and lifetime of the code are what make guessing it hopeless.
  (The old text said the lockout covered it; the code says otherwise.)

## How it works in WeKan

- Meteor `accounts-passwordless` creates and checks the code;
  [server/accounts-common.js](../../../server/accounts-common.js) sets its
  length and lifetime.
- [server/lib/oauthProviders.js](../../../server/lib/oauthProviders.js) -
  wraps `requestLoginTokenForUser` so that it does nothing while passwordless
  is off and creates no account while registration is closed
  ([models/lib/passwordlessRequestGuard.cjs](../../../models/lib/passwordlessRequestGuard.cjs)),
  and refuses `passwordless` logins while it is off.
- [server/lib/passwordlessTokenConsumption.cjs](../../../server/lib/passwordlessTokenConsumption.cjs) -
  removes the used code with a compare-and-set update, so it cannot be reused
  on a database backend whose positional update matched nothing.
- [client/components/main/layouts.jade](../../../client/components/main/layouts.jade) -
  the two forms on the sign-in page.
- REST API: `PUT /api/admin/passwordless` switches it
  ([REST API](../../API/REST-API.md#admin-panel-oauth-login-providers-and-passwordless)).
- Tests: [tests/passwordlessTokenConsumption.test.cjs](../../../tests/passwordlessTokenConsumption.test.cjs),
  [tests/passwordlessMeteor36.test.cjs](../../../tests/passwordlessMeteor36.test.cjs),
  [tests/oauthProvidersPlatformEnv.test.cjs](../../../tests/oauthProvidersPlatformEnv.test.cjs).

## Integration tests

See [local login protocol tests](Testing.md) for example identities, actual
request/response checks, failure cases and deployment limitations.

## Commits

 - [The Sandstorm .spk leaves out every login method but Sandstorm's](https://github.com/wekan/wekan/commit/e413cd4720274d50c6c02cf78dbdf56adada4684)
 - [Fix CodeBleed: sign-in codes long and short-lived enough not to be guessed](https://github.com/wekan/wekan/commit/611093e9574a987534f974ea7aa57751c1ae6385)
 - [Verify login provider exchanges and fix authentication failures](https://github.com/wekan/wekan/commit/4f7d28637e3c68d20c8c8462dfaea1289210c861)
 - [Harden Meteor 3.6 passwordless account requests](https://github.com/wekan/wekan/commit/ab11bad2105f970880cc3e1274d3b9c8b0bfb41a)
 - [REST API for the OAuth login provider and passwordless settings](https://github.com/wekan/wekan/commit/bbcd98d9d83b874200ba45b2cbc2a495585031d9)
 - [Admin Panel override of the passwordless setting](https://github.com/wekan/wekan/commit/d1b5d0a75cf598dd7b079a290a6498059d638e94)
 - [Passwordless login in every platform's settings](https://github.com/wekan/wekan/commit/61806605fc98449c976e42366bef92cc65153e39)
 - [Add passwordless login](https://github.com/wekan/wekan/commit/83d2a7fc753d1790a2f166b04e470801fe114ced)
