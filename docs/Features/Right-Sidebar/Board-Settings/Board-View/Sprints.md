# Sprints

Board View / Sprints manages board-local sprint plans and their lifecycle.
Board administrators create sprints, start them, close them, or cancel them.
Existing card permissions control who may assign work or edit its metadata.
Scrum accountabilities do not grant additional permissions.

## Plan and start

Create a planned sprint with a name, goal, start and end dates. Capacity is
optional; when supplied, its unit must match the board's estimate unit.
Assign cards from Product Backlog. Starting a sprint captures its original
scope, estimates and completion policy. A missing estimate stays unknown;
an explicit zero remains zero.

Board Settings / Scrum settings selects planning-poker estimates or an
existing numeric custom field. Completion can mean a card marked complete
or membership in a list whose Scrum category is Done. Estimate and completion
policies cannot change while a sprint is active.

## Close or cancel

Closing captures the final scope and outcomes before moving cards. Completed
cards return to the product backlog; unfinished cards can move to another
planned sprint or to the backlog. Past sprint membership is retained.
Archiving a completed card does not turn it back into unfinished work.

Database writes use a recoverable rollover checkpoint. If an interrupted
close is retried, it resumes without silently overwriting later card edits.
After refreshing, administrators can select the closed sprint and choose
**Resume interrupted sprint close**. This uses the saved destination and
original revision; it does not start another close or choose a new target.
Pending History recovery must finish before this action can proceed.
An unresolved rollover conflict must be resolved before further Scrum writes.
This is not a database transaction.

Cancellation requires a reason. It retains current card memberships for
explicit reassignment and does not fabricate a completed-sprint report.

## History and undo

The History button on each Scrum view opens the existing board History,
filtered to Scrum changes. Settings, planning records and optional metadata
use before/after records. A sprint close and its card moves form one History
operation. Undo and redo also append timestamped timeline checkpoints.

Restoring requires the current permissions for every affected item. Planning
and board settings require a board administrator; card changes retain their
existing card permission checks. Undo rejects newer conflicting Scrum edits
and preserves unrelated card content. Referenced planning records cannot be
removed while other items still use them.

An interrupted compound restore retains a private recovery checkpoint until
the data, timeline and undo status are saved. Retry the same operation to
resume it; other Scrum writes wait for recovery. This is not a database
transaction. History recording failures are reported to the caller; this
does not provide atomic persistence of an original edit and its History row.

## Optional presentation

New Scrum fields are hidden on existing cards, minicards, lists and swimlanes.
Board Settings / Card has independent Card and Minicard visibility choices.
Board Settings / List controls the workflow category; Board Settings /
Swimlane controls sprint, release and purpose fields. Revealing a field does
not grant permission to edit its value.

## Releases and Scrum events

Board administrators manage releases in Board View / Sprints. Choose Add in
the release selector to create a record, or select an existing release to edit
its name, goal, planned dates, status, release timestamp and notes. Saving an
existing release updates that record instead of creating another one.

Select a sprint to manage its planning, daily, review and retrospective events.
Choose Add or an existing event, then set its name, kind, local date and time,
timebox, notes and follow-up cards. Follow-up choices use cards visible to the
current user; event summaries link those cards. Existing timestamps retain
their exact instant when only another field is edited. Release and event
edits use revision checks and the same History undo/redo as other Scrum data.

## Implementation checkpoint

Native JSON export includes a selectable Scrum section containing versioned
planning records, settings, item metadata and lifecycle snapshots. Scoped
exports keep referenced planning records, remove omitted snapshot rows and
follow-up links, and include explicit loss entries. Reduced snapshots are
marked partial. Operational recovery checkpoints and revision counters are
not exported. Finish interrupted Scrum operations before exporting.

Native board import restores the versioned section with new destination IDs.
Validation runs before users or boards are created; missing required references
or incompatible estimate fields reject the import. Selecting no Scrum section
omits Scrum metadata as well as planning records. Import losses appear in an
Import disclosure on Scrum views for board administrators. Source accountabilities
remain informational and never grant board permissions.

Native board round trips are tested, but universal History is not transported
yet. Existing-board scoped import and synchronization remain in
progress. Imports are not multi-document database transactions: a database
failure after preflight can still leave a partially created board.

Board duplication also offers Scrum in its existing part selector, selected by
default. Selecting Scrum includes custom-field definitions needed by estimates;
clearing custom fields clears Scrum. Planning records receive new IDs, and
copied card, list, swimlane, release and snapshot references point to the copy.
Copying without cards retains planning records but marks reduced snapshots
partial. Reports and Excel/PDF rows display that limitation. Clearing Scrum
omits its settings and item metadata. The copy starts fresh History rather
than importing the source board's History records.

A card or swimlane copied or moved to another board takes that board's sprint
and release of the same name when exactly one matches (a planned or active
sprint, a release that is not cancelled), and drops them otherwise; past sprints
and backlog rank always go. Issue type, acceptance criteria and swimlane purpose
stay. Lists carry only their
workflow category, which is not board-specific.

The current implementation includes planning forms, revision checks,
start/close snapshots, release and event editors, visibility controls, report
tables, interactive count/estimate bars and Excel/PDF output. Work remains on daily history charts and
import/export/sync coverage. History is integrated;
large-board limits and additional failure-injection coverage remain to verify.
These are tracked by [the Scrum design](Scrum-Design.md); this guide does not
claim they are finished.
