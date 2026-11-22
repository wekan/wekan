# Admin Panel / Problems / Tests

## What it is

Runtime self-checks that failed: the kind of invariant a WeKan unit test
asserts, checked on the running server without a browser and without
Playwright. Shortly after the server starts it checks that the database
answers, that the files directory is writable, that the JavaScript heap has
room left and that the disk has free space; only a failure is shown here.
Address: `/admin/problems/tests`. Site administrators only.

## Read more

- [Smoke testing](https://en.wikipedia.org/wiki/Smoke_testing_(software)) on
  Wikipedia - a quick check that the basic functions work, which is what these
  self-checks are.
- [Built-in self-test](https://en.wikipedia.org/wiki/Built-in_self-test) on
  Wikipedia - a system that tests itself while it runs.
- [Node.js v8 module](https://nodejs.org/api/v8.html) - `v8.getHeapStatistics()`,
  the heap numbers the heap check reads.
- In WeKan: [RAM-usage.md](RAM-usage.md), [Disk-usage.md](Disk-usage.md),
  [Security-Report.md](Security-Report.md) (the same table).

## How to use it

**Read the failed checks**

1. Log in as a site administrator.
2. Click your avatar or username at the top right and choose **Admin Panel**.
3. Click the **Problems** tab.
4. In the left menu, under **Reports**, click **Tests**.
5. Each row is a check that failed: the Source column names the check, the
   Detail column is its error message. "No new problems." means no check has
   failed since the stream was last cleared.

**Acknowledge or clear the stream**

1. Open Problems → **Summary**.
2. Tick **Admin Panel → Problems → Tests**.
3. Click **Acknowledge** or **Clear** ([Summary.md](Summary.md)).

**Run the checks again**

The pane has no button for it. Restart WeKan (the checks run 15 seconds after
start), or call the admin-only Meteor method `runSelfChecks`, which returns
`{ checks, failures }`.

**Change the free disk space limit**

1. Set `WEKAN_MIN_FREE_DISK_MB` to the smallest free space, in MiB, the files
   filesystem may have.
2. Restart WeKan.

## How the numbers are calculated

From [server/lib/selfChecks.js](../../../../server/lib/selfChecks.js) and
[models/lib/runtimeHealth.js](../../../../models/lib/runtimeHealth.js):

| Number | How it is computed |
| --- | --- |
| When the checks run | once, 15 000 ms after `Meteor.startup`. |
| Heap headroom | `used_heap_size / heap_size_limit` from `v8.getHeapStatistics()`; fails at 0.9 (90 %) or more. The detail is `V8 heap <used> MiB of <limit> MiB (<percent>%)`, each MiB rounded (bytes / 1 048 576). |
| Free disk space | `bavail × bsize` from `fs.statfsSync()` on the files directory; fails below the minimum. The minimum is `WEKAN_MIN_FREE_DISK_MB × 1024 × 1024` when that is a number of 0 or more, otherwise 256 MiB. The detail is `filesystem has <free> MiB free; minimum <min> MiB`. |
| Severity | `medium` for these unit-style checks (`testLog.js` maps suite `unit` to `medium`, `security` to `high`, `e2e` to `low`). |
| `runSelfChecks` result | `checks` is the number of checks (4); `failures` is how many threw. |
| Attempts | how many failures were folded into this row; empty when once. |
| Retention | rows older than `EVENTLOG_RETENTION_DAYS` (default 90) are deleted once a day. |

## How it works in WeKan

### Where the rows come from

The `tests` stream of the `eventlog` collection, written by
`server/lib/selfChecks.js` through
[server/lib/testLog.js](../../../../server/lib/testLog.js). The checks run once,
15 seconds after the server starts. Only a failure is recorded; a passing check
writes nothing.

| Check (Source column) | Fails when |
| --- | --- |
| `self-check:database-roundtrip` | a one-document query to the database fails |
| `self-check:writable-path` | a probe file cannot be written and removed in `WRITABLE_PATH/files` (or in `WRITABLE_PATH` itself when it already is the files directory) |
| `self-check:heap-headroom` | the V8 heap uses 90 % or more of its limit |
| `self-check:free-disk-space` | the files filesystem has less free space than `WEKAN_MIN_FREE_DISK_MB` (default 256 MiB) |

A failure is recorded with category `test-failure`, name `TestBleed`, action
`failed` and severity `medium`; the Detail column is the check's error message.

The admin-only method `runSelfChecks` runs the checks again on demand; it
refuses anybody who is not `isAdmin`. The pane itself has no button for it.

### The table

The same read-only event table as the [Security Report](Security-Report.md):
Date and time, Category, Name, Severity, Action, Source, Username, IPv4,
Location, IPv6, Location, Attempts and Detail, newest first, 10 rows a page,
with a search box that filters as you type. "No new problems." means no check
has failed since the stream was last cleared.

Acknowledge or clear the stream on [Summary](Summary.md). Rows older than
`EVENTLOG_RETENTION_DAYS` (default 90) are deleted daily. The rows are also on
`GET /api/admin/problems/tests`
([REST API](../../../API/REST-API.md#admin-panel-problems)).

### Tests

- [tests/runtimeHealth.test.cjs](../../../../tests/runtimeHealth.test.cjs) - the
  heap and disk thresholds, including invalid statistics failing closed.
- [tests/securityLog.test.cjs](../../../../tests/securityLog.test.cjs) - the
  self-checks are loaded by the server and record through the tests logger.

## Related

- [RAM-usage.md](RAM-usage.md) and [Disk-usage.md](Disk-usage.md) - the
  continuous memory and disk monitors.

## Commits

 - [One files directory for every platform, used by the writable-path check](https://github.com/wekan/wekan/commit/31e569a18e44f4dabd7709f6188cf76da3d3deb0)
 - [Add the heap headroom and free disk space self-checks](https://github.com/wekan/wekan/commit/6ec619e438f82e59fb66407b98f78f31f0135776)
 - [One summary row per problem, with who and how often](https://github.com/wekan/wekan/commit/3d08c65bb2e51ac9e0a21547e5b206f386c369a6)
 - [Runtime self-checks write the Tests stream, without Playwright](https://github.com/wekan/wekan/commit/4101c1be2bd6cacf55102e9daa4cc0d388b0624b)
 - [Store the security, speed and tests streams in the WeKan database](https://github.com/wekan/wekan/commit/1d82ef8eae344ca0565d0858fc697f470e471dd7)
 - [Add the Problems page with its Tests pane](https://github.com/wekan/wekan/commit/0085f7fbfa81e820ce0736dd28b2b0786ac6e41c)
