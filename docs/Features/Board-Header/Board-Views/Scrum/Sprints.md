# Sprints

## What it is

A sprint is a short, fixed period (often one or two weeks) in which a Scrum
team finishes a chosen set of work toward a goal. Board View / Sprints manages
board-local sprint plans and their lifecycle, the board's releases and the
sprint's Scrum events (planning, daily, review and retrospective). Board
administrators create sprints, start them, close them, or cancel them.
Existing card permissions control who may assign work or edit its metadata.
Scrum accountabilities do not grant additional permissions.

## Read more

- Wikipedia: [Scrum (project management)](https://en.wikipedia.org/wiki/Scrum_(project_management)),
  [Velocity (software development)](https://en.wikipedia.org/wiki/Velocity_(software_development)),
  [Release management](https://en.wikipedia.org/wiki/Release_management) and
  [Undo](https://en.wikipedia.org/wiki/Undo).
- [The Scrum Guide](https://scrumguides.org/scrum-guide.html) - sprints,
  events and artifacts.
- In WeKan: [Product Backlog](Product-Backlog.md),
  [Sprint Report and Velocity](Sprint-Reports.md),
  [Scrum History recovery](Scrum-History-Recovery.md),
  [the Scrum design](Scrum-Design.md),
  [Scrum settings](../../../Board-Sidebar/Board-Settings/Scrum-Settings.md),
  [Scrum meetings](../../../Board-Sidebar/Board-Settings/Scrum-Meetings.md) and
  [Scrum on cards](../../../Cards/Scrum.md).

## How to use it

**Set the board up (board administrator):**

1. Open the board, then **Board View → Scrum → Sprints**.
2. Open **Scrum settings** at the top of the view (also in the board menu as
   **Scrum settings**). Tick **Enable Scrum planning**, choose the
   **Estimate source** (Planning Poker or a number custom field in **Custom
   Fields**), the **Estimate unit**, the **Completion policy** (**Card marked
   complete** or **Card in a Done-category list**) and the **Working days**,
   and click **Save**.

**Plan and start a sprint:**

1. Open **Create or edit a planned sprint**, fill in **Name**, **Sprint Goal**,
   **Start**, **End**, and optionally **Capacity** and its **Estimate unit**.
   Click **Save** (**New sprint** clears the form for another one).
2. Assign cards to it in the [Product Backlog](Product-Backlog.md) or in the
   card table under the sprint.
3. Choose the sprint in **Sprint** and click **Start sprint**.

**Close or cancel a sprint:**

1. Choose the active sprint in **Sprint**.
2. In **Move unfinished work to**, choose another planned sprint or
   **Product Backlog**, and click **Close sprint**.
3. Or write a **Cancellation reason** and click **Cancel sprint**.
4. If a close was interrupted, choose the sprint and click **Resume
   interrupted sprint close**.

**Releases:** in **Releases and increments**, choose **Add** or an existing
release in **Release**, fill in **Name**, goal, **Start**, **End**,
**Status**, **Released at** and **Notes and outcomes**, and click **Save**.

**Sprint events:** with a sprint chosen, choose **Add** or an existing event in
**Sprint events**, set **Event type**, **Name**, **Date**, **Timebox
(minutes)**, **Notes and outcomes** and **Follow-up cards**, and click
**Save**.

**Undo a Scrum change:** click **History** in the toolbar.

## How the numbers are calculated

- **Release totals** ([models/lib/scrumReports.js](../../../../../models/lib/scrumReports.js)
  `releaseReports`): for each release, **Cards in this release** and
  **Completed** (done under the board's completion policy), each as a card
  count, a sum of known estimates and a count of unknown estimates. Archived
  cards are not counted; a card counts in each of its releases.
- **Estimates** ([models/lib/scrum.js](../../../../../models/lib/scrum.js)
  `getCardEstimate`): the Planning Poker estimate or the chosen custom field's
  number; a missing, negative or non-numeric value is unknown.
- **Start and close snapshots** (`sprintSnapshot`): every card of the sprint
  with its estimate and whether it is done, plus the count of missing
  estimates and the sum of the known ones.
- **Defaults** (`DEFAULT_SCRUM_SETTINGS`): estimate source Planning Poker,
  unit `points`, completion policy **Card marked complete**, working days
  Monday to Friday. Capacity is 0 or more; an event timebox is 0 to 10,080
  minutes (one week); names are at most 200 characters.
- **Progress** of a large close or undo: **Moving the sprint's cards on: N of
  M**, counted in cards.

## How it works in WeKan

### Plan and start

Create a planned sprint with a name, goal, start and end dates. Capacity is
optional; when supplied, its unit must match the board's estimate unit.
Assign cards from Product Backlog. Starting a sprint captures its original
scope, estimates and completion policy. A missing estimate stays unknown;
an explicit zero remains zero.

Board Settings / Scrum settings selects planning-poker estimates or an
existing numeric custom field. Completion can mean a card marked complete
or membership in a list whose Scrum category is Done. Estimate and completion
policies cannot change while a sprint is active.

### Close or cancel

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

Very large sprints are closed, and their undo and redo run, as background
jobs with progress in the Scrum view; each job runs on one server at a time,
by lease. There is no card limit on a sprint: the snapshot rows are stored in
chunks outside the sprint document.

Cancellation requires a reason. It retains current card memberships for
explicit reassignment and does not fabricate a completed-sprint report.

### History and undo

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
A checkpoint that stopped on a conflict can be resolved by a board
administrator; see [Scrum History recovery](Scrum-History-Recovery.md).

### Optional presentation

New Scrum fields are hidden on existing cards, minicards, lists and swimlanes.
Board Settings / Card has independent Card and Minicard visibility choices.
Board Settings / List controls the workflow category; Board Settings /
Swimlane controls sprint, release and purpose fields. Revealing a field does
not grant permission to edit its value.

### Releases and Scrum events

Board administrators manage releases in Board View / Sprints. Choose Add in
the release selector to create a record, or select an existing release to edit
its name, goal, planned dates, status, release timestamp and notes. Saving an
existing release updates that record instead of creating another one.

Each release shows the cards in it and the part of them that is done, under
the board's completion policy, as counts and estimates with unknown estimates
counted separately. A card in several releases counts in each of them, so the
releases together can hold more cards than the board; archived cards are not
counted, and a member who sees only assigned cards sees their totals.

Select a sprint to manage its planning, daily, review and retrospective events.
Choose Add or an existing event, then set its name, kind, local date and time,
timebox, notes and follow-up cards. Follow-up choices use cards visible to the
current user; event summaries link those cards. Existing timestamps retain
their exact instant when only another field is edited. Release and event
edits use revision checks and the same History undo/redo as other Scrum data.

### Implementation checkpoint

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
Since 2026-10-08 a board administrator can also import Scrum planning into an
existing board (**Import Scrum planning into this board** in the Scrum view,
with a **Preview** first), and sprints and releases can be synchronized; see
[the Scrum design](Scrum-Design.md#importing-scrum-planning-into-an-existing-board).

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
sprint, a release that is not cancelled), and drops them otherwise. A card with
several releases has each of them linked this way on its own, keeping every
one the destination board also has; past sprints
and backlog rank always go. Issue type, acceptance criteria and swimlane purpose
stay. Lists carry only their
workflow category, which is not board-specific.

The current implementation includes planning forms, revision checks,
start/close snapshots, release and event editors, visibility controls, report
tables, interactive count/estimate bars, daily observation and change-by-change
scope charts, and Excel/PDF output. Work remains on import/export/sync coverage.
History is integrated;
large-board limits and additional failure-injection coverage remain to verify.
These are tracked by [the Scrum design](Scrum-Design.md); this guide does not
claim they are finished.

### Files and tests

- View: [client/components/boards/scrum/scrumView.jade](../../../../../client/components/boards/scrum/scrumView.jade)
  and [scrumView.js](../../../../../client/components/boards/scrum/scrumView.js);
  the optional fields: [scrumFields.jade](../../../../../client/components/boards/scrum/scrumFields.jade).
- Server methods in [server/scrum.js](../../../../../server/scrum.js):
  `scrum.configure`, `scrum.saveSprint`, `scrum.saveRelease`,
  `scrum.saveEvent`, `scrum.startSprint`, `scrum.closeSprint`,
  `scrum.cancelSprint`, and `scrum.updateCard` / `updateList` /
  `updateSwimlane`; background jobs in
  [server/lib/scrumBatchJobs.js](../../../../../server/lib/scrumBatchJobs.js) and
  the rollover in [server/lib/scrumRolloverStore.js](../../../../../server/lib/scrumRolloverStore.js).
- Collections: [models/scrumSprints.js](../../../../../models/scrumSprints.js),
  [models/scrumReleases.js](../../../../../models/scrumReleases.js) and
  [models/scrumEvents.js](../../../../../models/scrumEvents.js); validation in
  [models/lib/scrum.js](../../../../../models/lib/scrum.js).
- Tests: [tests/scrumDomain.test.cjs](../../../../../tests/scrumDomain.test.cjs),
  [tests/scrumMethods.test.cjs](../../../../../tests/scrumMethods.test.cjs),
  [tests/scrumHistory.test.cjs](../../../../../tests/scrumHistory.test.cjs),
  [tests/scrumRolloverLease.test.cjs](../../../../../tests/scrumRolloverLease.test.cjs),
  [tests/scrumCopy.test.cjs](../../../../../tests/scrumCopy.test.cjs),
  [tests/scrumTransfer.test.cjs](../../../../../tests/scrumTransfer.test.cjs) and
  the UI specs [scrum.e2e.js](../../../../../tests/playwright/specs/scrum.e2e.js),
  [scrum-close-recovery.e2e.js](../../../../../tests/playwright/specs/scrum-close-recovery.e2e.js),
  [scrum-history.e2e.js](../../../../../tests/playwright/specs/scrum-history.e2e.js),
  [scrum-board-copy.e2e.js](../../../../../tests/playwright/specs/scrum-board-copy.e2e.js)
  and [scrum-card-copy.e2e.js](../../../../../tests/playwright/specs/scrum-card-copy.e2e.js).

## Commits

 - [Linear cycles become sprints and milestones releases](https://github.com/wekan/wekan/commit/75694ac644d71016b092c0543a62fb63aef817ee)
 - [The Definition of Ready beside the Definition of Done](https://github.com/wekan/wekan/commit/9ac7b916c08bb139f1090d4e87b8319aed08d324)
 - [A visitor's Scrum view opens as chosen](https://github.com/wekan/wekan/commit/a896f3ed8c0dc7741b158c3d6d58ff59ffbb6be2)
 - [Batch undo and redo of a large sprint is 2.6 times faster](https://github.com/wekan/wekan/commit/5e671c703474206af909a0c1c1290634a890a679)
 - [Import Scrum planning into an existing board](https://github.com/wekan/wekan/commit/ef549078367ca55e3ec45b62d9df915ae6f8162b)
 - [Sync sprints and releases into Scrum planning](https://github.com/wekan/wekan/commit/c06bf8d0e9d3085a5e6513a0c3ec52977a071381)
 - [A card can be in more than one release](https://github.com/wekan/wekan/commit/727ceedd011106189b16013d710409caf3b690ca)
 - [Each large-sprint job runs on one server at a time, by lease](https://github.com/wekan/wekan/commit/0218cd823fa911fd0c92add8bd13686c9017e70a)
 - [Very large sprints close and undo in the background, with progress](https://github.com/wekan/wekan/commit/600fc3b4dec22351b78874c9ee4c5730d5eb294b)
 - [No card cap on a sprint: chunked rollover plans and History](https://github.com/wekan/wekan/commit/13c8d563eac545615abd047cc2cfa181b6e9c20e)
 - [A copied or moved item links the other board's sprint and release of the same name](https://github.com/wekan/wekan/commit/823dc94715d399f8b0c9b4d216cc47617d67c486)
 - [A moved item drops its sprint and release when it changes board](https://github.com/wekan/wekan/commit/e657dfb7e990a66827285d4424c416442993b1f9)
 - [Scrum settings sit above Change color in Board Settings](https://github.com/wekan/wekan/commit/7bf6f8a44b18cc4b324e666b933ef5d86eeda6e4)
 - [Interrupted sprint close recovery for board administrators](https://github.com/wekan/wekan/commit/72f8463452cd51dda3f29d0d6d224663e1e04e87)
 - [Scrum data is remapped when a board is duplicated](https://github.com/wekan/wekan/commit/4af54df663d42e68e72c8c69c934e5c4147b7b72)
 - [Native Scrum data is restored by board import](https://github.com/wekan/wekan/commit/e0863b35cdfb33ae3723aca1e98783c5151d4bdd)
 - [Native board exports include versioned Scrum data](https://github.com/wekan/wekan/commit/d70358219ae1f8050f10846772a9c78e530d006b)
 - [Editing Scrum releases and events](https://github.com/wekan/wekan/commit/89a06f1d5d0a35c9a13ee116f9baf7d96bae33d1)
 - [Scrum changes use recoverable History undo and redo](https://github.com/wekan/wekan/commit/ceb19bc77c91a5aeb2b3e0b374729338edf3e3c2)
 - [Sprint planning, optional metadata and snapshot reports](https://github.com/wekan/wekan/commit/83eac102113623f8e0bc91b012c994b3c8291765)
