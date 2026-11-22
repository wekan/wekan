# Admin Panel / People / Locked Users

## What it is

Brute-force protection: how many failed sign-in attempts lock an account out,
for how long, and within which time window the failures are counted. The pane
is titled **Brute Force Protection Settings**.

Separate limits are kept for **known users** (an existing account: correct
username, wrong password) and **unknown users** (a username with no account),
so guessing usernames cannot lock out real people faster than it is worth.

Who is locked out right now is shown in [People](People.md): a red lock in the
**Status** column, and the **Locked Users Only** choice of its **Show:**
filter. **Unlock All** is one of the actions in [People](People.md). (This
pane itself shows only the settings; it no longer lists the locked accounts.)

## Read more

- [Brute-force attack](https://en.wikipedia.org/wiki/Brute-force_attack) and
  [Password cracking](https://en.wikipedia.org/wiki/Password_cracking) on
  Wikipedia.
- [OWASP: Blocking brute force attacks](https://owasp.org/www-community/controls/Blocking_Brute_Force_Attacks)
- [Brute-force protection](../../../Security/brute-force-protection.md)
- [Accounts lockout](../../Login-Page/Accounts-Lockout.md)
- [Login problems](../Problems/Login-Problems.md) - a lockout that fires is
  shown in Admin Panel / Problems.

## How to use it

**Change the limits**

1. Open **Admin Panel**, **People**, **Locked Users**
   (`/admin/people/locked-users`).
2. Under **Settings for known users (correct username, wrong password)** and
   under **Settings for unknown users (non-existent username)**, fill in
   **Failures before lockout**, **Lockout period (seconds)** and **Failure
   window (seconds)**.
3. Click **Save**. The new values apply at once ("Brute force protection
   settings have been updated"); no restart is needed.

**See and release locked accounts**

1. Open **Admin Panel**, **People**, **People**.
2. In **Show:**, choose **Locked Users Only**.
3. Click a red lock in the **Status** column to unlock that account, or click
   **Unlock All** to unlock every locked account.

## How the numbers are calculated

From [packages/wekan-accounts-lockout/src/lockoutDecision.js](../../../../packages/wekan-accounts-lockout/src/lockoutDecision.js),
[server/accounts-lockout-config.js](../../../../server/accounts-lockout-config.js)
and [models/lib/accountLockout.js](../../../../models/lib/accountLockout.js):

| Field | Default | Form range |
| --- | --- | --- |
| Failures before lockout | 3 | 1 to 10 |
| Lockout period (seconds) | 60 | 10 to 600 |
| Failure window (seconds) | 15 | 1 to 60 |

The defaults are the same for known and unknown users. An empty, zero or
unreadable value falls back to its default, so a broken setting never leaves
WeKan without a lockout.

- **The counter** is per account AND per source address (GHSA-rf3w-rj48-jxcc):
  an attacker locks out the address they attack from, not the account's owner.
- **Each wrong password** adds 1 to that address's counter. When more than
  **Failure window** seconds have passed since the first failure of the run,
  the count starts again at 1.
- **When the count reaches Failures before lockout**, that address is locked
  for **Lockout period** seconds. Wrong passwords during the lock do not extend
  it.
- **A correct password** is always allowed, even during a lock, and clears that
  address's counter.
- **Increasing delays**: the decision module can make each further wrong
  password wait longer (a base that doubles each time, up to a maximum:
  `loginDelayBase` and `loginDelayMax`). The settings WeKan builds at startup
  and on Save do not include these two values, so no delay is applied unless
  `Meteor.settings['accounts-lockout'].knownUsers` sets them.
- **Locked, in People**: an account counts as locked while any of its
  addresses has an unlock time in the future. The remaining time is the
  longest of them, rounded up to whole seconds.

## How it works in WeKan

- The settings are documents of the `lockoutSettings` collection,
  [models/lockoutSettings.js](../../../../models/lockoutSettings.js), with ids
  `known-failuresBeforeLockout`, `known-lockoutPeriod`, `known-failureWindow`
  and the same three with `unknown-`.
- The pane is the `lockedUsersGeneral` template in
  [peopleBody.jade](../../../../client/components/settings/peopleBody.jade)
  and [lockedUsersBody.js](../../../../client/components/settings/lockedUsersBody.js).
  Save writes the six documents and then calls `reloadAccountsLockout`
  ([server/methods/lockoutSettings.js](../../../../server/methods/lockoutSettings.js)),
  which is admin-only and restarts the lockout with the new values.
- At startup, [server/accounts-lockout-config.js](../../../../server/accounts-lockout-config.js)
  reads the same settings and starts the `wekan-accounts-lockout` package,
  which hooks into Meteor's `Accounts.validateLoginAttempt`. A lockout that
  fires is reported to Admin Panel / Problems
  ([server/lib/lockoutReporter.js](../../../../server/lib/lockoutReporter.js)).
- `getLockedUsers`, `unlockUser` and `unlockAllUsers`
  ([server/methods/lockedUsers.js](../../../../server/methods/lockedUsers.js))
  are admin-only; unlocking is recorded in the [Audit log](Audit-Log.md).
- The lock state of a user is `services.accounts-lockout.byAddress`; the
  `lockedUntil` field beside it is for the People screen only and is never read
  by the lockout decision.
- The Sandstorm package is built without password login, so it has no lockout.
- Pinned by [tests/lockoutSettings.test.cjs](../../../../tests/lockoutSettings.test.cjs),
  [tests/lockoutPerSourceAddress.test.cjs](../../../../tests/lockoutPerSourceAddress.test.cjs),
  [tests/lockoutConfigFailsClosed.test.cjs](../../../../tests/lockoutConfigFailsClosed.test.cjs),
  [tests/loginFailureDecision.test.cjs](../../../../tests/loginFailureDecision.test.cjs),
  [tests/accountLoginDelay.test.cjs](../../../../tests/accountLoginDelay.test.cjs)
  and the browser test
  [tests/playwright/specs/corsican-lockout-settings.e2e.js](../../../../tests/playwright/specs/corsican-lockout-settings.e2e.js).

## Commits

 - [Brute-force lockout starts when Meteor.settings configures it](https://github.com/wekan/wekan/commit/7f9fc2e9573b0854eec90b37147861a8293a1566)
 - [Leave the lockout out of the Sandstorm package](https://github.com/wekan/wekan/commit/e413cd4720274d50c6c02cf78dbdf56adada4684)
 - [Brake password guessing per account without locking the owner out](https://github.com/wekan/wekan/commit/fd8b51464f1c88a29ef69390e284bb51a08579ab)
 - [Start the lockout even when a setting cannot be read](https://github.com/wekan/wekan/commit/3156dec7bc37f989dd58a40362958653ebd62779)
 - [A lockout never disables the account being guessed](https://github.com/wekan/wekan/commit/c49d9d8d3e29bffeb419ffcfc291f0655c3eaa5c)
 - [The lockout package is server-only](https://github.com/wekan/wekan/commit/5ce9f181ca4632b87b729245361b012c46f43268)
 - [Increasing delays after a wrong password, per source address](https://github.com/wekan/wekan/commit/9476cdc0fe6e377c451a19909ee970d14ae9d741)
 - [People shows who is locked again, and why](https://github.com/wekan/wekan/commit/6e208c6152d9b236c95df3893bc0da6ba4798c14)
 - [A lockout that fires is visible in Problems](https://github.com/wekan/wekan/commit/c3299c49019053f4e1bfd2f8442b85e2e46993ac)
 - [JamBleed: the lockout no longer counts an attacker's failures against the victim](https://github.com/wekan/wekan/commit/78478c39d05af52c7b74a09166b8098a5eba552a)
 - [Migrate the lockout server files to async for Meteor 3](https://github.com/wekan/wekan/commit/b431600d32c0e501b1377fa8063e8da8e7da587b)
 - [Add the brute-force protection settings, the People filter and Unlock All](https://github.com/wekan/wekan/commit/ae0d059b6feb38a438ca21aa154c63b410641763)
