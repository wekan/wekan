# People / Audit log

## What it is

`/admin/people/audit-log`, site administrators only.

The audit log is the trail of what site administrators did: every
administrative action, newest first, one row each - when, who, which action,
whether it succeeded (a refused call is shown too, with its error), its
arguments and the address it came from. It answers "who changed this, and
when" for people, login, storage and backup changes.

## Read more

- [Audit trail](https://en.wikipedia.org/wiki/Audit_trail) on Wikipedia.
- [Logging (computing)](https://en.wikipedia.org/wiki/Logging_(computing)) on
  Wikipedia.
- [Security settings](../../../Security/Security-Settings.md) - attacks WeKan
  refused are in Admin Panel / Problems, not here.
- [Security report](../Problems/Security-Report.md) in Admin Panel / Problems.

## How to use it

**Read the trail**

1. Sign in as a site administrator.
2. Open **Admin Panel**, then **People**, then **Audit log** in the left menu
   (`/admin/people/audit-log`).
3. The table shows **When**, **Administrator**, **Action**, **Details** (the
   recorded arguments) and **IP**. A failed call is marked and its error is
   shown beside the action.
4. Use the **‹** and **›** buttons under the table to move between pages; the
   line between them shows `page / pages (total)`.

**Data access**

1. Click the **Data access** tab above the table.
2. It lists who downloaded what: each export of a board (JSON, CSV, Excel,
   PDF, ZIP, a chart or a card), of every board, of a person's data and of an
   Admin Panel list - one row per person, day, kind and target, with how
   many **Times**, the first and last time, and the last address. A public
   board's export by somebody not signed in has no username.
3. **Export CSV** downloads the whole list.

The rows are kept as long as the audit log (`ADMIN_AUDIT_RETENTION_DAYS`).
Erasing an account removes its username and address from them, and keeps the
anonymous id.

**It cannot be changed unseen**

Every row is hash-chained: it carries its place (`seq`), the hash of the row
before it and its own hash over what it records (`models/lib/auditChain.js`).
Once a day, and whenever `verifyAdminAuditChain` is called, the chain is
checked from the oldest row still kept; a row that was edited, or removed
from the middle, is reported in **Admin Panel → Problems → Filesystem
integrity** as "The administrators' audit log chain is broken". The
retention removes rows only from the old end, so it never breaks the chain;
rows written before the chain existed are counted, not checked.

**Send it to a SIEM**

Set `AUDIT_LOG_STDOUT=json` (Snap: `sudo snap set wekan
audit-log-stdout='json'`). Every audit log row, every security problem and
every data access is then also written to standard output as one JSON line,
`{"wekan":"audit", ...}`, `{"wekan":"security", ...}` or
`{"wekan":"data-access", ...}`, for Docker, journald or Fluent Bit to ship. A
line carries only what this page shows: the arguments as stored, already
redacted.

**Search it**

1. Type into the search box above the table.
2. The rows are narrowed to the ones whose administrator, action or arguments
   contain the text (case does not matter).

## How the numbers are calculated

From [server/adminAudit.js](../../../../server/adminAudit.js) and
[models/lib/adminAudit.js](../../../../models/lib/adminAudit.js):

- **Rows per page**: 50 (`PER_PAGE`), sorted by time, newest first.
- **Page**: at least 1; **pages** is the total divided by 50, rounded up.
- **Total**: the number of entries matching the search, counted on the server.
- **Search**: at most the first 100 characters of what is typed are used.
- **Kept for**: `ADMIN_AUDIT_RETENTION_DAYS` days - 365 by default
  (`AUDIT_KEEP_DAYS`), 0 keeps every entry, and a HIPAA deployment sets 2190 or
  more. Older entries are removed by a prune that runs once when WeKan starts
  and then once a day (`models/lib/retentionSettings.js`).
- **Recorded arguments**: each string is cut to 200 characters, an array or an
  object to its first 20 items (the rest shown as `[+N]`), nesting to 4
  levels, and the whole summary to 2000 characters.
- **Error text**: cut to 200 characters.
- **IP**: the client address, taking `HTTP_FORWARDED_COUNT` trusted proxies
  into account, the same way the login throttle reads it.

## How it works in WeKan

What is recorded: changes to people (Add user, Set password, username, email,
admin and active flags, removing a user, impersonation, unlocking), to
organizations and teams, to login and site settings, to attachment storage,
and backups, restores and data repairs. An administrator editing cards is a
member editing cards and is not recorded. The list of actions is
`AUDITED_METHODS` in [models/lib/adminAudit.js](../../../../models/lib/adminAudit.js).

The Admin Panel's switches that are saved straight from the browser - Settings
/ Appearance and Features, Announcement, Accessibility, Translation, Locked
users, Account settings, the table visibility modes, the invite roles and the
attachment storage settings - are recorded too, as the collection write they
are (for example `/settings/update`, with the changed fields), and so is
anonymising a user (`anonymizeUser`).

A password or a secret is never recorded: values under a credential-named key,
the arguments that are a password by position and a password inside a URL are
shown as `[redacted]`.

- [server/adminAudit.js](../../../../server/adminAudit.js) wraps each audited
  Meteor method at startup (and again after the other startup hooks). The
  wrapper looks up the caller BEFORE the call, so removing one's own admin
  rights is recorded too. Only a caller whose `isAdmin` is `true` is
  recorded; the method's result and error are passed through unchanged, and a
  failure to write the log never changes what the method did.
- Entries are documents in the `adminAuditLog` collection: `at`, `actorId`,
  `actorUsername`, `method`, `args` (the redacted summary), `ok`, `error`,
  `ip`, with an index on `at`.
- The `adminAuditLogPage` method serves one page; it refuses anybody who is not
  an active site administrator (`error-notAuthorized`).
- The pane is [client/components/settings/adminAuditLog.jade](../../../../client/components/settings/adminAuditLog.jade)
  and [adminAuditLog.js](../../../../client/components/settings/adminAuditLog.js),
  shown from [peopleBody.jade](../../../../client/components/settings/peopleBody.jade).
- Pinned by [tests/adminAudit.test.cjs](../../../../tests/adminAudit.test.cjs).

## Commits

 - [Sign-up and every method pass audit-argument-checks again with the audit wrapper](https://github.com/wekan/wekan/commit/508484ef1e195a1db7a7e795faf1f20d6c5a387a)
 - [Add the Audit log pane: what site administrators did](https://github.com/wekan/wekan/commit/4d5b83249959242169861b64227198e420d90d77)
