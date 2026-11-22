# Impersonate a User

## What it is

An administrator can sign in as another user, to see WeKan exactly as that
user sees it - for example to find out why somebody cannot see a board or a
card. Every impersonation is recorded, and the records are listed in
Admin Panel / Problems / Impersonation Report.

## Read more

There is no outside article about this; it is a WeKan administrator feature.

- The feature was added to WeKan v4.39 at https://github.com/wekan/wekan/pull/3280
- WeKan: [Admin Panel / People / People](../Admin-Panel/People/People.md),
  [Admin Panel / Problems](../Admin-Panel/Problems/README.md),
  [Adding users](Adding-users.md)

## How to use it

To impersonate another user in the Admin Panel:

1. Go to **Admin Panel** → **People** → **People**.
2. Find the user you want to impersonate.
3. Click **⋯** (beside the user's **Edit** link at the start of the row).
4. Select **Impersonate user**.

You will now be logged in as that user, on All Boards.

**How to switch back.** To return to your original admin account:

- Click the **Reload** (🔄) button in your web browser to refresh the page.

**See who impersonated whom:** **Admin Panel** → **Problems** →
**Impersonation Report**.

## How the numbers are calculated

The feature has no numbers. The Impersonation Report is a paged table of the
`impersonatedUsers` records, one row per impersonation.

## How it works in WeKan

- [client/components/settings/peopleBody.jade](../../../client/components/settings/peopleBody.jade):
  the **⋯** link (`a.more-settings-user`) opens the `settingsUser` popup,
  whose first item is **Impersonate user**
  ([client/components/settings/peopleBody.js](../../../client/components/settings/peopleBody.js)).
  Without a user id in the popup it does not call the server (#6536).
- The `impersonate` method in [server/models/users.js](../../../server/models/users.js)
  checks that the user exists and that the caller is a site admin, inserts
  `{ adminId, userId, reason: 'clickedImpersonate' }` into
  `impersonatedUsers` ([models/impersonatedUsers.js](../../../models/impersonatedUsers.js)),
  and awaits `this.setUserId(userId)`, so Meteor 3 finishes restarting the
  subscriptions before the client switches (#6691). The client then calls
  `Meteor.connection.setUserId(userId)` and goes to `/`.
- Only the connection's user changes; the browser's login token stays the
  admin's, which is why a reload returns to the admin account.
- `isImpersonated` answers only for the user themselves or an admin.
- While impersonating, the board exports (Excel, CSV, TSV, JSON) are
  authorized by the normal export permission check (`canExportBoardData()`);
  the impersonation record is the audit row written after it.
- Tests: [tests/playwright/specs/38-impersonation.e2e.js](../../../tests/playwright/specs/38-impersonation.e2e.js),
  [tests/playwright/specs/admin-impersonation-avatar.e2e.js](../../../tests/playwright/specs/admin-impersonation-avatar.e2e.js),
  [server/lib/tests/impersonationReportQuery.tests.js](../../../server/lib/tests/impersonationReportQuery.tests.js),
  [tests/boardViewMissingProfile6691.test.cjs](../../../tests/boardViewMissingProfile6691.test.cjs).

## Commits

 - [Keep impersonation status private](https://github.com/wekan/wekan/commit/bb4c892254764d787a85d7b1a46e2e1f6683ec7a)
 - [Show initials for missing impersonated users](https://github.com/wekan/wekan/commit/ba4637e5587429c42278d5b9ac90500cab07b234)
 - [Await the Meteor 3 subscription transition during admin impersonation](https://github.com/wekan/wekan/commit/1c47bcc4ac46952e14204f8b00d322a4d6018d82)
 - [Keep swimlane scopes consistent for impersonated user profiles](https://github.com/wekan/wekan/commit/4a6738330a334cf6989039015e86b7fef2894bbc)
 - [Fix the impersonate error when the popup had no user id](https://github.com/wekan/wekan/commit/75d193d58f09823e311b5b893bf62407cab4722e)
 - [Admin Panel / Reports / Impersonation: paginated impersonation log report](https://github.com/wekan/wekan/commit/a13ce5ef092d69c6cc83a061a2437ae6dcb6b11d)
 - [Impersonation UI tests](https://github.com/wekan/wekan/commit/71c0c2b582c7588fac3cd6069d48a5f301c23069)
 - [Fix Impersonate User](https://github.com/wekan/wekan/commit/ce3e51b14755b9c0a7c655d7a96c4f01386b4efc)
 - [Update the Impersonate user page](https://github.com/wekan/wekan/commit/1301d67295953183b26feb17db4012febfc55df8)
 - [An impersonated user can export Excel/CSV/TSV/JSON](https://github.com/wekan/wekan/commit/3908cd5413b775d1ee549f0a95304cf9998d3855)
 - [Add admin ability: impersonate one user](https://github.com/wekan/wekan/commit/d19cc972e0dea0e41d67a2f7a98de1bf55344df6)
