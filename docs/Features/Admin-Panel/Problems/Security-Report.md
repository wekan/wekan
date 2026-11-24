# Admin Panel / Problems / Security Report

## What it is

Every attempt a security guard refused or noticed: what it was, how severe,
who tried it, from where and how many times. When WeKan blocks, cleans,
rate-limits or detects something that only an attack would do, it writes one
summary row here, so an administrator can see that somebody tried and not only
that the hole is closed. Address: `/admin/problems/security-report`. Site
administrators only. It is called Security Report, not Security, because Admin
Panel / Settings / [Security](../Settings/Security.md) is the pane of security
switches.

## Read more

- [Intrusion detection system](https://en.wikipedia.org/wiki/Intrusion_detection_system)
  on Wikipedia - recording and reporting attempted attacks, which is what this
  pane does inside WeKan.
- [Brute-force attack](https://en.wikipedia.org/wiki/Brute-force_attack) on
  Wikipedia - the `brute-force` rows (login, invitation, account recovery,
  passwordless code requests).
- [CWE](https://cwe.mitre.org/) - the Common Weakness Enumeration, whose ids
  each catalog key carries.
- [WeKan Hall of Fame](https://wekan.fi/hall-of-fame/) - the names in the Name
  column.
- In WeKan: [Security remediation design](../../../Security/Remediation/WeKan.md),
  [Meteor 3.5.3 security fixes](../../../Security/Meteor-3.5.3-Security-Fixes-2026-10-22.md),
  [Design.md](Design.md), [Summary.md](Summary.md).

## How to use it

**Read the report**

1. Log in as a site administrator.
2. Click your avatar or username at the top right and choose **Admin Panel**.
3. Click the **Problems** tab.
4. In the left menu, under **Reports**, click **Security Report**.
5. Read the rows, newest first. Attempts says how many times a row happened;
   Detail says what the guard saw.
6. Type a name, category, source, username or address in the search box to
   filter as you type - for example an address, to see everything that address
   tried.
7. Click a username to open the Edit user popup for that account.

**Re-enable an account that was disabled by a security event**

1. Open Admin Panel → **People**.
2. Find the account and enable its login again
   ([People](../People/README.md)).

**Acknowledge or clear the report**

1. Open Problems → **Summary**.
2. Tick **Admin Panel → Problems → Security Report**.
3. Click **Acknowledge** to reset the new-problem count, or **Clear** to delete
   the rows ([Summary.md](Summary.md)).

## How the numbers are calculated

| Number | How it is computed |
| --- | --- |
| Attempts | the row's `count`: how many occurrences were folded into it ([server/lib/eventLogFold.js](../../../../server/lib/eventLogFold.js)). Empty when it happened once. |
| One row | the identity is stream, name (`bleed`), category, action, source, severity and CWE ([models/lib/eventLogSummary.js](../../../../models/lib/eventLogSummary.js)). The user and address are not part of it; they describe the most recent occurrence, and a capped per-user and per-address tally is kept inside the row. |
| Date and time | the most recent occurrence (`at`). |
| Severity | from the catalog key in [models/lib/securityCategories.js](../../../../models/lib/securityCategories.js), unless the guard passes its own. |
| Passwordless request limit | 5 `requestLoginTokenForUser` calls per source address per 60 seconds (`DDPRateLimiter` rule in [server/lib/oauthProviders.js](../../../../server/lib/oauthProviders.js)); each refused call is recorded as `brute.passwordless-request`, name **Passwordless**, `blocked`, severity `high`. |
| Account disabled | when the row is `blocked`, of severity `high` or `critical`, names a logged-in user, and its catalog key does not set `blocksAccount: false` ([server/lib/blockOnSecurityEvent.js](../../../../server/lib/blockOnSecurityEvent.js)). |
| New-problem count on Summary | rows newer than the last acknowledgement whose severity is not `info` ([models/lib/eventLogProblems.js](../../../../models/lib/eventLogProblems.js)). |
| Rows per page | 10. |
| Retention | rows older than `EVENTLOG_RETENTION_DAYS` (default 90; `0` keeps them for ever) are deleted, checked once a day for the whole installation. |

## How it works in WeKan

### Where the rows come from

The `security` stream of the `eventlog` collection ([models/eventLog.js](../../../../models/eventLog.js)).
Every runtime guard reports through [server/lib/securityLog.js](../../../../server/lib/securityLog.js)
when it blocks, sanitizes, rate-limits or detects something, using a key from
the catalog in `models/lib/securityCategories.js` (category, Hall of Fame name,
severity, CWE). Besides the guards, this stream also receives:

- the canaries - operations WeKan never issues, such as a database canary
  marked by FerretDB (`server/lib/databaseProblems.js`);
- the daily filesystem integrity scan's findings (`integrity.file`,
  **StorageBleed**, `server/lib/fileIntegrityScan.js`) and the hourly change
  history audit (`integrity.history`, **HistoryIntegrity**,
  `server/lib/historyIntegrityScan.js`);
- denied passwordless code requests after five requests per source address in
  one minute;
- the Meteor 3.5.3 refusals, recorded as **Meteor DDP**, **Meteor allow-deny**,
  **Meteor dynamic-import** and **Meteor OAuth**
  ([details](../../../Security/Meteor-3.5.3-Security-Fixes-2026-10-22.md));
- **ImportExportValidation** (an import or export refused by the transfer
  boundary) and **ImportExportFailure** (one that failed for another reason,
  recorded as detected, never as an attempt).

Each problem is one row that accumulates (`server/lib/eventLogFold.js`): the
kind of thing that happened is the row, and the user name and address describe
its most recent occurrence ([Design.md](Design.md)).

Only an attempt is recorded, never ordinary use: a guard that a legitimate user
can reach does not write here, or writes without disabling the account
(`blocksAccount: false` in its catalog key).

### Consequence for the account

When a row is `blocked`, of severity `high` or `critical`, names a logged-in
user and its catalog key does not say otherwise, that account is disabled
(`loginDisabled`) with the reason "Attempted <name> at <source> while logged
in" (`server/lib/blockOnSecurityEvent.js`). The reason, the name, the source
and the address are kept in the user's `services.securityBlock`. The address is
recorded, never blocked. An administrator re-enables the account in Admin Panel
/ [People](../People/README.md).

### The table

The shared [table page](../../Table.md), newest row first, 10 rows a
page, read-only:

| Column | Holds |
| --- | --- |
| Date and time | when it last happened |
| Category | the guard's class, for example `ssrf` or `integrity` |
| Name | the Hall of Fame name (`...Bleed`) or another fixed name |
| Severity | `info`, `low`, `medium`, `high` or `critical` |
| Action | `blocked`, `sanitized`, `rate-limited`, `remediated`, `detected` or `failed` |
| Source | the guard or module that recorded it |
| Username | the account, as it was called at the time; click it for the Edit user popup |
| IPv4, Location, IPv6, Location (IPv6) | the address, resolved with `HTTP_FORWARDED_COUNT`, and a location only when a trusted proxy supplies one ([models/lib/addressReportColumns.js](../../../../models/lib/addressReportColumns.js)) |
| Attempts | how many times this row happened; empty when once |
| Detail | what the guard said |

The search box filters as you type, case-insensitively, over category, name,
source, detail, username and address. The rows come from the admin-only
`eventLogCount` and `eventLogPage` methods.

Nothing is acknowledged here: the new-problem count is acknowledged or the
stream cleared on [Summary](Summary.md). Rows older than
`EVENTLOG_RETENTION_DAYS` (default 90) are deleted daily. The same rows are on
`GET /api/admin/problems/security`
([REST API](../../../API/REST-API.md#admin-panel-problems)).

### Tests

- [tests/securityLog.test.cjs](../../../../tests/securityLog.test.cjs) - the
  logger and its wiring.
- [tests/securityKeyWiring.test.cjs](../../../../tests/securityKeyWiring.test.cjs) -
  every key a guard uses is in the catalog.
- [tests/hallOfFameProblemsCoverage.test.cjs](../../../../tests/hallOfFameProblemsCoverage.test.cjs) -
  every Hall of Fame name that can be detected at runtime has a key, and the
  rest are listed with a reason.
- [tests/problemsFalseBlocks.test.cjs](../../../../tests/problemsFalseBlocks.test.cjs)
  and [tests/jamBleedVictimBlock.test.cjs](../../../../tests/jamBleedVictimBlock.test.cjs) -
  ordinary use and a guessed account are never disabled.
- [tests/passwordlessMeteor36.test.cjs](../../../../tests/passwordlessMeteor36.test.cjs) -
  the passwordless request limit is recorded.
- [tests/eventLogSummary.test.cjs](../../../../tests/eventLogSummary.test.cjs) -
  one row per problem, with the capped tally.

## Related

- [Security remediation design](../../../Security/Remediation/WeKan.md)
- [Hall of Fame](https://wekan.fi/hall-of-fame/) - the names in the Name column.

## Commits

 - [A row's address, location and user describe one occurrence](https://github.com/wekan/wekan/commit/80fb1c65fc0a19c1a8f970ea4873fd690188acd8)
 - [Clear button and 90-day retention for the problem streams](https://github.com/wekan/wekan/commit/fefabbf1134fd7d4c56c4375c0ac103032b75770)
 - [AuthBleed attempts are recorded](https://github.com/wekan/wekan/commit/314c153c9be569a427d9ecde8f63cfef540181e3)
 - [A failed import or export disables an account only when it was an attempt](https://github.com/wekan/wekan/commit/567f99227b2a05dc1b49374fbc2995bbda456ecc)
 - [An ordinary refused edit on one's own board no longer disables the account](https://github.com/wekan/wekan/commit/425b4ddea7ba402f65c74df9bdc1ab7fb0e2b924)
 - [Record the Meteor 3.5.3 security refusals](https://github.com/wekan/wekan/commit/e0189bc53bbfc475276757b2b465cc6eba0f8c6b)
 - [Record only attempts, so legitimate users are not disabled](https://github.com/wekan/wekan/commit/9d323f2aaf8e0402a9858d25d89d9f0f7917ae18)
 - [A login lockout never disables the account being guessed](https://github.com/wekan/wekan/commit/c49d9d8d3e29bffeb419ffcfc291f0655c3eaa5c)
 - [Rate-limit passwordless code requests per address and report the denials](https://github.com/wekan/wekan/commit/ab11bad2105f970880cc3e1274d3b9c8b0bfb41a)
 - [Show the origin context (address, location) in every event report](https://github.com/wekan/wekan/commit/fa68600bb5754609cef3768cdcbec93102030c16)
 - [Disable the account of a logged-in user who attempts an attack](https://github.com/wekan/wekan/commit/d8d1863dba897b4db53d0342f36f269a73655165)
 - [One summary row per problem, with who and how often](https://github.com/wekan/wekan/commit/3d08c65bb2e51ac9e0a21547e5b206f386c369a6)
 - [Canary tokens: who tried to override permissions, and from where](https://github.com/wekan/wekan/commit/d577f07700ad84d94a2caf72a2158cd9db1857d5)
 - [Store the security stream in the WeKan database](https://github.com/wekan/wekan/commit/1d82ef8eae344ca0565d0858fc697f470e471dd7)
 - [First security loggers](https://github.com/wekan/wekan/commit/9f07aa4506e5cdb54e4de42c7f551f83a1ae5b07)
 - [Add the Problems page with its Security pane](https://github.com/wekan/wekan/commit/0085f7fbfa81e820ce0736dd28b2b0786ac6e41c)
