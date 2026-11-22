# Admin Panel / People / People

## What it is

Every user on the instance: username, e-mail, whether they are an admin, the
feature profile that applies to them, whether the account is active, which
countries they sign in from, lockout status, when they were last active, and
when the account was created. It is where a site administrator creates, edits,
deactivates, unlocks, impersonates, anonymizes and deletes accounts, and puts
people into teams.

## Read more

- [User (computing)](https://en.wikipedia.org/wiki/User_(computing)),
  [Identity management](https://en.wikipedia.org/wiki/Identity_management) and
  [Internet geolocation](https://en.wikipedia.org/wiki/Internet_geolocation)
  on Wikipedia.
- [Locked Users](Locked-Users.md)
- [Members and Permissions](../../Board-Sidebar/Members/Members.md)
- [Login](Login.md) — whether users may change their username or delete themselves.
- [Impersonate user](../../Login-Page/Impersonate-user.md) and the
  [Impersonation report](../Problems/Impersonation-Report.md).
- [Offices](../Problems/Offices.md) - where people log in from, grouped by
  address.
- [Feature profiles](../Settings/Feature-Profiles.md)
- [Table page](../../General/Table.md) - the shared table this pane uses.

## How to use it

**Find people**

1. Open **Admin Panel**, **People**, **People** (`/admin/people/people`).
2. Type into the search box beside the filters and press Enter: it matches the
   username, the full name and the e-mail address.
3. Narrow the list with **Show:** — **All Users**, **Locked Users Only**,
   **Active**, **Not Active** or **Admin** — and with **Team:** (**All Teams**
   or one team).
4. Move between pages with prev/next; the total is the whole result set, not
   the page.

**Create and edit**

1. Click **New** in the first column's header, so a first user can always be
   created. (Not on Sandstorm, where every account is a Sandstorm user.)
2. Click **Edit** on a row to change **Username**, **Full Name**,
   **Initials**, **Admin**, **Email**, **Verified**, **Active Person**, the
   authentication type, **Organizations**, **Teams** and the password, then
   **Save**.
3. Click the avatar of a row to change that user's avatar.

**Activate, deactivate, unlock**

1. Click the green check or the red ban sign in the **Active Person** column to
   deactivate or activate the account.
2. Click the red lock in the **Status** column to unlock that account, or
   click **Unlock All** in the controls row to unlock every locked account.

**More actions**

1. Open the ⋯ menu of a row for **Impersonate user**, **Anonymize account** and
   **Delete**.
2. To add or remove teams for several people at once, tick them in the last
   column (the header checkbox selects every row) and click **Teams** in the
   controls row.

**See where someone signs in from**

1. In the **Location** column, click a country flag with its count.
2. The pane switches to that person's login addresses in that country, with
   the city, the IPv4 or IPv6 address, first seen and last seen; **Back**
   returns to People.

## How the numbers are calculated

- **Rows per page**: 10, `TABLE_PAGE_ROWS_PER_PAGE` in
  [models/lib/tablePage.js](../../../../models/lib/tablePage.js); the server
  sorts by creation date, newest first, and sends only that page.
- **The number of people is**: the count of all users matching the search and
  the filters (`getUsersCollectionCount`), not only the visible page.
- **Last active**: the time of the user's last login or of the last heartbeat
  of an open WeKan tab. A tab sends a heartbeat every 2 minutes
  ([client/lastActiveHeartbeat.js](../../../../client/lastActiveHeartbeat.js)),
  and the green dot "currently online" is shown when that time is at most 5
  minutes ago (`ONLINE_THRESHOLD_MS` in
  [models/lib/lastActive.js](../../../../models/lib/lastActive.js)).
- **Location**: for each country, the sum of the login counts of the user's
  tallied login addresses located in it; unknown (`XX`), Tor (`T1`) and
  malformed country codes are left out, and a country's rows are sorted by
  count, most first ([models/lib/loginTally.js](../../../../models/lib/loginTally.js)).
  At most 200 users are asked for at once. A login address is kept until
  `LOGIN_ADDRESS_RETENTION_DAYS` (default 365, 0 = for good) after its last
  use, then removed from the account and the address reports once a day
  ([models/lib/loginAddressRetention.js](../../../../models/lib/loginAddressRetention.js)).
- **Status (locked)**: locked while any source address of the account has an
  unlock time in the future ([models/lib/accountLockout.js](../../../../models/lib/accountLockout.js));
  the **Locked Users Only** filter uses the newest unlock time stored for
  display (`services.accounts-lockout.lockedUntil`).

## How it works in WeKan

Each row has **Edit** and a ⋯ menu; the avatar can be changed from the row; the
active and lockout states are clickable. The **New** link is the first column's
header, so a first user can always be created. A deactivated user's row is
struck through and cannot be selected.

- The pane is `peopleGeneral` and `peopleRow` in
  [peopleBody.jade](../../../../client/components/settings/peopleBody.jade),
  built by [peopleBody.js](../../../../client/components/settings/peopleBody.js)
  on the shared table page.
- The rows come from the `people` publication
  ([server/publications/people.js](../../../../server/publications/people.js))
  and `getPeoplePageIds`; the countries from `peopleLoginLocations`
  ([server/methods/loginOffices.js](../../../../server/methods/loginOffices.js)).
- Every change goes through an admin-checked method - `setCreateUser`,
  `editUser`, `setPassword`, `setUsername`, `setEmailVerified`, `setInitials`,
  `adminSetAvatarUrl`, `removeUser`, `anonymizeUser`, `impersonate`,
  `unlockUser`, `unlockAllUsers` - and the administrative ones are recorded in
  the [Audit log](Audit-Log.md).
- A per-tenant Organization admin sees this pane too, but only the members of
  the Organizations they administer, can never grant the site-wide Admin flag
  and can never manage a site admin
  ([models/lib/tenantAdmin.js](../../../../models/lib/tenantAdmin.js)).
- Pinned by [tests/lastActive.test.cjs](../../../../tests/lastActive.test.cjs),
  [tests/lockoutPerSourceAddress.test.cjs](../../../../tests/lockoutPerSourceAddress.test.cjs),
  [tests/peopleTeamFilter.test.cjs](../../../../tests/peopleTeamFilter.test.cjs),
  [tests/tablePage.test.cjs](../../../../tests/tablePage.test.cjs),
  [tests/tenantAdmin.test.cjs](../../../../tests/tenantAdmin.test.cjs)
  and the browser tests
  [05-admin-users.e2e.js](../../../../tests/playwright/specs/05-admin-users.e2e.js)
  and [admin-impersonation-avatar.e2e.js](../../../../tests/playwright/specs/admin-impersonation-avatar.e2e.js).

## Commits

 - [The feature profile of each person](https://github.com/wekan/wekan/commit/fc21b0b177dc8f8902efa39d0f89c8b041c7cf2d)
 - [Every row's Last active reaches the table](https://github.com/wekan/wekan/commit/c4376f92a5b682aa1b4b95a405e67ebb4bc01584)
 - [Last active for everyone, and inactive users can be disabled](https://github.com/wekan/wekan/commit/b933a69cd4953543cece844865ab7dc72eb4a6c1)
 - [Add the Last active presence column](https://github.com/wekan/wekan/commit/520b2e412ecba03c44a0a7ffcf8da5264a65aa77)
 - [Filter People by Team](https://github.com/wekan/wekan/commit/0297f52c4ba4beb47a60fb2c4d5798696c8c9af1)
 - [Add country login locations](https://github.com/wekan/wekan/commit/ff9d0bab8b63bee6ef70c70decf82a852f5bb2ba)
 - [People shows who is locked again, and why](https://github.com/wekan/wekan/commit/6e208c6152d9b236c95df3893bc0da6ba4798c14)
 - [One page of ten rows](https://github.com/wekan/wekan/commit/c1add5bc5e5537e3cc8f96076164ebdf4328b0e8)
 - [The tables are back, and the selected menu entry stands out](https://github.com/wekan/wekan/commit/b775ee1e1b3746cb3797a094820ef67e091f46a5)
 - [Search, filter and actions move to the shared controls row](https://github.com/wekan/wekan/commit/ccc95bffba484f7a1f8848e2801e8a4195cb7290)
 - [People renders through the shared table page](https://github.com/wekan/wekan/commit/6ff98891c8b30655446218636c6cf900fd6a508a)
 - [The filter, the lock and active icons, and Unlock All](https://github.com/wekan/wekan/commit/ae0d059b6feb38a438ca21aa154c63b410641763)
 - [Impersonate a user](https://github.com/wekan/wekan/commit/d19cc972e0dea0e41d67a2f7a98de1bf55344df6)
