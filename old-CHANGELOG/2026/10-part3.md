# WeKan ® 2026-10 releases, part 3

Moved out of [CHANGELOG.md](../../CHANGELOG.md) to keep that
file small enough to open (wekan/wekan#6580). Nothing here has been changed:
a release section is a record, and it reads the same as it did there.

This is part 3 of 5, newest first: [1](10.md), [2](10-part2.md), 3, [4](10-part4.md), [5](10-part5.md).

Releases per day:

| 2026-10 | Releases |
| --- | --- |
| 03 | 1 |

# v12.16 2026-10-03 WeKan ® release

**In short:** Administrators choose which optional **board views** WeKan offers,
can keep features from later updates off until approved, and can stream every
change to a **continuous backup** that restores to a chosen moment. **Board
Settings / Card** gives every row a card and a minicard side, shows each Scrum
field as its own row and reorders rows by **drag and drop**, as does Board
View. Scrum sprints have **no card limit**, boards import and export
**Taskwarrior** and **Focalboard**, rule actions run through durable Sync on
**another board** too, webhooks can opt into **act-editCard**, and
translations cover more languages.

This release fixes the following CRITICAL SECURITY ISSUES:

**Board access** - what a copy carries along, and what a new card may name.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5fad29a254">A card copy carries only the subtasks the copier may copy</a>. Thanks to xet7.</summary>

A copy took every subtask of the card. An assigned-only member copying a card
assigned to them got copies of subtasks assigned to others, and any member got
copies of subtasks on boards they cannot read, since a parent may have subtasks
on another board. The copy dialog and the durable rule copy now carry only the
subtasks the copier could read and copy themselves. Not recorded in Admin Panel
→ Problems: copying a card with subtasks is ordinary use. Tests: the decision,
a scan that every place copying subtasks filters them, and a server test
through copyCard that showed the leak without the fix.
[AssignedBleed](https://wekan.fi/hall-of-fame/assignedbleed/).

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/6d3b27aeb6">A card insert may not name another board's list or swimlane</a>. Thanks to xet7.</summary>

A DDP insert on a board the caller may write to could name the list and
swimlane of another, private board; the card stayed home, but its creation
activity carried their titles, so a member could read another board's list
names by id. Such an insert is refused, as the server's own copies already
refused that destination, and the attempt is recorded under BoardBleed in
Admin Panel → Problems. Found reviewing the client-side template copies, which
use the same insert rules. [BoardBleed](https://wekan.fi/hall-of-fame/boardbleed/).

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/509f1d97fc">A rule may not name another board's trigger, and rules match on their own board</a>. Thanks to xet7.</summary>

A board admin could save a rule on their own board naming another board's
trigger. Only that board's rules ran on its activities, but the matcher took
a trigger's rule from whichever rule named it first, so the other board's own
rule could silently stop running. Rules now match on the activity's own board,
and such a rule is refused and recorded under RepointBleed in Admin Panel →
Problems. Found reviewing the legacy direct Rules writes.
[RepointBleed](https://wekan.fi/hall-of-fame/repointbleed/).

</details>

and fixes the following SECURITY ISSUES found by [GitHub CodeQL](https://codeql.github.com/) code scanning:

- [A test builds its over-long template string without an escaped interpolation](https://github.com/wekan/wekan/commit/437af449f3)
  (CodeQL alert #548, js/useless-regexp-character-escape, with a parsed guard
  against the shape in any regex-context template literal). Thanks to xet7.

and adds the following new features:

**Board Settings / Card** - every row on both surfaces, the Scrum fields as
rows, and drag and drop instead of arrows; Board View reorders the same way.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/6d950b7474">Each Scrum field is its own row, "Scrum settings: Sprint" and so on</a>. Thanks to xet7.</summary>

The separate Scrum checkbox lists under each column are gone. Every Scrum field
is a row of both columns, ordered with the others and drawn where the board's
order puts it - by default where the Scrum block was. The minicard gained Past
sprints and Acceptance criteria, and its work item type row is the switch of
the work item type badge, on unless turned off. Column actions set the Scrum
rows through scrum.configure, so its lock, revision and Scrum history apply.
Tests: the order and coverage guards, a column-actions unit test and Playwright
cases in scrum.e2e.js and board-settings-columns.e2e.js.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2d80e6e4ee">Rows reorder by drag and drop, in Board Settings / Card and Board View</a>. Thanks to xet7.</summary>

The up and down arrows are replaced. With drag handles on, a handle sits where
the arrows were; with them off, the row's icon and label are dragged. Up and
Down on the focused handle or label still move a row one step. A dropped Card
row is walked to its place through the same one-step moves, so a pinned header
stays first and a section moves as one; head, tail and modifier rows are not
draggable. A dropped Board View order fills the shown rows' slots, so a view
the instance disabled keeps its place. settings-drag-reorder.e2e.js passes in
Chromium and WebKit.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/79b4467546">Every row can be shown on the card and on the minicard</a>. Thanks to xet7.</summary>

Eighteen one-sided rows got their other side. On the minicard: location,
requested and assigned by, running Flowtime and Pomodoro, attachment names, the
text-note count, the last change, the description title and the checklist title
and due date. On the card: the collapse caret's switch, labels above the title,
labels text with the user's own override, the card's list title, the swimlane
name and the comment count. A side that already drew something stays on; a new
element is off until chosen.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/8d30e4fdbc">Rows for what was drawn without one: color, parent, linked card, buttons, badges</a>. Thanks to xet7.</summary>

The card color, the parent card, the linked card indicator, the rule card
buttons, the description badge and the unread comments marker each have a row
with both sides. What was drawn before stays on; the card's description badge
and unread marker and the minicard's card buttons are off until chosen. The
minicard's buttons use one board-level rules subscription, only while on. The
archived banner and upload progress are status, week-of-year is a Member
Settings preference and card aging has its own setting, so they have no row.

</details>

**Board Settings** - the menu's groups.

- [Scrum settings is a group of its own, above Change color](https://github.com/wekan/wekan/commit/7bf6f8a44b). Thanks to xet7.

**Import and export** - two more formats, and Jira's Scrum planning data.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5d26e9fff8">Boards import and export Focalboard (Mattermost Boards) archive text</a>. Thanks to xet7.</summary>

A Focalboard board.jsonl, from a .boardarchive zip, imports with or without
its version line. The board view's group-by property becomes the lists, other
select properties labels, the first date property the due date (or start and
due), and text, number, email, URL, phone, checkbox and later dates custom
fields. Text and heading blocks become the description, checkbox blocks a
checklist, comment blocks comments; members, person properties, images,
attachments and templates are in the loss report. Export writes the same
text. Tests: tests/focalboard.test.cjs and a Playwright import.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f0323140f6">Boards import and export Taskwarrior JSON</a>. Thanks to xet7.</summary>

Taskwarrior's task export / task import JSON, as an array or one task per line.
Status sets the list, project and priority become labels, tags become labels,
entry, due, scheduled and end become dates, annotations become comments and
depends becomes blocked-by dependencies by uuid. WeKan's wekanlist and
wekandescription attributes, kept by Taskwarrior as orphaned UDAs, carry list
names and descriptions across a round trip. Deleted tasks, recurring templates,
bad dates and unmapped attributes go to the loss report. Tests:
tests/taskwarrior.test.cjs and a Playwright import case.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b0803ffeaa">Jira sprints, fix versions, rank and epic links import as Scrum planning data</a>. Thanks to xet7.</summary>

The Sprint, Rank and Epic Link fields are found by their schema type, or by
name when the export has no schema, never by number. Future and active sprints
become planned sprints with their goals and dates; closed sprints, and an
active sprint's missing commitment snapshot, are reported in Problems →
Recovery rather than invented. Fix versions become releases, rank orders the
backlog, and a legacy Epic Link becomes the card's parent. Tests:
tests/jiraScrumPlanning.test.cjs and a server test of a real import.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/47a603a63f">The Jira import page offers the export's numeric fields as the estimate</a>. Thanks to xet7.</summary>

The fields come from the pasted export's schema, story points first. With no
field entered, the one field of Jira Software's story points type is used, in
points; with two or none, nothing is chosen. Test:
tests/jiraEstimateMapping.test.cjs.

</details>

**Sprint Report** - what happened to a sprint between its daily observations.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/306f127a31">Scope and burndown are replayed change by change from History</a>. Thanks to xet7.</summary>

Each change since the sprint started - cards joining or leaving, estimates,
completion, moves to done lists, archiving - becomes a row with the sprint's
scope, remaining and completed work after it. The replay is checked against
the sprint's start and close snapshots and, while it is open, against the
cards as they are now; a mismatch means History missed a write, and the report
says so. Tests: tests/scrumScopeReplay.test.cjs, a server test through the real
Scrum methods, and tests/playwright/specs/scrum-scope-history.e2e.js.

</details>

**Scrum boards** - sprints of any size, large boards, other boards, and
interrupted imports.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0218cd823f">A large sprint's background rollover or undo runs on one server at a time</a>. Thanks to xet7.</summary>

Each server resumed the background jobs it found after a restart, so two of
them could run one job and stop each other with conflicts. Each step now
takes or renews a one-minute lease on the sprint or the job; another server's
live lease leaves the job to it, and a lease that ran out is taken over.
Tests: a foreign live lease leaves both jobs untouched, an expired one is
taken over.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/600fc3b4de">A large sprint closes, undoes and redoes in the background, with progress</a>. Thanks to xet7.</summary>

As decided on 2026-10-03, every per-card guard stays and the browser no longer
waits on one call. A close over 2,000 cards returns once the sprint is closed;
its rollover continues chunk by chunk under the close's named History batch,
resumes after a restart, and keeps a failure for the resume button. An undo or
redo of a batch with more than four rows left continues as a background job
that undo and redo on the board wait for. The Scrum view shows both as progress
bars. A smaller sprint still closes in one History row.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b6ca287df3">A sprint's snapshot rows are kept outside the sprint document</a>. Thanks to xet7.</summary>

A sprint kept one row per card of its start and close snapshots in its own
document, so about 15,000 cards were the most a sprint could hold. The rows
now live in scrumSnapshotRows, in immutable chunks of 2,000 named by sprint,
kind, time and number, so a retried start or close, an undo or a redo finds
the same rows; the sprint keeps a header and the report's totals. The board
data computes each report on the server and sends headers only - from the
totals, or for an assigned-only reader from the rows they may see. Snapshots
stored inline before this keep working. Tests: tests/scrumSnapshotRows.test.cjs
and a server test through start, close, undo, redo and a board copy.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/13c8d563ea">Sprints have no card limit: rollover plans, History and daily rows are chunked</a>. Thanks to xet7.</summary>

As decided on 2026-10-03 ("full redesign, no cap"), a sprint over 10,000
cards starts and closes. A close's rollover plan goes to scrumRolloverRows in
chunks bounded by rows and bytes, the sprint keeping only a mark; a History
batch too large for one row becomes several rows sharing a batchId, and one
undo or redo still walks the whole close; daily burndown rows are chunked too.
Undo no longer re-hashes its row and re-sends its plan before every record
write, which made 1,500 cards take four minutes: 10,500 cards now close in
about 8 s and undo in about 44 s. Tests: tests/scrumHistoryParts.test.cjs, a
10,500-card server test, an interrupted rollover, and
tests/playwright/specs/scrum-snapshot-limits.e2e.js.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/823dc94715">A card or swimlane on another board keeps its sprint and release of the same name</a>. Thanks to xet7.</summary>

As decided on 2026-10-02, a copy or move to another board links the sprint and
release to that board's own of the same name when exactly one matches - a
planned or active sprint, a release that is not cancelled - and drops them
otherwise; past sprints and rank always go. Card and swimlane copies, subtasks,
every move (by server hooks) and the durable rule copy and move all do it.
Tests: tests/scrumCopy.test.cjs and server tests with real sprints.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5a1c265a9e">Large Scrum boards open faster and show 100 rows at a time</a>. Thanks to xet7.</summary>

The edit check for all of a board's cards is one batch instead of queries per
card, and agrees with the per-card check in every case a server test tries. The
Product Backlog and Sprints tables, whose rows each carry an edit form, show
100 rows at a time with a button for more. Tests: the server test and
tests/playwright/specs/scrum-backlog-paging.e2e.js.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/6f52f2b42a">A board admin finishes or discards an interrupted Scrum import online</a>. Thanks to xet7.</summary>

The import's checkpoint names its writer and holds a lease it renews; once it
runs out, the Scrum view offers to finish the import - taking the checkpoint
over and replaying the saved steps, a paused writer fenced out - or to discard
one whose plan was never fully saved, which writes nothing. Rollback stays
offline. Tests: tests/integration/scrumImportRecovery.test.cjs and
tests/playwright/specs/scrum-import-online-recovery.e2e.js.

</details>

**The Admin Panel** - Settings / Visibility decides which optional features
the whole instance offers, and who may try them first.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/18d57b2b8f">A Features group turns optional board views on or off for everyone</a>. Thanks to nalilord and xet7.</summary>

[#6736](https://github.com/wekan/wekan/issues/6736): the optional board views
are grouped as Table, Calendar, Time, Overview, Gantt, Scrum, Flow charts and
Map, and each group can be disabled instance-wide. A disabled view is removed
from the Board View menu and from Board Settings / Board View rather than
greyed out, a user who had it open is moved to the board's default view, and
reordering in Board Settings steps over the hidden rows. Disabling keeps the
data and changes no permission. Swimlanes and Lists are core and cannot be
disabled.

Administrators can preview disabled features, and named pilot users see them
too; the pilot flag is published only in the user's own document. An opt-in
policy keeps features added by later WeKan updates disabled until an
administrator enables them, while the features present when it is turned on
stay as they were. The catalog and its decisions are one pure module,
`models/lib/instanceFeatures.js`. Tests: `tests/instanceFeatures.test.cjs`
(decisions, approval policy, preview, catalog integrity, and a tree-wide guard
that no client code draws or resolves a view without the filter), a server test
of the admin-only save, and `tests/playwright/specs/instance-features.e2e.js`,
which passes in Chromium and WebKit. The English texts are pending Transifex.

</details>

**Outgoing webhooks** - card edits as one event, for the receivers that ask
for it.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/06e186a0d0">A webhook can opt into one act-editCard event for title and description edits</a>. Thanks to Rishats and xet7.</summary>

[#4912](https://github.com/wekan/wekan/issues/4912), as decided on 2026-10-02:
a webhook whose activity list names `act-editCard` receives that event, with a
`field` parameter, instead of `act-a-changedTitle` /
`act-a-changedDescription`. A webhook on `all` or on the per-field events keeps
what it received before, and every webhook still gets one delivery per edit,
so no receiver sees an edit twice. Ordinary dispatch and stored Sync webhook
plans make the same choice through `models/lib/editCardWebhook.js`. Tests:
`tests/editCardWebhook.test.cjs` (positive, negative and a tree-wide guard) and
a server test of the stored plan.

</details>

**List Sync** - more of what a rule does runs through durable Sync, lists from
before list lifetimes can use it, and GitLab estimates sync too.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b7084fdc06">A rule's email follows the card to the board the rule's own move took it to</a>. Thanks to xet7.</summary>

As decided on 2026-10-03. A rule that moved a card to another board and then
sent an email sent nothing, because the email source check refused a card
that had left the activity's board. The email now reads the card on the
destination board when this run of the rule made the move, that board opted
into Sync effects, and the card is still there. Durable Sync proves the move
from the plan's own saved move and checks it again before sending, so such a
plan is durable too. Any other card off the board is still refused. Tests:
binding cases, a guard that nothing else can claim a followed move, and a
server test of both engines with its negative cases.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b07a8a421b">A rule can move its card on to a third board after a move to another, durably</a>. Thanks to xet7.</summary>

The cross-board move command took the card from the plan's board only. It
now takes it from where an earlier move of the same plan put it, saved as
fromBoard, so such a chain stays durable when every board it reaches opted
in. A server test runs A to B to C durably and with the ordinary engine, with
the same result.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/64489c5a2a">A rule's move-all onto another board can follow a move to another board</a>. Thanks to xet7.</summary>

The durable move-all took its list from the plan's board, while the ordinary
engine takes it from where the rule's card is now. It now does the same and
saves that board, so only an email keeps such a plan on direct Sync. A server
test moves a card from A to B and then all of B's list to C, both ways.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/acb2c0786a">A rule's later move, sort, move-all and archive work where its card went</a>. Thanks to xet7.</summary>

As decided on 2026-10-03, after a rule moved its card to another board, later
actions naming the rule's own board resolve their lists and swimlanes on the
board the card is on now, in both engines. This also fixes a move to "*" after
such a move, which took the new list but the old board. The durable commands
save that board, and these actions may now follow a move to another board;
an email or a second move elsewhere still keeps direct Sync. A server test
runs the chain durably and ordinarily with the same result.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/12e98cdbfe">A rule's later actions follow its card to another board</a>. Thanks to xet7.</summary>

The ordinary engine reads the card by id for every action, so actions after a
move to another board act on the card there. The durable card-field,
checklist, link and title-variable commands now do the same, recording their
writes, History and activities on that board, so such a move no longer has to
be its plan's last action. A copy refuses, as the ordinary copy does; with a
later move, sort, move-all or archive the board keeps direct Sync, since those
are resolved against the board the card left.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2df3e9a8b7">A rule's new swimlane and a move to another board are delivered durably</a>. Thanks to xet7.</summary>

Durable delivery identified every activity by a card and a list, so a rule's
createSwimlane and a cross-board move's moveCardBoard were written once but
delivered the ordinary way, and their notifications and webhooks were not
replayed after a crash. Activities without a list, and without a card, now
take the durable path; recipients and webhook senders are checked against the
board, plus the card when one is named, and an assigned-only member never
receives a board-level event.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b3b4962414">Rule moves to the top or bottom of the card's own list are durable</a>. Thanks to xet7.</summary>

A saved command computes the sort once, as the ordinary action does, writes it
conditionally, and writes the hook's position History row and the legacy
UserPositionHistory row Ctrl+Z reads once, clearing the redo stack as
trackChange does. Moves to another list or swimlane followed in the entry below.
Tests: tests/syncRuleMoveCommand.test.cjs and a server test of a
real rule with replay.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/21d7848d47">Rule checklist creation and removal are durable</a>. Thanks to xet7.</summary>

addChecklist inserts a checklist whose id is derived from the rule invocation
and records the hook's activity and History lifecycle row from the stored
document, once. removeChecklist saves every checklist the ordinary selector
matches and, per checklist, writes the activity before the removal and the
History row after it, refusing a checklist changed since capture. Tests:
tests/syncRuleChecklistLifecycleCommand.test.cjs and a server test of both
rules with replay.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d69cde2ecf">Adding a checklist with items is durable</a>. Thanks to xet7.</summary>

The checklist and one item per comma-separated title are inserted once under
ids derived from the rule invocation. The checklist's activity and History row,
then each item's addChecklistItem activity and row, are recorded from the stored
documents in the order the hooks write them. Tests: the command's unit tests and
a server test with replay.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d8c904b94a">Sorting a list by rule is durable</a>. Thanks to xet7.</summary>

The order is decided once, by sort keys now shared with the ordinary action
(models/lib/ruleSortList.js), and each card whose sort changes is written
conditionally with the hook's position History row. Tests:
tests/syncRuleSortListCommand.test.cjs and a server test with replay.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d2629161fe">Creating a card by rule is durable</a>. Thanks to xet7.</summary>

The target and title are resolved once by RulesHelper.createCardTarget, which
the ordinary action uses too. The new card's id is derived from the invocation,
so a replay inserts it once, and the creation activity saved with the command
is delivered durably, running the new card's own rules. Tests:
tests/syncRuleCreateCardCommand.test.cjs and a server test with replay.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9cc42caac9">Rule moves to another list or swimlane, and moving all cards of a list, are durable</a>. Thanks to xet7.</summary>

As decided on 2026-10-02, the rule stage's guard now accepts the card where a
saved move of the SAME rule plan put it, so the rule's later actions act on the
moved card once; a move by anything else still refuses them. Each move saves
Card.move's effects: the changed fields with lastMoveReason reset, the position
History row, the legacy undo row, the attachments' placement and the moveCard
activity, which runs the board's rules for the moved card. moveAllCardsInList
saves one unit per card of the list. A move to another board keeps the board on
direct Sync. Tests: tests/syncRuleMoveCommand.test.cjs and server tests of a
two-action rule that moves its card and colours it there, a foreign move the
guard refuses, and a move-all that includes the rule's own card.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/22311feaf4">Copying a card by rule on its own board is durable</a>. Thanks to xet7.</summary>

What the copy contains is decided once with Card.copy's own helpers: the card,
its live attachments, checklists and items, subtasks with their checklists, and
comments, each under an id derived from the rule invocation so a replay inserts
it once. Each attachment file is copied once and the cover is remapped to the
copy. The creation activities are delivered durably, and the ordinary copy's
chain guard holds. Tests: tests/syncRuleCopyCardCommand.test.cjs and a server
test that replays a copy and compares it with the ordinary Card.copy.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/044454e6d0">Linking a card by rule on its own board is durable</a>. Thanks to xet7.</summary>

The linked card is built once as Card.link builds it, under an id derived from
the rule invocation, and its creation activity is delivered durably. The target
comes from RulesHelper.linkCardTarget, which the ordinary action uses too.
Tests: tests/syncRuleLinkCardCommand.test.cjs and a server test with replay.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4764b8aa42">Adding a swimlane by rule is durable</a>. Thanks to xet7.</summary>

The title is resolved once, and the swimlane and its createSwimlane activity
are each written once under ids derived from the rule invocation. The activity
has no card, so it is delivered the way every board-level activity is. Tests:
tests/syncRuleAddSwimlaneCommand.test.cjs and a server test with replay.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ab611bcd79">Rule links to another board are durable when both boards opted in</a>. Thanks to xet7.</summary>

As decided on 2026-10-02, a linkCard rule onto another board keeps durable Sync
only when that board has Sync effects enabled and the actor may write there.
Eligibility follows every board such rules reach, because the link's creation
activity runs that board's own rules through the same stored stages, and the
runner checks the destination again before each write. A card-field rule
acting on a linked card now writes the card it links to, as the ordinary
setters do through getRealId; before, a durable link followed by such a rule
would have failed its Sync run on every replay. Tests: the link, closure and
card-field command suites, a server test with the destination's own rule and
the opt-out negatives, and
[a whole Sync run](https://github.com/wekan/wekan/commit/151e31f8d7).

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/52a2ed7386">Rule copies to another board are durable when both boards opted in</a>. Thanks to xet7.</summary>

The same saved copy command, with that board as its target: labels by name,
custom fields as Card.copy maps them, that board's card number and the
dependencies that stay on it; checklists, items, subtasks, comments and
attachments all land there. The server test compares the result with the
ordinary Card.copy and checks that a destination that opted out is refused
before anything is copied.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/32d1abeffe">Rule moves to another board are durable when both boards opted in, as the plan's last action</a>. Thanks to xet7.</summary>

The saved command holds Card.move's whole move there - labels by name, the next
card number, mapped custom fields, that board's members, no dependencies - and
writes every hook record from it once: History rows, the legacy undo row,
re-homed checklists, the dependencies left behind, attachments, re-pointed
label activities, the moveCardBoard and custom-field activities. Other durable
commands act on the card on the plan's board, so the move must end its rule
plan: eligibility checks that statically and the command again at run time.
The activity's notifications and webhooks now judge recipients on the card as
placed for the activity; before, they refused any card a rule had moved, also
on its own board, whenever it had a watcher or a webhook. Tests:
tests/syncRuleMoveBoardCommand.test.cjs, a server test with parity against the
ordinary Card.move, and a whole Sync run with a list watcher.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b09eaaa4d0">Moving all cards of a list to another board is durable too</a>. Thanks to xet7.</summary>

One unit per card, each a whole move there with its own records; each card keeps
its sort and lands in that board's default swimlane, as in the ordinary action.
Tests: the command suite and a server test with replay and parity.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4f4de145b1">GitLab's weight or time estimate syncs into a numeric field</a>. Thanks to xet7.</summary>

The Sync settings choose GitLab's weight, in points, or its time estimate, in
hours, and any numeric custom field on the board to hold it, as Jira's
estimates already could. An issue without a weight clears the value; local
changes are reviewed as conflicts; the durable journal accepts the mapping.
GitHub, Gitea and Forgejo issues have no estimate to sync. Tests:
tests/listSyncEstimate.test.cjs and server tests on the direct and durable
paths.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/307bad3e8e">Saving Sync settings gives an old list its lifetime, so it can use durable Sync</a>. Thanks to xet7.</summary>

A list created before list lifetimes had no incarnation and stayed on direct
Sync for good. As decided on 2026-10-02, saving its Sync settings assigns one
in the same list update that selects the new credential, and the credential is
bound to it. No migration assigns it, so an upgrade leaves every stored
credential matching. Tests: the real-database integration suite (23 pass), a
server test that the saved list becomes eligible for durable Sync, and a guard
that nothing else writes the field on an existing list.

</details>

**Backup** - every change streamed as it happens, restorable to a moment.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1646889aff">Docker Compose FerretDB keeps an oplog, so continuous backup streams the database</a>. Thanks to xet7.</summary>

As decided on 2026-10-03. The Compose files run FerretDB in its own
container, where the SQLite file is out of reach, so only files were streamed
there. FerretDB now starts with `--repl-set-name=rs0`, and WeKan connects with
`directConnection=true`, because FerretDB advertises its listen address
`0.0.0.0`. WeKan itself still polls. The oplog engine had asked for
`noCursorTimeout`, which FerretDB refuses, and now does not; the integration
tests pass against FerretDB. Recording dropped collections is fixed in
[wekan/FerretDB](https://github.com/wekan/FerretDB/commit/3b111eac) for its next
release.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5ef5757c71">Continuous backup encrypts at rest, uploads to the cloud and applies a SQLite restore on restart</a>. Thanks to xet7.</summary>

As decided on 2026-10-03. Encrypt seals segments, bases, blobs and state with
AES-256-GCM and a key file the administrator holds outside the backup; a wrong
key is refused on save and before a restore, and blob names are keyed. Upload
mirrors the target to S3/MinIO, Azure or GCS with the Attachments storages'
credentials, contents before the indexes that name them, and Fetch from cloud
fills a lost target. A rebuilt SQLite file can be staged with the startup
scripts' RESTORE_REQUESTED marker, which keeps the live database first. Tests:
unit, encrypted integration, each startup script's real restore block in a
sandbox, and the pane in Chromium and WebKit.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/6b9bc496b1">Admin Panel / Attachments / Continuous backup streams the database, files and logs</a>. Thanks to xet7.</summary>

Beside Backup, a new pane streams the database, filesystem attachments,
avatars and logs to a target directory within seconds, and restores them to a
chosen moment. Its built-in engines are copyfree - WeKan's own code, Node.js
and node:sqlite - and start no other program: an oplog engine on a MongoDB
replica set or FerretDB with its oplog, a SQLite page engine storing only
changed pages, and file streams by watching and rescans. Litestream is an
optional engine for SQLite that WeKan supervises. A restore checks every
segment and blob before it writes anything. Site administrators only.
Design: [Continuous backup](docs/Backup/Continuous-Backup.md). Tests: unit,
real-database integration, server-method and Chromium/WebKit UI tests.

</details>

and fixes the following bugs:

**Custom fields** - what a date field says about itself.

- [A date custom field's tooltip names the field instead of saying "Starts on"](https://github.com/wekan/wekan/commit/a69b214ba3)
  ([#6737](https://github.com/wekan/wekan/issues/6737)). Thanks to rmb82 and xet7.

**Snap** - limits Caddy keeps across restarts and refreshes.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1173d0a51d">Caddy raises its own open-file limit at every start</a>. Thanks to xet7.</summary>

snapcraft has no per-app ulimit key and snapd owns the systemd unit, but a
process may raise its own soft limit up to the hard one. The snap's Caddy
service now does that before starting Caddy
([#6552](https://github.com/wekan/wekan/issues/6552)). CADDY_NOFILE may ask for
less; it is capped at the hard limit, a non-number is ignored, and a failure is
logged without stopping Caddy. tests/snapCaddyNofile6552.test.cjs runs the
helper with a lowered limit; it has not been run inside an installed snap.

</details>

**LDAP** - what LDAP logging shows in production.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/66925f0bde">Its diagnostics print in production when LDAP logging is on</a>. Thanks to rholighaus and xet7.</summary>

They went to Meteor's Log.debug, which never prints when Meteor.isProduction,
so the snap and every bundle showed none of them
([#6548](https://github.com/wekan/wekan/issues/6548)). They now go through the
LDAP logger, which prints when LDAP_LOG_ENABLED is true and redacts secrets, as
objects. A failed bind logs the DN and the directory's own answer, never the
password. Test: tests/ldapDiagnostics6548.test.cjs.

</details>

**Scrum** - what a card or swimlane keeps when it changes board.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e657dfb7e9">A moved card or swimlane no longer points at the old board's sprint and release</a>. Thanks to xet7.</summary>

A move kept the sprint, past sprints, release and rank of the board left,
pointing at records on another board, while a copy dropped them. Server hooks
now handle moves the same way, whoever moves - the client, REST or a rule -
since Scrum fields are not the client's to write. Tests: a server test, and
the browser's cross-board move in
tests/playwright/specs/03-cards-operations.e2e.js.

</details>

**List Sync** - runs whose rules move cards, cards that change board, and an
address the guard refuses.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d82a54944a">A durable Sync run finishes when its rule moved or archived the card it synced</a>. Thanks to xet7.</summary>

A step's rules run after its card write, so the card could match neither of
the step's states. A replay after an interruption retried the write and failed
on every replay; it now treats a stored planned activity as proof of the write
and finishes the idempotent effects. And every run whose durable rule moved the
card out of the list failed in the notification and webhook stages, which now
accept the card where the activity's own rules moved it, and nowhere else. A
failed replay now logs why. Tests: tests/syncOperationApply.test.cjs and a
server test that crashes a Sync run after a rule moved the card and replays it.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/8cdf993085">A card moved to another board keeps its label activities</a>. Thanks to xet7.</summary>

The hook that re-points a moved card's addedLabel activities at the new
board's labels ran twice per update, and the second run deleted everything the
first had re-pointed. It runs once now. Tests: a server test of Card.move
across boards and a guard that nothing calls it twice.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/988d351c32">A refused Sync address is recorded once and no longer disables the member who previewed it</a>. Thanks to xet7.</summary>

Previewing a Sync source saved with an internal host name before the SyncBleed
fix was recorded twice: as SyncBleed (medium) and as DnsBleed (high) by the
shared fetch guard, and the high one disabled the account of the member who
pressed preview and logged them out. fetchSafe now takes recordBlocked: false
for a caller that records the refusal under its own name; the request is
refused all the same and every other caller still records DnsBleed. Tests:
tests/syncBleed.test.cjs pins the option, its default and that only List Sync
turns it off; the Playwright SyncBleed test checks the member stays logged in.

</details>

and has the following developer-facing changes:

**Tests and the backlog** - guards that follow the decisions above.

- [The #4912 guards pin the opt-in act-editCard choice](https://github.com/wekan/wekan/commit/5a9bd80ed6). Thanks to xet7.
- [TODO Later records the maintainer decisions of 2026-10-02](https://github.com/wekan/wekan/commit/34b1879d6f). Thanks to xet7.
- [The RTL, issue-type and source-audit guards follow the Board Settings / Card work](https://github.com/wekan/wekan/commit/999819e63e). Thanks to xet7.
- [The groundwork for rule moves to another board](https://github.com/wekan/wekan/commit/e108bb83b0). Thanks to xet7.
- [The LinkedWriteBleed VM test loads every exported function](https://github.com/wekan/wekan/commit/73df81bc6c). Thanks to xet7.
- [The applyListWidth test has a writing member and a read-only negative](https://github.com/wekan/wekan/commit/30f57cf837). Thanks to xet7.

and improves translation regression checks:

<details>
<summary><a href="https://github.com/wekan/wekan/commit/225d875b09">Preserve completed translations as new features add strings</a>. Thanks to xet7.</summary>

Synchronize locale key sets with English without replacing existing
translations. Historical completion assertions now check the 2,417-string
source catalog from September 6; new strings remain visible in the normal
translation work report. Full current-catalog key, placeholder and
feature-specific assertions remain. Positive and negative CLI tests verify
regression detection and backlog visibility.
The 222 existing translation and i18n suites passed across the rerun and focused
fix verification, along with the new catalog regression suite and all 21 human
translation preservation checks. These catalog checks require no running UI.
Newer feature translations remain unfinished; passing the regression gate does
not certify their completeness or language quality.

</details>

and updates the following translations:

**Translations** - Organization-domain requests and card-edit activity.

**Languages updated:** Acehnese, Afrikaans, Akan, Albanian, Amharic, Arabic, Aragonese, Armenian, Aromanian, Assamese, Asturian, Aymara, Azerbaijani, Bambara, Bangla, Bashkir, Basque, Belarusian, Bhojpuri, Bislama, Bosnian, Breton, Bulgarian, Buriat, Burmese, Cantonese, Catalan, Central Kurdish, Cherokee, Chinese, Chuvash, Cornish, Corsican, Croatian, Czech, Danish, Dutch, Dzongkha, Esperanto, Estonian, Ewe, Faroese, Fijian, Finnish, Flemish, French, Friulian, Fula, Galician, Ganda, Georgian, German, Greek, Guarani, Gujarati, Haitian Creole, Hausa, Hawaiian, Hebrew, Hindi, Hungarian, Icelandic, Igbo, Indonesian, Inuktitut, Irish, Italian, Japanese, Javanese, Kalaallisut, Kannada, Kashmiri, Kashubian, Kazakh, Khmer, Kinyarwanda, Klingon, Konkani, Korean, Kurdish, Kyrgyz, Ladin, Latin, Latvian, Lithuanian, Luxembourgish, Macedonian, Maithili, Malagasy, Malay, Malayalam, Maltese, Mandarin Chinese, Manx, Marathi, Mongolian, Moroccan Arabic, Māori, Nahuatl, Neapolitan, Nepali, North Ndebele, Northern Sami, Northern Sotho, Norwegian Bokmål, Nyanja, Occitan, Odia, Oromo, Papiamento, Pashto, Persian, Polish, Portuguese, Punjabi, Quechua, Romanian, Romansh, Rundi, Russian, Samoan, Sardinian, Scottish Gaelic, Serbian, Shona, Sicilian, Silesian, Sindhi, Sinhala, Slovak, Slovenian, Somali, Southern Sotho, Spanish, Standard Moroccan Tamazight, Swahili, Swati, Swedish, Tagalog, Tajik, Tamil, Tatar, Telugu, Thai, Tibetan, Tigre, Tigrinya, Tok Pisin, Tongan, Tsonga, Tswana, Turkish, Turkmen, Ukrainian, Upper Sorbian, Urdu, Uyghur, Uzbek, Venda, Venetian, Veps, Vietnamese, Volapük, Walloon, Waray, Welsh, Western Frisian, Wolaytta, Wolof, Wu Chinese, Xhosa, Yakut, Yiddish, Yoruba, Zulu.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/054ba53c8d">Translate domain requests and card edits in every locale</a>. Thanks to xet7.</summary>

Fill the request status, saved request, reserved installation-domain refusal and
card-edit activity messages in all 234 non-English locales. Keep organization
requests distinct from site-administrator assignment and preserve the card
token. Existing translations are retained, and English variants keep source
wording. The four finished keys leave the pending list. Newly added feature keys
are also synchronized in source order as English placeholders for the next
batches.

All 224 translation and i18n suites pass, including the new all-locale checks,
script and wrong-language-seed checks. These tests do not establish fluency.
Low-confidence specialist wording, especially minority and constructed
languages, is recorded with vocabulary sources in
[the translation review notes](docs/Features/Translations/Domain-Request-Translation-Review.md).
The broader translation backlog remains open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/49c078c0e0">Translate feature visibility settings in ninety locales</a>. Thanks to xet7.</summary>

Translate all 24 optional-feature labels, explanations, approval controls and
pilot-user notices in ninety locales. Keep the distinction between hiding a
feature and removing its data or changing permissions. Regional Portuguese and
Chinese wording is retained, and administrator previews remain distinct from
pilot-user access. Other locales still need these strings translated.

The 225 translation and i18n suites passed before the final locale extension;
the expanded feature suite and full-catalog completeness checks passed
afterward. The new Taskwarrior import key is synchronized in source order as an
English placeholder for subsequent translation. Existing translations are
preserved.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/559acf0e4d">Repair the remaining translation regression checks</a>. Thanks to xet7.</summary>

Restore established Tigre file and card terminology in six newer messages and
refresh the README count to 164 essentially complete locales. Historical Swedish
and multilingual completion checks now use the completed source catalog, while
ordinary listings keep all new work visible. Behavioral tests verify pending-key
reporting instead of matching the implementation expression.

All 447 translation-related Node suites pass, including terminology,
placeholder, language wiring and Transifex checks found beyond the
translation-named suites. The untranslated backlog remains open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/685edac65f">Extend feature visibility translations to Hebrew, Persian, Hindi, Bengali, Tamil and Thai</a>. Thanks to xet7.</summary>

Translate the 24 feature-setting messages in nine more locales, bringing this
batch to 99 locales. Preserve the explanations that hiding a feature retains its
data and does not change permissions. The expanded feature regression suite,
full-catalog key and token checks, and language-count checks pass.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/28cc090d4a">Translate feature settings in Icelandic, Irish, Welsh and Luxembourgish</a>. Thanks to xet7.</summary>

The 24 feature-setting messages now cover 104 locales. Add these five locale
variants while preserving existing translations. The expanded feature suite,
full-catalog key and token checks, and README language-count checks pass.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/32798ce3a1">Translate feature settings in fifteen more locales</a>. Thanks to xet7.</summary>

Add the 24 optional-feature messages in Georgian, Armenian, three Azerbaijani
variants, Swahili, Tagalog, Urdu, Nepali, Kannada, Gujarati, Marathi, Malayalam,
Telugu and Punjabi. Feature coverage reaches 119 locales. Extend native-script
checks and the assertions that data is retained and permissions do not change.
All 447 translation-related Node suites pass.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/226f9bc20c">Translate feature settings in Scottish Gaelic, Maltese and Occitan</a>. Thanks to xet7.</summary>

Add 72 translations, bringing feature-setting coverage to 122 locales. The
feature suite, full-catalog token and key checks, and README language count
pass. Specialist flow-metric wording in these three languages has lower
confidence and remains open to native review; structural tests do not establish
fluency. Vocabulary references include Scottish Gaelic
[feart](https://www.faclair.com/?txtSearch=feart) and
[cead](https://www.faclair.com/?txtSearch=cead), Maltese
[permess](https://glosbe.com/en/mt/permission), and Occitan
[autorizacions](https://oc.wiktionary.org/wiki/autorizacions), alongside the
existing locale catalogs. Remaining locales and older strings are still pending.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/459e313cf8">Synchronize the drag-to-reorder instruction in every locale</a>. Thanks to xet7.</summary>

Add the new keyboard and pointer instruction in source order in 243 locale
catalogs. It remains an English placeholder pending translation. Full-catalog
key and token checks, feature translations and language-count checks pass.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/beef55a363">Translate feature settings in seven more languages</a>. Thanks to xet7.</summary>

Add 168 messages in Javanese, Haitian Creole, Latin, Hausa, Shona, Yoruba and
Igbo, bringing coverage to 129 locales. Replace the mixed English/Latin feature
heading with Latin and test against language-prefix filler in the new messages.
Existing older mixed Latin entries still require a separate vocabulary audit;
the missing-English count does not identify all wrong-language prose.

Specialist flow-metric wording in Latin, Hausa, Shona, Yoruba and Igbo has lower
confidence. Permission vocabulary was checked against
[HausaDictionary](https://www.hausadictionary.com/permission),
[Vashona](https://vashona.com/en/dictionary/en/permission),
[Yoruba Wiktionary data](https://kaikki.org/dictionary/Yoruba/meaning/y/y%E1%BB%8D/y%E1%BB%8Dnda.html), and
[Nkọwa okwu](https://nkowaokwu.com/word?word=ikike).
The feature suite, full-catalog key and token checks, and README count pass.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/45d3a7cadb">Translate feature settings in Corsican, Aragonese and Asturian</a>. Thanks to xet7.</summary>

Add 72 messages, bringing feature-setting coverage to 132 locales. Follow the
existing board and card terminology. Specialist flow-metric wording remains
lower confidence and open to native review. All 447 translation-related Node
suites pass after this batch.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/15130a0e47">Translate feature settings in fourteen more locales and add card-setting labels</a>. Thanks to xet7.</summary>

Add 336 feature-setting translations in Kazakh, Kyrgyz, Tajik, Mongolian, four
Uzbek variants, Bashkir, Tatar, Turkmen, Uyghur, Central Kurdish and Northern
Kurdish. Feature-setting coverage reaches 146 locales. Add the three new card
setting labels in these locales, correct the Arabic Uzbek linked-card label,
and synchronize the new source keys in every other catalog as placeholders.
Existing translations are retained. Native-script and vocabulary checks separate
Mongolian from Russian, Bashkir from Tatar, and the Uzbek and Kurdish scripts.

Specialist flow-metric wording, especially Arabic Uzbek, Bashkir, Tatar,
Turkmen,
Uyghur and Kurdish, has lower confidence and remains open to native review.
Vocabulary references include the
[Mongolian dictionary](https://mongoltoli.mn/dictionary/detail/48338),
[Kyrgyz dictionary](https://tamgasoft.kg/dict/index.php?lang=en&lfrom=kg&word=%D1%83%D1%80%D1%83%D0%BA%D1%81%D0%B0%D1%82),
[Turkmen dictionary](https://www.webonary.org/turkmen/files/sozluk.pdf), and
[Bashkir dictionary](https://tarat.ru/ru/targema/dictionary/t9/558), alongside
existing locale vocabulary. All 448 translation-related Node suites pass,
including
the new card-setting label regression suite. The broader translation backlog
remains open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3d333b8859">Translate feature settings in fifteen more locale variants</a>. Thanks to xet7.</summary>

Add 336 stored translations for Amharic, Assamese, Odia, Sinhala, Pashto,
Sindhi,
three Khmer tags, Burmese, Faroese, two Western Frisian tags, Friulian and
Romansh.
Feature-setting coverage reaches 161 locales. All 448 translation-related Node
suites pass. Extend native-script checks and the
explicit assurances that hiding a feature keeps its data and permissions.

Specialist flow-metric wording in this batch, especially Faroese, Frisian,
Friulian, Romansh and Odia, has lower confidence and remains open to native
review.
Vocabulary references include
[Amharic](https://dictionary.abyssinica.com/permission),
[Odia](https://www.shabdkosh.com/dictionary/english-odia/permission/permission-meaning-in-odia),
[Sinhala](https://www.maduraonline.com/?find=permission), and
[Faroese](https://en.wiktionary.org/wiki/loyvi) dictionaries, along with the
existing catalogs. Remaining translations are still pending.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9ee5a1f955">Translate card-setting labels in fifteen more locale variants</a>. Thanks to xet7.</summary>

The three new labels now cover 29 locales. Add 42 stored translations and retain
existing linked-card wording where correct. Remove the extra separator in Odia,
replace Italian wording with Friulian and Romansh, and cover these corrections
with negative regression checks. Six focused catalog and language suites pass.
The full 448-suite run passed immediately before this card-label extension.
Vocabulary references for the corrected forms include
[Friulian usage](https://dizionarifurlan.eu/headword/organiz%C3%A2) and
[Romansh usage](https://www.gr.ch/RM/instituziuns/administraziun/dfg/ds/stabdv/gemeinden/Seiten/koordinationsstelle.aspx).

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/32ea3767c6">Translate feature and card settings in ten more languages</a>. Thanks to xet7.</summary>

Add 240 feature-setting messages and 30 card labels in Sardinian, Sicilian,
Neapolitan, Papiamentu, Somali, Malagasy, Kinyarwanda, Rundi, Nyanja and Oromo.
Feature-setting coverage reaches 171 locales, and the new card labels cover 39.
Keep Rundi and Kinyarwanda wording distinct. Replace the Italian and Spanish
linked-card wording in Sicilian and Papiamentu and guard against its return.
All 448 translation-related Node suites pass, including placeholders and source
order.

Specialist flow-metric terminology in these ten languages has lower confidence
and remains open to native review. References include
[Sicilian vocabulary](https://scn.wiktionary.org/wiki/ammucciari),
[Papiamentu vocabulary](https://kaikki.org/frwiktionary/Papiamento/meaning/k/ko/konekt%C3%A1.html),
[Malagasy administrative terminology](https://www.mef.gov.mg/dgcf/info%20utiles/rakibolana-dikan-teny-vf-vm.pdf), and
[Kinyarwanda vocabulary](https://glosbe.com/en/rw/permission), alongside the
existing catalogs. The broader translation backlog remains open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/aa663f2d1f">Translate feature and card settings in Zulu and Xhosa</a>. Thanks to xet7.</summary>

Add 81 messages across the two Zulu tags and Xhosa. Feature settings now cover
174 locales and card-setting labels cover 42. Keep the languages' vocabulary
distinct and preserve the assurances about data retention and permissions.
The focused feature, card-label, full-catalog key and token, and language-count
suites pass. Specialist flow-metric wording has lower confidence and remains
open to native review. Permission vocabulary was checked against
[Zulu](https://kaikki.org/dictionary/Zulu/meaning/i/im/imvume.html) and
[Xhosa](https://isixhosa.click/word/741) dictionary entries.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/fcea5ff4e8">Translate feature and card settings in five southern African languages</a>. Thanks to xet7.</summary>

Add 135 messages in Sesotho, Setswana, Northern Sotho, Swati and Northern
Ndebele, and replace a mixed English/Setswana feature heading. Feature settings
now cover 179 locale tags and the three card-setting labels cover 47. All 448
translation-related Node suites pass, including current key order, placeholder
inventories, data-retention wording and established linked-card terminology.
Specialist flow-metric wording has lower confidence and remains open to native
review. Permission vocabulary was checked against
[Setswana](https://glosbe.com/en/tn/permission),
[Northern Sotho](https://glosbe.com/en/nso/permission),
[Sesotho](https://sesotho.net/Dictionary),
[Swati archival terminology](https://digilibrary.unisa.ac.za/digital/api/collection/p21049coll258/id/8/download)
and [Northern Ndebele lexicography](https://ir.uz.ac.zw/bitstream/handle/10646/549/Hadebe.pdf?isAllowed=y&sequence=2).
The remaining translation queue and older wrong-language values still need work.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d74cf9d6b4">Translate feature and card settings in seven African languages</a>. Thanks to xet7.</summary>

Add 189 messages in Akan, Bambara, Ewe, Luganda, Tsonga, Venda and Wolof.
Feature settings now cover 186 locale tags and the three card-setting labels
cover 54. Correct mixed-language headings and linked-card labels, and replace
eight Zulu labels in Venda. All 19 selected regression suites pass, including
current catalog keys and placeholders and the affected language suites.
The full 448-suite translation run passed before this batch.
Specialist flow-metric wording has lower confidence and remains open to native
review. Vocabulary references included
[Akan](https://www.akandictionary.com/2021/04/21/kwan/),
[Bambara](https://dictionary.ankataa.com/lexicon.php?letter=28),
[Ewe](https://philtypo3.uni-koeln.de/sites/inst_afrika/pdf/BASIC_EWE_2nd_ed.pdf),
[Luganda](https://glosbe.com/lg/en/olukusa),
[Tsonga](https://www.gov.za/ts/services/services-residents/parenting/adopt-child/mpfumelelo-wo-wundla),
[Venda](https://sadilar.org/wp-content/uploads/2023/12/Tshivenda_Newsletter_Sept_2023.pdf)
and [Wolof](https://wolofresources.org/language/download/lexicarry_plus.pdf).
The remaining translation queue and older wrong-language text still need work.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a8aa574539">Translate feature and card settings in six Celtic and Slavic languages</a>. Thanks to xet7.</summary>

Add 162 messages in Breton, Cornish, Manx, Kashubian, Upper Sorbian and
Silesian. Feature settings now cover 192 locale tags and the three card-setting
labels cover 60. Correct Breton's linked-card label, which meant “found card”,
and replace Czech-seeded Upper Sorbian labels. All 12 selected translation and
catalog suites pass. Specialist flow-metric wording has lower confidence and
remains open to native review. Vocabulary references included
[Breton](https://fr.glosbe.com/br/fr/aotre),
[Cornish](https://www.cornishdictionary.org.uk/sites/default/files/GerlyverPDF_20190723.pdf)
and [Manx](https://glosbe.com/en/gv/permission) dictionaries.
The remaining translation queue and older wrong-language text still need work.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2b73ca192a">Translate feature and card settings in five Pacific languages</a>. Thanks to xet7.</summary>

Add 135 messages in Bislama, Tok Pisin, Māori, Samoan and Tongan. Feature
settings now cover 197 locale tags and the three card-setting labels cover 65.
Replace mixed-English feature headings and linked-card labels. All eight
selected catalog and language suites pass, including current key order,
placeholder inventories and data-retention wording. Specialist workflow
terminology has lower confidence and remains open to native review.
Vocabulary references included
[Tok Pisin](https://tokpisin.info/approval/),
[Māori](https://maoridictionary.co.nz/search?keywords=whakaaetanga)
and [Tongan](https://www.pasifikapages.net/wp-content/uploads/2023/01/eald-bilingual-dictionary-tongan.pdf).
The remaining translation queue and older wrong-language text still need work.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d3ce9d0b4c">Translate feature and card settings in Hawaiian, Fijian, Venetian and Walloon</a>. Thanks to xet7.</summary>

Add 108 messages across four languages. Feature settings now cover 201 locale
tags and the three card-setting labels cover 69. Correct malformed Hawaiian
labels and Italian-seeded Venetian linked-card text. All 448 translation-related
Node suites pass after the Hawaiian and Fijian changes; all ten selected suites
pass with Venetian and Walloon included. Specialist workflow terminology has
lower confidence and remains open to native review. Vocabulary references
included [Hawaiian](https://wehe.hilo.hawaii.edu/?q=a%CA%BBe),
[Fijian](https://folksong.org.nz/isa_lei/Fijian-English_Dictionary.pdf)
and [Walloon](https://wa.wiktionary.org/wiki/aveur_li_droet) dictionaries.
The remaining translation queue and older wrong-language text still need work.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/45f1e653bc">Translate feature and card settings in five more languages</a>. Thanks to xet7.</summary>

Add 135 messages in Ladin, Aromanian, Cantonese, Wu Chinese and Yiddish.
Feature settings now cover 206 locale tags and the three card-setting labels
cover 74. Correct Ladin linked-card terminology and the Cantonese and Wu Save
buttons. Refresh the README's measured completion count from 164 to 165 so the
language-count regression passes. All nine selected catalog and language suites
and three additional Chinese suites pass. Specialist workflow terminology,
particularly Ladin and Aromanian, has lower confidence and remains open to
native review. References included the
[Aromanian dictionary](https://vivliuteca.org/wp-content/uploads/2025/06/dictsiunararmanescu_dec2008.pdf)
and [Yiddish vocabulary](https://www.wcb.ny.gov/content/main/forms/rb89_2_Y.pdf).
The remaining translation queue and older wrong-language text still need work.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/13ec2c2149">Translate feature and card settings in five Asian languages</a>. Thanks to xet7.</summary>

Add 135 messages in Buryat, Chuvash, Sakha, Bhojpuri and Maithili. Feature
settings now cover 211 locale tags and the three card-setting labels cover 79.
Align Buryat linked-card wording with the existing card terminology. All eight
selected translation and catalog suites pass, including script, current key
order, placeholder and data-retention checks. Specialist workflow wording,
particularly Buryat, Chuvash and Sakha, has lower confidence and remains open to
native review. Permission vocabulary was checked against
[Chuvash](https://ru.samah.chv.su/s/7/%D1%80%D0%B0%D0%B7%D1%80%D0%B5%D1%88%D0%B5%D0%BD%D0%B8%D0%B5)
and [Sakha](https://sakhatyla.ru/translate?q=%D0%BA%D3%A9%D2%A5%D2%AF%D0%BB%D0%BB%D1%8D%D1%8D)
dictionaries. The remaining translation queue and older wrong-language text
still need work.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3c5c2d8a8e">Translate feature and card settings in four more languages</a>. Thanks to xet7.</summary>

Add 108 messages in Konkani, Moroccan Arabic, Acehnese and Waray. Feature
settings now cover 215 locale tags and the three card-setting labels cover 83.
Replace French board and card labels in Waray and Malay linked-card wording in
Acehnese. All six selected catalog and language suites pass, including current
key order, placeholder inventories, script and data-retention checks.
Specialist workflow descriptions, particularly Acehnese, have lower confidence
and remain open to native review. Vocabulary references included the
[Acehnese thesaurus](https://openresearch-repository.anu.edu.au/server/api/core/bitstreams/a9fa3ff5-837d-40db-a316-81bbe13d3bf4/content)
and [Waray permission vocabulary](https://acd.clld.org/cognatesets/30959).
The remaining translation queue and older wrong-language text still need work.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/98845f6251">Translate feature and card settings in Northern Sámi, Veps and Tibetan</a>. Thanks to xet7.</summary>

Add 81 messages across three languages. Feature settings now cover 218 locale
tags and the three card-setting labels cover 86. All 448 translation-related
Node suites pass after Northern Sámi and Veps; all eleven selected suites pass
with Tibetan included. Specialist workflow wording, especially Veps, has lower
confidence and remains open to native review. Structural and selected wording
checks do not establish fluency. References included
[Northern Sámi vocabulary](https://kaikki.org/dictionary/All%20languages%20combined/meaning/l/lo/lohpi.html),
[the Veps dictionary](https://vepsnoid.blogspot.com/p/dictionary.html)
and [Tibetan terminology](https://linguatools.info/?page=191&per_page=10).
The remaining translation queue and older wrong-language text still need work.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3bf26c910d">Translate feature and card settings in Dzongkha and Tigrinya</a>. Thanks to xet7.</summary>

Add 54 messages in Dzongkha and Tigrinya, preserving each language's existing
card terminology. Feature settings now cover 220 locale tags and the three
card-setting labels cover 88. All six selected catalog and language suites
pass, including script, data-retention wording, current keys and placeholder
inventories. Specialist workflow terminology has lower confidence and remains
open to native review. References included
[Dzongkha computer terminology](https://download-mirror.savannah.gnu.org/releases/dzongkha-gnome/dzongkha_computer_terms.pdf)
and [Tigrinya permission vocabulary](https://www.geezexperience.com/?dr=0&searchkey=permission).
The remaining translation queue and older wrong-language text still need work.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/38de237caa">Translate card-setting labels in 132 more locale tags</a>. Thanks to xet7.</summary>

Fill 393 stored English placeholders for card color, linked card and description
badge, bringing these three labels to 220 locale tags. Correct mixed-language
linked-card labels in Romanian, Corsican, Latin, Luxembourgish, Maltese, Shona,
Tagalog and Urdu while preserving existing correct-language translations.
All 448 translation-related Node suites pass, including catalog key order,
placeholder inventories and regressions for these corrected labels. Specialist
badge wording in Corsican, Latin, Shona, Hausa, Igbo and Yoruba has lower
confidence and remains open to native review. These checks do not establish
fluency. The remaining translation queue and older wrong-language text still
need work.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/04063e75c5">Translate feature and card settings in Kashmiri, Klingon and Volapük</a>. Thanks to xet7.</summary>

Fill 81 messages, bringing feature settings and the three card-setting labels
to 223 locale tags. Correct Volapük's time and board labels. Selected catalog
and language suites pass, covering key order, placeholders, visibility and
permission wording, native script and corrected terminology. Specialist
workflow wording in all three languages has lower confidence and remains open
to speaker review. Structural checks do not establish fluency. References
included [Kashmiri permission vocabulary](https://mkraina.com/wp-content/uploads/2020/05/Basic-Reader-for-Kashmiri-Language.pdf),
[the Klingon Language Institute vocabulary](https://www.kli.org/about-klingon/new-klingon-words/date/)
and [the English–Volapük dictionary](https://en.wikibooks.org/wiki/Volap%C3%BCk/English-Volap%C3%BCk_dictionary).
The remaining translation queue and older wrong-language text still need work.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/270a4599f1">Translate feature and card settings in five more languages</a>. Thanks to xet7.</summary>

Fill 135 messages in Aymara, Quechua, Guarani, Fulah and Greenlandic, bringing
feature settings and the three card-setting labels to 228 locale tags. Replace
mixed-language feature, administrator and linked-card labels in Aymara and
Quechua, and correct the Guarani board label and board-creation message.
All 448 translation-related Node suites pass after the first three languages;
eight selected catalog and language suites pass with Fulah and Greenlandic
included. Tests check key order, tokens, permissions and corrected wording.
Specialist workflow wording in all five languages has lower confidence and
remains open to speaker review. References included
[Aymara vocabulary](https://aymaraclub.com/wp-content/uploads/2024/01/LIBRO-VOCABULARIO-PEDAGOGICO-AYMARA-OK-1.pdf),
[Quechua vocabulary](https://www.illaa.org/pirwa/diccionarios/DicQuechuaBolivia.pdf),
[Guarani vocabulary](https://www.guaraniayvu.com/),
[Pulaar terminology](https://senprof.education.sn/PROGRAMME%20LECTURE%20POUR%20TOUS/documentation/Terminologies/Terminologie%20Pulaar%20fusion.pdf)
and [Greenlandic colour vocabulary](https://oqaasileriffik.gl/en/dict/?lex=52433).
The remaining translation queue and older wrong-language text still need work.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/6d2338c5a2">Complete card-setting translations and extend feature and GitLab messages</a>. Thanks to xet7.</summary>

The card color, linked card and description badge labels now have translations
in all 234 non-English locale tags. Remove these three completed keys from the
pending queue and require every non-English catalog in their regression suite.
Feature settings now cover 231 tags, with Nahuatl, Wolaytta and Inuktitut added.
Correct mixed-language Wolaytta labels and the Tigre linked-card clause; keep
its exact-value correction history safe for newer translations.

Translate the five new GitLab estimate messages in 52 locale tags. Synchronize
new GitLab and Scrum keys across catalogs, preserving their remaining English
placeholders in the work queue. Six current catalog and translation suites
pass. Eight failures found by the full 448-suite run pass after repairs against
the GitLab source snapshot; newer Scrum messages remain to be translated.
Tests check complete catalog coverage, tokens, script, permission wording and
the distinction between clearing a missing GitLab weight and ignoring a missing
Jira field.

Specialist wording in Nahuatl, Wolaytta, Cherokee, Inuktitut, Tigre and
Tamazight,
and the less widely used GitLab estimate languages, has lower confidence and
remains open to speaker review. References included
[Nahuatl colour vocabulary](https://gdn.iib.unam.mx/diccionario/tlapalli/18305),
[Wolaytta vocabulary](https://en.wikivoyage.org/wiki/Wolayttattuwa_phrasebook),
[Tigre grammar](https://www.speaktigre.com/_files/ugd/7e068a_adcb2a9df2c340898e3155ef3905c61e.pdf?index=true)
and [Irish estimate terminology](https://www.teanglann.ie/en/fgb/Meastach%C3%A1n).
The broader translation queue and older wrong-language text still need work.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b88717ceb6">Translate Scrum scope history in 52 locale tags</a>. Thanks to xet7.</summary>

Translate the eleven scope-history labels, explanations and change causes,
filling 561 stored English placeholders across 51 catalog files and 52 locale
tags. Keep missing History records distinct from a replay that stopped reading
early. Existing translations, catalog key order and placeholder inventories
are preserved. The seven affected language suites pass. The full translation-
related run passes 448 of 449 suites; the remaining History-template guard
flags the new Scrum scope chart and still needs a separate repair. Both
changelog checks pass.

Specialist wording in Corsican, Sardinian, Sicilian, Neapolitan, Aragonese,
Asturian, Breton and Kashubian has lower confidence and remains open to speaker
review. Structural checks do not establish fluency. The remaining translation
queue and older wrong-language text still need work.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/29adf8be5c">Keep the shared History guard compatible with the Scrum scope chart</a>. Thanks to xet7.</summary>

The scope-history chart is a sprint report, not another History browser. Bind
its exception to chart markup and the read-only Scrum report method. The
shared History template remains unique; negative mutation checks reject an
added table, an embedded History table, History browser calls and edit
handlers. The History guard and Scrum replay suites pass, resolving the
remaining failure from the preceding translation run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/de2ddf8a96">Translate Scrum scope history and GitLab estimates in 75 more locale tags</a>. Thanks to xet7.</summary>

Fill 1,200 English placeholders, bringing the eleven Scrum scope-history
messages and five GitLab estimate messages to 127 locale tags each. Preserve
existing translations, current catalog order and placeholder inventories.
Regression checks keep missing History records distinct from a truncated
replay, distinguish change causes and preserve the warning that a GitLab issue
without weight clears the mapped value.

All 450 translation-related Node suites pass with the first 56 added tags;
five catalog and translation suites pass with the remaining 19 included.
Specialist wording in Luxembourgish, Maltese and Latin has lower confidence
and remains open to speaker review. Structural checks do not establish
fluency. These groups still need translation in 107 locale tags, and the
broader translation queue and older wrong-language text still need work.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/790bff8392">Translate Scrum scope history and GitLab estimates in 44 more locale tags</a>. Thanks to xet7.</summary>

Fill 688 stored English placeholders across 43 catalog files, bringing both
message groups to 171 locale tags. Preserve existing translations, current
key order and placeholder inventories. Extend native-script checks, including
Arabic-script Uzbek and Yiddish, and preserve the distinct meanings of missing
History records, a truncated replay and a GitLab issue without weight clearing
the mapped value. All 450 translation-related Node suites pass with the first
36 tags added; five catalog and translation suites pass with the final eight.

Specialist wording in the less widely used languages in this batch has lower
confidence and remains open to speaker review; the commit lists them.
References included [Hausa weight vocabulary](https://hausadictionary.com/nauyi),
[Igbo vocabulary](https://www.igbotique.com/dict/ig/i%CC%81bu%CC%81),
[Turkmen vocabulary](https://www.webonary.org/turkmen/files/sozluk.pdf),
[Faroese vocabulary](https://www.oyggjar.dyndns.ws/faroese2en.php),
[Friulian spelling](https://arlef.it/en/language-and-culture/language/)
and [Romansh weight terminology](https://kaikki.org/dictionary/Romansh/meaning/p/pa/pais.html).
Structural checks do not establish fluency. These groups still need
translation in 63 locale tags, and the broader translation queue and older
wrong-language text still need work.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1cdf3af003">Translate Scrum scope history and GitLab estimates in 25 more locale tags</a>. Thanks to xet7.</summary>

Fill 400 English placeholders, bringing both message groups to 196 locale
tags. Preserve existing translations, current key order and placeholder
inventories. Add native-script checks for Bhojpuri, Maithili and Konkani and
warning-meaning checks for Māori and Zulu. Correct the Fijian estimate term
from the verb for comparing to the documented loanword, and guard against
regression. All 450 translation-related Node suites pass at 192 tags; five
catalog and translation suites pass with the final four tags and wording
corrections included.

Specialist workflow wording in the less widely used languages in this batch
has lower confidence; the commit lists them for speaker review. References
included [Bislama vocabulary](https://bislama.org/images/dictionary/BislamaSpellingDictionary-EN-BI-v1.1.pdf),
[Māori estimates](https://paekupu.co.nz/word/whakatau-tata),
[the Fijian dictionary](https://dokumen.pub/fijian-english-dictionary-with-notes-on-fijian-culture-and-natural-history-9789829804716.html),
[Hawaiian terminology](https://wehe.hilo.hawaii.edu/?q=kaumaha),
[the multilingual mathematics dictionary](https://www.dsac.gov.za/sites/default/files/2024-10/Multilingual%20Mathematics%20Dictionary%20Grade%20R%20-%206.pdf)
and [Luganda vocabulary](https://www.learnluganda.com/concise).
Structural checks do not establish fluency. These groups still need
translation in 38 locale tags, and the broader translation queue and older
wrong-language text still need work.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/78a6160e57">Translate Scrum scope history and GitLab estimates in 13 more locale tags</a>. Thanks to xet7.</summary>

Fill 208 English placeholders in Akan, Moroccan Arabic, Bashkir, Bambara,
Buryat, Chuvash, Upper Sorbian, Sakha, Silesian, Venetian, Walloon, Wolof and
Wu Chinese. Both message groups now cover 209 locale tags, with 25 still
remaining. Preserve existing translations and extend regression checks for
native vocabulary, scripts, warning meanings and exact placeholder inventories.

Synchronize four new Scrum paging and import-recovery keys across 243 locale
catalog files. Translate 48 of these new values in the Czech, Hungarian,
Russian, Slovak, Ukrainian, Estonian and Hebrew locale families. The catalog
and batch suites pass. The full run covered 450 translation-related suites:
443 passed initially, and six of the seven failures pass after these new
translations. The broad Vietnamese/Bulgarian completion suite still requires
the new Scrum messages in further languages, starting with Persian.

Specialist workflow wording in the 13-language batch has lower confidence
and needs speaker review. References included
[Upper Sorbian estimate terminology](https://www.mdr.de/serbski-program/rozhlos/recny-kucik/recnykucik-mdr-186.html),
[Walloon vocabulary](https://lucyin.walon.org/diccionairaedje/francardE.html),
[Chuvash vocabulary](https://ru.samah.chv.su/article/64791.link)
and [Wolof vocabulary](https://jangawolof.org/dictionary/).
Structural checks do not establish fluency. The broader translation queue
and older wrong-language text still need work.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0e7d39f2de">Translate Scrum paging and import recovery in 103 more locale tags</a>. Thanks to xet7.</summary>

Fill 412 English placeholders, bringing the four new messages to 116 locale
tags. Preserve existing translations and the paging count placeholder.
Keep completing a stopped import distinct from discarding an import whose
plan was not fully saved, and retain the warning that discarding it changes
nothing on the board. Add regression coverage for these meanings, exact
token inventories, native scripts and source key order.

The remaining completion-suite failure recorded above is resolved. All 451
translation-related Node suites pass at 52 locale tags; four catalog and
batch suites pass after the expansion to 116. All 21 human-preference checks
also pass. These messages still need translation in 118 locale tags; the
broader translation backlog remains.

Specialist wording in Irish, Scottish Gaelic, Breton, Kashubian, Corsican,
Sardinian, Sicilian, Neapolitan and Aragonese has lower confidence and needs
speaker review. Check Occitan restart terminology against
[the Acadèmia Occitana dictionary](https://occitanparis.com/images/stories/documents/diccionari-academia-occitana-2016.pdf)
and [its use in GNOME translations](https://mail.gnome.org/archives/commits-list/2021-December/msg11257.html).
Use the existing locale vocabulary for boards and imports. Structural tests
do not establish fluency.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c1f45e6b18">Translate Scrum paging and import recovery in 71 more locale tags</a>. Thanks to xet7.</summary>

Fill 280 English placeholders across 70 stored catalogs, bringing all four
messages to 187 locale tags. Khmer variants share a catalog. Preserve existing
translations and exact placeholder inventories, and extend regression checks
for native scripts and the distinction between completing and cancelling an
import. Use native restart wording in Romansh and Faroese, and distinguish
finishing from cancelling in Hawaiian.

All 451 translation-related Node suites and all 21 human-preference checks
pass. These four messages still need translation in 47 locale tags; the
remaining Scrum scope-history and GitLab estimate batches and the broader
translation queue also remain open.

Specialist wording in the less widely used languages has lower confidence;
the commit lists the locales needing speaker review. References included
[Romansh software vocabulary](https://android.googlesource.com/platform/frameworks/base/+/a8854b2b749482095315e79a568b6f7a1b071641/core/res/res/values-rm/strings.xml),
[Faroese usage](https://kvf.fo/Archive_Articles/2013/02/11/skotar-noyast-byrja-av-nggjum),
[Hawaiian dictionaries](https://wehe.hilo.hawaii.edu/?l=&q=stop)
and [Māori computer terminology](https://www.taiuru.co.nz/wp-content/uploads/publicationslib/Dictionary-of-Maori-Computer-related-terms-Edition-1.pdf).
Structural checks do not establish fluency.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/8e2bc58262">Translate new Scrum messages in 23 more locales and complete three estimate batches</a>. Thanks to xet7.</summary>

Fill 140 English placeholders without replacing existing translations.
Paging and import recovery now cover 210 locale tags. Manx, Cornish and
Volapük also gain the eleven scope-history and five GitLab estimate messages,
bringing those groups to 212 tags. Preserve exact placeholder inventories,
source order, distinct finish and cancel actions, and the warning that an
issue without a weight clears the mapped value. Extend script and native
vocabulary checks; Sakha refers to a stored plan rather than a confirmed one.

All 451 translation-related Node suites pass before the final Ewe and Fulah
fills; six catalog and batch suites pass with those included. All 21
human-preference checks pass. Paging and recovery still need 24 locale tags;
scope history and estimates need 22. The broader translation backlog remains.

Specialist workflow wording throughout this batch has lower confidence and
needs speaker review; the commit lists its 23 locales. References include
[the Manx dictionary](https://www.learnmanx.com/media/PDFs/PDF%20resources%202022%20onwards/English%20to%20Manx%20dictionary%20compiled%20by%20Phil%20Kelly%20Jan%202026.pdf),
[the Cornish dictionary](https://www.cornishdictionary.org.uk/sites/default/files/SWF_dictionary_20190530_final.pdf),
[Volapük dictionaries](https://volapuk.temerov.org/Volap%C3%BCkanef/Lingl%C3%A4nap%C3%BCk/v%C3%B6dabuks.php),
[Sakha storage terminology](https://sakhatyla.ru/translate?q=%D1%85%D0%B0%D1%80%D0%B0%D0%BB%D1%8B%D0%BD%3D),
[the Ewe grammar](https://philtypo3.uni-koeln.de/sites/inst_afrika/pdf/BASIC_EWE_2nd_ed.pdf)
and [Pulaar teaching terminology](https://senprof.education.sn/PROGRAMME%20LECTURE%20POUR%20TOUS/documentation/Terminologies/Terminologie%20Pulaar%20fusion.pdf).
Structural tests do not establish fluency.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9374bff101">Translate Scrum recovery in five more languages and Klingon estimates</a>. Thanks to xet7.</summary>

Fill 36 English placeholders in Akan, Bambara, Wolof, Arabic-script Uzbek
and Klingon. Paging and import recovery now cover 215 locale tags; Klingon
also gains scope history and GitLab estimates, bringing those groups to 213.
Preserve existing translations, source order and exact placeholder tokens.
Extend regression checks for native script, distinct finish and discard
actions, incomplete history and clearing an issue's missing weight.

All 451 translation-related Node suites and all 21 human-preference checks
pass. Paging and recovery still need 19 locale tags; scope history and
estimates need 21. The broader translation backlog remains.

Specialist wording in these five languages has lower confidence and needs
speaker review, especially Klingon estimate terminology. Dictionary and
grammar references include [Bambara vocabulary](https://www.mali-pense.net/bm/lexicon/l.htm)
and [Klingon suffix tables](https://klingonska.org/dict/tables.html).
Structural tests do not establish fluency.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ee49ff20b4">Translate Scrum scope and estimates in Ewe, Fulah and Northern Sami</a>. Thanks to xet7.</summary>

Fill 52 English placeholders: sixteen scope-history and GitLab estimate
messages in each of Ewe, Fulah and Northern Sami, plus four Northern Sami
paging and import-recovery messages. Both groups now cover 216 locale tags,
with 18 remaining. Preserve existing translations and exact placeholder
inventories, and extend checks for incomplete history, discard-only recovery
and clearing missing GitLab weights.

Seven catalog and language suites and all 21 human-preference checks pass.
The broader translation backlog remains. Specialist workflow wording in all
three languages has lower confidence and needs speaker review; structural
checks do not establish fluency. References include
[Basic Ewe](https://philtypo3.uni-koeln.de/sites/inst_afrika/pdf/BASIC_EWE_2nd_ed.pdf),
[the Peace Corps Fulfulde technical manual](https://www.livelingua.com/peace-corps/Fulfulde/fulfulde%20peace%20corps.pdf)
and [Northern Sami usage](https://ovttas.no/).

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/26370bfb33">Translate Scrum history and recovery in four more languages</a>. Thanks to xet7.</summary>

Fill 80 English placeholders in Tibetan, Dzongkha, Tigrinya and Kashmiri.
Scope history, GitLab estimates, paging and import recovery now cover 220
locale tags, with 14 remaining. Preserve existing translations, source key
order and exact tokens. Extend script and warning checks, keeping Dzongkha
distinct from Tibetan and Kashmiri distinct from Urdu.

All 451 translation-related Node suites pass before the final Kashmiri fill;
ten catalog and language suites pass with it included. All 21
human-preference checks pass. The broader translation backlog remains.

Specialist workflow wording in all four languages has lower confidence and
needs speaker review. References include
[Tibetan vocabulary](https://tibetanlanguage.school/resources/vocabulary-lists/),
[the Dzongkha dictionary](https://www.dzongkha.gov.bt/uploads/files/publications/English-Dzongkha_Pocket_Dictionary_fcbe977ea0f17fa3c90a8cd9a0b6c4f1.pdf),
[Tigrinya estimate terminology](https://geezexperience.com/?dr=0&searchkey=estimate)
and [Kashmiri dictionaries](https://bharatavani.in/kashmiri/dictionaries).
Structural tests do not establish fluency.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/da66adfca1">Translate Scrum history and recovery in Acehnese, Aymara, Guarani and Quechua</a>. Thanks to xet7.</summary>

Fill 80 English placeholders, bringing scope history, GitLab estimates,
paging and import recovery to 224 locale tags, with ten remaining. Preserve
existing translations, source order and exact placeholder inventories.
Extend checks for incomplete history, clearing missing weights and recovery
that only permits discarding without board changes. Aymara recovery wording
expresses availability rather than an obligation to finish the import.
Reject English-prefix filler in the new Aymara and Quechua scope messages.

Six catalog and batch suites and all 21 human-preference checks pass.
Specialist wording in these four languages has lower confidence and needs
speaker review. The broader backlog, including older wrongly seeded values,
remains. References include
[Guarani vocabulary](https://www.guaraniayvu.com/),
[Quechua dictionaries](https://www.illaa.org/pirwa/diccionarios/DicEspCusAyaLaSalle.pdf),
[Aymara technical vocabulary](https://diliandes.funproeibandes.org/wp-content/uploads/2023/10/Lexico-tecnico-y-moderno-del-idioma-Aymara.pdf)
and [Acehnese vocabulary](https://bahasaaceh.com/wp-content/uploads/2013/03/hubungan-bahasa-aceh-dengan-bahasa-melayu.pdf).
Structural tests do not establish fluency.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/7068f6c056">Translate Scrum history and recovery in Ladin and Aromanian</a>. Thanks to xet7.</summary>

Fill 40 English placeholders, bringing scope history, GitLab estimates,
paging and recovery to 226 locale tags, with eight remaining. Preserve
existing translations, key order and exact tokens. Extend warning checks for
incomplete history, clearing missing weights and discard-only recovery.
Aromanian saved-state wording uses preservation vocabulary rather than the
tell/show root; Ladin recovery expresses possibility.

Six catalog and batch suites and all 21 human-preference checks pass.
Specialist wording in both languages has lower confidence and needs speaker
review. The broader translation backlog remains. References include
[the English–Aromanian dictionary](https://vivliuteca.org/wp-content/uploads/2025/06/an-english-aromanian-macedo-romanian-dictionary-society-farsharotu.pdf),
[the Aromanian dictionary](https://dixionline.net/index.php?inputWord=inshit)
and [Ladin vocabulary](https://wikisource.org/wiki/Vocabolar_dl_ladin_leterar/Vocabolar/Sf-sv).
Structural tests do not establish fluency.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/38fb11c29d">Translate Scrum history, estimates and recovery in Veps</a>. Thanks to xet7.</summary>

Fill twenty English placeholders in Veps, bringing these Scrum groups to
227 locale tags, with seven remaining. Preserve existing translations,
source order and exact tokens. Extend incomplete-history, missing-weight
and discard-only recovery checks. Use dictionary terms for finishing,
preserving, interrupting and stopping; estimate labels refer to an appraised
number rather than respect alone.

Six catalog and batch suites and all 21 human-preference checks pass.
Veps workflow phrasing and inflection have lower confidence and need speaker
review. The broader translation backlog remains. References include
[the Veps–Hungarian dictionary](https://balti-finn.hu/sites/default/files/vepsze-kotet-beliv.pdf),
[finishing](https://en.wiktionary.org/wiki/lopta)
and [discarding](https://en.wiktionary.org/wiki/heitta).
Structural tests do not establish fluency.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2bb092113c">Translate Scrum history, estimates and recovery in Greenlandic</a>. Thanks to xet7.</summary>

Fill twenty English placeholders in Greenlandic, bringing these Scrum groups
to 228 locale tags, with six remaining. Preserve existing translations,
source order and exact tokens. Extend incomplete-history, missing-weight
and discard-only recovery checks.

All 451 translation-related Node suites and all 21 human-preference checks
pass. Greenlandic workflow phrasing and inflection have lower confidence and
need speaker review. The broader translation backlog remains. References
include [Greenlandic interface wording](https://mitid-erhverv.dk/gl/mitid-erhverv-imannak-atussavat/mitid-erhverv-imi-suliffeqarfiup-inissitsiterinerinik-nalimmassaagit/lokal-idp-mik-aqutsineq/)
and [estimate terminology](https://natur.gl/wp-content/uploads/2019/08/Hoeringssvar_narhval_2014_GRL_final.pdf).
Structural tests do not establish fluency.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/6411b2cd71">Translate Scrum history, estimates and recovery in Nahuatl</a>. Thanks to xet7.</summary>

Fill twenty English placeholders in Nahuatl, bringing these Scrum groups to
229 locale tags, with five remaining. Preserve existing translations, source
order and exact tokens. Extend incomplete-history, missing-weight and
discard-only recovery checks. Describe estimates as expected quantities and
keep finishing an import distinct from discarding it.

Six catalog and batch suites and all 21 human-preference checks pass.
Nahuatl specialist workflow phrasing and inflection have lower confidence
and need speaker review. The broader translation backlog remains. References
include dictionary entries for [changing](https://nahuatl.wired-humanities.org/content/patla-0),
[finishing](https://nahuatl.wired-humanities.org/content/tlamia)
and [inserting](https://nahuatl.wired-humanities.org/node/174411).
Structural tests do not establish fluency.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3fab8db47e">Translate Scrum history, estimates and recovery in Tigre</a>. Thanks to xet7.</summary>

Fill twenty English placeholders in Tigre, bringing these Scrum groups to
230 locale tags, with four remaining. Preserve existing translations, source
order and exact tokens. Extend incomplete-history, missing-weight and
discard-only recovery checks. Check Ethiopic script and selected Tigre
wording separately, since Tigre and Tigrinya share a script.

Six catalog and batch suites and all 21 human-preference checks pass.
Tigre technical terminology and inflection have lower confidence and need
speaker review. Older mixed-language Tigre values and the broader translation
backlog remain. References include
[Dehai Tigre grammar](https://www.speaktigre.com/_files/ugd/7e068a_d791dde4087041feaf3dedb6b109829c.pdf?index=true)
and [Tigre vocabulary](https://www.speaktigre.com/_files/ugd/7e068a_a5fbea1fb5e544e69d94cab002762da2.pdf?index=true).
Structural tests do not establish fluency.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a444593a6b">Translate Scrum history, estimates and recovery in Wolaytta</a>. Thanks to xet7.</summary>

Fill twenty English placeholders in Wolaytta, bringing these Scrum groups to
231 locale tags, with three remaining. Preserve existing translations, source
order and exact tokens. Extend incomplete-history, missing-weight and
discard-only recovery checks. Reject language-name prefixes in this batch:
prefixing English text does not translate it.

Six catalog and batch suites and all 21 human-preference checks pass.
Wolaytta specialist terminology and inflection have lower confidence and
need speaker review. Older prefixed English values and the broader translation
backlog remain. References include
[Wolaytta grammar and vocabulary](https://dokumen.pub/the-wolaytta-language.html)
and [the Wolaytta phrasebook](https://en.wikivoyage.org/wiki/Wolayttattuwa_phrasebook).
Structural tests do not establish fluency.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/440beac70a">Translate Tamazight Scrum messages and fix Tigre card terms</a>. Thanks to xet7.</summary>

Fill twenty English placeholders in Standard Moroccan Tamazight, bringing
these Scrum groups to 232 locale tags, with two remaining. Correct the Arabic
Discard label to Tamazight. Preserve correct-language translations, source
order and exact tokens. Extend incomplete-history, missing-weight,
discard-only recovery and Tifinagh checks.

The full run passes 450 of 451 translation-related Node suites. Fix the
remaining Tigre card-terminology failure by using the established card term
in four Scrum messages; that suite and seven related suites then pass.
All 21 human-preference checks pass. Specialist Tamazight phrasing has lower
confidence and need speaker review. The broader translation backlog remains.
References include [IRCAM terminology](https://ircam.biblio.ma/catalogue/doc_num.php?explnum_id=193)
and [IRCAM conjugation](https://www.temehu.com/imazighen/dictionaries/Amawals/manuel-de-conjugaison-Tamazight-Tifinagh-IRCAM.pdf).
Structural tests do not establish fluency.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a77c59bbc5">Translate Scrum history, estimates and recovery in Inuktitut</a>. Thanks to xet7.</summary>

Fill twenty English placeholders in Inuktitut, bringing these Scrum groups
to 233 locale tags, with Cherokee remaining. Preserve existing translations,
source order and exact tokens. Extend incomplete-history, missing-weight,
discard-only recovery and syllabics checks.

Six catalog and batch suites and all 21 human-preference checks pass.
Inuktitut specialist workflow phrasing and inflection have lower confidence
and need speaker review. The broader translation backlog remains. References
include [Nunavut estimate terminology](https://assembly.nu.ca/sites/default/files/2022-11/20210225_Hansard%20%28Inuktitut%29.pdf)
and [the Inuktut affix dictionary](https://www.taiguusiliuqtiit.ca/sites/default/files/2020-04/Affix-Dictionary-V21.pdf).
Structural tests do not establish fluency.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/79fd147921">Translate Scrum history, estimates and recovery in Cherokee</a>. Thanks to xet7.</summary>

Fill twenty English placeholders in Cherokee for Scrum scope history, GitLab
estimates, paging and import recovery. These twenty strings now have
translations
in all 234 non-English locale tags. Preserve existing translated values, source
key order and exact placeholders. Extend Cherokee script and workflow wording
checks for incomplete history, missing weights and discard-only recovery.

All 451 translation-related suites and 21 human-preference checks pass.
Cherokee specialist phrasing and inflection have low confidence and need speaker
review. References include the [Cherokee Nation consortium word list](https://language.cherokee.org/media/4emjgbyy/2019consortium_wordlist.pdf)
and [Cherokee verb forms](https://smg-complexity.surrey.ac.uk/languages/cherokee/).
Structural tests do not establish fluency. The broader translation backlog
remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c2038081a6">Translate feature visibility settings into Tamazight</a>. Thanks to xet7.</summary>

Fill 24 English placeholders in Standard Moroccan Tamazight, preserving existing
translated values. Feature visibility messages now cover 232 locale tags;
Cherokee and Tigre remain in this group. Cover data retention, unchanged
permissions, approval after updates and the separate administrator and pilot
user audiences. Describe card aging as time since creation.

Four focused catalog and translation suites and all 21 human-preference checks
pass. Specialist analytics terms and inflection have lower confidence and need
speaker review; script checks do not establish fluency. Vocabulary references
include the [IRCAM lexicon](https://biblio.ircam.ma/pmb/uploads/publications/177.pdf)
and [administrative correspondence](https://biblio.ircam.ma/pmb/catalogue/doc_num.php?explnum_id=990).
The broader translation backlog remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/94c581b537">Translate feature visibility settings into Tigre and Cherokee</a>. Thanks to xet7.</summary>

Fill 48 English placeholders across Tigre and Cherokee. The 24 feature
visibility
messages now have translations in all 234 non-English locale tags, and the suite
checks its coverage list against the catalog directory. Preserve existing
translated values, exact tokens and source order. Cover data retention,
unchanged
permissions, approval after updates and distinct administrator and pilot users.

All 451 translation-related suites and 21 human-preference checks pass.
Tigre and Cherokee specialist wording and inflection have low confidence and
need speaker review. References include the [Tigre grammar of Ginda](https://www.speaktigre.com/_files/ugd/7e068a_adcb2a9df2c340898e3155ef3905c61e.pdf?index=true),
[Tigre permission vocabulary](https://www.speaktigre.com/_files/ugd/7e068a_0c27fcb32e044d3197ef7f4bcb3163a6.pdf)
and the [Cherokee Nation consortium word list](https://language.cherokee.org/media/4emjgbyy/2019consortium_wordlist.pdf).
Structural tests do not establish fluency. Other new Scrum, Sync and email
recovery strings remain in the broader translation backlog.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ebc225466d">Translate email recovery in Kurdish, Tatar and Turkmen</a>. Thanks to xet7.</summary>

Fill 92 English placeholders across Kurmanji, Sorani, Tatar and Turkmen.
Translate
the email queue controls and explain the cancellation boundary, irrecoverable
contents, possible duplicate delivery and pauses retained during retry. Preserve
existing translated values, source order and exact placeholders.

The new automatically discovered regression suite checks all email recovery keys
in these four locales, distinct actions and the cancellation and delivery
warning
clauses. Four focused catalog and translation suites and all 21 human-preference
checks pass. Specialist workflow wording and inflection have lower confidence
and need speaker review. Structural tests do not establish fluency. English
email
recovery messages remain in 66 locale tags, alongside the broader translation
backlog.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/962dbedfae">Translate email recovery in Papiamento, Somali, Tok Pisin and Bislama</a>. Thanks to xet7.</summary>

Fill 92 English placeholders across four locales without replacing existing
translated values. Preserve the warnings about messages already being sent,
uncertain delivery, irreversible cancellation and newer messages retained after
a cancellation request. Retrying failed messages continues to respect a pause.
Extend the email recovery suite with these boundaries and separate Tok Pisin and
Bislama wording, rejecting language-prefix filler.

Four focused catalog and translation suites and all 21 human-preference checks
pass. Specialist terms and long workflow clauses have lower confidence and need
speaker review. References for send/message terminology include the
[Tok Pisin dictionary](https://tokpisin.info/salim/) and the
[Bislama traveller factsheet](https://www.travellerdeclaration.govt.nz/assets/pdfs/Traveller-Factsheet-Bislama.pdf).
Structural tests do not establish fluency. Email recovery still has English
messages in 62 locale tags; the broader translation backlog remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/71f6450368">Translate email recovery in Yiddish, Moroccan Arabic, Wu and Venetian</a>. Thanks to xet7.</summary>

Fill 92 English placeholders in four locales. Preserve the cancellation
boundary,
irrecoverable contents, uncertain delivery warning and existing pauses during
retry. Extend script checks for Hebrew, Arabic and Han text and wording checks
for Moroccan Arabic, Wu and Venetian. Existing translated values remain intact.

Four focused catalog and translation suites and all 21 human-preference checks
pass. Specialist workflow phrasing and inflection have lower confidence and need
speaker review. Vocabulary references include the [Venetian dictionary](https://www.vatrarberesh.it/biblioteca/ebooks/linguaveneta.pdf)
and [Wu usage research](https://api.lib.kyushu-u.ac.jp/opac_download_md/6796404/37_p035.pdf).
Structural tests do not establish fluency. English email recovery messages
remain
in 58 locale tags, alongside other untranslated new strings.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/fe1463af6c">Translate email recovery in Bhojpuri, Maithili, Konkani and Odia</a>. Thanks to xet7.</summary>

Fill 92 English placeholders while preserving existing translated values, source
order and exact tokens. Translate queue controls, cancellation boundaries,
uncertain delivery and pauses retained during retry. Extend Devanagari and Odia
script checks and the warning regressions. The Odia empty state explicitly says
both that there are no queued messages and that no recipient is paused.

All 452 translation-related suites and 21 human-preference checks pass.
Specialist workflow phrasing and inflection have lower confidence and need
speaker
review; structural checks do not establish fluency. Email recovery messages
still
remain in English in 54 locale tags. Other new-string groups remain unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d11f7ff5fb">Translate email recovery in Zulu, Xhosa and Nyanja</a>. Thanks to xet7.</summary>

Fill 92 English placeholders across Zulu, regional Zulu, Xhosa and Nyanja.
Preserve existing translated values, source order and exact tokens. Translate
queue controls and warnings about irreversible cancellation, messages created
after a request, uncertain delivery and pauses retained during retry. Extend
regressions for all four tags and distinguish Zulu, Xhosa and Nyanja wording.

Four focused catalog and translation suites and all 21 human-preference checks
pass. Specialist workflow phrasing and inflection have lower confidence and need
speaker review. Structural checks do not establish fluency. Email recovery still
has English messages in 50 locale tags; the broader translation backlog remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/cb7b9a5cd1">Translate email recovery in Sotho, Tswana, Northern Sotho and Swati</a>. Thanks to xet7.</summary>

Fill 92 English placeholders across Southern Sotho, Tswana, Northern Sotho and
Swati. Preserve existing translated values, source order and exact tokens.
Extend regressions for cancellation boundaries, messages that cannot be
recalled,
uncertain delivery and existing pauses retained during retry. Keep each
language's
own wording for continuing delivery.

Four focused catalog and translation suites and all 21 human-preference checks
pass. Specialist workflow phrasing and inflection have lower confidence and need
speaker review. Vocabulary references include the [Setswana dictionary](https://setswana.co.za/)
and [Swati writing examples](https://www.education.gov.za/Portals/0/CD/2024May-June%20papers/Siswati%20FAL%20P3%20May-June%202024.pdf).
Structural checks do not establish fluency. Email recovery remains in English in
46 locale tags, alongside the broader translation backlog.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/73adc5c029">Translate email recovery in Kinyarwanda, Kirundi, Luganda and Oromo</a>. Thanks to xet7.</summary>

Fill 92 English placeholders, preserving existing translated values, source
order
and exact tokens. Extend cancellation and retry-warning checks for all four
locales. Preserve messages created after a cancellation request, the warning
about uncertain delivery and any existing pause during retries. Keep distinct
Kinyarwanda and Kirundi wording, and correct the Luganda update status and Oromo
cancellation question during review.

Four focused catalog and translation suites and all 21 human-preference checks
pass. Specialist workflow phrasing and inflection have lower confidence and need
speaker review. Vocabulary references include [Kirundi public-service wording](https://tax.vermont.gov/rn/ikirundi)
and the [Luganda mentorship handbook](https://rebuild.rescue.org/sites/default/files/2024-01/Participant%20Handbook%20Basic%20Mentorship%20-%20Luganda.pdf).
Structural checks do not establish fluency. Email recovery still has English
messages in 42 locale tags; the broader translation backlog remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c19cc2c478">Translate email recovery in Māori, Samoan, Tongan and Fijian</a>. Thanks to xet7.</summary>

Fill 92 English placeholders across four locales and replace the Tongan shared
pause label's English filler. Preserve existing translated values, source key
order and exact placeholder tokens. Extend regression coverage for cancellation
boundaries, uncertain delivery, retries respecting existing pauses and the
Tongan pause correction.

All 452 translation-related suites and 21 human-preference checks pass.
Specialist workflow phrasing and inflection in these four languages have lower
confidence and need speaker review; structural checks do not establish fluency.
Email recovery still has English messages in 38 locale tags, and the broader
translation backlog remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1088900958">Translate email recovery in Upper Sorbian and Silesian</a>. Thanks to xet7.</summary>

Fill 46 English placeholders, preserving existing translations, source order and
exact tokens. Extend regression checks for irreversible cancellation,
preservation
of later messages, uncertain delivery and retries retaining an existing pause.
Four focused catalog and translation suites and all 21 human-preference checks
pass.

Specialist workflow phrasing and inflection in both languages have lower
confidence
and need speaker review. Terminology references include [Upper Sorbian Thunderbird](https://github.com/thunderbird/thunderbird-l10n/blob/main/hsb/calendar/calendar/calendar.ftl)
and [Silesian MediaWiki](https://github.com/wikimedia/mediawiki/blob/master/languages/i18n/szl.json).
Structural checks do not establish fluency. Email recovery still has English
messages in 36 locale tags; the broader translation backlog remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/60e93c8cb3">Translate email recovery in Walloon and Ladin</a>. Thanks to xet7.</summary>

Fill 46 English placeholders, preserving existing translations, source order and
exact tokens. Extend regression checks for cancellation boundaries, uncertain
delivery and retries retaining an existing pause. Correct the Ladin retry
interval
wording during review. Four focused translation and catalog suites and all 21
human-preference checks pass.

Specialist workflow wording and inflection in Walloon and Ladin have lower
confidence and need speaker review. Ladin terminology was checked against
[Gaia's Ladin pages](https://www.pro-gaia.net/ladcumembri/), alongside existing
catalog vocabulary. Structural checks do not establish fluency. Email recovery
still has English messages in 34 locale tags; the broader translation backlog
remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3ead95c01c">Translate email recovery in Hawaiian and Manx</a>. Thanks to xet7.</summary>

Fill 46 English placeholders, preserving existing translations, source order and
exact tokens. Extend checks for irreversible cancellation, keeping later
messages,
uncertain delivery and retries retaining a pause. Correct Manx queue terminology
during review. Four focused catalog and translation suites and all 21
human-preference checks pass.

Technical phrasing and inflection in Hawaiian and Manx have lower confidence and
need speaker review. Terminology references include [Hawaiian dictionaries](https://hilo.hawaii.edu/wehe/?q=leka+uila)
and [Learn Manx resources](https://www.learnmanx.com/resources/dictionaries--grammar/).
Structural checks do not establish fluency. Email recovery still has English
messages in 32 locale tags; the broader translation backlog remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/6f773dd6a1">Translate email recovery in Tsonga and Venda</a>. Thanks to xet7.</summary>

Fill 46 English placeholders and correct the shared pause labels: replace
generic
Tsonga filler and a Zulu phrase in Venda. Preserve correct-language
translations,
source order and exact tokens. Extend checks for cancellation boundaries,
uncertain delivery and retries retaining a pause. All 452 translation-related
suites and 21 human-preference checks pass in the aligned worktree.

Specialist workflow phrasing and inflection in Tsonga and Venda have lower
confidence and need speaker review. Structural checks do not establish fluency.
Email recovery still has English messages in 30 locale tags; the broader
translation backlog remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/bd6889e59f">Restore catalog completeness after adding the Focalboard import instruction</a>. Thanks to xet7.</summary>

Add the new instruction key in source order to all 243 remaining catalog files,
without changing existing values. The untranslated instruction is tracked as an
English placeholder; English variants intentionally retain English. This fixes
the reproduced catalog completeness failure. All 452 translation-related suites
pass with the aligned catalogs. Translating the new instruction remains pending.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c9bb68b15c">Translate email recovery in Northern Ndebele and Waray</a>. Thanks to xet7.</summary>

Fill 46 English placeholders, preserving existing translations, source order and
exact tokens. Extend cancellation, uncertain-delivery and retained-pause checks,
including Northern Ndebele and Waray vocabulary. Four focused catalog and
translation suites and all 21 human-preference checks pass.

Specialist workflow wording and inflection in Northern Ndebele and Waray have
lower confidence and need speaker review. Waray terminology was checked against
the [Waray Dictionary corpus](https://dictionary.corporaproject.org/index.php?glossary=I&sort=count).
Structural checks do not establish fluency. Email recovery still has English
messages in 28 locale tags; the broader translation backlog remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/676a7ab7d0">Translate email recovery in Aromanian and Northern Sámi</a>. Thanks to xet7.</summary>

Fill 46 English placeholders and replace three Spanish or Italian email labels
in Aromanian. Preserve correct-language translations, source order and exact
tokens. Extend cancellation, uncertain-delivery, pause and language checks;
correct read and cancellation wording during review. Four focused catalog and
translation suites and all 21 human-preference checks pass.

Specialist phrasing and inflection in Aromanian and Northern Sámi have lower
confidence and need speaker review. References include [RISE UP's Aromanian text](https://www.riseupproject.eu/wp-content/uploads/2025/11/Travelling-Exhibition-70x100-AROMANIAN.pdf)
and [Northern Sámi public-service messages](https://www.vero.fi/other_language/balvalus_samegilli/suomi.fi-diedahusat-ja-elektrovnnalas-vearroboasta).
Structural checks do not establish fluency. Email recovery still has English
messages in 26 locale tags; the broader translation backlog remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/484459a917">Translate email recovery in Chuvash and Buryat</a>. Thanks to xet7.</summary>

Fill 46 English placeholders, preserving existing translations, source order and
exact tokens. Extend cancellation, uncertain-delivery and retained-pause checks,
with Cyrillic script and language vocabulary coverage. Four focused catalog and
translation suites and all 21 human-preference checks pass.

Specialist workflow wording and inflection in Chuvash and Buryat have lower
confidence and need speaker review. Terminology references include [Chuvash CLDR annotations](https://www.unicode.org/cldr/charts/48/by_type/characters.objects2.html)
and [Buryat radio's contact form](https://buryad.fm/contacts/).
Structural checks do not establish fluency. Email recovery still has English
messages in 24 locale tags; the broader translation backlog remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/aaac254884">Translate email recovery in Tibetan and Wolof</a>. Thanks to xet7.</summary>

Fill 46 English placeholders, preserving existing translations, source order and
exact tokens. Extend cancellation, uncertain-delivery and retained-pause checks,
with Tibetan script and vocabulary coverage. Refine Wolof holding and restarting
wording during review. Four focused catalog and translation suites and all 21
human-preference checks pass.

Specialist workflow phrasing and inflection in Tibetan and Wolof have lower
confidence and need speaker review. Vocabulary references include [Wolof learning materials](https://senprof.education.sn/PROGRAMME%20LECTURE%20POUR%20TOUS/documentation/CE1/Livrets%20de%20maison%20CE1/LM_CE1_Wolof_30072019.pdf)
and [Tibetan public-service email wording](https://dos.ny.gov/system/files/documents/2018/08/1322-bo.pdf).
Structural checks do not establish fluency. Email recovery still has English
messages in 22 locale tags; the broader translation backlog remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1d19acf87f">Translate email recovery in Acehnese and Akan</a>. Thanks to xet7.</summary>

Fill 46 English placeholders and correct seven email or pause labels containing
Indonesian, mixed-language text or generic Akan filler. Preserve
correct-language
translations, source order and exact tokens. Extend cancellation,
uncertain-delivery,
retained-pause and corrected-label regression checks. All 452
translation-related
suites and 21 human-preference checks pass.

Specialist workflow phrasing and inflection in Acehnese and Akan have lower
confidence and need speaker review. Acehnese terminology was checked against
[the Acehnese–Indonesian–English thesaurus](https://fileserver-az.core.ac.uk/download/pdf/160609809.pdf).
Structural checks do not establish fluency. Email recovery still has English
messages in 20 locale tags; the broader translation backlog remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4fb6157c52">Translate email recovery in Bambara and Ewe</a>. Thanks to xet7.</summary>

Fill 46 English placeholders, preserving existing translations, source order and
exact tokens. Extend cancellation, uncertain-delivery, retained-pause and
vocabulary
checks. Refine resume and form-field wording during review. Four focused catalog
and translation suites and all 21 human-preference checks pass.

Specialist workflow wording and grammar in Bambara and Ewe have lower confidence
and need speaker review. References include [the An ka taa dictionary](https://dictionary.ankataa.com/lexicon.php?letter=3)
and [Ghana's Ewe learning materials](https://curriculumresources.edu.gh/wp-content/uploads/2025/01/LM-Ewe-Language-section-2-LVersion.pdf).
Structural checks do not establish fluency. Email recovery still has English
messages in 18 locale tags; the broader translation backlog remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/41ab81d444">Translate email recovery in Aymara and Quechua</a>. Thanks to xet7.</summary>

Fill 46 English placeholders and replace three language-prefix filler labels for
pause and email. Preserve correct-language translations, source order and exact
tokens. Extend cancellation, uncertain-delivery, retained-pause and
corrected-label
checks; refine read and resume wording during review. Four focused catalog and
translation suites and all 21 human-preference checks pass.

Specialist wording, grammar and regional vocabulary in Aymara and Quechua have
lower confidence and need speaker review. References include [Chile's Aymara dictionary](https://bibliotecadigital.mineduc.cl/handle/20.500.12365/17169)
and [the bilingual Quechua dictionary](https://www.illaa.org/pirwa/diccionarios/DicQuechuaBolivia.pdf).
Structural checks do not establish fluency. Email recovery still has English
messages in 16 locale tags; the broader translation backlog remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a50b808fce">Translate email recovery in Guarani and Klingon</a>. Thanks to xet7.</summary>

Fill 46 English placeholders, preserving existing translations, source order and
exact tokens. Extend cancellation, uncertain-delivery and retained-pause checks;
review Klingon word order, capitalization and retry wording. Four focused
catalog
and translation suites and all 21 human-preference checks pass.

Specialist workflow wording and grammar in Guarani and Klingon have lower
confidence and need speaker review. References include [Ñe’ẽrandu](https://xn--eerandu-3za.com/)
and [the Klingon Pocket Dictionary](https://klingonska.org/dict/).
Structural checks do not establish fluency. Email recovery still has English
messages in 14 locale tags; the broader translation backlog remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e7ef48d5fe">Translate email recovery in Tigrinya and Sakha</a>. Thanks to xet7.</summary>

Fill 46 English placeholders, preserving existing translations, source order and
exact tokens. Extend cancellation, uncertain-delivery and retained-pause checks,
with Ethiopic and Cyrillic script and language vocabulary coverage. Four focused
catalog and translation suites and all 21 human-preference checks pass.

Specialist workflow wording and inflection in Tigrinya and Sakha have lower
confidence and need speaker review. Structural checks do not establish fluency.
Email recovery still has English messages in 12 locale tags; the broader
translation backlog remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/790994747b">Translate email recovery in Volapük</a>. Thanks to xet7.</summary>

Fill 23 English placeholders, preserving existing translations, source order and
exact tokens. Extend cancellation, uncertain-delivery and retained-pause checks.
Four focused catalog and translation suites and all 21 human-preference checks
pass.

Specialist Volapük wording and inflection have low confidence and need speaker
review. Terminology was checked against the [English–Volapük dictionary](https://en.wikibooks.org/wiki/Volap%C3%BCk/English-Volap%C3%BCk_dictionary).
Structural checks do not establish fluency. The broader translation backlog
remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/02a2130e70">Translate email recovery in Veps</a>. Thanks to xet7.</summary>

Fill 23 English placeholders in the ve-PP catalog, preserving existing
translations,
source order and exact tokens. Extend cancellation, uncertain-delivery and
retained-pause
checks. Four focused catalog suites and all 21 human-preference checks pass.

Specialist Veps wording and inflection have low confidence and need speaker
review.
References include the [VepKar corpus](https://dictorpus.krc.karelia.ru/ru/)
and a [Veps grammar and dictionary](https://www.vepsze.hu/sites/default/files/szovegbeliv_honlap.pdf).
Structural checks do not establish fluency. The broader translation backlog
remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/38dc8e220e">Translate email recovery in Kashmiri</a>. Thanks to xet7.</summary>

Fill 23 English placeholders, preserving existing translations, source order and
exact tokens. Extend cancellation, uncertain-delivery and retained-pause checks,
with Arabic-script and Kashmiri vocabulary coverage. Four focused catalog suites
and all 21 human-preference checks pass.

Specialist Kashmiri wording and inflection have low confidence and need speaker
review. References include the [Project ZAAN Kashmiri reader](https://koshur.org/Reader/intro.html)
and an [online Kashmiri dictionary](https://azaditimes.com/resources/kashmiri-dictionary-online/).
Structural checks do not establish fluency. The broader translation backlog
remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/82dcdc1268">Translate email recovery in Fulah</a>. Thanks to xet7.</summary>

Fill 23 English placeholders, preserving existing translations, source order and
exact tokens. Extend cancellation, uncertain-delivery and retained-pause checks;
review recipient and message agreement. Four focused catalog suites and all 21
human-preference checks pass.

Specialist Fulah wording, agreement and regional terminology have low confidence
and need speaker review. Vocabulary references include the [Fulah lexicon](https://dokumen.pub/a-fulfulde-maasina-english-french-lexicon-lexique-fulfulde-maasina-anglais-franais-0870133268-9780870133268-9780870139420.html).
Structural checks do not establish fluency. The broader translation backlog
remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5b8068f120">Translate email recovery in Dzongkha</a>. Thanks to xet7.</summary>

Fill 23 English placeholders, preserving existing translations, source order and
exact tokens. Extend cancellation, uncertain-delivery, retained-pause and script
checks. Four focused catalog suites and all 21 human-preference checks pass.

Specialist Dzongkha wording and grammar have low confidence and need speaker
review.
References include the Dzongkha Development Commission's [dictionary](https://www.dzongkha.gov.bt/dz/dictionary/search)
and [computer terminology](https://www.dzongkha.gov.bt/uploads/files/publications/1.computer_term_text_e53071b6528a9081cabd770fda7a26c4.pdf).
Structural checks do not establish fluency. The broader translation backlog
remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/48b8a16d4b">Translate email recovery in Greenlandic</a>. Thanks to xet7.</summary>

Fill 23 English placeholders, preserving existing translations, source order and
exact tokens. Extend cancellation, uncertain-delivery and retained-pause checks.
Four focused catalog suites and all 21 human-preference checks pass.

Specialist Greenlandic wording and inflection have low confidence and need
speaker
review. References include [Greenlandic dictionaries](https://ordbog.gl/)
and [Learn Greenlandic](https://learngreenlandic.com/online/lg2/7.1/text/?lang=eng).
Structural checks do not establish fluency. The broader translation backlog
remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/03f9828922">Translate email recovery in Nahuatl</a>. Thanks to xet7.</summary>

Fill 23 English placeholders, preserving existing translations, source order and
exact tokens. Extend cancellation, uncertain-delivery and retained-pause checks.
Four focused catalog suites and all 21 human-preference checks pass.

Specialist Nahuatl terminology, grammar and dialect choices have low confidence
and need speaker review. References include the [Nahuatl Dictionary](https://nahuatl.wired-humanities.org/content/titlani)
and [Gran Diccionario Náhuatl](https://gdn.iib.unam.mx/diccionario/occeppa/187043).
Structural checks do not establish fluency. The broader translation backlog
remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/415cfa7f8d">Translate email recovery in Standard Moroccan Tamazight</a>. Thanks to xet7.</summary>

Fill 23 English placeholders in Tifinagh, preserving existing translations,
source
order and exact tokens. Extend cancellation, uncertain-delivery, retained-pause
and script checks. All 452 translation-related suites and 21 human-preference
checks pass in the worktree after catalog alignment with new backup strings.

Specialist Tamazight wording, grammar and regional terminology have low
confidence
and need speaker review. References include [IRCAM's grammar](https://www.ircam.ma/sites/default/files/2021-02/nouvel-gram-amazigh.pdf)
and the [Tamazight dictionary](https://awalamazigh.com/).
Structural checks do not establish fluency. The broader translation backlog
remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3c2cab5cfc">Translate email recovery in Wolaytta</a>. Thanks to xet7.</summary>

Fill 23 English placeholders and replace four mixed-English pause and email
status
labels. Preserve existing correct-language translations, source order and exact
tokens. Extend cancellation, uncertain-delivery, retained-pause and
corrected-label
checks. Four focused catalog suites and all 21 human-preference checks pass in
the worktree aligned with the new backup strings.

Specialist Wolaytta wording and inflection have low confidence and need speaker
review. References include [Wolaytta teaching material](https://pdf.usaid.gov/pdf_docs/PA00MQWZ.pdf)
and the [Wolaytta dictionary](https://kaikki.org/dictionary/Wolaytta/index.html).
Structural checks do not establish fluency. The broader translation backlog
remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/8a4e6979df">Translate email recovery in Inuktitut</a>. Thanks to xet7.</summary>

Fill 23 English placeholders in syllabics, preserving existing translations,
source
order and exact tokens. Extend cancellation, uncertain-delivery, retained-pause
and script checks. Four focused catalog suites and all 21 human-preference
checks
pass in the worktree aligned with the new backup strings.

Specialist Inuktitut phrasing and inflection have low confidence and need
speaker
review. References include [Inuktitut vocabulary](https://kaikki.org/dictionary/Inuktitut/index.html)
and [City of Iqaluit's Inuktitut notice](https://www.iqaluit.ca/sites/default/files/cityofiqaluit-psa-2025-10-24-reminder_to_update_mailing_address-inu.pdf).
Structural checks do not establish fluency. The broader translation backlog
remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e719b8e32e">Translate email recovery in Tigre</a>. Thanks to xet7.</summary>

Fill 23 English placeholders and replace two Tigrinya email-sent and pause
labels
in the Tigre catalog. Preserve other translations, source order and exact
tokens.
Extend cancellation, uncertain-delivery, retained-pause, vocabulary and script
checks. Four focused catalog suites and all 21 human-preference checks pass in
the worktree aligned with the new backup strings.

Specialist Tigre phrasing, grammar and corrected labels have low confidence and
need speaker review. References include [The Tigre Language of Gindaʿ, Eritrea](https://www.speaktigre.com/_files/ugd/7e068a_adcb2a9df2c340898e3155ef3905c61e.pdf?index=true).
Structural checks do not establish fluency. The broader translation backlog
remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d9e3274eb9">Translate Cherokee email recovery and check every locale</a>. Thanks to xet7.</summary>

Fill the final 23 English email-recovery placeholders in Cherokee. Add a
regression
gate covering missing messages, English placeholders and exact tokens in every
non-English catalog, alongside cancellation, uncertain-delivery and
retained-pause
checks. Four focused catalog suites and all 21 human-preference checks pass in
the worktree aligned with the new backup strings.

Cherokee specialist wording and inflection have low confidence and need speaker
review. References include the [Cherokee Nation word list](https://language.cherokee.gov/word-list/)
and [Cherokee dictionary](https://www.cherokeedictionary.net/).
Structural coverage does not establish fluency. This completes the placeholder
fill for email recovery; other new strings and the broader translation backlog
remain.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/85cd3f05ab">Align translation catalogs with continuous backup</a>. Thanks to xet7.</summary>

Add all 35 continuous-backup source keys to 243 other catalogs in English key
order. Preserve every existing value. Catalog completeness and email-recovery
regression suites pass. These new English placeholders remain available for
translation.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4fe54734e5">Translate continuous backup into Finnish and Swedish</a>. Thanks to xet7.</summary>

Fill 70 English placeholders without overwriting existing translations. Add
checks
for restore boundaries, preservation of the live database file, time units,
engine
names and exact tokens. Four focused catalog suites and all 21 human-preference
checks pass. Other languages and the broader translation backlog remain.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ac03560a1a">Translate continuous backup into Danish and Norwegian</a>. Thanks to xet7.</summary>

Fill 70 English placeholders in Danish and Norwegian Bokmål while preserving
existing translations, source order and exact tokens. Extend checks for restore
boundaries, protection of the live database file, time units and engine names.
Four focused catalog suites and all 21 human-preference checks pass. Other
languages and the broader translation backlog remain.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/14624631fd">Translate continuous backup into German and French</a>. Thanks to xet7.</summary>

Fill 315 English placeholders across nine German and French catalogs, including
regional variants, without replacing existing translations. Extend checks for
restore boundaries, protection of the live database file, time units, engine
names,
Swiss German spelling and exact tokens. Four focused catalog suites and all 21
human-preference checks pass. Other languages and the broader backlog remain.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5891fa12d5">Translate continuous backup into Spanish and Portuguese</a>. Thanks to xet7.</summary>

Fill 455 English placeholders across thirteen catalogs while preserving existing
translations, source order and exact tokens. Use separate Brazilian and European
Portuguese wording. Extend checks for restore boundaries, protection of the live
database file and time units. Four focused catalog suites and all 21
human-preference
checks pass. Other languages and the broader translation backlog remain.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/eba047b928">Translate continuous backup into Italian and Dutch</a>. Thanks to xet7.</summary>

Fill 105 English placeholders across three catalogs while preserving existing
translations, source order and exact tokens. Extend checks for restore
boundaries,
protection of the live database file and time units. Four focused catalog suites
and all 21 human-preference checks pass. Other languages and the broader backlog
remain.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0a58060772">Translate continuous backup into Polish and Czech</a>. Thanks to xet7.</summary>

Fill 140 English placeholders across four catalogs while preserving existing
translations, source order and exact tokens. Extend checks for restore
boundaries,
protection of the live database file and time units. Four focused catalog suites
and all 21 human-preference checks pass. Other languages and the broader backlog
remain.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e9a07df6d6">Translate continuous backup into Slovak, Slovenian and Croatian</a>. Thanks to xet7.</summary>

Fill 105 English placeholders and correct the Czech restore label in Slovak and
the Cyrillic restore label in Croatian. Preserve existing correct-language
translations, source order and exact tokens. Extend coverage for restore
boundaries,
protection of the live database file, time units and Latin-script labels. All
453
translation-related suites and 21 human-preference checks pass. Backup
translations
now cover 36 of 234 non-English catalogs; other catalogs and the broader backlog
remain.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/907d041be7">Translate continuous backup into Romanian, Hungarian and Bulgarian</a>. Thanks to xet7.</summary>

Fill 140 English placeholders across four catalogs and replace Italian restore
labels in both Romanian catalogs. Preserve existing correct-language
translations,
source order and exact tokens. Extend checks for restore boundaries, protection
of
the live database file, time units and Bulgarian script. Four focused catalog
suites
and all 21 human-preference checks pass. Other languages and the broader backlog
remain.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9d7ce94e10">Translate continuous backup into Ukrainian and Russian</a>. Thanks to xet7.</summary>

Fill 175 English placeholders across five catalogs, including regional variants
and the existing Russian locale alias. Preserve existing translations, source
order
and exact tokens. Extend checks for restore boundaries, protection of the live
database file, time units and distinct Ukrainian and Russian vocabulary. Four
focused
catalog suites and all 21 human-preference checks pass. Other languages and the
broader translation backlog remain.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c92bc36260">Translate continuous backup into Latvian, Lithuanian and Estonian</a>. Thanks to xet7.</summary>

Fill 105 English placeholders across three catalogs while preserving existing
translations, source order and exact tokens. Extend checks for restore
boundaries,
protection of the live database file, time units and Latin script. Four focused
catalog suites and all 21 human-preference checks pass. Other languages and the
broader translation backlog remain.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2651146f51">Translate continuous backup into Greek and Turkish</a>. Thanks to xet7.</summary>

Fill 105 English placeholders across three catalogs while preserving existing
translations, source order and exact tokens. Extend checks for restore
boundaries,
protection of the live database file, time units and Greek script. Four focused
catalog suites and all 21 human-preference checks pass. Other languages and the
broader translation backlog remain.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/36a3a85e8a">Translate continuous backup into Japanese, Korean and Chinese</a>. Thanks to xet7.</summary>

Fill 455 English placeholders across thirteen catalogs, including hiragana
Japanese
and separate Simplified and Traditional Chinese wording. Preserve existing
translations,
source order and exact tokens. Extend checks for restore boundaries, protection
of
the live database file, time units and locale scripts. Four focused catalog
suites
and all 21 human-preference checks pass. Other languages and the broader backlog
remain.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/00de9569b3">Translate continuous backup into Indonesian, Malay and Vietnamese</a>. Thanks to xet7.</summary>

Fill 175 English placeholders across five catalogs while preserving existing
translations, source order and exact tokens. Keep Indonesian and Malay
terminology
separate. Extend checks for restore boundaries, protection of the live database
file and time units. Four focused catalog suites and all 21 human-preference
checks pass. Other languages and the broader translation backlog remain.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/8e442a129f">Translate continuous backup into Arabic and Hebrew</a>. Thanks to xet7.</summary>

Fill 175 English placeholders across five catalogs while preserving existing
translations, source order and exact tokens. Extend checks for restore
boundaries,
protection of the live database file, time units and Arabic and Hebrew scripts.
Four focused catalog suites and all 21 human-preference checks pass. Other
languages
and the broader translation backlog remain.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b4780cb46e">Translate continuous backup into Persian and Urdu</a>. Thanks to xet7.</summary>

Fill 105 English placeholders across three catalogs and correct the Urdu backup
label. Preserve existing correct-language translations, source order and exact
tokens.
Extend checks for restore boundaries, protection of the live database file, time
units and Arabic script. Four focused catalog suites and all 21 human-preference
checks pass. Other languages and the broader translation backlog remain.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a0d2adbad5">Translate continuous backup into Hindi and Bengali</a>. Thanks to xet7.</summary>

Fill 105 English placeholders across three catalogs while preserving existing
translations, source order and exact tokens. Extend checks for restore
boundaries,
protection of the live database file, time units and Devanagari and Bengali
scripts.
Four focused catalog suites and all 21 human-preference checks pass. Other
languages
and the broader translation backlog remain.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/13489d56e8">Translate continuous backup into Catalan, Galician and Basque</a>. Thanks to xet7.</summary>

Fill 175 English placeholders across five catalogs while preserving existing
translations, source order and exact tokens. Extend checks for restore
boundaries,
protection of the live database file and time units. Four focused catalog suites
and all 21 human-preference checks pass. Other languages and the broader backlog
remain.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/99a066edcb">Translate continuous backup into Afrikaans and Swahili</a>. Thanks to xet7.</summary>

Fill 105 English placeholders across three catalogs while preserving existing
translations, source order and exact tokens. Extend checks for restore
boundaries,
protection of the live database file and time units. Four focused catalog suites
and all 21 human-preference checks pass. Other languages and the broader backlog
remain.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/aaa84eb20d">Translate continuous backup into Bosnian, Serbian and Macedonian</a>. Thanks to xet7.</summary>

Fill 105 English placeholders and correct Macedonian restore and save labels.
Preserve existing correct-language translations, source order and exact tokens.
Extend checks for restore boundaries, protection of the live database file, time
units and language-specific vocabulary and scripts. All 453 translation-related
suites and 21 human-preference checks pass. Other languages and the broader
backlog remain.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b98c118b51">Translate continuous backup into Icelandic and Esperanto</a>. Thanks to xet7.</summary>

Fill 70 English placeholders and correct the Esperanto restore label, which
previously meant remove. Preserve existing correct-language translations, source
order and exact tokens. Extend checks for restore boundaries, protection of the
live database file and time units. Four focused catalog suites and all 21
human-preference checks pass. Other languages and the broader backlog remain.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/7ab10f6783">Translate continuous backup into Albanian</a>. Thanks to xet7.</summary>

Fill 35 English placeholders while preserving existing translations, source
order
and exact tokens. Extend checks for restore boundaries, protection of the live
database file and time units. Four focused catalog suites and all 21
human-preference
checks pass. Other languages and the broader translation backlog remain.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/39181bff0f">Translate continuous backup into Thai</a>. Thanks to xet7.</summary>

Fill 35 English placeholders while preserving existing translations, source
order
and exact tokens. Extend checks for restore boundaries, protection of the live
database file, time units and Thai script. Four focused catalog suites and all
21
human-preference checks pass. Other languages and the broader backlog remain.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e8c5a4eb99">Translate continuous backup into Filipino</a>. Thanks to xet7.</summary>

Fill 35 English placeholders while preserving existing translations, source
order
and exact tokens. Extend checks for restore boundaries, protection of the live
database file and time units. Four focused catalog suites and all 21
human-preference
checks pass. Other languages and the broader translation backlog remain.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/616404a27b">Translate continuous backup into Belarusian</a>. Thanks to xet7.</summary>

Fill 35 English placeholders while preserving existing translations, source
order
and exact tokens. Extend checks for restore boundaries, protection of the live
database file, time units and Belarusian vocabulary and script. Four focused
catalog
suites and all 21 human-preference checks pass. Other languages and the broader
backlog remain.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d82ae06489">Translate continuous backup into Azerbaijani</a>. Thanks to xet7.</summary>

Fill 105 English placeholders across three catalogs while preserving existing
translations, source order and exact tokens. Extend checks for restore
boundaries,
protection of the live database file, time units and Azerbaijani Latin
vocabulary
and script. Four focused catalog suites and all 21 human-preference checks pass.
Other languages and the broader translation backlog remain.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9e6aed230f">Translate continuous backup into Georgian</a>. Thanks to xet7.</summary>

Fill 35 English placeholders while preserving existing translations, source
order
and exact tokens. Extend checks for restore boundaries, protection of the live
database file, time units and Georgian script. Four focused catalog suites and
all
21 human-preference checks pass. Other languages and the broader backlog remain.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/721ab166af">Translate continuous backup into Armenian</a>. Thanks to xet7.</summary>

Fill 35 English placeholders while preserving existing translations, source
order
and exact tokens. Extend checks for restore boundaries, protection of the live
database file, time units and Armenian script. Four focused catalog suites and
all
21 human-preference checks pass. Other languages and the broader backlog remain.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/fac00fabfa">Translate continuous backup into Latin-script Uzbek</a>. Thanks to xet7.</summary>

Fill 105 English placeholders across three catalogs while preserving existing
translations, source order and exact tokens. Extend checks for restore
boundaries,
protection of the live database file, time units and Uzbek Latin vocabulary and
script. Four focused catalog suites and all 21 human-preference checks pass.
Arabic-script Uzbek, other languages and the broader backlog remain.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0c29c7741b">Translate continuous backup into Arabic-script Uzbek</a>. Thanks to xet7.</summary>

Fill 35 English placeholders and replace Latin-script restore and save labels.
Preserve existing correct-script translations, source order and exact tokens.
Use existing catalog vocabulary and the [Uzbek alphabet reference](https://en.wikipedia.org/wiki/Uzbek_alphabet).
Arabic-script Uzbek orthography and technical phrasing are low-confidence and
need
speaker review. Extend checks for restore warnings, time units and Arabic prose
with unchanged technical names. Four focused catalog suites and all 21
human-preference checks pass. Other languages and the broader backlog remain.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ec3daffd13">Translate continuous backup into Kazakh</a>. Thanks to xet7.</summary>

Fill 35 English placeholders while preserving existing translations, source
order
and exact tokens. Extend checks for restore boundaries, protection of the live
database file, time units and Kazakh vocabulary and script. Four focused catalog
suites and all 21 human-preference checks pass. Other languages and the broader
backlog remain.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/31794771b8">Translate continuous backup into Mongolian</a>. Thanks to xet7.</summary>

Fill 35 English placeholders while preserving existing translations, source
order
and exact tokens. Extend checks for restore boundaries, protection of the live
database file, time units and Mongolian vocabulary and script. Four focused
catalog
suites and all 21 human-preference checks pass. Other languages and the broader
backlog remain.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/33a1c73fde">Translate continuous backup into Nepali</a>. Thanks to xet7.</summary>

Fill 35 English placeholders while preserving existing translations, source
order
and exact tokens. Extend checks for restore boundaries, protection of the live
database file, time units and Nepali wording and script. Four focused catalog
suites
and all 21 human-preference checks pass. Other languages and the broader backlog
remain.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0347053458">Translate continuous backup into Marathi</a>. Thanks to xet7.</summary>

Fill 35 English placeholders while preserving existing translations, source
order
and exact tokens. Extend checks for restore boundaries, protection of the live
database file, time units and Devanagari script. Four focused catalog suites and
all
21 human-preference checks pass. Other languages and the broader backlog remain.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/fe0d21aa71">Translate continuous backup into Tamil</a>. Thanks to xet7.</summary>

Fill 35 English placeholders while preserving existing translations, source
order
and exact tokens. Extend checks for restore boundaries, protection of the live
database file, time units and Tamil script. Four focused catalog suites and all
21 human-preference checks pass. Other languages and the broader backlog remain.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b05101709b">Translate continuous backup into Telugu</a>. Thanks to xet7.</summary>

Fill 35 English placeholders while preserving existing translations, source
order
and exact tokens. Extend checks for restore boundaries, protection of the live
database file, time units and Telugu script. Four focused catalog suites and all
21 human-preference checks pass. Other languages and the broader backlog remain.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a32aca0472">Translate continuous backup into Gujarati</a>. Thanks to xet7.</summary>

Fill 35 English placeholders while preserving existing translations, source
order
and exact tokens. Extend checks for restore boundaries, protection of the live
database file, time units and Gujarati script. Four focused catalog suites and
all
21 human-preference checks pass. Other languages and the broader backlog remain.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/00a02a6bcc">Translate continuous backup into Kannada</a>. Thanks to xet7.</summary>

Fill 35 English placeholders while preserving existing translations, source
order
and exact tokens. Extend checks for restore boundaries, protection of the live
database file, time units and Kannada script. Four focused catalog suites and
all
21 human-preference checks pass. Other languages and the broader backlog remain.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/141ee15cfe">Translate continuous backup into Malayalam</a>. Thanks to xet7.</summary>

Fill 35 English placeholders while preserving existing translations, source
order
and exact tokens. Extend checks for restore boundaries, protection of the live
database file, time units and Malayalam script. Four focused catalog suites and
all
21 human-preference checks pass. Other languages and the broader backlog remain.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/db0b3b63ed">Translate continuous backup into Punjabi</a>. Thanks to xet7.</summary>

Fill 35 English placeholders while preserving existing translations, source
order
and exact tokens. Extend checks for restore boundaries, protection of the live
database file, time units and Gurmukhi script. Four focused catalog suites and
all
21 human-preference checks pass. Other languages and the broader backlog remain.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4726c552b2">Translate continuous backup into Sinhala</a>. Thanks to xet7.</summary>

Fill 35 English placeholders while preserving existing translations, source
order
and exact tokens. Extend checks for restore boundaries, protection of the live
database file, time units and Sinhala script. Four focused catalog suites and
all
21 human-preference checks pass. Other languages and the broader backlog remain.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/bc1b8c6022">Translate continuous backup into Irish</a>. Thanks to xet7.</summary>

Fill 35 English placeholders while preserving existing translations, source
order
and exact tokens. Extend checks for restore boundaries, protection of the live
database file and time units. Four focused catalog suites and all 21
human-preference
checks pass. Other languages and the broader translation backlog remain.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/129c14a40d">Translate continuous backup into Welsh</a>. Thanks to xet7.</summary>

Fill 70 English placeholders across two catalogs while preserving existing
translations, source order and exact tokens. Extend checks for restore
boundaries,
protection of the live database file and time units. Four focused catalog suites
and all 21 human-preference checks pass. Other languages and the broader backlog
remain.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/987ba80d35">Translate continuous backup into Luxembourgish</a>. Thanks to xet7.</summary>

Fill 35 English placeholders while preserving existing translations, source
order
and exact tokens. Extend checks for restore boundaries, protection of the live
database file and time units. Four focused catalog suites and all 21
human-preference
checks pass. Other languages and the broader translation backlog remain.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/06f2455b71">Translate continuous backup into Haitian Creole</a>. Thanks to xet7.</summary>

Fill 35 English placeholders while preserving existing translations, source
order
and exact tokens. Extend checks for restore boundaries, protection of the live
database file and time units. Four focused catalog suites and all 21
human-preference
checks pass. Other languages and the broader translation backlog remain.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/802094f95f">Translate continuous backup into Maltese</a>. Thanks to xet7.</summary>

Fill 35 English placeholders while preserving existing translations, source
order
and exact tokens. Extend checks for restore boundaries, protection of the live
database file and time units. Four focused catalog suites and all 21
human-preference
checks pass. Other languages and the broader translation backlog remain.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/6112a4deeb">Translate continuous backup into Kyrgyz</a>. Thanks to xet7.</summary>

Fill 35 English placeholders while preserving existing translations, source
order
and exact tokens. Extend checks for restore boundaries, protection of the live
database file, time units and Kyrgyz vocabulary and script. Four focused catalog
suites and all 21 human-preference checks pass. Other languages and the broader
backlog remain.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5c5d70777a">Translate continuous backup into Tajik</a>. Thanks to xet7.</summary>

Fill 35 English placeholders while preserving existing translations, source
order
and exact tokens. Extend checks for restore boundaries, protection of the live
database file, time units and Tajik vocabulary and script. Four focused catalog
suites and all 21 human-preference checks pass. Other languages and the broader
backlog remain.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f958b1906c">Translate regional continuous backup catalogs</a>. Thanks to xet7.</summary>

Fill 105 English placeholders in Valencian, Slovenian (Slovenia) and Flemish,
using the corresponding existing language translations. Preserve existing
translations, source order and exact tokens. Extend restore protection, pause
and time-unit checks to these catalogs. Four focused catalog suites and all
21 human-preference checks pass. The broader translation backlog remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/151d698c26">Translate continuous backup into Mandarin and Cantonese</a>. Thanks to xet7.</summary>

Fill 70 English placeholders using existing Mandarin terminology and Cantonese
prose. Preserve existing translations, source order and exact tokens. Extend
checks for restore protection, pauses, time units and script. Four focused
catalog suites and all 21 human-preference checks pass. The broader translation
backlog remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/6a07745149">Translate continuous backup into Latin</a>. Thanks to xet7.</summary>

Fill 35 English placeholders and correct four mixed English-Latin backup and
database entries, including archive paths that must remain literal. Extend
restore, time-unit and placeholder checks. Latin technical wording is low
confidence and welcomes review. Four focused catalog suites and all 21
human-preference checks pass. The broader translation backlog remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/6958387809">Translate continuous backup into Somali</a>. Thanks to xet7.</summary>

Fill 35 English placeholders while preserving existing translations, source
order
and exact tokens. Extend restore protection, pause and time-unit checks. Four
focused catalog suites and all 21 human-preference checks pass. The broader
translation backlog remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/6bfbd51680">Translate continuous backup into Javanese</a>. Thanks to xet7.</summary>

Fill 35 English placeholders while preserving existing translations, source
order
and exact tokens. Extend restore protection, pause and time-unit checks. Four
focused catalog suites and all 21 human-preference checks pass. The broader
translation backlog remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3f1e799ee4">Translate continuous backup into Burmese</a>. Thanks to xet7.</summary>

Fill 35 English placeholders while preserving existing translations, source
order
and exact tokens. Extend restore protection, pause, time-unit and Myanmar-script
checks. Four focused catalog suites and all 21 human-preference checks pass.
The broader translation backlog remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/96cbce9647">Translate continuous backup into Khmer</a>. Thanks to xet7.</summary>

Fill 70 English placeholders across two catalogs serving three Khmer locale
tags. Preserve existing translations, source order and exact tokens. Extend
restore protection, pause, time-unit and Khmer-script checks. Four focused
catalog suites and all 21 human-preference checks pass. The broader translation
backlog remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/bb93db32d9">Translate continuous backup into Kurmanji Kurdish</a>. Thanks to xet7.</summary>

Fill 35 English placeholders while preserving existing translations, source
order
and exact tokens. Extend restore protection, pause and time-unit checks. Four
focused catalog suites and all 21 human-preference checks pass. The broader
translation backlog remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/7a2af39083">Translate continuous backup into Central Kurdish</a>. Thanks to xet7.</summary>

Fill 35 English placeholders while preserving existing translations, source
order
and exact tokens. Extend restore protection, pause, time-unit and script checks.
Four focused catalog suites and all 21 human-preference checks pass. The broader
translation backlog remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/6229473b51">Translate continuous backup into Pashto</a>. Thanks to xet7.</summary>

Fill 35 English placeholders while preserving existing translations, source
order
and exact tokens. Extend restore protection, pause, time-unit and script checks.
Four focused catalog suites and all 21 human-preference checks pass. The broader
translation backlog remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/184a2831ea">Translate continuous backup into Sindhi</a>. Thanks to xet7.</summary>

Fill 35 English placeholders while preserving existing translations, source
order
and exact tokens. Extend restore protection, pause, time-unit and script checks.
Four focused catalog suites and all 21 human-preference checks pass. The broader
translation backlog remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c6cf0dcd1e">Translate continuous backup into Assamese</a>. Thanks to xet7.</summary>

Fill 35 English placeholders while preserving existing translations, source
order
and exact tokens. Extend restore protection, pause, time-unit and Assamese
vocabulary and script checks. Four focused catalog suites and all 21
human-preference checks pass. The broader translation backlog remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3730cf0b78">Translate continuous backup into Odia</a>. Thanks to xet7.</summary>

Fill 35 English placeholders while preserving existing translations, source
order
and exact tokens. Extend restore protection, pause, time-unit and Odia-script
checks. Four focused catalog suites and all 21 human-preference checks pass.
The broader translation backlog remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1770725095">Translate continuous backup into Malagasy</a>. Thanks to xet7.</summary>

Fill 35 English placeholders while preserving existing translations, source
order
and exact tokens. Extend restore protection, pause and time-unit checks. Four
focused catalog suites and all 21 human-preference checks pass. The broader
translation backlog remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e219689480">Translate continuous backup into Hausa</a>. Thanks to xet7.</summary>

Fill 35 English placeholders while preserving existing translations, source
order
and exact tokens. Extend restore protection, pause and time-unit checks. Four
focused catalog suites and all 21 human-preference checks pass. The broader
translation backlog remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9e97b25cc8">Translate continuous backup into Yoruba</a>. Thanks to xet7.</summary>

Fill 35 English placeholders while preserving existing translations, source
order
and exact tokens. Extend restore protection, pause and time-unit checks. Four
focused catalog suites and all 21 human-preference checks pass. The broader
translation backlog remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5440418aad">Translate continuous backup into Igbo</a>. Thanks to xet7.</summary>

Fill 35 English placeholders while preserving existing translations, source
order
and exact tokens. Extend restore protection, pause and time-unit checks. Four
focused catalog suites and all 21 human-preference checks pass. The broader
translation backlog remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/bd7ea891a3">Translate continuous backup into Zulu</a>. Thanks to xet7.</summary>

Fill 70 English placeholders across both Zulu catalogs while preserving existing
translations, source order and exact tokens. Extend restore protection, pause
and time-unit checks. Four focused catalog suites and all 21 human-preference
checks pass. The broader translation backlog remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0be8d0f0bf">Translate continuous backup into Xhosa</a>. Thanks to xet7.</summary>

Fill 35 English placeholders while preserving existing translations, source
order
and exact tokens. Extend restore protection, pause and time-unit checks. Four
focused catalog suites and all 21 human-preference checks pass. The broader
translation backlog remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/33f4b4c4ea">Translate continuous backup into Shona</a>. Thanks to xet7.</summary>

Fill 35 English placeholders and correct two mixed English-Shona backup
descriptions. Preserve other existing translations, source order and exact
tokens. Extend restore protection, pause, time-unit and mixed-language checks.
Four focused catalog suites and all 21 human-preference checks pass. The broader
translation backlog remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/74ad0b4d32">Translate continuous backup into Chichewa</a>. Thanks to xet7.</summary>

Fill 35 English placeholders while preserving existing translations, source
order
and exact tokens. Extend restore protection, pause and time-unit checks. Four
focused catalog suites and all 21 human-preference checks pass. The broader
translation backlog remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0f0a2b6686">Translate continuous backup into Kinyarwanda</a>. Thanks to xet7.</summary>

Fill 35 English placeholders while preserving existing translations, source
order
and exact tokens. Extend restore protection, pause and time-unit checks. Four
focused catalog suites and all 21 human-preference checks pass. The broader
translation backlog remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/935318332e">Translate continuous backup into Sesotho</a>. Thanks to xet7.</summary>

Fill 35 English placeholders while preserving existing translations, source
order
and exact tokens. Extend restore protection, pause and time-unit checks. Four
focused catalog suites and all 21 human-preference checks pass. The broader
translation backlog remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e4309b7830">Translate continuous backup into Setswana</a>. Thanks to xet7.</summary>

Fill 35 English placeholders and correct two mixed-language backup descriptions,
restoring literal archive paths. Preserve other existing translations, source
order and exact tokens. Extend restore, pause, time-unit and mixed-language
checks. Four focused catalog suites and all 21 human-preference checks pass.
The broader translation backlog remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e7975747a8">Translate continuous backup into Northern Sotho</a>. Thanks to xet7.</summary>

Fill 35 English placeholders while preserving existing translations, source
order
and exact tokens. Extend restore protection, pause and time-unit checks. Four
focused catalog suites and all 21 human-preference checks pass. The broader
translation backlog remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5e038a35d0">Translate continuous backup into Xitsonga</a>. Thanks to xet7.</summary>

Fill 35 English placeholders and replace three unusable backup entries,
restoring literal archive paths. Xitsonga technical wording is low confidence
and welcomes review. Extend restore, time-unit, placeholder and filler checks.
Four focused catalog suites and all 21 human-preference checks pass. The broader
translation backlog remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/6c053df8dc">Translate continuous backup into Faroese</a>. Thanks to xet7.</summary>

Fill 35 English placeholders while preserving existing translations, source
order
and exact tokens. Extend restore protection, pause and time-unit checks. Four
focused catalog suites and all 21 human-preference checks pass. The broader
translation backlog remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/233bffa16c">Translate continuous backup into Western Frisian</a>. Thanks to xet7.</summary>

Fill 70 English placeholders across both Western Frisian catalogs while
preserving existing translations, source order and exact tokens. Extend restore
protection, pause and time-unit checks. Four focused catalog suites and all 21
human-preference checks pass. The broader translation backlog remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/56cecb3dc2">Translate continuous backup into Occitan</a>. Thanks to xet7.</summary>

Fill 35 English placeholders while preserving existing translations, source
order
and exact tokens. Extend restore protection, pause and time-unit checks. Four
focused catalog suites and all 21 human-preference checks pass. The broader
translation backlog remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/92c7bde8ad">Translate continuous backup into Asturian</a>. Thanks to xet7.</summary>

Fill 35 English placeholders while preserving existing translations, source
order
and exact tokens. Extend restore protection, pause and time-unit checks. Four
focused catalog suites and all 21 human-preference checks pass. The broader
translation backlog remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/681dca02a0">Translate continuous backup into Aragonese</a>. Thanks to xet7.</summary>

Fill 35 English placeholders while preserving existing translations, source
order
and exact tokens. Extend restore protection, pause and time-unit checks. Four
focused catalog suites and all 21 human-preference checks pass. The broader
translation backlog remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/81a5864ee0">Translate continuous backup into Corsican</a>. Thanks to xet7.</summary>

Fill 35 English placeholders and correct the backup label and two descriptions
seeded with Italian, restoring literal archive paths. Preserve other
translations,
source order and exact tokens. Extend restore, time-unit and language checks.
Four focused catalog suites and all 21 human-preference checks pass. The broader
translation backlog remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9fb0ed17e8">Translate continuous backup into Sicilian</a>. Thanks to xet7.</summary>

Fill 35 English placeholders and correct two descriptions seeded with Italian,
restoring literal archive paths. Preserve other translations, source order and
exact tokens. Extend restore, time-unit and language checks. Four focused
catalog
suites and all 21 human-preference checks pass. The broader translation backlog
remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c50458c478">Translate continuous backup into Sardinian</a>. Thanks to xet7.</summary>

Fill 35 English placeholders and correct the backup label and two descriptions
seeded with Italian, restoring literal archive paths. Preserve other
translations,
source order and exact tokens. Extend restore, time-unit and language checks.
Four focused catalog suites and all 21 human-preference checks pass. The broader
translation backlog remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5b1f7956aa">Translate continuous backup into Yiddish</a>. Thanks to xet7.</summary>

Fill 35 English placeholders while preserving existing translations, source
order
and exact tokens. Extend restore protection, pause, time-unit and Yiddish
vocabulary and script checks. Four focused catalog suites and all 21
human-preference checks pass. The broader translation backlog remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/cd485a2d0d">Translate continuous backup into Turkmen</a>. Thanks to xet7.</summary>

Fill 35 English placeholders while preserving existing translations, source
order
and exact tokens. Extend restore protection, pause and time-unit checks. Four
focused catalog suites and all 21 human-preference checks pass. The broader
translation backlog remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ca5af3e3f0">Translate continuous backup into Tatar</a>. Thanks to xet7.</summary>

Fill 35 English placeholders and replace three backup entries seeded with
Turkish
with Tatar, restoring literal archive paths. Preserve other translations, source
order and exact tokens. Extend restore, time-unit, script and vocabulary checks.
Four focused catalog suites and all 21 human-preference checks pass. The broader
translation backlog remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b4eefe5375">Translate continuous backup into Bashkir</a>. Thanks to xet7.</summary>

Fill 35 English placeholders while preserving existing translations, source
order
and exact tokens. Extend restore protection, pause, time-unit and Bashkir
vocabulary and script checks. Four focused catalog suites and all 21
human-preference checks pass. The broader translation backlog remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/14f7e624bc">Translate continuous backup into Moroccan Arabic</a>. Thanks to xet7.</summary>

Fill 35 English placeholders while preserving existing translations, source
order
and exact tokens. Extend restore protection, pause, time-unit and Darija
vocabulary and script checks. Four focused catalog suites and all 21
human-preference checks pass. The broader translation backlog remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/8be81e9218">Translate continuous backup into Bhojpuri</a>. Thanks to xet7.</summary>

Fill 35 English placeholders while preserving existing translations, source
order
and exact tokens. Extend restore protection, pause, time-unit and Bhojpuri
vocabulary and script checks. Four focused catalog suites and all 21
human-preference checks pass. The broader translation backlog remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2b332e7303">Translate continuous backup into Maithili</a>. Thanks to xet7.</summary>

Fill 35 English placeholders while preserving existing translations, source
order
and exact tokens. Extend restore protection, pause, time-unit and Maithili
vocabulary and script checks. Four focused catalog suites and all 21
human-preference checks pass. The broader translation backlog remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/63d8d50e29">Translate continuous backup into Konkani</a>. Thanks to xet7.</summary>

Fill 35 English placeholders while preserving existing translations, source
order
and exact tokens. Extend restore protection, pause, time-unit and Konkani
vocabulary and script checks. Four focused catalog suites and all 21
human-preference checks pass. The broader translation backlog remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2d15d8c586">Translate continuous backup into Tok Pisin</a>. Thanks to xet7.</summary>

Fill 35 English placeholders and correct three mixed-language backup entries,
restoring the literal attachment directory path. Preserve other translations,
source order and exact tokens. Extend restore, time-unit and mixed-language
checks.
Four focused catalog suites and all 21 human-preference checks pass. The broader
translation backlog remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/840f7292d6">Translate continuous backup into Bislama</a>. Thanks to xet7.</summary>

Fill 35 English placeholders and correct three mixed-language backup strings,
including the literal attachment path. Preserve other existing translations,
source order and exact tokens. Extend restore protection, pause and time-unit
checks. Four focused catalog suites and all 21 human-preference checks pass.
Technical wording is low confidence and needs native-speaker review. The broader
translation backlog remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5b970935be">Translate continuous backup into Māori</a>. Thanks to xet7.</summary>

Fill 35 English placeholders while preserving existing translations, source
order
and exact tokens. Extend restore protection, pause and time-unit checks. Four
focused catalog suites and all 21 human-preference checks pass. The broader
translation backlog remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4a3be1914a">Translate continuous backup into Hawaiian</a>. Thanks to xet7.</summary>

Fill 35 English placeholders and replace two garbled backup descriptions,
restoring literal paths and product names. Preserve other existing translations,
source order and exact tokens. Extend restore protection, pause, time-unit and
literal preservation checks. Four focused catalog suites and all 21
human-preference checks pass. Technical wording is low confidence and needs
native-speaker review. The broader translation backlog remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/74b1b6c213">Translate continuous backup into Samoan</a>. Thanks to xet7.</summary>

Fill 35 English placeholders while preserving existing translations, source
order
and exact tokens. Extend restore protection, pause and time-unit checks. Four
focused catalog suites and all 21 human-preference checks pass. Technical
wording
is low confidence and needs native-speaker review. The broader translation
backlog
remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/72ba07424d">Translate continuous backup into Scottish Gaelic</a>. Thanks to xet7.</summary>

Fill 35 English placeholders while preserving existing translations, source
order
and exact tokens. Extend restore protection, pause and time-unit checks. Four
focused catalog suites and all 21 human-preference checks pass. The broader
translation backlog remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b68a3fc363">Translate continuous backup into Breton</a>. Thanks to xet7.</summary>

Fill 35 English placeholders while preserving existing translations, source
order
and exact tokens. Extend restore protection, pause and time-unit checks. Four
focused catalog suites and all 21 human-preference checks pass. Technical
wording
is low confidence and needs native-speaker review. The broader translation
backlog
remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f513ca89bc">Translate continuous backup into Romansh</a>. Thanks to xet7.</summary>

Fill 35 English placeholders and correct an Italian backup label and a
mixed-language restore prompt. Preserve other existing translations, source
order
and exact tokens. Extend restore protection, pause, time-unit and language
checks.
Four focused catalog suites and all 21 human-preference checks pass. Technical
wording is low confidence and needs native-speaker review. The broader
translation
backlog remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f289cab5a1">Translate continuous backup into Friulian and Venetian</a>. Thanks to xet7.</summary>

Fill 70 English placeholders, correct three Italian-seeded Friulian strings and
restore literal paths in both catalogs. Preserve other existing translations,
source order and exact tokens. Extend restore protection, pause, time-unit and
language checks. Four focused catalog suites and all 21 human-preference checks
pass. Technical wording in both languages is low confidence and needs
native-speaker review. The broader translation backlog remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ca891bdbf9">Translate continuous backup into Amharic</a>. Thanks to xet7.</summary>

Fill 35 English placeholders while preserving existing translations, source
order
and exact tokens. Extend restore protection, pause, time-unit and Ethiopic
script
checks. Four focused catalog suites and all 21 human-preference checks pass. The
broader translation backlog remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3314b5ea3a">Translate continuous backup into Uyghur</a>. Thanks to xet7.</summary>

Fill 35 English placeholders while preserving existing translations, source
order
and exact tokens. Extend restore protection, pause, time-unit, script and
vocabulary checks. Four focused catalog suites and all 21 human-preference
checks
pass. The broader translation backlog remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/cf89384cce">Translate continuous backup into Wu Chinese</a>. Thanks to xet7.</summary>

Fill 35 English placeholders and replace two Mandarin-seeded backup descriptions
with Wu wording. Preserve other translations, literal paths, source order and
exact tokens. Extend restore protection, pause, time-unit, script and vocabulary
checks. All 453 translation-related suites and 21 human-preference checks pass.
Technical wording is low confidence and needs native-speaker review. There are
still 46 locales with English continuous-backup placeholders, and the broader
translation backlog remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/67eaefadc3">Translate continuous backup into Oromo</a>. Thanks to xet7.</summary>

Fill 35 English placeholders while preserving existing translations, source
order
and exact tokens. Extend restore protection, pause and time-unit checks. Four
focused catalog suites and all 21 human-preference checks pass. Technical
wording
is low confidence and needs native-speaker review. The broader translation
backlog
remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e95f15b2b4">Translate continuous backup into Kirundi</a>. Thanks to xet7.</summary>

Fill 35 English placeholders while preserving existing translations, source
order
and exact tokens. Extend restore protection, pause, time-unit and vocabulary
checks. Four focused catalog suites and all 21 human-preference checks pass.
Technical wording is low confidence and needs native-speaker review. The broader
translation backlog remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d8ff82ace9">Translate continuous backup into Swati</a>. Thanks to xet7.</summary>

Fill 35 English placeholders while preserving existing translations, source
order
and exact tokens. Extend restore protection, pause, time-unit and vocabulary
checks. Four focused catalog suites and all 21 human-preference checks pass.
Technical wording is low confidence and needs native-speaker review. The broader
translation backlog remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/8f9df578ee">Translate continuous backup into Northern Ndebele</a>. Thanks to xet7.</summary>

Fill 35 English placeholders while preserving existing translations, source
order
and exact tokens. Extend restore protection, pause, time-unit and vocabulary
checks. Four focused catalog suites and all 21 human-preference checks pass.
Technical wording is low confidence and needs native-speaker review. The broader
translation backlog remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/039ff6ac25">Translate continuous backup into Upper Sorbian</a>. Thanks to xet7.</summary>

Fill 35 English placeholders and replace three Czech-seeded backup strings,
restoring literal attachment and avatar paths. Preserve other translations,
source order and exact tokens. Extend restore protection, pause, time-unit and
language checks. Four focused catalog suites and all 21 human-preference checks
pass. Technical wording is low confidence and needs native-speaker review. The
broader translation backlog remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/7b8c3d33a5">Translate continuous backup into Papiamento</a>. Thanks to xet7.</summary>

Fill 35 English placeholders and correct two Spanish-mixed backup descriptions,
restoring the literal avatar path. Preserve other translations, source order and
exact tokens. Extend restore protection, pause, time-unit and language checks.
Four focused catalog suites and all 21 human-preference checks pass. Technical
wording is low confidence and needs native-speaker review. The broader
translation
backlog remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c91a2b81e3">Translate continuous backup into Waray</a>. Thanks to xet7.</summary>

Fill 35 English placeholders and replace a Walloon backup label in the Waray
catalog. Preserve other translations, source order and exact tokens. Extend
restore protection, pause, time-unit and vocabulary checks. Four focused catalog
suites and all 21 human-preference checks pass. Technical wording is low
confidence
and needs native-speaker review. The broader translation backlog remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d623339a94">Translate continuous backup into Silesian</a>. Thanks to xet7.</summary>

Fill 35 English placeholders and correct two Polish-mixed backup descriptions,
restoring the literal data path. Preserve other translations, source order and
exact tokens. Extend restore protection, pause, time-unit and language checks.
Four focused catalog suites and all 21 human-preference checks pass. Technical
wording is low confidence and needs native-speaker review. The broader
translation
backlog remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ad6576e06a">Translate continuous backup into Kashubian</a>. Thanks to xet7.</summary>

Fill 35 English placeholders while preserving existing translations, source
order
and exact tokens. Extend restore protection, pause, time-unit and vocabulary
checks. Four focused catalog suites and all 21 human-preference checks pass.
Technical wording is low confidence and needs native-speaker review. The broader
translation backlog remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/fa3b47bec5">Translate continuous backup into Fijian</a>. Thanks to xet7.</summary>

Fill 35 English placeholders while preserving existing translations, source
order
and exact tokens. Extend restore protection, pause and time-unit checks. Four
focused catalog suites and all 21 human-preference checks pass. Technical
wording
is low confidence and needs native-speaker review. The broader translation
backlog
remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1138fbebde">Translate continuous backup into Tongan</a>. Thanks to xet7.</summary>

Fill 35 English placeholders and replace three English-filled backup strings,
restoring the literal attachment path. Preserve other translations, source order
and exact tokens. Extend restore protection, pause, time-unit and language
checks.
Four focused catalog suites and all 21 human-preference checks pass. Technical
wording is low confidence and needs native-speaker review. The broader
translation
backlog remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b42e466ec4">Translate continuous backup into Luganda</a>. Thanks to xet7.</summary>

Fill 35 English placeholders and correct two mixed-English backup descriptions,
restoring literal paths. Preserve other translations, source order and exact
tokens. Extend restore protection, pause, time-unit and language checks. Four
focused catalog suites and all 21 human-preference checks pass.
Continuous-backup
coverage now includes 200 locale tags. Technical wording is low confidence and
needs native-speaker review. The broader translation backlog remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/648da9becb">Translate continuous backup into Wolof</a>. Thanks to xet7.</summary>

Fill 35 English placeholders while preserving existing translations, source
order
and exact tokens. Extend restore protection, pause and time-unit checks. Five
focused catalog suites and all 21 human-preference checks pass. Technical
wording
is low confidence and needs native-speaker review. The broader translation
backlog
remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e47be629cf">Translate continuous backup into Akan</a>. Thanks to xet7.</summary>

Fill 35 English placeholders and correct three unrelated or mixed-language
backup
entries. Preserve other translations, source order, exact tokens and literal
paths.
Extend restore protection, pause and time-unit checks. Four focused catalog
suites
and all 21 human-preference checks pass. Technical Akan wording is low
confidence
and needs native-speaker review. The broader translation backlog remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/dc9cc10eb8">Translate continuous backup into Manx</a>. Thanks to xet7.</summary>

Fill 35 English placeholders while preserving existing translations, source
order
and exact tokens. Extend restore protection, pause and time-unit checks. Four
focused catalog suites and all 21 human-preference checks pass. Technical Manx
wording is low confidence and needs native-speaker review. The broader
translation
backlog remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a72db81500">Translate continuous backup into Walloon</a>. Thanks to xet7.</summary>

Fill 35 English placeholders while preserving existing translations, source
order
and exact tokens. Extend restore protection, pause and time-unit checks. Four
focused catalog suites and all 21 human-preference checks pass. Technical
Walloon
wording is low confidence and needs native-speaker review. The broader
translation
backlog remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1273a56107">Translate continuous backup into Cornish</a>. Thanks to xet7.</summary>

Fill 35 English placeholders while preserving existing translations, source
order
and exact tokens. Extend restore protection, pause and time-unit checks. Four
focused catalog suites and all 21 human-preference checks pass. Technical
Cornish
wording is low confidence and needs native-speaker review. The broader
translation
backlog remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0fa69a93cd">Translate continuous backup into Ewe</a>. Thanks to xet7.</summary>

Fill 35 English placeholders while preserving existing translations, source
order
and exact tokens. Extend restore protection, pause and time-unit checks. Four
focused catalog suites and all 21 human-preference checks pass. Technical Ewe
wording is low confidence and needs native-speaker review. The broader
translation
backlog remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d947e159f9">Translate continuous backup into Neapolitan</a>. Thanks to xet7.</summary>

Fill 35 English placeholders and correct three Italian-seeded backup entries,
restoring literal archive paths. Preserve other translations, source order and
exact tokens. Extend restore protection, pause, path and time-unit checks. Four
focused catalog suites and all 21 human-preference checks pass. Technical
Neapolitan wording is low confidence and needs native-speaker review. The
broader
translation backlog remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0e6c59c0ff">Translate continuous backup into Acehnese</a>. Thanks to xet7.</summary>

Fill 35 English placeholders while preserving existing translations, source
order
and exact tokens. Extend restore protection, pause and time-unit checks. Four
focused catalog suites and all 21 human-preference checks pass. Technical
Acehnese
wording is low confidence and needs native-speaker review. The broader
translation
backlog remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d6d94565f9">Translate continuous backup into Bambara</a>. Thanks to xet7.</summary>

Fill 35 English placeholders while preserving existing translations, source
order
and exact tokens. Extend restore protection, pause and time-unit checks. Four
focused catalog suites and all 21 human-preference checks pass. Technical
Bambara
wording is low confidence and needs native-speaker review. The broader
translation
backlog remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2433d74808">Translate continuous backup into Aymara</a>. Thanks to xet7.</summary>

Fill 35 English placeholders and correct three English-filled backup entries.
Preserve other translations, source order, exact tokens and literal paths.
Extend
restore protection, pause, path and time-unit checks. Four focused catalog
suites
and all 21 human-preference checks pass. Technical Aymara wording is low
confidence
and needs native-speaker review. The broader translation backlog remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/db0fc01c23">Translate continuous backup into Quechua</a>. Thanks to xet7.</summary>

Fill 35 English placeholders and replace three English-filled backup entries,
restoring literal paths and product names. Preserve other translations, source
order and exact tokens. Extend restore protection, pause, path and time-unit
checks. Four focused catalog suites and all 21 human-preference checks pass.
Technical Quechua wording is low confidence and needs native-speaker review.
The broader translation backlog remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/510acf1534">Translate continuous backup into Guarani</a>. Thanks to xet7.</summary>

Fill 35 English placeholders while preserving existing translations, source
order
and exact tokens. Extend restore protection, pause and time-unit checks. Four
focused catalog suites and all 21 human-preference checks pass. Technical
Guarani
wording is low confidence and needs native-speaker review. The broader
translation
backlog remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4fffb197c9">Translate continuous backup into Northern Sami</a>. Thanks to xet7.</summary>

Fill 35 English placeholders while preserving existing translations, source
order
and exact tokens. Extend restore protection, pause and time-unit checks. Four
focused catalog suites and all 21 human-preference checks pass. Technical
Northern
Sami wording is low confidence and needs native-speaker review. The broader
translation backlog remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a8dc027ab0">Translate continuous backup into Venda</a>. Thanks to xet7.</summary>

Fill 35 English placeholders while preserving existing translations, source
order
and exact tokens. Extend restore protection, pause and time-unit checks. Four
focused catalog suites and all 21 human-preference checks pass. Technical Venda
wording is low confidence and needs native-speaker review. The broader
translation
backlog remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4bec74b515">Translate continuous backup into Tibetan</a>. Thanks to xet7.</summary>

Fill 35 English placeholders while preserving existing translations, source
order
and exact tokens. Extend script, restore protection, pause and time-unit checks.
Four focused catalog suites and all 21 human-preference checks pass. Technical
Tibetan wording is low confidence and needs native-speaker review. The broader
translation backlog remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/44caedf466">Translate continuous backup into Dzongkha</a>. Thanks to xet7.</summary>

Fill 35 English placeholders and replace three Tibetan-seeded backup entries.
Preserve other translations, source order, exact tokens and literal paths.
Extend
vocabulary, script, restore protection, pause and time-unit checks. Four focused
catalog suites and all 21 human-preference checks pass. Technical Dzongkha
wording
is low confidence and needs native-speaker review. The broader translation
backlog
remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/8f442d76bf">Translate continuous backup into Buryat</a>. Thanks to xet7.</summary>

Fill 35 English placeholders while preserving existing translations, source
order
and exact tokens. Extend vocabulary, script, restore protection, pause and
time-unit
checks. Four focused catalog suites and all 21 human-preference checks pass.
Technical Buryat wording is low confidence and needs native-speaker review.
The broader translation backlog remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/efee605f91">Translate continuous backup into Chuvash</a>. Thanks to xet7.</summary>

Fill 35 English placeholders while preserving existing translations, source
order
and exact tokens. Extend vocabulary, script, restore protection, pause and
time-unit
checks. Four focused catalog suites and all 21 human-preference checks pass.
Technical Chuvash wording is low confidence and needs native-speaker review.
The broader translation backlog remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/cd4c36d766">Translate continuous backup into Sakha</a>. Thanks to xet7.</summary>

Fill 35 English placeholders and correct three misleading backup entries.
Preserve other translations, source order, exact tokens and literal paths.
Extend
vocabulary, script, restore protection, pause and time-unit checks. Four focused
catalog suites and all 21 human-preference checks pass. Technical Sakha wording
is low confidence and needs native-speaker review. The broader translation
backlog
remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/dcc9c2a818">Translate continuous backup into Tigrinya</a>. Thanks to xet7.</summary>

Fill 35 English placeholders while preserving existing translations, source
order
and exact tokens. Extend vocabulary, script, restore protection, pause and
time-unit
checks. All 453 translation-related suites and 21 human-preference checks pass.
Technical Tigrinya wording is low confidence and needs native-speaker review.
Fourteen locales still have English continuous-backup strings, and the broader
translation backlog remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2905e50eef">Translate continuous backup into Ladin</a>. Thanks to xet7.</summary>

Fill 35 English placeholders and correct three Italian-seeded backup entries,
restoring literal archive paths. Preserve other translations, source order and
exact tokens. Extend restore protection, pause, path and time-unit checks. Four
focused catalog suites and all 21 human-preference checks pass. Technical Ladin
wording is low confidence and needs native-speaker review. The broader
translation
backlog remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3871edb26e">Translate continuous backup into Aromanian</a>. Thanks to xet7.</summary>

Fill 35 English placeholders and correct two Romanian-seeded backup
descriptions.
Preserve other translations, source key order, exact placeholders and literal
paths.
Extend restore safeguard, pause, time-unit, vocabulary and description
regression
checks. Four focused catalog suites and all 21 human-preference checks pass.
Technical Aromanian wording is low confidence and needs native-speaker review.
The broader translation backlog remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c12b4dbf5c">Translate continuous backup into Klingon</a>. Thanks to xet7.</summary>

Fill 35 English placeholders, translate the English prose in two older backup
descriptions and correct the backup label. Preserve other translations, source
key order, exact placeholders and literal paths. Extend restore safeguard,
pause,
time-unit, vocabulary and description regression checks. Four focused catalog
suites and all 21 human-preference checks pass. Technical Klingon wording is low
confidence and needs fluent-speaker review. Eleven locales still have English
continuous-backup strings, and the broader translation backlog remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d236618682">Translate continuous backup and mixed-language entries into Veps</a>. Thanks to xet7.</summary>

Fill 35 English backup placeholders and replace 15 Venda, Zulu or mixed-language
timeline, role-status and error entries with Veps. Preserve other Veps
translations,
source key order and exact placeholders. Extend restore safeguard, pause,
time-unit,
vocabulary and wrong-language regression checks. All 453 translation-related
suites
and all 21 human-preference checks pass. Technical Veps wording is low
confidence
and needs native-speaker review. Ten locales still have English
continuous-backup
strings, and the broader translation backlog remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3baae544b6">Translate continuous backup into Volapük</a>. Thanks to xet7.</summary>

Fill 35 English placeholders, replace two mixed-language backup descriptions and
correct the Esperanto delete label in the restore control. Preserve other
translations, source key order, exact placeholders and literal paths. Extend
restore safeguard, pause, time-unit, vocabulary and description regression
checks.
Four focused catalog suites and all 21 human-preference checks pass. Technical
Volapük wording is low confidence and needs fluent-speaker review. Nine locales
still have English continuous-backup strings, and the broader translation
backlog remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e22954f525">Translate continuous backup into Kashmiri</a>. Thanks to xet7.</summary>

Fill 35 English placeholders while preserving existing translations, source key
order and exact placeholders. Extend restore safeguard, pause, time-unit, Arabic
script and Kashmiri vocabulary regression checks. Four focused catalog suites
and all 21 human-preference checks pass. Technical Kashmiri wording is low
confidence and needs native-speaker review. Eight locales still have English
continuous-backup strings, and the broader translation backlog remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/46445df7ab">Translate continuous backup into Fulah</a>. Thanks to xet7.</summary>

Fill 35 English placeholders while preserving existing translations, source key
order and exact placeholders. Extend restore safeguard, pause, time-unit and
Fulah vocabulary regression checks. Four focused catalog suites and all 21
human-preference checks pass. Technical Fulah wording is low confidence and
needs
native-speaker review. Seven locales still have English continuous-backup
strings,
and the broader translation backlog remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0768853703">Translate continuous backup into Greenlandic</a>. Thanks to xet7.</summary>

Fill 35 English placeholders and replace English fragments in the older backup
description. Preserve other translations, source key order, exact placeholders
and literal paths. Extend restore safeguard, pause, time-unit, vocabulary and
description regression checks. Four focused catalog suites and all 21
human-preference checks pass. Technical Greenlandic wording is low confidence
and needs native-speaker review. Six locales still have English
continuous-backup
strings, and the broader translation backlog remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/962f200230">Translate continuous backup into Nahuatl</a>. Thanks to xet7.</summary>

Fill 35 English placeholders while preserving existing translations, source key
order and exact placeholders. Extend restore safeguard, pause, time-unit and
Nahuatl vocabulary regression checks. Four focused catalog suites and all 21
human-preference checks pass. Technical Nahuatl wording is low confidence and
needs
native-speaker review. Five locales still have English continuous-backup
strings,
and the broader translation backlog remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/bf6c8d694b">Translate the SQLite restart restore option into 106 locale variants</a>. Thanks to xet7.</summary>

Translate the next-restart timing and retention of the replaced database in 105
catalog files serving 106 locale variants. Preserve all existing values, exact
source placeholders and relative source key order. All 106 batch audits and 21
human-preference checks pass, as do the board-link and language-wiring suites.
Catalog completeness and continuous-backup suites still fail: the remaining
locales need the restart option, and new encryption labels also need
translation.
The broader translation backlog remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3e5980d394">Translate backup encryption options into 106 locale variants</a>. Thanks to xet7.</summary>

Translate both encryption labels in 105 catalog files serving 106 locale
variants.
Preserve the AES-256-GCM name, hexadecimal key length of 64 characters, minimum
passphrase length of 16 characters, external key-file location and warning that
the backup cannot be restored without the key. Add token, key-format and warning
regression checks. All 106 preservation audits, three focused suites and 21
human-preference checks pass. Global completeness and backup suites still report
remaining untranslated locales and newly added cloud labels. The broader
translation backlog remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0440ff83f6">Translate cloud backup labels into 106 locale variants</a>. Thanks to xet7.</summary>

Translate five cloud upload and fetch labels in 105 catalog files serving 106
locale variants. Preserve existing values, source key order and exact
placeholders.
Add regression checks for local-only upload and the distinction between fetching
files and confirming a completed fetch. All 106 preservation audits, four
focused
suites and 21 human-preference checks pass. Global catalog completeness and
continuous-backup suites still report untranslated locales outside this batch.
The broader translation backlog remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/27995bbf0d">Translate new backup options into 14 more locale variants</a>. Thanks to xet7.</summary>

Add 112 restart, encryption and cloud translations for Irish, Welsh,
Luxembourgish,
Maltese, Faroese, Frisian, Occitan, Asturian, Aragonese, Corsican, Sicilian and
Sardinian, including Welsh and Frisian variants. Preserve existing translations,
source key order and exact placeholders. Extend encryption and cloud regression
coverage. All batch audits, four focused suites and 21 human-preference checks
pass. Technical Faroese, Occitan, Asturian, Aragonese, Corsican, Sicilian and
Sardinian wording is low confidence and needs fluent-speaker review. Remaining
locales and the broader translation backlog are unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/84f76711df">Translate new backup options into ten more locale variants</a>. Thanks to xet7.</summary>

Add 80 restart, encryption and cloud translations for Latin-script Uzbek
variants,
Kazakh, Kyrgyz, Tajik, Mongolian, Turkmen, Tatar and Bashkir. Preserve existing
values, relative source key order and exact placeholders. Extend script,
vocabulary and encryption/cloud regression coverage. All batch audits, four
focused suites and 21 human-preference checks pass. Technical Turkmen, Tatar and
Bashkir wording is low confidence and needs native-speaker review. The restart
option still needs translation in 104 locales; the broader translation backlog
remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e03acc19a9">Translate new backup options into Nepali and Marathi</a>. Thanks to xet7.</summary>

Add 16 restart, encryption and cloud translations. Preserve existing values,
relative source key order and exact placeholders. Extend encryption and cloud
regression coverage to both locales. Exact-change and Devanagari-script audits,
four focused suites and all 21 human-preference checks pass. Remaining locales
and the broader translation backlog are unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d5048ab010">Translate new backup options into Tamil and Telugu</a>. Thanks to xet7.</summary>

Add 16 restart, encryption and cloud translations. Preserve existing values,
relative source key order and exact placeholders. Extend encryption and cloud
regression coverage to both locales. Exact-change and locale-script audits,
four focused suites and all 21 human-preference checks pass. Remaining locales
and the broader translation backlog are unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c2ee430b0c">Translate new backup options into Gujarati and Kannada</a>. Thanks to xet7.</summary>

Add 16 restart, encryption and cloud translations. Preserve existing values,
relative source key order and exact placeholders. Extend encryption and cloud
regression coverage to both locales. Exact-change and locale-script audits,
four focused suites and all 21 human-preference checks pass. Remaining locales
and the broader translation backlog are unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/7d3a8e1963">Translate new backup options into Malayalam and Punjabi</a>. Thanks to xet7.</summary>

Add 16 restart, encryption and cloud translations. Preserve existing values,
relative source key order and exact placeholders. Extend encryption and cloud
regression coverage to both locales. Exact-change and locale-script audits,
four focused suites and all 21 human-preference checks pass. Remaining locales
and the broader translation backlog are unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/44d415a58f">Translate new backup options into Sinhala and Assamese</a>. Thanks to xet7.</summary>

Add 16 restart, encryption and cloud translations. Preserve existing values,
relative source key order and exact placeholders. Extend encryption and cloud
regression coverage to both locales. Exact-change and locale-script audits,
four focused suites and all 21 human-preference checks pass. Remaining locales
and the broader translation backlog are unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/877e56a736">Translate new backup options into Haitian Creole and Somali</a>. Thanks to xet7.</summary>

Add 16 restart, encryption and cloud translations. Preserve existing values,
relative source key order and exact placeholders. Extend encryption and cloud
regression coverage to both locales. All batch audits, four focused suites and
all 21 human-preference checks pass. Remaining locales and the broader
translation backlog are unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/cf9548c6cc">Translate new backup options into Javanese and Malagasy</a>. Thanks to xet7.</summary>

Add 16 restart, encryption and cloud translations. Preserve existing values,
relative source key order and exact placeholders. Extend encryption and cloud
regression coverage to both locales. All batch audits, four focused suites and
all 21 human-preference checks pass. Technical Malagasy wording is low
confidence
and needs native-speaker review. Remaining locales and the broader translation
backlog are unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c938c61621">Translate new backup options into Hausa</a>. Thanks to xet7.</summary>

Add eight restart, encryption and cloud translations. Preserve existing values,
relative source key order and exact placeholders. Extend encryption and cloud
regression coverage. All batch audits, four focused suites and all 21
human-preference checks pass. Technical Hausa wording is low confidence and
needs
native-speaker review. Remaining locales and the broader translation backlog are
unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0f4bad5666">Translate new backup options into Yoruba</a>. Thanks to xet7.</summary>

Add eight restart, encryption and cloud translations. Preserve existing values,
relative source key order and exact placeholders. Extend encryption and cloud
regression coverage. All batch audits, four focused suites and all 21
human-preference checks pass. Technical Yoruba wording is low confidence and
needs
native-speaker review. Remaining locales and the broader translation backlog are
unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/fe47e74826">Translate new backup options into Khmer and Burmese</a>. Thanks to xet7.</summary>

Add eight encryption, cloud and restart options to each of three catalogs,
including both Khmer catalogs and their existing alias. Preserve existing
translations, relative source key order and exact placeholders. Extend
encryption
and cloud regression coverage. Four focused suites, all 21 human-preference
checks
and the batch preservation audits pass. Technical terminology needs
native-speaker
review. Remaining locales and the broader translation backlog are unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4d0e3df0b0">Translate new backup options into Cantonese and Wu Chinese</a>. Thanks to xet7.</summary>

Add eight encryption, cloud and restart options to each locale, using its
existing
terminology. Preserve existing translations, relative source key order and exact
placeholders. Extend encryption and cloud regression coverage. Four focused
suites,
all 21 human-preference checks and both batch preservation audits pass. Wu
technical
wording is low confidence and needs native-speaker review. Remaining locales and
the broader translation backlog are unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a4988e8e44">Translate new backup options into Kurdish and Pashto</a>. Thanks to xet7.</summary>

Add eight encryption, cloud and restart options each for Kurmanji, Sorani and
Pashto. Preserve existing translations, relative source key order and exact
placeholders. Extend encryption and cloud regression coverage. Four focused
suites,
all 21 human-preference checks and three batch preservation audits pass.
Technical
terminology is low confidence and needs native-speaker review. Remaining locales
and the broader translation backlog are unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/04ebdd1484">Translate new backup options into Māori and Hawaiian</a>. Thanks to xet7.</summary>

Add eight encryption, cloud and restart options to each locale. Preserve
existing
translations, relative source key order and exact placeholders. Extend
encryption
and cloud regression coverage. Four focused suites, all 21 human-preference
checks
and both batch preservation audits pass. Hawaiian technical wording is low
confidence and needs native-speaker review. Remaining locales and the broader
translation backlog are unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/bdd3ed15c1">Translate new backup options into Romansh and Latin</a>. Thanks to xet7.</summary>

Add eight encryption, cloud and restart options to each locale. Preserve
existing
translations, relative source key order and exact placeholders. Extend
encryption
and cloud regression coverage. Four focused suites, all 21 human-preference
checks
and both batch preservation audits pass. Technical terminology is low confidence
and needs language review. Remaining locales and the broader translation backlog
are unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/81d0ed7290">Translate new backup options into Chichewa and Shona</a>. Thanks to xet7.</summary>

Add eight encryption, cloud and restart options to each locale. Preserve
existing
translations, relative source key order and exact placeholders. Extend
encryption
and cloud regression coverage. Four focused suites, all 21 human-preference
checks
and both batch preservation audits pass. Technical terminology is low confidence
and needs native-speaker review. Remaining locales and the broader translation
backlog are unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4e0970f6ba">Translate backup options into hiragana Japanese, Sindhi and Uyghur</a>. Thanks to xet7.</summary>

Add eight encryption, cloud and restart options to each locale. Preserve
existing
translations, relative source key order and exact placeholders. Extend
encryption
and cloud coverage with hiragana and Arabic-script checks. Four focused suites,
all 21 human-preference checks and three batch preservation audits pass. Sindhi
and Uyghur technical terminology is low confidence and needs native-speaker
review.
Remaining locales and the broader translation backlog are unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/6d025c2285">Translate new backup options into Scottish Gaelic and Breton</a>. Thanks to xet7.</summary>

Add eight encryption, cloud and restart options to each locale. Preserve
existing
translations, relative source key order and exact placeholders. Extend
encryption
and cloud regression coverage. Four focused suites, all 21 human-preference
checks
and both batch preservation audits pass. Technical terminology is low confidence
and needs native-speaker review. Remaining locales and the broader translation
backlog are unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/8533d541eb">Translate new backup options into Xhosa and Zulu</a>. Thanks to xet7.</summary>

Add eight encryption, cloud and restart options to Xhosa and both Zulu catalogs.
Preserve existing translations, relative source key order and exact
placeholders.
Extend encryption and cloud regression coverage. Four focused suites, all 21
human-preference checks and three batch preservation audits pass. Technical
terminology is low confidence and needs native-speaker review. Remaining locales
and the broader translation backlog are unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/188811a80a">Translate new backup options into Papiamento and Tok Pisin</a>. Thanks to xet7.</summary>

Add eight encryption, cloud and restart options to each locale. Preserve
existing
translations, relative source key order and exact placeholders. Extend
encryption
and cloud regression coverage. Four focused suites, all 21 human-preference
checks
and both batch preservation audits pass. Technical terminology is low confidence
and needs native-speaker review. Remaining locales and the broader translation
backlog are unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/7925e948f0">Translate new backup options into Kinyarwanda and Kirundi</a>. Thanks to xet7.</summary>

Add eight encryption, cloud and restart options to each locale. Preserve
existing
translations, relative source key order and exact placeholders. Extend
encryption
and cloud regression coverage. Four focused suites, all 21 human-preference
checks
and both batch preservation audits pass. Technical terminology is low confidence
and needs native-speaker review. Remaining locales and the broader translation
backlog are unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c49ca284e6">Translate new backup options into Sesotho and Setswana</a>. Thanks to xet7.</summary>

Add eight encryption, cloud and restart options to each locale. Preserve
existing
translations, relative source key order and exact placeholders. Extend
encryption
and cloud regression coverage. Four focused suites, all 21 human-preference
checks
and both batch preservation audits pass. Technical terminology is low confidence
and needs native-speaker review. Remaining locales and the broader translation
backlog are unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/cfc0c14e47">Translate new backup options into Odia, Bhojpuri and Maithili</a>. Thanks to xet7.</summary>

Add eight encryption, cloud and restart options to each locale. Preserve
existing
translations, relative source key order and exact placeholders. Extend
encryption
and cloud regression coverage. Four focused suites, all 21 human-preference
checks
and three preservation, script and placeholder audits pass. Technical
terminology
needs native-speaker review, particularly the lower-confidence Odia wording.
Remaining locales and the broader translation backlog are unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ef07d8f6b4">Translate new backup options into Moroccan Arabic and Yiddish</a>. Thanks to xet7.</summary>

Add eight encryption, cloud and restart options to each locale. Preserve
existing
translations, relative source key order and exact placeholders. Extend
encryption
and cloud regression coverage. Four focused suites, all 21 human-preference
checks
and both preservation, script and placeholder audits pass. Technical terminology
needs native-speaker review, particularly the lower-confidence Yiddish wording.
Remaining locales and the broader translation backlog are unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/827e5026b6">Translate new backup options into Igbo and Amharic</a>. Thanks to xet7.</summary>

Add eight encryption, cloud and restart options to each locale. Preserve
existing
translations, relative source key order and exact placeholders. Extend
encryption
and cloud regression coverage. Four focused suites, all 21 human-preference
checks
and both batch preservation audits pass; Amharic script was checked. Technical
terminology is low confidence and needs native-speaker review. Remaining locales
and the broader translation backlog are unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/925cacf5ba">Translate new backup options into Friulian and Neapolitan</a>. Thanks to xet7.</summary>

Add eight encryption, cloud and restart options to each locale. Preserve
existing
translations, relative source key order and exact placeholders. Extend
encryption
and cloud regression coverage. Four focused suites, all 21 human-preference
checks
and both batch preservation audits pass. Technical terminology is low confidence
and needs native-speaker review. Remaining locales and the broader translation
backlog are unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/afa162da6e">Translate new backup options into Samoan and Tongan</a>. Thanks to xet7.</summary>

Add eight encryption, cloud and restart options to each locale. Preserve
existing
translations, relative source key order and exact placeholders. Extend
encryption
and cloud regression coverage. Four focused suites, all 21 human-preference
checks
and both batch preservation audits pass. Technical terminology is low confidence
and needs native-speaker review. Remaining locales and the broader translation
backlog are unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/17279b2a77">Translate new backup options into Bislama and Fijian</a>. Thanks to xet7.</summary>

Add eight encryption, cloud and restart options to each locale. Preserve
existing
translations, relative source key order and exact placeholders. Extend
encryption
and cloud regression coverage. Four focused suites, all 21 human-preference
checks
and both batch preservation audits pass. Technical terminology is low confidence
and needs native-speaker review. Remaining locales and the broader translation
backlog are unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5e972c447f">Translate new backup options into Kashmiri and Konkani</a>. Thanks to xet7.</summary>

Add eight encryption, cloud and restart options to each locale. Preserve
existing
translations, relative source key order and exact placeholders. Extend
encryption
and cloud regression coverage. Four focused suites, all 21 human-preference
checks
and both preservation, script and placeholder audits pass. Technical terminology
is low confidence and needs native-speaker review. Remaining locales and the
broader translation backlog are unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e76371bb2b">Translate backup options into Kashubian, Upper Sorbian and Silesian</a>. Thanks to xet7.</summary>

Add eight encryption, cloud and restart options to each locale. Preserve
existing
translations, relative source key order and exact placeholders. Extend
encryption
and cloud regression coverage. Four focused suites, all 21 human-preference
checks
and three batch preservation audits pass. Technical terminology is low
confidence
and needs native-speaker review. Remaining locales and the broader translation
backlog are unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/8b2fc6e41d">Translate new backup options into Venetian and Ladin</a>. Thanks to xet7.</summary>

Add eight encryption, cloud and restart options to each locale. Preserve
existing
translations, relative source key order and exact placeholders. Extend
encryption
and cloud regression coverage. Four focused suites, all 21 human-preference
checks
and both batch preservation audits pass. Technical terminology is low confidence
and needs native-speaker review. Remaining locales and the broader translation
backlog are unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/38723ea686">Translate new backup options into Walloon and Aromanian</a>. Thanks to xet7.</summary>

Add eight encryption, cloud and restart options to each locale. Preserve
existing
translations, relative source key order and exact placeholders. Extend
encryption
and cloud regression coverage. Four focused suites, all 21 human-preference
checks
and both batch preservation audits pass. Technical terminology is low confidence
and needs native-speaker review. Remaining locales and the broader translation
backlog are unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f45f3729ea">Translate new backup options into Northern Sotho and Tsonga</a>. Thanks to xet7.</summary>

Add eight encryption, cloud and restart options to each locale. Preserve
existing
translations, relative source key order and exact placeholders. Extend
encryption
and cloud regression coverage. Four focused suites, all 21 human-preference
checks
and both batch preservation audits pass. Technical terminology is low confidence
and needs native-speaker review. Remaining locales and the broader translation
backlog are unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/be8b813038">Translate new backup options into Acehnese and Waray</a>. Thanks to xet7.</summary>

Add eight encryption, cloud and restart options to each locale. Preserve
existing
translations, relative source key order and exact placeholders. Extend
encryption
and cloud regression coverage. Four focused suites, all 21 human-preference
checks
and both batch preservation audits pass. Technical terminology is low confidence
and needs native-speaker review. Remaining locales and the broader translation
backlog are unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a53ecf5ee1">Translate new backup options into Swati and Northern Ndebele</a>. Thanks to xet7.</summary>

Add eight encryption, cloud and restart options to each locale. Preserve
existing
translations, relative source key order and exact placeholders. Extend
encryption
and cloud regression coverage. Four focused suites, all 21 human-preference
checks
and both batch preservation audits pass. Technical terminology is low confidence
and needs native-speaker review. Remaining locales and the broader translation
backlog are unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/8d74931d76">Translate new backup options into Oromo and Wolof</a>. Thanks to xet7.</summary>

Add eight encryption, cloud and restart options to each locale. Preserve
existing
translations, relative source key order and exact placeholders. Extend
encryption
and cloud regression coverage. Four focused suites, all 21 human-preference
checks
and both batch preservation audits pass. Technical terminology is low confidence
and needs native-speaker review. Remaining locales and the broader translation
backlog are unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/68b3e5cbf6">Translate new backup options into Quechua and Aymara</a>. Thanks to xet7.</summary>

Add eight encryption, cloud and restart options to each locale. Preserve
existing
translations, relative source key order and exact placeholders. Extend
encryption
and cloud regression coverage. Four focused suites, all 21 human-preference
checks
and both batch preservation audits pass. Technical terminology is low confidence
and needs native-speaker review. Remaining locales and the broader translation
backlog are unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/8289dfce69">Translate new backup options into Luganda and Venda</a>. Thanks to xet7.</summary>

Add eight encryption, cloud and restart options to each locale. Preserve
existing
translations, relative source key order and exact placeholders. Extend
encryption
and cloud regression coverage. Four focused suites, all 21 human-preference
checks
and both batch preservation audits pass. Technical terminology is low confidence
and needs native-speaker review. Remaining locales and the broader translation
backlog are unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/212da6e19f">Translate backup options into Arabic-script Uzbek</a>. Thanks to xet7.</summary>

Add eight encryption, cloud and restart options using the existing Uzbek
translations as a reference. Preserve existing values, relative source key order
and exact placeholders. Extend encryption and cloud coverage with Arabic-script
checks. Four focused suites, all 21 human-preference checks and the preservation
and script audit pass. Arabic-script spelling and technical wording are low
confidence and need native-speaker review. Remaining locales and the broader
translation backlog are unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e62f3cc4e1">Translate new backup options into Guarani</a>. Thanks to xet7.</summary>

Add eight encryption, cloud and restart options. Preserve existing translations,
relative source key order and exact placeholders. Extend encryption and cloud
regression coverage. Four focused suites, all 21 human-preference checks and the
batch preservation audit pass. Technical terminology is low confidence and needs
native-speaker review. Remaining locales and the broader translation backlog are
unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f2afb2d03f">Translate new backup options into Akan and Ewe</a>. Thanks to xet7.</summary>

Add eight encryption, cloud and restart options to each locale. Preserve
existing
translations, relative source key order and exact placeholders. Extend
encryption
and cloud regression coverage. Four focused suites, all 21 human-preference
checks
and both batch preservation audits pass. Technical terminology is low confidence
and needs native-speaker review. Remaining locales and the broader translation
backlog are unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c120a42490">Translate new backup options into Northern Sami</a>. Thanks to xet7.</summary>

Add eight encryption, cloud and restart options. Preserve existing translations,
relative source key order and exact placeholders. Extend encryption and cloud
regression coverage. Four focused suites, all 21 human-preference checks and the
batch preservation audit pass. Technical terminology is low confidence and needs
native-speaker review. Remaining locales and the broader translation backlog are
unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/44850a669b">Translate new backup options into Manx and Cornish</a>. Thanks to xet7.</summary>

Add eight encryption, cloud and restart options to each locale. Preserve
existing
translations, relative source key order and exact placeholders. Extend
encryption
and cloud regression coverage. Four focused suites, all 21 human-preference
checks
and both batch preservation audits pass. Technical terminology is low confidence
and needs native-speaker review. Remaining locales and the broader translation
backlog are unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/81f0890f9c">Translate backup options into Buryat, Chuvash and Sakha</a>. Thanks to xet7.</summary>

Add eight encryption, cloud and restart options to each locale. Preserve
existing
translations, relative source key order and exact placeholders. Extend
encryption
and cloud regression coverage. Four focused suites, all 21 human-preference
checks
and three batch preservation audits pass. Technical terminology is low
confidence
and needs native-speaker review. Remaining locales and the broader translation
backlog are unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/6d889e6a25">Translate new backup options into Tigrinya</a>. Thanks to xet7.</summary>

Add eight encryption, cloud and restart options. Preserve existing translations,
relative source key order and exact placeholders. Extend encryption and cloud
regression coverage. Four focused suites, all 21 human-preference checks and the
batch preservation audit pass. Technical terminology is low confidence and needs
native-speaker review. Remaining locales and the broader translation backlog are
unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2852ef26d5">Translate new backup options into Tibetan and Dzongkha</a>. Thanks to xet7.</summary>

Add eight encryption, cloud and restart options to each locale. Preserve
existing
translations, relative source key order and exact placeholders. Extend
encryption
and cloud regression coverage. Four focused suites, all 21 human-preference
checks
and both batch preservation audits pass. Technical terminology is low confidence
and needs native-speaker review. Remaining locales and the broader translation
backlog are unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a2c934ba7d">Translate new backup options into Veps and Volapük</a>. Thanks to xet7.</summary>

Add eight encryption, cloud and restart options to each locale. Preserve
existing
translations, relative source key order and exact placeholders. Extend
encryption
and cloud regression coverage. Four focused suites, all 21 human-preference
checks
and both batch preservation audits pass. Technical terminology is low confidence
and needs native-speaker review. Remaining locales and the broader translation
backlog are unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9fccc8d4b9">Translate new backup options into Klingon</a>. Thanks to xet7.</summary>

Add eight encryption, cloud and restart options. Preserve existing translations,
relative source key order and exact placeholders. Extend encryption and cloud
regression coverage. Four focused suites, all 21 human-preference checks and the
batch preservation audit pass. Technical terminology is low confidence and needs
fluent-speaker review. Remaining locales and the broader translation backlog are
unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3e480ad214">Translate new backup options into Bambara</a>. Thanks to xet7.</summary>

Add eight encryption, cloud and restart options. Preserve existing translations,
relative source key order and exact placeholders. Extend encryption and cloud
regression coverage. Four focused suites, all 21 human-preference checks and the
batch preservation audit pass. Technical terminology is low confidence and needs
native-speaker review. Remaining locales and the broader translation backlog are
unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/71c259fce3">Translate new backup options into Fulah</a>. Thanks to xet7.</summary>

Add eight encryption, cloud and restart options. Preserve existing translations,
relative source key order and exact placeholders. Extend encryption and cloud
regression coverage. Four focused suites, all 21 human-preference checks and the
batch preservation audit pass. Technical terminology is low confidence and needs
native-speaker review. Remaining locales and the broader translation backlog are
unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/8c81b96b21">Translate backup options into Greenlandic and Nahuatl</a>. Thanks to xet7.</summary>

Add eight encryption, cloud and restart options to each locale. Preserve
existing
translations, relative source key order and exact placeholders. Extend
encryption
and cloud regression coverage. Four focused suites, all 21 human-preference
checks
and both batch preservation audits pass. Technical terminology is low confidence
and needs native-speaker review. Remaining locales and the broader translation
backlog are unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a2d9408baf">Translate Scrum background job messages in 48 locale variants</a>. Thanks to xet7.</summary>

Translate card rollover progress, history undo/redo progress and interrupted-job
instructions in 47 catalog files, also covering the Russian locale symlink.
Preserve existing translations, source key order and exact progress
placeholders.
Add an automatically discovered regression suite. Three focused suites, all 21
human-preference checks and 47 catalog preservation audits pass. The remaining
locales and broader translation backlog are unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5880930f8e">Translate Scrum background jobs in 58 more locales</a>. Thanks to xet7.</summary>

Translate card rollover progress, history undo/redo progress and interrupted-job
instructions in 58 additional catalogs. Preserve existing translations, source
key order and exact progress placeholders. Extend regression coverage to 106
locale variants. Three focused suites, all 21 human-preference checks and 58
catalog preservation audits pass. Remaining locales and the broader translation
backlog are unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3986a82588">Translate Scrum background jobs in ten more locales</a>. Thanks to xet7.</summary>

Add progress and interrupted undo/redo instructions in Uzbek variants, Kazakh,
Kyrgyz, Mongolian, Tajik, Turkmen, Tatar and Bashkir. Preserve existing
translations,
source key order and exact placeholders. Extend regression coverage to 116
locale
variants. Three focused suites, all 21 human-preference checks and ten catalog
preservation audits pass. Turkmen, Tatar and Bashkir technical wording is low
confidence and needs native-speaker review. Remaining translations are
unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1827219d83">Translate Scrum job messages in twelve South Asian locales</a>. Thanks to xet7.</summary>

Add progress and interrupted undo/redo instructions in Nepali, Marathi, Tamil,
Telugu, Gujarati, Kannada, Malayalam, Punjabi, Sinhala, Assamese, Odia and
Sindhi.
Preserve existing translations, source key order and exact placeholders. Extend
regression coverage to 128 locale variants. Three focused suites, all 21
human-preference checks and twelve catalog preservation audits pass. Assamese,
Odia and Sindhi technical wording is low confidence and needs native-speaker
review. Remaining translations are unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/893b80a43f">Translate Scrum job messages in ten European locales</a>. Thanks to xet7.</summary>

- Translate card rollover progress, history undo/redo progress and retry
  instructions into Irish, Welsh, Luxembourgish, Maltese, Faroese, Frisian,
  Romansh and Latin, including the Welsh and Frisian regional catalogs.
- Preserve existing translations and exact progress placeholders; regression
  coverage now checks these messages in 138 locale variants.
- Three focused suites, 21 human-preference checks and ten catalog preservation
  audits pass. Other locales and remaining translation gaps still need work.
- Faroese, Maltese and Romansh technical wording has lower confidence and
  welcomes native review.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ba672541eb">Translate Scrum job messages in thirteen more locale variants</a>. Thanks to xet7.</summary>

- Translate rollover progress, history undo/redo progress and retry instructions
  into Burmese, Khmer, Javanese, Haitian Creole, Occitan, Asturian, Aragonese,
  Yiddish, Kurdish, Sorani and Pashto, including Khmer regional catalogs.
- Preserve existing translations and exact progress tokens; regression coverage
  now checks these messages in 151 locale variants.
- Three focused suites, 21 human-preference checks and twelve catalog
  preservation audits pass. Remaining locales and other translation gaps still
  need work.
- Aragonese and Kurdish technical wording has lower confidence and welcomes
  native review.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3ec3868487">Translate Scrum job messages in thirteen African locale catalogs</a>. Thanks to xet7.</summary>

- Translate card rollover progress, history undo/redo progress and retry
  instructions into Amharic, Somali, Hausa, Yoruba, Igbo, Malagasy, Shona, Zulu,
  Xhosa, Chichewa, Sesotho and Setswana, including the Zulu regional catalog.
- Preserve existing translations and exact progress placeholders; regression
  coverage now checks these messages in 164 locale variants.
- Three focused suites, 21 human-preference checks and thirteen catalog
  preservation audits pass. Remaining locales and other translation gaps still
  need work.
- Igbo, Shona, Chichewa, Sesotho and Setswana technical phrasing has lower
  confidence and welcomes native review.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/79484d1c92">Translate Scrum job messages in ten more language catalogs</a>. Thanks to xet7.</summary>

- Translate rollover progress, history undo/redo progress and retry instructions
  into Corsican, Sardinian, Sicilian, Neapolitan, Papiamento, Tok Pisin,
  Bislama, Māori, Cantonese and Hiragana Japanese.
- Preserve existing translations and exact progress tokens; regression coverage
  now checks these messages in 174 locale variants.
- Three focused suites, 21 human-preference checks and ten catalog preservation
  audits pass. Remaining locales and other translation gaps still need work.
- Sardinian, Neapolitan, Papiamento, Tok Pisin and Bislama technical wording has lower confidence and welcomes native review. Vocabulary references: [Tok Pisin dictionary](https://tokpisin.net/) and [Bislama handbook](https://www.livelingua.com/peace-corps/Bislama/Bislama%20Handbook%20-%20Revision%20July%202011.pdf).

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/94e6e5b752">Translate Scrum progress and retry messages in ten more locales</a>. Thanks to xet7.</summary>

- Translate rollover progress, history undo/redo progress and retry instructions
  into Uyghur, Arabic-script Uzbek, Moroccan Arabic, Bhojpuri, Maithili,
  Kinyarwanda, Kirundi, Silesian, Kashubian and Upper Sorbian.
- Preserve existing translations and exact progress tokens; regression coverage
  now checks these messages in 184 locale variants.
- Three focused suites, 21 human-preference checks and ten catalog preservation
  audits pass. Remaining locales and other translation gaps still need work.
- Arabic-script Uzbek, Kirundi, Silesian, Kashubian and Upper Sorbian technical
  phrasing has lower confidence and welcomes native review.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0e2d604a20">Translate Scrum job messages in nine European and Pacific locales</a>. Thanks to xet7.</summary>

- Translate rollover progress, history undo/redo progress and retry instructions
  into Scottish Gaelic, Breton, Friulian, Venetian, Walloon, Samoan, Tongan,
  Fijian and Hawaiian.
- Preserve existing translations and exact progress tokens; regression coverage
  now checks these messages in 193 locale variants.
- Three focused suites, 21 human-preference checks and nine catalog preservation
  audits pass. Remaining locales and other translation gaps still need work.
- Walloon, Tongan, Fijian and Hawaiian technical phrasing has lower confidence
  and welcomes native review.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/660ac4fb62">Translate Scrum job messages in ten African and Asian locales</a>. Thanks to xet7.</summary>

- Translate rollover progress, history undo/redo progress and retry instructions
  into Oromo, Konkani, Acehnese, Tsonga, Northern Ndebele, Swati, Luganda,
  Waray, Northern Sotho and Wu Chinese.
- Preserve existing translations and exact progress tokens; regression coverage
  now checks these messages in 203 locale variants.
- Three focused suites, 21 human-preference checks and ten catalog preservation
  audits pass. Remaining locales and other translation gaps still need work.
- Acehnese, Northern Ndebele, Swati, Waray and Northern Sotho technical phrasing
  has lower confidence and welcomes native review.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/488145a6e1">Translate Scrum job messages in ten further language catalogs</a>. Thanks to xet7.</summary>

- Translate rollover progress, history undo/redo progress and retry instructions
  into Tigrinya, Tibetan, Dzongkha, Kashmiri, Chuvash, Buryat, Sakha, Venda,
  Guarani and Quechua.
- Preserve existing translations and exact progress tokens; regression coverage
  now checks these messages in 213 locale variants.
- Three focused suites, 21 human-preference checks and ten catalog preservation
  audits pass. Remaining locales and other translation gaps still need work.
- Technical phrasing in this batch has lower confidence, especially Dzongkha,
  Kashmiri, Chuvash, Buryat, Sakha, Venda and Quechua, and welcomes native
  review.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/67a5d66446">Translate Scrum job messages in ten remaining locale catalogs</a>. Thanks to xet7.</summary>

- Translate rollover progress, history undo/redo progress and retry instructions
  into Akan, Ewe, Wolof, Bambara, Fulah, Aymara, Aromanian, Ladin, Manx and
  Cornish.
- Preserve existing translations and exact progress tokens; regression coverage
  now checks these messages in 223 locale variants.
- Three focused suites, 21 human-preference checks and ten catalog preservation
  audits pass. Remaining locales and other translation gaps still need work.
- Technical phrasing in all ten languages has lower confidence and welcomes
  native review.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/20cbf92cb4">Translate Scrum job messages in six remaining languages</a>. Thanks to xet7.</summary>

- Translate rollover progress, history undo/redo progress and retry instructions
  into Klingon, Volapük, Northern Sámi, Veps, Nahuatl and Greenlandic.
- Preserve existing translations and exact progress tokens; regression coverage
  now checks these messages in 229 locale variants.
- Three focused suites, 21 human-preference checks and six catalog preservation
  audits pass. Remaining locales and other translation gaps still need work.
- Technical phrasing in all six languages has lower confidence and welcomes
  native review.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/57afeb15e7">Complete Scrum job translations across all locale catalogs</a>. Thanks to xet7.</summary>

- Translate rollover progress, history undo/redo progress and retry instructions
  into Cherokee, Inuktitut, Tigre, Wolaytta and Standard Moroccan Tamazight. All
  234 non-English locale variants now contain these three messages.
- Discover every catalog automatically in regression coverage, preserving exact
  progress tokens and checking the declared scripts used by this batch.
- Three focused suites, 21 human-preference checks and five catalog preservation
  audits pass. Backup translations and other catalog gaps still need work.
- Technical phrasing in all five languages has low confidence and welcomes
  native review.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5d92e48e01">Complete new backup translations and repair catalog regressions</a>. Thanks to xet7.</summary>

- Translate the eight new backup encryption, cloud and restart messages into
  Cherokee, Inuktitut, Tigre, Wolaytta and Standard Moroccan Tamazight,
  completing these messages across all 234 non-English locale variants.
- Synchronize eleven English variants with the current source keys without
  replacing existing wording. Correct Swiss German spelling and the
  corpus-attested Tigre Files plural.
- Discover all non-English catalogs in backup regression tests, cover the
  restart message, and allow the exact AES-256-GCM identifier in Arabic-script
  Uzbek script checks.
- All 455 translation-related suites pass, including reruns after six failures
  were fixed. Human-preference and catalog preservation checks pass. Older
  untranslated backup messages and other catalog gaps remain.
- Technical wording in the five newly filled languages has low confidence and
  welcomes native review.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0be17d77ff">Complete Tigre and Wolaytta continuous backup translations</a>. Thanks to xet7.</summary>

- Translate the remaining 35 continuous backup messages in each locale,
  including database engines, intervals, status, restore points and restore
  instructions.
- Preserve existing translations, technical identifiers and exact source tokens.
  All 43 backup messages now have regression coverage in 231 locale variants,
  including restore safety wording and time units.
- All 59 relevant suites, 21 human-preference checks and both catalog
  preservation audits pass. Cherokee, Inuktitut and Standard Moroccan Tamazight
  still need the original backup messages; other catalog gaps also remain.
- Technical wording in Tigre and Wolaytta has low confidence and welcomes native
  review.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5779c050db">Complete Inuktitut and Tamazight continuous backup translations</a>. Thanks to xet7.</summary>

- Translate the remaining 35 continuous backup messages in each locale,
  including engines, timing, status and restore instructions.
- Preserve existing translations, technical identifiers and exact source tokens.
  All 43 backup messages now have regression coverage in 233 locale variants,
  including scripts, time units and restore safety wording.
- All 31 relevant suites, 21 human-preference checks and both catalog
  preservation audits pass. Cherokee still needs the original backup messages;
  other catalog gaps also remain.
- Technical wording in both languages has low confidence and welcomes native review. The Tamazight software execution term is checked against the [computing lexicon](https://cedric.cnam.fr/~bouzefra/books/amawal.pdf).

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/613ba0b68e">Complete Cherokee continuous backup translations</a>. Thanks to xet7.</summary>

- Translate the remaining 35 Cherokee backup messages, completing all 43
  continuous backup messages across all 234 non-English locale variants.
- Discover every non-English catalog automatically in backup regression
  coverage. Check exact source tokens, key order, Cherokee script, time units
  and restore safety wording while preserving existing translations.
- All eight relevant suites, 21 human-preference checks and the catalog
  preservation audit pass. Other untranslated catalog strings remain.
- Cherokee technical wording has low confidence and welcomes native review. Time units were checked against the [Cherokee dictionary](https://www.cherokeedictionary.net/first500).

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b5e9da6916">Translate import instructions and keyboard reordering help</a>. Thanks to xet7.</summary>

- Translate Taskwarrior and Focalboard import instructions and drag-to-reorder
  keyboard guidance into Finnish, Swedish, Danish, Norwegian Bokmål, German,
  French, Spanish, Portuguese, Italian and Dutch, including regional variants:
  90 messages in 30 catalogs.
- Preserve commands, field names, file formats, both arrow-key directions and
  the warning that images and attachments are not imported. Existing
  translations and exact source tokens are preserved.
- Six relevant suites, 21 human-preference checks and all 30 catalog
  preservation audits pass. These three messages still need translation in 204
  locale variants; other catalog gaps remain.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e670a55d0a">Translate more import and reordering instructions</a>. Thanks to xet7.</summary>

- Translate Taskwarrior and Focalboard import instructions and keyboard
  reordering help into Polish, Czech, Slovak, Slovenian, Croatian, Romanian,
  Hungarian, Bulgarian, Ukrainian and Russian, covering 18 more locale variants.
- Replace Italian labels and description text in both Romanian catalogs with
  Romanian, and correct the Croatian description label to Latin spelling.
- Preserve commands, file formats, import limitations, arrow-key directions and
  exact source tokens. Eleven relevant suites, 21 human-preference checks and
  all catalog preservation audits pass.
- These three messages now cover 48 locale variants; 186 variants and other
  catalog gaps remain.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9a2aaf6efe">Extend import and reordering translations to more European and Asian languages</a>. Thanks to xet7.</summary>

- Translate Taskwarrior and Focalboard import instructions and keyboard
  reordering help into Estonian, Latvian, Lithuanian, Greek, Turkish,
  Indonesian, Malay, Vietnamese, Japanese, Korean and Chinese, covering 24 more
  locale variants.
- Replace the Lithuanian checklist label in the Latvian catalog with Latvian.
  Preserve existing correct-language translations, exact source tokens,
  commands, file formats, import limitations and arrow-key directions.
- Fourteen relevant suites, 21 human-preference checks and all 24 catalog
  preservation audits pass. These three messages now cover 72 locale variants;
  162 variants and other catalog gaps remain.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/46449d6335">Translate import and reordering help into six more languages</a>. Thanks to xet7.</summary>

- Translate Taskwarrior and Focalboard import instructions and keyboard
  reordering help into Arabic, Hebrew, Persian, Urdu, Hindi and Bengali,
  covering 11 more locale variants.
- Preserve existing translations, exact source tokens, commands, field names,
  file formats, the image and attachment import limitation, and both arrow-key
  directions.
- Thirteen relevant suites, 21 human-preference checks and all 11 catalog
  preservation audits pass. These three messages now cover 83 locale variants;
  151 variants and other catalog gaps remain.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f2f3cc5568">Translate import and reordering help into twelve more languages</a>. Thanks to xet7.</summary>

- Translate Taskwarrior and Focalboard import instructions and keyboard
  reordering help into Catalan, Galician, Basque, Afrikaans, Swahili, Bosnian,
  Serbian, Macedonian, Icelandic, Esperanto, Albanian and Tagalog, covering 16
  more locale variants.
- Preserve existing translations, exact source tokens, commands, file formats,
  import limitations and both arrow-key directions.
- Twenty-seven relevant suites, 21 human-preference checks and all 16 catalog
  preservation audits pass. These three messages now cover 99 locale variants;
  135 variants and other catalog gaps remain.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b81f366aa3">Translate import and reordering guidance into eight more languages</a>. Thanks to xet7.</summary>

- Translate Taskwarrior and Focalboard import instructions and keyboard
  reordering help into Belarusian, Azerbaijani, Georgian, Armenian, Kazakh,
  Mongolian, Uzbek and Thai, covering 12 more locale variants.
- Preserve existing translations, exact source tokens, commands, field names,
  file formats, import limitations and both arrow-key directions.
- Twenty relevant suites, 21 human-preference checks and all 12 catalog
  preservation audits pass. These three messages now cover 111 locale variants;
  123 variants and other catalog gaps remain.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a868c350b1">Translate import and reordering help into six South Asian languages</a>. Thanks to xet7.</summary>

- Translate Taskwarrior and Focalboard import instructions and keyboard
  reordering help into Nepali, Marathi, Tamil, Telugu, Gujarati and Kannada.
- Preserve existing translations, exact source tokens, commands, field names,
  file formats, import limitations and both arrow-key directions.
- Eleven relevant suites, 21 human-preference checks and all six catalog
  preservation audits pass. These three messages now cover 117 locale variants;
  117 variants and other catalog gaps remain.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a74aa9fe6b">Extend South Asian import and reordering translations</a>. Thanks to xet7.</summary>

- Translate Taskwarrior and Focalboard import instructions and keyboard
  reordering help into Malayalam, Punjabi, Sinhala, Assamese, Odia and Sindhi.
- Preserve existing translations, exact source tokens, commands, field names,
  file formats, import exclusions and both arrow-key directions.
- Eleven relevant suites, 21 human-preference checks and all six catalog
  preservation audits pass. These three messages now cover 123 locale variants;
  111 variants and other catalog gaps remain.
- Technical wording in this batch has low confidence and welcomes native review.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/47652f8ac6">Extend import and reordering translations to eight more locale variants</a>. Thanks to xet7.</summary>

- Translate Taskwarrior and Focalboard import instructions and keyboard
  reordering help into Irish, Welsh, Luxembourgish, Maltese, Frisian and Latin,
  including regional variants.
- Preserve existing translations, exact source tokens, commands, file formats,
  import limitations and both arrow-key directions.
- Twelve relevant suites, 21 human-preference checks and all eight preservation
  audits pass. These three messages now cover 131 locale variants; 103 variants
  and other catalog gaps remain.
- Technical wording has low confidence and welcomes native review. Luxembourgish block terminology was checked against the [Luxembourgish dictionary](https://lod.lu/artikel/BLOCK1).

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/859925cb0f">Translate import and reordering help into six more languages</a>. Thanks to xet7.</summary>

- Translate Taskwarrior and Focalboard import instructions and keyboard
  reordering help into Haitian Creole, Javanese, Occitan, Asturian, Aragonese
  and Corsican.
- Preserve existing translations, exact source tokens, commands, file formats,
  import exclusions and both arrow-key directions.
- Fourteen relevant suites, 21 human-preference checks and all six preservation
  audits pass. These three messages now cover 137 locale variants; 97 variants
  and other catalog gaps remain.
- Technical wording has low confidence and welcomes native review. Drag terminology was checked against the [Aragonese dictionary](https://www.efaragonesa.org/biblio/Edacar13.pdf) and [Occitan teaching vocabulary](https://www.capoc.fr/fileadmin/user_upload/Documents/Actualit%C3%A9s/Autres/LG-occitan-ecole_version_finale.pdf).

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/cb81eab1d2">Extend import and reordering translations to six more locales</a>. Thanks to xet7.</summary>

- Translate Taskwarrior and Focalboard import instructions and keyboard
  reordering help into Kyrgyz, Tajik, Turkmen, Tatar, Bashkir and Yiddish.
- Preserve existing translations, exact source tokens, commands, file formats,
  import exclusions and both arrow-key directions.
- Fourteen relevant suites, 21 human-preference checks and all six preservation
  audits pass. These three messages now cover 143 locale variants; 91 variants
  and other catalog gaps remain.
- Technical wording has low confidence and welcomes native review.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/8aa91392c0">Extend import and reordering translations to seven more locale variants</a>. Thanks to xet7.</summary>

- Translate Taskwarrior and Focalboard import instructions and keyboard
  reordering help into Burmese, Khmer, Kurmanji, Sorani and Pashto, including
  Khmer regional variants.
- Preserve existing translations, exact source tokens, commands, file formats,
  import exclusions and both arrow-key directions.
- Fourteen relevant suites, 21 human-preference checks and all six file
  preservation audits pass. These three messages now cover 150 locale variants;
  84 variants and other catalog gaps remain.
- Technical wording has low confidence and welcomes native review.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e1357ac13a">Translate import and reordering help into six African languages</a>. Thanks to xet7.</summary>

- Translate Taskwarrior and Focalboard import instructions and keyboard
  reordering help into Somali, Hausa, Yoruba, Igbo, Malagasy and Amharic.
- Preserve existing translations, exact source tokens, commands, file formats,
  import exclusions and both arrow-key directions.
- Thirteen relevant suites, 21 human-preference checks and all six preservation
  audits pass. These three messages now cover 156 locale variants; 78 variants
  and other catalog gaps remain.
- Technical wording has low confidence and welcomes native review.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/90120d0bde">Extend African import and reordering translations</a>. Thanks to xet7.</summary>

- Translate Taskwarrior and Focalboard import instructions and keyboard
  reordering help into Zulu, Xhosa, Shona, Chichewa, Sesotho and Setswana,
  covering seven more locale variants.
- Preserve existing translations, exact source tokens, commands, file formats,
  import exclusions and both arrow-key directions.
- Eleven relevant suites, 21 human-preference checks and all seven preservation
  audits pass. These three messages now cover 163 locale variants; 71 variants
  and other catalog gaps remain.
- Technical wording has low confidence and welcomes native review.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f10e977d81">Translate import and reordering guidance in six additional regional locales</a>. Thanks to xet7.</summary>

- Translate Taskwarrior and Focalboard import instructions and keyboard
  reordering help into Japanese hiragana, Cantonese, Wu Chinese, Moroccan
  Arabic, Bhojpuri and Maithili.
- Preserve existing translations, exact source tokens, commands, file formats,
  import exclusions and both arrow-key directions. Check that the Japanese
  hiragana messages contain no kanji.
- Nine relevant suites, 21 human-preference checks and all six preservation
  audits pass. These three messages now cover 169 locale variants; 65 variants
  and other catalog gaps remain.
- Regional technical phrasing has low confidence and welcomes native review.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4a9204225b">Translate import help into six more Romance languages</a>. Thanks to xet7.</summary>

- Translate Taskwarrior and Focalboard import instructions and keyboard
  reordering help into Sardinian, Sicilian, Neapolitan, Venetian, Friulian and
  Romansh. Replace a Zulu checklist label in the Venetian catalog.
- Preserve existing correct-language translations, exact source tokens,
  commands, file formats, import exclusions and both arrow-key directions.
- Twelve relevant suites, 21 human-preference checks and all six preservation
  audits pass. These three messages now cover 175 locale variants; 59 variants
  and other catalog gaps remain.
- Technical wording has low confidence and welcomes native review. Friulian drag vocabulary was checked against the [grammar and lexicon](https://www.vatrarberesh.it/biblioteca/ebooks/ilfriulano.pdf).

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d3ffd9b319">Extend import and reordering help to six more languages</a>. Thanks to xet7.</summary>

- Translate Taskwarrior and Focalboard import instructions and keyboard
  reordering help into Papiamento, Tok Pisin, Bislama, Māori, Samoan and
  Hawaiian.
- Preserve existing translations, exact source tokens, commands, file formats,
  import exclusions and both arrow-key directions.
- Twelve relevant suites, 21 human-preference checks and all six preservation
  audits pass. These three messages now cover 181 locale variants; 53 variants
  and other catalog gaps remain.
- Technical phrasing has low confidence and welcomes native review. Array and computer-drag terms were checked against [Te Aka](https://maoridictionary.co.nz/search?keywords=huanga) and the [Hawaiian dictionaries](https://wehe.hilo.hawaii.edu/?q=drag).

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/36e7bb1dc0">Translate import guidance into six more European languages</a>. Thanks to xet7.</summary>

- Translate Taskwarrior and Focalboard import instructions and keyboard
  reordering help into Faroese, Scottish Gaelic, Breton, Silesian, Kashubian and
  Upper Sorbian.
- Preserve existing translations, exact source tokens, commands, file formats,
  import exclusions and both arrow-key directions.
- Twelve relevant suites, 21 human-preference checks and all six preservation
  audits pass. These three messages now cover 187 locale variants; 47 variants
  and other catalog gaps remain.
- Technical phrasing has low confidence and welcomes native review. Breton drag vocabulary was checked against the [Breton language portal](https://niverel.brezhoneg.bzh/fr/meurgorf/26063).

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5b8ded570b">Translate import guidance into six more African languages</a>. Thanks to xet7.</summary>

- Translate Taskwarrior and Focalboard import instructions and keyboard
  reordering help into Kinyarwanda, Kirundi, Northern Sotho, Tsonga, Swati and
  Northern Ndebele.
- Preserve existing translations, exact source tokens, commands, file formats,
  import exclusions and both arrow-key directions.
- Thirteen relevant suites, 21 human-preference checks and all six preservation
  audits pass. These three messages now cover 193 locale variants; 41 variants
  and other catalog gaps remain.
- Technical phrasing has low confidence and welcomes native review.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ef27d27a51">Translate import and reordering help into four more locales</a>. Thanks to xet7.</summary>

- Translate Taskwarrior and Focalboard import instructions and keyboard
  reordering help into Uyghur, Arabic-script Uzbek, Konkani and Oromo. Correct
  the Uzbek labels heading to Arabic script.
- Preserve existing correct-language translations, exact source tokens,
  commands, file formats, import exclusions and both arrow-key directions. Check
  the declared script in Uyghur and Arabic-script Uzbek prose.
- Ten relevant suites, 21 human-preference checks and all four preservation
  audits pass. These three messages now cover 197 locale variants; 37 variants
  and other catalog gaps remain.
- Technical wording has low confidence and welcomes native review.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/474ecaab67">Translate import and reordering help into four more languages</a>. Thanks to xet7.</summary>

- Translate Taskwarrior and Focalboard import instructions and keyboard
  reordering help into Fijian, Tongan, Walloon and Waray.
- Preserve existing translations, exact source tokens, commands, file formats,
  import exclusions and both arrow-key directions.
- Ten relevant suites, 21 human-preference checks and all four preservation
  audits pass. These three messages now cover 201 locale variants; 33 variants
  and other catalog gaps remain.
- Technical wording has low confidence and welcomes native review. Drag terminology was checked against the [Fijian dictionary](https://www.folksong.org.nz/isa_lei/Fijian-English_Dictionary.pdf) and [Walloon dictionary](https://dtw.walon.org/index.php?query=saetch%C3%AE).

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f7be052b15">Translate import help into Akan, Luganda, Wolof and Bambara</a>. Thanks to xet7.</summary>

- Translate Taskwarrior and Focalboard import instructions and keyboard
  reordering help into four more languages, preserving existing translations,
  exact source tokens, commands, file formats, import exclusions and both
  arrow-key directions.
- Ten relevant suites, 21 human-preference checks and all four preservation
  audits pass. These three messages now cover 205 locale variants; 29 variants
  and other catalog gaps remain.
- Technical wording has low confidence and welcomes native review. Vocabulary was checked against [Akan teaching material](https://elias.fas.harvard.edu/index.php/languages/Twi/Beginning/1/AKAN-SOUNDS), [Bambara dictionary entries](https://dictionary.ankataa.com/search.php?input=sa&search=lexicon) and [Wolof vocabulary](https://wolofresources.org/language/download/lexicarry_plus.pdf).

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f1b8e772ed">Translate import help into Acehnese, Ladin and Aromanian</a>. Thanks to xet7.</summary>

- Translate Taskwarrior and Focalboard import instructions and keyboard
  reordering help into three more languages, preserving existing translations,
  exact source tokens, commands, file formats, import exclusions and both
  arrow-key directions.
- Ten relevant suites, 21 human-preference checks and all three preservation
  audits pass. These three messages now cover 208 locale variants; 26 variants
  and other catalog gaps remain.
- Technical wording has low confidence and welcomes native review. Drag vocabulary was checked against an [Acehnese linguistic study](https://digital.library.adelaide.edu.au/dspace/bitstream/2440/92352/3/02whole.pdf) and the [Ladin dictionary](https://wikisource.org/wiki/Page:Vocabolardlladinleterar.pdf/989).

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c7b499ebc270fd1fb07eac8d16741997c8870f70">Translate import instructions and reordering help into Manx, Cornish and Northern Sámi</a>. Thanks to xet7.</summary>

- Fill nine English placeholders while preserving existing translations,
  technical identifiers and source key order. These three messages now cover 211
  of 234 non-English locale variants; 23 remain.
- Extend import exclusions, keyboard directions and placeholder checks. All 10
  relevant suites, three preservation audits and 21 human-preference checks
  pass.
- Low-confidence technical translations in all three languages need native-speaker review. Vocabulary references include the <a href="https://kevinscannell.com/files/frasleabhar.pdf">Manx phrasebook</a>, <a href="https://pdfcoffee.com/dictionary-english-manx-pdf-free.html">English–Manx dictionary</a> and <a href="https://www.cornishdictionary.org.uk/sites/default/files/GerlyverPDF%202020%2012%2001%20(FW).pdf">Akademi Kernewek dictionary</a>.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/02211032b962af467b77be6dcb6ceecb30cb21af">Translate import instructions and reordering help into Buryat, Chuvash and Sakha</a>. Thanks to xet7.</summary>

- Fill nine English placeholders while preserving existing translations,
  technical identifiers and source key order. These three messages now cover 214
  of 234 non-English locale variants; 20 remain.
- Extend import exclusions, keyboard directions and placeholder checks. All
  eight relevant suites, three preservation audits and 21 human-preference
  checks pass.
- Low-confidence technical translations in all three languages need native-speaker review. Vocabulary references include the <a href="https://ru.djvu.online/file/hc1oOF3oJ2wD1">Buryat–Russian dictionary</a>, <a href="https://en.wiktionary.org/wiki/Appendix:Chuvash_Swadesh_list">Chuvash vocabulary list</a> and <a href="https://iknigi.net/avtor-tamara-petrova/160404-kratkiy-yakutsko-russkiy-russko-yakutskiy-slovar-tamara-petrova/read/page-10.html">Sakha–Russian dictionary</a>; the latter distinguishes сос (drag) from соһуй (startle).

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/54882fe4fa42fdc54f54e74226eb32ac764e5c75">Translate import instructions and reordering help into Aymara, Quechua and Guaraní</a>. Thanks to xet7.</summary>

- Fill nine English placeholders while preserving existing translations,
  technical identifiers and source key order. These three messages now cover 217
  of 234 non-English locale variants; 17 remain.
- Extend import exclusions, keyboard directions and placeholder checks. All 10
  relevant suites, three preservation audits and 21 human-preference checks
  pass.
- Low-confidence technical translations in all three languages need native-speaker review. Vocabulary references include the <a href="https://www.illaa.org/pirwa/diccionarios/LudovicoBertonioMuchosCambios.pdf">Aymara vocabulary</a>, <a href="https://www.illaa.org/pirwa/diccionarios/DicAMLQuechuaOrig.pdf">Quechua dictionary</a> and <a href="https://www.mec.gob.ar/descargas/Bibliograf%C3%ADa/Educaci%C3%B3n%20Intercultural%20Biling%C3%BCe/GUARANI/avane-Diccionario-Guarani-Esp-Esp-Guarani.pdf">Guaraní dictionary</a>.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/18fa84e06f6b9add958ee4b494af6ba650dbb7f1">Translate import instructions and reordering help into Tibetan and Dzongkha</a>. Thanks to xet7.</summary>

- Fill six English placeholders while preserving existing translations,
  technical identifiers and source key order. These three messages now cover 219
  of 234 non-English locale variants; 15 remain.
- Extend import exclusions, keyboard directions and placeholder checks. All
  eight relevant suites, two preservation audits and 21 human-preference checks
  pass.
- Low-confidence technical translations in both languages need native-speaker review. Vocabulary references include the <a href="https://github.com/tibetan-nlp/lexicon-of-tibetan-verb-stems/blob/master/cg3-lemmas.txt">Tibetan verb lexicon</a> and <a href="https://download-mirror.savannah.gnu.org/releases/dzongkha-gnome/dzongkha_computer_terms.pdf">Dzongkha computer terminology</a>.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3895899f853a3af06d644840842065279f5028ad">Translate Venda import help and correct Zulu labels</a>. Thanks to xet7.</summary>

- Fill three import and reordering placeholders, bringing these messages to 220
  of 234 non-English locale variants; 14 remain. Replace five Zulu seed values
  in Venda labels, checklist, comments, lists and the import action.
- Extend import exclusions, keyboard directions, placeholder and
  correct-language term checks. All seven relevant suites, a preservation audit
  and 21 human-preference checks pass.
- Low-confidence Venda technical translations and replacements need native-speaker review. Vocabulary references include <a href="https://learnvenda.co.za/app/lists/Words/chat/3">Gudani Tshivenda</a> and the <a href="https://www.era.anthropology.ac.uk/Era_Resources/Era/VendaGirls/GrDombaSong/GDS_Music_Text01.html">Venda music glossary</a> for kokodza (drag, pull). The separately registered Veps locale ve-PP is a different language.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b3c8b52b5cc7364811dba9f491fa5e4f79c10bd0">Translate Veps import help and correct mixed-language labels</a>. Thanks to xet7.</summary>

- Fill three import and reordering placeholders, bringing these messages to 221
  of 234 non-English locale variants; 13 remain. Replace Zulu import-source text
  and Venda linked-subtask text with Veps.
- Extend import exclusions, keyboard directions, placeholder and corrected-label
  checks. All 11 relevant suites, a preservation audit and 21 human-preference
  checks pass.
- Low-confidence Veps technical translations and replacements need native-speaker review. The <a href="https://vepsnoid.blogspot.com/p/dictionary.html">Veps–English dictionary</a> supplies vocabulary for pulling, linking, moving and hindering.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/25bc2279279b078525cc05a98befd3498cccbfd6">Translate Kashmiri import instructions and reordering help</a>. Thanks to xet7.</summary>

- Fill three English placeholders while preserving existing translations,
  technical identifiers and source key order. These messages now cover 222 of
  234 non-English locale variants; 12 remain.
- Extend import exclusions, keyboard directions and placeholder checks. All
  seven relevant suites, a preservation audit and 21 human-preference checks
  pass.
- Low-confidence Kashmiri technical translations need native-speaker review. The <a href="https://kashmirasitis.com/wp-content/uploads/2020/08/Kashmiri-Dictionary-by-W.J.Elmslie-1.pdf">Elmslie Kashmiri dictionary</a> supplies vocabulary for the drag action; directions follow the existing catalog.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0e34f2c45b3d27630957309efb68b43e40c5bddd">Translate import instructions and reordering help into Ewe and Fulah</a>. Thanks to xet7.</summary>

- Fill six English placeholders while preserving existing translations,
  technical identifiers and source key order. These three messages now cover 224
  of 234 non-English locale variants; 10 remain.
- Extend import exclusions, keyboard directions and placeholder checks. All
  eight relevant suites, two preservation audits and 21 human-preference checks
  pass.
- Low-confidence technical translations in both languages need native-speaker review. Vocabulary references include <a href="https://philtypo3.uni-koeln.de/sites/inst_afrika/pdf/BASIC_EWE_2nd_ed.pdf">Basic Ewe</a> and the <a href="https://www.scribd.com/document/854004347/PEERAL-5-Fulfulde-English-Dictionary">Fulfulde–English dictionary</a>.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5926f71ada9b0b74ce73982f922ea7c9c190756f">Translate Tigrinya import instructions and reordering help</a>. Thanks to xet7.</summary>

- Fill three English placeholders while preserving existing translations,
  technical identifiers and source key order. These messages now cover 225 of
  234 non-English locale variants; nine remain.
- Extend import exclusions, keyboard directions and placeholder checks. All
  seven relevant suites, a preservation audit and 21 human-preference checks
  pass.
- Low-confidence Tigrinya technical translations need native-speaker review. Vocabulary references include the <a href="https://eritreanrefugees.org/wp-content/uploads/2017/02/Tigrinya-EnglishDictionary-V1-6-2UseOnComputer.pdf">Tigrinya–English picture dictionary</a> for the pull action; directions follow the existing catalog.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9b51698f32d42da24dc0c6601135535520490d0c">Translate Volapük import help and correct the comments label</a>. Thanks to xet7.</summary>

- Fill three import and reordering placeholders, bringing these messages to 226
  of 234 non-English locale variants; eight remain. Replace the Esperanto
  comments label with Volapük.
- Extend import exclusions, keyboard directions, placeholder and corrected-label
  checks. All eight relevant suites, a preservation audit and 21
  human-preference checks pass.
- Low-confidence Volapük technical translations and replacement need native-speaker review. Vocabulary follows the <a href="https://en.wikibooks.org/wiki/Volap%C3%BCk/English-Volap%C3%BCk_dictionary">English–Volapük dictionary</a>, including tränön (drag), küpetön (comment), patöf (property), and step.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4e0af778f0738af563e0ddd06c835c345c735b31">Translate Klingon import instructions and reordering help</a>. Thanks to xet7.</summary>

- Fill three English placeholders while preserving existing translations,
  technical identifiers and source key order. These messages now cover 227 of
  234 non-English locale variants; seven remain.
- Extend import exclusions, keyboard directions and placeholder checks. All nine
  relevant suites, a preservation audit and 21 human-preference checks pass.
- Low-confidence Klingon technical translations need fluent-speaker review. The <a href="https://www.kli.org/about-klingon/new-klingon-words/all/">Klingon Language Institute vocabulary</a> distinguishes Hoq (pull along) from Hur (tug), informing the drag instruction.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c880a72b5b1ae06d028d77a32ab1ca671acc7209">Translate Nahuatl import instructions and reordering help</a>. Thanks to xet7.</summary>

- Fill three English placeholders while preserving existing translations,
  technical identifiers and source key order. These messages now cover 228 of
  234 non-English locale variants; six remain.
- Extend import exclusions, keyboard directions and placeholder checks. All
  eight relevant suites, a preservation audit and 21 human-preference checks
  pass.
- Low-confidence Nahuatl technical translations need speaker review. The <a href="https://nahuatl.wired-humanities.org/content/tilana">Online Nahuatl Dictionary</a> supplies tilana for the drag action; directions follow the existing catalog.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0b1fad1fa744e16433a91d81d7156b9d68bf3aef">Translate Greenlandic import instructions and reordering help</a>. Thanks to xet7.</summary>

- Fill three English placeholders while preserving existing translations,
  technical identifiers and source key order. These messages now cover 229 of
  234 non-English locale variants; five remain.
- Extend import exclusions, keyboard directions and placeholder checks. All
  eight relevant suites, a preservation audit and 21 human-preference checks
  pass.
- Low-confidence Greenlandic technical translations need speaker review. Vocabulary references include <a href="https://uni.gl/media/6977622/qimmeq-laerervejledning-og-elevopgaver.pdf">Kalaallit qimmiat qimuttoq teaching materials</a> for pulling and <a href="https://oqa.dk/assets/aitwg2ED.pdf">An Introduction to West Greenlandic</a> for directions.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f76407c6b96348287d8f4286bb86d190b2a25b19">Translate Tamazight import instructions and reordering help</a>. Thanks to xet7.</summary>

- Fill three English placeholders in Tifinagh while preserving existing
  translations, technical identifiers and source key order. These messages now
  cover 230 of 234 non-English locale variants; four remain.
- Extend import exclusions, keyboard directions and placeholder checks. All nine
  relevant suites, a preservation audit and 21 human-preference checks pass.
- Low-confidence Tamazight technical translations need speaker review. The <a href="https://en.wiktionary.org/wiki/%E2%B5%A3%E2%B5%93%E2%B5%96%E2%B5%94">dictionary entry for ⵣⵓⵖⵔ</a>, citing Penchoen’s Tamazight of the Ayt Ndhir, supplies the drag vocabulary.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/91c315b8e31b31853dd44090fdc8ac2004dadf19">Translate import and reordering instructions into Inuktitut</a>. Thanks to xet7.</summary>

- Fill the three Taskwarrior, Focalboard and keyboard reordering messages in
  Inuktitut, bringing this family to 231 of 234 non-English locale variants.
- Preserve existing translations, source key order and exact placeholders; all
  eight relevant suites and 21 human-preference checks pass.
- Inuktitut wording is low confidence and needs speaker review. The pull verb follows the examples in <a href="https://www.collectionscanada.gc.ca/obj/thesescanada/vol2/OTU/TC-OTU-32898.pdf">Viewpoint Aspect in Inuktitut</a>, pages 98 and 102.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/06e94322086e09a70c7bb1d5909296039b5c5595">Translate import and reordering instructions into Tigre</a>. Thanks to xet7.</summary>

- Fill the three Taskwarrior, Focalboard and keyboard reordering messages in
  Tigre, bringing this family to 232 of 234 non-English locale variants.
- Preserve existing translations, source key order and exact placeholders; all
  57 relevant suites and 21 human-preference checks pass, with the affected
  regression rerun after terminology refinement.
- Tigre wording is low confidence and needs speaker review. Pull, arrow, key, line and step vocabulary was checked against the <a href="https://beittigre.github.io/tigre-multilingual-dictionaries/english/index.html">BeitTigreAI parallel corpus dictionary</a>.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/cc886a04dbb597290e639ace504cc4382c9fd0a7">Translate Wolaytta import and reordering instructions</a>. Thanks to xet7.</summary>

- Fill the three Taskwarrior, Focalboard and keyboard reordering messages in
  Wolaytta, bringing this family to 233 of 234 non-English locale variants; also
  replace two mixed-English card direction labels.
- Preserve existing translations, source key order and exact placeholders; all
  eight relevant suites and 21 human-preference checks pass, including the
  explicit correction audit.
- Wolaytta wording is low confidence and needs speaker review. Pull and direction vocabulary was checked in <a href="https://divinerevelations.info/documents/bible/all_html/wolaytta_language_of_ethiopia_portions_of_the_holy_bible/EZK39.htm">Wolaytta native text</a> and <a href="https://www.divinerevelations.info/documents/bible/All_HTML/wolaytta_bible/JOB22.htm">its up/down usage</a>.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/19a8c0fb855adfb4c0b0335e24e6cd78a7b8e6e1">Complete import and reordering translations across all locales</a>. Thanks to xet7.</summary>

- Fill the final three Cherokee Taskwarrior, Focalboard and keyboard reordering
  messages, completing this family in all 234 non-English locale variants;
  enforce complete catalog coverage in the regression suite.
- All 458 translation-related suites, eight focused suites and 21
  human-preference checks pass; the preservation audit confirms only the three
  Cherokee English placeholders changed.
- Cherokee wording is low confidence and needs speaker review. Drag and paste vocabulary follows the <a href="https://www.thepeoplespaths.net/Cherokee/CherokeeWordLists/WordList-D.htm">Peoples Paths Cherokee word list</a> and its <a href="https://www.thepeoplespaths.net/Cherokee/CherokeeWordLists/WordList-P.htm">paste entry</a>. Other untranslated families remain in 70 languages.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b76be84186540fbc9bdb20936b3bc1f6747ac7fd">Translate archiving and date filters into Turkmen, Tatar and Somali</a>. Thanks to xet7.</summary>

- Fill 69 English placeholders covering automatic archiving, recent activity,
  inclusive date ranges, due dates and time in a list; preserve existing
  translations and literal query syntax.
- Eight applicable suites, 21 human-preference checks and per-locale
  preservation audits pass. Regression coverage checks exact placeholders,
  source order, numeric limits and the negative guidance for templates and card
  edits.
- Turkmen, Tatar and Somali wording is provisional and would benefit from
  speaker review; broader translation work remains open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c9e622f1b54e89a1acba4be0436187e77c0337c3">Translate Kurdish archiving and date filter messages</a>. Thanks to xet7.</summary>

- Fill 46 English placeholders in Kurdish and Central Kurdish covering automatic
  archiving, recent activity, inclusive date ranges, due dates and time in a
  list.
- Seven relevant suites and 21 human-preference checks pass; preservation audits
  confirm only English placeholders changed. Extended regression coverage
  preserves exact query syntax, placeholders, numeric limits and negative
  behavioral guidance.
- Kurdish and Central Kurdish wording is provisional and would benefit from
  speaker review; broader translation work remains open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/19a8c0fb85">Completed translation batches: backup, background jobs, imports and reordering</a>. Thanks to xet7.</summary>

**Languages updated:** Acehnese, Afrikaans, Akan, Albanian, Amharic, Arabic, Aragonese, Armenian, Aromanian, Assamese, Asturian, Aymara, Azerbaijani, Bambara, Bangla, Bashkir, Basque, Belarusian, Bhojpuri, Bislama, Bosnian, Breton, Bulgarian, Buriat, Burmese, Cantonese, Catalan, Central Kurdish, Cherokee, Chinese, Chuvash, Cornish, Corsican, Croatian, Czech, Danish, Dutch, Dzongkha, Esperanto, Estonian, Ewe, Faroese, Fijian, Finnish, Flemish, French, Friulian, Fula, Galician, Ganda, Georgian, German, Greek, Guarani, Gujarati, Haitian Creole, Hausa, Hawaiian, Hebrew, Hindi, Hungarian, Icelandic, Igbo, Indonesian, Inuktitut, Irish, Italian, Japanese, Javanese, Kalaallisut, Kannada, Kashmiri, Kashubian, Kazakh, Khmer, Kinyarwanda, Klingon, Konkani, Korean, Kurdish, Kyrgyz, Ladin, Latin, Latvian, Lithuanian, Luxembourgish, Macedonian, Maithili, Malagasy, Malay, Malayalam, Maltese, Mandarin Chinese, Manx, Marathi, Mongolian, Moroccan Arabic, Māori, Nahuatl, Neapolitan, Nepali, North Ndebele, Northern Sami, Northern Sotho, Norwegian Bokmål, Nyanja, Occitan, Odia, Oromo, Papiamento, Pashto, Persian, Polish, Portuguese, Punjabi, Quechua, Romanian, Romansh, Rundi, Russian, Samoan, Sardinian, Scottish Gaelic, Serbian, Shona, Sicilian, Silesian, Sindhi, Sinhala, Slovak, Slovenian, Somali, Southern Sotho, Spanish, Standard Moroccan Tamazight, Swahili, Swati, Swedish, Tagalog, Tajik, Tamil, Tatar, Telugu, Thai, Tibetan, Tigre, Tigrinya, Tok Pisin, Tongan, Tsonga, Tswana, Turkish, Turkmen, Ukrainian, Upper Sorbian, Urdu, Uyghur, Uzbek, Venda, Venetian, Veps, Vietnamese, Volapük, Walloon, Waray, Welsh, Western Frisian, Wolaytta, Wolof, Wu Chinese, Xhosa, Yakut, Yiddish, Yoruba, Zulu.

- Completed the 43 continuous-backup messages, three Scrum background-job
  messages, and three Taskwarrior/Focalboard import and keyboard-reordering
  messages across all **234 non-English locale variants** of the languages
  above. English variants retain English source wording.
- Additionally completed 23 automatic-archiving and date-filter messages in **Turkmen, Tatar, Somali, Kurdish and Central Kurdish** (115 translated values), in the [Turkmen, Tatar and Somali](https://github.com/wekan/wekan/commit/b76be84186) and [Kurdish](https://github.com/wekan/wekan/commit/c9e622f1b5) commits.
- All **458 translation-related suites passed** after the import/reordering
  completion. The later archiving/date-filter batches passed their focused
  regression and preservation checks, plus all 21 human-preference checks.
  Provisional wording is identified in the individual batch entries for speaker
  review.

</details>

Thanks to above GitHub users for their contributions and translators for their translations.
