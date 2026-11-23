# Design: SQLite corruption/bloat safety, automatic recovery, and Admin Panel → Problems → Recovery

> **This page uses the shared [Table Page](../../General/Table.md) design.**
> The layout, search, pagination, column spec and per-page data loading are defined
> there and are not repeated here.

Status: **Implemented for bundled FerretDB SQLite launch paths** · Owner: xet7 · Related (#6492):
`releases/ferretdb/sqlite-recovery.mjs`, `models/lib/recoveryEventsJsonl.js`,
`models/recoveryEvents.js`, `server/recovery.js`,
`server/publications/recoveryReport.js`, `client/components/settings/adminProblems.*`,
`snap-src/bin/ferretdb-control`, `releases/ferretdb/*`, and the FerretDB fork
(`internal/backends/sqlite/metadata/pool/opendb.go`,
`internal/handler/handler.go`).

## What it is

When WeKan stores its data in FerretDB v1 (SQLite), the text data lives in
`wekan.sqlite`. Attachments and avatars live on the **filesystem**, not in the
database. This subsystem keeps that text data safe: it prevents the database from
bloating, detects corruption, keeps a ready-to-use backup, restores or re-migrates
when an operator requests it, and shows the remediation history in Admin Panel →
Problems → **Recovery**.

The same pane is also where an administrator finishes work that stopped half
way and cannot finish by itself: queued notification email, pending activity
notifications, rule emails whose delivery is unconfirmed, List Sync operations
that cannot be replayed, board imports that stopped before finishing, and the
Sync run diagnostics. Every decision made there, and every permanent delete, is
recorded in the Recovery table.

## Read more

- [Data corruption](https://en.wikipedia.org/wiki/Data_corruption) and
  [Data recovery](https://en.wikipedia.org/wiki/Data_recovery) on Wikipedia.
- [Backup](https://en.wikipedia.org/wiki/Backup) on Wikipedia - generations of
  backups, which is what `backup/` and `backup/prev` are.
- [SQLite PRAGMA statements](https://www.sqlite.org/pragma.html) -
  `quick_check`, `page_count` and `freelist_count`, which FerretDB uses to
  detect corruption and bloat.
- [SQLite VACUUM](https://www.sqlite.org/lang_vacuum.html) - the bloat repair.
- [Idempotence](https://en.wikipedia.org/wiki/Idempotence) on Wikipedia - why a
  repeated discard or retry changes nothing.
- [WeKan's FerretDB v1 fork](https://github.com/wekan/FerretDB).
- In WeKan: [Verified FerretDB SQLite recovery](../../../Databases/FerretDB/1/Verified-Recovery.md),
  [Durable operations](Durable-Operations.md),
  [Import run recovery](../../Board-Sidebar/Board-Settings/Import-Export/Import-Run-Recovery.md),
  [Troubleshooting mail](../../General/Email/Troubleshooting-Mail.md),
  [Delete](../Settings/Delete.md), [File status](File-status.md).

## How to use it

**Open the pane**

1. Log in as a site administrator.
2. Click your avatar or username at the top right and choose **Admin Panel**.
3. Click the **Problems** tab.
4. In the left menu, under **Reports**, click **Recovery**.
5. The pane shows, from the top: the file status checks
   ([File-status.md](File-status.md)), **Email delivery queue**, **Pending
   activity notifications**, **Rule email delivery**, **Rule emails waiting
   for review**, **List Sync operations that cannot be replayed**, **Board
   imports that stopped before finishing**, **Sync run diagnostics**, and last
   the table of recovery events.

**Read the recovery events**

1. Choose **All**, **Done**, **Failed** or **Deleted** in the **Show**
   dropdown above the table.
2. Type part of an event type or detail in the search box and press **Enter**.
3. Page with the previous / next buttons.

**Act on unfinished work**

1. In the section of the work, use its button: **Pause delivery**, **Resume
   delivery**, **Retry failed messages** or **Cancel queued messages** for
   email; **Retry now**, **Pause delivery**, **Resume delivery** or **Cancel
   delivery** for activity notifications; **Review**, then **Resend to
   unconfirmed recipients**, **Mark as sent** or **Drop** for a rule email;
   **Re-bind** or **Discard** for a rule email waiting for review; **Discard**
   for a List Sync operation; **Keep** or **Discard** for an interrupted board
   import.
2. Confirm when asked. If the answer says the work is busy, click **Refresh**
   and try again.

**Force a restore (manual recovery)**

To force a restore on the next start, set `WEKAN_FORCE_RESTORE=backup` (or `prev`, or
`remigrate`) in the environment, or create a `RESTORE_REQUESTED` file containing that
word in the SQLite data dir, then restart WeKan. The action is recorded in the
Recovery report.

## How the numbers are calculated

| Number | How it is computed |
| --- | --- |
| Rows per page | 10 in every table of the pane (`TABLE_PAGE_ROWS_PER_PAGE`); the email queue counts ten recipients a page, the activity table ten summaries. |
| Recovery event filter | Done = `done: true` or no `done` field (older events); Failed = `done: false`; Deleted = `deletedData: true` ([models/lib/recoveryReportQuery.js](../../../../models/lib/recoveryReportQuery.js)). Applied before counting and paging, and combined with the search. |
| Recovery event search | case-insensitive literal match on `type`, `detail` or `db`. |
| JSONL import | lines longer than 8192 characters, empty lines and junk are skipped; severity is `warning` or `error` when the line says so, otherwise `info` ([models/lib/recoveryEventsJsonl.js](../../../../models/lib/recoveryEventsJsonl.js)). |
| Bloat repair | `page_count >= 256` (about 1 MiB at 4 KiB pages) and `freelist_count × 4 >= page_count` (a quarter or more free). |
| OpLog cap | 16 MiB (`16 * 1024 * 1024` bytes) for `local.oplog.rs`. |
| Recovery bridge page | up to `WEKAN_RECOVERY_BRIDGE_SECONDS` seconds, default 20. |
| Email retries | 12 attempts per cycle (`MAX_EMAIL_ATTEMPTS`); the wait before the next try is `min(2 880 000 ms, 5000 ms × 2^(attempt − 1))` (attempt capped at 11), plus 0-25 % random jitter, so retries spread up to about an hour ([server/lib/emailRetryPolicy.js](../../../../server/lib/emailRetryPolicy.js)). |
| Email workers | at most 4 notification senders at once across the deployment ([server/lib/emailSendSlots.js](../../../../server/lib/emailSendSlots.js)). |
| Receipt compaction | detailed terminal receipt metadata after 30 days by default. |
| Sync run reports | reports older than 30 days are excluded. |
| Activity recovery scan | at most 100 intent IDs per pass, every `ACTIVITY_NOTIFICATION_RECOVERY_INTERVAL_MS`. |
| Cancelled activity notifications listed | while their activity is newer than `ACTIVITY_NOTIFICATION_RECOVERY_CANCELLED_DAYS` days, default 14; `0` lists none, any whole number up to 36500 is accepted. Pending ones are always listed. The receipts stay in the database ([server/lib/activityNotificationReport.js](../../../../server/lib/activityNotificationReport.js)). |
| Stuck List Sync operations / interrupted imports | only the oldest 50 are listed; discard or keep some and refresh to see more. |
| List Sync replay | the `wekan-list-sync-replay` job runs every minute. |
| Import considered stopped | its writer silent for longer than `WEKAN_IMPORT_RUN_STALE_MS` (default 10 minutes, at least 60 000 ms) ([server/importRuns.js](../../../../server/importRuns.js)). |
| Rule email methods | 10 calls per 10 seconds per connection; the report 30 per 10 seconds. |

## How it works in WeKan

The implementation target and safety invariants are defined first in
[Verified FerretDB SQLite recovery](../../../Databases/FerretDB/1/Verified-Recovery.md).
That document is authoritative for snapshot format, checksums, disk-space gates,
automatic source selection, migration fallback and low-load scheduling.

All work that may still be running when the process stops also follows the
[restart-safe background and external operations](Durable-Operations.md) design.
That contract defines persisted checkpoints and leases, idempotent replay,
shutdown behavior, external-service timeouts, rate-limit-aware backoff and the
Recovery evidence required when work is reclaimed after a restart.

### What each layer does

#### FerretDB (the database engine)

- **Automatic corruption detection.** Every time a database file is opened, FerretDB
  runs SQLite's fast `PRAGMA quick_check`; anything but `ok` is logged prominently.
  Corruption cannot be repaired in place, so this only reports it — recovery is done
  by WeKan (restore/re-migrate).
- **Automatic bloat repair.** On open, FerretDB `VACUUM`s a file of at least 256
  pages (about 1 MiB at 4 KiB pages) with at least a quarter of its pages on the
  freelist, rebuilding it compactly. Content-preserving.
- **Bounded OpLog.** `local.oplog.rs` is capped small (16 MiB) so the transient
  `local.sqlite` cannot bloat and drive CPU high.
- Toggle: `FERRETDB_SQLITE_AUTO_REPAIR=false`.

#### WeKan startup (the launch scripts, files at rest)

Before FerretDB opens the files, every launch path (snap `ferretdb-control`, the
bundled release `start-wekan.sh`, the Docker `wekan-entrypoint.sh`):

- **Backs up the text data.** Copies `wekan.sqlite*` into a `backup/` subfolder of the
  same data dir, keeping the previous generation under `backup/prev`. It only ever
  **copies** the live database — never moves or deletes it — and never copies
  attachments/avatars. Toggle: `WEKAN_SQLITE_BACKUP=false`.
- **Restores on request.** If a restore is requested — the `WEKAN_FORCE_RESTORE` env or
  a `RESTORE_REQUESTED` marker file containing `backup`, `prev` or `remigrate` — it
  copies the chosen known-good backup **into** the live database (dropping the stale
  WAL side-files so the copy is used cleanly) and records the action. The backup copies
  are never deleted; the main `wekan.sqlite` is only ever overwritten, never removed.
  `remigrate` requests a re-migration of the text data from MongoDB (handled by
  `migration-control`); attachments/avatars on the filesystem are untouched.
- **Resets the transient OpLog** (`local.sqlite`) so a bloated/corrupt OpLog cannot
  persist across a restart. Toggle: `WEKAN_FERRETDB_RESET_OPLOG=false`.

#### The recovery decision

The policy is the least-invasive recovery - latest good backup → previous backup →
re-migrate → (else) manual - and nothing destructive unless the database is **known
corrupt**. `releases/ferretdb/sqlite-recovery.mjs` carries it out, with FerretDB's
read-only `check-sqlite` command. (A separate model of the policy,
`models/lib/recoveryPlan.js`, was never run by anything and was removed on
2026-10-16; the script is what decides.) They verify the live file before FerretDB opens it,
then restore and re-check latest or previous compressed snapshots. Snap quarantines
unusable SQLite files and re-runs migration when retained MongoDB source files exist.

### Failure coverage and recovery ownership

| Failure | Mitigation / recovery | Problems → Recovery |
| --- | --- | --- |
| Transient OpLog is corrupt or bloated | Removed at startup and recreated automatically | Startup output; text-data events are separate |
| Text database is corrupt | Startup tries latest, previous, then retained MongoDB migration source | `corruption-detected`, then the automatic outcome |
| Requested backup is missing or mode is invalid | Live data is left in place and the request is retained | `manual-required` |
| Restore copy fails | No success is reported; marker and request remain for retry | `restore-failed` |
| Backup copy fails | Startup continues and the prior generation remains available | `backup-failed` |
| Recovery succeeds but database remains unreadable | Maintenance state remains instead of exposing a broken app | `manual-required` |
| Bundled WeKan process exits | Bundle supervisor loop starts it again | Process logs; no database remediation is claimed |
| Container or snap process exits | Docker/snap service manager owns restart policy | Service-manager logs; no false Recovery row |
| Background job process exits | An expired persisted lease is reclaimed and execution continues at its last verified unit | `job-reclaimed-after-restart` and subsequent outcome |
| External service throttles or times out | Persist `nextAttemptAt`, honor `Retry-After`, and retry with bounded exponential jitter | Attempt, provider, checkpoint and next retry |

Verified snapshots are gzip-compressed below `<sqlite-dir>/.recovery`, carry SHA-256
and byte counts for compressed and uncompressed forms, and are published only after a
staged decompression verifies. Free space is checked without assuming compression.
Non-urgent creation waits for a low-load startup window; corrupt startup recovery is
urgent and does not leave the application serving known-corrupt text data.

#### What users see during a recovery

Recovery must never look like a broken site. Two layers cover the whole window, on
**every** FerretDB v1 platform (snap, bundled release, Docker):

- **In-app maintenance spinner (all platforms).** When a recovery is in progress the
  server publishes a *public* status document — everyone, including logged-out users on
  the sign-in page, sees it — that drives a full-screen overlay with a spinner in both
  the app and sign-in layouts. The launch scripts write a `RECOVERY_IN_PROGRESS` marker
  when they restore/re-migrate; the server keeps the spinner up until it has
  health-probed the database (a real read), then **clears the marker** and hides the
  spinner — or, if it still cannot read, keeps the spinner and records that manual
  recovery is required. Admins can also toggle it for a server-initiated re-migration.
  Because the *server* owns clearing the marker, the spinner behaves identically on all
  platforms.
- **Static bridge page (before the app is up).** For the brief window while a
  just-restored FerretDB comes back up and before Meteor can serve the client, the
  launch scripts serve a tiny standalone "recovering your data" page (HTTP 503) on the
  web port so users never hit a bare connection error: the snap reuses
  `wekan-maintenance-page.mjs` (with a recovery wording), and the release/Docker paths
  serve the portable `releases/ferretdb/recovery-bridge.mjs`. The bridge is
  **time-bounded** (`WEKAN_RECOVERY_BRIDGE_SECONDS`, default 20s) and is only a visual
  bridge — it can never block WeKan from starting, and it hands straight over to the
  in-app spinner above. It is skipped cleanly if its page file or the marker is absent.

### Admin Panel → Problems → Recovery

The startup scripts append one JSON line per action to `recovery-events.jsonl` in the
data dir. On startup the WeKan server imports the new lines into the `recoveryEvents`
collection (`server/recovery.js`), and the **Recovery** report
(`server/publications/recoveryReport.js`, admin-only) lists them newest-first with the
same search + pagination as the other admin reports. Admins can also record a manual
event with the `recordRecoveryEvent` method.

Event types include `snapshot-created`, `snapshot-deferred`, `snapshot-failed`,
`backup-created`, `backup-failed`, `corruption-detected`,
`restore-backup`, `restore-prev`, `restore-failed`, `remigrate`, `bloat-repaired`,
`integrity-ok`, `manual-required`, each with a severity (info / warning / error).

Recovery also keeps the audit trail for irreversible board deletion. Changing
Admin Panel → Settings → Delete (it was under Problems until 2026-11-19)
records `permanent-delete-setting-changed` with the Global Admin username,
user ID and whether the setting was enabled or disabled. Every successfully
purged archived board records `board-permanently-deleted` with that actor, the
board ID and its title. No-op, unauthorized and failed operations are not logged as successful actions.

Attempted setting changes and board purges are always recorded with a Boolean
`done`, the user ID and username when known, and the proxy-aware IPv4 or IPv6
address resolved through `HTTP_FORWARDED_COUNT`. Board attempts also keep
bounded `boardIds` and `boardTitles` arrays; an ID that does not resolve uses an
unknown-title marker rather than disappearing from the audit.

The Recovery table's columns are Done, Date, Event, User ID, Username, IPv4,
Location, IPv6, Location (IPv6) and Detail, newest first, and a row is tinted
by its severity.

The Recovery table begins with **Done**. `true` renders a green check, `false` a
red warning triangle, and a successful operation that physically deleted data
adds a yellow trashcan. A batch that partly completes therefore shows yellow
successful rows for the boards already removed and a red failed-attempt row for
the whole requested batch.

The filter dropdown above the table selects **All**, **Done**, **Failed** or
**Deleted** events. Filtering is applied by the server before counting and
pagination, and combines with the search term. Older events written before the
`done` field existed count as Done because those event types represented completed
recovery actions.

Below the existing database-recovery description, the pane has a second paragraph
explaining that Recovery also records permanent-delete setting changes and every
successful, failed or unauthorized purge attempt, together with its Done status,
actor, trusted address and attempted board IDs and titles.

Admin Panel → Settings → **Delete** repeats that same paragraph immediately below
its existing permanent-delete setting description. Both panes use one shared source
sentence, so the explanation at the control and the explanation at its audit trail
cannot drift apart.

### Email delivery queue

The email section groups pending and stopped notifications by recipient, with
ten recipients per page. Search by a literal user ID and press Enter. It shows
the queued and retrying/stopped counts, fixed failure categories, highest
lifetime failure count, oldest queued time, next attempt and last operator
change. Recipients are identified by username and user ID; mailbox fields and
message contents are not returned.
Refresh reads the current database state; this is not a live subscription.

- **Pause delivery** holds both existing and subsequently queued messages for
  that recipient. A paused recipient remains listed even with an empty queue.
- **Resume delivery** removes the hold and makes existing queued messages due
  now. Normal recipient permissions are rechecked before sending. Stopped
  messages remain stopped.
- **Retry failed messages** starts a new twelve-attempt cycle for stopped
  messages, preserving lifetime failure counts and any pause. Fix the reported
  cause first. Replaying the same control request cannot reset the budget again,
  even if the restarted cycle has already failed.
- **Cancel queued messages** asks for confirmation, removes rendered payloads
  pending or stopped up to the request's timestamp, and retains cancellation receipts.
  Messages created afterward are kept. Cancelling does not remove a pause.

Only a currently enabled instance administrator can read or change the queue.
Controls acquire the same recipient reservation as the sender. If a delivery is
already running, the operation reports busy; refresh and retry. A request ID
makes a retry safe after an uncertain reply, and older interrupted commands
cannot override a newer operator action. Shared delivery reservations cap queued
notification workers at four across the deployment. Waiting for capacity does
not spend an attempt or mark a message as failed. Reservation loss closes the
sender's live SMTP connection, but cannot retract remote acceptance; delivery
remains at least once.

Control records retain the latest actor/time/action and per-action counts;
private request receipts retain completion or supersession. Queue payloads and
control collections have no client publication or direct client writes.
Detailed terminal receipt metadata is compacted after 30 days by default.
Minimal replay identities remain indefinitely, so an old cancellation cannot
affect later messages. Pending or failed work and recipient holds are retained.
See [receipt retention](../../General/Email/Troubleshooting-Mail.md#completed-notification-receipts)
for configuration and [durable operations](Durable-Operations.md) for remaining
activity-to-delivery integration work.

### Pending activity notifications

The pending activity table lists ten summaries per page, with literal searches
across intent, activity, board and card IDs. It does not return stored activity
content, recipients, email addresses or rendered messages. Missing or changed
activities, inconsistent plan metadata and active delivery reservations are
shown separately. Completed intents disappear from this table.

An enabled administrator can select **Retry now** for a pending delivery or an
activity waiting for its first recipient plan. The request uses the same
renewable reservation and receipt identities as automatic recovery. It rechecks
administrator access during delivery, together with current recipient access
and notification preferences. A successful retry confirms local tray/email
queue writes; SMTP delivery is tracked separately in the email queue.

The table's status is a snapshot of recovery metadata. “Pending delivery” does
not certify the complete stored payload or current recipient permissions;
retry validates those before each effect and reports a safe failure message.
Missing or changed activities are never recreated. An administrator can cancel
remaining delivery, including orphaned work, as described below. Pending and
cancelled payloads are compacted into permanent receipts as described below.

#### Pause and resume activity notifications

`server/lib/activityNotificationControl.js` provides the storage primitive for
activity pause/resume controls. Production delivery now reads the private
`activityNotificationControls` collection before preparation and local effects.
Both immediate ordinary delivery and manual/background recovery honor holds;
automatic scanning skips held work and continues to later pending intents.
Malformed control state stops delivery. An enabled administrator can select
**Pause delivery** or **Resume delivery** in the pending activity table. The
method uses the same delivery reservation and checks current administrator
access before and during the operation. A busy reservation requires retrying
later. Paused rows retain their underlying diagnostic status and disable
**Retry now** until resumed.

A request carries the intent ID, desired pause state, administrator ID, stable
request ID and the revision displayed to the administrator. A conditional
write advances that revision once. The last identical request can be retried;
an older revision conflicts rather than undoing a later decision. Lost write
responses are reconciled by reading the exact persisted row. Missing,
completed or malformed recovery state cannot authorize a new hold change.
A control row must never be deleted or expired, including after resume: its
revision prevents delayed old requests from becoming valid again. There is one
row per controlled intent, rather than one row per button click.

A hold applies to future local notification effects only. Messages already
in the SMTP outbox require the separate email queue controls. Control rows
are not published and member/admin DDP writes are denied. If another operator
changes the revision, the UI refreshes and asks you to review the current state;
it never silently retries against the newer revision. A failed network response
can leave the operation applied: refresh to inspect the actual persisted state.
Resume releases the hold for the next automatic scan; it does not guarantee
successful delivery if the original activity or recipient access has changed.

The restart regression in `activity-hold-restart.e2e.js` has two explicit phases:
run with `WEKAN_TEST_ACTIVITY_HOLD_RESTART=seed`, restart the app against the same
test database with `ACTIVITY_NOTIFICATION_RECOVERY_INTERVAL_MS=1000`, then run
with `WEKAN_TEST_ACTIVITY_HOLD_RESTART=verify`. The seed phase retains a held
fixture deliberately; verify checks that automatic scanning has preserved it,
resumes through the UI and removes the fixture afterward.

#### Cancel remaining activity delivery

**Cancel delivery** asks for confirmation and permanently stops remaining local
notification delivery for that activity. It uses the displayed revision and
the same delivery reservation as pause/resume. Cancellation is terminal: neither
a delayed old request nor a new Resume request can reopen it. An identical
cancel request can be retried after a lost response. Already completed intents
cannot be cancelled.

The cancelled row remains visible with its diagnostic metadata and disabled
controls. Automatic recovery skips it. An orphan whose original activity is
missing can be cancelled without recreating that activity. This is an explicit
operator decision to abandon remaining delivery, not proof of delivery.

Cancellation does not recall existing tray notifications or email already in
the SMTP outbox; use the separate email queue controls for unsent queued mail.
It cannot undo a local effect already authorized by a former worker. Permanent
control and delivery receipts remain to prevent replay. Cancellation removes
intent snapshots and rendered plans through guarded compaction without deleting
cancellation or deduplication evidence. Failed cleanup retains its evidence for
retry.

#### Cancellation payload cleanup

`server/lib/activityNotificationCancellationRetention.js` implements a two-stage
compactor used by production cancellation. It requires the same delivery
reservation and an unchanged valid terminal cancellation control. It validates the complete
pending intent and any stored recipient plan before replacing payloads.

First, it replaces the plan with a permanent cancellation receipt containing
its unique ID, activity hash and checksum. If no plan exists, it inserts a
receipt with a null checksum to prevent a delayed initial plan insertion.
Only after confirming that receipt does it replace the intent snapshot with
cancelled metadata: activity/board/card IDs, creation time, identity hash,
original dispatch actor and writer ID. Neither unique row is deleted. The
original activity is not required, so an orphan can be compacted too.

Exact conditional replacement and readback handle lost replies, interrupted
cleanup and stale writers. A mismatch retains the affected evidence and fails
instead of claiming successful removal. Already compacted receipts can be
checked repeatedly. Pending work without a terminal cancellation is untouched.

The cancellation method attempts compaction after confirming the terminal
control. If cleanup fails or the process stops, the existing bounded activity
recovery scan retries cancelled pending intents under the delivery reservation.
The scan processes at most 100 IDs per pass and advances past failures. It uses
`ACTIVITY_NOTIFICATION_RECOVERY_INTERVAL_MS`; no separate cleanup timer is
needed. Once the intent is compacted, its terminal state leaves the pending
scan. The report searches both pending and compact cancelled metadata and
keeps cancelled rows visible without fetching their old activity or plan.

A pending notification is always listed, because it can still be delivered. A
cancelled receipt is listed only while its activity is newer than
`ACTIVITY_NOTIFICATION_RECOVERY_CANCELLED_DAYS` (14 days by default; `0` lists
none). Before this, every receipt ever written stayed on the list, and with
expired notifications cancelled automatically the list grew into dozens of
pages of old rows that hid the ones still recoverable
([#6941](https://github.com/wekan/wekan/issues/6941)). Only the list is
shortened: the receipt itself is never deleted, so a delayed writer still
cannot recreate a cancelled payload.

Capture and completion reject compact cancellation receipts instead of
recreating a payload or declaring delivery successful. Missing or malformed
cancellation evidence keeps report actions disabled. Corrupt/mismatched
payloads are retained for investigation rather than erased. Ordinary pending
or merely paused work is not expired or automatically cancelled.

### Stored rule email attempts

The **Rule email delivery** table shows ten attempts per page. Search matches
literal command, invocation or attempt IDs. Filter by **All attempts**,
**Unconfirmed**, **Accepted by mail server** or **Dropped by an administrator**.
Refresh keeps the current page; changing the search or status starts at the
first page. Each row shows the command, invocation and attempt IDs, the status,
and the start and confirmation times.

Only enabled administrators can read the report. The table contains
identifiers, start/confirmation timestamps and delivery status, without message
bodies or recipient addresses (those are shown only in the Review panel
below). Invalid attempt metadata is marked explicitly.

**Unconfirmed** can mean delivery is still running or was interrupted. It does
not prove that the recipient received nothing. **Accepted by mail server**
records transport acceptance, not inbox delivery.

**Review** opens one attempt: its recipients' addresses, each with whether
delivery to them is confirmed, and the number of earlier resends. WeKan never sends an
unconfirmed email again by itself; the administrator decides
(`server/methods/syncRuleEmailRecovery.js`, `server/lib/syncRuleEmailResolution.js`):

- **Resend to unconfirmed recipients** sends again only to the recipients that
  are not confirmed;
- **Mark as sent** records that the administrator knows it arrived;
- **Drop** gives it up.

While the original send may still be in progress the buttons stay disabled,
with "You can decide after <time>". One decision per command runs at a time,
across servers (a lease per command), and the server checks again that the
caller is an enabled administrator.

(This page used to say the table has no retry, cancel or acknowledgement
control and that operator resolution was unfinished. Review, Resend, Mark as
sent and Drop were added on 2026-09-30. The pane's own description line still
says "This report does not retry or cancel delivery"; the decisions are in the
Review panel.)

### Rule emails waiting for review

Rule emails prepared by an earlier WeKan version did not record where their
content came from, so WeKan does not send them by itself. The **Rule emails
waiting for review** section lists them (board / card, recipients and subject,
reason), with:

- **Re-bind** - prepare it again from the card as it is now, after checking
  that the rule's author is still enabled with write access to the card (and,
  for an assigned-only member, is assigned to it), and that the rule and its
  action are exactly what was captured (`server/lib/syncRuleEmailLegacy.js`);
- **Discard** - give it up.

Its methods are admin-only and rate-limited like the Rule email delivery ones
(10 calls per 10 seconds per connection; the report itself 30 per 10 seconds).

### List Sync operations that cannot be replayed

Manual and scheduled Sync of a list write through a saved operation plan
([durable operations](Durable-Operations.md#manual-and-scheduled-sync-use-the-engine-2026-09-30)).
While a list has an unfinished operation, no new Sync of that list starts: the
`wekan-list-sync-replay` job resumes it first, every minute. A replay re-checks
what the plan was made for - the list's board, lifetime, settings revision and
source, the stored intent and trigger, and that the user who started it still
has write access to the whole list. When one of those went stale (the list was
removed, recreated or reconfigured, or the user lost access), the operation can
never be finished and the list's Sync stays blocked.

WeKan records such an operation **once**: it marks the operation and adds one
`list-sync-operation-stuck` Recovery event naming the list, the operation, the
reason and how many of its steps were applied. Later passes that fail the same
way add no event and no console line. A manual Sync of the blocked list reports
that an administrator can discard the earlier operation here.

The **List Sync operations that cannot be replayed** section lists every marked
operation - board and list ID, when it was found, steps applied of the total,
and the reason - checked again against the current list, board and user each
time the page loads. **Discard** is enabled only when that check confirms the
operation still cannot be replayed; one whose access was restored is shown as
replayable and finishes by itself.

Discarding, after confirmation:

- writes nothing to cards: steps applied before the operation went stale keep
  their changes, the remaining saved steps are never written, and the next Sync
  compares the list with its source again;
- first stores one immutable decision (collection `listSyncOperationDiscards`,
  keyed by the operation ID, with the administrator, reason and progress), then
  removes the operation's saved steps and its marker, reading each removal back;
- runs under the list's Sync lease, the same one a replay and a new run hold,
  so it never interleaves with them on this or another server; a list that is
  syncing right now reports busy;
- is idempotent: a retry or a second administrator finds the decision and only
  finishes the removal, or reports it already discarded. A replay or new run
  that finds a decided but unfinished discard completes it instead of resuming;
- keeps the stored intent and any completion receipts as evidence, and adds one
  `list-sync-operation-discarded` Recovery event with the administrator's
  address.

Only a currently enabled instance administrator can list or discard; the server
checks before reading and again with the lease around every write. Operations
still being prepared are not listed - they have written nothing and are
discarded automatically.

### Board imports that stopped before finishing

Every board import and board copy is recorded before its first write, with the
id its new board will have ([details](../../Board-Sidebar/Board-Settings/Import-Export/Import-Run-Recovery.md)).
One that stops - its server restarted, its writer hung for longer than
`WEKAN_IMPORT_RUN_STALE_MS`, or it failed after creating its board - is
flagged once by the `wekan-import-run-scan` job and adds one
`import-interrupted` Recovery event.

The **Board imports that stopped before finishing** section lists each one with
its board, source, where it stopped, what the board holds now and its Scrum
checkpoint if any. An instance administrator either **keeps** the partial board
as it is (`import-kept`) or **discards** it (`import-discarded`): the board the
import created and stamped with its run id is removed as a permanent delete
removes one, and whatever else carries that board id is swept. A board the run
did not create is never touched, a discard that stopped halfway is finished by
discarding again, and a second discard changes nothing. An import cannot be
resumed, because its source file is not kept; discard it and import the file
again.

### Sync run diagnostics

Recovery also reads the private Sync run reports, without copying them into
recovery events or publishing the collection. The default filter shows
unfinished outcomes; these may still be running or may have been interrupted.
Other filters show failures, completed runs, completed-with-warnings outcomes,
review-only results, skipped runs or all outcomes. Nothing here resumes or rolls back an
operation. Failed and unfinished runs may have applied some card changes.

Search by a literal board or list ID and press Enter. The shared table loads ten
rows per page, sorted by start time and record ID. Expand Details for confirmed
successful counts, normalized/source field paths and parser diagnostic counts.
Values, raw errors, credentials and source URLs are absent. Reports older than
30 days are excluded. Refresh checks the latest status; this is not a live
subscription. The existing recovery-event table retains its separate controls.

Only current instance administrators may read this cross-board view. The server
checks that permission before and after reading. The list popup still requires
full-list board write permission and the same list lifetime. Instance admins
can inspect retained diagnostics for deleted lists here until retention expires.
Replay checkpoints, write fencing and automatic restart recovery are separate
unfinished work; a diagnostic report is not a recovery plan.

### Tests

- `tests/sqliteVerifiedRecovery.test.cjs` — the recovery script itself: a healthy
  database is left alone, a corrupt one is restored from the latest verified snapshot,
  then the previous one, and only then is manual recovery reported.
- `tests/recoveryEventsJsonl.test.cjs` — the JSONL parser (skips junk, normalizes
  severity, bounds line size; never throws).
- `tests/recoveryReportQuery.test.cjs` — the report search and outcome selectors
  (including combined filters, legacy Done rows and escaped regex metacharacters).
- `tests/recoveryReportWiring.test.cjs` — the Recovery report is wired and the
  publication/count/method are admin-gated.
- `tests/permanentDeleteRecoveryAudit.test.cjs` — permanent-delete setting
  changes and board-purge attempts record status, actor, address and affected
  boards; it also pins the Done/deletion icons and proves failed operations
  cannot produce success records.
- `tests/ferretdbTextDataBackup.test.cjs` — the backup/restore scripts (critical
  negatives: never delete the live text data or a backup copy, never copy
  attachments/avatars, never report a failed copy as success, and retain failed
  restore requests for automatic retry on restart).
- FerretDB: `opendb_test.go` (corruption check + bloat `VACUUM`) and
  `msg_replset_test.go` (OpLog cap).
- [tests/emailRecoveryMethods.test.cjs](../../../../tests/emailRecoveryMethods.test.cjs),
  [tests/activityNotificationRecoveryMethods.test.cjs](../../../../tests/activityNotificationRecoveryMethods.test.cjs),
  [tests/syncRuleEmailRecovery.test.cjs](../../../../tests/syncRuleEmailRecovery.test.cjs),
  [tests/syncRuleEmailResolution.test.cjs](../../../../tests/syncRuleEmailResolution.test.cjs),
  [tests/syncRuleEmailLegacy.test.cjs](../../../../tests/syncRuleEmailLegacy.test.cjs),
  [tests/listSyncStuck.test.cjs](../../../../tests/listSyncStuck.test.cjs),
  [tests/importRuns.test.cjs](../../../../tests/importRuns.test.cjs) and
  [tests/syncRecoveryReport.test.cjs](../../../../tests/syncRecoveryReport.test.cjs) -
  the sections for unfinished work.
- Playwright: `email-recovery-controls.e2e.js`,
  `activity-notification-recovery.e2e.js`, `activity-hold-restart.e2e.js`,
  `sync-rule-email-report.e2e.js`, `list-sync-stuck-recovery.e2e.js`,
  `import-run-recovery.e2e.js` and `sync-recovery-report.e2e.js` in
  [tests/playwright/specs](../../../../tests/playwright/specs).

## Commits

 - [Let an admin keep or discard a board import that stopped before finishing](https://github.com/wekan/wekan/commit/e8fac5e85ca09f33dd32eb9fbd25300afa3fbd90)
 - [Let administrators discard List Sync operations that cannot be replayed](https://github.com/wekan/wekan/commit/cb69750b17bc1b1318e61ce058fe074d888cc264)
 - [Review, re-bind or discard rule emails from an earlier version](https://github.com/wekan/wekan/commit/f5d20a18d7cd7fb976a14fdbe9f683b61b7a9de3)
 - [Resend, mark as sent or drop a partially accepted rule email](https://github.com/wekan/wekan/commit/252f27986b64d21f280330e82e98721517d1c30f)
 - [Rule email delivery report in Recovery](https://github.com/wekan/wekan/commit/778e9ed957124bef5081aeda93107e4f8bef5373)
 - [Clean up cancelled notification payloads and report terminal receipts](https://github.com/wekan/wekan/commit/f1e572db5cbfedc73006c2c373e1175ffd73020f)
 - [Compact cancelled activity payloads into permanent receipts](https://github.com/wekan/wekan/commit/8814dbf1f48a014f221504aff6af88d537c5b8ef)
 - [Cancel remaining activity notification delivery](https://github.com/wekan/wekan/commit/b590d3d76ff4c361ebd6cc129cb19a4198892772)
 - [Pause and resume activity notifications](https://github.com/wekan/wekan/commit/7fef4f4cdcdbfa04c199740fb3e2d437ee636479)
 - [Delivery honors the activity notification holds](https://github.com/wekan/wekan/commit/61bca9bb4217e9b750e52c4083f43153f22e8848)
 - [Persist versioned activity notification hold decisions](https://github.com/wekan/wekan/commit/614ece539738dc33f2ab7635e8b3027004d75321)
 - [Pending activity notifications table with a guarded Retry now](https://github.com/wekan/wekan/commit/169a19817a56c09d006d916e87d17d66a50cf0ee)
 - [Compact terminal email metadata while keeping replay receipts](https://github.com/wekan/wekan/commit/765e2c305d8ff66561066ac16e6b5b9ece5adf8a)
 - [Share notification delivery slots across workers](https://github.com/wekan/wekan/commit/7efa8ca37fbf28f8468a4b6de9f438ebc6421add)
 - [Bound email retries and show stopped deliveries](https://github.com/wekan/wekan/commit/0457e0dfd46ad1baa218f7314b1521d347d48969)
 - [Email delivery queue controls](https://github.com/wekan/wekan/commit/20b47995b27f666ed640759632580dd9a97d5f41)
 - [Sync run diagnostics in Recovery](https://github.com/wekan/wekan/commit/6a4e5e29a862c02f3c9843c4d6a5ed6cfa5708c6)
 - [Remove the never-run recovery plan model](https://github.com/wekan/wekan/commit/70dcc2a134f170138b1e2a4db0033d615935a166)
 - [Verified low-load recovery and integrity audits](https://github.com/wekan/wekan/commit/506c2697a009a66264a86eafbb861a05f35bfbf6)
 - [Design restart-safe durable operations](https://github.com/wekan/wekan/commit/175eea98109188a8ebe9fcbcd1e45813abce9f10)
 - [Design verified recovery and low-load maintenance](https://github.com/wekan/wekan/commit/3980dd9fc3ffbcb7adaac5e53cb890d7bf8a3469)
 - [Filter Recovery events by outcome](https://github.com/wekan/wekan/commit/5f1d422117e6da73237b74a8b8702f6811a80b16)
 - [Add permanent delete, audited in Recovery](https://github.com/wekan/wekan/commit/4ab3161b4f58d459c2c1808eac91685d0888ec10)
 - [Table pages: one design and one implementation](https://github.com/wekan/wekan/commit/9791993d59850a09f3b7efe109663c95ad74833c)
 - [A recovery maintenance page on all FerretDB v1 platforms](https://github.com/wekan/wekan/commit/8e4d57c21d2f7dcad34b2b1208a68e1b22599af3)
 - [A full-page maintenance spinner while data recovery runs](https://github.com/wekan/wekan/commit/9ea7f11d27972989ea7ede695461079a3bbe7489)
 - [Automatic recovery for the SQLite text data, and the Recovery report](https://github.com/wekan/wekan/commit/63c77a27f47aeb204219eba1f4a127837413105c)
