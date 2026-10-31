# Admin Panel / Problems / Password length

Who signs in with a password shorter than the minimum length, from where, and
whether they have changed it since. The URL is `/admin/problems/password-length`.

## Settings

Above the table, with one **Save** button:

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

## The table

One row per account, never one per sign-in, like every Problems report: an
account that signs in every day is one row whose count grows.

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

## How WeKan knows a password is short

Meteor sends a password to the server hashed, so the server never sees how long
it is. The browser that typed it does: after a sign-in that worked, it compares
the length with the minimum and, when it is shorter, tells the server "this one
was short" - never the password and never its length.

The same is true of a password changed through a form, so **Fixed** means the
password was changed and the account has not signed in with a short one since.
An account that changes its password to another short one is listed as too short
again the next time it signs in. An administrator's Set password is the one
change the server can measure, so a short one set there does not count as fixed.

Where an address is comes only from headers a CDN or proxy in front of WeKan sets
(`models/lib/geoHeaders.js`). WeKan sends no address to a geolocation service,
and the location is for display only - nothing is decided by it.

## Related files

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
