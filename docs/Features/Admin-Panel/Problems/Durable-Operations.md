# Design: restart-safe background and external operations

Status: **Implementation in progress** · Owner: xet7

This design applies whenever WeKan starts work that can outlive one request or
one server process: imports, attachment moves, database migrations, backups,
integrity scans, scheduled rules, webhooks, mail and other external services.
The recovery rule is not "start it again from the beginning". WeKan persists a
checkpoint after each idempotent unit and continues after an unclean stop.

## Durable job contract

Every background operation has a database record containing its type, owner and
tenant, sanitized input reference, state, current checkpoint, attempt counters,
`nextAttemptAt`, bounded error history, timestamps, and a renewable lease. Secrets
are referenced through server-side configuration or an encrypted credential
record; plaintext tokens are never copied into a job.

Workers claim a due job with one atomic conditional update. The lease has an
owner ID and expiry, is renewed during work, and is released on a clean pause or
completion. A replacement process may reclaim an expired lease. Multiple WeKan
replicas therefore cannot execute the same unit concurrently.

Each unit uses a stable idempotency key and follows this order:

1. Claim or reclaim the job and read its persisted checkpoint.
2. Check whether the unit's result already exists under its idempotency key.
3. Perform one bounded unit of work.
4. Verify the result, then atomically advance the checkpoint.
5. Renew the lease, yield, and claim the next unit.

A crash before step 4 repeats the same unit, not the whole job. Repeating must be
safe: database copies upsert by `_id`; imported boards retain their source/job
identity; file transfers verify destination bytes before removing a source; and
external requests carry an idempotency key when the provider supports one.

## External-service policy

Every outbound operation has connect and total timeouts and a bounded response.
HTTP 408, 425, 429 and transient 5xx responses, DNS/connect resets and timeouts
are retryable. Authentication, authorization, validation and SSRF refusals are
not. Retries use exponential backoff with jitter and a configured maximum.

`Retry-After` is authoritative when it is a valid delta or HTTP date. Provider
rate-limit reset headers may extend, but never shorten, that delay. The next
attempt time is persisted before sleeping, so restarting does not reset a rate
limit or cause a retry storm. Per-provider concurrency and minimum-spacing gates
apply across all jobs in this WeKan instance.

After the automatic-attempt limit, the job stays persisted as `paused` or
`failed`; it is never discarded. Problems → Recovery records the operation,
checkpoint, attempt, next retry, bounded failure reason and whether restart
recovery reclaimed it. Security-sensitive refusals remain in Problems → Security.

## Operation-specific checkpoints

| Operation | Durable unit and completion evidence |
| --- | --- |
| Trello and other board imports | One source board; source ID maps to exactly one imported board before the queue index advances |
| ZIP/JSON/CSV/Jira/Kanboard/ICS imports | Parsed source plus one board/card batch; created records carry the job/source key |
| Board imports and copies (implemented) | An `importRuns` record written before the first write names the board id the import will create; the board carries the run id. A stopped run is flagged once and kept or discarded in Recovery; the source is not kept, so the rest is completed by importing again ([details](../../ImportExport/Import-Run-Recovery.md)) |
| Attachment/avatar moves | One file version; destination size/checksum and metadata agree before source removal |
| Text database migration | One collection batch ordered by `_id`; target upserts and evidence cover the checkpoint |
| Backup/restore | One collection/file entry; staged archive/object and checksum manifest are published last |
| Integrity/recovery scans | One bounded inventory batch; the last stable object key is persisted |
| Scheduled rules | Trigger occurrence ID; an occurrence already recorded is not applied twice |
| Webhooks/mail | One delivery record per event and destination; provider idempotency key or an explicit at-least-once status |

Request/response exports do not continue an HTTP socket after restart. They use a
snapshot read and fail visibly; downloadable asynchronous exports, when added,
must use this contract. A client may safely retry a synchronous idempotent read.

## Startup and shutdown

Startup first marks expired `running` leases as reclaimable, records a
`job-reclaimed-after-restart` Recovery event, then starts due jobs gradually with
jitter. Jobs whose required credential or storage is unavailable become paused
with an actionable reason. They are not falsely marked failed or completed.

On SIGTERM WeKan stops claiming work, checkpoints the current safe boundary and
releases leases within the shutdown grace period. SIGKILL, power loss and process
crashes rely on lease expiry and idempotent replay.

## Tests

Each durable operation needs positive completion, crash before checkpoint, crash
after side effect, expired-lease reclaim, concurrent-worker exclusion, pause and
cancel tests. External operations additionally test timeout, network reset, each
retryable status, non-retryable 4xx, valid/invalid `Retry-After`, jitter bounds,
attempt exhaustion and restart during backoff. Negative tests prove secrets and
unbounded response bodies are not persisted in jobs or reports.

## Sync write-plan engine checkpoint

`server/lib/syncOperationJournal.js` now implements the private write-plan and
checkpoint engine for the next Sync adapter. **It is not yet wired into manual
or scheduled Sync.** Current production Sync still uses reconciliation and
retained diagnostic reports; it does not automatically resume this journal.

The engine requires a caller-held renewable list lease and a fixed scope
(list, board, list lifetime, configuration revision and source identity). A
unique pending document owns the operation; separate indexed step records hold
only allowed Sync card fields before and after each unit. No credential or raw
provider-response objects belong in the plan. Snapshots are private content,
not values safe for publication, export or the diagnostic report endpoint.
The integration must provide private collections without TTL expiry.

Preparation stores all steps before enabling application writes. An interrupted
preparation may be rebuilt because it cannot have applied a unit. Once applying,
the original stored plan is authoritative. Resuming validates its per-step
checksums and whole-plan checksum before calling any application adapter.
Plans are limited to 10,000 unique cards and 1 MiB per step; exceeding a limit
fails before application writes. BSON dates and missing/null distinctions are
retained. A scope change or damaged plan preserves evidence and stops the run.

Mapped-estimate plans also retain the complete typed custom-field array and
source baseline (including zero or explicit null), with the canonical local
field/provider field/unit identity. Other field values and their order must
remain unchanged. Dates, booleans, strings, finite numbers, string arrays and
empty assignments survive storage; unknown properties, duplicate IDs, invalid
values and missing or malformed mappings are rejected. Custom-field arrays are
limited to 10,000 entries within the existing 1 MiB step budget. A mapping's
unit may be a configured custom unit, as in ordinary Jira estimate import/Sync.

Real MongoDB tests cover lost acknowledgements for estimate updates and clears,
unchanged typed local fields, mapping-checksum damage and local edits before
replay. They use a test application adapter; this does not enable production
Sync recovery. The production adapter must still validate current field
ownership/mapping under the list guard and coordinate card writes with durable
History/activity effects before acknowledging a unit.

`server/lib/syncOperationMutation.js` now prepares the conditional predicates
and field-only `$set`/`$unset` mutation from a validated stored step. It compares
the union of before/after fields, so additions require absence and removals
remain absent in the expected result. It never replaces the whole card or
changes fields outside the plan. Creation returns a separate insert document;
unchanged updates return an empty modifier for the caller to recognize as a
no-op. Scope changes and explicit undefined values are refused, BSON dates
survive cloning, and input/driver-side mutations cannot alter result predicates.

The same literal-value selector helper is used by production Sync. Object and
array values are wrapped as equality operands, while null includes a presence
check. The journal integration fixture uses the shared mutation planner and
verifies lost-acknowledgement replay without replacing unrelated card metadata.
The planner does not write cards or establish completion of History/activities;
those obligations still belong to the unfinished production adapter.

`server/lib/syncOperationApply.js` now supplies the internal application step.
It runs the ownership guard around conditional writes, reads the expected card
state back even after successful replies, and accepts lost acknowledgements
only when that state is readable. An occupied creation ID or a changed local
value cannot be overwritten. Empty modifiers still require confirmed state.

Matching card state never completes the unit by itself. Every unacknowledged
attempt calls `completeEffects` with a stable identifier derived from the
operation and step index, including retries whose card already matches. That
callback must durably finish or reuse History, activities and downstream
effects before returning the exact identifier. Missing/wrong acknowledgements
or a lost lease prevent journal advancement. The real MongoDB test interrupts
effects after saving a card, then verifies recovery before checkpoint cleanup.

This adapter is not yet connected to manual or scheduled Sync. Its card
interface must preserve application validation/hooks, and the durable effects
implementation, production scope checks and lifecycle remain unfinished. The
MongoDB test uses a separate effect receipt as a stand-in; it does not prove
delivery of actual rules, notifications or webhooks. Guards and readbacks also
do not fence in-flight writes or provide cross-collection atomicity.

`server/lib/syncHistoryBatch.js` prepares and persists the History component
for saved Sync update/archive steps. The journal can now save the effect plan
in the same unit document as the card plan before mutation. The optional
`prepareEffects` and `validateEffects` adapters must both be supplied; the
operation marker retains this mode and refuses a downgrade during recovery.
The checksum covers both plans, and the entire persisted plan is validated
before any unit is applied. Each unit, including its BSON envelope, is limited
to 15 MiB. History validation binds event contents and identity to the exact
card step. Missing/corrupted effects cannot be replaced by an empty plan or a
freshly generated one while applying. Both plans share checkpoint retention
and verified cleanup, with no separate effect-plan collection to orphan.
Journal plan builders receive the stable operation/intent IDs,
scope and ownership guard, and `syncOperationEffectId` shares the same effect
identity with application/retry. Field rows use the ordinary History content
format, fixed timestamps and deterministic IDs, sharing one batch and a fixed
integrity chain. Estimate arrays retain nested dates. Baseline-only changes
produce no History rows and do not invalidate redo.

The plan snapshots the exact hashed redo candidates and undo timestamps before
the change. Persistence conditionally supersedes only those candidates and
reads the flags back; it never queries a fresh redo set on retry. Missing or
damaged predecessors, changed redo snapshots, failed confirmations and wrong
event contents prevent acknowledgement. Partially inserted rows are reused
without rewriting timestamps, chain links or later undo flags. Plans are bounded
to 16 event rows, 10,000 redo candidates and 15 MiB; legacy unhashed redo rows
are refused rather than silently skipped.

Real MongoDB coverage saves a card, interrupts between History rows, retains the
journal checkpoint, then resumes the saved plan without rebuilding or duplicate
events. A different row undone during interruption remains available for redo,
and the resulting chain verifies. This is an internal History component, not
production Sync integration or acknowledgement of activity/rule/notification
delivery. Creation's initial-position effects, production collection/job lifecycle, safe
suppression of ordinary duplicate hooks, legacy redo handling and coordination
with independent board History writers remain unfinished. In particular, a
fixed chain does not serialize concurrent appenders or make redo/event writes
atomic with the card mutation.

The adapter must compare exact current/before/after states, perform a conditional
write only from the before state, verify its result, and return `applied` or
`already-applied`. A committed write with a lost acknowledgement must return
`already-applied` on retry, without repeating hooks or side effects. The engine
advances only the matching operation owner's current checkpoint. Completed
operations retain their marker until plan cleanup finishes, so interrupted
cleanup never repeats card writes.

Cleanup now verifies the absence of operation-specific plan rows before
removing their checkpoint, then verifies that the list's operation slot is
empty. Zero/partial deletions and failed reads do not report success. A lost
delete acknowledgement is accepted only after absence is read back. Ownership
is rechecked between the two stages, and a successor operation is never removed
or treated as this operation's successful cleanup. A retained cleaning marker
resumes cleanup without applying card units again.

The engine now requires a caller-persisted UUID `intentId` and a private raw
MongoDB `completions` collection. Reuse the same intent for every retry of one
request, including after the operation marker is gone; generate a new intent
only for a new request. Do not derive retry intent from the pending
marker, which is deliberately removed at completion. A different intent cannot
take over that marker while it remains pending.

Before cleanup, an immutable completion record captures the intent, operation
ID, exact scope, total, plan checksum and application-completion timestamp.
The engine reads it back before deleting any recovery evidence. Failed writes,
missing rows and failed verification retain the applied plan. Lost insertion
acknowledgements are accepted only when the exact saved proof is readable.
Conflicting, malformed and foreign-scope records cannot acknowledge the work.
These records contain no card values or credentials, but remain private.

If the final cleanup read fails after deleting the marker, the current attempt
still reports an unknown outcome. Retrying the SAME intent reads its durable
proof, finishes operation-specific cleanup and returns its original result
without rebuilding or applying card units. A newer operation on that list stays
untouched. Completion records have no automatic deletion or TTL here: removing
a record while its intent can still be retried would lose this guarantee.

Production integration must persist intent before invoking the engine and wire
private completion storage, retention and job/outcome lifecycle. The proof means
all adapter units were acknowledged; it cannot independently prove unfinished
History/activity effects. These readbacks do not fence already in-flight writes
or form a transaction across collections.

Real MongoDB tests inject interruptions before application, after a side effect,
after checkpoint progress and during cleanup. They exercise lost ownership,
changed local state, changed configuration scope, BSON dates, updates/archives,
damaged plans and unverified adapter results. The adapter in those tests is a
raw-collection fixture using the shared planner, not the Meteor card writer.

The shared Sync card selector now distinguishes an absent field from explicit
null, so deleting a nullable field cannot satisfy an older write snapshot.
Remaining integration includes normal card hooks and History, source/permission
rechecks, archive dependencies,
private collection lifecycle, pause/cancel/review controls, retained outcome
reports and scheduler/startup recovery. Journal ownership protects checkpoint
acknowledgements; it does **not** fence an already in-flight card write. That
cross-collection boundary and atomic multi-card reconciliation remain open.
No automatic retry scheduler or application UI is enabled by this engine alone.

### Manual and scheduled Sync use the engine (2026-09-30)

Manual "Sync now" and the 15-minute scheduled Sync now write through this
engine when it can do everything (`server/lib/listSyncSteps.js`):

- the board enabled Sync effects, and for a scheduled run the instance enabled
  cron effects;
- the list has a versioned scope, which a list gets when its settings are saved;
- every rule action on the board has a durable adapter. Only sending email has
  one so far.

Otherwise the run uses the direct writes it always used, so no rule stops
running. `server/lib/listSyncApplication.js` turns the reconcile plan into saved
steps. The steps are built from the stored cards, and a local edit since the
fetch stops the run. It plans History and activities with the shared effect
planner and applies each step through the hooked card and activity adapters and
durable delivery.

A new run first finishes the list's unfinished operation. The
`wekan-list-sync-replay` cron job resumes interrupted operations every minute,
under the list lease, with the actor and trigger stored in the intent (intent
version 2). An operation still preparing has written nothing and is discarded,
since a replay has no source data to rebuild it from.

An operation whose scope or access went stale - the list was removed, recreated
or reconfigured, its actor lost full-list write access, or its intent has no
trigger - can never be replayed and would block the list's Sync for ever. It is
marked once with one `list-sync-operation-stuck` Recovery event
(`server/lib/listSyncStuck.js`), and an administrator discards it in
[Problems → Recovery](Recovery.md#list-sync-operations-that-cannot-be-replayed):
an immutable decision record first, then removal of its steps and marker under
the list lease, with no further card writes. The discard is refused while a live
check says the operation can still be replayed, and is idempotent.

The in-flight-write and atomicity limits above still apply. Rule actions other
than email need their own durable adapters before those boards can use this path.

### Card activity and History boundary found during adapter integration

The installed collection-hooks update wrapper calls `after.update` even when
MongoDB reports zero affected documents. Title/description activity hooks also
used to run before the card update, so a later failed conditional write could
already have emitted an activity and triggered rules/webhooks.

Title and description activities now run after successful writes, comparing the
previous snapshot with the requested text. Description clearing handles the
schema's `$unset` form. Archive activity ignores zero-match and unchanged-state
writes. Universal entity History and rule/trigger/action History use the same
successful-write guard before recording. This protects current Sync and other
ordinary write paths while the durable adapter is being built.

It does not close the crash window between the card mutation and its separate
activity/History writes. A durable adapter must retain and replay those effects
under stable identities before acknowledging a unit; simply seeing the new card
values cannot prove all hooks completed. Aggregate multi-update counts also do
not identify individual successful rows. Full replay integration remains unfinished
at this boundary, not declared finished by moving hooks to `after.update`.

### Scrum History restoration acknowledgements

Scrum restore/undo/redo keeps its pending journal until each affected author's
restoration event is acknowledged. These events now use a deterministic row ID
from the board, journal operation and author. A retry validates the stored event's
immutable contents and integrity hash before accepting it, including legacy
random-ID events from an already pending operation. It retains the original
creation timestamp and chain link. A lost insert acknowledgement or concurrent
retry is accepted only after reading back the exact intended event. Successful
insert replies require the same readback: a hook refusing the insert, an altered
stored event or an unavailable confirmation read cannot release the journal.
A retry after a failed confirmation reuses the persisted event without changing
its timestamp or integrity chain.

After those events are acknowledged, finalization verifies the original History
row's integrity, author and superseded state. Undo/redo changes use a conditional
write followed by a readback of the persisted flag and timestamp. An already
completed undo retains its timestamp on retry. Missing rows, zero-match writes,
invalid final states and lost write acknowledgements retain recovery evidence.
Checkpoint deletion matches the board, source row, direction, author and operation
ID, so an older worker cannot delete a replacement operation's checkpoint.
These checks do not make verification and deletion a cross-document transaction;
in-flight writers still need coordinated fencing for that stronger guarantee.

A failed write or mismatched/damaged event leaves the journal pending. Ordinary
History writes retain their best-effort contract; this strict writer applies only
to Scrum restoration. It does not make the original Scrum mutation and History
atomic, serialize independent writers to the board's integrity chain, or provide
startup replay. Those remain separate durability requirements.

Email outbox and restart recovery
--------------------------------

Activity notifications now enter a private `notificationEmailJobs` collection.
Each event/recipient pair has a deterministic ID, rendered subject/body,
language, board/card references, due time and attempt counter. Insertion is read
back before enqueue succeeds. Duplicate events retain the original rendered
copy, including after completion. Notifications without an activity ID receive
a new UUID and cannot deduplicate a replay across separate enqueue calls.

The worker scans due jobs after startup and once a second after each completed
pass. Each pass selects up to 100 distinct due recipients, ordered by their
earliest due time and recipient ID, so a recipient with many queued messages
cannot hide other recipients behind a message-count limit. Four workers per
application process handle recipients concurrently; concurrent callers share
the same pass. All processes also compete for four renewable reservations in
`notificationEmailSendSlots`, acquired before an attempt is recorded. Full
capacity leaves the message pending without spending retries. A slow recipient
does not occupy the other three reservations. Slots renew every 15 seconds and
expire after 60; a crashed owner's slot can then be reclaimed. An independent
local expiry timer cancels SMTP even when the renewal database call hangs.
Ownership loss cancels only that sender's connection, and old-owner cleanup
cannot remove a replacement's slot. This is a bound on live queue reservations;
SMTP cannot fence a stale connection from a paused host. Application clocks
must be synchronized. Direct mail outside the outbox is not counted.

A pass waits for its active transports before polling again. SMTP phase, idle
and total deadlines close unresponsive or continuously active connections.
It reserves a recipient in `notificationEmailLeases` using the shared
renewable lease primitive, in a separate collection from list Sync. A normal
live reservation prevents another process from sending that recipient's digest.
Expired reservations can be reclaimed. It streams at most 100 rows per digest,
combining up to 4 MiB of body text; a larger single event travels alone. Individual
jobs must fit within a 15 MiB BSON budget. Temporary failures retain rendered
content and retry after 5 seconds, then 10, 20 and so on, with 0–25% positive
jitter. The base caps at 48 minutes, giving a final spread of 48–60 minutes.
Backoff survives restart. Each job gets at most twelve attempts per cycle,
reserved and read back before delivery preparation so a crash consumes its
attempt. Older records use their stored failure count as the initial budget.
Numeric SMTP 4xx responses retry; 5xx responses stop. Authentication, envelope,
message and TLS configuration failures without a temporary response also stop.
Console-only or hook-suppressed sends without confirmed acceptance require
operator review. Other failures retry within the same limit. Storage failures
after SMTP acceptance are classified separately from SMTP rejection.
Stopped rows retain their payloads and a fixed reason category; raw transport
errors and credentials are never stored in the queue report. Deleted users and
recipients who lost their active board membership or disabled email are cancelled without sending. Missing
addresses and disabled accounts retain work for retry within the same limit.

Only a transport result listing the recipient as accepted acknowledges delivery.
Meteor's development console output and suppressed send hooks are not delivery
proof. Accepted/cancelled rows shed subject, body, language and reply target;
small identity/state receipts remain without a TTL to suppress event replay.
The current account address, From setting and reply signing configuration are
resolved at delivery. A multi-card digest replies to its last card reference.

Legacy `profile.emailBuffer` lines are copied into stable jobs and read back
before `$pullAll` removes those exact lines. Their original subject and board/
card identity were never stored, so they use the neutral subject `WeKan` and no
Reply-To. Their board membership cannot be revalidated retrospectively. A failed
migration retains the old buffer and does not stop delivery for other users.

Delivery is explicitly **at least once**. SMTP acceptance followed by a crash,
a lost acknowledgement or lease expiry can cause duplicate mail. Leases cannot
retract remote acceptance, although a lost reservation closes the sender's
live connection. Original activity creation and notification
enqueue are still separate operations, so this does not yet prove completion of
a durable Sync effect. Recipient summaries and pause/resume/cancel/retry controls
are available in Problems → Recovery; see [the operator guide](Recovery.md).
Control requests use the recipient lease, persisted holds/cancellation cutoffs
and stable request receipts with generation checks. A paused recipient stays
listed with no pending jobs, so the hold can always be removed. Report totals
scan sorted recipient summaries with bounded memory; concurrent writes can
change counts between reads, and Refresh obtains a new result.
SMTP DNS, connection, greeting and idle limits are configured in the
[mail troubleshooting guide](../../Email/Troubleshooting-Mail.md#smtp-timeouts).
Terminal receipt metadata is compacted after 30 days by default, with bounded
background batches and permanent minimal replay identities. Atomic replacement
in the original collection prevents gaps in duplicate suppression. Pending or
failed work and control state are retained. See the
[receipt policy](../../Email/Troubleshooting-Mail.md#completed-notification-receipts).
Atomic activity-to-queue insertion remains pending.
Cross-process slot contention, crashed-owner reclaim, hung renewal and live
SMTP cancellation are covered by `tests/integration/emailSendSlots.test.cjs`.
Set `WEKAN_SYNC_TEST_MONGO_URL` and `WEKAN_SMTP_TEST=1` to run its database and
local SMTP fixtures. No external mail provider or FerretDB was exercised by
these local MongoDB/SMTP tests.

Run `tests/integration/emailOutbox.test.cjs` with
`WEKAN_SYNC_TEST_MONGO_URL` pointing to local disposable MongoDB. For a real app
restart, stop the test app, set `WEKAN_EMAIL_STARTUP_TEST_MONGO_URL` to its test
database and `WEKAN_EMAIL_STARTUP_READY_FILE` to a new file under `.tools/tmp`,
then run `tests/integration/emailOutboxStartup.test.cjs`. Start the app when the
ready file appears, using that database and `MAIL_URL=smtp://127.0.0.1:4102`.
The suite owns that local capture port, verifies acceptance and a scrubbed
receipt, and removes its own rows. Optional `WEKAN_EMAIL_STARTUP_TEST_APP_URL`
and `WEKAN_EMAIL_STARTUP_TEST_SMTP_PORT` override the loopback defaults.

### Activity notification write-ahead intent and hook capture

`server/lib/activityNotificationIntent.js` provides the storage boundary for
activity notification capture. It confirms a private immutable intent before
allowing an activity insert. Its separate persistence helper also reads back
the exact stored activity. Activity IDs and timestamps must already be final.
The intent binds the entire BSON-preserving snapshot and carries a unique
writer identity. Lost intent or activity acknowledgements require matching
readback; conflicting reuse of an activity ID is refused.

The persistence helper allows only the creating call to insert a missing
activity. A later
call cannot distinguish an interrupted first insertion from subsequent
intentional deletion, and must not recreate it. Recovery reads require the
exact retained activity; missing or changed activities leave an unresolved
intent. Explicit orphan resolution is still needed. A returned intent does
not acknowledge tray delivery, email enqueue, rule actions or webhooks.

Ordinary server activity insertion now captures an intent in the private
`activityNotificationIntents` collection after timestamps and before the
activity write. A failed intent write stops the activity insert. Disabled
notifications create no intent. Scoped deferred Sync inserts skip capture,
leaving delivery to their own persisted effect plans. Raw database writes and
imports that bypass hooks do not get this guarantee.

Ordinary delivery remains asynchronous. Before the first local delivery,
`activityNotificationPlans` stores an immutable, checksummed plan containing
recipient IDs, tray choices and already rendered email jobs. The original
dispatch actor and exact activity snapshot bind the plan. Changed templates,
languages or watchers cannot rewrite a saved plan on retry. Candidates whose
services are already disabled or inaccessible are excluded at preparation;
a later access or preference change stops replay and retains pending evidence.

Delivery rechecks the current account, board membership, watch/mute scope,
assigned-only card scope and channel preferences. It uses the real tray
receipt and email job identities, requiring their exact acknowledgements.
A crash between these services can replay without recreating a dismissed tray
notification or duplicating an already queued event. Only confirmed local
deliveries compact the intent to a permanent small receipt; its activity
snapshot is removed. The dispatch actor remains bound to the receipt. Subscriber or
completion-write failure retains pending evidence. The collection has no
client publication, rejects member/admin DDP writes and has no TTL. Webhooks
remain independent and nonblocking; completion is not SMTP acceptance.

Each process now scans pending intents after startup and every second after
the previous pass finishes. Set `ACTIVITY_NOTIFICATION_RECOVERY_INTERVAL_MS`
to an integer from 1000 to 60000 to change the interval. A pass selects at
most 100 IDs, then loads one private payload at a time. Keyset pagination
advances past failed, busy or orphaned records; overlapping local scans share
one pass. Failed storage scans retry on the next timer.

Immediate delivery and recovery acquire the same per-intent reservation in
`activityNotificationLeases`. Reservations renew every 15 seconds and expire
after 60 seconds, permitting another process to reclaim a crashed owner's
work. Guards check ownership during preparation, before service writes and
before completion. Former owners cannot delete successor reservations. These
are renewable reservations, not cross-collection transactions; stable service
identities still make uncertain writes safe to retry. Keep server clocks
synchronized.

Recovery uses an existing plan without rebuilding recipients or content. If
a crash happened after activity persistence but before planning, it prepares
the first plan from that exact retained activity and current permitted
context. It never recreates missing activities or reruns activity rule and
webhook hooks. Missing/changed activities, invalid plans and revoked access
remain pending for later review. Completed intents are skipped.

After the intent acknowledges local delivery, its plan is immediately
compacted in place. The permanent plan receipt keeps only its unique ID,
activity hash, plan checksum and compaction version. Rendered subject/body,
recipient IDs, language and channel choices are removed. Keeping the unique
plan row prevents a delayed former writer from recreating those payloads.
The SMTP outbox retains its own queued content until delivery or cancellation;
plan compaction does not delete an unsent email job.

A separate cleanup sweep handles interruption after acknowledgement but
before compaction. It examines up to 100 plan IDs per pass, loading one plan
under the same per-intent reservation as delivery. The default interval is
60 seconds; `ACTIVITY_NOTIFICATION_PLAN_CLEANUP_INTERVAL_MS` accepts integer
values from 1000 to 86400000. Failed/busy/malformed rows do not hide later rows.
Only an exact completed intent with the same activity hash and dispatch actor
permits compaction; the plan checksum must validate too. Conditional atomic
replacement and readback reconcile uncertain replies. Activity deletion after
completion does not prevent removing old plan content.

Pending plans, orphans, inconsistent completion evidence and damaged payloads
remain intact. Operator/orphan controls and unresolved-payload retention are
still unfinished. Permanent receipts have no TTL and their total count is not
capped. Plans and reservations remain private and reject member/admin DDP
writes. Limit each plan to 10,000 recipients and 14 MiB, checking size while
preparing recipients; oversized preparation leaves the intent pending without
delivering a prefix. This recovers local tray/email enqueue only; full
card/History/activity/Sync effect coordination remains separate work.

`tests/integration/activityNotificationIntent.test.cjs` uses a real MongoDB
with `WEKAN_SYNC_TEST_MONGO_URL`. It covers write ordering, uncertain replies,
concurrent writers, cancelled insertion, deleted/changed activities, corrupted
intents, identity reuse, guard failure and oversized/invalid input. These tests
also cover completion compaction, uncertain completion replies and dispatch
actor mismatch. Full-app Meteor tests exercise real before/after hooks,
failed storage, pending subscribers, disabled notifications and deferred Sync.
Chromium tests verify actual SMTP delivery and private-collection denial.
FerretDB has not been exercised.

`tests/integration/activityNotificationPlan.test.cjs` covers saved-plan reuse,
uncertain plan writes, corrupted checksums, access revocation, false service
receipts, duplicate/invalid recipients and size limits. It interrupts between
real tray storage and real email enqueue, then retries the same plan. The
full-app intent suite verifies that disabled recipients stop replay and that
resume does not invoke rendering or recipient selection again. Chromium
checks persisted plans against actual delivered mail and denies client writes.

`tests/integration/activityNotificationRecovery.test.cjs` verifies bounded
scan progress past failures, local coalescing, competing reservations, expired
owner reclaim and successor preservation. The full-app recovery suite uses
the real private collections and email enqueue adapter. Chromium tests seed
persisted intents with and without saved plans, then observe scheduled SMTP
delivery without invoking a notification hook; a missing activity remains an
orphan and is never recreated. These local tests do not run FerretDB.

`tests/integration/activityNotificationPlanRetention.test.cjs` verifies payload
removal after completion, permanent replay keys, pending/missing/mismatched
receipt preservation, uncertain or false acknowledgements, changed payloads,
ownership loss, malformed-row progress and local scan coalescing. Chromium
checks immediate compaction after actual SMTP delivery and scheduled cleanup
of a previously completed plan while an unfinished orphan retains its body.
