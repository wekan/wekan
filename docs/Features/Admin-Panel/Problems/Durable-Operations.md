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

Email digest acknowledgement
----------------------------

Notification text is stored in the user's database email buffer before its
send timer is scheduled. A successful SMTP send removes only the sent snapshot
with `$pullAll`; a failure or missing recipient address leaves it in place.
Digest timers are serialized per user within one server process, so a slow
send does not let a second timer resend the same snapshot concurrently.
A later notification schedules another attempt, including retained lines.

This is not yet a durable delivery job queue. Startup recovery, automatic
retry/backoff, persisted subject and reply metadata, and coordination across
server processes remain pending. SMTP acceptance followed by a crash or failed
acknowledgement may cause a duplicate on retry. Identical text still uses the
existing `$addToSet` deduplication and has no separate event identity. These
limits prevent this buffer from proving completion of a durable Sync effect.
