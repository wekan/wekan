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

The adapter must compare exact current/before/after states, perform a conditional
write only from the before state, verify its result, and return `applied` or
`already-applied`. A committed write with a lost acknowledgement must return
`already-applied` on retry, without repeating hooks or side effects. The engine
advances only the matching operation owner's current checkpoint. Completed
operations retain their marker until plan cleanup finishes, so interrupted
cleanup never repeats card writes.

Real MongoDB tests inject interruptions before application, after a side effect,
after checkpoint progress and during cleanup. They exercise lost ownership,
changed local state, changed configuration scope, BSON dates, updates/archives,
damaged plans and unverified adapter results. The adapter in those tests is a
small raw-collection fixture, not the Meteor card writer.

The shared Sync card selector now distinguishes an absent field from explicit
null, so deleting a nullable field cannot satisfy an older write snapshot.
Remaining integration includes normal card hooks and History, source/permission rechecks, archive dependencies,
private collection lifecycle, pause/cancel/review controls, retained outcome
reports and scheduler/startup recovery. Journal ownership protects checkpoint
acknowledgements; it does **not** fence an already in-flight card write. That
cross-collection boundary and atomic multi-card reconciliation remain open.
No automatic retry scheduler or application UI is enabled by this engine alone.
