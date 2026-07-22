# Admin Panel → Problems: login-page problems

Status: **Implemented** · Owner: xet7 · Related: `models/lib/loginProblems.js`,
`server/lib/systemStatus.js`, `snap-src/bin/wekan-problems.mjs`.

Two related symptoms are reported as *"can't log in"*:

1. The login page shows the text **"Must be logged in"**.
2. After login, the login-page logo shows with the text **"Loading, please
   wait."** ("Läser in, var god vänta." in Swedish) and a spinner that never
   finishes; pages take minutes and the All Boards counts stay at `0`.

Both usually clear once whatever is loading the server finishes and CPU drops.
Problems → Status and `snap run wekan.problems login` list the known causes with
the current values.

## Where "Must be logged in" comes from

It is **not** a fixed UI string. It is the *reason* of a server-side
`Meteor.Error('not-authorized', 'Must be logged in')` that gets surfaced on the
login page when a subscription or method runs while the user id has not landed yet.
The gated-page text you normally see is the i18n key `error-notAuthorized`, not
this raw reason.

## Known causes and fixes

| Cause | Why it strands the login | Fix |
| --- | --- | --- |
| **A migration or repair is in progress** | The database is busy and initial subscriptions do not become ready, so the client sits on "Loading, please wait." or bounces to "Must be logged in". A saturated **ferretdb** process (see [CPU-usage.md](CPU-usage.md)) does the same. | Wait for it to finish (Problems → Status / `snap run wekan.problems`). If the backend itself is saturated, consider MongoDB — see [Migrations.md](Migrations.md). |
| **`ROOT_URL` wrong or unset** | If `ROOT_URL` does not match the address users open, the DDP login never completes. | Set `ROOT_URL` to the exact URL users open (e.g. `https://boards.example.com`) before starting WeKan. |
| **LDAP connection exhaustion** | Leaked LDAP connections exhaust the directory server's connection limit, so logins are slow or fail intermittently. | Check the LDAP server's connection count / limits. |
| **Sandstorm base path** | A Sandstorm grain authenticates asynchronously; a wrong base path strands the user on a "Must be logged in" page. | Ensure the base path / `ROOT_URL` is correct. |

## Seeing it

- **Admin Panel → Problems → Summary → Status** shows the login checks and marks the
  failing ones as problems.
- **`snap run wekan.problems login`** prints the same checklist as text, for admins
  with only server access (see [Snap.md](Snap.md)).

The `migration-in-progress` and `ROOT_URL` checks are decided by the pure,
unit-tested `models/lib/loginProblems.js`, shared by the Admin Panel method and the
snap command so both agree.
