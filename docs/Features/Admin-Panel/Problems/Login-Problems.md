# Admin Panel → Problems: login-page problems

Status: **Implemented** · Owner: xet7 · Related: `models/lib/loginProblems.js`,
`server/lib/systemStatus.js`, `snap-src/bin/wekan-problems.mjs`.

## What it is

A checklist of the known causes behind "I can't log in", shown to the
administrator with the current values. Two related symptoms are reported as
*"can't log in"*:

1. The login page shows the text **"Must be logged in"**.
2. After login, the login-page logo shows with the text **"Loading, please
   wait."** ("Läser in, var god vänta." in Swedish) and a spinner that never
   finishes; pages take minutes and the All Boards counts stay at `0`.

Both usually clear once whatever is loading the server finishes and CPU drops.
Problems → Summary → Status and `snap run wekan.problems login` list the known
causes.

## Read more

- [Meteor environment variables](https://docs.meteor.com/cli/environment-variables.html) -
  `ROOT_URL`, which must match the address users open.
- [Lightweight Directory Access Protocol](https://en.wikipedia.org/wiki/Lightweight_Directory_Access_Protocol) -
  the directory server whose connection limit can be exhausted.
- [Sandstorm](https://sandstorm.org/) - the platform whose grains authenticate
  asynchronously.
- WeKan: [Migrations](Migrations.md), [CPU usage](CPU-usage.md),
  [Snap](Snap.md), [Summary](Summary.md).

## How to use it

**In the browser**

1. Sign in as a site administrator and open **Admin Panel → Problems →
   Summary**.
2. Under **Status**, read what is in progress: while a migration or repair
   runs, it is listed with a spinner.
3. A login check that fails is listed as a problem with its detail, for
   example `ROOT_URL` not being set.

**On the server, without a browser**

1. Run `snap run wekan.problems login` for only the login checks, or
   `snap run wekan.problems` for the whole status (see [Snap.md](Snap.md)).

**Fix what it shows**

| Cause | Why it strands the login | Fix |
| --- | --- | --- |
| **A migration or repair is in progress** | The database is busy and initial subscriptions do not become ready, so the client sits on "Loading, please wait." or bounces to "Must be logged in". A saturated **ferretdb** process (see [CPU-usage.md](CPU-usage.md)) does the same. | Wait for it to finish (Problems → Summary → Status / `snap run wekan.problems`). If the backend itself is saturated, consider MongoDB — see [Migrations.md](Migrations.md). |
| **`ROOT_URL` wrong or unset** | If `ROOT_URL` does not match the address users open, the DDP login never completes. | Set `ROOT_URL` to the exact URL users open (e.g. `https://boards.example.com`) before starting WeKan. |
| **LDAP connection exhaustion** | Leaked LDAP connections exhaust the directory server's connection limit, so logins are slow or fail intermittently. | Check the LDAP server's connection count / limits. |
| **Sandstorm base path** | A Sandstorm grain authenticates asynchronously; a wrong base path strands the user on a "Must be logged in" page. | Ensure the base path / `ROOT_URL` is correct. |

## How the numbers are calculated

This feature has no numbers of its own: each check is a severity and an
ok/not-ok flag, from
[models/lib/loginProblems.js](../../../../models/lib/loginProblems.js):

| Check | Severity | Failing when |
| --- | --- | --- |
| `migration-in-progress` | `warning` while one runs, else `ok` | a migration or repair is in progress |
| `root-url` | `error` when unset, else `ok` | `ROOT_URL` is empty |
| `ldap` | `info` | never; shown only when `LDAP_ENABLE=true` |
| `sandstorm` | `info` | never; shown only under Sandstorm |

Only the checks with `ok: false` become problems on the Summary page
([models/lib/problemsOverview.js](../../../../models/lib/problemsOverview.js)),
so the LDAP and Sandstorm notes are seen only in the snap command's full
checklist. WeKan cannot see whether `ROOT_URL` is the *right* address, only
whether it is set.

## How it works in WeKan

**Where "Must be logged in" comes from.** It is **not** a fixed UI string. It is
the *reason* of a server-side `Meteor.Error('not-authorized', 'Must be logged
in')` that gets surfaced on the login page when a subscription or method runs
while the user id has not landed yet. The gated-page text you normally see is
the i18n key `error-notAuthorized`, not this raw reason.

- `getLoginProblems` in
  [server/lib/systemStatus.js](../../../../server/lib/systemStatus.js) builds
  the snapshot: whether anything is in progress (text database migration, board
  repair, data recovery, attachment migration), `ROOT_URL`, `LDAP_ENABLE` and
  the Sandstorm variables, and passes it to `loginProblemChecks`.
- The `systemStatusReport` method
  ([server/methods/systemStatus.js](../../../../server/methods/systemStatus.js))
  feeds the Status part of
  [client/components/settings/problemsSummary.jade](../../../../client/components/settings/problemsSummary.jade).
- [snap-src/bin/wekan-problems.mjs](../../../../snap-src/bin/wekan-problems.mjs)
  prints the same checklist as text, for admins with only server access.

The `migration-in-progress` and `ROOT_URL` checks are decided by the pure,
unit-tested `models/lib/loginProblems.js`, shared by the Admin Panel method and
the snap command so both agree. Test:
[tests/problemsStatus.test.cjs](../../../../tests/problemsStatus.test.cjs).

## Commits

- [Neutral check titles in snap wekan.problems](https://github.com/wekan/wekan/commit/0470adcf3bb9fd5390f17ce2a3cec367ee4b3da9)
 - [The Status overview and snap run wekan.problems, with the login-page causes](https://github.com/wekan/wekan/commit/5a1c9a61e98d0e1bc2ce566229bcdce3f81745ae)
