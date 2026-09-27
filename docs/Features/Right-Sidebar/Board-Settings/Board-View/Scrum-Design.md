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

Still pending: daily scope history and burndown visualization, original-edit/History atomicity and large-board limits,
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
existing hidden metadata, alongside numeric time tracking. See the
[Jira guide](../../../ImportExport/Jira/Jira.md) for mappings, selection controls
and limitations. External sprint snapshots, multiple release assignments,
epic relationships and configurable story-point mappings remain pending.

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
| Jira import | `models/jiraCreator.js` creates status lists, cards, labels and issue dependencies | Sprint, epic, version, estimate, rank and schema-driven custom-field mapping are not implemented by this importer |
| External formats and sync | `models/lib/externalParsers.js`, `externalExporters.js`, list synchronization | Current common fields omit Scrum data; advertised format coverage is not evidence of actual support |
| Trello import | `models/trelloCreator.js`, custom fields and board structures | No universal Trello sprint schema: explicit mappings for custom fields and Power-Up data are required |

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
  backlog rank, optional release/increment reference and source issue type.
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
Cancelling records a reason and preserves the history. Scrum accountabilities
are visible information and do not grant access: all mutations must also satisfy
the existing board/card write permissions. Board configuration and lifecycle
administration retain board-admin guards.

Velocity reports completed estimates against original commitment for each closed
sprint, with reopened and rolled-over work handled explicitly. Burndown/burnup
replay scope and estimate history; never present current estimates as historical
facts. Report missing history and unknown estimates separately from zero. Do not
combine points and hours or use velocity to rank individual members.

The shared Scrum settings form now exposes Product Owner, Scrum Master,
Developers and working days. Accountabilities select active board members and
do not grant permissions. Multiple developers and a nonempty set of weekdays
are supported; single accountabilities and the developer list can be cleared.
Saving uses the existing administrator-only configuration method, revision
checks and History undo/redo. Four new label keys are present in all locale
catalogs with English placeholders where translations are not yet supplied.

## Import, export, copy and synchronization

Standalone card copies (including copied subtasks) start a fresh Scrum metadata
revision. Within the same board they retain sprint/release associations and
backlog rank. Across boards they retain issue type and acceptance criteria but
omit sprint, past-sprint and release references and board-relative rank: these
operations do not copy planning records. The source cards remain unchanged.
Use full-board duplication to copy planning records with remapped references.
Standalone planning-record mapping and move support remain pending.

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

Implementation checkpoint: `models/lib/scrumTransfer.js` now defines and tests
the `wekan-scrum-1` data contract and destination-ID remapping. It covers board
settings, sprint/release/event records, lifecycle snapshots and optional item
metadata. Missing transferred cards or historical actors produce explicit
loss entries; reduced snapshots are marked partial and their totals recalculated.
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
hours, with source baselines and conflict checks. The existing Sync popup also
selects title/description fields and card creation/source-absence archival;
these settings retain board write authorization. Sprint, release and estimate
Sync mappings remain pending, as do project-scoped source identity and atomic
concurrent jobs. See [Sync](../../../ImportExport/Sync.md) for verified scope.

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
