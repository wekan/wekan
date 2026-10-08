# Scrum support: source audit and implementation design

Status: implementation in progress, not a claim that all planned features exist.
The baseline audit below records the source before the first Scrum changes.

Implemented and exercised in the current working version: board-local sprint
planning and lifecycle, revision validation, commitment/result snapshots,
optional metadata and visibility controls, Product Backlog, Sprints, report
tables and interactive count/estimate bar charts, release/event editors, permission-filtered Excel/PDF reports, and
permission-checked History restore/undo/redo with compound recovery checkpoints.
See [Sprints](Sprints.md), [Product Backlog](Product-Backlog.md) and
[Sprint Reports](Sprint-Reports.md) for the current behavior.

Daily observed snapshots and a scoped history reader are now implemented as a
foundation for burndown, with measured daily bars in Sprint Report.
Still pending: event-complete scope history and burndown,
original-edit/History atomicity and large-board limits,
standalone planning-record transfer/copy and remaining external
import/export/sync mappings, and the remaining lifecycle/permission/browser
matrix described below. Source-string registration is not translated coverage.
These remaining requirements are not waived by passing the current tests.

Native sprint transfer preserves the lifecycle invariants of the server methods:
start and close snapshots must match their lifecycle timestamps, planned sprints
cannot contain started/completed history, and cancellation cannot precede start.
Contradictory state or snapshot data is rejected before import creates a board.
Cancellation before a sprint starts remains valid without a start snapshot.
External adapters must report unavailable historical data rather than fabricating
native commitment or completion snapshots.

Native whole-board Scrum transfer and duplication are implemented. Jira import
and export now retain issue types and explicit workflow categories through
existing hidden metadata, alongside numeric time tracking. Jira import also maps
open sprints, fix versions, rank and epic links to sprints, releases, backlog
rank and parents, reporting closed and active sprints' missing snapshots
(2026-10-02, models/lib/jiraScrumPlanning.js). See the
[Jira guide](../../../ImportExport/Jira/Jira.md) for mappings, selection controls
and limitations. Since 2026-10-08 a card can be in several releases, and Jira
import maps every fix version and Jira export writes them all (see
[Several releases per card](#several-releases-per-card)). External sprint
snapshots and epic relationships remain pending. Explicit numeric Jira estimate-field mapping
is implemented; automatic field/schema discovery remains pending.

GitLab iterations and milestones, OpenProject versions, sprints, position and
story points, and Asana milestone tasks now become sprints, releases, backlog
rank and the estimate field through the same journaled Scrum import stage
(2026-10-08, models/lib/externalScrumPlanning.js); started and finished sprints
are reported the same way as Jira's. Trello has no sprint or release data and
its Power-Up data is reported. GitLab and OpenProject exports write sprints and
releases back. See the
[Format coverage](../../../ImportExport/Format-Coverage.md#scrum-planning-from-importers-other-than-jira)
table for each source's fields and losses.

## Existing features to reuse

| Scrum need | Existing implementation | Remaining gap |
| --- | --- | --- |
| Work items and ordering | Cards, `sort`, lists, swimlanes, parent/subtask links, labels, assignees and members in `models/cards.js` | Independent product-backlog order and explicit sprint membership, including past membership |
| Estimation | `poker.estimation`, numeric custom fields, list-header custom-field totals | Board-level estimate-source selection; original commitments and estimate-change history for sprint reports |
| Acceptance criteria | Card descriptions and checklists | Optional dedicated acceptance-criteria presentation; link to the shared Definition of Done |
| Completion | `dueComplete`, card dates, list activity history | Explicit completion policy, sprint-end snapshots, reopened-work handling |
| Impediments | Dependencies, blocker episodes, history and Blocker Analysis | Sprint-scoped presentation, no duplicate blocker database |
| Forecasting and reports | Burndown, Burnup, Throughput, Monte Carlo, flow reports and Excel/PDF exports | Sprint scope/estimate history and completed-sprint velocity; existing board-wide counts are not point-based sprint commitment charts |
| Product planning | Roadmap/Gantt, date fields, milestone labels, card hierarchy | Product Goal, sprint goals, releases/increments and links between these records |
| Meetings and improvement | Cards, comments, checklists, dates and reminders | Sprint-linked planning, Daily Scrum, review and retrospective records with follow-up card links |
| History and undo | Existing activity/history facilities | Typed sprint lifecycle, assignment, goal, estimate and scope changes with before/after values and safe undo |
| Visibility | Board Settings / Swimlane, List and Card, card/minicard field ordering | Opt-in Scrum fields in those same settings, independently selectable |
| Native backup | `models/exporter.js` and `models/wekanCreator.js` | Sprint records and complete ID remapping for new references |
| Jira import | `models/jiraCreator.js` creates status lists, cards, labels and issue dependencies; retains time totals, issue types, workflow categories and selected numeric estimate fields | Sprint, epic, version, rank and automatic schema-driven custom-field mapping remain pending |
| External formats and sync | `models/lib/externalParsers.js`, `externalExporters.js`, list synchronization; GitLab, OpenProject and Asana import sprints and releases (`externalScrumPlanning.js`), GitLab and OpenProject export them | List Sync writes no Scrum planning; GitHub, Gitea and Forgejo milestones stay labels |
| Trello import | `models/trelloCreator.js`, custom fields and board structures; Power-Up data is counted in the import loss report | No universal Trello sprint schema: explicit mappings for custom fields and Power-Up data are required |

The existing [manual Scrum guide](../../../Cards/Scrum.md) remains accurate for
current releases. Do not describe its custom-field/swimlane conventions as a
native sprint lifecycle.

## Menu and documentation placement

Keep the existing menu-based documentation index. Put new menu-owned guides
under their actual menu path; retain forwarding pages for moved guides.

| Application location | Feature | Documentation location relative to `docs/Features` |
| --- | --- | --- |
| Board View, beside list/roadmap views | Product Backlog | `Right-Sidebar/Board-Settings/Board-View/Product-Backlog.md` |
| Board View, beside Product Backlog | Sprints | `Right-Sidebar/Board-Settings/Board-View/Sprints.md` |
| Sprints, selected sprint | Planning, Sprint Backlog, Daily Scrum, Review, Retrospective | Sections of `Sprints.md`, not unrelated global menus |
| Board View, beside existing report charts | Sprint Report and Velocity | `Right-Sidebar/Board-Settings/Board-View/Sprint-Reports.md` |
| Existing Burndown/Burnup/Monte Carlo views | Optional sprint, estimate-source and unit selectors | Existing chart guides, linked from `Sprint-Reports.md` |
| Existing Roadmap | Release/increment grouping | Existing Roadmap guide |
| Board Settings | Scrum configuration, Product Goal, Definition of Done, estimate source, informational team accountabilities | `Right-Sidebar/Board-Settings/Scrum.md` |
| Board Settings / Swimlane, List, Card | Independent hidden-by-default Scrum fields | Existing Swimlane, List and Card guides |
| Existing swimlane/list/card menus | Edit applicable Scrum metadata | Existing menu-owned item guides |
| Existing Import, Export and Sync menus | Scrum mapping, preview, loss report and field selection | Existing `ImportExport` format guides, linked from their menu-owned pages |

All new views use existing navigation, responsive menu layout, themes, RTL,
translation, filtering and accessible controls. Report exports remain at the top
of the report page. Do not add a separate authentication or permissions system.

## Canonical data model

Use existing descriptions, checklists, links, dates, members, dependencies and
estimation fields rather than parallel copies of the same information.

- Board Scrum settings: enabled flag; Product Goal; Definition of Done;
  estimate source (`poker` or a board numeric custom-field ID), explicit unit;
  optional informational Product Owner, Scrum Master and Developer references;
  completion policy and working-calendar settings.
- Board-scoped sprint records: stable ID, name, goal, planned dates, actual
  start/completion dates, state (`planned`, `active`, `closed`, `cancelled`),
  cancellation reason, optional capacity with units, provenance and revision.
- Cards: current sprint reference, historical sprint references, independent
  backlog rank, optional release/increment references (several; see
  [Several releases per card](#several-releases-per-card)) and source issue type.
  Use existing estimates and parent relationships; imported points map to the
  configured numeric field rather than a competing second estimate.
- Swimlanes: optional sprint/release association and purpose. A sprint may span
  swimlanes; changing display layout must not silently reassign sprint scope.
- Lists: optional workflow category (`backlog`, `todo`, `doing`, `done`) and
  explicit completion semantics. Do not infer completion from translated titles.
- Releases/increments: board-scoped identifiers, name, goal/notes, planned and
  actual dates, state and linked cards. A release is optional planning metadata;
  it is not a prerequisite for a usable Increment.
- Events: sprint ID, event kind, date/timebox, notes and follow-up card IDs.
  Reuse comments/checklists/cards for discussion and actions rather than copying
  their contents into event records.
- Source provenance: source system, source project/board identifier, source
  record ID, mapped field identifiers, unit and source timestamp. Retain
  unmapped source values in a bounded data-only import envelope, never execute
  them or treat arbitrary source fields as permissions.

Every new display field defaults to hidden, including existing boards and newly
imported boards. Separate controls cover the opened card, minicard, list header
and swimlane header. Hiding a field never deletes its value. Backlog and sprint
views can display their own essential columns without enabling board badges.

## Lifecycle and historical correctness

Starting a sprint validates dates, membership references and unit consistency,
then records an immutable commitment snapshot (card IDs and estimates). Record
scope additions/removals, estimate changes and completion/reopening events with
server timestamps and actor IDs in the existing history feature. Label imported
historical timestamps as source evidence rather than inventing server events.

Closing shows a preview of completed and incomplete work. Explicitly choose the
backlog or a planned sprint for rollover; keep historical membership and the
original commitment intact. Closing is idempotent and revision-checked. Undo
must not overwrite intervening edits or move a card from an inaccessible board.
Finalizing a History restoration first persists an immutable private completion
receipt bound to the operation ID, actor, source hash and exact checkpoint plan.
Only verified receipt readback permits conditional checkpoint deletion. A false
delete acknowledgement retains recovery, while a lost reply requires a read
confirming that the exact checkpoint is gone. A successor is never removed.
The internal finalizer can retry with its original journal after an uncertain
cleanup read, including from a fresh database connection, without rewriting
History or its undo timestamp. Receipts have no TTL and do not assert that the
board still has its historical values. Public undo/redo methods now accept an
optional caller request ID for Scrum entries. Keyboard shortcuts now send one
(see below); their visible recovery UI, non-Scrum replay, receipt retention
and shared writer coordination remain open.

### Retrying a Scrum undo or redo request

An API caller may pass a second argument to `changeHistory.undoLast(boardId,
requestId)` or `changeHistory.redoLast(boardId, requestId)`. Generate and persist
the ID before invoking the method, then reuse it after a connection loss or an
uncertain response. It must contain 16–128 ASCII letters, digits, underscores or
hyphens; a random UUID is suitable. Use a new ID only for a new intentional
operation. Reusing an ID for another board or direction is refused.

The server persists the first selected row and source hash in a private request
record before applying changes. Concurrent selectors adopt that first result.
An empty-stack result remains empty for that request even after new edits.
A non-Scrum selection returns `scrum-history-request-unsupported` without a
mutation; the ID will keep that result. Do not automatically drop the ID and
retry against the generic stack after this or another failure.

Completed requests return their original result without reapplying card writes
or moving the undo/redo stack again. This includes a retry after the opposite
direction has subsequently completed. The response describes historical
completion, not the current state of the card. Fresh board and History access
checks still apply; removed or changed source rows, missing original request
evidence and damaged receipts stop recovery. Request and completion records
have no TTL. They must be retained while callers may retry.

Existing one-argument calls keep their previous behavior and do not provide
idempotent request replay. Independent processes still require shared writer
coordination for atomic card/History changes.

### Keyboard undo and redo

Ctrl+Z and Ctrl+Y (`client/lib/historyKeyRequest.js`) generate a request ID per
keystroke and keep it in `sessionStorage` until the server answers. A reply that
never arrives (disconnect, reload, rate limit) leaves the ID stored; the next
keystroke on that board sends the SAME ID first, and when it is the same
direction that retry is the keystroke, so a Scrum change is never undone twice
because the first reply was lost. An unanswered ID older than ten minutes is
dropped rather than replayed.

When the server answers `scrum-history-request-unsupported`, the keystroke
forgets the ID and makes the ordinary one-argument call. This departs from the
rule above for API callers, deliberately and only for this answer: the server
guarantees that an unsupported request changed nothing, so the one-argument
call is the same single operation the shortcut always made for non-Scrum rows,
with the same behaviour as before. After any other failure the ID is kept or
discarded as described and never replaced by a one-argument call. Non-Scrum
keystrokes therefore still lack idempotent replay, and there is no visible
recovery control yet; adding one needs new translated interface text.

### An undo or redo that stopped on a conflict

A checkpoint whose retry keeps failing - a record changed by somebody else, a
changed History row, an author without write access - used to block the
board's Scrum edits for good. A board administrator can now roll it back to its
"before" values or keep the board as it is from the History recovery notice,
and an operator can do the same offline. See
[Resolve a Scrum History undo or redo that stopped on a conflict](Scrum-History-Recovery.md).

Cancelling records a reason and preserves the history. Scrum accountabilities
are visible information and do not grant access: all mutations must also satisfy
the existing board/card write permissions. Board configuration and lifecycle
administration retain board-admin guards.

Velocity reports completed estimates against original commitment for each closed
sprint, with reopened and rolled-over work handled explicitly. Burndown/burnup
replay scope and estimate history; never present current estimates as historical
facts. Report missing history and unknown estimates separately from zero. Do not
combine points and hours or use velocity to rank individual members.

Daily observation collection now scans active sprints every 15 minutes and
retains the first successful observation of each UTC day. Opening the history
reader also attempts today's observation. Capture stores actual timestamps and
uses the sprint's recorded estimate source, unit and completion policy. Retries
and concurrent collectors cannot replace an existing observation; a restarted
sprint with a different start timestamp has a separate series. Missing days are
absent, never backfilled using current estimates. Captures are observed reads,
not transactional snapshots or a complete log of intervening events.

The private `scrumDailySnapshots` collection stores these observations.
`scrum.getDailyHistory(boardId, sprintId)` returns measured scope, remaining and
completed totals, with unknown estimates counted separately. It checks board
visibility and restricts assigned-only readers to their currently visible cards,
retaining partial-source warnings. The reader streams at most 366 observations
and flags truncation. Capture limits each sprint to 10,000 cards and each board
to 10,000 lists; exceeding a limit leaves a gap rather than saving partial data.

Sprint start and close also bound their input queries to 10,001 cards/lists,
using the extra row to reject oversized snapshots before changing sprint state
or writing History. Projections omit card titles, bodies and attachments while
retaining estimate, completion and rollover metadata. Start excludes archived
cards; close includes them. Exactly 10,000 rows remain supported. Done-list
membership is indexed once per snapshot instead of scanning every list for
every card. Lifecycle updates also preflight the resulting sprint/rollover document,
the compound History payload and two copies of the larger History side for
restoration. Each must fit a 15 MiB BSON budget, reserving 1 MiB for envelope
fields and recovery revisions. Oversized metadata fails before the first sprint
write, with a request to reduce scope. This prevents a known size failure from
leaving a closed sprint without its History. Board-view pagination, separate
storage for larger plans and concurrent snapshot consistency still need work;
these guards do not make the lifecycle transaction atomic.
Board deletion removes the observations. Full-instance backups include the
collection through the normal collection inventory; native board transfer and
duplication now carry daily observations too. General History/undo transport
remains pending. Sprint Report now displays the observed
daily scope, remaining work and completed work as bars, with exact timestamps,
metric selection and partial/empty/truncated states. Missing days are not
connected or interpolated. The section's Excel/PDF exports use the same reader
and preserve observation, partial-data and truncation notices. Event-level
scope replay and cross-document consistency still require implementation.

The shared Scrum settings form now exposes Product Owner, Scrum Master,
Developers and working days. Accountabilities select active board members and
do not grant permissions. Multiple developers and a nonempty set of weekdays
are supported; single accountabilities and the developer list can be cleared.
Saving uses the existing administrator-only configuration method, revision
checks and History undo/redo. Four new label keys are present in all locale
catalogs with English placeholders where translations are not yet supplied.

## Several releases per card

Implemented 2026-10-08. A card used to have one release, `scrum.releaseId`. It
now has a list, `scrum.releaseIds`; a swimlane keeps its one `releaseId`.

**Storage and compatibility - read-time, not a bulk migration.** Existing cards
are not rewritten. Every reader goes through one helper,
`cardReleaseIds(scrum)` in `models/lib/scrum.js`, which reads both fields the
same way everywhere: `releaseIds` when it is an array, plus `releaseId` when it
is set and not already in the list, read first (it is what an older writer that
knew only that field last set). Duplicates collapse. Every write from the new
code stores the list AND `releaseId` as its first entry (`withCardReleaseIds`),
so a downgraded server, an older importer or a REST reader still sees a release
it knows. A legacy card is brought to that form by its next Scrum write, once;
reading or writing it back again changes nothing, so mixed data - some cards
with `releaseId` alone, some with both - is safe at any time. A bulk migration
was rejected because it would rewrite and re-revision every Scrum card on every
board for no reader's benefit, and an interrupted one would leave exactly the
mixed state the read rule already handles.

**Writes (`scrum.updateCard`).** `releaseIds` replaces the list; a `releaseId`
sent with it must be its first entry (or null with an empty list), otherwise
the write is refused. `releaseId` alone is an older caller's single release:
null clears the releases, an id becomes the first release and the others stay,
because the release such a caller showed was the first one and it cannot see
the rest. Every release must be the board's own: one query checks them all, and
a release of another board - even of the same name - is refused. At most 100
releases per card.

**Copy, move and transfer.** Copies and moves to another board link each
release by name on its own (`models/lib/scrumCopy.js`) and drop the ones
without exactly one match. The native transfer writes a card with one release
as `releaseId` alone, exactly as before, and only a card with several carries
`releaseIds` (`portableCardReleases`): an older importer still reads ordinary
files and refuses a several-release card loudly as an unknown field, rather
than keeping one release silently. Import remaps every release; a release that
is not in the file is refused as a foreign reference.

**Jira.** Import maps every fix version of an issue to one of the card's
releases (it used to keep the first and report the rest). Jira export writes
each of the card's releases as a fix version - its Jira id when it came from
Jira, released state, planned end as the release date and notes as the
description - when Scrum is selected; the importer reads them back.

**Reports, History, rules.** Each release in Board View / Sprints shows its
cards and the done part (`releaseReports` in `models/lib/scrumReports.js`); a
card counts in each of its releases. Scrum History records the whole card
metadata, so undo and redo restore the list; its restore checks every release
against the board, and undoing a release's creation is refused while any card
still lists it. Rule e-mail card details name every release.

**Not covered.** There are no Scrum release filters or search operators.
List Sync can put a card in several releases (Jira's fix versions; see below).
The REST API returns the card's `scrum` object as stored, with both fields;
Scrum metadata is written only through the `scrum.updateCard` method.

## Import, export, copy and synchronization

Standalone card copies (including copied subtasks) start a fresh Scrum metadata
revision. Within the same board they retain sprint/release associations and
backlog rank. Across boards they retain issue type and acceptance criteria but
omit sprint, past-sprint and release references and board-relative rank: these
operations do not copy planning records. The source cards remain unchanged.
Use full-board duplication to copy planning records with remapped references.
Moves to another board follow the same rule (2026-10-02), by a server hook that
covers client, REST and rule moves alike. Maintainer decision of 2026-10-02:
copies and moves link the sprint and release to the destination's own record of
the same name when exactly one matches, and drop them otherwise; past sprints
and rank always go (models/lib/scrumCopy.js).

Standalone list copies retain their Scrum workflow category with a fresh
revision. Swimlane copies retain their purpose and copy list categories;
same-board copies retain sprint/release links, while cross-board copies omit
those foreign links. Full-board copies still defer metadata to the transfer
remapper. The copy helpers do not mutate their source list or swimlane objects.

Cross-board list moves, including lists created while moving a swimlane,
preserve the workflow category when creating a destination list. A reused
destination list retains its own category and revision. Newly created lists
start revision 1; existing lists are not silently reclassified by incoming
cards. Sprint/release references on moved cards and swimlanes, their lifecycle
coordination and History restoration still need integration.

### Importing Scrum planning into an existing board

Every board import creates a new board. A board administrator can also import
the Scrum planning of a native transfer INTO a board that already exists
(2026-10-08): Sprints view, **Import Scrum planning into this board**. The file
is a WeKan board export (it carries `scrumTransfer`) or a bare `wekan-scrum-2`
transfer. **Preview** runs the same plan as a dry run and writes nothing;
**Import** then writes it. The method is `scrum.importIntoBoard(boardId, file,
{ dryRun })`, administrators only on the server; the matching rules are pure
(`models/lib/scrumTransferMerge.js`) and the writer is
`server/lib/scrumTransferMerge.js`.

What matches what, and why:

| What | Matched by, in order | When nothing matches |
| --- | --- | --- |
| Sprints, releases | the same `_id` on this board; the same provenance; the same trimmed name, when exactly one record on each side has it | created, with the source's provenance |
| Events | the same `_id` on this board; the same provenance | created, when its sprint is on this board |
| Cards | the same `_id` on this board; a board export's card number AND title, exactly one card | reported, left alone - cards are never created |

- **Provenance first, name last** makes a second import of the same file find
  the records the first one created: they carry `{ system: 'wekan', recordId,
  projectId }` of the source (or the Jira/GitLab/... provenance the file
  already had). The name rule is the one card copies and moves follow
  (`models/lib/scrumCopy.js`).
- **Never a guess.** Two candidates, or two file records claiming one board
  record, is `record-ambiguous`: the record is neither linked nor created, and a
  card that named it keeps its own sprint or releases. A card with no match is
  `card-not-matched`; one matching two cards, or two file cards matching one, is
  `card-ambiguous`; a card ID that is another board's card is
  `card-on-another-board`. Each is in the board's import report and the preview,
  and nothing is written for it. Linked cards never match.
- **A matched record is the board's own**: its name, dates, state and daily
  history are not overwritten. A created sprint brings its lifecycle, snapshots
  and daily history, remapped to this board's cards and lists; rows of cards or
  lists that are not here leave the snapshot, which is marked partial.
- **A matched card** gets the file's sprint, releases, backlog rank, issue type
  and acceptance criteria; past sprints are added to, and a card leaving a sprint
  remembers it, as `scrum.updateCard` does. A move into a finished sprint is
  refused (`sprint-finished`). Estimates are the card's planning poker value or a
  custom field, not Scrum metadata, and are not in the transfer, so they do not
  change. Board settings, list categories and swimlane links stay the board's.
- **Writes** go through the same journaled stage as every Scrum import
  (`scrumImportWriter.js`): an interrupted import shows the incomplete-import
  warning and is finished or discarded from the Scrum view, or offline
  ([Scrum import recovery](../../../ImportExport/Scrum-Import-Recovery.md)). An
  item's revision moves on by one, as any metadata write. The finished import is
  recorded as one Scrum History change, like any other Scrum edit; an import
  finished by recovery is not (no request is there to record it).
- **Idempotent**: when nothing would change, nothing is written - not even the
  report - and the preview says so.

Implementation checkpoint: `models/lib/scrumTransfer.js` now defines and tests
the `wekan-scrum-2` data contract and destination-ID remapping. Version 1 files
remain importable and receive no invented daily observations. Version 2 files
require a reader that understands version 2; older importers reject them.
The contract covers board
settings, sprint/release/event records, lifecycle snapshots and optional item
metadata. Missing transferred cards or historical actors produce explicit
loss entries; reduced snapshots are marked partial and their totals recalculated.
Daily observations retain their real timestamps, UTC day, start epoch, policy
and measured cards. Old restart epochs survive transfer without being merged
into the currently selected sprint epoch. Sprint, card, list and estimate-field
IDs are remapped; imported observation IDs use the same deterministic identity
as the collector. Invalid timestamps, duplicate daily identities and mismatched
policies within the current epoch are rejected. Native transfers are bounded
to 10,000 observations and 100,000 observed card rows in total; larger histories
fail explicitly instead of being truncated silently. The export scans stored
observations with a one-document cursor batch before applying scope filters.
Imported sprints remain marked pending until cards, observations and settings
are saved. The collector skips them and export refuses unfinished imports.
While any sprint on the board carries that marker, Scrum settings, planning,
metadata and lifecycle methods reject changes, including retries of an already
closed sprint. Scrum History restore/undo/redo also refuses to write or start a
recovery checkpoint. The Scrum view shows an incomplete-import warning and
removes editing capabilities; daily-history reads and all Scrum chart exports
fail explicitly. Once the importer finishes and clears the marker, these
operations become available again. This is an exclusion for marked Scrum
imports, not a global lock on ordinary board/card edits or all import stages.
Before writing Scrum targets, the importer now creates a private board-level
checkpoint and stages each intended write in `scrumImportSteps`. Records retain
the allocated destination IDs, exact before/after values and BSON dates. Each
step is a separate document rather than placing a large board in one MongoDB
document. A preparing checkpoint is not ready for recovery until every step is
durable; acknowledged writes advance its `next` position. A stop between a
target write and the position update leaves the complete intended step intact.

Metadata updates compare their original values, field presence and destination
board atomically. A changed or moved target stops the operation without being
overwritten. Exact already-written results are accepted by the step writer;
same-ID inserts with different content are rejected. Normal completion removes
the checkpoint only after clearing all sprint markers and deleting its plan.
It enters the same durable cleaning state as offline recovery before removing
plan rows. A cleanup failure propagates with the checkpoint still present,
allowing offline resume even after partial plan removal.
Board deletion cleans both private collections. The checkpoint also excludes
Scrum reads/writes/exports and daily capture before any sprint exists and after
the last sprint marker clears. The UI exposes only the existing pending flag,
not recovery contents or counters.

An [offline maintenance command](../../../ImportExport/Scrum-Import-Recovery.md)
can now inspect and continue a complete stored Scrum plan with all application
and other database writers stopped. It validates every target before writing,
uses a non-expiring per-board claim and recognizes writes whose acknowledgements
were lost. Complete preparing plans can be sealed; incomplete plans are refused.
An explicit cleaning phase resumes interrupted private-plan cleanup. Failed
recoveries retain their claim until an operator confirms its process stopped
and clears its exact token.

The same command can inspect and apply rollback of an interrupted Scrum plan.
It restores only original Scrum metadata and removes unchanged inserted records
in reverse order. Durable reverse progress and cleanup states survive write
acknowledgement gaps. Partially staged preparing plans can be discarded without
destination writes. Forward resume is refused after rollback starts; completed
imports whose plans are being removed can no longer be rolled back.

Online coordinated replay, reconstruction of incomplete plans, changed-target
resolution, reclamation of old orphan plans and recovery of earlier/later native
import stages remain unfinished. Existing marker-only interrupted imports have
no retroactive plan. Ordinary board/card edits are not locked by these
checkpoints; this is why the maintenance command requires stopped writers.
Unknown fields (including permission fields and recovery checkpoints), invalid
dates, inconsistent totals, foreign planning references and ID collisions fail
validation. Destination maps are supplied by the importer, never by file input.
Native export integration is implemented and verified: the implementation
adds a selectable Scrum section, strips operational checkpoints and revisions,
filters scoped planning records and marks reduced snapshots partial with a loss
report. Real HTTP tests cover full/scoped/omitted sections and anonymization.
The shared exporter now refuses private board-wide exports by assigned-only
members. The nine exporter authorization methods and affected HTTP formats are
covered by the ExportScopeBleed audit and regression tests. Native new-board
import validates before side effects, remaps destination IDs and restores
planning records, snapshots and metadata through the existing import pipeline.
Loss reports are visible to board administrators. Whole-board duplication now
reuses the remapper, collects destination container IDs and offers a Scrum part
in the existing selector. Its reduced snapshots remain visibly partial and it
does not copy original History rows. Existing-board scoped import, standalone
card/list/swimlane copy and move, external adapters and Sync integration remain
pending. Transporting
History and completing export security integration remain requirements, not
completed features. The shared anonymization
helper now rewrites known username mentions in Scrum prose, including canonical
transfer data. Native streaming export applies it to board goals, card acceptance
criteria and swimlane purpose. Identity references, estimate units and source
provenance are preserved; this is mention rewriting, not arbitrary personal-data
redaction. Native round-trip coverage uses the import page and real export route;
database-failure rollback and universal History transfer remain unimplemented.

Create one versioned, board-scoped Scrum transfer schema and shared validation
and remapping functions. Native JSON is the lossless reference format. Export
sprints, goals, definitions, releases, event records, snapshots and history when
the user's selected export parts include them. Extend anonymization and export
security filtering to every new text/member reference. A partial export must
not leave misleading dangling references.

Import allocates destination IDs before resolving links. Remap sprint, release,
card, member, list, swimlane and custom-field references; preserve source IDs
only as provenance. Invalid dates, ranks, units, cycles or foreign-board IDs
produce a preview error/loss report. Never promote imported roles to access
permissions or fabricate missing history.

Jira time-tracking import now preserves spent hours and original/remaining
estimates using existing spent-time and numeric custom fields. Native export
retains them, and the original estimate can be selected in Scrum settings.
Jira time export also restores numeric seconds using stable custom-field markers
and respects Dates/Custom Fields selection. Jira Sync now offers opt-in spent
hours and estimates in explicitly mapped numeric custom fields, with source
baselines and conflict checks. Estimate mappings retain their field ID and unit,
are revalidated before writes, preserve zero and handle explicit null clearing.
A changed mapping requires saving settings and invalidates its old baseline.
Successful estimate changes emit ordinary custom-field activities after saving;
advanced-filter rules can act on the new values. Unchanged and rejected writes
emit no success activity. Durable activity/History replay remains pending.
The existing Sync popup also selects title/description fields and card
creation/source-absence archival; these settings retain board write
authorization. Original/remaining time estimates now sync through the unique
imported numeric time fields on the board, in hours, with mapping identity
checks, local-edit review and zero/null/missing handling. GitLab's weight or
time estimate syncs into a numeric field too.

**Sprints and releases through List Sync** (2026-10-08). Two opt-in Sync
switches put a synced card in its issue's sprint and releases while Scrum is
enabled on the board:

| Source | Sprint | Releases |
| --- | --- | --- |
| Jira | the Sprint field (found by its schema): the active sprint, else the last future one | `fixVersions` |
| GitLab | `iteration` | `milestone` |
| GitHub, Gitea, Forgejo | none | `milestone` |

A missing sprint or release is created on the board, planned (a release may be
released), with the source's dates; an existing one is found by its source id
(`provenance`) first, then by name, and never on another board. Finished WeKan
sprints receive no work. A local planning change stays until the source changes
that issue's planning; a source omission never clears planning, an explicit
null or empty value does, but only against the last Sync's baseline. Card
changes run through Sync's conditional and durable writes, move the card's
`scrumRevision` on and record the Scrum History row a manual change records, so
undo works the same. Details: [Sync](../../../ImportExport/Sync.md#sprints-and-releases-scrum-planning).
Card mappings and credentials now carry a
provider/server/project identity, preserving old cards when switching sources.
Legacy configurations require saving once to bind their existing mappings.
Atomic concurrent jobs and configuration writes remain pending.
See [Sync](../../../ImportExport/Sync.md) for verified scope and limits.

Jira mappings use the supplied field schema and explicit user choices, not
hard-coded `customfield_*` numbers. Accept sprint IDs and expanded sprint
objects; preserve multiple past sprints, goals, dates, state, epic/parent links,
fix versions, rank, estimates and original/remaining/spent time when supplied.
Issue-search JSON alone may omit sprint objects or history: report those gaps;
do not claim complete Jira preservation without the relevant export data.

Trello maps lists, labels and numeric/date/custom fields using a previewable
mapping. Retain recognized Power-Up metadata only when supplied in the export;
Trello does not provide a single standard Scrum data model. Other supported
adapters use the same canonical transfer schema and publish an explicit field
coverage/loss table. Do not call lossy external exports lossless.

Sync compares stable source identity and revisions, preserves local-only fields,
and applies the same permissions and validation as manual editing. Source
absence does not delete sprint data unless deletion was explicitly selected.
Add field selection and conflict handling to the existing Sync UI. Credentials
remain in the existing secure storage and are never exported in Scrum metadata.
Board/card duplication must remap the same references and start a fresh activity
history, matching existing duplication behavior.

## Implementation and verification sequence

1. Audit and design (this document); link documentation from existing menu paths.
2. Canonical schema/validation, permissions, visibility defaults and ID remapping.
3. Backlog/sprint configuration and editing, lifecycle and history/undo.
4. Hidden-by-default item fields and settings, including drag order and RTL.
5. Sprint views/reports using existing chart/export infrastructure.
6. Native round trip, duplication, Jira/Trello/other adapters and sync coverage.
7. Browser and server integration tests, documentation and release entries.

Each stage needs executable positive and negative tests. Test board-admin,
normal member, read-only, comment-only, anonymous/public and foreign-private
board cases. Test stale revisions, repeated requests, undo conflicts, missing
source history, archived cards, card reopening, scope changes, DST, zero versus
missing estimates and incompatible units. Browser tests must exercise all new
views, hidden defaults, opt-in settings, drag/drop, localized/RTL forms and
Excel/PDF export. Round-trip fixtures compare full native data and documented
external losses; sync tests prove local-only values and permissions survive.

Do not mark this design complete until the menu/settings, lifecycle/history,
reports and transfer paths are implemented and the relevant tests pass.

## Standards and adapter references

The [Scrum Guide](https://scrumguides.org/scrum-guide.html) defines the framework:
team accountabilities, events, artifacts and commitments. Estimation scales,
velocity, epics and releases are useful optional product-planning practices,
not additional mandatory Scrum events. The implementation should support the
framework without imposing a single team's workflow.

The [Jira Software sprint API](https://developer.atlassian.com/cloud/jira/software/rest/api-group-sprint/)
provides sprint records separately from generic issue search. Its data shape is
an adapter input, not WeKan's permission or storage model.
