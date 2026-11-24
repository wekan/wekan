# Brute force protection: accounts lockout

## What it is

Brute force protection slows down and then blocks somebody who keeps trying
passwords. After a few wrong passwords from one address WeKan waits longer
before it accepts the next try, and after too many it locks that address out
of that account for a while. The owner of the account, typing the right
password, is always let in, and a lock never disables the account itself.

## Read more

- [Brute-force attack on Wikipedia](https://en.wikipedia.org/wiki/Brute-force_attack)
- [OWASP: Blocking Brute Force Attacks](https://owasp.org/www-community/controls/Blocking_Brute_Force_Attacks)
- [Removing lockout from users, issue #3306](https://github.com/wekan/wekan/issues/3306)
- WeKan: [Admin Panel / People / Locked Users](../Admin-Panel/People/Locked-Users.md),
  [Admin Panel / People / People](../Admin-Panel/People/README.md),
  [Forgot password](Forgot-Password.md)

## How to use it

**Change the limits in the Admin Panel**

1. Click on top right your username / **Admin Panel**.
2. Open **People** → **Locked Users**.
3. Under **Brute Force Protection Settings**, set for **Settings for known
   users (correct username, wrong password)** and for **Settings for unknown
   users (non-existent username)**: **Failures before lockout**, **Lockout
   period (seconds)** and **Failure window (seconds)**.
4. Click **Save**.

**Set the starting values on the server**

For settings, see:
- Snap: `wekan.help | grep lockout`
- Docker: Search lockout from docker-compose.yml at https://github.com/wekan/wekan

```
ACCOUNTS_LOCKOUT_KNOWN_USERS_FAILURES_BEFORE=3
ACCOUNTS_LOCKOUT_KNOWN_USERS_PERIOD=60
ACCOUNTS_LOCKOUT_KNOWN_USERS_FAILURE_WINDOW=15
ACCOUNTS_LOCKOUT_UNKNOWN_USERS_FAILURES_BEFORE=3
ACCOUNTS_LOCKOUT_UNKNOWN_USERS_LOCKOUT_PERIOD=60
ACCOUNTS_LOCKOUT_UNKNOWN_USERS_FAILURE_WINDOW=15
```

These are read only when the setting does not exist in the database yet; after
that, the value saved in the Admin Panel is used. The older misspelling
`ACCOUNTS_LOCKOUT_UNKNOWN_USERS_FAILURES_BERORE` (as in docker-compose.yml)
still works.

**Unlock users**

1. **Admin Panel** → **People** → **People**: the **Status** column shows who
   is locked; click a locked user's status to unlock that user, or click
   **Unlock All** above the table.
2. Or, without the web interface, clear the lock in the database as in
   [Forgot password](Forgot-Password.md).

For UCS, it's UCS VM and inside it Docker container. You just ssh your ucs VM
like this, with same username password you used when installin UCS and
administering UCS apps, su to root:
```
ssh Administrator@192.168.0.100
su
```
And then use those Docker commands https://github.com/wekan/wekan/issues/3306#issuecomment-712743002

## How the numbers are calculated

**Known users** (the username exists), per account **and per source address**
([packages/wekan-accounts-lockout/src/lockoutDecision.js](../../../packages/wekan-accounts-lockout/src/lockoutDecision.js)):

- A correct password is always allowed and clears that address's counter.
- A wrong password while locked (`unlockTime > now`) is refused with
  `ceil((unlockTime - now) / 1000)` seconds remaining, at least 1, and does
  not extend the lock.
- A wrong password counts one failure. If more than `failureWindow` seconds
  have passed since the first failure of the run, the count starts again at 1.
- When the count reaches `failuresBeforeLockout`, the address is locked until
  `now + 1000 * lockoutPeriod`.
- Below that, the next attempt from that address must wait
  `loginDelayBase * 2^(n-1)` seconds after the n-th failure, capped at
  `loginDelayMax`. Defaults: base 1 second, max 30 seconds
  ([models/lockoutSettings.js](../../../models/lockoutSettings.js)); a base of 0
  turns the delays off. An attempt that comes too early is refused without
  being counted.

**Unknown users** (the username does not exist), per source address
([packages/wekan-accounts-lockout/src/unknownUser.js](../../../packages/wekan-accounts-lockout/src/unknownUser.js)):
the same count, window and lock period, kept per client address.

**Defaults** ([server/models/collectionBootstrap.js](../../../server/models/collectionBootstrap.js)):
3 failures before lockout, 60 seconds lockout period, 15 seconds failure
window, for both kinds. The Admin Panel inputs accept 1-10 failures, 10-600
seconds lockout period and 1-60 seconds failure window
([client/components/settings/peopleBody.jade](../../../client/components/settings/peopleBody.jade)).

**Per account, from any address**
([server/lib/accountLoginDelay.js](../../../server/lib/accountLoginDelay.js)):
after 5 failed logins on one account within 15 minutes, the account accepts
one attempt per delay of `1 s * 2^(count - 5)`, at most 30 seconds. Up to 5
addresses that signed in to that account successfully in the last 30 days are
exempt, so the owner is not slowed down.

**The source address** is the connection's address. With
`HTTP_FORWARDED_COUNT=n` (WeKan behind n proxies), it is the n-th entry from
the right of `X-Forwarded-For`
([packages/wekan-accounts-lockout/src/lockoutScope.js](../../../packages/wekan-accounts-lockout/src/lockoutScope.js)).

## How it works in WeKan

- The `wekan-accounts-lockout` package
  ([packages/wekan-accounts-lockout](../../../packages/wekan-accounts-lockout))
  hooks into Meteor's login attempts. Known-user state is stored in the
  user document under `services.accounts-lockout.byAddress.<key>`, where the
  key is the first 32 hex digits of the SHA-256 of the address; unknown-user
  state is in the `AccountsLockout.Connections` collection.
- [server/accounts-lockout-config.js](../../../server/accounts-lockout-config.js)
  starts it with the values of the `lockoutSettings` collection
  ([models/lockoutSettings.js](../../../models/lockoutSettings.js)); a value
  that cannot be read falls back to its default instead of leaving the server
  without a lockout. The Sandstorm .spk is built without this package, like
  the password login it protects.
- `Meteor.settings['accounts-lockout'].knownUsers` / `.unknownUsers` (an
  object) override the configured values
  ([packages/wekan-accounts-lockout/src/lockoutSettings.js](../../../packages/wekan-accounts-lockout/src/lockoutSettings.js)).
- [server/methods/lockedUsers.js](../../../server/methods/lockedUsers.js):
  `getLockedUsers`, `unlockUser` and `unlockAllUsers`, admin only; unlocking
  removes `services.accounts-lockout`.
- Each lockout is reported in Admin Panel / Problems
  ([server/lib/lockoutReporter.js](../../../server/lib/lockoutReporter.js)),
  naming the targeted account.
- Tests: [tests/lockoutPerSourceAddress.test.cjs](../../../tests/lockoutPerSourceAddress.test.cjs),
  [tests/jamBleedVictimBlock.test.cjs](../../../tests/jamBleedVictimBlock.test.cjs),
  [tests/lockoutSettings.test.cjs](../../../tests/lockoutSettings.test.cjs),
  [tests/lockoutConfigFailsClosed.test.cjs](../../../tests/lockoutConfigFailsClosed.test.cjs),
  [tests/accountLoginDelay.test.cjs](../../../tests/accountLoginDelay.test.cjs),
  [tests/twoFactorLockoutErrors.test.cjs](../../../tests/twoFactorLockoutErrors.test.cjs),
  [tests/playwright/specs/corsican-lockout-settings.e2e.js](../../../tests/playwright/specs/corsican-lockout-settings.e2e.js).

## Commits

 - [The lockout starts when Meteor.settings configures it](https://github.com/wekan/wekan/commit/7f9fc2e9573b0854eec90b37147861a8293a1566)
 - [The Sandstorm .spk leaves out every login method but Sandstorm's](https://github.com/wekan/wekan/commit/e413cd4720274d50c6c02cf78dbdf56adada4684)
 - [Start the lockout even when a lockout setting cannot be read](https://github.com/wekan/wekan/commit/3156dec7bc37f989dd58a40362958653ebd62779)
 - [A lockout never disables the account being guessed (JamBleed regression)](https://github.com/wekan/wekan/commit/c49d9d8d3e29bffeb419ffcfc291f0655c3eaa5c)
 - [Brake password guessing per account without locking the owner out](https://github.com/wekan/wekan/commit/fd8b51464f1c88a29ef69390e284bb51a08579ab)
 - [The lockout package is server-only](https://github.com/wekan/wekan/commit/5ce9f181ca4632b87b729245361b012c46f43268)
 - [Increasing delays after a wrong password, per source address](https://github.com/wekan/wekan/commit/9476cdc0fe6e377c451a19909ee970d14ae9d741)
 - [Admin Panel / People shows who is locked again, and why](https://github.com/wekan/wekan/commit/6e208c6152d9b236c95df3893bc0da6ba4798c14)
 - [JamBleed: an attacker's failures no longer count against the victim](https://github.com/wekan/wekan/commit/78478c39d05af52c7b74a09166b8098a5eba552a)
 - [LockoutBleed: no user enumeration, and password guessing is throttled](https://github.com/wekan/wekan/commit/c3742f2ed7cfeb3dc709997ca9403d3fae5f7188)
 - [The lockout package uses the Meteor 3 async API](https://github.com/wekan/wekan/commit/65ce948bb0fc5d97f0a6f73f02ed3ab35d2b4703)
 - [Brute force protection settings in Admin Panel / People / Locked Users](https://github.com/wekan/wekan/commit/ae0d059b6feb38a438ca21aa154c63b410641763)
 - [Added back the WeKan lockout, LDAP, OIDC and CAS packages](https://github.com/wekan/wekan/commit/00768b4392109dec62a4dcf44dbceb295990d785)
