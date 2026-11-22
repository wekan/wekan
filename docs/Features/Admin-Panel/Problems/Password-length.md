# Admin Panel / Problems / Password length

## What it is

Who signs in with a password shorter than the minimum length, from where, and
whether they have changed it since. The URL is
`/admin/problems/password-length`. A minimum set after people chose their
passwords would lock them out if it were refused at sign-in; this report shows
who is affected first, and the minimum can then be enforced for new passwords
only.

## Read more

- [Password strength](https://en.wikipedia.org/wiki/Password_strength) - why
  length matters.
- [NIST SP 800-63B](https://pages.nist.gov/800-63-3/sp800-63b.html) - the
  password guidance that recommends a minimum length.
- WeKan: [Admin Panel / People / Login](../People/Login.md),
  [table page](../../General/Table.md),
  [Security settings](../../../Security/Security-Settings.md).

## How to use it

**Set the minimum**

1. Sign in as a site administrator and open **Admin Panel → Problems →
   Password length**.
2. Type the **Minimum password length**.
3. Tick **Enforce the minimum length** to refuse shorter new passwords, or
   leave it off to only report them.
4. Press **Save**.

**Read the table**

1. Pick the filter above the table: **Too short password** (default), **Fixed
   to long enough password** or **All**.
2. Type a username or an address in the search box and press Enter.

**The settings.** Above the table, with one **Save** button:

| Setting | Environment variable | Default | What it does |
| --- | --- | --- | --- |
| Minimum password length | `PASSWORD_MIN_LENGTH` | `8` | A sign-in with a shorter password is listed in the table below. Nothing is refused for it. |
| Enforce the minimum length | `PASSWORD_MIN_LENGTH_ENFORCE` | off | A shorter **new** password is refused (sign-up, Change Password, reset, enrolment, an administrator's Set password and Add user, `POST /users/register`), and an account that signs in with an older shorter password sees only **Change your password** until it has a long enough one. |

Both are also in **Admin Panel / People / Login**, and saving either page saves
the same setting. A value saved here overrides the environment variable; the
page says so when an environment variable is set.

**Signing in is never refused** for a short password, enforced or not: nobody
is locked out by a minimum set after their password was. Changing a password -
forced or not, in Member Settings or with a reset link - signs **every** session
of the account out, the one that changed it too, and the account then signs in
with the new password.

LDAP, OAuth2, OIDC, SAML, CAS and Sandstorm accounts are neither listed nor
asked: their password is their provider's, and so is its policy.

**The table.** One row per account, never one per sign-in, like every Problems
report: an account that signs in every day is one row whose count grows.

| Column | What it shows |
| --- | --- |
| Username | The account. |
| First login | The first time it signed in with a password shorter than the minimum. |
| IPv4 address | The latest IPv4 address it did so from, with the country's flag and the city when a CDN or proxy in front of WeKan said where the address is. |
| IPv6 address | The same for IPv6. |
| Last login | The latest time it signed in with a short password. |
| Times logged in | How many times it has. |
| Fixed | When its password was changed. Empty while it is still too short. |

The filter above the table, as on every [table page](../../General/Table.md):

| Filter | Shows |
| --- | --- |
| **Too short password** (default) | Accounts that still have a short password. |
| **Fixed to long enough password** | Accounts that changed theirs. |
| **All** | Both. |

The search box matches the username and the addresses.

## How the numbers are calculated

- **Minimum password length** - `PASSWORD_MIN_LENGTH`, default 8. A value that
  is not a whole number of at least 1 keeps the default; a larger value than
  256 is cut to 256 (`passwordPolicyConfig` in
  [models/lib/passwordPolicy.js](../../../../models/lib/passwordPolicy.js)).
- **Length** is counted in characters (Unicode code points), as a person counts
  them, not in bytes. A password is too short when that count is less than the
  minimum.
- **Longest password** - 512 characters, enforced or not.
- When the minimum is enforced, a new password that equals the username, the
  email address or the part of the email before `@` (when that is at least 3
  characters) is refused too.
- **Times logged in** - +1 for each sign-in with a short password; **First
  login** is set once; **Last login** and the addresses are the latest one's.
  Signing in with a short password again after a change clears **Fixed**
  (`shortLoginUpdate` in
  [models/lib/shortPasswordLogins.js](../../../../models/lib/shortPasswordLogins.js)).
- **Filters** - **Too short password** is the rows with no fixed date,
  **Fixed to long enough password** the rows with one, **All** both.
- 25 rows a page (`PER_PAGE` in
  [client/components/settings/passwordLengthReport.js](../../../../client/components/settings/passwordLengthReport.js)).

## How it works in WeKan

**How WeKan knows a password is short.** Meteor sends a password to the server
hashed, so the server never sees how long it is. The browser that typed it
does: after a sign-in that worked, it compares the length with the minimum and,
when it is shorter, tells the server "this one was short" - never the password
and never its length.

The same is true of a password changed through a form, so **Fixed** means the
password was changed and the account has not signed in with a short one since.
An account that changes its password to another short one is listed as too short
again the next time it signs in. An administrator's Set password is the one
change the server can measure, so a short one set there does not count as fixed.

Where an address is comes only from headers a CDN or proxy in front of WeKan sets
(`models/lib/geoHeaders.js`). WeKan sends no address to a geolocation service,
and the location is for display only - nothing is decided by it.

**Related files.**

| File | What it is |
| --- | --- |
| `models/lib/passwordPolicy.js` | The minimum, whether it is enforced, and which new passwords are refused. |
| `models/lib/shortPasswordLogins.js` | What a row is, the filter, and how one more short sign-in updates a row. |
| `models/shortPasswordLogins.js` | The collection. |
| `server/lib/shortPasswordLogins.js` | Recording a short sign-in, marking it fixed, and one page of the table. |
| `server/passwordChangeRequired.js` | The browser's report, the forced change, and signing every session out after a change. |
| `client/components/settings/passwordLengthReport.*` | This page. |
| `client/components/users/passwordChangeRequired.*` | **Change your password**, shown over everything while the change is required. |
| `config/accounts.js` | Where the browser notes the length on the sign-in form and reports a short one. |
| `tests/passwordPolicy.test.cjs`, `tests/passwordChangeRequired.test.cjs`, `tests/shortPasswordLogins.test.cjs` | Node tests. |
| `tests/playwright/specs/password-min-length-signup-login.e2e.js`, `tests/playwright/specs/password-length-report.e2e.js` | Browser tests. |

## Commits

- [Password policy specs no longer run side by side or leave a minimum enforced](https://github.com/wekan/wekan/commit/a4d2313a689edfaff5c242019422ece7561d91dc)
 - [Admin Panel / Problems / Password length, and a changed password signs every session out](https://github.com/wekan/wekan/commit/c99aa7f845ea41fe3a108d9c55abaa28298cdbf9)
 - [One breached-password lookup digest for the browser and the server](https://github.com/wekan/wekan/commit/f406d46fe747752a2dff7a737df619c1a8632977)
 - [Password policy for new passwords, and compulsory two-factor authentication](https://github.com/wekan/wekan/commit/d7abe9910a3bbb4871b1bb512d60f232556f8b54)
