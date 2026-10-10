# WeKan ® 2026-09 releases, part 2

Moved out of [CHANGELOG.md](../../CHANGELOG.md) to keep that
file small enough to open (wekan/wekan#6580). Nothing here has been changed:
a release section is a record, and it reads the same as it did there.

This is part 2 of 6, newest first: [1](09.md), 2, [3](09-part3.md), [4](09-part4.md), [5](09-part5.md), [6](09-part6.md).

Releases per day:

| 2026-09 | Releases |
| --- | --- |
| 14 | 1 |
| 15 | 1 |
| 16 | 3 |
| 17 | 2 |
| 18 | 1 |
| 19 | 1 |
| 20 | 3 |
| 23 | 2 |
| 24 | 7 |
| 25 | 3 |
| 26 | 2 |
| 27 | 4 |

# v12.08 2026-09-27 WeKan ® release

**In short:** Close the reported LDAP empty-password bypass and the directory
group and SAML replay issues found during the authentication audit. Selected
boards can also be duplicated with a choice of structure and data.

This release fixes the following CRITICAL SECURITY ISSUES:

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0c862047b">Enforce assigned-only permissions in exporter authorization</a>. Thanks to xet7.</summary>

[ExportScopeBleed](https://wekan.fi/hall-of-fame/exportscopebleed/): board
visibility alone allowed assigned-only members to export unassigned private
board data. All nine exporter authorization methods now share an assignment
check. Unfiltered exports refuse assigned-only members; the two Scrum report
loaders retain access because they already filter cards and snapshots.
Board Excel and card PDF/Excel refusals now return HTTP 403.

Three Node checks cover the policy, all exporter call sites and Hall of Fame
coverage. Eleven HTTP scenarios pass across native JSON, ZIP, CSV, calendar,
PDF, Excel and charts, including permitted scoped Scrum reports. Existing
Upcoming regression evidence remains recorded. Firefox, WebKit, FerretDB and
Sandstorm were not exercised. CWE-863, high severity; no CVE assigned.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/285c1db24">Enforce current access on universal History reads and restores</a>. Thanks to xet7.</summary>

[HistoryScopeBleed](https://wekan.fi/hall-of-fame/historyscopebleed/):
assigned-only members could read hidden-card history, and historical authorship
could preserve private-board history access after membership was removed.
Filter current access before search, paging, totals and contributor counts.
Restore, undo and redo also enforce current scope and card edit permission;
an old writable board cannot authorize editing a card moved elsewhere.

Ten focused Node runner entries and eight Chromium scenarios pass, including
allowed restoration, denied hidden/moved-card writes, revoked board access,
search/count isolation and existing rule undo/redo. Other browsers, FerretDB
and Sandstorm were not tested. Existing Upcoming coverage remains recorded.

Normal filtering and stale restore attempts can follow legitimate permission
changes, so they are not automatically labelled as account-blocking attacks.
See the [audit](docs/Security/History-Access-Boundary-2026-09-27.md)
for detection limits and the verified scope. No CVE is assigned.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/679a8b349">Reject empty LDAP user credentials in every login path</a>. Thanks to kta1kri and xet7.</summary>

[LdapBindBleed](https://wekan.fi/hall-of-fame/ldapbindbleed/), reported in
[GHSA-m87f-f43w-hwmc](https://github.com/wekan/wekan/security/advisories/GHSA-m87f-f43w-hwmc):
both LDAP user-authentication helpers and the DDP/REST login boundary reject
empty or malformed credentials before binding or local fallback. Passwords
are not trimmed; intentional anonymous service searches remain supported.
Exploitation required a directory permitting unauthenticated binds and user
searches. OpenLDAP documents unauthenticated binds as disabled by default.
Blocked attempts appear as LdapBindBleed summaries in Admin Panel / Problems.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/679a8b349">Enforce LDAP and CAS login-group restrictions</a>. Thanks to xet7.</summary>

[DirectoryGroupBleed](https://wekan.fi/hall-of-fame/directorygroupbleed/):
both LDAP modes enforce group membership and require a unique user entry.
Missing membership values cannot broaden a query, and group denial cannot
fall back to a cached local password. Service-search mode retains service
credentials for its group lookup. LDAP filter and DN values are escaped in
their respective contexts. CAS compares complete literal group CN values,
rejecting prefix and regular-expression matches and malformed allowlists.
Group denials appear as DirectoryGroupBleed summaries in Problems.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/679a8b349">Require single-use SAML request correlation</a>. Thanks to xet7.</summary>

[SamlReplayBleed](https://wekan.fi/hall-of-fame/samlreplaybleed/): require a
live InResponseTo request ID through node-saml and consume verified response
IDs before storing login credentials, including concurrent validation.
Unsolicited IdP-initiated assertions are rejected. Process-local request state
requires sticky routing in clustered deployments. Attributable concurrent
replay denials appear as SamlReplayBleed summaries in Problems.

Verification for all three entries: 46 focused Node suites and five Chromium
scenarios pass; the local Meteor application rebuilds. Tests cover allowed
and refused logins, malformed credentials, group restrictions, safe query
values, logging failure and signed SAML responses. The protocol fixture
reproduces the old replay behavior and rejects replay, unsolicited, unsigned
and tampered responses after the fix. Live directories, external providers,
Sandstorm and the FerretDB authentication matrix were not tested. See the
[authentication audit](docs/Security/Authentication-Boundary-Audit-2026-09-27.md)
for the reviewed providers and limits. Existing Upcoming entries retain their
recorded positive, negative and UI regression coverage.

</details>

Also adds the following feature:

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a76c97461">Map explicit Jira estimates into existing Scrum custom fields</a>. Thanks to xet7.</summary>

The Jira import page accepts an optional numeric estimate field ID and unit.
Import validates the mapping and values before writes, creates a hidden numeric
custom field and selects it for Scrum estimates without enabling Scrum. Jira
export retains the source field ID and unit; native transfer and whole-board
duplication preserve the mapping and remap the local field. Existing import and
export selections require both Scrum and Custom Fields for this mapping.

Sixteen focused Node checks and six Chromium scenarios pass, covering zero,
fractional and missing estimates, invalid inputs, section selection, UI import,
Jira/native round trips, board duplication and existing Jira regressions.
Document the mapping. Live Jira and other browsers were not exercised; existing
Upcoming regression evidence remains recorded.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/59a13f40d">Retain Jira issue types and workflow categories in Scrum transfers</a>. Thanks to xet7.</summary>

Jira import maps issue types and explicit status category keys into existing
hidden Scrum card and list fields. Jira export retains these fields, and the
Scrum selection controls both directions. Unknown categories remain unmapped;
translated status titles never decide completion. Import leaves Scrum settings
and visibility unchanged. Conflicting categories for the same named list and
invalid issue types fail before board creation.

Fourteen focused Node checks and four Chromium scenarios pass, including Jira
and native round trips, excluded fields, invalid inputs, existing completion
policies and time-tracking regression coverage. Document mappings and remaining
external sprint, release, epic and story-point work. Live Jira and other
browsers
were not exercised. Existing Upcoming regression evidence remains recorded;
Blockly translation work remains paused.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/8e4cf5f76">Retain Scrum report context and original commitments in exports</a>. Thanks to xet7.</summary>

Sprint Report and Velocity exports include snapshot estimate source, custom
field and completion policy identifiers. Completed original commitments retain
their start estimates and unknown counts separately from all completed work.
Excel remains tabular; Scrum PDF prints wrapped labelled values for each sprint
so the wide metric set does not disappear into clipped columns. Other chart
PDFs keep their existing table layout.

Sixteen Node checks and one Chromium export scenario pass, covering changed
estimates, added work, unknown context, complete row widths, wrapped PDF labels,
unchanged non-Scrum tables, actual Excel cell values and PDF generation. Update
the report guide. Existing Upcoming regression evidence remains recorded;
other browsers were not exercised. Blockly translations remain paused.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5e67a3bdd">Assign releases from Scrum planning card editors</a>. Thanks to xet7.</summary>

Product Backlog and sprint card tables display release assignments and offer
a selector to assign or clear a release from the current board. The controls
reuse existing card write permissions, reference validation, revision checks
and Scrum History. Card selections remain independent of the release-planning
editor's selected record. No new metadata fields or translation keys are needed.

Six Node checks and five Chromium scenarios pass. The new browser scenario
covers saved selection, clearing, undo/redo and rejected foreign references;
it caught and verified the fix for a selector helper-name collision. Existing
Scrum planning, visibility, permission and export scenarios also pass. Update
the Product Backlog guide. Existing Upcoming regression evidence remains
recorded; other browsers were not exercised. Blockly translations remain paused.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/196faa9cd">Retain sprint calendars and report planned working days</a>. Thanks to xet7.</summary>

Sprint snapshots retain the configured workweek. Sprint Report, Velocity and
their Excel/PDF exports show inclusive planned working-day counts using the
start snapshot's calendar. Later board settings do not rewrite the result.
Legacy snapshots without calendars and missing planned dates remain unknown;
zero working days is a real value. Native transfer validates and preserves
recorded calendars without inventing one for old data.

Twenty-three Node checks and five Chromium scenarios pass, including calendar
isolation, leap dates, invalid/legacy transfers, unchanged counts after board
calendar edits, Excel values, PDF output and existing full-board duplication.
Update the report guide. This is planned duration, not measured daily progress;
daily burndown history remains pending. Existing Upcoming regression evidence
remains recorded; other browsers were not exercised. Blockly translations
remain paused.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/65217313f">Configure Scrum team accountabilities and working days from settings</a>. Thanks to xet7.</summary>

The shared Scrum settings form now exposes Product Owner, Scrum Master,
Developers and working days using existing settings fields. Accountabilities
select active board members without changing permissions. Administrators can
clear assignments and select multiple developers and working days. Existing
validation, revision checks and History undo/redo apply.

Seven local Node checks and five Chromium scenarios pass, covering saved and
cleared selections, invalid members/days, undo/redo, non-admin denial and the
existing Scrum views, exports and visibility settings. One separately gated
DDP Node suite skipped; the browser scenarios exercised the running server.
Four new labels use English fallbacks in catalogs awaiting translations.
Existing Upcoming regression evidence remains recorded; other browsers were
not run. Blockly translations remain paused.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/21504d556">Select card creation and archival in the list Sync popup</a>. Thanks to xet7.</summary>

Add Card and Move Card to Archive switches independently control new-source
card creation and source-absence archival. Both default to enabled for existing
configurations. Disabling either operation leaves matched-card updates and
field selection available. Disabled archival skips child archive preflight;
result counts include only enabled operations. Board write access is required.

Twenty-six focused Node checks and five Chromium scenarios pass. Coverage
includes every operation combination, retained cards, defaults, saved settings,
invalid inputs, nonmember denial and existing conflict messages. Update the
Sync guide and Scrum design checkpoint. Existing Upcoming regression evidence
remains recorded; other browsers and live providers were not exercised.
Project-scoped source identities, atomic jobs and Scrum planning Sync remain
pending. Blockly translation work remains paused.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4aa61c6d5">Opt into Jira spent-time synchronization from the Sync popup</a>. Thanks to xet7.</summary>

Jira Sync can include Spent time (hours), using the existing numeric seconds
conversion. Existing configurations keep time synchronization disabled.
Selected time values share the source baseline and conditional-write guards
with text: local timer or manual edits are preserved or reported as conflicts.
Zero hours remains a value; absent time is not replaced with zero.

Thirty-nine focused Node checks and four Chromium scenarios pass, including
conversion, invalid values, opt-out, zero, conflict detection, popup persistence
and unsupported-field rejection. Updated the Sync guide. Existing Upcoming
regression evidence remains recorded. Other browsers and live Jira accounts
were not exercised. Estimate and Scrum planning Sync remain pending; Blockly
translation work remains paused.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/31c9b1d6d">Select title and description synchronization in the existing Sync popup</a>. Thanks to xet7.</summary>

Title and Description switches default to enabled for existing configurations.
Excluded fields are not compared, overwritten or advanced in the source-text
baseline. Selecting no text fields is supported; new cards use the existing
fallback title and an empty description. Creation and archive selection are
unchanged. The existing write-access check applies to saving these options.

Twenty-nine focused Node checks and four Chromium scenarios pass, covering
selection persistence, unsupported-field rejection, excluded text, new-card
baselines and existing conflict messages. Updated the Sync guide. Existing
Upcoming regression evidence remains recorded; other browsers and live
provider accounts were not exercised. Scrum field mappings remain pending,
and Blockly translations remain paused.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c72b9a4a0">Round-trip Jira time tracking through external JSON export</a>. Thanks to xet7.</summary>

Imported estimate fields carry stable markers, so renaming them does not break
Jira export. Convert hours back to integer seconds; Dates controls spent time
and Custom Fields controls estimates. Never infer semantics from field names
or export ambiguous mappings and invalid values. Native export keeps markers.

Six focused Node checks and one Chromium scenario pass, including renamed
fields, selection exclusions, zero values, native export and real Jira-format
re-import. Existing Upcoming regression evidence remains recorded; other
browsers were not run. Individual worklogs, sprint/release mappings and Sync
remain pending. Blockly translation work remains paused.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ef5c7d00c">Preserve Jira time tracking using existing WeKan fields</a>. Thanks to xet7.</summary>

Jira JSON import converts numeric time-tracking seconds to hours. Spent time
uses the existing card field; original and remaining estimates use numeric
custom fields hidden from minicards by default. Explicit zeroes are preserved,
and invalid durations fail before board creation. Existing Scrum settings can
select the original estimate field. Native export retains the imported values.
Localized duration text and incomplete worklog pages are not guessed.

Four focused Node checks and three Chromium scenarios pass, covering nested
and flat source fields, fractional hours, zero/missing/invalid values, the
import page, native export, Scrum estimate selection and existing Jira import
compatibility. Existing Upcoming regression evidence remains recorded. Jira
sprint/release mapping and external export/Sync integration remain pending;
other browsers were not run. Blockly translation remains paused.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/676536bcd">Visualize sprint reports and velocity with count and estimate bars</a>. Thanks to xet7.</summary>

Sprint Report and Velocity now show responsive horizontal bars above their
existing tables. Switch between card counts and known estimates. Exact values,
unknown-estimate counts and partial-snapshot warnings remain visible. Separate
scales prevent comparisons across incompatible units, estimate sources,
custom fields and completion policies. Native HTML/CSS adds no dependency.

Twelve focused Node checks and four Chromium scenarios pass, covering metric
switching, both chart views, mobile width, zero and unknown estimates, separate
scales, partial warnings, existing permissions and Excel/PDF export. The
expanded report-view scenario was rerun successfully. Existing Upcoming
regression evidence remains recorded; other browsers were not run. Daily
burndown history and the remaining transfer integrations are still pending.
Blockly translation work remains paused.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4af54df66">Preserve Scrum data when duplicating boards</a>. Thanks to xet7.</summary>

The existing duplication selector includes Scrum, selected by default with its
custom-field dependency. Planning records receive new IDs; copied card, list,
swimlane and snapshot references point to the destination. Clearing Scrum
omits its settings and metadata. Copies without cards retain planning records
with reduced snapshots visibly marked partial in reports and Excel/PDF rows.
Source History is not copied, and source board data remains unchanged.

Seventeen Node checks and seven Chromium scenarios pass, covering all copy
selection modes, attachment inclusion/exclusion, reference remapping, omitted
Scrum data, structure-only copies and partial-report labels. Existing Upcoming
regression evidence remains recorded; other browsers were not exercised.
Standalone card/list/swimlane copy and move, scoped import, History transport
and Sync remain separate pending work. Blockly translation remains paused.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e0863b35c">Restore Scrum data when importing a native board export</a>. Thanks to xet7.</summary>

Native new-board import validates the versioned Scrum section before creating
users or boards, then remaps planning, card, list, swimlane, user and estimate
field references. Snapshots retain their outcomes, source provenance is kept,
and imported accountabilities grant no permissions. Deselecting Scrum omits
its payload and metadata. Board administrators can inspect import losses.

Nineteen focused Node checks and three native import/export Chromium scenarios
pass. The import-page round trip covers release links, exact event timestamps,
numeric estimate remapping, zero values, provenance and loss reporting.
Invalid sprint and estimate-field references create no board. Existing
Upcoming regression evidence remains recorded; other browsers were not run.

Universal History transfer, existing-board scoped import, duplication and Sync
remain pending. Imports are not multi-document transactions, so database
failure after validation can still leave a partially created board.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d70358219">Include versioned Scrum data in native board exports</a>. Thanks to xet7.</summary>

The export selector includes Scrum settings, planning records, optional item
metadata and lifecycle snapshots. Scoped exports retain referenced planning
records, reduce snapshots and follow-up links, mark partial snapshots and
report omitted dependencies. Operational checkpoints and revision counters
are excluded. Existing anonymization covers the added prose fields.

Eleven focused Node checks and three Chromium-driven HTTP scenarios pass,
covering complete/scoped exports, omitted sections and estimate fields,
assigned-only denial and enabled/disabled anonymization. Existing Upcoming
regression evidence remains recorded. History transfer, board
duplication and Sync integration remain pending; this does not yet establish
a complete Scrum backup/restore round trip including History. Other browsers
were not exercised. Native new-board import is covered by its separate entry.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/89a06f1d5">Edit Scrum releases and events from Sprints</a>. Thanks to xet7.</summary>

Board administrators select existing releases and events to edit them using
the existing revision-checked methods. Release forms expose goals, planned
dates, status, release timestamps and notes. Event forms include local time,
timebox, notes and visible follow-up cards; summaries link those cards.
Unchanged event and release timestamps keep their original precision.

Four Chromium scenarios and twelve focused Node checks pass. Coverage includes
updating rather than duplicating records, exact event timestamps, follow-up
retention, History undo, administrator checks and hidden-by-default metadata.
Three new source keys are registered in every catalog; this does not resume
the paused Blockly translation work. Other browsers were not exercised.
Existing Upcoming regression evidence remains recorded.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ceb19bc77">Integrate Scrum changes with reversible board History</a>. Thanks to xet7.</summary>

Each Scrum view opens the existing board History filtered to Scrum changes.
Settings, planning records and optional metadata record before/after values;
a sprint close and its card moves undo and redo as one operation. Restoration
checks current board and card permissions, preserves unrelated card content,
and rejects newer conflicting edits or deletion of referenced planning data.

Interrupted restores retain a private checkpoint until data, timeline and undo
status are saved. Retrying resumes completed writes without duplicating the
timeline or accidentally undoing an older change. This is not a transaction;
original-edit/History atomicity and large-board limits remain documented work.

Eighteen focused Node checks, one real Meteor/Mongo lifecycle test and fifteen
Chromium scenarios pass. Coverage includes the History menu and restore,
compound undo/redo, access denial, conflicts, planning record recreation,
reference protection and interrupted recovery. Existing Upcoming regression
evidence remains recorded. Firefox, WebKit and FerretDB were not exercised.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/83eac1021">Add Scrum planning, optional metadata and sprint snapshot reports</a>. Thanks to xet7.</summary>

Board View adds Product Backlog, Sprints, Sprint Report and Velocity. Reuse
existing estimates and card permissions with board-local sprint plans,
revision checks, start/close snapshots and recoverable unfinished-work rollover.
Board Settings controls independent hidden-by-default metadata on cards,
minicards, lists and swimlanes. Release and event creation is included.

Report tables keep unknown estimates distinct from zero and export through
the existing Excel/PDF workflow. Assigned-only members receive explicitly
labelled partial reports. Native checkbox controls remain visible in settings,
and the public-board view selector recognizes the new views.

Twelve focused Node checks, one real Meteor/Mongo lifecycle regression and
three Chromium scenarios pass. Coverage includes stale/foreign writes,
permission denial, lifecycle snapshots, rollover retries, actual Excel/PDF
files and independent Card/Minicard visibility. Other browsers and FerretDB
were not exercised. Existing Upcoming regression evidence remains recorded.

The menu-aligned Scrum guides distinguish the implemented planning feature
from pending complete import/export/sync mappings,
interactive charts. These remain active
implementation work; this entry does not claim complete Scrum support.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/539aef4aa">Save rule configuration changes in reversible board history</a>. Thanks to xet7.</summary>

Rule creation, edits, enabled state and deletion record snapshots containing
the rule, trigger and action. Compound edits produce one history entry.
Existing History can undo, redo and restore these changes; restoration checks
current board-admin access and action destination permissions. Stale undo
requests cannot overwrite another administrator's newer configuration.

Three Chromium scenarios cover lifecycle undo/redo, ordinary-member rejection
and conflicting edits. Existing history, rule and undo suites also pass.
This reuses board history rather than adding an independent audit store.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d273b86ed">Edit IFTTT rules with locally loaded Blockly blocks</a>. Thanks to xet7.</summary>

Board administrators can drag, edit and save rule blocks using the existing
rule engine. List, Workflow, Blocks and History have direct sidebar choices.
Workflow writes use server methods. Blockly 13.3.0 and its local media load
only when the editor is opened; no generated code or remote scripts execute.
Unknown rule fields survive edits, and changed drafts retain conflict checks.

All 696 Blockly messages map to WeKan translation keys. Existing upstream and
local translations are preserved, with additional direct translations in
completed language batches. Other locales still contain English fallbacks;
translation of every language is not finished. Cornish, Manx, Gaelic, Breton,
Kashubian, Upper Sorbian, Silesian and several regional Romance languages
need native review of specialist terminology. No translation service is used.

Five Blockly/catalog Node checks and four Chromium scenarios pass, including
round trips, invalid workspaces, preserved parameters, permission rejection,
Finnish and Arabic editing, drag operations and rule execution. Catalog checks
verify key order and placeholders across all 246 locale files. The Blocks
guide documents usage, supported editing and remaining translation work.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/8bf47d1a9">Choose which structure and data to duplicate from selected boards</a>. Thanks to xet7.</summary>

All Boards / Multi-selection now has one Duplicate Board action. It opens a
checkbox popup with all choices selected, Select All, Select None and Cancel.
Choose swimlanes, lists, labels, custom fields, rules, outgoing webhooks, cards,
checklists with their items, comments and attachments. Selecting child data
selects its required containers; clearing a container clears its children.
The separate Duplicate Board — Without cards action is removed; clear Cards
in the popup instead. Select None copies only the board itself and its settings
and access roles, without source structure or content.

Server validation and board-admin permission checks remain enforced. Scoped
copies remap parent/subtask and dependency links, preserve custom-field values
without sharing source definitions, and omit deselected labels and covers.
Attachment copying now imports its dependencies explicitly, waits for flushed
bytes and the installed Meteor-Files promise API, and propagates stream errors.

Verification: ten focused Node suites (14 runner entries) and nine Chromium
scenarios pass. Coverage includes full, cards-only, swimlane-only and empty
copies, real attachment bytes and covers, unchanged source data, multi-board
selection, cancellation, invalid options and non-admin rejection. Other browser
engines, cloud attachment stores and live FerretDB backends were not tested.
Existing Upcoming entries retain their recorded positive, negative and UI
coverage. Updated the All Boards documentation.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/67c5df253">Show a single comment in the minicard badge tooltip</a>. Thanks to lonix1 and xet7.</summary>

Hovering the minicard comment-count badge shows the comment text when exactly
one visible, nonempty comment exists. Multiple or empty comments retain the
localized count message. Reuses existing published data and renders the title
as plain text; no new dependencies, subscriptions or permissions are needed.
Fixes [#1933](https://github.com/wekan/wekan/issues/1933).

Three focused Node suites and two Chromium scenarios pass, covering single,
multiple, empty and malformed comment data, HTML-looking text, admin/read-only
access and private-board comment isolation. Other browser engines and live
FerretDB backends were not tested. Existing Upcoming changes retain their
recorded positive, negative and UI regression coverage. Updated the comment
feature documentation and open-issue audit.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/8ad064346">Filter subtasks by their parent card</a>. Thanks to robinvd and xet7.</summary>

Card actions now offer Filter: Subtasks. The Filter sidebar also offers parent
cards from the current board. Both use the existing `parentId` relationship and
filter engine, showing direct children without changing any cards. Multiple
parents can be selected, and changing boards clears this selection. Read-only
members can filter; private parent titles are not fetched or disclosed.
Fixes [#1871](https://github.com/wekan/wekan/issues/1871).

Verification: nine focused Node checks and three Chromium scenarios pass,
covering parent selection, combined filters, reset, admin/read-only access,
private-parent publication boundaries and unchanged card data. The Chromium
run also rechecks the private-source linked-card regression from
[#1942](https://github.com/wekan/wekan/issues/1942), already closed by
[the private-source fix](https://github.com/wekan/wekan/commit/9cdbe1a53).
Other browser engines and a live FerretDB backend were not tested.

Removed the completed parent-filter and private-linked-card entries from TODO
Later. Corrected the reminder entry: scheduled due/overdue rule triggers exist;
assignee email recipients and start-date reminders remain pending under
[#4278](https://github.com/wekan/wekan/issues/4278). Updated the filter, subtask
and open-issue audit documentation.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/abf0a1934">Preserve valid MongoDB updates when editing rule documents</a>. Thanks to xet7.</summary>

Trigger and action timestamp hooks now distinguish replacement documents
from update modifiers. Replacement edits preserve creation timestamps without
mixing top-level fields with $set, which MongoDB rejects. Modifier updates
continue to set their modification timestamp.

Two focused tests exercise both forms and ensure replacement documents never
receive update operators. Browser rule-editing scenarios also pass.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0a8334ef1">Keep rules-page text and controls visible across layouts</a>. Thanks to xet7.</summary>

Long titles, trigger descriptions and buttons wrap within their rows.
Controls participate in layout instead of overlapping through absolute
positioning. Small screens stack the trigger menu and form, while workflow
cards and primary-button icons remain readable with the current theme.

Four Chromium scenarios pass at desktop and mobile widths with English and
Arabic, including blue, dark and light themes. They check every trigger and
action category, long content and control boundaries.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/156dbf0ec">Apply import and export anonymization to Scrum prose</a>. Thanks to xet7.</summary>

Known username mentions in Scrum goals, definitions, acceptance criteria,
swimlane purpose and planning text use the existing anonymization map. Native
streaming export now applies the same pass to board and swimlane fields.
Identity references, estimate units, source provenance and snapshots retain
their meaning. This rewrites mentions, not arbitrary personal information.

Six focused Node checks and one Chromium-driven native export scenario pass.
The export test covers enabled/disabled anonymization and unchanged stored
data. Canonical transfer text is covered by unit tests; native Scrum planning
record transfer remains pending. Existing Upcoming evidence remains recorded.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c35e84c1f">Keep read-only Scrum viewing out of write-denial logging</a>. Thanks to xet7.</summary>

Rendering card capabilities no longer records an attempted write for ordinary
read-only members. This prevents false account blocking while keeping the
same permission decisions and denial logging for actual mutations.

Ten focused Node checks and one Chromium scenario pass. Coverage verifies
role permissions, default mutation logging and repeated read-only Scrum views
without losing the session. Existing Upcoming regression evidence remains
recorded; other browser engines were not run for this fix.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/72f846345">Resume interrupted sprint closes from the Sprints view</a>. Thanks to xet7.</summary>

Board administrators can resume a closed sprint whose card rollover was
interrupted, using its saved revision and destination. A pending History
recovery blocks this action until it finishes. The recovery button disappears
when all pending cards have been handled.

Seven focused Node checks and the Chromium recovery scenario pass, including
read-only denial, pending History exclusion and successful card rollover.
The related Scrum and History browser suites also passed. Register the new
source message in every catalog; Blockly translation work remains paused.
Existing Upcoming coverage remains recorded. Other browsers were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/89f7aa985">Separate partial Scrum reports from complete chart scales</a>. Thanks to xet7.</summary>

Partial snapshots from scoped imports or restricted views no longer share a
chart scale with complete sprint snapshots. Keep the existing visible warnings
and exact totals. Assigned-only reports continue to exclude hidden cards and
their estimates from both chart data and exported workbooks.

Nine focused Node checks and one Chromium scenario pass. The browser scenario
checks rendered counts, metric selection, partial warnings, server snapshot
filtering and Excel values for an assigned-only member. Existing Upcoming
regression evidence remains recorded; other browsers were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5ac57edde">Avoid repeated full-snapshot scans in Scrum reports</a>. Thanks to xet7.</summary>

Completed-commitment totals now use an index of completed card IDs instead of
scanning the closing snapshot for each original card. This keeps matching work
linear at the supported 10,000-card snapshot limit while retaining original
commitment estimates and separate added/removed scope totals.

The deterministic work-bound regression fails before the fix and passes after
it. Fourteen focused Node checks and two Chromium scenarios pass, including
report metric selection, assigned-only filtering and Excel/PDF output. Existing
Upcoming regression evidence remains recorded; other browsers were not run.
This does not resolve the remaining large-board History storage limits.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e685866c1">Preserve Jira estimate mappings through the custom-field editor</a>. Thanks to xet7.</summary>

Saving the existing custom-field popup no longer erases valid Jira time markers
from numeric fields when rebuilding their settings. Renaming an imported
estimate through the UI retains its meaning for Jira export. Invalid markers
and markers on non-numeric fields are not retained by the editor.

Seven focused Node checks and one Chromium scenario pass. Tests execute the
production save handler, cover valid/invalid markers, and rename through the
actual popup before exporting and re-importing Jira time values. Existing
Upcoming regression evidence remains recorded; other browsers were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1ebc4e3b8">Honor import selections for Jira estimates and spent time</a>. Thanks to xet7.</summary>

The existing import selector now removes Jira's nested time fields and their
flat fallbacks before creation. Custom Fields controls original/remaining
estimates; Dates controls spent time. Excluded estimates do not create numeric
custom fields, and fallback values cannot silently restore excluded data.

Seven focused Node checks and two Chromium scenarios pass. The browser tests
exercise Dates-only and Custom-Fields-only imports and retain full native,
Jira and board-copy round-trip coverage. Updated the Jira guide. Existing
Upcoming regression evidence remains recorded; other browsers were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/fe3d55ba7">Reject malformed Sync responses before changing cards</a>. Thanks to xet7.</summary>

List Sync reuses the existing import source-shape validator before parsing and
reconciliation. Malformed responses and parser failures set the existing error
without creating, changing or archiving cards. A valid empty source retains
existing archive behavior; an invalid response no longer masquerades as one.

Five focused Node checks and one Chromium scenario pass. Server tests execute
the sync function with malformed, valid-empty and parser-failing responses;
the browser verifies error display separately without contacting a provider.
Existing Upcoming regression evidence remains recorded. Complete pagination
and local-edit conflict handling remain pending. Other browsers were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/11b80633c">Fetch all advertised issue pages before synchronizing lists</a>. Thanks to xet7.</summary>

Sync now follows Jira REST v2 search offsets and GitHub, Gitea/Forgejo and
GitLab next-page headers before reconciling cards. Validate advertised totals;
abort failed, incomplete, changing or looping pagination instead of returning
partial results that could archive later-page cards. Limit runs to 1,000 pages
or 100,000 items. Pagination stays on the configured origin; redirects fail.

Eleven focused Node checks and the Chromium Sync error-display scenario pass.
Mocked provider responses exercise multi-page success, short pages, failures,
missing links, bounds and invalid origins. No live provider account was used.
Existing Upcoming regression evidence remains recorded. Jira Cloud's newer
search endpoint and local-edit conflict handling remain pending; other
browsers were not run. Updated the Sync guide with provider references.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/7977c68a3">Use enhanced Jira Cloud search for list synchronization</a>. Thanks to xet7.</summary>

Standard `.atlassian.net` tenant URLs now use REST v3 enhanced JQL search with
explicit parser fields and token pagination. Missing termination metadata or
repeated tokens abort before reconciliation. Self-hosted Jira retains the
existing offset-based search path. Shared page/item limits still apply.

Thirteen focused Node checks pass using mocked provider responses, including
opaque-token encoding, required fields, empty results, malformed responses
and retained self-hosted pagination. Existing Sync popup browser coverage and
Upcoming regression evidence remain recorded. No live Jira account was used.
Custom Cloud domains and government-cloud endpoint selection remain pending;
no new UI was added. Updated the Sync guide with the API reference.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/6efec562e">Reject ambiguous source identities before list synchronization</a>. Thanks to xet7.</summary>

Normalized Sync tasks must have unique valid external IDs and string text
fields. Missing IDs no longer disappear silently from reconciliation, and a
duplicate ID cannot silently replace an earlier source record. Invalid task
collections use the existing error path before any card mutation. Valid empty
sources and unchanged records retain their existing behavior.

Fifteen focused Node checks and the Chromium Sync error-display scenario pass.
Tests execute the sync function with malformed normalized tasks and confirm
zero card writes. Existing pagination, parser and reconciliation checks pass.
Updated the Sync guide. Existing Upcoming regression evidence remains recorded;
other browsers and live provider accounts were not exercised.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b254b7d3a">Preserve local title and description edits during Sync</a>. Thanks to xet7.</summary>

Store the last accepted source text on synced cards. Upstream-only changes
merge, local-only changes remain, and differing edits on both sides stop the
run before card writes. Legacy cards adopt a baseline only when local and
source text agree. The existing Sync popup identifies conflicting source IDs
and fields; aligning both texts permits a retry.

Conditional updates reject intervening text, archive-state or location changes.
Sync now displays structured failures as errors rather than success. Twenty-two
focused Node checks and two Chromium scenarios pass, including merge decisions,
legacy baselines, concurrent-write rejection and popup error handling. Provider
responses are mocked; no live tracker account was used. Earlier successful
writes can remain after a later race: this is not a transaction. Dedicated
resolution controls, Scrum mappings and fully atomic Sync remain pending.
Existing Upcoming regression evidence remains recorded; other browsers were
not run. Blockly translations remain paused.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/85b5f28bc">Keep copied cards independent from external Sync identities</a>. Thanks to xet7.</summary>

Card and subtask copies no longer inherit external Sync IDs, source types or
last-source text. The original mapping remains intact. Sync refuses existing
duplicate local mappings before updates or archives, instead of selecting an
arbitrary matching card. The existing popup reports the duplicate identity.

Seventeen focused Node checks and one Chromium board-copy scenario pass.
Coverage exercises real copy bodies, source preservation, subtask fields and
zero card writes when local identities are duplicated. The browser confirms
Scrum references still remap while copied Sync identities are absent. Updated
the Sync guide. Existing Upcoming regression evidence remains recorded;
other browsers and live provider accounts were not exercised.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/18c660916">Guard Sync archives against moved cards and independent subtasks</a>. Thanks to xet7.</summary>

Source-absence archives now verify the original card text, baseline, archive
state and board/list location before writing. Concurrent changes stop the
remaining run. Sync no longer recursively archives subtasks; an active subtask
outside the source archive plan stops the run before card writes.

Nineteen focused Node checks and three Chromium error-display scenarios pass.
Server tests cover valid removal, concurrent change rejection and independent
subtask protection. Browser tests check structured archive errors alongside
text conflicts and malformed-source errors. Updated the Sync guide. This is
not a transaction, and concurrent child creation remains outside the guard.
Existing Upcoming regression evidence remains recorded; other browsers and
live provider accounts were not exercised.

</details>

This release adds the following regression coverage and documentation:

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0e7394cd8">Keep manual rule buttons consistent with trigger changes</a>. Thanks to xet7.</summary>

Changing a manual button rule to an automatic trigger clears stale button
type/label fields used by button menus. REST creation and trigger updates now
synchronize those fields too. History restores trigger and button metadata
together, so undo brings back the manual button and redo removes it again.

Eight Node runner checks and two Chromium scenarios pass. Browser coverage
checks editor and REST creation/changes, actual board-button visibility and
undo/redo. Update the History guide. Existing Upcoming regression evidence
remains recorded; other browsers were not exercised. Blockly translations
remain paused.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/21cb6e8c8">Isolate shared trigger/action changes when editing rules</a>. Thanks to xet7.</summary>

Editing a shared trigger or action creates a private component for the edited
rule instead of changing sibling rules. Unshared IDs remain stable; REST keeps
partial-update semantics and the editor retains full replacement. Unchanged
shared patches do not clone records. History undo/redo restores references and
removes superseded private components only when they are no longer referenced.

Nine Node runner checks and eight Chromium History scenarios pass, including
the actual component writer, both edit transports, unchanged sibling records,
undo/redo and cleanup. Existing deletion, permission and REST attribution checks
also pass. Update the History guide. Concurrent writes remain nontransactional.
Existing Upcoming regression evidence remains recorded; other browsers were
not exercised. Blockly translations remain paused.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/7472456ad">Preserve shared triggers and actions when deleting rules</a>. Thanks to xet7.</summary>

Editor, REST and History deletion share cleanup that retains trigger/action
records referenced by another rule. Removing the final reference cleans them
up. History can restore a deleted rule using unchanged shared components but
refuses to overwrite shared content edited since the snapshot. Reference checks
remain nontransactional across documents.

Three Node suites and six Chromium History scenarios pass, including both
deletion transports, shared-reference preservation, successful restoration,
changed-component refusal and final-reference cleanup. Existing permissions,
compound edits and REST History attribution remain covered. Update the History
guide. Existing Upcoming regression evidence remains recorded; other browsers
were not exercised. Blockly translations remain paused.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e0bcf7bde">Record compound Rules REST changes in reversible History</a>. Thanks to xet7.</summary>

Rules REST creation, editing and deletion use the shared rule-history wrapper
with the authenticated API user. Rule, trigger and action changes form one
entry per request, and unchanged requests add none. Undo/redo restores compound
edits and deleted rule documents through existing permission/conflict checks.
This groups History recording; it does not make compound writes transactional.

Four Node suites and four Chromium History scenarios pass. The REST scenario
verifies attribution, entry counts, no-op suppression, unauthorized-write
denial,
compound undo/redo and deletion recovery. The final no-op extension also passes
on rerun. Update the History guide. Existing Upcoming regression evidence
remains recorded; other browsers were not exercised. Blockly translations
remain paused.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d269c8c70">Reject incompatible Scrum snapshot policies in native transfers</a>. Thanks to xet7.</summary>

Native Scrum transfer requires start and close snapshots to agree on estimate
unit, source, custom-field identifier and completion policy. This matches the
existing active-sprint configuration rule and prevents imported reports from
combining unlike totals under a single context. Recorded workweek calendars
may still differ; planned duration uses the start calendar.

Twenty-two Node checks and one Chromium native-import scenario pass, including
valid round trips and rejection of each policy mismatch before board creation.
Update the report guide. Reporting external historical sprints with mixed
policies remains pending and is not silently approximated. Existing Upcoming
regression evidence remains recorded; other browsers were not exercised.
Blockly translations remain paused.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/05e8bce70">Validate native Scrum snapshot lifecycle consistency</a>. Thanks to xet7.</summary>

Native imports reject snapshot timestamps that disagree with sprint lifecycle
dates, started history on planned sprints, completion data on unfinished
sprints,
and contradictory cancellation history. Cancellation before start remains valid
without a commitment snapshot. Validation runs before board creation and keeps
imported report timelines consistent with the server's sprint lifecycle methods.

The new regression fails against the previous validator. Twenty-seven focused
Node checks and two Chromium scenarios pass, covering valid active/cancelled
states, malformed lifecycle data, native round trips and board duplication.
Update the Scrum design. Other browsers were not exercised; existing Upcoming
regression evidence remains recorded. Blockly translations remain paused.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9d60f7bf0">Import Jira status names without inherited-property collisions</a>. Thanks to xet7.</summary>

Jira status names such as constructor, toString and __proto__ no longer resolve
to JavaScript object properties instead of new list IDs. Issue-key lookups also
exclude inherited properties, so missing dependency targets remain missing.
Preserve imported list categories and real dependency links.

The Chromium regression reproduced the original List ID validation failure.
Fourteen focused Node checks and five Chromium scenarios pass after the fix;
the expanded regression also verifies rendered lists/cards, preserved Scrum
categories, real links and ignored missing targets. Live Jira and other browsers
were not exercised. Existing Upcoming regression evidence remains recorded;
Blockly translations remain paused.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9f3fbfd52">Keep Scrum planning order consistent for equal ranks</a>. Thanks to xet7.</summary>

Product Backlog and sprint card tables break equal effective-rank ties with
stable card IDs. Database fetch order no longer decides tied positions.
Explicit zero ranks and negative normal list positions retain their existing
meaning. Document this ordering in the Product Backlog guide.

Twenty focused Node checks and three Chromium scenarios pass, covering
different fetch orders, unchanged input data, rank precedence, metadata edits,
refreshes, release assignment and rank History. Other browsers were not run.
Existing Upcoming regression evidence remains recorded. Blockly translations
remain paused under TODO Later.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c6ac0014c">Separate unset Scrum ranks from normal board sort positions</a>. Thanks to xet7.</summary>

The planning editor no longer puts a potentially negative board sort position
into a nonnegative Scrum rank input. Unset ranks remain blank, display as a
dash and use normal card order as their sorting fallback. Clearing a rank
stores null; zero remains an explicit rank and negative ranks remain invalid.
The optional card metadata editor uses the same clearing behavior.

Fourteen Node checks and two Chromium scenarios pass, covering unrelated edits
on a negative-sort card, explicit zero, clearing, History restoration, rejected
negative ranks and native transfer of null. Update the Product Backlog guide.
Existing Upcoming regression evidence remains recorded; other browsers were
not exercised. Blockly translations remain paused.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/50a6e92e8">Preserve Scrum workflow categories in cross-board list moves</a>. Thanks to xet7.</summary>

New destination lists retain their source workflow category when moving a list
or swimlane across boards. A reused destination list retains its own category
and revision; incoming cards do not silently change its workflow meaning.
Newly created list metadata starts with revision 1.

Six Node runner entries and four Chromium scenarios pass, covering both move
paths with new and reused lists. Update the Scrum design checkpoint. This does
not complete moved-card/swimlane sprint and release references, lifecycle
coordination or History restoration. Existing Upcoming regression evidence
remains recorded; other browsers were not exercised. Blockly translations
remain paused.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2b6d71bdc">Preserve scoped Scrum metadata in list and swimlane copies</a>. Thanks to xet7.</summary>

Standalone list copies retain their workflow category with a fresh metadata
revision. Swimlane copies preserve purpose and copied-list categories;
cross-board copies omit foreign sprint/release links, while same-board copies
retain them. Shared copy paths no longer mutate source container objects.
Full-board duplication continues to defer metadata to its transfer remapper.

Seven Node runner entries and three Chromium scenarios pass, including
same/cross-board containers, unchanged sources, standalone cards and full-board
remapping. The new container browser test was corrected to use the existing
method's boolean return contract, then passed on rerun. Update the Scrum design.
Existing Upcoming regression evidence remains recorded. Move integration and
standalone planning-record mapping remain pending; other browsers were not run.
Blockly translations remain paused.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/8be9b79de">Prevent foreign Scrum planning references in standalone card copies</a>. Thanks to xet7.</summary>

Card and subtask copies now start a fresh Scrum metadata revision. Same-board
copies retain planning associations. Cross-board standalone copies preserve
issue type and acceptance criteria but omit source sprint, past-sprint, release
IDs and board-relative rank. Source cards are unchanged. Full-board duplication
still remaps planning records through its existing transfer implementation.

Thirteen Node runner entries and two Chromium scenarios pass, covering copied
subtasks, same/cross-board metadata, omitted metadata and full-board remapping.
Update the Scrum design with the standalone-copy limits. Planning-record
selection for standalone transfers and move integration remain pending.
Existing Upcoming regression evidence remains recorded; other browsers were
not exercised. Blockly translations remain paused.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/14a4d62fb">Verify Jira estimate mappings across native imports and board copies</a>. Thanks to xet7.</summary>

Expand the Chromium transfer scenario to export a Jira-imported board as
native WeKan JSON, import it, and duplicate the source board. Both destinations
retain renamed estimate markers, allocate new custom-field IDs and remap the
Scrum estimate-field reference. Subsequent Jira exports preserve numeric time
values, including zero remaining work.

The expanded browser scenario passes; its existing invalid-input, selection
exclusion and popup-rename checks also pass. Update the Jira feature guide.
Existing Upcoming regression evidence remains recorded. Other browsers and
standalone card/list/swimlane transfers were not tested in this change.

</details>



<details>
<summary><a href="https://github.com/wekan/wekan/commit/2ff687756">Define shared Scrum transfer validation and ID remapping</a>. Thanks to xet7.</summary>

The versioned data contract covers settings, planning records, snapshots and
item metadata. Destination ID maps remap references; omitted cards and actors
produce explicit losses, and reduced snapshots are marked partial. Validation
rejects invalid dates, inconsistent totals, foreign planning references,
permission fields, recovery checkpoints and ID collisions.

Fifteen focused Node checks pass, including four executable transfer suites.
This is shared implementation groundwork: native import/export, duplication,
external adapters, Sync, History transfer and anonymization integration remain
pending. There is no new transfer UI or end-to-end transfer claim. Existing
Upcoming regression evidence remains recorded; Blockly translation is paused.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0e5b48c86">Record the release pause and unfinished development handoff</a>. Thanks to xet7.</summary>

Pause implementation, translations and audits at the maintainer's request.
TODO Later records implemented checkpoints, remaining Scrum/Sync and History
work, translation coverage, open-issue/UI/security follow-ups and verification
limits. Refresh the read-only Blockly report and mark the Blocks guide paused.
Wrap overlong Upcoming prose without changing published release sections.

Commit-link, release-placement and seven catalog checks pass. Existing feature,
fix and security regression evidence remains in its corresponding entries;
this documentation-only handoff adds no application behavior. The full format
check still flags one pre-existing overlong line in published v12.07. A complete
release build/test matrix was not run. No remote writes or version bumps occur.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0574cd4c0">Verify the combined Rules, Blocks and History integration</a>. Thanks to xet7.</summary>

Update the Blocks guide with REST History behavior, shared-component handling
and button restoration. Correct stale translation wording to reflect the
maintainer's pause. No translation values changed.

The combined Blocks, History and Rules visibility browser run passes all 18
Chromium scenarios on local Meteor/MongoDB, including Finnish/Arabic editing,
rule execution, permissions, REST writes, undo/redo, shared components and
390px/1440px theme layouts. A broader 37-file rule/workflow Node run passes 45
runner checks; three separate Blockly catalog checks also pass. Other browser
engines and FerretDB were not exercised. Concurrent History writes and complete
translation remain open work. Existing Upcoming regression evidence is retained.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c666a69b2">Document Scrum capabilities and the remaining implementation plan</a>. Thanks to xet7.</summary>

Audit existing estimates, charts, history, permissions and data transfers
before adding Scrum data. The menu-aligned design describes product backlogs,
sprint lifecycle and reports, hidden metadata, import/export mappings and
regression requirements. Existing Scrum and Board View guides link the plan.

This entry records the design document. The subsequent Scrum planning entry
above describes implemented behavior; complete Scrum data transfer and other
remaining requirements stay explicit in the updated design.

The Upcoming coverage audit retains existing positive, negative and browser
regressions for authentication, duplication, comment tooltips, parent filters
and mirroring. New rule changes pass 19 focused Node runner entries, five
Blockly/catalog checks and 11 Chromium scenarios. External login providers,
other browser engines and live FerretDB were not exercised in this batch.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/8cbd8c5ed">Verify duplicated boards start a new activity history</a>. Thanks to sfahrenholz and xet7.</summary>

Existing board duplication excludes old board/card activity records. Document
that behavior and verify both Duplicate Board actions through the browser,
with and without cards. Old source history remains intact; new creation events
on the copy are allowed. Confirmation cancellation and non-admin rejection
remain covered. Closes [#2321](https://github.com/wekan/wekan/issues/2321)
without changing existing permissions or adding a redundant history option.

Three Chromium scenarios and four focused Node suites pass. Verification used
MongoDB; other browser engines and live FerretDB backends were not exercised.
The existing Upcoming parent-filter entry retains its recorded positive,
negative and browser coverage. Refreshed the open-issue inventory (132 open)
and recorded that #1273 still needs a retain-autocomplete-text option.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e2713cd0d">Keep Codeberg mirroring commented out and create missing local mirror clones</a>. Thanks to xet7.</summary>

The commented Codeberg destination in releases/mirror.sh now also prevents
older saved settings from selecting it. GitLab and SourceForge remain enabled.
Missing source and destination repositories are cloned below the checkout's
.tools directory, including ~/Documents/repos/wekan/.tools/wekan-github on
macOS. Source mirror refs are fetched into that clone instead of the primary
WeKan checkout. Existing mirror worktrees retain their branch and dirty-tree
checks, and destination updates are not forced.

Verification: 49 mirror test entries pass with mocked external commands,
including menu choices, stale settings, fresh clones, paths containing spaces,
clone failures and existing checkout protections. Shell syntax and diff checks
pass. No live mirror command or remote write was executed. Existing Upcoming
regression coverage remains recorded in its entries. Updated mirroring docs.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/22d9124ee">Allow reviewed dependency funding links during release checks</a>. Thanks to xet7.</summary>

The release risk audit rejected three funding URLs in CSSTools and parse5
dependency metadata. Allow those exact URLs only in package-lock.json. Other
URLs, changed query strings, lookalike hosts, application-code URLs and
suspicious keywords remain checked; source hash changes stay informational.

All ten risk-audit tests and three release-launcher runner checks pass. The
local release audit passes with advisory fingerprint warnings. Existing
Upcoming entries retain their regression coverage; this configuration fix
has no UI behavior. No release build or publication was run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b929ffe8c">Complete Blockly translations in four more Romance languages</a>. Thanks to xet7.</summary>

Fill remaining Blockly and Blocks editor prose in Friulian, Ladin, Romansh
and Aromanian. Correct wrongly seeded shared labels while retaining existing
correct-language translations. Ladin dialect choices and Aromanian technical
neologisms have low confidence; native review is welcome for these and
specialist Friulian terms. Other unfinished language catalogs remain pending.

All three catalog regression checks pass: message coverage, key order, exact
placeholder inventories and preservation of existing translations. The current
Blockly browser coverage and other Upcoming regression results remain valid.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ad0ad0b2b">Complete Gujarati Blockly prose and editor placeholder filling</a>. Thanks to xet7.</summary>

Fill 85 text-operation and remaining editor messages. All audited Gujarati
Blockly prose and Blocks-editor messages now have translations. Explicit test
exceptions retain printed key names, platform brands, OK, mathematical notation,
URLs and nonlinguistic symbols. This establishes placeholder coverage, not
native
fluency; specialist terminology still needs review. Update TODO Later and the
Blocks guide. Other languages remain in progress.

Seven catalog checks, 21 human-translation preservation checks and one Chromium
scenario pass. Browser coverage verifies Gujarati navigation to Blocks,
dragging,
field editing, saving and translated context menus. Other browsers and screen
readers were not exercised. Existing Upcoming regression evidence remains
recorded.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/25498de22">Translate Gujarati Blockly shortcuts and workspace messages</a>. Thanks to xet7.</summary>

Fill 60 Gujarati English placeholders for keyboard shortcuts, screen-reader
mode hints, workspace summaries, search and navigation. Preserve placeholders,
key names inside shortcut instructions and existing translations. Extend checks
for direction labels, mode distinctions and search shortcuts. Gujarati remains
incomplete; accessibility terminology needs native review.

Six catalog checks and 21 human-translation preservation checks pass. Update
the Blocks guide. Existing Gujarati Chromium coverage remains recorded; this
batch did not add a browser or screen-reader run. Existing Upcoming regression
evidence remains recorded.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ba0ab5ce8">Translate Gujarati Blockly procedures and variable controls</a>. Thanks to xet7.</summary>

Fill 38 Gujarati English placeholders for function definitions, parameters,
return values, variable creation, renaming and conflict messages. Preserve
existing translations and placeholders. Extend Gujarati vocabulary checks to
these groups and distinguish variable reads/writes and return/no-return
functions. The catalog remains incomplete; specialist terminology needs review.

Five catalog checks and 21 human-translation preservation checks pass. Update
the Blocks guide. Existing Gujarati Chromium coverage remains recorded; no
new browser run was performed. Existing Upcoming regression evidence remains
recorded.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9b7135f43">Translate Gujarati Blockly mathematical descriptions</a>. Thanks to xet7.</summary>

Fill 86 Gujarati English placeholders for arithmetic, constants, numeric tests,
statistics, rounding, logarithms and trigonometry. Keep function notation,
mathematical symbols and placeholders intact. Specialist mathematical wording
has low confidence and needs native review; the catalog remains incomplete.
Update the Blocks guide with the additional translated groups.

Five catalog regression checks and 21 human-translation preservation checks
pass. New checks cover translated math prose, preserved notation and distinct
even/odd, mean/median and rounding directions. Existing Gujarati Chromium
coverage remains recorded; no new browser or screen-reader run was performed.
Existing Upcoming regression evidence remains recorded.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/67d1e228e">Translate Gujarati Blockly list operations and tooltips</a>. Thanks to xet7.</summary>

Fill 75 Gujarati English placeholders for creating lists, retrieving/removing
items, insertion/replacement, sublists, sorting, splitting and joining. Preserve
exact placeholders and existing translations. Extend Gujarati checks to list
operations and distinct action/order terms. Update the Blocks guide; Gujarati
remains incomplete and specialist terminology needs native review.

All four catalog checks and 21 human-translation preservation checks pass.
Existing Gujarati Chromium editor coverage remains recorded; this batch did
not add a browser run. Existing Upcoming regression evidence remains recorded.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/be62f80fa">Translate Gujarati Blockly inputs, keyboard hints and logic</a>. Thanks to xet7.</summary>

Fill 66 additional Gujarati English placeholders for input labels, keyboard
navigation hints, comparisons, Boolean operations and conditional values.
Retain exact placeholders and existing translations. Expand vocabulary/script
checks to these groups, including distinct true/false, and/or and
dividend/divisor
terms. Gujarati remains incomplete and specialist terminology needs native
review.

All four catalog checks and 21 human-translation preservation checks pass.
The existing Gujarati Chromium drag/edit/save/context-menu result remains
recorded; this batch did not add a screen-reader or browser run. Update the
Blocks guide. Existing Upcoming regression evidence remains recorded.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/58fa2ce46">Translate Gujarati Blockly conditions and editing controls</a>. Thanks to xet7.</summary>

Fill 80 additional Gujarati English placeholders for conditions, loops,
copy/delete actions, bitmap controls, icons and input labels, including short
control-flow aliases. Preserve existing translations and placeholder
inventories.
The Gujarati catalog remains incomplete; specialist terminology needs native
review. Update the Blocks guide with the current translation and browser status.

All four catalog checks pass, including all-locale coverage, key order,
placeholder preservation and expanded Gujarati vocabulary/script checks. One
Chromium scenario verifies Gujarati block dragging, field editing, saved changes
and translated context menus. Other browsers were not exercised. Existing
Upcoming regression evidence remains recorded.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/cbc3fd1fb">Resume Blockly translations with Gujarati editor controls</a>. Thanks to xet7.</summary>

Resume translation at the maintainer's request and fill 87 Gujarati English
placeholders for navigation, accessibility, colors and basic block controls.
Preserve existing translations and exact placeholder tokens. Update TODO Later
and the Blocks guide to record resumption; the Gujarati catalog and other
remaining languages are still incomplete. Specialist terminology needs native
review and is not claimed as linguistically verified.

Four catalog regression checks and 21 human-preference checks pass. Coverage
includes all catalog keys and placeholders plus Gujarati vocabulary/script
checks for the resumed groups. No external translation service was used.
Existing Blockly browser coverage remains recorded; this batch did not add a
Gujarati browser run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4ff6e78d9">Complete the current South Asian Blockly translation batch</a>. Thanks to xet7.</summary>

Fill Blockly and Blocks editor prose in Hindi and its Indian locale, Tamil,
Kannada, Bengali, Nepali and Urdu. Correct wrongly seeded Urdu shared labels;
retain placeholders and existing correct-language translations. Specialist
accessibility and mathematical terminology still merits native review.

All three catalog checks pass. Translation work was paused after this batch
and has since resumed; TODO Later retains the historical pause checkpoint.
Other implementation work continues. Existing Upcoming regression coverage
remains recorded in the corresponding feature and security entries.

</details>

Thanks to above GitHub users for their contributions and translators for their translations.

# v12.07 2026-09-27 WeKan ® release

**In short:** Change Language shows each language and its country together on
one line: Flag Language (Flag Country), mirrored for RTL. Ordinary text editors
are multiline and resizable, follow the Enter preference, and buttons retain
their themed text colors.

This release fixes the following bugs:

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e0a53728b">Use available width for popup menus and Card settings</a>. Thanks to xet7.</summary>

Board Settings / Card places Draggable to the left of Show on Minicard and Show
on Card when the form is wide enough. Narrow popups stack all three in that
order. The layout responds to the popup's width rather than only screen size.

Board View and other long option menus use balanced columns on wide screens.
The shared layout covers grouped board/member/card/list/swimlane menus and long
label/custom-field/member pickers. Search spans the columns and keeps its width
while filtering. Child forms retain their original layout; Back restores the
menu columns. Phone layouts remain single-column, and scrolling remains
available when all options cannot fit within the viewport.

Audited 198 popup templates. Specialized forms, calendars, tables and existing
picker grids retain their layouts. No options, actions or permission guards
changed. Four focused Node suites and 15 distinct Chromium scenarios pass,
including responsive layout, persistence, authorization, selection, search,
form/back navigation, phone layout and RTL. Other browser engines were not run.
See docs/DeveloperDocs/Popup-Layout-Audit.md for the audit scope and exceptions.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/88e234f05">Make text editors multiline and resizable, honor the Enter preference, and restore themed button text</a>. Thanks to xet7.</summary>

Use multiline textareas for ordinary titles, names, descriptions, labels, rule
text and other prose fields. Keep credentials, searches, URLs, dates, numbers
and structured tokens single-line. Expose the native resize handle and preserve
the chosen size while typing. Include the calendar's Add Card dialog.

Apply Member Settings / Change Settings / Submit editors with Enter
consistently:
Enter saves when enabled and Shift+Enter adds a line; when disabled, Enter adds
a line and Ctrl/Cmd+Enter saves. Preserve IME composition, mention selection,
existing validation, single-submit protection and server permission checks.

Fix the typography reset overriding white button labels with dark gray after
button styles load. Board Settings / Swimlane, List and Card buttons now keep
white text on blue, green and dark themes; Clean Light's pale buttons use dark
text. Primary and destructive controls keep their existing theme rules.

Forty focused Node test entries pass. Forty-seven distinct Chromium scenarios
pass across focused runs, covering editor shortcuts, settings changes without
reload, multiline persistence, resizing in LTR/RTL, mentions, rules, login,
profile/board editing and button states/themes. Other browser engines were not
run. The editor audit and theme documentation describe coverage and exceptions.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/86b9354ca">Keep language and country labels on one line</a>. Thanks to xet7.</summary>

Place each language flag and name beside its parenthesized country flag and
name. Preserve the direction marker beside the language name and isolate mixed
writing directions. Long entries scroll within their row on narrow screens,
keeping their full text available without wrapping.

Two Chromium scenarios verify all language rows at desktop and phone widths in
LTR and RTL, including flag order and the direction marker. Both focused Node
suites pass. No translation values, language preferences or permission rules
changed. Other browser engines were not run.

</details>

Thanks to above GitHub users for their contributions and translators for their translations.

# v12.06 2026-09-27 WeKan ® release

**In short:** Board multiselection can duplicate selected boards without their
cards. The new action sits directly below Duplicate Board in the right sidebar,
and board tiles no longer show an Actions hamburger menu.

This release adds the following features:

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5dbb9167f">Move card-free board duplication to multiselection</a>. Thanks to xet7.</summary>

Remove the hamburger Actions menu from board tiles. In the All Boards right
sidebar's Multi-selection actions, place Duplicate Board — Without cards
immediately below Duplicate Board. Reuse the selected-board guard, confirmation
and existing copyBoard option; archive remains in the multiselection sidebar.
Update the All Boards documentation to describe the final menu locations.

Five Chromium scenarios and five focused Node suites pass, covering two-board
copies with and without cards, cancellation, preserved source cards, absent tile
menus, denied non-admin writes and existing swimlane placement. Browser tests
ran against edited source on a separate port from the prebuilt local bundle.
No new permission rules or dependencies were introduced. Other browser engines
were not run.

</details>

Thanks to above GitHub users for their contributions and translators for their translations.

# v12.05 2026-09-27 WeKan ® release

**In short:** Five new **flow analytics** pages add Aging WIP, blocker analysis,
Monte Carlo forecasts, XmR and size-versus-cycle-time charts, with PDF and
Excel exports. Dependency edits, undo/redo and optional move reasons now
provide a timestamped history for reports. Time reports show hour adjustments
by author, and deleting cards or checklists preserves their activity trail.
Linked cards can mirror cards on the same board. List deletion undo now
restores the cards deleted with the list. Board tiles gain confirmed actions,
swimlanes gain placement choices, and filters gain label AND/OR selection.
New-card titles survive closing the composer as private drafts.

This release adds the following features:

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0b411b547">Add five flow reports and reversible dependency history</a>. Thanks to sojournerc and xet7.</summary>

Add five pages at the bottom of Board View. Reuse card dates, Activities,
Planning Poker, numeric custom fields, card dependencies and universal History.
Blocker episodes have stage-specific start/end timestamps; unknown older
starts stay unknown. Monte Carlo supports both completion-date and capacity
forecasts, with bounded inputs and reproducible sampling. XmR includes
individuals and moving-range plots. Every page has accessible data tables and
PDF/Excel exports using the same calculations and selected parameters.

Reuse the existing MIT-licensed Chart.js through dynamic imports and existing
server exporters. No new package or external analytics service is required.
Record dependency additions, removals and property changes in History, with
validated undo/redo. Localize the new labels using existing locale vocabulary,
with full explanatory text in English and Finnish and compact glossary/formula
labels elsewhere; those compact combinations need human language review.
Existing translations are preserved. Document data sources and limitations in
[Flow analytics](docs/Features/Reports/Charts/Flow-Analytics.md).

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/6d99ad73c">Preserve time records and add reversible move reasons</a>. Thanks to ladistrupl, zombah and xet7.</summary>

Keep card/checklist activity after deletion and retain card snapshots for
historical reports. Add optional move reasons in the Move Card dialog and an
opt-in Card Settings prompt. Record complete positions through the shared
history hook and authenticated direct REST edits. Undo/redo appends reversal
checkpoints for chart replay while keeping those checkpoints out of the undo
stack. Time shows timestamped hour adjustments and corrections by their author,
with matching PDF/Excel exports; shared totals are not treated as individual
work sessions. REST accepts a zero-hour correction. Dependency cleanup on
cross-board moves also uses the history hooks.

Audit the open time-related requests against the existing implementation in
[Time issue audit](docs/Features/Reports/Charts/Time-Issue-Audit.md). Exact inline
activity timestamps and checklist completion events already exist; retain them
and add browser regressions. The broader checklist/calendar request remains
open. Previously purged history cannot be reconstructed, and removal snapshots
do not restore permanently deleted child documents or attachment files.

Upcoming regression audit: 43 focused Node suites pass, covering calculation
and export parity, invalid/missing data, board boundaries, dependency restore,
position history, correction attribution, retained blocker episodes, worker
permissions, locale keys/placeholders and existing checklist/activity behavior.
Fifteen Chromium scenarios pass across the chart, time-history and REST-move
suites, including real PDF/Excel downloads, undo/redo, preserved card/checklist
activity, exact timestamps and unauthorized requests. The local Meteor app
compiled and ran. Full-platform and FerretDB integration suites were not run.
The repository-wide translation-completeness check still reports pre-existing
English placeholders outside these changes; the new-label checks pass.
Changelog link/archive checks and the read-only release-note preflight pass;
the format test also passes after the overlong prose was rewrapped.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5ed4268a6">Add swimlane placement and board tile actions</a>. Thanks to bentiss and xet7.</summary>

Fix #2131 and #2644. Choose above or below the current swimlane in its Add
Swimlane dialog. Board administrators can duplicate or archive an active board
from its tile Actions menu, using confirmations and existing permission checks.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/6be31f5a2">Add label AND/OR filtering and retain filter text</a>. Thanks to Trunkslike, TheBigBloodyB, Roemer and xet7.</summary>

Fix #2044 and #3361. Select AND or OR for included labels in the board Filter
panel; excluded labels keep their existing meaning. Reopening the panel retains
list, title and advanced text. Verify card filtering in Calendar grid and agenda
views; the separate multi-board calendar remains outside this board filter.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c7e19a324">Preserve private new-card title drafts</a>. Thanks to TutloTutlo and xet7.</summary>

Fix #810. Restore unsaved titles when reopening the same list/swimlane composer.
Reuse owner-scoped unsaved edits, keep top and bottom composers separate, and
clear successfully inserted titles. Local typing takes precedence over a late
subscription result. Other users cannot read or overwrite these drafts.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3b3f7ebd7">Allow linked-card mirrors on the same board</a>. Thanks to RinTheCatato, mohamed-aziz-chamakh and xet7.</summary>

Fix #5683: the Link picker and server method now accept a real source card on
the destination board. Reuse the existing shared label data and setters.
Retain permission checks, reject linked pointers and templates, and prevent
whole-board self-links through both confirmation buttons. Browser tests verify
live label updates in both directions and unchanged cross-board behavior.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/08a164661">Undo list deletion together with its cards</a>. Thanks to rawwerks and xet7.</summary>

Fix #1023: History undo restored the list but left its cards marked deleted.
Restore the same board/list deletion batch and preserve independently deleted
cards. Redo marks live cards again. Keep the batch in lifecycle snapshots and
refuse old lifecycle rows after a list moves to another board. Browser tests
check persisted state through undo, redo and undo again, plus rejected writes
from read-only members. Permanent purges remain irreversible.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/be6cc9d63">Align Add Swimlane placement choices</a>. Thanks to xet7.</summary>

Move the above/below choices below the swimlane name input and align each radio
button to the left of its label. Two Chromium scenarios verify the rendered
layout, both insertion positions and read-only restrictions. Swimlane placement
and RTL Node suites pass. Existing Upcoming coverage is recorded in the other
entries; this layout adjustment adds no new mutation or permission rules.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d962b6047">Apply theme colors to flow chart action buttons</a>. Thanks to xet7.</summary>

Use the shared primary-button styling for the Monte Carlo and size-versus-cycle
option forms. Their action buttons inherit the current theme's background and
white text, including custom colors, hover and keyboard focus states. Export
controls retain the same shared styling as the existing chart pages.

Four Chromium theme scenarios and five focused Node suites pass, covering both
forms in blue, red, dark and custom themes. The additional forecast regression
failed because its export link omitted the selected forecast parameters; that
separate export issue remains outstanding. Existing Upcoming coverage is
recorded in the other entries. No dependencies or permission rules changed.
Other browser engines were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b97090221">Open cards directly beside their minicards</a>. Thanks to xet7.</summary>

Place desktop card windows before their first visible frame, eliminating the
initial flash at the screen edge. Prefer right in LTR and left in RTL when that
side fits; otherwise use the other side. If neither side fits, keep the window
inside the viewport. Preserve user-dragged positions and separate mobile,
maximized and popup geometry.

Eight Chromium scenarios pass: first-frame placement on preferred and fallback
sides in both directions, plus all four date save/delete position regressions.
Four focused Node suites pass, including geometry, initial visibility, board
refresh readiness and RTL checks. The opening regression fails before the fix.
Existing Upcoming coverage is recorded in the other entries. Other browser
engines were not run; this client layout change adds no permission rules.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f5878134a">Keep card windows still when saving dates</a>. Thanks to xet7.</summary>

Saving or removing Received, Start, Due or End refreshed the board subscription,
briefly destroyed its view, and rebuilt the open card at its default dock before
anchoring it again. Keep the same board mounted during refresh; navigating to
another board still resets readiness. Retain the date refresh and all existing
publication permissions.

Four Chromium regressions verify saved and removed dates, badge updates, window
identity and position across rendered frames. The save regression fails before
the fix. Six focused Node suites pass, covering initial loading, navigation,
date validation and card placement. Existing Upcoming coverage is recorded in
the other entries; this change adds no server mutation or permission rules.
The live FerretDB matrix and other browser engines were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/374e03e99">Audit completed issues and refresh TODO Later</a>. Thanks to Meeques, Somantiq, javen9881, matrixes, bastos77, therampagerado, sfahrenholz, Gobliins and xet7.</summary>

Check the 159-open-issue snapshot and record source/test evidence for ten
already implemented requests. Add their closing keywords, remove seven stale
backlog entries, narrow partially implemented requests and correct two unrelated
issue references. Retain deployment investigations and unverified wider scope.
See the [completion audit](docs/DeveloperDocs/Open-Issue-Completion-Audit-2026-09.md)
for the decisions and the remaining issue inventory.

All 28 selected Node regression suites pass, including negative cases and UI
source guards. No application code changes; browser and live identity-provider
tests were not rerun for this documentation audit. The existing Upcoming feature
coverage is recorded above; this entry adds no new runtime behavior.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4ce5cb992">Verify seven more completed issue requests</a>. Thanks to RowhamD, Usernameisalreadytaken99, rptl, czinkos, bhueck, Vida444, xefladrero and xet7.</summary>

Record existing implementations for OIDC logout, case-insensitive mentions,
remote mobile card closure, alphabetical member selection, bulk card colors,
existing-card subtasks and minicard field visibility. Add executable logout-hook
and browser regressions. Retain partial requests whose complete UI or behavior
could not be verified; see the
[follow-up audit](docs/DeveloperDocs/Open-Issue-Audit-2026-09-27.md).

All 31 focused Node suites and 27 distinct Chromium scenarios pass. This
includes deletion-batch boundaries, rejected writes, same- and cross-board
links, and the existing flow/time-history reports with real PDF/Excel exports.
The Meteor app compiled and ran with the documented API flag enabled. External
identity providers and the FerretDB backend matrix were not tested. Existing
Upcoming feature coverage remains recorded above; the shared History changes
also passed the affected chart and time-report regressions.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5b07274c3">Audit all open issues and verify board view controls</a>. Thanks to sebastianha and xet7.</summary>

Triage all 140 open issues and record each finding and outstanding
verification in the [full issue
inventory](docs/DeveloperDocs/All-Open-Issues-Audit-2026-09-27.md). Verify
existing minicard swimlane names (#1748) and board-specific view visibility
(#2107). Remove completed filter requests from TODO Later. The other 133
requests remain outstanding; triage does not imply their implementation or
reproduction.

Upcoming regression coverage remains recorded in the entries above. For this
batch, 15 focused Node suites and ten Chromium scenarios pass, including
actual menu actions, calendar filtering, draft restoration and denied
unauthorized writes. The Meteor app compiles and runs. No dependencies or
server permission rules were added. The full Node run is not green: 136 of
1,233 suites failed; the new tile RTL issue was fixed and its suite passes,
and the socket-restricted API suite passes with socket access. The audit
records the remaining failures, including baseline fixture failures and
translation-completeness checks. Other browser engines and the live FerretDB
matrix were not tested.

</details>

Thanks to above GitHub users for their contributions and translators for their translations.

# v12.04 2026-09-26 WeKan ® release

**In short:** **InactiveBleed** is fixed: disabled accounts cannot obtain new
sessions through REST or keep using revoked credentials. People account
creation and the Active control now enforce the administrator's chosen status.

This release fixes the following CRITICAL SECURITY ISSUE of
[InactiveBleed](https://wekan.fi/hall-of-fame/inactivebleed/):

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c3caf87a1">Enforce account deactivation across authentication and existing sessions</a>. Thanks to esbrito81 and xet7.</summary>

REST login, API authentication, private attachment reads and uploads, imports
and exports now share an active-account check. REST and header-login token
issuance test account status atomically; LDAP leaves token issuance to the
validated login pipeline. Disabling an account clears its tokens and Meteor
disconnects the sessions observing them. A startup observer also revokes tokens
on existing disabled accounts and direct database updates. Reactivation does
not restore old tokens. Anonymous public-board access remains public; already
authorized operations are not rolled back.

People's Active control uses the administrator-only method and reports errors.
Admin-created users receive their active status, administrator flag, profile,
organizations and teams before insertion, through a trusted server context.
Creation is awaited and ordinary users cannot invoke the admin creation method.
Attributable disabled-account authentication attempts are summarized as
InactiveBleed in Admin Panel / Problems.

Upcoming regression audit: positive and negative Node tests cover
authentication, atomic issuance, revocation, logging failure, attachment
contexts and a source sweep across server, models, imports, packages and
client code. The affected HTTP, LDAP, export, team-membership and
security-catalog suites pass. A Meteor build and three Chromium tests pass,
covering inactive creation, REST and DDP login, old Bearer/cookie/legacy
upload credentials, live-session disconnection, direct database deactivation,
reactivation, People toggles and admin-only account creation. Live LDAP and
the FerretDB matrix were not exercised.

</details>

Thanks to above GitHub users for their contributions and translators for their translations.

# v12.03 2026-09-26 WeKan ® release

**In short:** **Board drag settings** independently enable dragging for each
object type. **Mixed multi-selection** moves lists, swimlanes, cards and
checklist content together, including folded containers. **Minicard checklists**
show progress and support item reordering and transfers across lists and
swimlanes. **Checklist drag-and-drop** saves the new item order and matches the
visible drop placeholder.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/43b0daf14">Select or unselect all settings in a board settings column</a>. Thanks to xet7.</summary>

Board Settings / Swimlane, List and Card offer Select all and Unselect all for
each settings column: Draggable, the swimlane/list options, Show on Minicard and
Show on Card. A shared component sets the column in one board-admin-authorized
update. Repeated clicks keep the requested state; other columns, other boards,
field order and personal overrides remain unchanged.

Four Chromium cases cover all seven columns, both actions, repeated clicks,
reload persistence, board isolation and rejected non-admin or invalid requests.
The four existing drag-settings browser cases, three focused Node suites and
the Meteor build also pass.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/7950979cb">Choose which objects can be dragged on each board</a>. Thanks to xet7.</summary>

Board Settings / Swimlane, List and Card settings have a shared Draggable
column. Swimlanes, lists, cards, checklists, checklist items and subtasks
default to checked, including existing boards. Board administrators can
uncheck each independently; the settings persist for the whole board,
separately from personal drag handles.

Ordinary sorting responds immediately. Disabled checklist items cannot fall
through to dragging their parent card, and mixed selections cannot drag a
disabled selected object. Explicit menu moves remain available. Disabling
swimlane reordering retains the container needed for cross-swimlane card
transfers.

Four new Chromium cases cover saved settings, independent switches,
authorization, rejected mixed drags and disabling/re-enabling checklist-item
dragging on minicards and opened cards with handles on and off. Together with
existing mixed-selection, collapsed-container and checklist suites, 26
distinct Chromium cases pass. Thirteen focused Node suites and the Meteor
build pass.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b0c8acc98">Move mixed selections of cards, lists, swimlanes and checklist content</a>. Thanks to xet7.</summary>

Multi-Selection adds matching left-side checkboxes to list and swimlane headers,
minicard checklists and checklist items. Mix object types in one selection and
move them together by dragging or by choosing another board and destination
position. Selected parents carry their children once. Checklist content dropped
onto a list goes into one new destination card.

Folded sources, folded destinations and hidden selected items keep their correct
parents, including board-wide lists repeated in several swimlanes. Dropping onto
a folded swimlane retains that swimlane in the destination picker and asks for
the missing list. Keep selection checkboxes separate from collapse controls.

The shared server move path checks both boards and every selected object before
writing, rejects moving targets and preserves card metadata through existing
move helpers. Moving a swimlane updates its parent before moving cards, avoiding
an unintended move into the destination board's default swimlane.

Twenty-two Chromium cases cover mixed moves, permissions, cross-board positions,
collapsed containers, shared lists and existing checklist dragging. Eleven
focused Node suites and the Meteor build pass.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b65b45e52">Show checklist progress and support item dragging on minicards</a>. Thanks to xet7.</summary>

Minicard checklists share the opened-card percentage and progress bar, keeping
progress visible while folded. Reuse one sortable component in both views,
including initialization after unfolding and the drag-handle preference.

Items can be reordered within a minicard checklist or moved to another card's
checklist across lists and swimlanes. An internal checklist drop no longer looks
like a drop on the enclosing board list, which would create an extra card.

Six Chromium cases cover opened-card sorting, minicard progress and sorting,
and cross-list/cross-swimlane transfers with handles both enabled and
disabled. They verify persistence after reload, the destination card/checklist
and no extra card creation. Focused reorder, drop-target, collapse, visibility
and conversion checks and the Meteor build pass.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f772663e5">Fix multi-list swimlane drops and show tilted named drag previews</a>. Thanks to xet7.</summary>

Dragging selected lists onto the empty area of another swimlane now moves them
and their cards there. Previously only the swimlane header was recognized as a
destination. Keep nested list/card targets and header-only swimlane drag starts.

Multi-Selection dragging shows a tilted stack with the selected objects' names
and icons, alongside the count. Render titles as literal text, including mixed
object selections, and limit large previews to eight names plus a remaining
count.

Six Chromium cases move two lists via swimlane bodies or headers, including
collapsed sources/destinations, with handles on and off. Check the named tilted
preview, list order, card parents and persistence after reload. Three existing
mixed-selection browser cases, three focused Node suites and the Meteor build
also pass. The empty-body case was reproduced failing before the fix.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/cb4d29b01">Fix checklist item reordering</a>. Thanks to AmigaAbattoir and xet7.</summary>

Read the destination checklist and neighboring items before restoring the DOM
for Blaze. Previously, restoration happened first, so dropping an item saved its
original position. Preserve checklist-to-list card creation.
Fixes [#6723](https://github.com/wekan/wekan/issues/6723).

Regression tests cover first, middle, last and cross-checklist positions, plus
card drops. Chromium verifies real dragging, database order and persistence
after reload; all seven existing checklist browser tests also pass. The Meteor
build and eleven checklist-to-card checks pass.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/7afbce763">Match checklist drops to the visible placeholder</a>. Thanks to AmigaAbattoir and xet7.</summary>

The first reorder repair still missed neighboring rows inside inline-form
wrappers. Read all real destination rows in document order, excluding the helper
clone and placeholder, before calculating the saved position. This prevents a
middle drop from landing farther down the checklist.

Chromium reproduces the reported sequence with items 2, 3, 1, 4, 45: move 45 to
the top, then to the third-position placeholder. Both drag-handle preferences
failed before this repair and pass afterward, including database order and
reload persistence. Wrapped-row unit regressions, checklist-to-card checks and
the Meteor build also pass. Follow-up to [#6723](https://github.com/wekan/wekan/issues/6723).

</details>

Thanks to above GitHub users for their contributions and translators for their translations.

# v12.02 2026-09-25 WeKan ® release

**In short:** **Admin Panel / People** opens Email and provides separate login
settings, including SAML environment overrides, metadata and logout
configuration. **SSO** stops automatically retrying failed OIDC callbacks.
**Login buttons** share blue backgrounds and white text/icons. **Release
notes** omit empty categories.

This release adds SAML administration and improves login behavior and
navigation:

<details>
<summary><a href="https://github.com/wekan/wekan/commit/05f1f0a03">Configure SAML in Admin Panel / People</a>. Thanks to xet7.</summary>

Add a SAML menu entry and reusable catalog-driven authentication settings form.
Site administrators can override environment settings, see each value's source,
and restore environment/default values by clearing an override. Apply saves
without restarting; disabling SAML removes its service configuration and rejects
pending logins. Keep configuration out of ordinary settings publications.

Expose service-provider metadata and callback URLs, and add service-provider
initiated logout through the existing MIT-licensed node-saml library. Accept
validated logout responses; IdP-initiated logout requests are not supported.
Document account merging as an explicit opt-in and include its environment
setting in platform configurations, including Snap, Docker and launch scripts.

Verified configuration precedence, rejected inputs, platform coverage, metadata
and logout route delegation and rejection paths. Chromium verifies settings
save/reset and non-admin denial. The Meteor build passed. Live identity-provider
login/logout interoperability remains unverified; this does not claim to fix the
reported SAML popup completion problem or add other authentication providers.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ecdae60a8">Separate People authentication settings and open Email by default</a>. Thanks to xet7.</summary>

Admin Panel / People opens Email first. Move Login, LDAP, OAuth providers and
Passwordless to separate left-menu entries below Shared templates, retaining
shared settings templates and direct routes. SAML follows Login with this
release.

Regression coverage verifies route resolution, site-admin restrictions and
handlers. Chromium verifies menu order, separate panes and selection after
reload.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/8263734f5">Stop repeated automatic OIDC login after a failed callback</a>. Thanks to Alishara and xet7.</summary>

Keep the automatic-login guard after failed login attempts so an unsuccessful
SSO callback does not repeatedly redirect to the identity provider. Recheck
login state when the settings response arrives, and require writable session
storage before automatic navigation. Manual sign-in remains available.
Fixes [#6722](https://github.com/wekan/wekan/issues/6722).

Verified with eight executable redirect regressions, the OAuth login-style and
OIDC state-isolation suites, and a Chromium callback-reload regression. The
reporter's Microsoft Entra configuration was not available for end-to-end
testing.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9dd295079">Use consistent authentication button colors</a>. Thanks to xet7.</summary>

SAML and other authentication actions use the same blue background as Login,
with white text and icons. Share the styling between package-provided buttons
and standalone provider actions. A Chromium regression verifies normal and
hover colors for SAML and both kinds of provider button.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3163ccfc1">Omit empty release-note sections</a>. Thanks to xet7.</summary>

Only include Security and Translations when the selected release contains
entries for them. Remove the empty-category placeholder sentences and omit
translator credits when no languages were updated. Keep the summary and
ChangeLog link, and preserve populated security and translation sections.

The release-note regression suite verifies all four combinations of present
and absent sections, version selection, retained details and language lists.
Shell syntax validation also passes.

</details>

Thanks to above GitHub users for their contributions and translators for their translations.

# v12.01 2026-09-25 WeKan ® release

**In short:** **Files Report previews and downloads** work for site
administrators even when they are not members of the attachment's private
board. Preview and download controls also fit within narrow table cells.
**ZIP previews** list archive contents from Files Report and opened cards.

This release adds ZIP previews and fixes attachment report issues:

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2016d15f2">Preview ZIP contents from cards and Files Report</a>. Thanks to xet7.</summary>

Click a ZIP attachment preview to see the filenames and folder paths inside
it. Cards and Files Report use the same viewer, including nested paths and
Unicode filenames. Closing the viewer cancels its pending download.

Reuse the installed fflate parser without extracting or inflating entries.
Names are plain text, never executable markup or extraction paths. Preview
sources are limited to 32 MiB and archives to 2,048 entries; larger archives
remain downloadable. ZIP and Office previews share bounded stream reading.

Eight focused Node suites pass, covering archive listing, empty and invalid
archives, resource limits, inert names, denied reads and cancellation. A fresh
Meteor build and eight Chromium/Firefox checks pass, including ZIP preview
from both Files Report and an opened card. Existing Office, image, PDF and
private attachment download checks also pass, retaining regression coverage
for the other Upcoming changes.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f03463e7d">Fix Files Report attachment previews and downloads</a>. Thanks to xet7.</summary>

Admin Panel / Problems / Files Report already lists attachments across all
boards, but its download route required board membership. Use the authenticated
site administrator role for attachment reads, fixing 403 errors for Office,
PDF and image previews and file downloads. Ordinary non-members and anonymous
requests remain denied on private boards, and a disabled administrator does
not receive the new permission.

Wrap the shared attachment preview and download controls inside their table
cell, so an adjacent cell cannot cover the download button on narrower pages.

Eight focused Node suites pass. A fresh Meteor build and six browser checks
pass: Firefox and Chromium preview DOCX, PNG and PDF files and save the
original bytes using the download button. The browser checks also verify
that anonymous users and ordinary non-members cannot read the private files.

</details>

Thanks to above GitHub users for their contributions and translators for their translations.

# v12.00 2026-09-25 WeKan ® release

**In short:** **Dependency installation** works again after the S3 upload
library update. The recent Dependabot merges have a documented security and
telemetry review, with focused regression checks for the repaired dependency
pair. **Test maintenance** restores checks for the current UI, documentation and
translations, and local release preparation uses the same npm version as CI.

This release fixes dependency compatibility and test regressions:

<details>
<summary><a href="https://github.com/wekan/wekan/commit/670ae80ff">Align the S3 client with its upload library</a>. Thanks to xet7.</summary>

lib-storage 3.1137.0 requires client-s3 3.1137.0 or newer, but the merged
lockfile retained client-s3 3.1127.0. npm stopped with ERESOLVE before the
WeKan tests could build. The missing MongoDB driver also stopped database
conformance before any queries ran. Update the direct client to 3.1137.0,
regenerate the lockfile and check the peer requirement in a regression test.

The [dependency review](docs/Security/Dependabot-2026-09-24.md) records the
scope, findings and limitations for the six merged Dependabot updates and
this repair. Archive checksums match and npm reports no known advisories;
the indicator-driven review found no telemetry implementation. These checks
do not prove the absence of unknown vulnerabilities.

Six focused suites, dependency installation and npm ci dry-run pass. S3 upload
construction and MongoDB driver loading pass without service requests. The
full Meteor/browser and database-conformance suites still need rerunning.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/55c6b48c1">Repair the remaining full-test failures</a>. Thanks to xet7.</summary>

Update regression checks for moved All Boards documentation, component-owned
Blaze templates, shared date settings, reviewed translations and the existing
AuthTraceBleed coverage. Give the backup containment helper a name recognized
by the archive security guard. Select the release npm version during local
bundle preparation and specify the repository when looking up a recovery
release.

Browser tests open the invitation sidebar and use a separate invited member,
so declining does not ask the sole administrator to leave their own board.
The swimlane check uses the multiline composer, and the keyboard check waits
for the username field to be interactable before pressing Tab.

All 1,216 Node suites pass. Targeted Chromium, Firefox and WebKit checks pass,
including three consecutive Firefox keyboard checks. Nine real database backup
and restore checks pass, including malicious paths, symlinks and corrupt data.
The supplied run already passed database conformance and FerretDB; the entire
three-browser suite and hosted release builds were not rerun for this change.

</details>

Thanks to above GitHub users for their contributions and translators for their translations.

# v11.99 2026-09-24 WeKan ® release

**In short:** **Developer tooling** updates Rsdoctor to fix source disclosure
through its report server. **Dependency updates** work again with published
Meteor Node stubs and restored Dependabot coverage for build tools.

This release improves the following security hardening:

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1f5692db3">Patch Rsdoctor and restore dependency updates</a>. Thanks to xet7.</summary>

Update Rsdoctor from 1.5.9 to 1.6.4 for
[CVE-2026-61782](https://github.com/advisories/GHSA-jmg2-rcxh-w8q3).
The affected report server can expose source and build metadata when using
the development bundle visualizer; it is not enabled in production builds.

Replace the deleted local meteor-node-stubs reference with published 1.2.30.
The missing local manifest prevented Dependabot from preparing security
updates. Remove the obsolete Meteor 3.5 build-tool exclusions now that WeKan
uses Meteor 3.6 and Rspack 2.

Five dependency tests pass, including tracked local manifests, patched
versions and update configuration. npm install and npm ci dry-run succeed;
Rspack 2.2.0 compiles a smoke fixture with Rsdoctor 1.6.4. Dependabot YAML
parses. A full Meteor build and hosted Dependabot run were not performed.

</details>

Thanks to above GitHub users for their contributions and translators for their translations.

# v11.98 2026-09-24 WeKan ® release

**In short:** **Snap builds** recover from stale package URLs during
stage-package downloads as well as base setup. Recovery refreshes the container
and retries once, while unrelated failures remain fatal.

This release fixes the following Snap builds:

<details>
<summary><a href="https://github.com/wekan/wekan/commit/494fa0cd0">Recover stage-package download failures in Snap builds</a>. Thanks to xet7.</summary>

The v11.97 wekan-ondra amd64 build received a libcurl4t64 package 404 while
fetching stage-packages. The previous recovery handled only base provisioning
and rejected this later failure. Identify the managed build instance from
Snapcraft's LXC execution log and refresh its APT indexes, which craft-parts
also uses for stage packages. Preserve downloaded packages, build state and
the container's running/stopped state.

Four focused Snap suites pass, including eight Python cases covering base and
stage failures, ambiguous or missing instances, unrelated errors and failed
refreshes. Hosted LXD builds have not been rerun from this Mac checkout.

</details>

Thanks to above GitHub users for their contributions and translators for their translations.

# v11.97 2026-09-24 WeKan ® release

**In short:** **Release preparation** checks changelog summaries before changing
versions or creating tags. The missing v11.96 summary is restored so release
notes can be generated and platform builds can proceed.

This release fixes the following build preparation:

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4101e8fd4">Validate release notes before version changes and tagging</a>. Thanks to xet7.</summary>

v11.96 stopped in prepare because its changelog lacked the required summary.
Restore that metadata without changing the release's entries. Local preflight
now rejects missing and empty Upcoming summaries; the workflow validates notes
before version changes and before creating a tag.

Regression tests cover valid notes, missing and empty summaries, summaries in
older sections, the newest release's actual notes, and workflow ordering. The
focused release suites and YAML validation pass. Hosted builds were not rerun.

</details>

Thanks to above GitHub users for their contributions and translators for their translations.

# v11.96 2026-09-24 WeKan ® release

**In short:** **Snap builds** recover from stale Ubuntu package indexes by
refreshing the failed managed container and retrying once. Unrelated build
errors remain fatal.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4913f4abb">Recover Snap builds from stale Ubuntu package indexes</a>. Thanks to xet7.</summary>

The wekan-ondra amd64 build failed while provisioning Snapcraft's managed base:
an obsolete libexpat1-dev package URL returned HTTP 404. For native and variant
Snap builds, refresh APT indexes inside the identified failed LXD base and retry
once. Restore the container's original running/stopped state; unrelated errors,
failed refreshes and failed retries remain fatal.

Six focused test suites pass, including package-error detection, container state
restoration, refresh failures and workflow integration. Workflow YAML parses.
The hosted Snapcraft/LXD build has not been rerun from this Mac checkout.

</details>

Thanks to above GitHub users for their contributions and translators for their translations.

# v11.95 2026-09-24 WeKan ® release

**In short:** **Mac app builds** finish their smoke tests without hanging during
shutdown. **Board Settings** places Date below Change Background Image and
uses matching Swimlane and List icons.

This release improves the following menu:

- [Move Date directly below Change Background Image](https://github.com/wekan/wekan/commit/d71973fc4). Thanks to xet7.
  Keep the board-admin restriction and existing Date popup. Menu order,
  permission guards and matching documentation checks pass.

- [Match Swimlane and List settings icons to the header Board View menu](https://github.com/wekan/wekan/commit/41c3508e6). Thanks to xet7.

and fixes release verification:

<details>
<summary><a href="https://github.com/wekan/wekan/commit/6568268b2">Finish Mac smoke tests after successful startup</a>. Thanks to xet7.</summary>

Both arm64 and amd64 apps answered HTTP successfully in v11.94, then their
smoke-test EXIT trap hung waiting for the launcher after signaling only that
process. Start the app in an isolated process group and terminate the group,
with a bounded grace period and forced cleanup for surviving children. HTTP
probes and the workflow step also have deadlines; smoke logs are retained as
artifacts on success or failure.

Mac packaging tests pass locally in about three seconds. They cover real HTTP
success, rejection and a server that never answers, early application exit,
probe exceptions, and a launcher waiting for a TERM-resistant child. Hosted
arm64/amd64 release jobs have not been rerun or published from this checkout.

</details>

Thanks to above GitHub users for their contributions and translators for their translations.

# v11.94 2026-09-24 WeKan ® release

**In short:** **Linux packages** include the library needed by Node.js.
**Board invitations** no longer disable accounts through a rejected client
write, and signed-out login avoids a protected metadata subscription.
**Release packaging** fixes Mac archive verification, Docker scanning and
foreign native addons inherited by platform bundles.

This release fixes the following bugs:

**Linux packages** - restore startup with the bundled Node.js runtime.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d55b2d3e8">Include the missing libatomic runtime library</a>. Thanks to Nissulya, PetitManchot and xet7.</summary>

Stage libatomic1 in both Snap recipes so Node.js can load libatomic.so.1
inside confinement, independently of libraries installed on the host.
Regression checks cover runtime staging and reject removal during packaging.
The waiting-for-database HTTP regression also passes. A deployed Linux Snap
was not available on this macOS host.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/54ce3015e">Carry libatomic through every Linux packaging path</a>. Thanks to Nissulya, PetitManchot and xet7.</summary>

Docker retains libatomic1 after build-tool cleanup. Linux ZIP builders copy a
library matching Node's ELF architecture into node-runtime, including license
files, and the shared launcher adds that directory to its library search path.
AppImage and Flatpak inherit it and reject input ZIPs that lack the dependency.
Sandstorm includes libatomic in its private library tree. Native and emulated
builders install the package explicitly; Windows and macOS repacks remove
inherited Linux runtime files.

Eight focused suites pass, including positive and negative library-selection
fixtures for eight architectures. An offline Linux container also packaged a
real Node executable and successfully loaded the copied library. Shell syntax
checks pass. Full release builds were not run. A broader local-bundle parity
suite reports a pre-existing missing use-release-npm.sh call, reproduced on the
unchanged commit; it is separate from the runtime-library changes.

</details>

**Board invitations and login** - use authorized server operations.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e1b13e688">Accept sidebar invitations without triggering an account block</a>. Thanks to Nissulya and xet7.</summary>

Use acceptInvite for sidebar acceptance and let quitBoard consume declined
invitations. Neither flow writes the protected invitation profile from the
client. Both methods explicitly require authentication, and forged writes
remain forbidden. Signed-out login uses the configured provider instead of
requesting protected authentication metadata and creating a security event.

Focused handler, server-method and negative permission tests pass. Browser
acceptance/decline tests were added and syntax-checked, but require a running
Meteor/database/browser stack. Already blocked accounts need administrator
review and re-enabling in Admin Panel / People. The separate history checksum
report remains under investigation; see the developer investigation notes.

</details>

and fixes release packaging:

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ba5ecaf14">Verify Mac archives and keep foreign addons out of platform bundles</a>. Thanks to xet7.</summary>

Replace the unsupported ditto listing option with unzip -Z1. Keep Docker's
telemetry scanner working from a shallow filesystem path and copy its deny-hash
policy alongside it. When a target prebuild exists, discard positively
identified foreign ELF addons inherited under build/Release or build/Debug;
node-gyp-build otherwise selects those before the correct platform prebuild.
Matching native output and unrecognized formats remain untouched.

Twelve focused Node suites pass in about five seconds, including Python scanner
regressions and an actual macOS archive test. The separate Snap waiting-page
suite passes with loopback access. Hosted Windows, ARM64 AppImage, Docker and
Snap builds still need to run; none was published from this checkout.

</details>

Thanks to above GitHub users for their contributions and translators for their translations.

# v11.93 2026-09-24 WeKan ® release

**In short:** Login error responses no longer disclose internal stack traces,
and the local identity test server rejects expensive or malformed OAuth
headers. **Release All** and **Release All Missing** now share shell and
Windows menus across the six repositories. Automated dependency checks stop
on detected risk indicators; ordinary hash changes need no AI approval.

This release fixes SECURITY ISSUES found by GitHub CodeQL and source review:

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4d2951ae2">Bound OAuth fixture parsing and hide login exception details</a>. Thanks to GitHub CodeQL and xet7.</summary>

Fix alerts #543 and #544 in the loopback-only login integration server:
bound and anchor OAuth-header parsing, reject duplicates and malformed
encodings, and return generic HTTP errors. Sibling-source review also removes
the stack-trace response from the shipped Sandstorm login endpoint.
The fixture is not a production OAuth service. See
[AuthTraceBleed](https://wekan.fi/hall-of-fame/authtracebleed/).

Five positive/negative security tests and ten live Chromium OAuth/Sandstorm
checks pass, including signed requests, rejected signatures, malformed
headers, successful proxy login and opaque failures. Tracked-source guards
check for the vulnerable scanner and direct HTTP stack-trace sinks. Hosted
CodeQL has not been rerun. No Problems category is added: the fixture runs
outside WeKan, and generic exception-response filtering does not distinguish
attacks from operational errors.

</details>

and fixes release preflight:

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4d2951ae2">Refresh reviewed telemetry inventory and detect stale reviews locally</a>. Thanks to xet7.</summary>

The release bump job stopped because 46 changed runtime files were absent
from the reviewed telemetry inventory. Review their outbound behavior and
refresh the hashes while retaining source and binary gates. Add the same
source check before release-all.sh changes notes or makes remote writes,
and include the actual checkout in the telemetry regression suite.

A macOS ARM64 build, the 1,577-file source audit, the 42,926-file bundle scan
and six release/preflight tests pass. Logging and operator-configured
integrations remain available. Automated indicators now govern whether
later source changes stop a build. No hosted release was run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c7111728bb0a96f073ce3753078d7d6850fc363a">Distinguish known dependency keyword false positives from new findings</a>. Thanks to xet7.</summary>

Report documented, exact dependency keyword matches as known false
positives for default outbound reporting. New or changed matches remain
unclassified warnings for review. Independent source and binary risk
checks remain active. Current dependency inventories have no matches
requiring new exemptions. Positive and negative launcher tests, risk
tests and offline audits pass across all six release repositories.
This changes release logs only; no application UI or hosted release
was exercised. Existing Upcoming regression coverage is retained.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/7392a364ba2f4b2877024df520847076cd1ccd19">Update release runtime discovery and fix Windows source resolution</a>. Thanks to xet7.</summary>

Resolve stable Node.js 26.x, MongoDB 7.0.x and npm 12.x from official
release metadata. Require both amd64 and arm64 archives and verify
availability before editing versions. Exclude MongoDB rapid releases;
remove the misplaced dependency-preservation switch and guessed-version
probing from the active update path. Keep Meteor tied to the app pin.

Propagate selections through Docker, snap references and the website
manifest/install page. Build jobs install the selected npm version,
including Windows checkouts under src. Fix shell-variable matching in
artifact links and macOS Stackerfile editing. Stop website publication
on failed updates. Keep post-update risk checks; scoped URL patterns
allow only configured version links. Fix the shared Windows Node source
resolver by passing a shell-relative checkout path.

Real version-script fixtures cover propagation and failure before edits.
Release, website, menu, version-consistency and indicator regressions
pass, as do companion launcher and Node workflow tests. Live metadata
and four archive HEAD requests pass. This changes build tooling, with
no new application UI. Native Windows builds and hosted publication
were not run; existing Upcoming feature coverage remains unchanged.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/83fb620c4d12f9c3da28de49448d4e0d46eba5d8">Accept valid GitHub SSH origins in release launchers</a>. Thanks to xet7.</summary>

Release All and Release All Missing accept HTTPS and SSH clone URLs
with or without .git, including git@github.com:wekan/wekan.
Incorrect repositories and lookalike hosts still stop the release.
Offline positive and negative launcher tests and source audits pass;
no hosted release was run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a048569b8">Add release menus and automated dependency risk checks</a>. Thanks to xet7.</summary>

All six repositories provide Release All and Release All Missing in build.sh
and build.bat. Full releases validate Upcoming notes, prepare the version,
commit pending tracked and new files, push the default branch and dispatch
Actions. Missing releases keep their version and retry failed or absent
outputs; completing a release needs no new Upcoming section. WeKan also
recovers failed jobs of its matching full-release run before filling gaps.

Checks compare hashes, suspicious keywords and URL literals. Ordinary hash
changes and missing historical reviews only warn; known telemetry/security
hashes, new suspicious keywords or new URLs stop builds with file-specific
evidence. Existing artifact and runtime telemetry checks remain. No whole
source review or AI approval is required; legitimate indicators can be
allowed through baseline configuration. Local logging remains available.

Offline tests cover successful release preparation, missing-release version
preservation, commit/push failures, nonblocking hash drift and blocking risk
indicators. Menu parity, workflow syntax and existing release regressions
pass. MongoDB Tools regenerates its locked vendor tree and passes SDK checks.
Windows batch launchers are checked from source; Windows execution and hosted
publication were not run. See releases/README-release.md for usage and limits.

</details>

Thanks to above GitHub users for their contributions and translators for their translations.

# v11.92 2026-09-23 WeKan ® release

**In short:** Always-visible, translated choices create cards, lists,
swimlanes and boards from pasted lines, or keep one item with a multiline
title. List and swimlane names retain line breaks.
Scheduled full-instance backups now include database and file content.
Admin Panel validation and menu-based feature/backup guides are documented.
Meteor server bundles install with npm 12 without obsolete rebuild arguments.
Local identity-server tests repair login flows and prevent sign-in code reuse.

This release fixes login security and compatibility issues:

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4f7d28637">Prevent sign-in code reuse and verify real login provider exchanges</a>. Thanks to xet7.</summary>

Require consumption of an emailed sign-in code before issuing a session when
Meteor's positional email update leaves the token in the database. Compare
the validated token generation, reject reuse or replacement, and verify the
email using its numeric array index. Reproduced with local FerretDB; this
application guard does not fix general database positional-update behavior.

Fix LDAP login with an unset optional field map, simultaneous OAuth2/CAS/SAML
configuration, the SAML certificate option and SAML/Sandstorm display names.
Keep the Blaze instance across asynchronous login-settings callbacks so the
provider buttons and passwordless form appear. Hide duplicate social buttons.
Report CAS callbacks and retain invalid-TOTP errors after counting failures,
without bypassing lockout limits.

Add minimal local LDAP, OAuth2/OIDC, OAuth1, SAML, CAS and SMTP servers. Drive
the real login forms and adapters, inspect protocol requests, stored identity
fields and returned sessions, and reject wrong credentials, refused tokens,
invalid SAML responses and consumed email codes. Cover LDAP REST login,
trusted-proxy headers, Sandstorm, password login and two-factor retries.

A rebuilt macOS ARM64 bundle passes 31 login checks and 3 Sandstorm checks in
Chromium, with no retries. Seven additional social-provider runs verify exact
profile values. Focused Node regressions, documentation links and menu
inventory checks pass. Live vendor accounts, external TLS/mail delivery,
LDAP StartTLS, MongoDB and other browsers were not tested. Deployment
coverage and repeatable commands are in docs/Features/Login/Testing.md.
Existing Upcoming entries retain the regression audit documented below;
unresolved menu-baseline failures are not counted as fixed by these checks.

</details>

This release fixes import policy enforcement and audits menu behavior:

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9289edc3e">Audit menu implementations and repair import policy and data loss</a>. Thanks to xet7.</summary>

Make Trello HTTP JSON and ZIP imports honor the Admin Panel import-disable
switch and shared transfer validation. Reject wrong-shaped import documents
before creating boards. Preserve Jira Cloud v3 ADF description text and WeKan
attachments whose activity history is absent. Ignore wholly empty CSV rows
without dropping rows containing zero or other data. Connect Organizations
select-all/unselect-all controls and queue rapid clicks in order.

Add documented dummy format fixtures, malformed-input and authorization
checks, Unicode/multiline text, labels and dates, external export menu links
and an exact-byte Trello ZIP to WeKan JSON export/re-import regression. Audit
418 static menu action selectors, reject newly disconnected actions and repair a
stale cross-board move test selector. Document coverage and native-format
limitations instead of treating partial adapters as full backups.

A macOS ARM64 build with FerretDB passes 30 new Chromium checks, the corrected
cross-board move regression and focused Node suites. The baseline browser
audit has 405 passes, 55 failures, 8 skips and 2 tests not run. One failure
is fixed; the remainder require individual investigation. External comments,
files and advanced fields are not preserved by every adapter; whole-board
WeKan ZIP import, Asana bulk exports and native Zenkit compatibility remain
unverified or incomplete. The menu audit records these gaps explicitly.

</details>

This release adds the following features:

<details>
<summary><a href="https://github.com/wekan/wekan/commit/552ac0855">Create cards, lists and swimlanes from pasted lines</a>. Thanks to AmigaAbattoir and xet7.</summary>

When a new title has multiple nonempty lines, choose one multiline item or
one item per line. Keep pasted order, ignore blank lines in batch mode, reuse
the existing translated labels and prevent overlapping submissions. Card
creation retains its labels, members and other options. List and swimlane
names use multiline editors and preserve line breaks in their headers.

Line splitting, ordering, existing quick-add behavior and composer tests pass.
A macOS ARM64 build and four Chromium tests against isolated FerretDB SQLite
verify cards, inline lists, list popups, swimlanes and multiline renaming.
Fixes <a href="https://github.com/wekan/wekan/issues/6714">#6714</a>.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/cdc0722b1">Always show one-or-many creation choices, including boards</a>. Thanks to xet7.</summary>

Show Add many lines as with one-item and many-item radio options directly
below every card, list, swimlane and board title field, before typing. Default
to one item; many-item creation skips blank lines. Board titles accept pasted
lines and batch creation retains workspace, template and starring flows,
prevents overlapping submissions and opens the last board after completion.
Reuse translated item names; register the new labels with English fallbacks
without replacing existing translations. Update the multiline feature guide.

A macOS ARM64 build and five Chromium tests verify both choices for cards,
inline and popup lists, swimlanes and boards. Unit checks cover blank titles,
ordering, board batches, shared forms, locale placeholders and documentation.

</details>

and fixes scheduled full-instance backups:

<details>
<summary><a href="https://github.com/wekan/wekan/commit/58d856363">Repair full backups and validate Admin Panel features</a>. Thanks to markusst1982 and xet7.</summary>

Start the shared scheduler and replace the invalid daily schedule expression.
Whole-instance archives preserve all application collections, BSON values,
indexes and selected attachment/avatar versions, including their metadata.
Use Meteor's database driver for BSON compatibility. Validate checksums and file
references before restore, rebase file paths and report database/file failures.
Reload saved selections and reject invalid schedules. Organization archives
remain restricted; online backups are sequential, not atomic snapshots.

A macOS ARM64 build passes an actual scheduled backup, database/file restore
and authenticated attachment/avatar downloads. Nine real FerretDB round-trip
and failure checks, the bundled scheduler parser check, 70 focused Node suites
and 24 Chromium checks pass. Every Admin Panel pane has an implementation
inventory and all 48 routes render. External identity, mail and cloud services,
device installation and two-database migration need deployment-specific tests;
the validation report states these limits.

</details>

and fixes Firefox password login:

<details>
<summary><a href="https://github.com/wekan/wekan/commit/79cd46558">Restore Firefox password login after registration</a>. Thanks to xet7.</summary>

Firefox suppressed the password form's replayed submit event while the
original native submission was still running, leaving users on Sign In with
no error. Defer replay to the next event-loop task while blocking duplicate
submissions. Retain existing password validation and two-factor handling.

Reproduce the failure in Firefox 156.0.1 and verify the rebuilt macOS ARM64
app: registration, wrong-password rejection, click and Enter login, and
session resume after reload pass. Native-event regressions fail with the old
handler and pass with the fix. Chromium password/TOTP, emailed-code and
submit-event checks pass, along with focused positive and negative Node
tests. Document the separate macOS Firefox test-launch limitation.

</details>

and fixes the following build issue:

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d17dadcf7">Fix Meteor bundle rebuilds with npm 12</a>. Thanks to xet7.</summary>

Remove Meteor's default `--update-binary` argument before the server install:
npm 12 rejects that node-pre-gyp option as an unknown npm flag. Keep rebuilds,
custom rebuild flags and lifecycle execution. Give bundle rebuild projects an
explicit install-script policy for argon2, bcrypt and useragent-ng; keep other
dependency scripts blocked. The shared preparation helper already runs before
release, local and Docker server installs.

Reproduce the failure with npm 12.0.2 and the generated Meteor rebuild scripts,
then verify an offline install and an allowed lifecycle script succeed after
preparation. Policy, invalid-path, idempotence, custom-flag, read-only-file and
release wiring regressions pass. The hosted build matrix was not rerun.

</details>

and updates developer tooling:

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b22d17331">Update the Meteor skills lockfile</a>. Thanks to Meteor developers and xet7.</summary>

Update Meteor skill references from v1.1.0-beta.0 to v1.1.0-beta.1 and refresh
content hashes in skills-lock.json. Add locked entries for Meteor React
and TypeScript.

</details>

and updates the feature and backup documentation:

<details>
<summary><a href="https://github.com/wekan/wekan/commit/953d8f7c1">Match feature guides to menus and document backup alternatives</a>. Thanks to markusst1982 and xet7.</summary>

Organize feature guides by the current Header, All Boards, Member Settings,
Right Sidebar, Board Settings, Cards, Lists and Swimlanes menus. Document the
newest September features and preserve old paths with forwarding pages.

Add the backup alternatives from issue #6683, descriptive screenshot filenames
and relative links between deployment, storage, export/import and backup guides.
Menu-inventory and local documentation-link checks pass.

</details>

and updates translations:

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d97b6a85e">Translate multiline creation choices in every language</a>. Thanks to xet7.</summary>

Translate Add many lines as and Many items in all 232 non-English locales.
Reuse existing board, card, list and swimlane names, preserving their
translations and the exact interpolation placeholder. Keep English variants
unchanged. Record vocabulary references and languages needing fluent review
in docs/Features/Translations/Multiline-Creation-Review.md.

Eight focused Node tests and 21 human-preference checks pass. A macOS ARM64
build passes nine Chromium tests, including Finnish, French, Japanese and
Hebrew labels, RTL layout and all four item creation flows. Locale-wide
positive and negative tests check interpolation, completeness and key order.

</details>

Thanks to above GitHub users for their contributions and translators for their translations.

# v11.91 2026-09-23 WeKan ® release

**In short:** WeKan's platform builds now target **Node.js 26.9.0** and
**npm 12.0.2**. GitHub release workflows also build separate macOS apps for
Apple Silicon and Intel.

This release improves the following account security controls:

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ab11bad21">Harden Meteor 3.6 passwordless account requests</a>. Thanks to xet7.</summary>

Read Admin Panel OAuth and passwordless settings asynchronously so their
server-side login guards use the saved values. Passwordless code requests now
use the documented selector shape, cannot create an account when registration
is closed, and have an additional five-per-minute source-address limit. Rate
limit denials appear in Problems / Security Report. WeKan already enables
Meteor's hardened HttpOnly cookie flow. Focused account/security tests and a
Chromium regression for closed registration pass.

</details>

This release adds the following platform package:

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b9ae16a44">Package separate macOS apps for Apple Silicon and Intel</a>. Thanks to xet7.</summary>

Wrap each published Mac bundle in a draggable `.app` ZIP with bundled Node.js,
FerretDB and Meteor 3 WeKan. Finder opens a Terminal window to run the server,
with writable files under the user's Library. Release and missing-assets
workflows build both architectures separately and smoke-test startup on their
native GitHub runners. Local packaging checks passed for both architectures;
the GitHub runner smoke tests remain to be run by the release workflows.

</details>

This release updates the following dependencies and platforms:

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9b213cdf4">Update WeKan to Node.js 26 and npm 12</a>. Thanks to xet7.</summary>

Pin the production Docker runtime to Node.js 26.9.0 and npm 12.0.2, move
release workflows and local build paths to Node.js 26, and refresh active
platform documentation and examples. The Meteor baseline is 3.6-beta.1.
Source checks and release workflow tests pass; platform binaries remain for
the GitHub workflows to build.

</details>

This release adds the following Admin Panel features:

<details>
<summary><a href="https://github.com/wekan/wekan/commit/23ed8d927">Show Meteor instrumentation in Admin Panel Problems</a>. Thanks to xet7.</summary>

The new Instrumentation pane shows live method, publication and DDP connection
counts, error counts and available timings from Meteor 3.6. Its admin-only,
bounded counters are local to one server process and reset on restart. The
report does not retain arguments, results, addresses or user identifiers.
Meteor build, focused Node tests and the Chromium browser regression pass.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/94b59bef0">Set date formats in global, board and member settings</a>. Thanks to xet7.</summary>

Opened cards now call their date section Date and contain no format selector.
Admin Panel / Settings / Visibility has a separate Date section and Save button.
Board Settings / Date and Member Settings / Date open format popups: checked
member settings override checked board settings, which override the enabled
global default. Unchecking a scope preserves its saved value and inherits the
next default. Guests inherit board and global settings.

The board popup shows the global setting's enabled status and saved format; the
member popup shows both global and board settings. All labels reuse existing
translations, verified across 246 locales. Display, exports and ambiguous date
filters share the hierarchy without changing timestamps or calendar selection.

The native macOS ARM64 build, focused Node suites, source and bundle telemetry
checks, and two Chromium date regressions pass. Two unrelated label/checklist
browser cases fail identically on the pre-change bundle. See the
<a href="docs/Features/Date-Format.md">date format settings guide</a>.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e13f4f6c2">Group member date preferences directly under Date</a>. Thanks to xet7.</summary>

Member Settings now opens Date directly, with Date Format followed by Set day
of the week start and Calendar system (date display). Remove these controls
from Change Settings. Save captures all three selections before profile updates
and waits for week-start persistence; saving Change Settings leaves them alone.
Existing translations are reused. The native macOS ARM64 build, focused Node
suites, telemetry checks and ten Chromium menu, persistence, translated-calendar
and date-format hierarchy checks pass.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e217f1215">Move the ISO week-number toggle into Board Settings / Date</a>. Thanks to xet7.</summary>

Show week of year (ISO 8601) now appears below Save and a horizontal rule in
Board Settings / Date instead of the right sidebar. It keeps its existing
immediate personal-preference behavior and translations. Browser checks verify
its position and saved toggle state, and confirm that Member Settings / Date
shows Date Format directly above week-start and calendar-system controls.
The native macOS ARM64 build, focused tests and telemetry checks pass.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b87b0aca1">Clarify member Date Format status and grouping</a>. Thanks to xet7.</summary>

Member Settings / Date now places the bold Member Settings: Date Format heading
directly after the board status, without a horizontal rule. Below it, the
checkbox label immediately switches between Disabled and Enabled, followed by
the format dropdown. Add horizontal rules above week-start and calendar-system
settings. Existing translations are reused. Focused tests, the macOS ARM64
build, Chromium layout and override checks, and telemetry audits pass.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/63238a687">Align the Date Format checkbox and status label</a>. Thanks to xet7.</summary>

Member Settings / Date now centers Disabled or Enabled beside the checkbox.
Remove inherited text-field height, padding and margins so the native checkbox
stays 16px high. The macOS ARM64 build and Chromium geometry checks pass for
both checkbox states, together with the existing date-format regressions.

</details>

This release fixes the following sign-in bug:

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b4459a79e">Fix duplicate LDAP login submissions and silently discarded errors</a>. Thanks to Nissulya and xet7.</summary>

Cancel form submission before the asynchronous authentication-method lookup so
one click or Enter press cannot start both password and LDAP login. Keep the
form mounted, reject duplicate pending submissions, display provider errors
without redirecting, and use normal session-aware completion after success.
Local password validation and 2FA continue through the original form handler.

Seven focused tests and the related LDAP, redirect, 2FA and telemetry suites
pass. A fresh macOS ARM64 Meteor build and four Chromium regressions against
isolated FerretDB SQLite passed, including error/retry, click/Enter routing,
real session completion and password fallback. The UI tests control the
directory callback; the reporter's external LDAPS server and Snap installation
were not tested. See <a href="docs/DeveloperDocs/LDAP-6692.md">the
investigation</a>.

</details>

This release fixes the following board, card and list bugs:

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a0c14a4c7">Keep public board favorites across reloads</a>. Thanks to nalilord and xet7.</summary>

A logged-in reader's star on a public board they do not belong to now survives
reload and appears in the Starred overview. Only starred public boards join the
reader's board list, and a later change to private does not retain access.
Focused Node tests and a real Chromium regression pass. Fixes
<a href="https://github.com/wekan/wekan/issues/6713">#6713</a>.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0741a7847">Open linked card URLs in the current tab</a>. Thanks to carl-unique and xet7.</summary>

Card links inside Markdown viewers now use the current WeKan tab. The card
details view waits for its card subscription before deciding the card has
disappeared, so navigation does not close a card during loading. Internal link
and real Chromium navigation tests pass. Fixes
<a href="https://github.com/wekan/wekan/issues/6711">#6711</a>.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/773a1c2dd">Restore saved list collapse state after page reload</a>. Thanks to Nich01asFox and xet7.</summary>

The list view now reads the saved per-user collapse value after the profile
arrives instead of keeping an early expanded fallback in page session state.
The persistence regression passes in Chromium after a full reload. Fixes
<a href="https://github.com/wekan/wekan/issues/6712">#6712</a>.

</details>

This release fixes the following Admin Panel reports:

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e8d9bf9f1">Pair IPv4 and IPv6 addresses with their locations</a>. Thanks to xet7.</summary>

Admin address tables now show IPv4 address, Location, IPv6 address and IPv6
location in that order. Each flag and city sits beside the address family
present on its row; unavailable locations stay empty. API, event, Recovery,
Offices and People login-location reports use the same four columns. Focused
Node tests pass; the updated browser regression awaits a working browser host.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d43968d88">Clarify file scans and show location in address reports</a>. Thanks to xet7.</summary>

Filesystem Integrity now says when a partial audit stopped before scanning
storage, and larger inventories no longer stop at 20,000 versions. A truncated
record scan stops before it can report false orphan files. Offices uses recorded
login locations where available; the People location table shows the flag with
the city. Admin report cells wrap long values, and file-audit and Files Report
buttons follow the current theme. Focused Node tests pass; the new browser
regression is ready for a host with a running WeKan server and Chromium.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/8e7369e0b">Use the current theme for default button states</a>. Thanks to xet7.</summary>

Default buttons now use the same theme fill and WeKan blue fallback as the
pagination controls, including focus and pressed states. Primary and
destructive buttons keep their own styles. Theme regression tests pass.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ba4637e55">Show initials for missing impersonated users</a>. Thanks to xet7.</summary>

Impersonation Report user cells now show initials even when the account is no
longer available, while existing avatar images remain visible. User names
have room to wrap inside the table. Focused Node tests pass; the browser
regression is ready for a host with a running WeKan server and Chromium.

</details>

This release fixes the following test and GitHub workflow issues:

<details>
<summary><a href="https://github.com/wekan/wekan/commit/160e5635b">Prevent reusing an existing release version</a>. Thanks to xet7.</summary>

Choose the next version from the newest changelog, package version and local
or remote release tag. Refuse stale explicit versions and stop if remote tags
cannot be checked, before editing notes or publishing. Restore the September
20 v11.90 notes and keep subsequent changes in Upcoming for v11.91. Regression
tests cover stale headings, missing local tags, version rollover, explicit
arguments and remote failures without publishing anything.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5779499ef">Fix npm 12 production installs and validate native macOS ARM64 builds</a>. Thanks to xet7.</summary>

Allow Meteor's commit-pinned source-map-support tarball through a validated,
bundle-local npm policy before dependency installation. Keep generated Rspack
assets outside the source inventory while still scanning all shipped files.
Fresh local builds of WeKan, mongosh, FerretDB and all eight MongoDB Database
Tools passed startup checks. Database checks covered CRUD, import/export,
dump/restore, BSON, GridFS and status tools; WeKan served HTTP with bundled
FerretDB SQLite. Source and artifact telemetry gates and focused positive and
negative regression tests passed. Nonfatal compiler and experimental Node
warnings remain; other platforms and hosted release workflows were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/7f781be34">Stop release builds on telemetry regressions</a>. Thanks to xet7.</summary>

Release All and Release All Missing now require reviewed application source and
check final bundles for known reporting implementations before packaging.
Downloaded ZIPs and Docker, Snap, Sandstorm, AppImage and Mac payloads are
checked
too. Failures produce an error annotation and stop the affected build. Opt out
of
Meteor's default build/run package-statistics reporting while preserving local
instrumentation, security logging and metrics.

Source, artifact, compressed-archive and workflow regression tests pass,
including
logging and instrumentation tests. Companion mongosh, Database Tools and
FerretDB
builds enforce corresponding source/runtime/native checks; an unpatched stripped
Database Tools binary was rejected as a negative control. The current Meteor
bundle, patched tool binaries and a native FerretDB build passed their checks.
A subsequent fresh macOS ARM64 Meteor build and production startup with bundled
FerretDB SQLite passed, as did database-connected mongosh and Database Tools
checks. Hosted releases and the full native platform matrix were not run. See
the <a href="docs/DeveloperDocs/Release-Telemetry-Checks.md">audit
scope, limitations and update procedure</a>.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/95f0e045a">Keep Docker browser tests on Meteor localhost origin</a>. Thanks to xet7.</summary>

On macOS, bridge the browser container's localhost to the host WeKan server.
This keeps the browser origin equal to Meteor's `ROOT_URL`, so dynamic imports
and the real Clipboard API work in Firefox. Wait for the custom settings to
reach a disposable browser context before checking a fresh context's first
logo request. With one worker and no retries, the eight previously failing
Chromium cases and all 31 selected Firefox cases pass in real browsers.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5e7577e3d">Stabilize cross-browser test navigation and clipboard checks</a>. Thanks to xet7.</summary>

Wait for export links to render before inspecting them, navigate directly to
sign-in in the custom-logo test, and replace network-idle waits with document
and app readiness checks in affected tests. Register the macOS app packager as
an internal workflow script in the build-script audit. Focused Node checks
pass and all browser tests register; browser verification is recorded above.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ced5263a4">Repair macOS test and release workflow regressions</a>. Thanks to xet7.</summary>

Give Docker browser tests a macOS host address, make the password visibility
button explicitly reachable by Tab in WebKit, and use portable sed and file
size commands in release helpers. Retry npm version installs, keep the
Launchpad retry budget decreasing, and update regression guards for the
current release workflow and Node.js 26. Remove an unused, all-English
Kannada locale duplicate; the translated `kn` locale remains active.
The Node suite ran all 1,189 suites; eight were rerun successfully after
the sandbox blocked local test listeners. The full browser suite remains
to be rerun on the host.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/19f740f50">Stabilize tests and macOS release jobs</a>. Thanks to xet7.</summary>

Align linked-card, Recovery report and changelog checks with current code.
Correct the Problems pane count. Give macOS release jobs time limits and make
selected browser checks more reliable under load. Focused Chromium, Firefox
and WebKit checks pass. The full Node run still exposes unfinished locale data,
including an untracked all-English `kn_IN` file recreated after its removal.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d4ef9284b">Reuse the WeKan checkout for forge mirroring</a>. Thanks to xet7.</summary>

Mirror sync fetches source branches and tags into private refs in this
checkout, avoiding a second bare clone of WeKan under `.tools`. Other
organization repositories can still use a source cache. Mock Git tests cover
normal sync, divergence recovery and reuse of destination checkouts; no live
mirror was run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/cb8fd6b86">Keep translated Kannada active after pulls</a>. Thanks to xet7.</summary>

Remove `kn_IN` after a Transifex pull only when it exactly matches the English
source; the translated `kn` locale stays active. Keep newer Colombian Spanish
and Traditional Chinese wording, and let the audit test handle a locale that
has gained pending review items. Focused locale checks pass.

</details>

This release improves the Transifex translation pull:

<details>
<summary><a href="https://github.com/wekan/wekan/commit/bee69b103">Preserve reviewed Mongolian translations through pulls</a>. Thanks to xet7.</summary>

Keep four established Mongolian loanwords even when the Russian resource uses
the same spelling. Unreviewed French and Russian seed values still become
English placeholders until translated into the target language. If a pull or
repair step fails, restore the pre-pull locale snapshot so local human values
survive. Focused merge and failed-pull regression tests pass.

</details>

This release updates the following translations:

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e39f2889d">Translate pulled Mongolian interface strings</a>. Thanks to xet7.</summary>

Replace the pending English pull values for Mongolian with Mongolian wording,
including automation rules, search controls, reports and account settings.
Preserve source placeholders and existing Mongolian terminology. Focused
wrong-language and placeholder checks pass.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/47ea97810">Translate pulled Occitan interface strings</a>. Thanks to xet7.</summary>

Replace French seed text and English pull placeholders with Occitan. Reuse
reviewed terminology from GNOME, Mozilla, ownCloud, MediaWiki and Apertium,
then preserve legitimate words shared with French. Completeness, token and
pull-merge checks pass.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/fb5adf635">Translate pulled Breton interface strings</a>. Thanks to xet7.</summary>

Replace French seed text and English pull placeholders with Breton, using
existing WeKan wording plus Mozilla, GNOME, MediaWiki and Apertium terminology.
The follow-up <a href="https://github.com/wekan/wekan/commit/f0d6d48ef">spelling correction</a>
keeps the tested Breton color name. Completeness, token and locale checks pass.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e87cf70be">Translate pulled Wolof interface strings</a>. Thanks to xet7.</summary>

Replace French seed text and English pull placeholders with Wolof. Existing
WeKan vocabulary and human Mozilla, Debian and MediaWiki catalogs guided this
low-confidence direct fill. Completeness and token checks pass; native-speaker
wording review remains welcome.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9c1e53fe6">Translate pulled Walloon interface strings</a>. Thanks to xet7.</summary>

Replace French seed text and English pull placeholders with Walloon. GNOME,
Debian and MediaWiki catalogs supplied reviewed terminology, and shared
Walloon/French spellings remain protected during future pulls. Completeness,
token and locale checks pass.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5b128a1c6">Translate pulled Volapük interface strings</a>. Thanks to xet7.</summary>

Replace French seed text and English pull placeholders with Volapük, using
existing WeKan wording, MediaWiki strings and published Volapük dictionaries.
Remove Esperanto words found during review. Completeness and token checks pass;
native-speaker wording review remains welcome.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/8c4b292a9">Translate pulled Standard Moroccan Tamazight interface strings</a>. Thanks to xet7.</summary>

Replace French seed text and English pull placeholders with Standard Moroccan
Tamazight in Neo-Tifinagh, using existing WeKan and IRCAM terminology. The
<a href="https://github.com/wekan/wekan/commit/caa58a39b">review follow-up</a>
corrects the SMTP port label and preserves translated checklist examples. No
Arabic-script values or malformed source tokens remain. Completeness, script,
token and targeted locale checks pass; native-speaker wording review remains
welcome.

</details>

# v11.90 2026-09-20 WeKan ® release

**In short:** **GitHub release workflows** now keep Snap publication moving when
the store returns temporary server errors, while still failing fast on invalid
uploads and credential problems.

This release fixes the following GitHub workflow issue:

<details>
<summary><a href="https://github.com/wekan/wekan/commit/62cccae192b25d8557d9bf5f0e00b60fd0101045">Retry temporary Snap Store upload failures in release workflows</a>. Thanks to Copilot and xet7.</summary>

Release workflows retry temporary Snap Store upload failures for native,
Launchpad and variant publish paths, with bounded backoff and clear fail/stop
rules. Permanent credential and authorization errors still fail immediately,
while transient HTTP 500 failures now retry before final failure.

</details>

# v11.89 2026-09-20 WeKan ® release

**In short:** **Snap Store** uploads now retry temporary server failures across
all release paths. Invalid files and credential failures still stop immediately.

This release fixes the following release-tooling bug:

<details>
<summary><a href="https://github.com/wekan/wekan/commit/62cccae192b25d8557d9bf5f0e00b60fd0101045">Retry temporary Snap Store upload failures</a>. Thanks to Copilot and xet7.</summary>

Native, Launchpad and variant Snap uploads use one shared retry helper,
including for HTTP 500 Internal Server Error responses. By default it tries
three times, waiting 30 and then 60 seconds between attempts, and publishes to
stable, candidate, beta and edge. Invalid files, unreadable credentials and
authorization failures are not retried.

The helper preserves Snapcraft's exit status and distinguishes exhausted
temporary failures from rejected uploads. Temporary logs use unique files
under `TMPDIR`, falling back to `.tools/tmp`, and are removed after use.
This completes [#6708](https://github.com/wekan/wekan/pull/6708).

Existing positive and negative regression checks cover retryable error wording,
rejected uploads, shared helper use and all four release channels. These are
release scripts with no application UI; live Snap Store uploads are not part
of the local checks.

</details>

Thanks to above GitHub users for their contributions and translators for their translations.

# v11.88 2026-09-20 WeKan ® release

**In short:** Add a source-based development server using Meteor's bundled
MongoDB. Fix mobile navigation, card destinations, login redirects, notification
alerts and card closing. Expand serial browser coverage and stop test runs at
the first failure when requested. Reject recurring wrong-language translations
while preserving valid human updates. Reduce development startup warnings and
clean up attachment test fixtures. Fix production document indexing and image
dependency lookup, provide native or bundled libmagic MIME detection across
server platforms, and add administrator file status checks with recovery
evidence.

This release adds the following features:


<details>
<summary><a href="https://github.com/wekan/wekan/commit/1f5cb0d13">Check file status, incomplete metadata and recovery evidence in Problems</a>. Thanks to xet7.</summary>

Files, Filesystem integrity and Recovery now have read-only check buttons above
the pane contents, with progress, cancellation and a downloadable JSON summary.
Checks cover missing or incomplete upload metadata, detected MIME types and
extensions, missing/untracked files, size/hash differences, duplicate
references,
GridFS file/chunk inconsistencies, and possible renamed or moved files.

Undo/change history, activities, recovery events and saved integrity baselines
provide evidence for review. Missing fields can follow failed type detection or
another interrupted finalization step, but the report does not invent a cause.
No check repairs, renames or deletes files or database records. Possible matches
remain candidates; incomplete coverage and unknown types are explicit.

Type headers are inspected across the inventory before the remaining budget is
used for full hashes. Administrator authorization, one scan per server process,
read/time/result limits and a cooldown bound the work. Five focused Node suites
and two browser scenarios pass in Chromium, Firefox and WebKit, including a
wrongly named real PNG, incomplete metadata, summary download and non-admin
rejection. Header-first content checks also pass in all three browsers.

See [File status checks](docs/Features/Admin-Panel/Problems/File-status.md) for
coverage and limits. Live cloud credentials, native Windows and a production
deployment were not used for verification. Existing Upcoming entries retain
their documented regression coverage.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b104edeef">Run Dev server nobuild from the current source checkout</a>. Thanks to xet7.</summary>

Both build menus offer **Dev server nobuild** immediately below **Dev server**,
with the same URL and port options. The new loader uses the installed Meteor
Node, packages and bundled development MongoDB. Application JavaScript and
Blaze templates are transformed in memory, without copying an application to
`.build/bundle` or using `_build` or `.meteor/local/build`.

The database uses the next port, such as 3000/3001 or 4000/4001. The explicit
27019 option also starts bundled development MongoDB. External database
settings are replaced, occupied ports are refused, and source changes restart
the process. Shutdown waits for the owned database port to close. The
visualizer reports loaded source-module sizes.

Positive and negative loader tests cover options, imports, source access,
CommonJS strictness and port cleanup. Browser checks verify source-loaded
sign-in, native fetch and rejection of private or invented imports. Runtime
checks exercise custom ports, the 27019 option, occupied ports, source restarts
and the visualizer. Native Windows execution remains unverified.

See [Dev server nobuild](docs/DeveloperDocs/Dev-server-nobuild.md) for setup,
commands, test results and the pinned Meteor private-API dependency.

</details>

This release fixes the following bugs:

**Mobile navigation** - keep sidebar controls below the rendered header.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/cbc6c20ba">Measure delayed headers after Blaze renders them</a>. Thanks to xet7.</summary>

The header now measures its height after rendering and after login or route
changes. A header appearing after the startup timers previously left the mobile
Search back button underneath the page header. Resize tracking continues to
handle wrapped controls.

Regression coverage exercises delayed rendering, resize updates, repeated
renders and destroyed templates. The mobile Search browser regression passes
on the source development server in Chromium, Firefox and WebKit.

</details>

**Card destinations** - enable moves when the destination subscription is ready.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c06387746">Read current destination documents when selecting a board</a>. Thanks to xet7.</summary>

A ready destination subscription could still read an old empty swimlane cache,
leaving Done disabled even though the selector displayed the destination's
swimlane. The picker now reads current swimlane and list documents directly.

Regression coverage checks delayed cache refresh, stale subscription callbacks,
rejected operations and swimlane list filtering. The cross-board move browser
test verifies visibility and finite, unique card positions after the move.

</details>

**Notifications** - show unread alerts before the drawer is opened.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/6d9a3a95b">Show the unread notification alert without loading drawer details</a>. Thanks to xet7.</summary>

The bell previously counted only notifications whose activity details were
already loaded, although those details are subscribed when the drawer opens.
It now counts unread notification records directly, so new alerts appear while
the drawer is closed. Drawer rendering keeps its existing orphan protection.

Unit coverage checks unread, read and missing records. A browser regression uses
separate author and recipient sessions, verifies the inactive bell before a
mention, and waits for the watching recipient's unread record and live alert.

</details>

**Sign-in navigation** - preserve protected URLs during cookie login.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a171ac0cb">Restore the requested page after cookie authentication</a>. Thanks to xet7.</summary>

Opening a protected URL such as My Cards could reach the sign-in guard before
cookie login completed, then land on All Boards instead. The guard now remembers
the initial path and the login hook restores it after authentication. Only local
application paths are accepted, and deployment prefixes are retained through the
router's redirect API. Sign-in checks and Sandstorm's platform-authenticated
behavior remain in place.

Unit coverage checks accepted and rejected redirect targets and guard behavior.
The browser regression verifies direct My Cards navigation, inclusion of the
assigned card and exclusion of unassigned cards. Cookie and Sandstorm regression
checks also pass.

</details>

**Keyboard navigation** - handle synthetic events without losing focus guards.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4c40bbf9f">Use the focused control for document-targeted keyboard events</a>. Thanks to xet7.</summary>

The non-Latin keyboard bridge dispatches events on the document. The shortcut
filter previously called an element-only method on that target, causing errors
when tabbing through signed-out pages. It now uses the focused element and
safely rejects events with no focused control.

Unit coverage preserves input, button, editable-content, selection and disabled
shortcut guards, as well as Escape handling. The signed-out layout browser test
passes without keyboard errors or an unsolicited two-factor prompt in all
three browsers.

</details>

**Card closing** - tolerate a user profile still being published.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/970ac9dc5">Tolerate partial user profiles when closing cards</a>. Thanks to xet7.</summary>

The card-close handler reads one user snapshot and checks whether its profile
enables description recovery. A user arriving before its profile no longer
throws while closing a card. Unit coverage exercises missing users/profiles,
opt-in, unchanged drafts, saving and discarding. A browser regression removes
the published profile and closes the card without errors in Chromium, Firefox
and WebKit.

</details>

**Attachment processing** - find runtime dependencies and detect file types
across platforms.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a990e7f20">Provide full MIME detection across server platforms</a>. Thanks to xet7.</summary>

Uploads, extension correction and administrator file checks share native `file`
detection with a bundled libmagic WASM engine and magic database when the
command
is unavailable. The portable fallback covers Windows, macOS, Linux, Docker, Snap
and Sandstorm server bundles without a runtime download or separate Windows
utility. Linux setup installs native `file`; Snap stages it and its magic
database.
The release smoke check rejects missing portable dependencies or WASM assets.

Ten focused Node suites pass, including real detection without native `file`,
concurrent initialization, isolated release layout, missing files/assets,
packaging guards, upload safety checks and existing audit behavior. The HTML
file-status browser check passes sequentially in Chromium, Firefox and WebKit
against the source server on port 3000, preserving file contents and metadata.
Native Windows/macOS execution, complete Docker/Snap/Sandstorm builds and
production deployment were not performed. Other Upcoming changes retain their
documented positive, negative and browser regression coverage.

See [cross-platform file type
detection](docs/DeveloperDocs/File-type-detection.md).

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9e1cf4c35">Fix document indexing and image dependency lookup in production</a>. Thanks to xet7.</summary>

Office uploads could succeed while search indexing failed with missing
`fflate`. The package was present in `programs/server/npm/node_modules`, but
the runtime lookup started above that directory. Document and image processing
now search the release npm tree first, with parent lookup retaining source
checkout support. This also fixes the lookup of PDF workers, PDF assets and
the native image converter. Docker keeps the `file` utility installed for full
MIME detection after build dependencies are removed.

Six focused suites pass, covering actual XLSX/DOCX/PPTX text extraction,
rejected archives, missing dependencies, PDF assets, image dependency lookup,
Docker package retention and existing migration behavior. An isolated release
container reproduces the old failure and passes corrected XLSX extraction and
PDF asset resolution without checkout dependencies. These are server runtime
changes; browser behavior is unchanged. A complete Docker image rebuild and
production deployment were not performed.

Unresolved production file versions and checklist rows whose cards no longer
exist remain preserved. Their recovery needs the deployment's actual database,
files and backups; this dependency fix does not claim to recover missing data.

</details>

**Development startup** - remove avoidable warnings and stale test metadata.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/721805b80">Cache package transforms and fix CAS URL parsing and test cleanup</a>. Thanks to xet7.</summary>

Dev server nobuild caches Meteor package transformations under its per-port
`.tools/dev-source` directory, removing uncached-compilation stack traces.
Application code remains loaded from source. Both development menus default to
quiet logging and preserve an explicitly supplied `DEBUG=true` setting.

CAS middleware uses the standard URL API, preserving callback parameter
encoding, deployment paths and custom HTTPS ports. Ambiguous callback tickets
are rejected. Browser teardown removes its board attachment metadata, including
fixtures with deliberately missing files, preventing false path-repair warnings.

Six focused Node suites and nine sequential browser checks pass across Chromium,
Firefox and WebKit. Live HTTP checks with deprecation tracing show neither the
Babel cache warning nor the deprecated URL warning. The development database
has no unresolved attachment versions after teardown. External CAS provider
login and native Windows execution remain unverified. Existing Upcoming entries
retain the regression coverage documented above and below.

</details>

**Browser tests** - report failures and wait for usable controls.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/53b112c25">Make browser readiness checks report failures accurately</a>. Thanks to xet7.</summary>

HTTP and HTTPS readiness checks now have a timeout and fail on connection or
server errors instead of reporting a successful run with no browser tests.
Membership and search regressions wait for document readiness and visible
controls, avoiding idle-network waits on Meteor's persistent connection.
The member-removal regression requires the removal controls and verifies the
stored membership change.

Positive and negative readiness checks pass, along with the affected membership,
search and table-view tests on the source server in all three browsers.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/01e985a6d">Test keyboard-accessible password visibility buttons</a>. Thanks to xet7.</summary>

The sign-up browser test now follows the adopted accessibility behavior: Tab
reaches both password visibility buttons. Space and Enter reveal and hide the
password without submitting the form or losing focus. Enter in the password
confirmation field still submits registration. Test accounts are cleaned up
even if an assertion fails. The regression passes in all three browsers.

</details>

- [Wait for rendered state in layout and stability regressions](https://github.com/wekan/wekan/commit/24629d175).
  View changes, list order, immediate comment persistence and repeated sign-in
  page loads pass without waiting for idle Meteor connections. Thanks to xet7.

- [Require selected labels and wait for usable date controls](https://github.com/wekan/wekan/commit/e3273cd2b).
  Label selection must display its badge; date-editor reloads wait for document
  readiness and visible controls. The affected regressions pass in all three
  browsers on the source development server. Thanks to xet7.

- [Wait for voting controls instead of idle connections](https://github.com/wekan/wekan/commit/0a1ad00b8).
  Positive and negative votes retain their stored-voter assertions, and the
  visible vote count updates from zero to one. These regressions pass in
  all three browsers on the source development server. Thanks to xet7.

- [Wait for card fields after document-ready reloads](https://github.com/wekan/wekan/commit/8e9093154).
  Requested By and Assigned By retain their accessible Add/Edit controls, and
  description persistence remains asserted. The card members and description
  group passes in all three browsers on the source server. Thanks to xet7.

- [Wait for ready board views in template and pagination tests](https://github.com/wekan/wekan/commit/ef381207c).
  Template copying, sorting, search and pagination retain their state and
  permission assertions after document-ready navigation. The affected tests
  pass in all three browsers on the source server. Thanks to xet7.

- [Wait for authenticated controls in report and mobile regressions](https://github.com/wekan/wekan/commit/f50b4786f).
  Version lookup waits for the non-admin session before checking its refusal.
  Comment publication keeps positive and cross-board exclusion checks, and phone
  boards keep invitation, column and scroll geometry assertions. The regressions
  pass in all three browsers on the source server. Thanks to xet7.

- [Exercise serial browser checks across all supported engines](https://github.com/wekan/wekan/commit/fc0c3c815).
  Portable card-drag tests now run in Chromium, Firefox and WebKit. Serial runs
  also check organization/team feature toggles in every browser. Keep drag
  gestures inside the viewport and focus the comment textarea with a real click
  before checking mention-menu hit targets. The swimlane popup must expose its
  creation input. All affected tests pass in the three browsers; raw CDP touch
  remains Chromium-only. Thanks to xet7.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b104edeef">Run EVERYTHING sequentially against the source development server</a>. Thanks to xet7.</summary>

The source test menu uses localhost:3000 and bundled MongoDB on 3001. Server
Mocha, Node suites, import and E2E regressions, Chromium, Firefox, WebKit,
database conformance and FerretDB stages stop on failure when requested.
Browser retries are disabled in this mode and the first failure trace is kept.
Session-token checks parse test callbacks so separate parameterized tests do
not falsely count as one shared session.

Across sequential runs, fixes and focused reruns, 1,182 Node suites and 527
server tests pass. Chromium passes 446 distinct cases; Firefox and WebKit each
pass 445, excluding only the Chromium CDP raw-touch case. These include URL
prefix checks. All 103 database cases agree on SQLite, PostgreSQL, MySQL and
MariaDB; SAP HANA was not run on this CPU. One Firefox title-edit failure did
not recur in a diagnostic and five repetitions; its cause remains unconfirmed.

FerretDB's [stage bail handling](https://github.com/wekan/FerretDB/commit/34f9a857)
and [intentional failure fixture](https://github.com/wekan/FerretDB/commit/ef094eeb)
are fixed in its companion repository. Its unit, vet and sequential SQLite
integration stages pass. Positive and negative runner, browser-selection,
session-token and database-conformance wiring checks pass too.

</details>

and improves the translation workflow:

**Translations** - preserve reviewed wording when pulling updates.

**Languages updated:** Aymara, Dzongkha, Ewe, Inuktitut, Nahuatl, Persian,
Portuguese, Quechua, Serbian, Tsonga, Veps, Standard Moroccan Tamazight.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3e38abc0d">Reject recurring foreign-language and audited bad values from Transifex</a>. Thanks to xet7.</summary>

Repair 841 pulled values while retaining 77 valid Persian and Portuguese
updates.
Exact locale/key/value checks reject the reviewed foreign text and previously
corrected wording errors without preventing newer human translations. The pull
also reapplies the existing audit's exact-value corrections. Invalid or missing
fallbacks become English placeholders instead of keeping known bad text.

Preserve separate adjacent placeholders such as `__start__-__end__`. Clarify
that the English-regression report precedes the automatic per-key merge.
A dry-run test now discovers the locale count instead of hard-coding it.

Eleven focused Node suites pass, including all 22,302 audit records and replay
of every rejected pulled value. The human-preference verifier passes 21 checks
and exercises the actual merge. Visible Veps and Tamazight controls pass in
Chromium, Firefox and WebKit. The Quechua width label uses an attested term;
complete grammar remains low confidence pending native review.

See [translation audit evidence](docs/Features/Translations/Audit-Evidence.md)
for retained updates, rejected text, references and validation limits.

</details>

Thanks to above GitHub users for their contributions and translators for their translations.

# v11.87 2026-09-19 WeKan ® release

**In short:** Launchpad Snap builds recover the correct repository, wait for
new refs to become available, and retain completed builds when downloads fail.
Card dragging, comment mentions, destination dialogs, keyboard controls and
scaled layouts gain regression-tested fixes. Boards gain optional cleaner cards
and date-only display.

This release adds the following features:

**Task board presentation** - optional cleaner cards and date-only display.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/16b1b307f">Add cleaner minicard and checklist options and date-only formats</a>. Thanks to xet7.</summary>

Board Settings can hide the minicard collapse control, place labels above the
minicard title, hide checklist due-date controls and hide the outer Checklists
heading. Previously collapsed contents remain accessible when their control is
hidden. These options preserve stored dates, label settings and existing
defaults.
Unset checklist due dates use a small, named clock beside the checklist title.

Users and administrators can select date-only versions of the three date orders.
The selected calendar and export format are respected without changing stored
timestamps, reminders or date/time editing. Existing smaller-font presets also
reduce checklist and Card Settings spacing.

The <a href="https://github.com/wekan/wekan/blob/main/docs/Features/Clean-Task-Boards.md">clean task board guide</a>
maps all eight supplied observations to new or existing behavior. Existing fixes
for inline completion controls, disabled ordering arrows and the
admin-controlled
date selector are retained. Labels reuse existing translations.

Regression coverage checks compatible defaults, saved collapsed states, label
placement and visibility, board-admin permissions, checklist data retention,
personal/admin date-only choices, multiple calendar systems and compact spacing.
A fresh Meteor build passed. The full 1,177-suite Node run found one outdated
collapse assertion; its updated suite passed on rerun. All ten browser scenarios
passed across Chromium and Firefox after allowing browser font-size rounding.
Browser checks used MongoDB; FerretDB, WebKit and native packages were not
tested.

</details>

This release fixes the following bugs:

**Cards and comments** - restored dragging and mention suggestions.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/337f601852">Restore dragging after expanding collapsed lists</a>. Thanks to Nich01asFox and xet7.</summary>

Expanded lists recreate their sortable behavior and dispose it when removed.
Repeated collapse/expand cycles and reloads support dragging cards both into
and out of the list. Fixes <a href="https://github.com/wekan/wekan/issues/6705">#6705</a>.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/193c799539">Restore visible, selectable comment mention suggestions</a>. Thanks to bbyszio and xet7.</summary>

Comment editors initialize one correctly scoped autocomplete menu with visible
placement above the card. The plain editor remains usable when the richer editor
is unavailable. Fixes <a href="https://github.com/wekan/wekan/issues/6704">#6704</a>.

</details>

**Board usability** - implement the useful audited fixes with additional
safeguards.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/896f1222b">Improve ordering, destination dialogs, keyboard controls and scaled layouts</a>. Thanks to xet7.</summary>

Relative card insertion uses real gaps and handles tied ranks. Destination
dialogs stop stale subscriptions, retain failed operations and protect against
double submission. Checklist rules save strings, overtime waits for Save,
translation search treats punctuation literally, and registered long language
tags are accepted.

Keyboard users can operate rule buttons, checklist rows, switches, password
reveal and attachment previews. One shared viewer handles focus entry,
containment and return. Popup and Gantt geometry scales with text, progress bars
fit their tracks, and settings stack on narrow screens. Missing labels reuse
existing translations.

The <a href="https://github.com/wekan/wekan/blob/main/docs/Security/Fixes2026-09-18/Implementation.md">implementation report</a>
records all 36 findings, revised proposals, tests and remaining validation
limits.
A fresh Meteor bundle and all 1,176 Node suites passed. Chromium and Firefox
regression scenarios cover the compiled app with MongoDB; no FerretDB or live
LDAP
integration, WebKit run or screen-reader session is claimed.

</details>

**Markdown editor** - remove obsolete visual-editor code and configuration.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5ed9fc944">Remove the obsolete Summernote integration and editor setting</a>. Thanks to xet7.</summary>

Removed `RICHER_CARD_COMMENT_EDITOR`, its Snap option, server setting bridge,
unused editor initialization, upload/paste callbacks and editor-specific styles
and selectors. Docker, Snap, Sandstorm, development containers, Windows and Unix
launchers, build/test scripts and current documentation no longer advertise it.
Released and archived changelog entries remain unchanged.

WeKan edits Markdown in textareas. No existing WYSIWYG editor supports its full
combination of Markdown, emoji, security requirements and other editing
features. Mention suggestions, Markdown rendering, HTML-to-Markdown conversion
and existing attachment links remain available. Notification emails use the
shared escaped HTML formatter independently of editor settings; custom body
templates retain their existing behavior.

The <a href="https://github.com/wekan/wekan/blob/main/docs/Features/Markdown-Editor.md">Markdown editor documentation</a>
describes the supported editor. Regression checks exercise per-template mention
initialization, Markdown/emoji round trips, pasted-HTML safety, attachment links
and escaped notification email output. A missing translation import in the
attachment error handler was also corrected.

A fresh Meteor build and six Chromium/Firefox checks passed. Shell syntax and
platform YAML checks passed; native Windows, Snap and Sandstorm packages were
not built in this Linux test environment.

</details>

This release fixes the following build and release tooling:

**Snap builds** - repository recovery and reliable artifact retrieval.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/29bd491e8">Fix Launchpad recovery, ref indexing and artifact downloads</a>. Thanks to xet7.</summary>

The v11.86 build logs showed recovery looking up the wrong repository,
recipe creation racing Launchpad's indexing of `main`, and a successful
PPC64EL build downloading an unusable 2,043-byte artifact before cleanup
deleted the remote recipe.

Remote builds now use a compatibility wrapper inside Snapcraft's installed
environment. Recovery looks up the project repository, recipe creation
retries the specific missing-ref response for up to fifteen minutes, and
invalid snap downloads retry before cleanup. Repeated invalid downloads
retain the remote build for recovery. The existing five-hour total wait
budget remains in effect.

All 1,173 Node test files passed sequentially, including positive and
negative regression tests for repository lookup, delayed refs, bounded
retries, incomplete downloads and launcher arguments. Actionlint and shell
and Python syntax checks passed. Remote services were mocked; live
Launchpad builds and publication remain for a human-run release job.

</details>

This release improves regression testing and documentation:

<details>
<summary><a href="https://github.com/wekan/wekan/commit/fd238d34c">Verify muted-board fixes through actual SMTP delivery</a>. Thanks to Nissulya and xet7.</summary>

The earlier muted-assignment and scoped-subscription fixes for
<a href="https://github.com/wekan/wekan/issues/6658">#6658</a> are already present.
New browser regressions capture real SMTP submissions for watched boards,
lists and cards, covering comments, title changes and new cards. Muted
assignments, member email opt-outs and the actor's own changes stay silent.
The notification guide now describes the actual channels, watch levels,
settings precedence and delivery prerequisites.

All ten SMTP scenarios and six existing tray/settings scenarios passed across
Chromium and Firefox using the current Meteor bundle with MongoDB. Focused
notification and recipient Node suites passed. The latest reported delivery
failure was not reproduced; external inbox delivery and FerretDB runtime
remain unverified.

</details>

Thanks to above GitHub users for their contributions and translators for their translations.

# v11.86 2026-09-18 WeKan ® release

**In short:** Interrupted Snap builds recover their existing Launchpad work,
and GitHub snap attachments retry within bounded time limits.

This release fixes the following build and release tooling:

**Snap builds** - recovery and release attachments.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/bc5881ff9">Recover interrupted Snap builds and bound release attachments</a>. Thanks to xet7.</summary>

The v11.85 logs showed ARMHF losing its Launchpad polling connection,
PPC64EL and S390X waiting until GitHub cancelled their jobs, and an AMD64
snap published to the Snap Store but stalled while attaching to GitHub.

Launchpad retries now recover an existing recipe and share one five-hour
wait budget across all attempts and architectures. An isolated source
snapshot keeps Git metadata, logs and downloads outside Snapcraft's project
hash, while architecture-specific content keeps matrix recipes separate.
Only an explicitly missing recipe or repository permits a new submission.
Queued work remains unfinished rather than being reported as a built snap.

Snap attachments use bounded retries and verify remote names and sizes.
Regression tests cover recovery, credentials, timeouts, invalid artifacts,
stable snapshots and attachment failures with mocked network commands.
The 1,172 Node suites are verified, including two corrected guard reruns;
workflow parsing, shell syntax and Actionlint also pass. Live Launchpad
builds and publishing remain for a human-run release workflow to verify.

</details>

Thanks to above GitHub users for their contributions and translators for their translations.

# v11.85 2026-09-17 WeKan ® release

**In short:** Admins can select one date format for everyone and hide the
personal date-format selector on cards.

This release adds the following new feature:

**Date display** - one format for members and guests.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/46607d4299">Add an admin date format override for everyone</a>. Thanks to Mathia2 and xet7.</summary>

Admin Panel / Settings / Visibility / All Boards: Hide now has a Date Format
for everyone checkbox and format dropdown between Board member list and Wait
Spinner. Enabling it overrides personal date formats, changes the opened
card heading to Date, and hides its format dropdown. Disabling it restores
personal preferences without changing stored dates or calendar choices.
Browser export requests and date filters use the same selected format.

Positive and negative tests cover all supported formats, guest preferences,
admin permissions, invalid values, and restoration when disabled. The new
browser test and 17 existing calendar tests pass in Chromium, Firefox and
WebKit. The application builds, and the 1,171 Node suites are verified,
including the updated collapse test rerun. The new label is translated in
all locales; lower-confidence translations are identified in the commit.
Fixes #6703.

</details>

Thanks to above GitHub users for their contributions and translators for their translations.

# v11.84 2026-09-17 WeKan ® release

**In short:** Notification subscriptions and settings work at their intended
scope, hidden card fields no longer leave empty sections, WIP groups can be
selected and edited, and a checklist submission creates one checklist.
My Cards and My Attachments open the selected card in a popup again.
FerretDB oplog fixes address a reproduced cause of slow session restoration;
confirmation of the database in #6701 is still needed.

This release has the following bug fixes:

**Notifications** - subscriptions and settings.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/03e8a6bf66">Honor scoped notification subscriptions and settings</a>. Thanks to Nissulya and xet7.</summary>

Explicit list and card subscriptions remain eligible on an otherwise muted
board; assignment or mention alone does not override muting, and recipients
must still be active board members. Member and board notification popups keep
their scope when a service option is clicked, and selected options display
correctly. Unit tests cover recipient filtering and all three settings scopes.
[Browser delivery checks](https://github.com/wekan/wekan/commit/762e742b2)
verify both muted assignments and explicit list comments, alongside persistent
member/board settings. Fixes #6658.

</details>

**Card fields** - hide empty groups.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5c7f455285">Hide empty card field groups and their separators</a>. Thanks to fabiosalles and xet7.</summary>

Dates, Members and Sort render their whole group only when a visible field is
available. Disabling the fields removes the empty heading and horizontal line;
reenabling a field restores its group. Unit and browser tests cover both
states and the conditional spent-time field. Fixes #6696.

</details>

**Personal lists** - open the selected card in place.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d01b3a3d9">Restore card popups on My Cards and My Attachments</a>. Thanks to Mathia2 and xet7.</summary>

Links pass their card and board identifiers explicitly: named `each` loops
do not change the outer Blaze data context. Clicking a card or its nested
content opens the correct popup without leaving the list. Modified clicks
keep native link behavior. Unit tests cover incorrect outer contexts,
missing identifiers and modified clicks. Browser tests open two cards in
sequence on both pages and pass in Chromium, Firefox and WebKit with polling
reactivity. Fixes #6702.

</details>

**Board settings** - select and edit WIP groups.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/87d69358dc">Make WIP group list checkboxes visible and editable</a>. Thanks to Mahgozar and xet7.</summary>

The group editor restores native checkbox visibility and resolves the list
helper inside existing groups. [Saved-group edits](https://github.com/wekan/wekan/commit/783733623)
use a validated server method with board/site-admin authorization and compare
the existing group array to prevent overwriting a concurrent edit. Unit and
browser tests cover mouse and keyboard selection, persistent edits, invalid
lists and limits, and unauthorized users. Fixes #6699.

</details>

**Checklists** - prevent duplicate submissions.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0a8ee08d56">Submit checklist creation once per user action</a>. Thanks to rmb82 and xet7.</summary>

Handled Enter events stop at the inline form instead of triggering the enclosing
checklist handler too. A submission guard remains active until the
[server acknowledgement](https://github.com/wekan/wekan/commit/5c9e5045f), and a
failed write leaves the editor available for retry. Unit tests cover overlapping
submissions and failures; browser tests verify one persisted checklist after
click, Enter and Ctrl+Enter, including a page reload. Fixes #6700.

</details>

**Sessions** - directory-scale regression coverage.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/fd41207c5">Verify LDAP session restoration with a large directory</a>. Thanks to Nissulya and xet7.</summary>

The browser regression resumes an LDAP account with 1,600 directory records,
checks reloads before and after a bulk directory deletion, verifies that the
directory is not published to the browser, and rejects an invalid session
cookie. It passes on MongoDB 7.0.16 and with the
[FerretDB oplog fixes](https://github.com/wekan/FerretDB/commit/aa58fe12).
Those fixes preserve cursor checkpoints, drain pending batches without waiting
for another write, seek directly on SQLite, and avoid sorting the whole oplog
for newest-entry reads. They require a newly built FerretDB binary; existing
bundled binaries are unchanged. #6701 remains in TODO Later until the affected
snap's database and the result there are confirmed.

</details>

and has the following developer-tooling fix:

**Regression tests** - preserve reviewed translations and card visibility.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5dd0b11f7">Align historical translation repairs and card visibility guards</a>. Thanks to xet7.</summary>

Historical repair records retain the newer reviewed Traditional Chinese
wording. The read-only requester and assigner guard follows its conditional
branch after optional field grouping changes, while still rejecting missing
avatars. All 1,169 Node suites pass, including translation token, idempotency,
and newer-human-translation protection checks.

</details>

Thanks to above GitHub users for their contributions and translators for their translations.

# v11.83 2026-09-16 WeKan ® release

**In short:** **Custom logos** appear directly on login and board pages, and
site
admins can upload them to Default Storage. Repository mirroring now checks
linked files at their live URLs.

This release adds the following new feature:

**The Admin Panel** - custom logos for login and board pages.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/593cab591">Load custom logos first and upload them to Default Storage</a>. Thanks to xet7.</summary>

The login page and board header wait for the Visibility settings before showing
a logo, so a configured image does not flash the stock WeKan logo first. Site
admins can keep using an image URL or upload a PNG, JPEG, GIF or WebP image
through Admin Panel / Settings / Visibility. Uploaded logos use Default Storage,
and only the currently configured logo is public on the login page. Unit tests
cover accepted and rejected images and public access; the Jade compiler passes.
A Playwright regression test is registered and syntax-checked, but could not
run because no local WeKan server was available.

</details>

and has the following developer-tooling fix:

**Repository mirrors** - linked files use their live sources.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f7da598ad">Stop using archive.org for mirror linked files</a>. Thanks to xet7.</summary>

Repository mirrors now download public issue and comment links only from their
live URLs. Missing links are reported, and transient failures preserve any
existing local files. The mirror linked-file tests cover successful, missing
and failed downloads without a historical fallback.

</details>

Thanks to above GitHub users for their contributions and translators for their translations.

# v11.82 2026-09-16 WeKan ® release

**In short:** Release preparation now checks translation-language metadata
before tagging, so an incomplete language list is caught locally.

This release includes the following developer-tooling fix:

**Developer tooling** - Release-note preflight.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/7489120eb">Check translation language lists before tagging</a>. Thanks to xet7.</summary>

The v11.81 tag was created before release-note validation found missing
language metadata. The prepared v11.81 notes now include the full list
of changed languages, and the local Upcoming preflight rejects a
Translations group without that list. The release-notes command and
focused preflight tests pass.

</details>

Thanks to above GitHub users for their contributions and translators for their translations.

# v11.81 2026-09-16 WeKan ® release

**In short:** Docker images reach Docker Hub and GHCR even while Quay
refuses writes; Quay receives the published manifest when available.
The local Docker build follows the same registry order, and enabled
Admin Panel assetlinks are public at both well-known URLs.
Markdown security settings now apply to viewers; canonical avatar URLs
serve authenticated legacy images. Board View UI regressions are repaired.
Security Problems now use distinct names for CAS account merge,
attachment path, filename and stored MIME refusals.
Tamazight rule, popup, warning and activity text replaces wrong-language
values. Three Arabic common labels now use native Tamazight comment,
link and email-address terms; five popup/copy labels reuse native
control wording. Six shared UI labels reuse native import, invite, unknown,
type, size and restore terms. Admin Panel version labels now use a native
Tamazight noun; its version-check button and failure text use local
check/number terms. Board/card headings and removal actions use native
local components. Rules distinguish states from actions, and deletion warnings
name irreversible effects. Import, PDF, administrator and filename
messages retain their conditions. Tigre help and error drafts replace
English and Tigrinya. The list-width popup states its 200-pixel
whole-number rule. Regression checks preserve placeholders and source
wiring; complete Tamazight grammar remains under native review.
Human Traditional Chinese translations replace 390 older values and
stay protected during machine fills, Transifex pulls and force-pushes.

This release includes the following features and fixes:

**Security** - Distinct Problems names for published advisories.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c4c6e34ec">Align Hall of Fame security names and repair test guards</a>. Thanks to xet7.</summary>

CAS account conflicts, unsafe attachment paths, exploit filenames
and rejected MIME types now appear in Problems under their distinct
Hall of Fame names. The CAS race fix has no denied event to log.
Existing security guards and regression suites remain green;
the complete node run passes 1,152 suites with no failures.

</details>

**Bug fixes** - Docker registry, markdown viewer and avatar routing.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e6685eb0b">Keep Docker publication available during Quay read-only outages</a>. Thanks to xet7.</summary>

Build the multi-arch image once for Docker Hub and GHCR, then
copy its published manifest to Quay. A Quay-wide read-only
outage warns while the available registries stay published;
other refusals still fail. Mocked shell, YAML and Docker guards
pass. Live registry publishing remains a maintainer step.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/25ed0c306">Keep local Docker builds available during Quay outages</a>. Thanks to xet7.</summary>

The local Docker script now publishes to Docker Hub and GHCR before
copying the manifest to Quay. A Quay read-only response no longer fails
the completed primary build; permission errors and primary-build failures
still fail. Mocked outage tests and shell syntax checks pass. Live
publishing remains a maintainer step.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/99570e213">Serve enabled Admin Panel assetlinks publicly</a>. Thanks to xet7.</summary>

Configured assetlinks JSON is served without authentication at
`/well-known/assetlinks.json` and the standard
`/.well-known/assetlinks.json`. Both paths share the setting guard and
default-file fallback. The focused public-route test passes.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/fb66fa95c">Restore markdown security settings and legacy avatar downloads</a>. Thanks to xet7.</summary>

Export the Meteor markdown renderer so the Admin Panel raw-source
and link settings reach card, activity and view titles. Avoid
repeated reactive invalidation during viewer rendering. Keep
canonical avatar URLs on WeKan's guarded current-and-legacy route
instead of Meteor-Files' broad download middleware. Repair browser
flows for visible Board View and list menus, REST Bearer auth,
fixture IDs and post-reload navigation. The complete sequential
EVERYTHING run passes: Chromium 404 cases, Firefox 393 and WebKit 393,
with only the suite's browser-specific skips. All 1,152 node suites,
527 Meteor Mocha cases, import and node E2E checks, four-backend
database conformance, and FerretDB unit, vet and integration pass.

</details>

**Developer tooling** - Board title viewer UI and translation
protection coverage.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3865c3fde">Avoid incomplete escaping in Veps sync test</a>. Thanks to xet7.</summary>

Check the immediate-sync label's final apostrophe directly instead of
using a partial string replacement. All 37 Veps cases pass.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c399aeeee">Protect human Chinese translations from machine fills</a>. Thanks to s8321414 and xet7.</summary>

Pin the 390 superseded values from the Traditional Chinese translation
pull request as negative fixtures. Tests reject reversion to those values
or English, and run the real fill command to prove the human values are
neither offered nor overwritten. Focused Chinese suites pass.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/8acf5d947">Preserve human Chinese translations across pull and push</a>. Thanks to s8321414 and xet7.</summary>

Reject stale machine values during pulls while accepting newer valid
human translations. The force-push helper skips whole-file uploads for
the human-owned `zh-Hant` and `zh-TW` targets, and pulls fail before
overwriting local files if Node is unavailable for the merge. Mocked
pull/push and existing Transifex tests pass; no upload was run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/66c5b85c3">Correct legacy avatar PNG test data</a>. Thanks to xet7.</summary>

Replace the malformed PNG fixture whose image-data checksum Firefox
rejected. The authenticated avatar still returns exact fixture bytes;
the image-decoding check passes in Chromium, Firefox and WebKit.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/929326ba2">Exercise board title viewers through visible controls</a>. Thanks to xet7.</summary>

Open card details through the card link and choose views from
the visible Board View popup. All 24 title-viewer cases pass
sequentially in Chromium across formatted, plain-links and
plain-source security settings.

</details>

**Documentation** - Translation audit resume status.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0e962bba3">Record interrupted translation audit status</a>. Thanks to xet7.</summary>

The original 20,081 flagged findings are fully classified while broader
wrong-language and native-wording review remains open. The dated audit
record and TODO Later status match the committed 22,302 correction
records. Focused audit and translation checks pass.

</details>

**Translations** - Human Traditional Chinese, Tamazight, Tigre and
multilingual list-width repairs.

**Languages updated:** Acehnese, Afrikaans, Akan, Albanian, Amharic, Arabic, Aragonese, Armenian, Aromanian, Assamese, Asturian, Aymara, Azerbaijani, Bambara, Bangla, Bashkir, Basque, Belarusian, Bhojpuri, Bislama, Bosnian, Breton, Bulgarian, Buriat, Burmese, Cantonese, Catalan, Central Kurdish, Cherokee, Chinese, Chuvash, Cornish, Corsican, Croatian, Czech, Danish, Dutch, Dzongkha, English, Esperanto, Estonian, Ewe, Faroese, Fijian, Filipino, Finnish, Flemish, French, Friulian, Fula, Galician, Ganda, Georgian, German, Greek, Guarani, Gujarati, Haitian Creole, Hausa, Hawaiian, Hebrew, Hindi, Hungarian, Icelandic, Igbo, Indonesian, Inuktitut, Irish, Italian, Japanese, Javanese, Kalaallisut, Kannada, Kashmiri, Kashubian, Kazakh, Khmer, Kinyarwanda, Klingon, Konkani, Korean, Kurdish, Kyrgyz, Ladin, Latin, Latvian, Lithuanian, Luxembourgish, Macedonian, Maithili, Malagasy, Malay, Malayalam, Maltese, Manx, Marathi, Mongolian, Moroccan Arabic, Māori, Nahuatl, Neapolitan, Nepali, North Ndebele, Northern Sami, Northern Sotho, Norwegian Bokmål, Nyanja, Occitan, Odia, Oromo, Papiamento, Pashto, Persian, Polish, Portuguese, Punjabi, Quechua, Romanian, Romansh, Rundi, Russian, Samoan, Sardinian, Scottish Gaelic, Serbian, Shona, Sicilian, Silesian, Sindhi, Sinhala, Slovak, Slovenian, Somali, Southern Sotho, Spanish, Standard Moroccan Tamazight, Swahili, Swati, Swedish, Tajik, Tamil, Tatar, Telugu, Thai, Tibetan, Tigre, Tigrinya, Tok Pisin, Tongan, Tsonga, Tswana, Turkish, Turkmen, Ukrainian, Upper Sorbian, Urdu, Uyghur, Uzbek, Valencian, Venda, Veps, Vietnamese, Volapük, Walloon, Waray, Welsh, Western Frisian, Wolaytta, Wolof, Wu Chinese, Xhosa, Yakut, Yiddish, Yoruba, Zulu

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2078c21819">Use human Traditional Chinese translations</a>. Thanks to s8321414 and xet7.</summary>

The merged pull request replaces 252 `zh-Hant` and 138 `zh-TW` values
with Transifex human translations. The focused Chinese checks pass;
machine-fill and pull/push guards now preserve these values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1cf93f7e52">Repair Tamazight card and list URL labels</a>. Thanks to xet7.</summary>

Two Arabic-seeded card/list URL labels use local native link, card and
list terms. Focused source, negative, ledger and 234-locale checks pass;
full compound wording awaits fluent review.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/18a11d121">Repair Tamazight board/card headings and actions</a>. Thanks to xet7.</summary>

My Boards, My Cards, To boards, Close Board and two member-removal
labels replace Arabic/French seeds with native local terms. Focused
source, token, ledger and 234-locale checks pass; the full compounds
still await fluent review.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ff5a286b5">Replace mixed Tamazight version-check messages</a>. Thanks to xet7.</summary>

The Admin Panel's Check Version button and failure text use native
check, version and number terms instead of French/Arabic shorthand.
Focused, ledger and 234-locale checks pass; the complete error clause
awaits fluent grammar review.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/413b4ef40">Use native Tamazight version noun in Admin Panel</a>. Thanks to xet7.</summary>

WeKan, Meteor, MongoDB, FerretDB and Node version labels reuse a
Standard Moroccan Tamazight version noun attested in MediaWiki.
Proper names and MongoDB's compatibility qualifier remain intact.
Focused, ledger and 234-locale checks pass; full compound wording
still needs fluent review.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/63da3d3c9">Reuse native Tamazight shared UI labels</a>. Thanks to xet7.</summary>

Import Board, Invite People, Unknown, Type, Size and Restore replace
Arabic-seeded text with native terms already used in the locale. Focused
source, token, ledger and 234-locale checks pass; remaining native
wording needs fluent review.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e11a2654c">Align Tamazight popup and copy-link labels</a>. Thanks to xet7.</summary>

Member Settings, Move Card, Leave Board, Remove Member and Copy Link
use the native wording already shown by related controls. Focused,
source-wiring, ledger and 234-locale checks pass; fluent phrase review
continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2b22dd0be">Replace Arabic Tamazight common UI labels</a>. Thanks to xet7.</summary>

Comments and Link reuse terms already present in local card and search
text. Email Addresses uses the plural attested in an IRCAM glossary
with the local email noun. The focused, correction-ledger and
234-locale structural checks pass; full native wording review continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/79e5a93b4">Repair Tamazight common popup titles</a>. Thanks to xet7.</summary>

Replace 13 Arabic popup titles with native local board,
card, label and member-setting terms. Focused, ledger and
all-locale checks pass; full phrase grammar needs fluent review.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f0ceb8d72">Separate translated removal actions from Unset status</a>. Thanks to xet7.</summary>

Color and image removal buttons use existing translated
action keys; setting-status displays keep Unset. Tamazight's
Arabic Unset becomes native not-set prose. Source, Jade,
ledger, inventory and focused Chromium UI checks pass.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/87c049571">Repair Tamazight board and color popups</a>. Thanks to xet7.</summary>

Replace eight Arabic board, visibility, watch and color popup
labels with local native terms. Rename-board and choose-color
labels reuse exact existing values. Full command grammar
remains under fluent review; focused, ledger and inventory
checks pass.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/79d58098f">Repair Tamazight board background controls</a>. Thanks to xet7.</summary>

Replace nine Arabic board color/image controls and popup
titles with local native terms. The popup names the board
backdrop rather than the screen; technical URL remains.
Compound grammar remains under fluent review; focused,
ledger and inventory checks pass.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ada7e3533">Repair Tamazight activity messages</a>. Thanks to xet7.</summary>

Replace nine Arabic/French activity and show/notify messages
with native terms aligned to their production UI meanings.
Preserve all `%s` tokens. Full clause grammar remains under
fluent review; focused, ledger and inventory checks pass.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f10daf2ae">Repair Tamazight admin status labels</a>. Thanks to xet7.</summary>

Replace four Arabic/French active, inactive and status labels
with local native terms. Agreement and compound grammar remain
under fluent review; focused, ledger and inventory checks pass.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/65c667419">Repair Tamazight filter and sort controls</a>. Thanks to xet7.</summary>

Replace three French/Arabic controls with local native hide,
filter and sort terms. Full sentence grammar remains under
fluent review; focused, ledger and inventory checks pass.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/bea96680e">Repair Tamazight creator labels</a>. Thanks to xet7.</summary>

Replace mixed French/Arabic and Arabic creator labels in filter
and minicard settings with local native terms. Complete phrase
grammar remains under fluent review; focused, ledger and inventory
checks pass.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/32c2d9575">Repair Tamazight search predicates</a>. Thanks to xet7.</summary>

Replace 15 French/Arabic operator and predicate seeds with native
short terms or portable one-word syntax codes. Exact fill exceptions
protect the codes and leave prose fillable. Status nuance and two
existing multiword operators remain under review; focused, ledger
and inventory checks pass.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c365e2cf6">Repair Tamazight search operators</a>. Thanks to xet7.</summary>

Replace Arabic and French operator names with native search terms.
Keep the short aliases portable and collision-free. Focused parser,
ledger and inventory checks pass; the swimlane term needs native review.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d1c4a7290">Repair Tamazight board and missing labels</a>. Thanks to xet7.</summary>

Replace six Arabic and French board, page, list and swimlane labels
with native terms; keep named-item `%s` tokens. Full clause grammar
needs fluent review. Focused, ledger and inventory checks pass.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e114ffde8">Repair Tamazight sky, gold and silver labels</a>. Thanks to xet7.</summary>

Replace French and Arabic color seeds with native terms for sky,
gold and silver. Metal nouns as CSS color names need fluent review;
focused, ledger and inventory checks pass.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/06678678d">Repair Tamazight color labels</a>. Thanks to xet7.</summary>

Replace French pink with IRCAM's native color word and Arabic
dark-green with native components. The full dark-green compound
needs fluent review; focused, ledger and inventory checks pass.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ce5092966">Use native Tamazight email-address label</a>. Thanks to xet7.</summary>

Replace French in the member-search placeholder with an attested
Tamazight address-and-email phrase. Focused, ledger and inventory
checks pass; the separate Arabic plural placeholder remains under review.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/6f14c9a8c">Repair Tigre slate-blue wording</a>. Thanks to xet7.</summary>

Replace its copied Tigrinya blue word with a corpus-glossed Tigre term.
Keep independently attested red and black labels despite their shared
spelling. The slate compound needs fluent review; focused, ledger and
inventory checks pass.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/de0cc0ce4">Repair copied Tigre dark-green label</a>. Thanks to xet7.</summary>

Use Tigre corpus terms for dark and green in the color label.
The copied Tigrinya value is gone; the complete compound still
needs fluent review. Focused and ledger checks pass.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ae76ba79d">Use corpus Tigre noun for DDP transport</a>. Thanks to xet7.</summary>

Replace the Tigrinya-copied transport noun in the Tigre DDP label
with a corpus-glossed Tigre term. Keep the literal DDP identifier.
Focused, runtime, ledger and inventory checks pass; the complete
phrase remains under native review.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/31a238d91">Correct Cherokee and Wolaytta list-width bounds</a>. Thanks to xet7.</summary>

The final two obsolete error messages now use the inclusive
200-pixel minimum, and Wolaytta's width label drops its English
seed. Focused, runtime, ledger and inventory checks pass; exact
technical and complete native clauses remain under review.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/21319c523">Replace corrupt Tsonga list-width seeds</a>. Thanks to xet7.</summary>

Replace repeated `mhaka` seeds in the Xitsonga width label and
error with local list, width and whole-number terms and the
inclusive 200-pixel bound. Focused, runtime, ledger and inventory
checks pass; the complete clause remains under native review.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/83c8d0c2b">Repair Aymara and Quechua list-width strings</a>. Thanks to xet7.</summary>

Replace Spanish/English-seeded width labels and errors with native
list and whole-number terms and the inclusive 200-pixel rule.
Focused, runtime, ledger and inventory checks pass; full clauses
and Quechua dialect fit remain under native review.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c18780d5b">Correct three more native list-width bounds</a>. Thanks to xet7.</summary>

Hawaiian, Klingon and Inuktitut list-width errors now show the
inclusive 200-pixel minimum. Focused, runtime, ledger and inventory
checks pass; full clauses remain under native grammar review.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/bb2d2dfeb">Correct three native list-width minimum messages</a>. Thanks to xet7.</summary>

Nahuatl, Volapük and Tamazight now describe the inclusive 200-pixel
minimum in their list-width errors. Focused, Nahuatl progress,
runtime, ledger and inventory checks pass; complete clauses remain
under native grammar review.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/beddec7cb">Repair Serbian list-width controls and four locale rules</a>. Thanks to xet7.</summary>

Use “листа” consistently across the Serbian list-width popup,
notes, toggles and error. Correct the obsolete threshold in
Venetian, Veps, Twi and Tongan. Focused UI-string, Serbian runtime,
ledger and inventory checks pass; four complete regional clauses
remain under native grammar review.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3eaeac9e7">Repair ten wrong-language and obsolete list-width values</a>. Thanks to xet7.</summary>

Replace ten obsolete greater-than-270 messages with inclusive 200-pixel
whole-number wording, including Turkish, Czech and English-seeded
requirements. Focused, Tatar runtime, Greenlandic progress, ledger
and inventory checks pass; complete clauses remain under native
grammar review.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/92ea2a0f0">Repair ten native list-width minimum values</a>. Thanks to xet7.</summary>

Update ten locale messages to express an inclusive 200-pixel whole-number
minimum; replace Urdu's transliterated English requirement with Urdu
prose. Older Ewe and Chuvash suites now check the current rule. Focused,
runtime, ledger and inventory checks pass; seven complete clauses
remain under native grammar review.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9c1388a49">Repair ten native and mixed-seed list-width values</a>. Thanks to xet7.</summary>

Replace obsolete greater-than-270 messages with inclusive 200-pixel
whole-number wording in ten locale files, including English-seeded
requirements. The Maithili progress suite now tests the current rule.
Focused, runtime, ledger and inventory checks pass; eight complete
clauses remain under native grammar review.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3bf6a4c82">Repair nine African and Pacific list-width values</a>. Thanks to xet7.</summary>

Update nine locale messages to express an inclusive 200-pixel whole-number
minimum. Three older progress suites now check the current rule. Focused,
runtime, ledger and inventory checks pass; four complete clauses remain
under native grammar review.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/74e6deabe">Repair twelve African, Kurdish and Yiddish list-width values</a>. Thanks to xet7.</summary>

Replace obsolete greater-than-270 messages with inclusive 200-pixel
whole-number wording in 12 locale files. Four older progress suites now
check the current rule. Focused, runtime, ledger and locale inventory
checks pass; Central Kurdish and Yiddish complete clauses remain under
native grammar review.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/8cc659ac9">Repair 24 Asian list-width values</a>. Thanks to xet7.</summary>

Correct native-script messages to express a whole-number width of at
least 200 pixels. Update seven progress suites that expected the old
270 rule. Focused, language, ledger and inventory checks pass; eight
complete clauses remain under native grammar review.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0fe4ecb48">Repair 20 Romance and Celtic list-width values</a>. Thanks to xet7.</summary>

Replace obsolete list-width wording in 20 locales with an inclusive
200-pixel integer rule. Correct Italian and English seeded clauses
where present, and update Aragonese and Cornish regression checks.
Focused, language, ledger and inventory checks pass. Ten full clauses
remain under native grammar review.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/6d94f4edb">Repair 28 list-width locale values</a>. Thanks to xet7.</summary>

Correct the inclusive 200-pixel integer rule in 28 more locales,
including English-seeded Maltese. Update Kazakh, Kyrgyz, Tajik and
Latvian regression assertions to verify current values and ledger
integrity. Focused, language, inventory and ledger checks pass;
four full clauses remain under native grammar review.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0b0349d34">Repair eleven Chinese-variant list-width values</a>. Thanks to xet7.</summary>

Correct six Simplified Mandarin and three Traditional Chinese values.
Wu and Cantonese replace Mandarin-seeded text with dialect terms while
stating the same inclusive 200-pixel integer rule; full dialect phrasing
remains under native review. Variant, runtime, ledger and inventory
checks pass, with remaining locales recorded in the audit.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/212a46c07">Repair 33 native list-width translations</a>. Thanks to xet7.</summary>

Correct grouped Azerbaijani, Catalan, Uzbek Latin, Greek, Welsh,
Romanian, Slovenian, Vietnamese, Afrikaans, Frisian, Galician, Hindi,
Malay, Bosnian/Croatian and Khmer values to state the whole-number
minimum of 200 pixels. Align the Galician archive-help regression check
with the current All Boards control. Focused, ledger and related-language
checks pass; remaining locales are tracked in the audit.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d6e6c558d">Repair 22 multilingual list-width translations</a>. Thanks to xet7.</summary>

Correct Arabic, Hebrew, Russian, Ukrainian, Japanese, Korean, Polish,
Czech and Dutch messages to state the inclusive 200-pixel whole-number
minimum. The Russian regional alias shares its tracked translation file.
Focused, runtime, ledger and inventory checks pass; remaining locales
are tracked in the audit.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e6895b3de">Repair 23 list-width translations</a>. Thanks to xet7.</summary>

Correct German, Spanish, French, Italian and Portuguese variants to state
the whole-number minimum of 200 pixels. Keep native width terminology
and regional style. Focused, related-language, ledger and inventory checks
pass; remaining stale locales are tracked in the audit.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/196bc49df">Repair Persian-digit list-width translations</a>. Thanks to xet7.</summary>

Correct Persian, Persian (Iran) and Uzbek Arabic messages from the obsolete
270 threshold to a whole-number minimum of 200 pixels. Keep native numerals
and established local words. Focused, runtime and ledger checks pass;
Uzbek Arabic sentence order remains under native review.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/68d679c6c">Correct list-width rule and first locale messages</a>. Thanks to xet7.</summary>

The Set Width popup now advertises the shared 200-pixel minimum and rejects
fractional or trailing-text values instead of truncating them. Correct the
English source, its 11 regional copies and Tigre wording. Boundary, UI
wiring, locale and ledger checks pass; other stale locales remain in audit.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/6909fb85e">Repair Tigre Trello key and S3 File plural</a>. Thanks to xet7.</summary>

Use a Tigre corpus key noun across seven Trello credential messages,
including the prompt for both values. Restore the corpus-attested File
plural in S3 bucket help. All 50 Tigre suites pass; complete Trello
compounds remain under native review.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/78f2c9bf7">Repair Tigre PDF preview warning</a>. Thanks to xet7.</summary>

Replace a long Tigrinya copy with Tigre phrasebook terms for preview,
device and trying a download instead. The complete sentence remains
under native review. Source, UI wiring, ledger and runtime checks pass.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/36c2148ec">Repair Tigre authentication error</a>. Thanks to xet7.</summary>

Replace a long clause copied from Tigrinya using Tigre phrasebook forms
for “wrong”, “please” and “try again”. The authentication-code compound
remains under native review. Source, seed, ledger and runtime checks pass.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/970d9e664">Fill Tigre S3 settings translations</a>. Thanks to xet7.</summary>

Fill 21 English placeholders for storage, connection, keys and endpoint
help with established Tigre vocabulary. Keep service names and example
hostnames literal. Focused meaning and ledger checks pass; full compound
grammar remains under native review.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/780a75a2b">Repair Tamazight due-reminder activity</a>. Thanks to xet7.</summary>

Replace a French activity phrase with Tamazight while keeping its three
runtime placeholders. A focused test verifies selector wiring, source
meaning and interpolation. Reminder terminology is sourced from IRCAM;
the plural phrase awaits native review.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4e8f1b7dd">Repair Tamazight checklist trigger state labels</a>. Thanks to xet7.</summary>

Replace French checked/unchecked labels with Tamazight state phrases,
keeping them distinct from imperative checklist actions. Regression checks
cover exact values, negative wrong-language checks and template wiring.
Correction, retained-review and completeness suites also pass. Checkbox
terminology and complete trigger grammar remain under native review.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/7c6688b63">Repair Tamazight card movement and creation rule labels</a>. Thanks to xet7.</summary>

Replace French move-card and create-new-card action labels using existing
Tamazight terminology and IRCAM lexical evidence. Preserve destination
and new-card meaning. Four focused suites pass; full contextual grammar
remains under review. Audit records both additional unflagged repairs.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/53fba5240">Repair Tamazight Planning Poker deletion warning</a>. Thanks to xet7.</summary>

Replace French deletion warning while preserving irreversibility and loss
of all associated actions. Reuse related Tamazight warning constructions.
Four focused suites pass for warning scope, negative wrong-language checks,
template wiring and translation structure. Complete contextual grammar
remains under native review. Dated audit records the remaining 185 findings.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4f07f43d8">Repair Tamazight label deletion warning</a>. Thanks to xet7.</summary>

Replace Arabic warning while preserving no undo, label removal from all
cards and deletion of its history. Four focused suites pass for warning
scope, negative Arabic checks, popup wiring and translation structure.
Complete contextual grammar remains under native review. Dated audit
records 184 original findings still pending.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/260258983">Repair Tamazight keyboard shortcut status labels</a>. Thanks to xet7.</summary>

Replace Arabic shortcut heading and status messages, retaining current
activation state and the opposite click action. Four focused suites pass
for heading consistency, action direction, negative Arabic checks, template
conditional wiring and translation structure. Full contextual grammar
remains under native review. Dated audit records 182 pending findings.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9680e2393">Repair Tamazight PDF preview warning</a>. Thanks to xet7.</summary>

Replace Arabic warning, preserving device inability to preview PDF and
trying a download instead. Four focused suites pass for warning meaning,
negative Arabic checks and translation structure. Full contextual grammar
remains under native review. Dated audit records 181 pending findings.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/14af25915">Repair Tamazight last administrator warning</a>. Thanks to xet7.</summary>

Replace Arabic's incorrect permission explanation with the requirement to
retain at least one administrator. Four focused suites pass for role-change
negation, minimum administrator count, negative Arabic checks, template
wiring and translation structure. Full contextual grammar remains under
native review. Dated audit records 180 pending findings.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/40f06e1d8">Repair Tamazight import error guidance</a>. Thanks to xet7.</summary>

Replace French guidance, retaining possible import success despite errors
and the translated All Boards page location. Four focused suites pass for
conditional wording, possible success, page naming, negative French checks,
template wiring and translation structure. Complete contextual grammar
remains under native review. Dated audit records 179 pending findings.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/45d2b2b2e">Repair Tamazight watching label and disabled warning</a>. Thanks to xet7.</summary>

Replace Arabic/French watch text using monitoring terminology. Preserve
administrator action and both board and card scope. Four focused suites
pass for wording, negative wrong-language checks, source error wiring and
translation structure. Full contextual grammar remains under native review.
Dated audit records 178 pending findings.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/35f74fd04">Repair Tamazight case-insensitive search guidance</a>. Thanks to xet7.</summary>

Replace French search help, retaining case-insensitive text matching and
using A/a to clarify letter case. Four focused suites pass for negation,
letter forms, negative French checks and translation structure. Complete
computing terminology and contextual grammar remain under native review.
Dated audit records 177 pending findings.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/327a35b82">Repair Tamazight invalid filename warning</a>. Thanks to xet7.</summary>

Replace Arabic warning, preserving invalid filename condition and cancelled
upload or renaming. Four focused suites pass for operation scope, negative
wrong-language checks and translation structure. Full contextual grammar
remains under native review. Dated audit records 176 pending findings.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4a2821835">Repair Tamazight import member mapping label</a>. Thanks to xet7.</summary>

Replace French mapping-review label using the attested check verb, distinct
from the similar spelling for light. Four focused suites pass for exact
wording, negative wrong-language checks and translation structure. Mapping
compound remains under native review. Dated audit records 175 pending
findings and the need to recheck older checklist compounds.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5434775ba">Repair Tamazight checklist verification terminology</a>. Thanks to xet7.</summary>

Revise 49 prior checklist compounds with an attested verification noun,
preserving surrounding prose and placeholders. Four focused suites pass
for exact repairs, rejection of the old compound and translation structure.
Full software compound and contextual grammar remain under native review.
Dated audit retains 175 pending original findings.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/cc2b110ba">Repair Tamazight CSV and TSV import guidance</a>. Thanks to xet7.</summary>

Replace French import guidance with paste, values and separator wording,
keeping CSV and TSV literal. Four focused translation suites pass.
Computing adaptations, passive grammar and borrowed Tab terminology
remain under native review. Dated audit records 174 pending findings.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/8362a8a2e">Repair Tamazight custom head-tag activation label</a>. Thanks to xet7.</summary>

Replace French activation text with Tamazight, keeping HTML head scope
explicit. Four focused translation suites pass. Borrowed technical wording
and full compound remain under native review. Audit records 173 pending
findings.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/7c1c4623d">Repair Tamazight custom web-manifest labels</a>. Thanks to xet7.</summary>

Replace two French settings labels with Tamazight activate/content wording,
preserving web-manifest identity and JSON format. Four focused translation
suites pass. Borrowed compounds remain under native review. Dated audit
records 171 pending findings.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9baa8f69d">Repair Tamazight legal-notice labels</a>. Thanks to xet7.</summary>

Replace French custom-link and Arabic legal-notice wording, preserving URL
and custom page scope. Four focused translation suites pass. Derived
agreement and full legal-notice compound remain under native review.
Dated audit records 170 pending original findings.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3ce7ed2a0">Repair Tamazight due-card empty states</a>. Thanks to xet7.</summary>

Replace three French empty-state values, retaining the due-date condition,
possession and current-time qualifier where applicable. Four focused
translation suites pass. Passive agreement and due-date terminology remain
under native review. Dated audit records 168 pending original findings.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d0bf77715">Repair Tamazight automatic board-watching instruction</a>. Thanks to xet7.</summary>

Replace Arabic legacy instruction, preserving automatic watching when
boards are created. Four focused translation suites pass. Conditional
and passive agreement remain under native review; no active caller found.
Dated audit records 167 pending original findings.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/897c89740">Repair Tamazight card-export people label</a>. Thanks to xet7.</summary>

Replace French export-field wording, preserving all four roles and their
order. Four focused translation suites pass. Computing ownership and
assignee phrasing remain under native review. Dated audit records 166
pending original findings.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5f41f83ca">Repair Tamazight mobile and desktop mode labels</a>. Thanks to xet7.</summary>

Replace three French labels, keeping both modes and switching between
them explicit. Four focused translation suites pass. Borrowed identifiers
and mode adaptation remain under native review. Dated audit records 165
pending original findings.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d90707d5d">Repair Tamazight blank rule-field instruction</a>. Thanks to xet7.</summary>

Replace Arabic instruction, preserving empty fields matching every possible
value. Native computing messages support matching terminology. Four
focused translation suites pass. Derived noun and full grammar remain
under native review. Dated audit records 164 pending original findings.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ecbe3856d">Repair Tamazight permanent-attachment warning</a>. Thanks to xet7.</summary>

Replace Arabic legacy warning with added-file wording, permanence and
no undo. Four focused translation suites pass. Active soft-delete message
remains separate. Adverbial and passive grammar remain under native review.
Dated audit records 163 pending original findings.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/efdf49b29">Repair Tamazight linked-card deletion warning</a>. Thanks to xet7.</summary>

Replace French dependency fragment, retaining deletion order and diagnostic
continuation. Four focused translation suites pass. Full subordinate
clause and linked participle remain under native review. Dated audit
records 162 pending original findings.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/18e197947">Repair Tamazight list linked-card deletion warning</a>. Thanks to xet7.</summary>

Replace French dependency warning, retaining linked cards connected to
cards in this list and deletion order. Four focused translation suites
pass. Relative/plural grammar and connection paraphrase remain under
native review. Dated audit records 161 pending original findings.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/27dbc30c2">Repair Tamazight private-page login guidance</a>. Thanks to xet7.</summary>

Replace Arabic guidance, keeping both uncertainty clauses and the login
link placeholder. Four focused translation suites pass. Derived adjective
and conditional grammar remain under native review. Dated audit records
160 pending original findings.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/047c860ea">Repair Tamazight clipboard-image gesture instruction</a>. Thanks to xet7.</summary>

Replace French fragment, keeping paste or drag-and-drop an image file and
image-only restriction. Four focused translation suites pass. Computing
gesture adaptations and full grammar remain under native review. Dated
audit records 159 pending original findings.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1a174e357">Repair Dzongkha tabular Hijri epoch labels</a>. Thanks to xet7.</summary>

Replace two English seeds with native tabular terminology and distinct
Julian starting dates. Four focused translation suites pass. Starting-date
compound remains under native review. Dated audit records 157 pending
original findings; broader Dzongkha review remains open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/103457ada">Repair Tamazight Saudi sighting-calendar label</a>. Thanks to xet7.</summary>

Replace country-only English seed with calendar and moon-sighting wording.
Four focused translation suites pass. Full sighting-calendar compound
remains under native review. Dated audit records 156 pending original
findings.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3fd9413b3">Repair Tamazight member-removal confirmation</a>. Thanks to xet7.</summary>

Replace Arabic confirmation, preserving named tokens, member removal from
all cards on the board and notification. Four focused translation suites
pass. Notification/passive and full grammar remain under native review.
Dated audit records 155 pending original findings.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0f393c5c8f">Repair Tamazight list-deletion warning</a></summary>

Replace French text with Tamazight wording preserving activity removal,
list recovery and no-undo semantics. Four focused suites pass. Full grammar
and the English warning's conflict with soft removal remain under review.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3da9c1f4e">Repair Tamazight card-owner export heading</a></summary>

Replace an unflagged French heading with the card-owner compound already
used in export-field descriptions. Four focused suites pass; software
compound and gender-neutral wording remain under contextual review.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/11fc595a0">Repair Tamazight SMTP labels and test-email subject</a></summary>

Replace unflagged Arabic and French strings with existing Tamazight TLS
and test-email wording, preserving protocol identifiers. Four focused
suites pass; complete contextual phrasing remains under review.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e1c372071">Repair Tamazight SMTP port wording</a></summary>

Replace Arabic and French port strings with a borrowed network term and
Tamazight outgoing-email description. Preserve your SMTP server's use of
this port. Four focused suites pass; contextual grammar review remains open.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b0ad9320f">Repair Tamazight desktop drag-handle label</a></summary>

Replace French text with Tamazight show, handle and drag wording, retaining
Desktop as a borrowed mode identifier. Four focused suites pass; derived
action noun and full contextual compound remain under review.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/66f2a8fee">Repair Tamazight search date-filter instructions</a></summary>

Replace French created and modified hints with recent-day wording,
preserving distinct operators and literal examples. Four focused suites
pass; complete passive and temporal grammar remain under review.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/64e524f27">Repair Tamazight due-date search instruction</a></summary>

Replace French prose, preserving numeric and overdue examples and literal
operators. Four focused suites pass. Temporal grammar and the numeric
cutoff's discrepancy with the English instruction remain under review.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e908ec0a2">Repair Tamazight locked-users navigation label</a></summary>

Replace an unflagged French label with the plural locked-user wording
already used in its description. Four focused suites pass; existing
passive participle grammar remains under contextual review.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/bf9a929e1">Repair Tamazight failed-attempts label</a></summary>

Replace unflagged French text with trial and failure terminology. Four
focused suites pass. Software attempt adaptation and complete phrase
remain low confidence and open to contextual improvement.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/7c58d6c3d">Repair Tamazight account-protection settings wording</a></summary>

Replace French heading and update confirmation with Tamazight prose,
retaining brute force as a technical loan. Four focused suites pass;
complete compound and passive plural remain under contextual review.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5211bf315">Repair Tamazight account-protection explanation</a></summary>

Replace French text with a Tamazight paraphrase preserving login-attempt
protection and brute-force attacks. Four focused suites pass; complete
nominal grammar and software attempt terminology remain under review.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0567c1aac">Repair Tamazight total and used heap-size labels</a></summary>

Replace French diagnostics with distinct Tamazight wording for total and
used heap size. Four focused suites pass; computing metaphor and full
label grammar remain under contextual review.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/88add3006">Repair Tamazight heap-size-limit label</a></summary>

Replace French text with abstract-limit wording, preserving the distinction
from total and used heap size. Four focused suites pass; computing metaphor
and full nominal chain remain under contextual review.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/6481e8bbd">Repair Tamazight malloc-memory diagnostic labels</a></summary>

Replace French memory and peak labels with concise Tamazight wording,
preserving malloc and maximum distinctions. Four focused suites pass;
allocation paraphrase and complete computing phrases remain under review.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0f545fd8a">Repair Tamazight available and executable heap labels</a></summary>

Replace French diagnostics with distinct availability and execution
paraphrases. Four focused suites pass; availability participle, executable
capability and full computing compounds remain under contextual review.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/8516ab9a7">Repair Tamazight garbage-flag diagnostic label</a></summary>

Replace French text with Tamazight heap/use wording, preserving the exact
diagnostic flag identifier. Four focused suites pass; complete computing
compound remains under contextual review.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0f4fc5d22">Repair Tamazight V8 context-count labels</a></summary>

Replace French count/context prose with Tamazight, retaining native and
detached as distinct technical qualifiers. Four focused suites pass;
complete computing compounds and loan localization remain under review.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0b259c2d3">Repair Tamazight physical heap-size label</a></summary>

Replace the final French heap diagnostic label with Tamazight wording.
Four focused suites pass; computing physical-memory sense and complete
phrase grammar remain low confidence and under review.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ec1f2cb21">Repair Tamazight top-left logo URL labels</a></summary>

Replace French image and link labels using existing Tamazight logo patterns,
preserving the two URL meanings. Four focused suites pass; full spatial
chain and computing compounds remain under contextual review.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/8d9facf9a">Repair Tamazight logo height and navigation wording</a></summary>

Replace French and Arabic logo labels, preserving hide, board-page return
and default height 27. Four focused suites pass; spatial chain, default
terminology and possessive grammar remain under contextual review.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ac95ce3aa">Repair Tamazight JSON-schema error</a></summary>

Replace French prose while preserving generic information and format
validation meaning. Four focused suites pass; technical format loan and
complete participle/possessive grammar remain under contextual review.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/52b73cacc">Repair Tamazight CSV and TSV schema warning</a></summary>

Replace Arabic prose, preserving comma and Tab-separated-value explanations
and information/format meaning. Four focused suites pass; full grammatical
phrasing and technical loans remain under contextual review.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a6d77ba0e">Fix Tamazight first due-reminder activity translation</a></summary>

Replace French wording with a Tamazight draft preserving named activity
placeholders. Four focused checks pass. Full deadline compound and grammar
remain low confidence; the source also uses this message for initial due-date
assignment. Dated translation audit records that discrepancy and open review.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/06be23201">Fix Tamazight actual used-memory diagnostic wording</a></summary>

Replace French wording with a Tamazight draft. Four focused checks pass.
The displayed field is V8 heapUsed; full terminology and grammar remain
under review. Record dated evidence and remaining repairs in the audit.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ef5a6c5ba">Fix Tamazight resident-memory diagnostic label</a></summary>

Replace French with Tamazight memory-usage and size wording, retaining the
precise RSS acronym. Four focused checks pass. Full computing grammar and
native expansion of resident set remain in the dated translation audit.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f10fe2fa5">Fix Veps automatic URL scheme setting translation</a></summary>

Replace Finnish instructions with a Veps draft retaining automatic
clickability and one scheme per line. Four focused test files pass.
Assembled grammar remains low confidence in the dated translation audit.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/29bf7aa22">Fix unflagged Finnish rules heading in Veps translation</a></summary>

Use the native Veps rules plural. Four focused test files pass. The dated
audit records additional mixed-language rule and 2FA values for repair.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3658f1755">Fix Tshivenda rule-state text in Veps translations</a></summary>

Replace two wrong-language rule messages with Veps drafts while preserving
both toggle actions and the existing enabled label. Four focused test files
pass. Full assembled grammar remains under review in the dated audit.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/93a48d724">Fix five wrong-language Veps synchronization labels</a></summary>

Reuse existing Veps wording while preserving literal project and credential
examples. Four focused test files pass. Remaining synchronization messages
and full grammar review stay open in the dated translation audit.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c379de7d7">Fix six Veps synchronization state and result translations</a></summary>

Replace wrong-language states/results with Veps drafts, preserving distinct
pending/success/error states and exact error placeholder. Four focused test
files pass. Derived grammar remains open in the dated translation audit.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0ca3422a4">Fix wrong-language Veps synchronization source label</a></summary>

Use the directly attested native source noun. Four focused test files pass.
The dated audit retains remaining synchronization and optional-field repairs.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5d0583ef5">Fix Veps optional-field and synchronization username wording</a></summary>

Replace wrong-language wording while preserving the optional qualifier.
Four focused test files pass. Full contextual grammar remains under review
in the dated translation audit.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c117936ed">Fix Veps synchronization credential labels and status messages</a></summary>

Replace wrong-language credential wording with Veps drafts, retaining set
and not-set-yet states. Four focused test files pass. Full status grammar
and credential paraphrase remain under review in the dated audit.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/81c17c196">Fix Veps never-synced state with native adverb</a></summary>

Use the directly attested native never adverb, keeping it distinct from
failed synchronization. Four focused test files pass. Remaining wording
repairs stay open in the dated translation audit.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b30fa05a9">Fix Veps inactive synchronization source label.</a></summary>

Replace wrong-language text in the empty synchronization source option.
Preserve its distinction from enabled, failed and never-synced states.
Derived terminology and complete grammar remain low confidence.
Four focused test files pass (25 checks); no live synchronization UI ran.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/25e6eefba">Replace wrong-language Veps synchronization instructions.</a></summary>

Preserve the external tracker, background 15-minute checking interval,
and immediate manual synchronization action. Complete draft grammar and
computing terminology remain low confidence and under review.
Four focused files pass (26 checks); no live synchronization UI ran.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/29f93a888">Fix Veps multi-tracker project identifier label.</a></summary>

Replace wrong-language project-key text with a project-code paraphrase
covering IDs and owner/repo paths accepted by tracker integrations.
Complete native terminology remains low confidence and under review.
Four focused files pass (27 checks); no live synchronization UI ran.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/7deff5697">Replace wrong-language Veps two-factor controls.</a></summary>

Preserve enable and disable actions, popup title and account-specific
status. Complete draft terminology and grammar remain low confidence;
setup instructions are still under translation review.
Four focused files pass (28 checks); no live authentication UI ran.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f9d9c454d">Replace wrong-language Veps two-factor setup and login text.</a></summary>

Preserve QR and manual setup alternatives, six-digit codes, the code
requirement at every login and invalid-code retry. Complete draft grammar
and computing compounds remain low confidence and under review.
Four focused files pass (29 checks); no live authentication UI ran.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e722a6c17">Improve Veps synchronization title and software-key wording.</a></summary>

Replace the overlooked wrong-language popup title and use native software
sort-key evidence for project-key wording. Retain ID/path alternatives.
Complete compound grammar remains low confidence and under review.
Four focused files pass (30 checks); no live synchronization UI ran.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4b2009229">Fix Veps voting and event detail labels.</a></summary>

Replace wrong-language vote sorting, voting heading and event details.
Preserve sorting and detail meanings. Complete terminology and case
remain under review; four focused files pass (31 checks).
No live voting or event UI ran.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f5d72bae8">Replace wrong-language Veps repair and restore messages.</a></summary>

Preserve result counters, missing-board explanation and automatic-repair
limits. Complete count and case grammar remains low confidence.
Four focused files pass (32 checks); no live repair UI ran.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/201f8d0a4">Replace wrong-language Veps chart forecast messages.</a></summary>

Preserve completed and missing-velocity states, weekly pace and conditional
completion date. Full projection and count grammar remains under review.
Four focused files pass (33 checks); no live chart UI ran.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e8826e71a">Replace wrong-language Veps loading and migration status.</a></summary>

Preserve active/inactive work and possible login delays until completion
and lower CPU load. Complete draft grammar and terms remain under review.
Four focused files pass (34 checks); no live status/login UI ran.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9e0680331">Replace wrong-language Veps CPU usage and load labels.</a></summary>

Preserve current versus generic CPU usage and average-load distinction.
Full computing terminology remains under review. Four focused files
pass (35 checks); no live CPU UI ran.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/bc8988c9d">Replace wrong-language Veps problem acknowledgment text.</a></summary>

Preserve reviewed-area selection and resetting new-problem counts.
Complete acknowledgment terminology and grammar remain under review.
Four focused files pass (36 checks); no live acknowledgment UI ran.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/cfed82e70">Replace wrong-language Veps backup scope text.</a></summary>

Preserve organization attachments, shared accounts/settings exclusions
and restore ownership restrictions. Whole-instance paraphrase and full
grammar remain under review. Four focused files pass (37 checks).
No live backup UI ran.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/91d0cbf5e">Replace wrong-language Veps event severity label.</a></summary>

Use verified native noun forms in a severity-level draft. Complete
technical terminology remains low confidence and under review.
Four focused files pass (38 checks); no live event UI ran.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/046830b35">Replace wrong-language Veps list date range description.</a></summary>

Preserve custom date fields marked for list top using a native interval
noun. Full draft grammar remains under review. Four focused files pass
(39 checks); no live date-range UI ran.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/7c17acd34">Replace wrong-language Veps numeric total description.</a></summary>

Use an attested native phrase for addition of numbers and preserve custom
number fields marked for list top. Surrounding grammar remains under review.
Four focused files pass (40 checks); no live tooltip UI ran.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/21e43e8b5">Replace wrong-language Veps card-number search text.</a></summary>

Use existing Veps card, number and identifier terminology while preserving
search placeholders and literal examples. Four focused files pass (40 checks).
The complete relative-clause grammar remains under review, and the expanded
Veps wrong-language candidate scan remains active.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/052937ff0">Repair Veps Problems-page headings.</a></summary>

Replace Tshivenda Summary with an attested native Veps heading and Finnish
Status with the locale's existing Veps status label. Four focused files pass
(40 checks); the expanded Veps candidate review remains active.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/8a66f4c74">Repair Veps voting-side labels.</a></summary>

Replace four Finnish participant and action labels using rendered native Veps
voting, defense and opposition references. Four focused files pass (40 checks).
Derived participant wording remains under native review.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/8480bee00">Repair Veps card-loading translations.</a></summary>

Replace two Tshivenda labels, obsolete/manual loading wording and a Russian
multi-select hybrid. The Veps description now matches automatic above-threshold
loading and preserves exact operator configuration literals. Four focused files
pass (40 checks). Full technical grammar remains under native review.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/09b62ffa4">Repair Veps accessibility translations.</a></summary>

Replace five Finnish labels and messages with one consistent Veps “access for
everyone” family across navigation, settings fields and the public empty state.
Four focused files pass (40 checks). The descriptive term remains under native
review because no dedicated accessibility noun was found.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1b35cd8b4">Repair Veps numeric-field sum control.</a></summary>

Replace the Finnish checkbox label with the dictionary-attested arithmetic
addition and established list-top terminology used by its numeric-total tooltip.
Four focused files pass (40 checks). Full compound grammar remains under native
review.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b82d5761e">Repair Veps vertical-scrollbar control.</a></summary>

Replace the Finnish toggle label with a Veps draft that preserves vertical
scrollbar visibility and verify its board, list, card and sidebar scope. Four
focused files pass (40 checks). The compound remains under native review.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4d74f7080">Repair Veps keyboard-shortcut translations.</a></summary>

Replace three tracked Finnish messages and their unflagged popup title with a
consistent keyboard-command draft. Verify opposite setting actions, popup and
route bindings, and the literal question-mark shortcut. Four focused files pass
(40 checks). The technical compound remains under native review.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/7bc3b73b0">Translate Veps advanced-filter help.</a></summary>

Replace the final tracked Finnish Veps paragraph while preserving every
executable operator, quote, escape, grouping and regex example. Six focused
files pass (42 checks), including the real parser suite. Technical prose remains
under native review.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/52836b241">Complete Ewe tabular Hijri calendar label.</a></summary>

Replace an incomplete English label with an Ewe calculation-and-astronomical-
epoch draft, preserving its distinction from civil and moon-sighting variants.
Four focused files pass. The technical construction remains under native
review.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/56ce505d0">Translate Nahuatl calendar-system labels.</a></summary>

Replace 17 Azerbaijani, English and incomplete labels with a coordinated modern
date-reckoning family. Preserve every named calendar, country, epoch and
moon-sighting distinction. Four focused files pass. Modern compounds remain
under native review.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e97f8fb20">Complete Wolaytta calendar-system labels.</a></summary>

Replace ten English seeds with the attested Wolaytta calendar-noun family.
Preserve named systems, calculated civil and astronomical starting points, and
Saudi moon sighting. Four focused files pass. Technical compounds remain under
native review.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/88caf1751">Translate Tigre calendar-system labels.</a></summary>

Replace 17 Azerbaijani, English and incomplete labels using a Tigre corpus-
attested calendar expression and native date, view, calculation, astronomy,
country and religious terms. Preserve all named systems and epoch/sighting
distinctions. Four focused files pass. Full compounds remain under native
review, along with broader Tigrinya-seeded locale values.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a0eeee9d6">Retain valid Roman Inuktitut translations.</a></summary>

Review 23 script findings against official territorial and Nunavut language
guidance. Preserve the correct-language Qaliujaaqpait values because Roman
orthography and Qaniujaaqpait syllabics are both valid Inuktitut writing
systems. Four focused files pass.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b5acfdaec">Complete Inuktitut calendar labels.</a></summary>

Replace 15 Azerbaijani and incomplete English labels with the official
Nunavut-attested calendar noun and existing syllabic UI vocabulary. Preserve
all named systems and civil, astronomical and moon-sighting distinctions.
Four focused files pass. Full compounds remain under native review.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/10aa31003">Translate Tamazight tabular Hijri labels.</a></summary>

Replace two English seeds with calculated Islamic-calendar labels and exact,
distinct Julian civil and astronomical start dates. Avoid the unrelated
furniture-table noun. Four focused files pass; full compounds remain under
native review.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/7d87955de">Repair Tamazight accessibility and UI labels.</a></summary>

Replace seven Arabic or French accessibility, label-action, scrollbar,
ZIP-import and multi-card-window values. Preserve `.zip` and `JSON` literals
and add focused script and terminology checks. Full accessibility, scrollbar
and window compounds remain under native review.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3d79d5ca5">Repair Tamazight diagnostics and repository actions.</a></summary>

Replace four French memory, Excel export and repository-action values with
Tamazight drafts. Add focused terminology and wrong-language checks. Complete
allocated-heap and software-repository compounds remain under native review.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/36c8afc8e">Repair Tamazight board and import guidance.</a></summary>

Replace Arabic or French offline, Due Cards, URL, bucket and public-board text,
and complete the Roman Tamazight Markdown-import instruction. Preserve all
syntax and product literals. Longer phrasing remains under native review.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a11978016">Repair Tamazight global search guidance.</a></summary>

Replace three French search instructions while preserving every operator,
placeholder, quoted example and Markdown delimiter. Explanatory grammar
remains under native review.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ee9228ab6">Complete tracked Tamazight migration translations.</a></summary>

Replace the final thirteen French member-mapping and board-migration values.
Preserve URL and database field identifiers and verify confirmation questions.
Long technical clauses remain under native review.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f18a925c2">Translate the Aromanian magenta color label.</a></summary>

Replace the English placeholder with a red-violet compound built from attested
Aromanian color components. The exact compound remains under native review.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2ecd74637">Complete restored Basque rule translation review.</a></summary>

Retain four named-subject fragments after checking production rule-builder and
saved-description order. The original audit now has no pending or restored
rows; broader full-locale review continues.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9ab9215c6">Repair Tigre basic date vocabulary.</a></summary>

Replace 12 Date, Day, Month and weekday values copied from Tigrinya with
corpus-backed Tigre forms. Focused checks keep date/day semantics distinct and
reject the Tigrinya seeds. Broader whole-locale review continues.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0e9418960">Repair corpus-backed Tigre interface terms.</a></summary>

Replace 35 navigation, board-view, action, color and field labels copied from
Tigrinya with Tigre corpus entries. Focused checks preserve exact values and
reject the copied seeds; broader phrase review continues.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5b2c5942e">Record corpus-attested shared Tigre terms.</a></summary>

Retain 13 Tigre values that validly match Tigrinya because the Tigre corpus
independently attests each exact form for the same English gloss. Focused
checks distinguish reviewed shared vocabulary from unclassified overlap.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f27cb82ca6">Repair lexical Tigre interface terms.</a></summary>

Replace 91 more Tigrinya-seeded labels with Tigre corpus headwords and short
phrases. Focused checks preserve exact source placeholders and reject the
former seeds; broader phrase review continues.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/62956f2819">Repair Tigre address and name labels.</a></summary>

Replace three more Tigrinya-seeded labels with the context-appropriate Tigre
corpus senses already used for Address and Name. Broader review continues.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2530126f2">Repair repeated Tigre interface families.</a></summary>

Replace 32 repeated Tigrinya-seeded labels with consistent Tigre corpus terms
for status, color actions, intervals and related interface families.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/77e08a8f6">Repair Tigre Azure menu paths.</a></summary>

Use Tigre Account and Show forms in two Azure paths while preserving every
vendor menu token and separator.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f9b716fd6">Repair repeated Tigre interface nouns.</a></summary>

Use consistent Tigre corpus roots for text, title, source, support, public,
boards, labels and avatars across related controls.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b2caad45b">Retain additional shared Tigre terms.</a></summary>

Record direct corpus evidence for six valid Tigre/Tigrinya cognates in their
specific red, phase, Default and translation controls.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/67632637c">Repair conflicting Tigre interface senses.</a></summary>

Replace four Tigrinya-seeded labels whose attested meanings conflict with the
Task, Sort, Person and Trigger UI contexts.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/62ff72c60">Repair basic Tigre interface terms.</a></summary>

Replace 17 basic Tigrinya-seeded labels with distinct Tigre forms attested in
complete corpus sentences.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a268d6167">Repair Tigre operational terms.</a></summary>

Replace 22 Tigrinya-seeded operational labels with distinct Tigre corpus forms
covering actions, limits, work, reports, security and progress.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/fa6cbd166">Retain the shared Tigre seconds term.</a></summary>

Keep the existing Seconds label after direct Tigre corpus attestation proves
that its equality with Tigrinya is a valid cognate.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/6f2592814">Repair Tigre interface compounds.</a></summary>

Replace 27 Tigrinya-seeded time-unit and interface compounds by consistently
reusing corpus-established Tigre roots.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2bb4b88cb">Correct Tigre member terminology.</a></summary>

Use the corpus Member/Members pair across seven controls and replace an earlier
association-sense choice.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9f5f2d1db">Repair Tigre administrative and location controls.</a></summary>

Replace 14 Tigrinya-seeded Admin, confirmation, type and location controls with
corpus-attested Tigre terminology.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/6d8f830a7">Repair Tigre export controls.</a></summary>

Use one corpus-attested Tigre export action across seven generic, list and board
Export controls.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e27abadf6">Repair Tigre severity controls.</a></summary>

Replace physical-weight wording in three Severity controls with a corpus-
grounded severity-level compound.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b4586ba97">Repair Tigre status controls.</a></summary>

Replace eight Tigrinya-seeded progress, CPU usage, card loading and remaining-
time controls with corpus-attested Tigre terminology.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f1b12cc66">Repair Tigre visual controls.</a></summary>

Replace eight Tigrinya-seeded Rename and board-background controls with corpus-
attested Tigre terminology.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e4ae5173f">Repair Tigre interface actions.</a></summary>

Replace seven Tigrinya-seeded Font, Invite People and Change permissions
controls with corpus-grounded Tigre terminology.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b8ebfc67e">Repair Tigre speed and storage terms.</a></summary>

Replace four Tigrinya-specific Speed and Storage spellings with independently
attested Tigre forms.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0651f745b">Repair ledger-grounded Tigre compounds.</a></summary>

Replace 17 compact Tigrinya-seeded interface labels using independently
reviewed Tigre terms from earlier corpus-backed corrections.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/284fcff14">Repair Tigre member compounds.</a></summary>

Use the explicit Tigre Member and Members terms across seven board, filter,
selection and rule controls.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a03aa027c">Repair Tigre date controls.</a></summary>

Distinguish Due, Due Date and End and replace copied Tigrinya wording in seven
date-popup titles with corpus-grounded Tigre terminology.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a6dd320fd">Repair Tigre selection controls.</a></summary>

Replace copied Tigrinya wording in six board selection, show/hide and
select-all controls with corpus-grounded Tigre terminology.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/22615501d">Reuse reviewed Tigre interface terms.</a></summary>

Apply established Tigre wording to the remaining matching List name, Create an
Account, Not Active and Logout labels.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b8bbd8fa3">Repair Tigre import controls.</a></summary>

Replace copied Tigrinya wording in eleven general, board, list, card and rule
Import controls with corpus-grounded Tigre terminology.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/002f8bc7b">Repair Tigre name controls.</a></summary>

Replace the copied Tigrinya name noun in four Full Name, Location, Webhook and
Version labels with corpus-grounded Tigre terminology.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5d53aa990">Correct Tigre plurals using corpus evidence.</a></summary>

Use attested Files, Names and Organizations plurals in 28 Tigre values.
Retain the legitimately shared File spelling and reconcile the correction
ledger and regression tests; all 46 Tigre suites pass.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/009d7f832">Repair Tigre Star and Break terminology.</a></summary>

Use corpus-attested Tigre singular and irregular plural Star forms in board,
page, list and card controls, plus the attested Pomodoro Break form. Refresh
ledger-confirmed older Tigre tests; all 45 Tigre suites pass.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/6b78c88cb">Repair Tigre Endpoint terminology.</a></summary>

Use the existing technical Endpoint term in three API/S3 contexts instead of
translating it as a temporal end.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0eac733cd">Repair corpus-supported Tigre exact controls.</a></summary>

Replace Tigrinya Website, Special, Buttons and Collections values with
Tigre corpus-grounded terms; mark derived plurals for fluent review.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0ef3ca6dd">Repair missed Tigre Organizations control.</a></summary>

Replace the remaining exact Tigrinya Organizations plural and extend the
full-locale regression guard to reject it.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/08e7092c3">Repair established Tigre noun families throughout.</a></summary>

Replace Tigrinya File, User, Name, Label, Organization, Team, Path, Status,
Size, Color and Count components across all 193 matching Tigre values, with
context guards for unrelated meanings.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/83546ed24">Repair Tigre board and card terms throughout.</a></summary>

Replace embedded Tigrinya Board and Card nouns in 407 Tigre values while
preserving Clipboard wording and existing Tigre compounds.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/40a20207b">Repair Tigre short interface controls.</a></summary>

Use established Tigre terms in 16 At, Remove, Sign In, All, Delete, Failed
and Count controls.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/088b01587">Repair additional Tigre interface terms.</a></summary>

Use established Tigre Files, Address, Visibility, Format, First and Usage
terms in 12 remaining exact-copy contexts.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/45a568aea">Reuse reviewed Tigre terms in remaining controls.</a></summary>

Repair 44 exact Tigrinya copies by reusing established Tigre terms only in
their matching UI senses.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e50072bc3">Repair Tigre edit and template terms.</a></summary>

Use exact Tigre corpus terms in 31 Edit and singular Template contexts while
preserving unrelated example phrases.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/eb1add1f2">Repair embedded Tigre account, storage and description terms.</a></summary>

Replace remaining copied Tigrinya Account inflections, Storage/Repository
spellings and Description components inside 60 Tigre values.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/8296c12a5">Repair Tigre account, storage and template terms.</a></summary>

Replace 17 copied Tigrinya Account, Storage and Templates components with
established Tigre terminology.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c73362aae">Repair remaining Tigre card terms.</a></summary>

Replace all 17 remaining copied Tigrinya Card components with established
Tigre singular, plural and possessive forms.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c91e56a50">Repair Tigre outcome and account terms.</a></summary>

Replace nine copied Tigrinya Failed, Succeeded, Registration and Private
forms with sense-matched Tigre corpus forms.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0896117b5">Repair Tigre date and time terms.</a></summary>

Replace seven copied Tigrinya Time components and repair three date/hour
prepositions while preserving independently attested Tigre nouns.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/242c1f27b">Repair Tigre label, organization and team terms.</a></summary>

Replace 13 copied Tigrinya nouns in semantically matched Label, Organization
and singular Team controls while preserving distinct icon and checkbox senses.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/8b6c21ff9">Repair repeated Tigre interface components.</a></summary>

Replace 32 copied Tigrinya Change, Show, Import, All, Size, Path and User
components while retaining the separate Enter-field meaning.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1196bebaa">Repair Tigre board terms.</a></summary>

Replace 31 copied Tigrinya Board singular, plural and possessive components
with established Tigre forms while preserving surrounding context.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/71a15613c">Repair Tigre file terms in longer clauses.</a></summary>

Replace the remaining eight copied Tigrinya File spellings with established
Tigre terminology while preserving surrounding clauses and identifiers.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/8560f3d7c">Repair Tigre card and file terms.</a></summary>

Replace 21 copied Tigrinya Card and File components with established Tigre
terms while preserving product names, extensions and surrounding context.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a69ed2325">Retain attested Tigre account and error plurals.</a></summary>

Preserve two byte-identical Tigre and Tigrinya plurals after independent Tigre
corpus sentences establish the matching Accounts and Errors senses.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f64f9c98d">Repair multi-component Tigre labels.</a></summary>

Replace copied Tigrinya components in 31 user, board, card, date, label, file
and invitation controls with previously attested Tigre terminology.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/fc6139745">Repair compact Tigre terminology.</a></summary>

Replace copied Tigrinya components in 31 configuration labels with consistent,
previously attested Tigre interface terms.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e17bb2b5e">Repair native-catalogue Veps interface terms.</a></summary>

Replace 31 Finnish-seeded labels through exact English-source matching with
the native MediaWiki Veps catalogue. Focused checks also preserve five terms
independently attested as valid in both languages; broader review continues.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c67a91a41">Repair lexical Veps interface terms.</a></summary>

Replace 29 Finnish-seeded colors, weekdays and common interface terms with
exact Veps lexical entries. Focused checks preserve 60 repaired terms and six
independently attested forms shared with Finnish; broader review continues.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a222bad2d">Repair Veps board interface families.</a></summary>

Replace 128 Finnish-seeded board, card, list, swimlane, member, label,
settings, archive and CRUD labels using established Veps vocabulary. Focused
checks keep related actions and objects consistent; broader review continues.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4caef872b">Repair Veps account and rule interface families.</a></summary>

Replace 165 Finnish-seeded account, email, profile, color, status, rules and
settings values with Veps drafts based on native lexical sources and existing
locale vocabulary. Focused checks preserve placeholders and product literals.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a4ec295ff">Complete Finnish-seeded Veps translation review.</a></summary>

Replace the final 177 Finnish-seeded search, report, status, storage and
migration values. Exact checks classify every remaining match as an attested
native cognate or intentional slash syntax and preserve all placeholders.

Thanks to xet7 !

</details>

Thanks to above GitHub users for their contributions and translators for their
translations.

# v11.80 2026-09-15 WeKan ® release

**In short:** **Checklist deadlines** add a shared-calendar date picker and
REST deadline access. **Multi-selection** correctly applies labels and members
without reversing the action. **Swedish and Valencian translations** clarify
Due Cards to include future deadlines and repair reflexive imperative and
checklist wording. Reviews retain correct Valencian settings, Thai interface
labels and Swedish and Arabic warnings. Exact correction and review checks
preserve placeholders and newer translations; broader language, shared trigger
grammar and browser verification remain open.

This release includes the following features and fixes:

**Checklist deadlines** - Header dates and REST access.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/70202a849">Add checklist deadlines and expose item dates in REST</a></summary>

Optional checklist due dates use the existing selected-calendar date/time
popup and due-date badge. Item deadlines remain independent. Checklist and
single-card GETs expose checklist and item deadlines; checklist/item POST
and PUT accept timezone-qualified ISO dates, with null clearing a deadline.
Invalid dates return 400; omitted dates stay unchanged. Existing board write
permissions and card/checklist ownership checks remain enforced.

Focused model/API regressions and the Chromium save/edit/clear browser test
pass. Both changed Jade templates compile. Uses existing dependencies,
themes and translated controls, including On-Premise installations.

Thanks to rmb82 and xet7 !

</details>

**Multi-selection** - Label and member actions.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a8226cc60">Apply labels and members from the clicked row</a></summary>

Use the clicked label/member context rather than surrounding template data.
Correct reversed assign/unassign popup actions and separate the bulk-label
button from the sidebar create-label selector. Stop event propagation,
await mutations and ignore repeated clicks in a double-click sequence.
The initial action correction is in
[the popup fix](https://github.com/wekan/wekan/commit/059c3311d).

Behavioral tests verify add/remove direction, row context, popup wiring and
repeated-click protection. Chromium verifies that a mixed selection retains
added labels and members.

Thanks to AmigaAbattoir and xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/bdf511a2b">Keep RTL language marker on the first line</a>. Thanks to xet7.</summary>

The language picker shows (RTL) beside the language name without splitting
its letters. The parenthesized regional name stays on the second line.
Focused layout checks and both LTR/RTL Chromium browser tests pass, including
first-line marker placement, an intact (RTL) marker and a separate region row.
The browser assertion accepts whitespace between the regional flag and name.

</details>

**Translation audit** - Native wording and provenance reviews.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3a090333c">Repair Tamazight selection and label shortcut text</a></summary>

Replace wrong-language wording while preserving add/remove versus
selection-add behavior and both 1-9 ranges. Four focused suites pass.
Dated audit: 19,821 corrections and 187 original findings pending; full
contextual grammar remains under native review.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/636dae2df">Repair Tamazight quick-access star-board instruction</a></summary>

Replace Arabic with Tamazight wording retaining star action and shortcut
location. Four focused suites pass. Dated audit: 19,819 correction records,
188 original findings pending; software adaptation remains under review.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/cda3ca904">Align Tamazight checklist mark and unmark actions</a></summary>

Use IRCAM mark/sign terms for check/uncheck and one/all rule labels.
Four focused suites pass. Dated audit records 19,818 corrections and 189
original findings pending; checkbox adaptation remains under native review.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/52b264894">Repair Tamazight standalone update rule label</a></summary>

Replace Arabic with IRCAM's attested update noun. Four focused suites pass.
Dated audit records 19,812 corrections and 189 original findings pending.
Contextual action-label suitability and repository terminology remain open.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/7a51038bf">Repair Tamazight card and swimlane deletion popups</a></summary>

Replace wrong-language warnings, preserving activity-feed removal,
reopening/recovery restrictions and no undo. Four focused suites pass.
Dated audit: 19,811 corrections, 189 original findings pending; complete
contextual grammar remains under native review.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9e26815db">Repair Tamazight card and vote deletion notices</a></summary>

Replace wrong-language warnings, retaining non-undoable deletion and loss
of all related activities. Keep card and vote scopes distinct. Four focused
suites pass. Dated audit: 19,809 corrections, 191 original findings pending;
complete contextual grammar remains under native review.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ab336422a">Repair Tamazight no-lost-items restoration message</a></summary>

Replace French restoration result with a Tamazight draft preserving
swimlane, list and card scope. Four focused suites pass. Dated audit:
19,807 corrections and 193 original findings pending. Full mixed-gender
agreement and software phrasing remain under native review.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c9f033fe3">Repair Tamazight unsaved-description rescue setting</a></summary>

Replace French setting text, retaining rescue dialogue before closing and
unsaved card-description scope. Four focused suites pass. Dated audit:
19,806 corrections, 194 original findings pending; complete contextual
grammar remains under native review.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d9bcfcd2f">Repair Tamazight rule destinations and member fragments</a></summary>

Replace eight French fragments using existing Tamazight terms. Preserve
list ownership, distinct list/swimlane destinations and add/remove actions.
Four focused suites pass. Audit updated 2026-09-15: 19,805 correction
records, 195 original findings pending; contextual grammar remains open.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/54218b150">Repair Tamazight rule object and add-label wording</a></summary>

Replace three unflagged French values using existing Tamazight card,
checklist item and label terms. Preserve the distinct add/remove actions.
Four focused suites pass. Dated audit records 19,797 corrections and 195
original findings pending; contextual phrasing remains under native review.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/35dcd699a">Repair Tamazight checklist item and comma instructions</a></summary>

Replace French checklist rule text with Tamazight drafts using IRCAM's
explicit punctuation-comma sense. Preserve required comma-separated input.
Four focused suites pass; full compound and clause grammar remain low
confidence. Audit updated 2026-09-15: 195 original findings pending,
19,794 correction records, four restored values awaiting validation.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c5738aa53">Wolaytta calendar-system selection label</a></summary>

Replace Azerbaijani with a Wolaytta draft retaining the date-display
qualifier. Four focused suites pass; full display terminology and clause
grammar remain under native review.

Thanks to xet7.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ca3b8764b">Wolaytta Hijri calendar labels</a></summary>

Replace English generic and Umm al-Qura seeds with Wolaytta drafts
preserving their distinct identities. Four focused suites pass; complete
calendar compounds remain under native review.

Thanks to xet7.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/af7388566">Wolaytta Dangi and Minguo calendar labels</a></summary>

Replace English seeds with Wolaytta drafts preserving canonical calendar
names and the native calendar noun. Four focused suites pass; complete
proper-name compounds remain under native review.

Thanks to xet7.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b7f18f9ce">Wolaytta Ethiopian calendar labels</a></summary>

Replace English labels with Wolaytta drafts preserving the separate
Amete Alem era. Four focused suites pass; complete country-calendar
grammar remains under native review.

Thanks to xet7.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/12dfa02ae">Wolaytta calendar labels</a></summary>

Replace English calendar nouns in four labels with native Wolaytta
terminology, preserving view and iCal qualifiers. Four focused suites
pass; specific calendar-system phrases remain under review.

Thanks to xet7.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/59541a5ae">Kashmiri tabular Hijri calendar labels</a></summary>

Replace English tabular and inappropriate social wording with Kashmiri
drafts distinguishing both Julian epochs. Four focused suites pass;
complete technical compounds remain under native review.

Thanks to xet7.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a00a983c1">Tamazight migration help</a></summary>

Replace French help with a Tamazight draft retaining board integrity
checks, repairs and individual execution. Four focused suites pass;
complete clause grammar remains under native review.

Thanks to xet7.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d9cebf2b0">Tamazight card description recovery confirmation</a></summary>

Replace French recovery confirmation with a Tamazight draft naming the
current card description and your changes. Four focused suites pass;
complete question and overwrite wording remain under native review.

Thanks to xet7.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ed8256d45">Tamazight unsaved card description warning</a></summary>

Replace Arabic warning prose with a Tamazight draft preserving possession
and not-yet-saved status. Four focused suites pass; complete clause
agreement remains under native review.

Thanks to xet7.

</details>


<details>
<summary><a href="https://github.com/wekan/wekan/commit/38c76afb7">Translate Tamazight ordered duplicate-list migration confirmation</a></summary>

Preserve conversion before deleting empty duplicates with a same-title
populated counterpart, then ask whether to continue. Four focused suites
pass; full technical grammar remains under review. Removed migration code
stays removed. Dated audit evidence and counts are updated.

Thanks to xet7.

</details>


<details>
<summary><a href="https://github.com/wekan/wekan/commit/8378f9f39">Translate Tamazight empty-duplicate-list repair description</a></summary>

Preserve safe deletion limited to empty lists with a same-title populated
counterpart. Four focused suites pass; complete grammar remains under review.
No removed migration is activated. Dated audit evidence and counts updated.

Thanks to xet7.

</details>


<details>
<summary><a href="https://github.com/wekan/wekan/commit/8b44ebd33">Translate Tamazight duplicate-list deletion confirmation</a></summary>

Preserve the confirmation question and restriction to same-name duplicate
lists containing no cards. Four focused suites pass; full grammar remains
under native review. Deletion behavior is unchanged. Dated audit updated.

Thanks to xet7.

</details>


<details>
<summary><a href="https://github.com/wekan/wekan/commit/8e7006cde">Translate Tamazight missing-list repair confirmation</a></summary>

Preserve the future repair statement and a separate continuation question.
Match the description scope. Four focused suites pass; full grammar and
technical compounds remain under review. No removed migration is activated.
Dated audit evidence and counts are updated.

Thanks to xet7.

</details>


<details>
<summary><a href="https://github.com/wekan/wekan/commit/59aa02a7e">Translate Tamazight missing-list repair description</a></summary>

Replace French wording with a draft preserving discovery and repair of
missing or damaged lists in board structure. Four focused suites pass;
full grammar and confirmation wording remain under review. No removed
migration is activated. Dated audit evidence and counts are updated.

Thanks to xet7.

</details>


<details>
<summary><a href="https://github.com/wekan/wekan/commit/cb7df8bbc">Distinguish remaining Tamazight description labels from summary</a></summary>

Use the description noun in minicard and more-detailed description labels.
Keep Summary and search shorthand unchanged. Five focused suites pass;
complete phrase grammar remains under review, with dated audit evidence.

Thanks to xet7.

</details>


<details>
<summary><a href="https://github.com/wekan/wekan/commit/df50d9f6e">Translate Tamazight bulk-card guidance and description terminology</a></summary>

Translate destination-card JSON guidance and distinguish description from
summary in the field label and examples. Literal JSON properties stay
unchanged. Five focused suites pass; full instruction grammar remains
under native review. Dated audit evidence and counts are updated.

Thanks to xet7.

</details>


<details>
<summary><a href="https://github.com/wekan/wekan/commit/414beceef">Translate Tamazight WIP error recovery guidance</a></summary>

Replace French wording with a draft retaining moving tasks out of the list
or increasing the WIP limit. Avoid a deletion instruction. Four focused
suites pass; complete grammar remains under native review. Dated audit
and correction provenance are updated.

Thanks to xet7.

</details>


<details>
<summary><a href="https://github.com/wekan/wekan/commit/3eb7ae103">Translate Tamazight participation and watch notification messages</a></summary>

Replace French catalogue values while preserving creator/member card scope
versus watched boards, lists or cards. Four focused suites pass. Full grammar
remains under native review; no removed notification UI is activated.
Dated audit evidence and counts are updated.

Thanks to xet7.

</details>


<details>
<summary><a href="https://github.com/wekan/wekan/commit/58809a724">Translate Kashmiri Saudi moon-sighting calendar label</a></summary>

Replace English country-only wording with a calendar and moon-seeing draft.
Four focused suites pass. Full grammatical agreement and remaining epoch
wording stay under native review, with sources and limits in the dated audit.

Thanks to xet7.

</details>


<details>
<summary><a href="https://github.com/wekan/wekan/commit/206859259">Translate Fulah tabular Hijri calendar epoch labels</a></summary>

Replace English-only labels with calculation, structured-table and beginning
wording, retaining distinct Julian epoch dates and existing sighting wording.
Four focused suites pass. Full compounds and dialect consistency remain
under native review; audit evidence records sources and updated counts.

Thanks to xet7.

</details>


<details>
<summary><a href="https://github.com/wekan/wekan/commit/ee94227ea">Document Fulah calendar component evidence</a></summary>

Record primary structured-table and beginning-word evidence, distinguishing
attested components from complete technical phrases. Both epoch findings
remain pending; correct existing translations and audit counts are preserved.

Thanks to xet7.

</details>


<details>
<summary><a href="https://github.com/wekan/wekan/commit/3edd8d499">Clarify Quechua Saudi moon-sighting calendar label</a></summary>

Use a calendar noun and explicitly identify moon sighting in Saudi Arabia.
Preserve the distinction from tabular calendar variants. Four focused suites
pass; full technical grammar remains under native review. Audit evidence
records primary dictionary sources and preserves original provenance.

Thanks to xet7.

</details>


<details>
<summary><a href="https://github.com/wekan/wekan/commit/963a3965b">Distinguish Quechua tabular Hijri calendar epochs</a></summary>

Replace clock-related and English-only labels with calendar, table/count
and beginning wording. Explicit Julian epoch dates distinguish civil and
astronomical tabular variants. Four focused suites pass; complete technical
compounds remain under native review. Dated evidence and audit counts updated.

Thanks to xet7.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3121eea2f">Replace French Tamazight notification instructions</a>. Thanks to xet7.</summary>

Keep never-for-board muted notifications separate from creator/member card
tracking notifications. Use IRCAM future negation and participant nouns.
Four focused suites pass; full passive and relative grammar remain under
native review. No new browser execution is claimed.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/6171a92af">Replace French due reminders with Tamazight drafts</a>. Thanks to xet7.</summary>

Preserve approaching, current and past deadline states and exact activity
placeholders. Use IRCAM reminder and temporal roots. Four focused suites
pass; complete aspect grammar and deadline compounds stay under native
review. The full translation audit remains unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2ad05d681">Replace Arabic OS uptime label with a Tamazight draft</a>. Thanks to xet7.</summary>

Describe elapsed time since operating-system start using IRCAM lexical
terms, matching the actual Information view value. Four focused suites pass.
Relative-clause inflection, startup terminology and other diagnostic labels
remain under native review; no admin browser execution is claimed.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3e7b05f82">Use attested Tamazight wording for list ordering</a>. Thanks to xet7.</summary>

Replace a speculative derived noun in the migration-description draft with
IRCAM's ordering noun, also used in MediaWiki software sorting. Four focused
suites pass, including rejection of the superseded form. Full sentence
inflection and remaining technical compounds stay under native review.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ef2b560fc">Replace French migration description with a Tamazight draft</a>. Thanks to xet7.</summary>

Retain data-integrity checks and repairs, list ordering, card positions and
swimlane structure using IRCAM lexical evidence. Four focused suites pass.
Derived grammar and technical collocations remain under native review;
removed migration code stays removed and no browser execution is claimed.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/11db75449">Repair Latin Uzbek regional terms and loading instructions</a>. Thanks to xet7.</summary>

Describe automatic loading, live counts, thresholds and exact operator
variables. Correct board word forms in matching Latin regional translations
and review independent roadmap, clone and notification values. Five suites
pass, including 28 loading behavior checks. Arabic-script guidance and full
native technical wording remain under review.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/51dd39523">Repair remaining Uzbek board terminology and word forms</a>. Thanks to xet7.</summary>

Correct 179 council-term sentences to the established Kanban board noun.
Preserve plural, possessive and case forms; fix related schedule, search,
selection, templates and visibility wording. Five focused suites pass,
including exact placeholders and newer human-translation preservation.
Stale loading instructions and full technical wording remain under review.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/bc8d3b233">Repair remaining Khmer board and related word senses</a>. Thanks to xet7.</summary>

Replace governing-council wording in 69 sentences per stored Khmer locale
with the established Kanban board noun. Correct financial deposit, list
purchasing, multi-board calendar, visibility labels and the extra board in
swimlane selection. Preserve aliases, HTML and placeholders. Five focused
suites pass; full technical compound review and other locales remain open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ca9bf7a97">Distinguish Uzbek and Khmer Kanban boards from councils</a>. Thanks to xet7.</summary>

Correct core board labels, restoration actions and complete Archive/All Boards
instructions. Preserve Khmer locale aliases and historical correction values.
Five focused suites pass after fixing alias bookkeeping. Further council-term
sentences and native computing collocations remain under review.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2070173c0">Correct archive instructions in eight additional languages</a>. Thanks to xet7.</summary>

Use Archive on All Boards in Malayalam, Marathi, Gujarati, Punjabi, Nepali,
Sinhala, Mongolian and Kazakh. Preserve existing restoration terms and place
labels; replace Sinhala's English Archive label. Five focused suites pass,
including placeholder and newer human-translation preservation. Full native
collocations and remaining archive locales stay under review.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/110c58002">Repair Irish, Serbian and Tagalog archive instructions</a>. Thanks to xet7.</summary>

Point to Archive on All Boards using existing translated labels. Select the
attested Irish bring-back sense, retain Serbian board vocabulary and replace
mixed English in Tagalog. Five focused suites pass, including placeholders
and human-translation preservation. Full Irish navigation syntax remains
under native review; the broader translation audit continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/262f23764">Repair another 21 archive guidance locale files</a>. Thanks to xet7.</summary>

Archive location guidance is repaired across additional languages and
regional variants. Wrong-language Macedonian, Urdu and Maltese prose is
replaced, and Zulu Archive place labels are corrected. Five suites pass;
Maltese/Zulu computing phrases and remaining locales stay under review.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/801dcf1a8">Repair archive guidance in 34 more locale files</a>. Thanks to xet7.</summary>

Archive location guidance and six place labels are corrected across Asian,
RTL and European languages and regional variants. Persian text in Arabic
and Malay text in Indonesian are replaced. Focused suites pass, including
regional label consistency and superseded Galician acceptance. Other
locales and full native/UI verification remain under review.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f8708e3d2">Repair archive guidance in 21 additional locale files</a>. Thanks to xet7.</summary>

Slovak, Slovenian, Croatian, Bosnian, Hungarian, Romanian, Russian,
Ukrainian, Bulgarian, Greek, Turkish and regional Spanish/Portuguese
translations now name the current Archive location. Three Archive place
labels are corrected. Five suites pass; other locales and full native/UI
verification remain under review.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f1c15bd0e">Repair archive guidance in 27 locale files</a>. Thanks to xet7.</summary>

Finnish, German, French, Spanish, Italian, Portuguese, Dutch, Danish,
Norwegian Bokmål and Polish guidance now names the current Archive location,
including identical regional copies. Existing place labels and correct
Swedish wording are preserved. Five suites pass; other locales and full
native/browser verification remain under review.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/143965460">Correct archive restoration guidance location</a>. Thanks to xet7.</summary>

English, six English variants and Tamazight now name Archive on All Boards
instead of an obsolete header button. Five focused locale/menu suites pass.
The full Tamazight draft and corresponding locations in other languages
remain under review; correct translations and placeholders are protected.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/de14ab2b6">Review archive guidance source location</a>. Thanks to xet7.</summary>

The audit identifies outdated home-header wording in the English source.
The active Archive control is an All Boards menu row; the old header
markup is commented out. English and corresponding locale repairs remain
open. Existing menu and audit checks pass; no locale change is claimed.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1444c8f94">Review Tamazight archive guidance terminology</a>. Thanks to xet7.</summary>

Native software evidence supports the existing home-page term. Dictionary
plug and clothing-button senses do not prove UI controls, so the full
archive guidance remains unresolved. Dated evidence records the remaining
terminology and location checks; no locale or browser changes are claimed.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/852861ce0">Repair Tamazight remaining-time lockout label</a>. Thanks to xet7.</summary>

IRCAM time/remain terminology replaces an additional French label.
Four locale suites pass, keeping remaining time distinct from configured
lockout periods and protecting placeholders. Relative-verb form and
countdown collocation remain low confidence; no browser claim is made.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/8d3dca66a">Repair Tamazight locked-users description</a>. Thanks to xet7.</summary>

The full French description becomes a Tamazight draft retaining plural
blocked users, current state and repeated login-failure reason. Four locale
suites pass with tokens and correct translations preserved. Native causal
phrasing remains low confidence; no browser rendering is claimed.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b54bc8935">Repair Tamazight temporary account lockout message</a>. Thanks to xet7.</summary>

The full French warning becomes a Tamazight draft retaining the temporary
period, repeated failed logins and retry-later instruction. Four locale
suites pass with placeholders and correct translations preserved. Native
causal and temporal grammar remains low confidence in the dated review.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1e3ccd4f0">Repair Tamazight archive and board restore labels</a>. Thanks to xet7.</summary>

French and Arabic labels become distinct archive and restoration actions.
Four translation suites pass. Chromium verifies the list archive title
and cancellation; board restoration has source coverage. Native computing
compounds and remaining full phrases stay under review in the dated audit.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1f0d46494">Repair Tamazight server troubleshooting instructions</a>. Thanks to xet7.</summary>

The full French message becomes a Tamazight draft with separate Snap and
Docker instructions. Exact shell commands, placeholders and correct
translations are preserved. Four locale suites pass; full native clause
grammar remains low confidence in the dated review. Pending findings
fall to 228, including 121 Tamazight entries.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/69d9adb6c">Repair Tamazight architecture diagnostic label</a>. Thanks to xet7.</summary>

IRCAM architecture terminology replaces Arabic while retaining the CPU
architecture metric. Four translation suites pass with positive and
negative source checks. Computing specialization remains low confidence.
The short audit also reflects already executed browser verification;
full native clauses and other UI paths remain under review.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/163a755c0">Repair Tamazight OS release and type labels</a>. Thanks to xet7.</summary>

Native version/type terms replace three additional Arabic diagnostic and
field labels. Locale and metric-source checks pass, preserving placeholders
and correct translations. OS terminology adaptation remains low confidence;
the dated review records sources and the remaining verification limits.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1bfe76828">Repair Tamazight free-memory label</a>. Thanks to xet7.</summary>

A vacant-memory draft replaces Arabic while preserving the system free
memory metric. Source and locale checks distinguish it from total memory
and preserve tokens. Derived adjective and computing phrase remain low
confidence in the dated native review.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/138b1b0af">Repair Tamazight debug-query error wording</a>. Thanks to xet7.</summary>

The French error becomes a complete draft describing an unsupported debug
catalogue value. Exact positional token and technical operator remain.
Parser-source and locale checks pass. Full native diagnostic grammar and
selector/projection terminology remain under review.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/56c2c5331">Repair Tamazight Excel field-selection prompt</a>. Thanks to xet7.</summary>

A complete native-component draft replaces French while preserving field
selection, Excel export and punctuation. Translation checks pass. Relative
and future phrase grammar remain low confidence in the audit. No active UI
reference was found, so browser execution is not claimed.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/58169ab23">Repair French Default labels in Tamazight</a>. Thanks to xet7.</summary>

Three Default values use native by-default wording. The reserved lane
label and negative French-word check pass in Chromium; locale checks
preserve placeholders and newer human translations. Standalone phrase
adaptation remains under native review in the dated audit.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/164268616">Repair wrong-language Tamazight board controls</a>. Thanks to xet7.</summary>

Four add-swimlane and list/swimlane action labels replace French/Arabic
with native-component drafts. Locale checks preserve placeholders; actual
board title attributes and negative wrong-language checks pass in Chromium
(coverage commit 1efbb9034). Construct grammar and lane terminology remain
low confidence in the dated audit.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4941f33fd">Remove French conjunction from Tamazight sidebar title</a>. Thanks to xet7.</summary>

Native alternative wording replaces French ou in the shared conjunction.
The actual sidebar title and negative French-word check pass in Chromium.
Translation checks preserve placeholders and newer human translations;
full sidebar compounds remain under native review.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/75fbb698c">Verify Tamazight numeric total tooltip in the browser</a>. Thanks to xet7.</summary>

The browser fixture enables the actual badge-visibility setting and
resumes login before reopening the board. Chromium verifies visible-field
sum 7, exclusion of hidden value 100, and the translated tooltip. Native
wording review remains open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e7d0f821c">Clarify remaining Ewe calendar translation evidence</a>. Thanks to xet7.</summary>

Current primary CLDR sources distinguish provisional calendar names from
untranslated identifiers. Dated review records missing computational-table
and epoch terminology. Existing structural checks pass; the native
translation finding remains open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2dbc6ba3a">Use the native Veps linking action</a>. Thanks to xet7.</summary>

Direct native software wording replaces the assembled add-link draft.
Linked-card and linked-board action scope and regression checks are
verified. Dated evidence preserves both revisions and remaining review.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3f8363836">Replace Finnish wording in the Veps Link action</a>. Thanks to xet7.</summary>

A Veps draft now describes adding a link instead of using Finnish. Native
component terms and linked-card/board action scope are checked. Grammar
remains low confidence in the dated audit. Locale and placeholder tests
pass; original pending counts are unchanged.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c9005ee0a">Verify Basque rule grammar in the browser</a>. Thanks to xet7.</summary>

Correct test ownership and login/navigation setup allow the browser test
to execute against the local Meteor app. Chromium verifies six named
Basque controls, saved checklist descriptions and unchanged English order.
Full native clause review remains open; translation counts are unchanged.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/cff1fdc32">Correct Basque named-assignee control order</a>. Thanks to xet7.</summary>

The name input now precedes the Basque subject, matching other named rule
controls. Other locales retain their existing order. Source and saved
description checks pass. Browser coverage is extended and syntax checked;
execution remains pending because the local app is unavailable.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/486be5743">Correct Basque assignee rule subject wording</a>. Thanks to xet7.</summary>

The subject now names the assigned user instead of saying Assign This.
Locale, token and preference checks pass. Named-row composition and browser
verification remain open in dated translation audit evidence.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3b12f68c7">Repair Veps card and minicard display labels</a>. Thanks to xet7.</summary>

Two complete drafts preserve distinct display targets. Location forms and
full phrasing remain low confidence. Locale, token and preference checks
pass; dated audit evidence keeps native/browser verification open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b479af98f">Repair Veps parent change and display controls</a>. Thanks to xet7.</summary>

Two complete terminology drafts preserve changing the parent relationship
and hiding its display as separate actions. Full grammar remains low
confidence. Locale, token and preference checks pass; dated audit evidence
keeps native/browser verification open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e8692f14a">Repair Veps parent display instruction</a>. Thanks to xet7.</summary>

The complete draft preserves showing the parent card on the minicard.
Full grammar remains low confidence. Locale, placeholder and preference
checks pass; dated audit evidence keeps native/browser verification open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/439a18989">Replace Finnish Veps parent-card wording</a>. Thanks to xet7.</summary>

The parent selection label now uses a complete Veps terminology draft.
Compound grammar and software meaning remain low confidence. Locale, token
and preference checks pass; dated audit evidence keeps native/browser
verification open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a9d68dc92">Verify Veps arithmetic and location terminology</a>. Thanks to xet7.</summary>

Visually verified primary dictionary entries establish addition, vertical
and upper-part terms. The dated audit distinguishes arithmetic addition
from a sum result and keeps complete field-sum and scrollbar phrases open.
No locale values or completion counts changed.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3ba133c10">Replace Venda wording in the Veps inheritance instruction</a>. Thanks to xet7.</summary>

The subtask checkbox now has a complete Veps terminology draft, preserving
inheritance of the parent card's labels. Full grammar and the software
metaphor remain low confidence. Locale, placeholder and preference checks
pass; dated audit evidence keeps native/browser verification open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e1ab5e4fa">Verify Veps inheritance terminology from a primary dictionary</a>. Thanks to xet7.</summary>

The dated audit records a visually verified inheritance verb from the 2007
Russian–Veps dictionary. Complete parent-card instruction grammar remains
under review. No locale values or completion counts changed.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3a10fb927">Correct reversed Veps Hide Empty Lists wording</a>. Thanks to xet7.</summary>

The label now describes hiding empty lists instead of showing them. The
complete native wording draft remains low confidence for grammar and noun
spelling. Locale, placeholder, preference and filter source wiring checks
pass; the dated audit keeps native/browser verification open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a60cf42ad">Replace Finnish Veps filter headings with native terminology drafts</a>. Thanks to xet7.</summary>

Two filter headings now use native-source terms, preserving singular and
plural meanings. Locale, placeholder and translation-preference checks
pass. Full heading grammar remains low confidence; the dated audit keeps
full instructions and native/browser review open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/84bffe61a">Correct Veps card and list More popup titles</a>. Thanks to xet7.</summary>

Both popup titles now use the same native Veps wording. Locale, token and
translation-preference checks pass. Dated audit evidence records the repairs
and keeps unresolved full phrases and browser verification open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/70d9264f1">Repair Veps title and page terminology</a>. Thanks to xet7.</summary>

Three Finnish values now use native Veps nouns. Actual localized title
searches accept quoted and unquoted values and reject unknown operators.
Locale, token and translation-preference checks pass. Longer phrases and
browser verification remain open in the dated translation audit.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/6c30c4cfc">Replace Finnish Veps view and removal labels with native wording</a>. Thanks to xet7.</summary>

Three complete action labels now use native Veps software wording, preserving
“All” and distinguishing removal from disabling. Locale and placeholder
regression checks pass; longer Veps phrases and browser review remain open.
The dated [translation audit](docs/Features/Translations/Audit.md) records
18,815 corrections and 233 original findings still pending.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/55562f666">Verify limit-error formatting in every locale</a>. Thanks to xet7.</summary>

Check exact scalar argument formatting against all 246 locale files using
the actual translation method and installed formatter. Regression passes;
native quality, language loading and browser rendering remain unverified.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e3ae37bc5">Revise received-time activity terminology</a>. Thanks to xet7.</summary>

Use a primary reception noun in two earlier Tamazight activity drafts.
Preserve time placeholders and provenance history. Four translation
checks pass; complete clause and native/browser review remain open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/822d6dfb5">Draft consistent received and due labels</a>. Thanks to xet7.</summary>

Replace three French/Arabic Tamazight date labels while preserving field
distinctions. Four translation checks pass; software reception and deadline
wording remain under review in the audit.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/61484d5df">Consolidate audit verification summary</a>. Thanks to xet7.</summary>

Keep runtime progress concise while preserving dated evidence and native
review limits. Queue totals reconcile; a fresh localhost probe confirms
browser verification still lacks a running app. Audit regression passes.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/27f6c9d2a">Verify creation filtering and sorting labels</a>. Thanks to xet7.</summary>

Exercise Tamazight creation filter and both sort directions through the
actual parser; reject invalid periods. The focused regression passes.
Native/browser review remains open in the translation audit.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/49aec4fa9">Draft export dates and creation labels</a>. Thanks to xet7.</summary>

Replace French Tamazight export/date labels while preserving all five
field types and their order. Four translation checks pass; reception,
creation and due-date software usage remain under review in the audit.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/bc9860dff">Verify start and end existence predicates</a>. Thanks to xet7.</summary>

Exercise Tamazight present/absent date queries through the actual parser
and reject unsupported sort predicates. The focused regression passes;
native UI and browser review remain open in the translation audit.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b0f447c57">Repair start and end field labels</a>. Thanks to xet7.</summary>

Replace four Arabic Tamazight rule/search labels with existing native
start/end terms, preserving field distinctions. Four translation checks
pass; actual browser context remains unverified in the audit.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/aebb361d2">Draft wait-spinner descriptions</a>. Thanks to xet7.</summary>

Replace four French Tamazight spinner descriptions while preserving exact
animation identifiers. Four translation checks pass; native software
compound and browser review remain open in the audit.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a47e7141d">Draft invitation acceptance wording</a>. Thanks to xet7.</summary>

Replace wrong-language Tamazight acceptance labels while retaining the
not-yet invitation status. Four translation checks pass. Secondary verb
provenance and derived passive grammar remain under review in the audit.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3eaad375b">Review retained email warning wording</a>. Thanks to xet7.</summary>

Preserve Tamazight email warning text and attach native email-specific
software evidence to its prior correction. Full agreement and browser
review remain open. The correction-ledger regression passes.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4659005b1">Locate native software translation resources</a>. Thanks to xet7.</summary>

Record current Common Voice Tamazight resource paths for contextual review.
Keep repository wording unresolved; obsolete URLs and project metadata do
not establish native terminology. No additional repair is counted.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c831eb7e1">Review repository action terminology</a>. Thanks to xet7.</summary>

Record native upload, login and update evidence while distinguishing data
warehouses from source repositories. Complete stored action labels remain
under review; no additional translation is counted as repaired.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/44cb2f6ca">Strengthen domain-label grammar provenance</a>. Thanks to xet7.</summary>

Attach primary relative-marker and possession studies to the correction
record while preserving values and plural-clause uncertainty. The full
correction-ledger regression passes; no new repair is counted.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/bc406fcae">Review domain-label possession syntax</a>. Thanks to xet7.</summary>

Record primary Amazigh grammar evidence for possession constructions.
Keep plural relative agreement and full software-label wording under
review; no additional translation is counted as repaired.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/94205ae5f">Draft conditional automatic user addition label</a>. Thanks to xet7.</summary>

Replace Arabic with complete Tamazight wording preserving automatic
addition and the users-with-domain-name condition. Four translation
checks pass; native relative-clause and browser review remain open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/73543f47a">Draft lost-card restoration title</a>. Thanks to xet7.</summary>

Replace a stored French action title with complete Tamazight wording.
Four translation checks pass. Record uncertain adjective agreement and
software usage in the audit; no removed migration is restored.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c74009b21">Format direct translation arguments</a>. Thanks to xet7.</summary>

Search error values passed directly to TAPi18n now replace percent
placeholders. Preserve named options, explicit format arrays and zero.
Actual formatter, parser and lazy-loading regressions pass. Browser and
native-language verification remain open in the audit.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/8715c094e">Verify translated limit error dispatch</a>. Thanks to xet7.</summary>

Exercise Tamazight search-limit operators with the actual parser. Invalid
values retain their translation arguments; positive and zero limits remain
accepted. Record interpolation, browser and native-language limits in the
audit. The focused parser regression passes.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/10b47a7ed">Draft complete Tamazight search-limit error</a>. Thanks to xet7.</summary>

Replace French with a full validation-error draft preserving the positive
integer requirement and exact placeholder. Four translation checks pass;
native grammar and software usage remain under review in the audit.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/08df9a347">Review search-limit terminology</a>. Thanks to xet7.</summary>

Record why dictionary disability senses of invalid cannot be substituted
into Tamazight query-validation errors. Preserve the complete pending
sentence and exact placeholder while native terminology review continues.
No translation is counted as repaired by this research.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/da45e203a">Correct Tamazight computing domain terminology</a>. Thanks to xet7.</summary>

Replace a geographic-region noun in email-domain and board-sharing labels
with the documented computing term. Four translation checks pass. Record
primary provenance and keep native usage and complete automatic-addition
wording under review in the translation audit.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9978b92d2">Repair Tamazight automatic-width labels</a>. Thanks to xet7.</summary>

Replace Arabic label and tooltips while retaining automatic width and
opposite enable/disable click actions. Record terminology caveats.
Four translation checks pass; native and browser review remains open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/439ac5789">Repair Tamazight account-status tooltips</a>. Thanks to xet7.</summary>

Replace French with complete state and click-action drafts. Preserve the
opposite activation/deactivation actions and record grammar caveats.
Four translation checks pass; native and browser review remains open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3a6936cce">Translate Greenlandic tabular Hijri epoch labels</a>. Thanks to xet7.</summary>

Retain the table-based method and distinct Friday and Thursday epochs.
Record primary evidence and low-confidence explanatory wording.
Four translation checks pass; native and browser review remains open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/8ba8134b9">Document Greenlandic calendar epoch terminology evidence</a>. Thanks to xet7.</summary>

Record approved table and start-date terms and the distinct ICU epochs.
Keep both incomplete translations pending for full native wording review.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/602ea4090">Translate Greenlandic Saudi Hijri sighting label</a>. Thanks to xet7.</summary>

Retain calendar identity, Saudi Arabia and moon sighting in a complete draft.
Record grammatical evidence and low-confidence derived terminology.
Four translation checks pass; native and browser review remains open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f09b5d264">Add Greenlandic calendar wording to Coptic label</a>. Thanks to xet7.</summary>

Use the officially attested calendar noun and retain the calendar identifier.
Record the terminology caveat and add positive and negative coverage.
Four translation checks pass; native and browser review remains open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e9ef2b88b">Repair Tamazight duration and remaining-time labels</a>. Thanks to xet7.</summary>

Replace French labels while retaining time, estimation and remaining meanings.
Record primary vocabulary and low-confidence full-clause grammar.
Four translation checks pass; native and browser review remains open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/7817aa29f">Repair Tamazight shared-list conversion label</a>. Thanks to xet7.</summary>

Replace French with a complete draft retaining conversion and shared status.
Record primary vocabulary and low-confidence relative-clause morphology.
Four translation checks pass; native and browser review remains open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4091c14e4">Repair Tamazight comprehensive migration title</a>. Thanks to xet7.</summary>

Replace French with a full board migration draft using a scope modifier.
Record primary evidence and low-confidence software adaptation.
Four translation checks pass; native and browser review remains open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/597098ac1">Translate Tamazight positive-integer height error</a>. Thanks to xet7.</summary>

Replace Arabic with a complete draft preserving positive and integer.
Record mathematical evidence and low-confidence cross-variety wording.
Four translation checks pass; native and browser review remains open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/8d48c0e3e">Repair Tamazight Planning Poker action labels</a>. Thanks to xet7.</summary>

Replace French Finish and Replay with attested verbs matching the actual
round actions. Add positive and negative translation regression coverage.
Four source checks pass; native and browser context review remains open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/502c7e0cf">Repair six Tamazight basic color labels</a>. Thanks to xet7.</summary>

Replace French and Arabic basic colors with exact primary dictionary entries.
Keep distinct blue and green labels and add positive and negative coverage.
Four translation checks pass; compound shades and browser review remain open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/356836c4f">Replace French currency-code label with Tamazight terms</a>. Thanks to xet7.</summary>

Use dictionary-attested code and currency components. Preserve both meanings,
record the assembled phrase as low confidence, and add regression coverage.
Four translation checks pass; native and browser review remains open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/551e1ec04">Replace Arabic currency-field type with native Tamazight</a>. Thanks to xet7.</summary>

Use an explicitly attested currency compound. Four suites pass; currency
code and positive-integer wording remain under review, together with
browser verification. Original pending count stays at 253.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d968e4bb2">Repair Tamazight subtask landing-list instruction</a>. Thanks to xet7.</summary>

Replace French with arrival-list, subtask and deposited-here wording.
Four suites pass; full native metaphor/relative-clause grammar and
browser review remain open. Original pending findings: 253.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9515511af">Repair Tamazight subtask-board description and deposit label</a>. Thanks to xet7.</summary>

Replace French description while preserving its board placeholder; reuse
current task terms in the deposit instruction. Four suites pass; full
native phrases and browser verification remain under review.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/8bf9f58cf">Repair Tamazight task and subtask terminology</a>. Thanks to xet7.</summary>

Replace French Task and revise four subtask labels using primary task
vocabulary. Four suites pass; native software compounds and browser
verification remain open. Original correction provenance is retained.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a9406c278">Use primary Tamazight task vocabulary in WIP messages</a>. Thanks to xet7.</summary>

Replace general work terms with attested task vocabulary in two existing
repairs. Four suites pass; plural genitive, complete native clauses and
browser verification remain under review.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ac5a9f69b">Review Tamazight account-status terminology</a>. Thanks to xet7.</summary>

Distinguish permanent-membership vocabulary from enabled account status.
Record primary active/activate/click meanings; complete native tooltip
clauses remain under review. No translation acceptance is claimed.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5b89d5168">Repair Tamazight optional webhook authentication qualifier</a>. Thanks to xet7.</summary>

Replace French qualifier prose using native optional/authentication terms.
Four suites pass; technical borrowing and full native/browser phrase
remain under review. Original pending findings: 254.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/855219d70">Replace Arabic Optional label with native Tamazight</a>. Thanks to xet7.</summary>

Use the explicitly attested native adjective. Four suites pass; longer
webhook/epoch phrases and browser verification remain under review.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/7dd8c10c9">Restore Dzongkha Gregorian and ISO week label components</a>. Thanks to xet7.</summary>

Restore calendar and week meanings omitted by the identifier-only seed.
Four suites pass; full native technical label and browser verification
remain open. Date calculations are unchanged.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/98cf2cda5">Restore Dzongkha Hijri moon-sighting qualifier</a>. Thanks to xet7.</summary>

Replace the country-only English seed with calendar and moon-observation
components supported by native grammar. Four suites pass; full compound
and browser review remain open. Original pending findings: 255.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/233955a45">Restore Tamazight successful error-clearing qualifier</a>. Thanks to xet7.</summary>

Restore successful and all-error meanings using primary terminology.
Four suites pass; full native plural/adverbial grammar and browser review
remain open. Original provenance and pending counts are preserved.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3d891b203">Repair Tamazight migration-error heading and action</a>. Thanks to xet7.</summary>

Use attested error plural and erase wording while retaining migration and
all-error scope. Four suites pass; full native phrases, success
confirmation and browser verification remain open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a693a0093">Correct Tamazight plural error terminology</a>. Thanks to xet7.</summary>

Use the primary dictionary plural matching the singular Error label.
Four suites pass; original correction provenance is preserved. Related
diagnostic phrases and browser verification remain under review.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c8bcfb258">Add Tamazight numeric tooltip browser regression</a>. Thanks to xet7.</summary>

Verify translated tooltip and exclusion of a display-disabled numeric
field from the sum. Syntax and test discovery pass; browser execution
remains pending because the local application is not running.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/6e1292cd0">Repair Tamazight maximum WIP count setting</a>. Thanks to xet7.</summary>

Replace French with imperative define/limit and maximum task-count wording.
Four suites pass; full native maximum-count compound and browser review
remain open. Original pending findings: 256.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/fc73c77eb">Repair Tamazight exceeded WIP warning</a>. Thanks to xet7.</summary>

Replace French with native task-count and user-defined limit wording.
Checks retain the greater-than comparison. Four suites pass; full native
comparative grammar and browser review remain open. Pending: 257.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b2f574536">Repair Tamazight custom-field creation activity</a>. Thanks to xet7.</summary>

Replace Arabic activity prose with Tamazight creation wording, preserving
the field-value placeholder. Four suites pass; native verb morphology
and browser verification remain open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/318e5030b">Repair Tamazight numeric-field total description</a>. Thanks to xet7.</summary>

Restore aggregate and numeric custom-field wording, including display
selection and list-top location. Four regression suites pass; native
relative-clause grammar and browser verification remain open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d0175d46a">Repair Tamazight custom-field search operator</a>. Thanks to xet7.</summary>

Replace French with joined native field/custom terminology that the search
parser recognizes. Actual parser regressions verify quoted and unquoted
values. Four suites pass; native compound and browser review remain open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a4439d400">Repair Tamazight top and bottom rule destinations</a>. Thanks to xet7.</summary>

Replace two additional French position fragments using primary native
terms. Checks preserve opposite positions and the following genitive.
Four suites pass; complete native rule grammar and browser verification
remain open. Original flagged pending count stays at 258.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/af4faeb70">Repair Tamazight field-total checkbox wording</a>. Thanks to xet7.</summary>

Replace French with Tamazight aggregate and list-top wording supported by
primary dictionary entries. Regression checks distinguish a sum from a
count or summary. Four checks pass; complete native/browser review remains
open. Audit counts now show 258 pending original findings.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3567bf197">Review primary Kashmiri calendar vocabulary and grammar</a>. Thanks to xet7.</summary>

Record primary moon/seeing vocabulary and infinitive agreement evidence.
Complete sighting and astronomical-epoch labels remain under review; no
translation acceptance or browser verification is claimed.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/002e14d69">Review Kashmiri lunar terminology source reliability</a>. Thanks to xet7.</summary>

Record moon-spelling evidence and exclude a redirected dictionary URL.
The primary lookup returned no result; complete sighting/astronomical
labels stay pending, with no acceptance inferred from search snippets.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/06f88d5ed">Restore Quechua calendar-system heading meaning</a>. Thanks to xet7.</summary>

Replace clock-only wording with calendar/system/date-display components.
Four focused checks pass. Cross-variety reuse and full native/browser
validation remain low confidence and open in the dated audit.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2307b8332">Restore Quechua Jalali and ISO-week meanings</a>. Thanks to xet7.</summary>

Restore omitted calendar names and Gregorian/week identification; use
attested Simana for week. Four focused checks pass. Retained naming and
full compounds remain low confidence pending native/browser review.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/474a2909e">Correct Quechua calendar nouns in nine options</a>. Thanks to xet7.</summary>

Use the attested calendar noun instead of clock, preserving names and
qualifiers. Four focused checks pass. Retained modifiers and complete
native/browser review remain open; original pending findings stay at 259.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/529775d9c">Repair Tamazight card-count threshold wording</a>. Thanks to xet7.</summary>

Replace Arabic while retaining the if/more-than condition before the
numeric control. Four focused checks pass. Full conditional grammar and
native/browser verification remain open; original pending count is 259.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/267913e2f">Repair Tamazight board visibility restriction wording</a>. Thanks to xet7.</summary>

Replace French heading and private-only restriction, retaining allow,
only and private meanings. Four focused checks pass. Full plural grammar
and native/browser verification remain open; original pending count is 260.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c0edf1104">Repair Tamazight hidden-activities notification</a>. Thanks to xet7.</summary>

Replace Arabic, preserving all-activities and all-boards scope. Four
focused checks pass. Full plural grammar and browser validation remain
open; dated audit tracks 261 original pending findings.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/46090ad0e">Repair Tamazight support-page enabled label</a>. Thanks to xet7.</summary>

Use help/assistance vocabulary instead of French. Four focused checks pass;
passive status grammar and full native/browser verification remain open.
Dated audit tracks 262 original pending findings.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ca3d7dc9e">Review Tamazight invitation-acceptance ambiguity</a>. Thanks to xet7.</summary>

Reject a kiss mistranslation encountered through ambiguous Arabic search.
Primary dictionary evidence confirms the wrong sense; generic invitation
acceptance remains pending, with no ledger acceptance recorded.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/7dfbbecbd">Repair Tamazight board invitation notification</a>. Thanks to xet7.</summary>

Replace French with a new-invitation notification distinct from acceptance
status. Four focused checks pass. Recency and full native grammar remain
low confidence; dated audit tracks 263 original pending findings.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/91ebdcc27">Translate Tamazight Trello import instructions</a>. Thanks to xet7.</summary>

Replace cosmetically changed English prose, preserving exact Trello menu
labels and their order. Four focused checks pass. Full native/browser
validation remains open; dated audit tracks 264 original pending findings.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d1214818b">Clarify Tamazight filter single-quote character</a>. Thanks to xet7.</summary>

Identify the literal apostrophe with one-character wording; retain verified
value vocabulary. Four focused checks pass. Complete native grammar and
browser verification remain open in the dated translation audit.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ac4b1dcdc">Distinguish Tamazight filter quote and bracket terminology</a>. Thanks to xet7.</summary>

Replace conflated unsupported forms with distinct dictionary nouns and
revise whitespace wording. Four focused checks pass, preserving syntax.
Full grammatical/software adaptation review remains open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/04aba67e0">Translate Tamazight advanced-filter help and label</a>. Thanks to xet7.</summary>

Translate full prose while preserving exact examples and escaping. Four
focused checks pass; completeness again reports zero placeholders.
Technical wording remains low confidence; dated audit tracks 265 original
pending findings and broader native/browser verification.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/72b212a5d">Repair Tamazight filter-help escape syntax</a>. Thanks to xet7.</summary>

Restore exact executable examples. English prose remains pending; three
focused checks pass and completeness exposes one untranslated value.
The gate remains intact; translating the full help is still required.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/eb710395b">Repair Tamazight SMTP host label</a>. Thanks to xet7.</summary>

Replace Arabic with the attested computer-server compound, preserving SMTP.
Four focused checks pass. Port terminology remains open; dated audit keeps
266 original pending findings and broader native/browser validation work.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/584dbfc7c">Repair Tamazight SMTP host description</a>. Thanks to xet7.</summary>

Replace French with server-address and electronic-correspondence wording,
preserving SMTP. Four focused checks pass. Full native grammar and browser
validation remain open; dated audit tracks 266 original pending findings.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/42d65f377">Review Tamazight SMTP address and management terminology</a>. Thanks to xet7.</summary>

Verify dictionary address and administer/manage senses against the host
input. User email-address wording is unsuitable for the SMTP host. The
full plural/relative clause remains pending; no acceptance is recorded.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/89ebd29cc">Repair Tamazight minicard parent-display label</a>. Thanks to xet7.</summary>

Replace French wording and preserve the small-card distinction. Four
focused checks pass; parent metaphor and full native/browser validation
remain open. Dated audit tracks 267 original pending findings.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c4a40896b">Repair Tamazight custom product-name wording</a>. Thanks to xet7.</summary>

Replace an unflagged French label and restore its omitted product component.
Four focused checks pass. Custom-branding wording and modifier scope remain
low confidence; dated audit records 268 original pending findings.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a5edc6d3c">Repair Tamazight WIP activation label</a>. Thanks to xet7.</summary>

Replace an unflagged French label with Tamazight activation/limit components,
preserving WIP. Four focused checks pass. Numerical software-limit wording
remains low confidence; original pending findings remain at 268.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d6a358160">Repair Tamazight custom assetlinks labels</a>. Thanks to xet7.</summary>

Replace two French activation/content labels with Tamazight, preserving
assetlinks.json and JSON exactly. Four focused translation checks pass.
Custom terminology and full native/browser wording remain low confidence;
the dated audit tracks 268 pending findings and broader validation work.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d7bdf6ac6">Repair Tamazight private-board description</a>. Thanks to xet7.</summary>

Replace Arabic wording and restore view/edit actions from the English
members-only description. Four checks pass; complete native grammar and
browser validation remain under review.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/086a02734">Repair Tamazight SMTP TLS description</a>. Thanks to xet7.</summary>

Replace Arabic with verified native components for enabling TLS use on the
SMTP computer server. Preserve protocol names and the setting's action.
Four checks pass; full native phrasing and browser review remain open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/726abda52">Expand Veps software-sense evidence</a>. Thanks to xet7.</summary>

Record top-position forms and stationary/movement distinctions. Reject
summarize as arithmetic sum and frequency as software-parent proof; keep
full Finnish-prose findings pending until their native phrases are verified.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e702bdf0b">Review integer-constraint source evidence</a>. Thanks to xet7.</summary>

Document a primary dictionary's title and extraction limits, and reject
whole/complete or positive-number leads as proof of integer terminology.
Keep Tamazight numeric constraints pending without weakening their meaning.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9c7a845a3">Refresh both audit progress tables</a>. Thanks to xet7.</summary>

Refresh pending locale rows and totals together from current translations
and ledgers, retaining fix notes. Include newly pending locales, remove
resolved ones and reject inconsistent counts. Regression checks and the
real CLI refresh pass; this does not certify native translation quality.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c986121af">Repair Tamazight swimlane-height labels</a>. Thanks to xet7.</summary>

Replace three Arabic height labels with native components, preserving the
pixel unit and action/title agreement. Four checks pass; full native
phrasing, numeric-error terminology and browser review remain open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4f99247e8">Repair Tamazight approaching-deadline warning</a>. Thanks to xet7.</summary>

Replace French while preserving the due-time placeholder and approaching
versus overdue distinction. Four checks pass; full native grammar and
browser validation remain under review.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/776840a4c">Repair Moroccan analysis-stage terminology</a>. Thanks to xet7.</summary>

Replace uncertain analysis/structure wording in the Tamazight migration
label with verified Moroccan terms. Four checks pass; complete native
phrasing and active stage-ID translation integration remain open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/40491764c">Repair Moroccan authentication terminology</a>. Thanks to xet7.</summary>

Replace an uncertain Tuareg-derived authentication term in four Tamazight
labels with the verified Moroccan dictionary term. Preserve method/type
and default/display distinctions. Four checks pass; full review is open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f3d3aa4b2">Repair Tamazight card control labels</a>. Thanks to xet7.</summary>

Replace French parent-change and card-display labels using verified action
terms and existing card vocabulary. Four checks pass; full native grammar,
parent terminology and browser validation remain under review.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/027bdc446">Repair Tamazight multi-selection labels</a>. Thanks to xet7.</summary>

Replace five additional French move/copy, popup-title and color labels with
verified native components. Action and popup titles agree; move and copy
remain distinct. Four checks pass; complete native/browser review is open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/16232ae09">Repair Tamazight parent-prefix options</a>. Thanks to xet7.</summary>

Replace two French labels while retaining prefix/subtext placement and
full-path/single-parent distinctions. Four checks pass; adapted prefix
terminology and complete phrases still need native and browser review.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/7acd0f72c">Repair Tamazight full-path subtitle</a>. Thanks to xet7.</summary>

Replace French with verified native components while preserving the full
ancestor-path distinction. Four checks pass; full phrase grammar and
software metaphor still require native and browser review.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b93379067">Repair Tamazight parent-subtitle option</a>. Thanks to xet7.</summary>

Replace French with verified native subtitle and existing parent terms.
Preserve the distinction from full ancestor paths. Four checks pass;
adapted software metaphor, full grammar and browser review remain open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9669c2d84">Review Tamazight debug-predicate terminology</a>. Thanks to xet7.</summary>

Distinguish the dictionary's grammatical predicate from the parser's debug
option catalogue. Keep unsupported native computing terms pending and record
remaining French selector vocabulary without accepting a mismatched sense.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d32a96745">Replace French Tamazight existence-check error</a>. Thanks to xet7.</summary>

Adapted native wording preserves the existence-check meaning and format token.
Four checks pass. Full grammar and browser validation remain explicitly open
in the translation audit.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e4fb6c394">Review Tamazight parser-error terminology</a>. Thanks to xet7.</summary>

The audit rejects physical invalidity senses for parser errors and records
verified native vocabulary leads. Complete predicate and positive-integer
requirements remain open; no translation change is claimed.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ea286df3d">Replace French Tamazight overdue-time warning</a>. Thanks to xet7.</summary>

The warning uses adapted native wording and preserves its date placeholder.
Four checks pass. Exact deadline terminology, grammar and browser validation
remain explicitly open in the translation audit.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/75b0a015b">Keep translation audit summary short and current</a>. Thanks to xet7.</summary>

Repeated historical notes move to detailed evidence. Locale counts reconcile
with the live queue, including 167 pending Tamazight values. Regression
coverage prevents stale locale counts; all uncertainty remains tracked.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0ba2e0f6c">Replace French Tamazight OIDC caption label</a>. Thanks to xet7.</summary>

The configurable caption label uses adapted native wording and preserves OIDC.
Four checks pass. Interface-button metaphor, grammar and browser validation
remain explicitly open in the translation audit.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5e2a93287">Use native Tamazight computer-server wording</a>. Thanks to xet7.</summary>

An explicit primary-dictionary computer-server phrase replaces French wording.
Four checks pass. Protocol-support phrases and live rendering remain open
in the translation audit.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/94c8857fd">Trace migration progress translation gaps</a>. Thanks to xet7.</summary>

The audit distinguishes active raw stage IDs from unreachable legacy labels.
Active stages require translation keys and reactive integration; obsolete
board migrations must stay removed. No runtime change is claimed.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2c38b996b">Replace French Tamazight orphaned-card label</a>. Thanks to xet7.</summary>

The repair label uses adapted native vocabulary for orphaned cards. Four
checks pass; metaphor, agreement and progress-popup rendering remain open
for native and browser validation.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e424d4de6">Replace French Tamazight migration progress message</a>. Thanks to xet7.</summary>

The progress popup uses adapted Tamazight prose preserving the wait and board
migration meaning. Four checks pass. Native grammar, courtesy and browser
validation remain explicitly low confidence and open in the audit.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/947366780">Align Tamazight daily schedule wording</a>. Thanks to xet7.</summary>

The daily workflow label follows native lexical references and preserves the
time placeholder. Four checks pass. The adapted clause remains low confidence
pending native grammar and browser validation.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/23583a790">Replace French Tamazight numeric intervals</a>. Thanks to xet7.</summary>

Four interval labels preserve exact numbers and hour/minute distinctions with
native plural nouns. Four checks pass. Adapted phrases remain low confidence
pending native grammar and browser validation.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d1d06c706">Read primary IRCAM terminology for pending repairs</a>. Thanks to xet7.</summary>

The audit records primary dictionary entries, grammatical forms and limits
for pending software phrases. Component evidence does not close full-phrase
findings. No translation changed; pending counts remain unchanged.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/555b6631d">Review Tamazight interface-button terminology</a>. Thanks to xet7.</summary>

The audit rejects unrelated biological dictionary senses for the pending OIDC
button label and identifies a computing reference for further native research.
No uncertain value was accepted or replaced; progress counts are unchanged.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/6e3663c83">Correct Quechua named calendar nouns</a>. Thanks to xet7.</summary>

Dangi, Minguo and Hijri retain their names with the native generic calendar
noun. Four locale and ledger checks pass. Adapted compounds remain low
confidence pending full native phrase and browser validation.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/34dbfa64c">Repair Quechua day and recurrence labels</a>. Thanks to xet7.</summary>

Native day and daily recurrence terms replace English words with a language
prefix. Calendar toolbar wiring and four locale/ledger checks pass. Browser
verification and specific calendar compounds remain open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5c5ee40b6">Repair Quechua generic calendar noun</a>. Thanks to xet7.</summary>

The generic calendar label uses a native Cusco Collao dictionary term instead
of an untranslated noun with a language prefix. Four locale and ledger checks
pass. Specific calendar compounds and browser verification remain open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4f63929ee">Review Aromanian color terminology</a>. Thanks to xet7.</summary>

Primary dictionary pages and a color field study narrow the pending magenta
review. Nearby color names are not accepted as interchangeable. No translation
was changed; the dated audit records the remaining native evidence requirement.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5da10eee5">Review Tigre and Wolaytta calendar provenance</a>. Thanks to xet7.</summary>

An explicitly Tigrinya reference cannot validate the local Tigre calendar noun.
Wolaytta has an additional English calendar label with a language prefix.
The dated translation audit records both gaps and the required native research.
No uncertain translation was accepted; the progress consistency check passes.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/7f3a0d7db">Repair Tamazight rule name labels</a>. Thanks to xet7.</summary>

Generic rule name-input and sort labels use native Tamazight instead of French.
Native software name-field evidence and actual rule contexts are recorded.
Focused wrong-language checks and correction/token/completeness suites pass;
browser validation and the broader translation audit remain open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5b3ca809d">Repair Tamazight one-unit recurrence labels</a>. Thanks to xet7.</summary>

Legacy daily/hour/minute labels use Tamazight instead of French.
Native daily phrase and time-noun evidence is recorded; hourly/minute labels
are adaptations needing broader native fluency review. Focused interval and
wrong-language checks plus correction/token/completeness checks pass.
No current UI use was found, so browser execution is not claimed.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2bb54a30b">Retain Basque movement direction labels</a>. Thanks to xet7.</summary>

Restored destination/origin wording is retained after native terminology and
actual rule control/handler review. Direction mappings, restored values and
extra-copula negative checks pass, with review and completeness suites.
Two restored findings are resolved; broader style and browser review stay open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/946e1a29b">Retain Basque member and attachment subjects</a>. Thanks to xet7.</summary>

Correct restored generic subjects are retained after native terminology and
both add/remove rule control labels were reviewed. Subject/composition,
extra-copula negative and wiring checks pass, with review/completeness suites.
Two restored findings are resolved; named-subject and browser review stay open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b433730e3">Restore Afghan Uzbek cancellation spelling</a>. Thanks to xet7.</summary>

The Arabic-script cancellation label restores a missing alif.
Indexed native spelling support and failed full-source fetches are recorded.
Full orthographic validation remains low confidence; browser review is open.
Focused spelling/negative and correction/token/completeness checks pass.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/209d1088b">Review Basque named-subject integration</a>. Thanks to xet7.</summary>

Native grammar and source review confirm selected names follow the final
subject demonstrative in both controls and saved descriptions. The audit
records the required locale-aware construction; CSS alone cannot fix it.
Four restored findings remain open. Audit consistency checks pass.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1e4411183">Order Basque named rule subjects correctly</a>. Thanks to xet7.</summary>

Named controls precede the Basque noun phrase and its final demonstrative.
Saved descriptions follow the same DOM order; other locales and existing
translations are preserved. Locale positive/negative checks and all Jade
compilation pass. The browser control/persisted-description case is syntax
checked, not run: no local app is listening. Full native review stays open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0c51a3261">Join nonempty rule description fragments</a>. Thanks to xet7.</summary>

Saved descriptions skip empty controls and buttons when inserting separators,
without reading the browser frame-count global. Production-method execution
checks Basque order, English preservation, literal names, dates/times and
user details. Relevant suites pass; the browser case is registered but unrun.
Full native subject verification remains open in the translation audit.

</details>

**Developer tooling** - Mirror Git progress.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1896660a9">Match activity label badges to card labels</a>. Thanks to xet7.</summary>

Opened-card and sidebar label activities use the same rounded label badges,
named palette and custom-color text contrast as cards. Prose and rich label
content stay sanitized; only the trusted badge wrapper retains color styling.
Missing labels no longer throw. Positive/negative sanitization and palette
checks pass; the browser computed-color case was syntax checked, not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/95f026889">Render opened-card List dropdown titles</a>. Thanks to xet7.</summary>

The List picker renders its selected title and choices through the shared
security-aware viewer, supporting Markdown, emojis and permitted HTML.
Mouse and keyboard selection retain authorized card moves. Arrow keys,
Home, End, Enter, Space and Escape work without typing a list name.
Positive/negative movement and navigation checks pass. Browser policy cases
were syntax checked; a running application was unavailable for UI execution.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4a01cc9be">Restore Markdown heading sizes in card titles</a>. Thanks to xet7.</summary>

Minicard and opened-card headings retain relative sizes despite global and
mobile font resets. Card numbers are rendered outside Markdown title source
so heading syntax works. The shared viewer retains Admin Panel security
policies. Renderer and source checks pass; browser policy and computed-size
cases were syntax checked but could not run without a local application.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/93e61a1d6">Prefer authenticated GitHub CLI for mirror source metadata</a>. Thanks to xet7.</summary>

The mirror launcher reports CLI availability immediately. Authenticated gh api
reads issues, comments, pulls and releases with pagination and rate-limit
headers; incremental archive saving stays in place. Missing authentication
falls back to public HTTP API reads, and binary assets stream through HTTP.
CLI requests have bounded time/output; tokens stay outside logs and arguments.
Offline CLI, fallback, HTTP error, rate-limit and menu tests pass. No remote
mirroring or remote writes were executed.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/7c98c00d9">Skip archive.org recovery for retired WeKan branch links</a>. Thanks to xet7.</summary>

Missing or failed WeKan tree, blob and raw branch-content links skip Wayback
fallback, avoiding repeated historical lookups during mirroring. Live links
still download normally; full commit-hash links and other attachments retain
historical recovery. Offline positive and negative tests pass, including
network failures, attachment persistence and HTTP response handling.
No live mirroring or remote writes were run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/567c770c8">Stream Git transfer output to mirror logs</a>. Thanks to xet7.</summary>

Clone, fetch and push force progress output; these commands and merge stream
stdout/stderr into console and mirror logs. Inventory output remains captured.
Offline regression checks streaming and error propagation; no remote commands
were executed. The existing staged-menu tests pass.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/23de74853">Reuse established Git mirror checkout directories</a>. Thanks to xet7.</summary>

WeKan Git synchronization uses existing .tools/wekan-gitlab, Codeberg and
SourceForge checkouts, preserving dirty checkouts and validating the branch.
Git caches stay outside the content archive. Offline regression checks paths,
reuse and dirty-checkout rejection; no remote Git commands were executed.
The empty wrongly placed Git directory was removed locally.

</details>

**Translations** - Swedish due dates, Valencian terminology and reviewed
interface wording.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/da6762a48">Repair Inuktitut named calendar labels</a>. Thanks to xet7.</summary>

Dangi and Minguo retain specific names with the native calendar noun.
Focused checks keep them distinct from other calendars. The dated audit
records adapted naming and remaining native/browser verification.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/7ba02a179">Repair Tamazight Indian calendar label</a>. Thanks to xet7.</summary>

The Indian National Calendar uses adapted native wording while retaining
the national qualifier. Focused checks pass; the dated audit records low
confidence full naming and remaining native/browser verification.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/bd4a6a494">Repair Tamazight Hebrew calendar label</a>. Thanks to xet7.</summary>

The English calendar name uses adapted native Moroccan terminology.
Focused checks preserve a distinct calendar name. The dated audit records
low confidence full naming and remaining native/browser verification.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/8422804a4">Repair Tamazight Buddhist calendar label</a>. Thanks to xet7.</summary>

The English calendar name uses adapted native Moroccan terminology.
Focused checks retain its distinction from the Islamic calendar. The dated
audit records vocabulary evidence and remaining native/browser review.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d36499d43">Validate Basque checklist-item subject</a>. Thanks to xet7.</summary>

Correct generic wording is retained with check/uncheck composition tests.
The dated audit distinguishes generic grammar from the still-open named
item sentence and browser verification.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b8e746289">Repair Inuktitut command forms</a>. Thanks to xet7.</summary>

Edit and Delete use native software imperatives instead of passive states.
Focused checks preserve distinct commands and tokens. The dated audit
records valid Roman spelling and remaining browser verification.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d5d2bf518">Repair Tamazight registration and summary labels</a>. Thanks to xet7.</summary>

Registration, log and summary use native Moroccan software terminology.
Focused checks preserve distinct summary meaning and all tokens. The dated
audit records the source evidence and remaining browser verification.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b8c6fed39">Repair wrong-language date-format labels</a>. Thanks to xet7.</summary>

Akan, Bosnian, Slovenian, Breton and Tamazight date-format choices show the
actual selectable patterns. Correct localized notation elsewhere is kept.
Focused checks pass; the dated audit records the 18 repairs and UI limits.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/33cc02ced">Clarify Basque incomplete checklist predicate</a>. Thanks to xet7.</summary>

The incomplete trigger describes marking incomplete rather than leaving
work unfinished. Focused checks verify generic composition and option wiring.
The dated audit keeps named-clause grammar and browser review open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9024c6cf8">Repair Tamazight layout-change label</a>. Thanks to xet7.</summary>

The card layout action uses the native edit verb instead of French.
Focused checks preserve the existing edit label. The dated audit also
records missing cause/timing evidence in native account-warning references.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/65a0f76ab">Repair Breton string-template label</a>. Thanks to xet7.</summary>

The custom string formatter uses Breton software nouns instead of French.
Focused checks preserve its distinction from plain text and all tokens.
The dated audit records adapted phrasing and remaining browser review.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f9e3111b0">Repair Breton currency terminology</a>. Thanks to xet7.</summary>

Currency fields and their code labels use Breton wording with a distinct
code meaning. Focused checks pass; the dated audit keeps adapted compounds
and browser verification open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0aeac5744">Repair Breton zoom terminology</a>. Thanks to xet7.</summary>

Zoom controls use opposing Breton size verbs and level wording consistent
with the existing prompt. Focused checks pass; the dated audit keeps full
phrase and browser verification open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3539edd8b">Repair Breton custom-field terminology</a>. Thanks to xet7.</summary>

Checkbox, dropdown, options and custom-field headings use Breton vocabulary.
Single and multi-select labels stay consistent and distinct from checkbox.
Focused checks pass; the dated audit keeps compound and browser review open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c8a14d2d0">Repair Breton action labels</a>. Thanks to xet7.</summary>

Preview, draft cancellation, override removal and comment submission use
Breton wording matching their controls. Focused checks pass; the dated audit
keeps adapted phrases, broader language and browser review open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/6962b2cc4">Repair Breton card and number labels</a>. Thanks to xet7.</summary>

Normal-card type and singular counters share Breton card terminology.
Numeric fields use the native number noun and stay distinct from text.
Focused checks pass; the dated audit keeps broader and browser review open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b0f7f924f">Repair Breton selection and color labels</a>. Thanks to xet7.</summary>

Three French labels become Breton; empty selection stays distinct from an
unknown value. Focused checks pass. The dated audit keeps broader native
and browser verification open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/bb65bf79d">Repair Breton navigation and templates</a>. Thanks to xet7.</summary>

Six French labels become Breton using native software vocabulary. Template
and text labels stay consistent; return and home remain distinct. Focused
checks pass; the dated audit keeps broader and browser review open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5bf97e219">Retain reviewed Basque S3 terminology</a>. Thanks to xet7.</summary>

Native Basque storage specifications support the restored S3 bucket term.
Focused field-context checks pass; the dated audit resolves one restored
finding and keeps broader language and browser verification open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/7998e6aff">Review Basque incomplete rule wording</a>. Thanks to xet7.</summary>

Native software guidance distinguishes completion status from leaving work
unfinished. The dated audit records the full-clause repair requirement; no
uncertain value is accepted. Focused rule and audit checks pass.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a123f9428">Repair Breton white color label</a>. Thanks to xet7.</summary>

White uses native gwenn, with focused checks distinguishing gray and silver.
The dated audit records dictionary evidence and passing translation checks;
broader language and browser verification remain open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2a86c331f">Repair Breton palette color names</a>. Thanks to xet7.</summary>

Dark green, gold and silver use dictionary-attested Breton color meanings.
The valid shared word gris is retained. Focused translation checks pass;
the dated audit keeps broader language and browser review open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/092678576">Repair Breton common controls and diagnostics</a>. Thanks to xet7.</summary>

Fourteen French labels become Breton using native software vocabulary.
Equivalent details, files and confirmation controls stay consistent; source
and translated text remain distinct. Focused checks pass. The dated audit
keeps adapted compounds, broader unflagged values and browser review open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/009fa7dde">Cross-check Moroccan translation references</a>. Thanks to xet7.</summary>

The dated audit records independent native calendar, user and click evidence
for dictionary components. Full phrases and invalidated Tuareg provenance
remain open; no pending finding was accepted from component evidence.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0dc75532b">Repair Breton WIP group and swimlane controls</a>. Thanks to xet7.</summary>

Four French or mixed labels become distinct Breton application, group
creation and swimlane actions using native software terminology. Focused
translation and template checks pass. Adapted full phrases and browser review
remain open in the dated audit.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a0aacc7a9">Preserve native Silesian raw database wording</a>. Thanks to xet7.</summary>

Native vocabulary evidence supports retaining the shared raw-file label and
MongoDB 3 identity. Focused checks pass and its last flagged finding resolves.
The dated audit distinguishes native vocabulary from an exact standardized
compound; browser and broader language review remain open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1e62fca35">Retain native Basque checklist completion wording</a>. Thanks to xet7.</summary>

Native software usage and actual generic checklist context support the
existing completed predicate. Focused checks pass; one restored finding
resolves. Incomplete transition, named clauses and browser review remain open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5400a0ce9">Document Inuktitut recurrence and reset review</a>. Thanks to xet7.</summary>

The dated audit distinguishes fresh-card recurrence from in-place checklist
reset and records primary repeat/again affix evidence. Six headings/off
translations remain open pending complete native wording and browser review.
Existing frequency translations and focused checks remain intact.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5bf34bc48">Preserve native Inuktitut New label</a>. Thanks to xet7.</summary>

The existing syllabic label matches native software terminology and actual
admin creation controls. Focused value/context checks pass. The dated audit
also records why Latin orthography alone cannot prove wrong-language prose;
uncertain phrases and browser review remain open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1ba55107f">Repair Breton date activity and execution labels</a>. Thanks to xet7.</summary>

Four French labels become Breton while retaining distinct modification,
last-activity and last-execution meanings. Native terminology and focused
translation checks support the repairs; adapted timestamp prefixes and browser
formatting remain open in the dated audit.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ea1df33fa">Repair Inuktitut LDAP failure diagnostic</a>. Thanks to xet7.</summary>

A syllabic connection-failure adaptation preserves the server-error placeholder.
The native localization guide supports the failure term; network noun and full
sentence grammar remain low confidence. Focused checks pass, and the dated
audit records 289 pending findings with native/browser review still open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/45d232fda">Repair Inuktitut rule toggle tooltip</a>. Thanks to xet7.</summary>

A syllabic adaptation preserves both enable and disable actions for this rule.
Native terminology supports component terms; full command grammar remains low
confidence and needs native/browser review. Focused translation checks pass;
the dated audit records 290 pending and 13 restored findings remaining.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/669f0b31d">Repair Breton accessibility terminology</a>. Thanks to xet7.</summary>

Three French page labels become Breton, and two prior repairs now distinguish
accessibility from access. Title/body fields, enabled state and the warning's
not-added-yet meaning remain distinct. Focused checks pass; full adapted
sentence and browser review remain open in the dated audit.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e3d6a1ace">Repair Breton modification and access labels</a>. Thanks to xet7.</summary>

Four French values become Breton software labels. Last access time remains
separate from last modification despite its legacy key name. Focused locale,
placeholder and completeness checks pass; adapted access wording and browser
review remain open in the dated translation audit.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c4db1c19c">Document Basque completion review limits</a>. Thanks to xet7.</summary>

Native references establish completion vocabulary and negation spelling.
The audit records an existing runtime predicate mismatch between completion
and incompletion. Full action phrases remain open for semantic review. No
translations or queue counts changed during this evidence review.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1439c4c61">Validate Basque checklist check actions</a>. Thanks to xet7.</summary>

Retain checked and unchecked temporal phrases after native software terminology
and generic-trigger review. The audit tracks 13 restored findings remaining.
Focused coverage verifies distinct actions; named-item and browser review remain
open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/aba731e82">Validate Basque generic card movement wording</a>. Thanks to xet7.</summary>

Retain the restored complete temporal predicate after checking native grammar
and actual trigger order. Directional fragments and browser review remain open.
The dated translation audit records progress and focused regression coverage.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9f7f94825">Validate Valencian peach color wording</a>. Thanks to xet7.</summary>

The restored native peach color label is retained after checking color usage
and the actual pale-peach palette swatch. Exact review and distinct-color
checks pass; the dated audit resolves one restored finding without replacing
correct wording. Browser color-picker validation remains open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/7c2e8f891">Repair Breton repository labels</a>. Thanks to xet7.</summary>

Repository name, creation and not-found labels replace French wording using
attested Breton software terminology. Exact ledgers, positive/negative label
checks and completeness pass. The dated audit preserves remaining complete
phrase and browser validation work; dormant strings stay in translation scope.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/8f96ec2bc">Repair Inuktitut rule state labels</a>. Thanks to xet7.</summary>

Rule enabled/disabled labels use distinct syllabic present-state wording.
Exact ledgers, positive/negative state labels and completeness checks pass.
The dated audit records software-use evidence and keeps this adapted pair
open for native language and browser review as a low-confidence replacement.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/feab87240">Repair Breton custom product name label</a>. Thanks to xet7.</summary>

Custom product name replaces French wording and restores the product qualifier.
Exact correction, positive/negative label and completeness checks pass. The
dated audit records vocabulary evidence and remaining phrase/browser review.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a7e99aea5">Repair Breton WIP and webhook settings labels</a>. Thanks to xet7.</summary>

WIP edit/enable/set/error/group labels and the webhook-disable label replace
French wording with Breton. The group title describes grouping instead of an
enable action; technical WIP/webhook names remain literal. Exact ledgers,
positive/negative label checks and completeness pass. The dated audit records
terminology evidence and remaining full-phrase/browser validation.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/06af4a4a8">Repair Inuktitut weekly frequency labels</a>. Thanks to xet7.</summary>

Card recurrence and checklist reset replace Greenlandic weekly wording with
the native Inuktitut term attested in a bilingual Inuit Association form.
Existing backup wording agrees; daily/weekly/monthly meanings stay distinct.
Exact ledgers, positive/negative frequency checks and completeness pass.
The dated audit records two resolved findings and retains longer phrase,
low-confidence and live browser verification work.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9a511101d">Repair Inuktitut daily and monthly frequencies</a>. Thanks to xet7.</summary>

Card recurrence and checklist reset use native Inuktitut daily/monthly labels
instead of Greenlandic-seeded wording. Existing backup labels agree; native
Nunavut sources support the terms. Focused positive/negative label checks,
placeholder inventories, correction/review ledgers and completeness pass.
The dated audit records four resolved findings and keeps longer phrases and
live browser verification open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e74dd20cc">Use consistent Acehnese deadline labels</a>. Thanks to xet7.</summary>

Due-date and today labels replace Indonesian/Malay wording with consistent
Acehnese vocabulary. Countdown placeholders stay intact. Adapted deadline
compounds have low confidence and still require native contextual review.
Exact correction/review checks, focused locale tests and completeness pass;
the dated audit records evidence and remaining browser/language validation.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9e34218c7">Fix Thai rule action linking-word composition</a>. Thanks to xet7.</summary>

Thai action predicates omit the redundant equative word through the shared
reactive helper. Correct Thai wording stays unchanged; other locales and
stored trigger identifiers are preserved. Restored Thai linking-word review
is resolved. Positive/negative helper checks, exact ledgers, completeness and
Jade compilation pass. Browser rule-creation coverage is syntax-checked;
no local application is running, so live browser execution remains open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2cabcdb17">Replace Spanish rule actor label in Basque</a>. Thanks to xet7.</summary>

Optional rule username fields use the Basque actor question Nork: instead
of Spanish por. Native grammar and actual template context support the label.
Correction/review ledgers, rule-helper checks and locale completeness pass.
The dated audit keeps restored add/remove noun-case and ordering defects open;
complete trigger fluency and live browser execution are not yet verified.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4b1c92cb5">Repair Breton optional and name labels</a>. Thanks to xet7.</summary>

Optional/group-name and full/display/short-name fields replace French wording
with Breton. The group-name placeholder restores its missing group noun;
three name meanings stay distinct. Correction, retained-value, placeholder
and locale-completeness checks pass. The dated audit records terminology
evidence and remaining compound-phrase/browser review.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/619eeb1c7">Repair Breton email, webhook and server labels</a>. Thanks to xet7.</summary>

French-seeded email-address, webhook-name and server-error labels now use
Breton wording with native software terminology. Exact correction and
unchanged-value checks, placeholder preservation and locale completeness
pass. The dated audit records evidence and remaining contextual/browser work.

</details>

**Languages updated:** Acehnese, Afrikaans, Akan, Albanian, Amharic, Arabic, Aragonese, Armenian, Aromanian, Assamese, Asturian, Aymara, Azerbaijani, Bambara, Bangla, Bashkir, Basque, Belarusian, Bhojpuri, Bislama, Bosnian, Breton, Bulgarian, Buriat, Burmese, Cantonese, Catalan, Central Kurdish, Cherokee, Chinese, Chuvash, Cornish, Corsican, Croatian, Czech, Danish, Dutch, Dzongkha, English, Esperanto, Estonian, Ewe, Faroese, Fijian, Filipino, Finnish, Flemish, French, Friulian, Fula, Galician, Ganda, Georgian, German, Greek, Guarani, Gujarati, Haitian Creole, Hausa, Hawaiian, Hebrew, Hindi, Hungarian, Icelandic, Igbo, Indonesian, Inuktitut, Irish, Italian, Japanese, Javanese, Kalaallisut, Kannada, Kashmiri, Kashubian, Kazakh, Khmer, Kinyarwanda, Klingon, Konkani, Korean, Kurdish, Kyrgyz, Ladin, Latin, Latvian, Lithuanian, Luxembourgish, Macedonian, Maithili, Malagasy, Malay, Malayalam, Maltese, Manx, Marathi, Mongolian, Moroccan Arabic, Māori, Nahuatl, Neapolitan, Nepali, North Ndebele, Northern Sami, Northern Sotho, Norwegian Bokmål, Nyanja, Occitan, Odia, Oromo, Papiamento, Pashto, Persian, Polish, Portuguese, Punjabi, Quechua, Romanian, Romansh, Rundi, Russian, Samoan, Sardinian, Scottish Gaelic, Serbian, Shona, Sicilian, Silesian, Sindhi, Sinhala, Slovak, Slovenian, Somali, Southern Sotho, Spanish, Standard Moroccan Tamazight, Swahili, Swati, Swedish, Tajik, Tamil, Tatar, Telugu, Thai, Tibetan, Tigre, Tigrinya, Tok Pisin, Tongan, Tsonga, Tswana, Turkish, Turkmen, Ukrainian, Upper Sorbian, Urdu, Uyghur, Uzbek, Valencian, Venda, Veps, Vietnamese, Volapük, Walloon, Waray, Welsh, Western Frisian, Wolaytta, Wolof, Wu Chinese, Xhosa, Yakut, Yiddish, Yoruba, Zulu

<details>
<summary><a href="https://github.com/wekan/wekan/commit/059d1fe4a">Repair Breton board view and comment labels</a>. Thanks to xet7.</summary>

Replace nine French-seeded board view, collapse/expand and comment labels.
Preserve opposite actions and proper Gantt/vendor names. Exact-value,
placeholder and locale checks pass; full contextual phrase and live browser
review remain open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/cdff2d19d">Repair Breton diagnostic and migration statuses</a>. Thanks to xet7.</summary>

Replace fourteen French-seeded diagnostic/status values. Pending now means
waiting rather than running; complete and failed remain distinct. Exact-value,
placeholder and locale checks pass; adapted phrase grammar and live browser
review remain open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9ccd4b8ce">Repair Breton entity and lockout view labels</a>. Thanks to xet7.</summary>

Replace fifteen French-seeded view, archive, template, action and lockout
labels. Preserve title/board placeholders and lockout/status distinctions.
Exact-value, placeholder and locale checks pass; adapted phrase grammar and
live browser review remain open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d95b0dd5c">Repair Breton creation and movement labels</a>. Thanks to xet7.</summary>

Replace fourteen French-seeded or mixed creation, movement and entity labels.
Preserve card-to-board creation, opposite top/bottom and copy/move actions.
Exact-value, placeholder and locale checks pass; adapted phrase grammar and
live browser review remain open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/bb51e1fcf">Repair Breton navigation and export controls</a>. Thanks to xet7.</summary>

Replace eighteen French-seeded navigation, import/export, checklist,
attachment and cancellation labels. Preserve opposite actions, equivalent
popup labels and PDF. Exact-value, placeholder and locale checks pass;
adapted phrase grammar and live browser review remain open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/961713c56">Repair Breton filter and account status labels</a>. Thanks to xet7.</summary>

Replace eight French-seeded shortcut, filter, status and migration labels.
People status wording preserves enabled/disabled login, separate from lockout.
Exact-value, placeholder and locale checks pass; adapted phrase grammar and
live browser review remain open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/fb0b34b7d">Repair Breton selection and filter controls</a>. Thanks to xet7.</summary>

Replace ten French-seeded selection, color, board and attachment labels.
Preserve distinct copy/move actions and adding filtered cards to selection.
Exact-value, placeholder and locale checks pass; adapted phrase grammar and
live browser review remain open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/824dd005e">Validate restored Danish age label</a>. Thanks to xet7.</summary>

Retain correct Danish age wording with native dictionary evidence, protecting
it against the Swedish pulled replacement. Exact review and correction suites
pass. No current rendered use was found; broader browser review remains open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/bc26fa890">Repair Galician attachment trigger agreement</a>. Thanks to xet7.</summary>

Use masculine attachment-specific actions, preserving shared feminine labels.
Repair Portuguese regional attachment/card fragments. New keys reuse existing
translations in other locales. Agreement, all-locale reuse, token inventories
and real Jade compilation pass; browser regression is added and syntax-checked.
Live browser execution and broader translation review remain open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/afbff51df">Repair Basque rule-trigger verb composition</a>. Thanks to xet7.</summary>

Replace Spanish es with Basque da and omit the redundant linking verb in
Basque triggers whose action labels already contain the temporal clause.
Preserve other languages and reactive language changes. Node and Jade checks
pass; browser regression is added and syntax-checked. Browser execution and
full restored phrase review remain open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/6aa5991de">Repair restored Acehnese translation meanings</a>. Thanks to xet7.</summary>

Repair cancellation, text, connection-success and no-assignee labels, including
a Malay-seeded filter. Structural checks pass; complete assignment/connection
phrase grammar and browser validation remain open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/019040ce1">Repair Greenlandic Indian national calendar language</a>. Thanks to xet7.</summary>

Translate the English calendar label using native India, national and calendar
vocabulary. Structural checks pass and Member Settings UI regression is added
and syntax-checked. Full native compound review and browser execution remain
open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/39af6aae5">Preserve native Veps and Valencian words during translation filling</a>. Thanks to xet7.</summary>

Retain reviewed Veps Server and Valencian Errors even though their spelling
matches English. Protect only the matching locale/key pairs from filling.
Positive and negative CLI fixtures verify preserved nouns, translated prose
and other locales. Completeness and human-preference checks pass; broader
wrong-language and fluency review remains open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/49bd242c9">Repair Breton rule-editor field and action language</a>. Thanks to xet7.</summary>

Replace eight French-seeded name, recipient, date-operation, color and swimlane
labels with Breton. Structural translation checks pass; complete shared trigger
grammar and browser rendering remain under review.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a9ea9d462">Repair Breton completion-state language</a>. Thanks to xet7.</summary>

Replace three French-seeded completion labels using existing Breton activity
vocabulary, preserving completed and made-incomplete states. Structural checks
pass; complete shared trigger grammar and browser review remain open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/48c7e8aa4">Repair Breton date-change trigger language</a>. Thanks to xet7.</summary>

Replace four mixed French/Breton date-change labels, preserving received,
start, due and end fields and set-or-changed behavior. Structural translation
checks pass; complete phrase and browser review remains open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ba815b531">Repair Breton restore control language</a>. Thanks to xet7.</summary>

Four French-seeded restore controls reuse existing Breton terminology.
Preserve board and all-data scope. Structural checks pass; native phrase
and browser review remain open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/698acc666">Repair Breton migration and recurrence language</a>. Thanks to xet7.</summary>

Nine French-seeded migration, recurrence and status labels become Breton.
Estimated-time wording remains provisional for native review. Structural
checks pass; complete phrase and browser review remain open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ed962d026">Repair Breton list menu language</a>. Thanks to xet7.</summary>

Three French-seeded list name, template and insertion labels reuse Breton
terminology. Preserve template scope and after-list insertion. Structural
checks pass; native phrase and browser review remain open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/04510ecd2">Repair Breton card and missing item language</a>. Thanks to xet7.</summary>

Six French-seeded card controls and missing-list/team messages become Breton.
Preserve archive meaning and exact placeholders. Structural checks pass;
native phrasing and browser review remain open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0a3320e69">Repair Breton attachment and upload language</a>. Thanks to xet7.</summary>

Twelve French-seeded attachment/export/upload labels reuse Breton terminology.
Distinguish upload from download. Structural checks pass; complete phrase
and browser review remain open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e7f8f5a13">Repair Breton board and filter control language</a>. Thanks to xet7.</summary>

Ten board privacy/title/filter controls replace French or incorrect item
terminology with Breton. Preserve visibility and filter meanings. Structural
checks pass; native phrasing and browser review remain open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/6af6d3ac3">Repair Breton account control language</a>. Thanks to xet7.</summary>

Seven French-seeded login, logout, username and password controls use Breton
software terminology. Preserve opposite actions and password meanings.
Structural checks pass; native phrase and browser review remain open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3bddd8e14">Repair Breton date rule field language</a>. Thanks to xet7.</summary>

Seven French-seeded date-rule fields and activity labels reuse existing
Breton terminology. Preserve start, due, end and received distinctions.
Structural checks pass; assembled grammar and browser review remain open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9f4e6a56f">Repair Breton voting control language</a>. Thanks to xet7.</summary>

Six French-seeded voting/public-board labels become Breton. Preserve vote
choices, deletion confirmation and board visibility. Structural checks pass;
native phrasing and browser review remain open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/14cb8393b">Repair Breton organization and watch language</a>. Thanks to xet7.</summary>

Eleven French-seeded organization, watch and read-notification controls reuse
existing Breton terminology. Preserve opposite actions and states. Structural
checks pass; native phrasing and browser review remain open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/dda942c11">Repair Breton sorting control language</a>. Thanks to xet7.</summary>

Fourteen French-seeded sorting labels reuse existing Breton terminology.
Preserve manual, numeric, board and due-date ordering choices. Structural
checks pass; native phrasing and browser review remain open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/66c45f644">Repair Breton calendar month navigation language</a>. Thanks to xet7.</summary>

Replace French previous/next month labels with native Breton terminology.
Preserve navigation direction. Structural checks pass; browser review remains
open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c576850ef">Repair Breton removal and update action language</a>. Thanks to xet7.</summary>

Twelve French-seeded removal/update actions and related labels reuse existing
Breton terminology. Preserve membership removal versus account deletion.
Structural checks pass; assembled grammar and browser review remain open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/000d7ee63">Repair Breton automation control language</a>. Thanks to xet7.</summary>

Nineteen French-seeded rule, trigger, action and item labels reuse existing
Breton terminology. Correction/review checks pass; shared clause grammar
and native/browser review remain open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a4aa7e3e7">Repair Breton add and user selection language</a>. Thanks to xet7.</summary>

Seventeen French-seeded add/item labels and user choices reuse existing
Breton terminology. Correct the month label independently of the Me choice.
Structural checks pass; native phrase/browser review remains open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/7c44e4f55">Repair Breton avatar and profile control language</a>. Thanks to xet7.</summary>

Ten French-seeded avatar, profile and notification controls reuse existing
Breton vocabulary. Preserve the supported profil loan noun and translate
surrounding prose. Structural checks pass; native/browser review stays open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/7223612e7">Repair Breton settings and team control language</a>. Thanks to xet7.</summary>

Sixteen French-seeded settings, permissions and team controls reuse existing
Breton vocabulary and native software terminology. Correction/review checks
pass; complete phrase and browser review remain open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/98947b824">Repair Breton date heading and validation language</a>. Thanks to xet7.</summary>

Fourteen French-seeded date headings, filters, validation messages and hour
labels become Breton. Preserve start/received/due/end distinctions and
validation meaning. Structural checks pass; native/browser review stays open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/787ffdf74">Repair Breton date and duration control language</a>. Thanks to xet7.</summary>

Eleven French-seeded date, duration, remaining-time and filter labels reuse
existing Breton terminology. Preserve elapsed duration versus clock-time
meaning. Correction/review checks pass; native and browser review stays open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/cd100eeaa">Repair Breton swimlane deletion confirmation</a>. Thanks to xet7.</summary>

Replace the French title with existing Breton deletion/swimlane terms.
Preserve the confirmation question. Correction and placeholder checks pass;
whole-phrase and browser review remain open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/625436b63">Translate Breton copy and move control language</a>. Thanks to xet7.</summary>

Fourteen French/English copy, move, template, checklist and account labels
become Breton using existing nouns and native software action verbs.
Preserve copying/moving/deleting distinctions and confirmation semantics.
Correction and placeholder checks pass; full phrase/browser review stays open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b1170bc33">Repair Breton archive interface language</a>. Thanks to xet7.</summary>

Fifteen French-seeded archive actions, titles and states become Breton.
Preserve archive/deletion distinction, target objects and confirmation/empty
states. Exact correction and placeholder checks pass; native inflection and
live browser review remain open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a196c64eb">Repair Galician member trigger agreement</a>. Thanks to xet7.</summary>

Member and assignee subjects use persoa to agree with shared added/removed
participles. Regression checks generic/specific phrases and actual template
keys; all correction records pass. Attachment agreement and live browser
verification remain open in the audit.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/64f1d7367">Validate Valencian assigned-card shortcut wording</a>. Thanks to xet7.</summary>

Retain correct filter/assignment meaning against the current-user assignee
hotkey. Possessive agreement is valid; the reference recognizes dialect
variants. Exact review checks pass; preferred Valencian regional style and
browser validation remain open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a06bf0cca">Fill Bambara Hijri calendar epoch labels</a>. Thanks to xet7.</summary>

Two English placeholders become provisional full Bambara labels, retaining
table-based calculation and distinct civil/astronomical starting epochs.
Correction and placeholder checks pass. Epoch compounds and astronomy
terminology remain low confidence and require native review; browser not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/6db6c7b16">Translate Breton board and control popup titles</a>. Thanks to xet7.</summary>

Twelve French-seeded titles become Breton for board/list/label actions and
date/language changes. Preserve creation/edit/delete distinctions and
confirmation questions. Exact correction and placeholder checks pass;
native inflection and browser review remain open in the audit.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b72b9d1fd">Repair Breton member and label interface language</a>. Thanks to xet7.</summary>

Six unflagged French labels become Breton for member assignment/management,
member filtering and labels. Preserve action, plural and absence meanings
using existing terms and native software vocabulary. Exact correction and
placeholder checks pass; broader language and browser review remain open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/87e2ed6fa">Repair Breton assignee label language</a>. Thanks to xet7.</summary>

Replace three French labels with Breton assigned-person/absence wording.
Retain the correct no-assignee label using assignment terminology evidence
and existing assigned-only wording. Exact correction/review checks pass;
broader language and browser verification remain open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/04711b646">Use evidenced Sardinian magenta colour wording</a>. Thanks to xet7.</summary>

Use published Sardinian fùcsia for the CSS magenta label. Both CSS names
have the same #ff00ff value as WeKan's colour mapping. All correction checks
pass; broader language and browser validation remain open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e4860ab8e">Localize Greenlandic Buddhist calendar label</a>. Thanks to xet7.</summary>

Replace the English-only placeholder with a Greenlandic phrase using
published terminology and the existing Hebrew-calendar naming pattern.
Correction and calendar checks pass. The adapted phrase still requires
native inflection review; browser and wider language verification stay open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/780f51f5d">Repair Veps authentication cancel label</a>. Thanks to xet7.</summary>

Use Heitä for 2FA cancellation, consistent with the existing general label
and native MediaWiki login/password-reset controls. Exact correction and
placeholder checks pass. Broader Veps and browser verification remain open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/66a3da76c">Repair Acehnese no-label filter language</a>. Thanks to xet7.</summary>

Replace Indonesian filter wording with the existing Acehnese absence label,
which is retained unchanged. Exact correction/review and placeholder checks
pass. Native technical terminology, other mixed filters and browser review
remain open in the dated audit.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4ddcb81c9">Validate Valencian S3 descriptions</a>. Thanks to xet7.</summary>

Retain three correct descriptions for bucket name, endpoint URL and numeric
port, including literal on-premise example hostname. Actual settings control
bindings and exact review records were checked. Storage connectivity and
browser verification remain open; no correct translations were overwritten.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c5c91129b">Fill Manx Coptic calendar label</a>. Thanks to xet7.</summary>

Replace the English-only placeholder with Feaillere Coptagh. The calendar
noun is dictionary-attested; the adjective is provisional and needs native
terminology review. Calendar and correction tests pass. The audit retains
this confidence limit and the full language/browser verification scope.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f52ab6adf">Repair Galician card completion action wording</a>. Thanks to xet7.</summary>

Two unflagged actions replace Portuguese cartão with Galician tarxeta and
agreeing feminine complete/incomplete adjectives. Regression checks actual
card-action dropdown wiring, distinct actions and Portuguese-word rejection.
All correction records pass; browser and broader grammar review remain open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/287e99dd2">Correct Galician schedule noun and validate idle labels</a>. Thanks to xet7.</summary>

Galician Schedule uses Programación for the historical cron heading and
recurrence dropdown. Danish Schedule and Basque/Valencian idle states retain
correct wording. Exact correction/review tests pass; no current consumers
found. Full language and browser validation remain open in the audit.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/264ca788c">Repair Valencian reflexive imperative and validate settings</a>. Thanks to xet7.</summary>

Add yourself now uses Afegiu-vos with matching imperative/reflexive person.
Retained 30 correct keyboard, board-setting, cover, zoom and import values.
The maintainer release command included these edits in v11.79 preparation.
All correction and review checks pass. Checklist and regional wording remain
under review; this entry records the outcome without editing released notes.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/25818620c">Validate Valencian lockout and migration wording</a>. Thanks to xet7.</summary>

Retained 32 correct lockout, scheduled maintenance and migration outcome values.
Negation and all-user/all-migration scopes remain intact. Exact review checks
pass; technical loans and broader regional language review remain open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e4a846162">Repair Valencian checklist prose</a>. Thanks to xet7.</summary>

Six ordinary rule/display labels now use existing localized checklist
terminology
instead of mixed English or joined words. Preserve line mapping, original order,
all-item and finished-list scopes. Regression and correction checks pass;
search tokens and broader language/browser verification remain under review.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/aa1006207">Repair Valencian checked-item prose and validate display labels</a>. Thanks to xet7.</summary>

Checked-item visibility uses localized checklist terminology. Retained 29
correct display, date/upload and translation-management values. Scope, zoom
range and no-undo warnings remain intact. Correction and review checks pass;
color/search terminology and wider language/browser review remain open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ff7e2b082">Validate Valencian accessibility and storage labels</a>. Thanks to xet7.</summary>

Retained 31 correct accessibility/storage, connection and scheduled-interval
labels. Connection outcomes and interval frequencies remain intact. Exact
review checks pass; nine restored Valencian findings still need review.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9111dcfbe">Validate Thai interface and search wording</a>. Thanks to xet7.</summary>

Retained 50 correct labels, time units, search vocabulary and storage product
names. Exact review checks pass. Shared passive trigger composition and broader
Thai grammar/browser validation remain open; no translation values changed.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/93f284c8a">Correct Swedish Due Cards meaning</a>. Thanks to xet7.</summary>

Three labels now describe cards with due dates rather than only overdue cards.
Actual selection and sorting include future deadlines. A regression drives the
real helper with past and future dates; correction checks pass. Browser
verification and the wider translation audit remain open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4da4c40e4">Validate Swedish and Arabic restored wording</a>. Thanks to xet7.</summary>

Retained seven Swedish and 23 Arabic/Darija values. Negation, recurrence
frequencies, global-admin exception and no-undo warnings remain intact.
Exact review checks pass; wider language/browser verification remains open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/69b8202ed">Validate short labels and localized JSON example</a>. Thanks to xet7.</summary>

Retained three Asturian labels, Tamil and Telugu Who headings and the Uyghur
three-card JSON example. Literal property names remain unchanged while example
values are localized. Exact review checks pass; uncertain cancellation and
Breton wording and wider language/browser verification remain open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d3ad084e7">Validate cancellation wording against language references</a>. Thanks to xet7.</summary>

Retained Asturian Encaboxar and Turkmen Ýatyr in two-factor cancellation.
Published localized help and government usage support these meanings. Exact
review checks pass; Uzbek Arabic-script spelling, Breton assignment wording
and wider language/browser verification remain open. No locale values changed.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5c7199050">Validate color names and contextual account action</a>. Thanks to xet7.</summary>

Retained Valencian indigo/mistyrose labels against dictionary meanings and
Unlock All against its people-panel confirmation and server lockout selector.
Exact review checks pass. Eleven restored Valencian findings and wider
language/browser verification remain open; no locale values changed.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/be334a5bf">Verify localized checklist search syntax</a>. Thanks to xet7.</summary>

Retained two joined Valencian search tokens. Regression exercises the actual
parser for quoted checklist text and positive/negative checklist presence;
unknown fields are rejected. Exact review checks pass. Nine restored Valencian
values and wider language/browser verification remain open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ed5a0d879">Replace wrong-language calendar setting</a>. Thanks to xet7.</summary>

Greenlandic calendar/date-display wording replaces an Azerbaijani seed.
Regression rejects the previous text; exact correction checks pass. Compound
grammar remains provisional and needs native review. Six flagged Greenlandic
calendar variants and broader language/browser verification remain open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/cc3e80e8b">Localize distinct tabular calendar variants</a>. Thanks to xet7.</summary>

Manx Hijri labels use localized tabular, civil and astronomical vocabulary.
Regression keeps the starting dates distinct and rejects English placeholders;
exact correction checks pass. Technical epoch phrasing is provisional and
needs native review; Coptic naming and browser verification remain open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d454a58ff">Clarify lime-color terminology</a>. Thanks to xet7.</summary>

Esperanto uses the explicit color term limekolora. Exact correction checks
pass, preserving placeholders and newer translations. Two restored Complete
labels and wider language/browser verification remain open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e9d46cb11">Replace Spanish end-date trigger fragment</a>. Thanks to xet7.</summary>

Basque end-date trigger uses existing Amaiera terminology while preserving
date-change meaning. Exact correction checks pass. Shared trigger grammar,
including the Spanish is fragment, and browser validation remain open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1b228a63f">Use consistent archive terminology in rules</a>. Thanks to xet7.</summary>

Six Basque rule actions/descriptions use archive terminology instead of
storage wording. Regression preserves archive/restore directions and when
clauses and checks actual action options. Exact correction checks pass;
shared trigger grammar and wider language/browser verification remain open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/918d17c6b">Validate placement and own-list labels</a>. Thanks to xet7.</summary>

Retained three Basque rule labels against the top/bottom action controls and
own-list destination. Exact review checks pass; nineteen restored Basque values,
shared trigger grammar and wider language/browser verification remain open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c44dca170">Validate Acehnese More wording</a>. Thanks to xet7.</summary>

Retained Leubeh against primary dictionary usage. Exact review checks pass;
six restored Acehnese values and broader language/browser review remain open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c4e6aa1c0">Repair attachment-label agreement</a>. Thanks to xet7.</summary>

Valencian My Attachments uses Els meus adjunts, matching the masculine plural
noun and preserving first-person ownership. Exact correction checks pass;
regional wording and wider language/browser verification remain open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/37a664a5c">Validate ticket-number vocabulary</a>. Thanks to xet7.</summary>

Retained Basque Tiket-zenbakia against published government usage. Exact
review checks pass. No current UI consumer was found; lexical acceptance
does not verify an unobserved workflow. Wider translation review remains open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/99a1e4835">Validate available disk-space terminology</a>. Thanks to xet7.</summary>

Retained Danish, Basque and Galician free labels against historical export
code displaying available and required MB. Exact review checks pass. No current
consumer was found; broader language/browser verification remains open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3b4941c34">Correct error-count meaning and validate completion labels</a>. Thanks to xet7.</summary>

Valencian Errors labels the historical operation error count. Nine completion
labels retain correct percentage/finished-state meanings. Historical templates
establish context; no current consumers found. Exact correction/review checks
pass, while wider language and browser verification remains open.

</details>

Thanks to above GitHub users for their contributions and translators for their translations.

# v11.79 2026-09-14 WeKan ® release

**In short:** **Veps translations** replace Finnish server-error prose with
Veps error terminology, consistent with existing troubleshooting wording.
Exact regression checks preserve placeholders and protect newer translations.
Borrowed server terminology and the standalone English-identical label still
need review; broader translation repairs and browser verification remain open.

This release fixes the following developer tooling:

**Release workflow** - Recognize translation group headings.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ac63da6d0">Avoid treating translation summary prose as a section</a>. Thanks to xet7.</summary>

The v11.78 prepare stage failed because a summary line starting with emphasized
Translations was mistaken for a group heading. Require the actual heading
syntax before collecting language metadata. The existing v11.78 notes now
render successfully; regression tests retain missing-metadata failures and
compact output. No workflow was published or rerun remotely.

</details>

and improves the following verification:

**Language picker tests** - Shared flag helper coverage.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0397fc89b">Check flags through the actual picker helper</a>. Thanks to xet7.</summary>

The registry test now exercises the shared module instead of reading a map
that moved out of the user header. All loaded locales, constructed globe
fallbacks and Veps/Venetian overrides pass. Unknown tags retain the globe.

</details>

and fixes the following translations:

**Translations** - Veps server-error terminology.

**Languages updated:** Veps

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9f0f038cd">Repair Veps server-error prose</a>. Thanks to xet7.</summary>

Replaced Finnish prose with Veps error terminology. Exact regression and
correction checks pass. Borrowed server terminology remains low confidence;
standalone Server and wider translation validation still require review.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/685b50fe1">Validate Basque reminder and notification wording</a>. Thanks to xet7.</summary>

Retained 28 correct reminders, irreversible deletion warnings and notification
labels. Deadline states, negation and placeholders remain distinct and intact.
Review checks pass; remaining translation findings stay open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/097b04e1d">Validate Basque settings and search vocabulary</a>. Thanks to xet7.</summary>

Retained 61 correct weekday/settings labels, missing-object errors and search
operators and predicates. Quarter, not-found negation and placeholders keep
their meanings. Review checks pass; remaining translation findings stay open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/fbf809882">Validate Basque search and legal wording</a>. Thanks to xet7.</summary>

Retained 41 correct search validation, sorting, report/status and
legal/checklist
labels. Positive-integer requirements, direction and placeholders remain intact.
Borrowed ticket spelling and the remaining audit findings stay under review.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/241fc457a">Validate Basque storage and schedule labels</a>. Thanks to xet7.</summary>

Retained 35 correct storage/connection, migration status and scheduled interval
labels. Frequencies and failure/success distinctions remain intact. Complete,
Idle and bucket wording remain under review. Exact review checks pass.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/12ba3ba1a">Validate Basque authentication and date activities</a>. Thanks to xet7.</summary>

Retained 16 correct authentication, deletion/restoration and old/new
date-activity
labels. Default versus displayed method, all-item scopes and source tokens
remain intact. Exact review checks pass; remaining audit findings stay open.

</details>

Thanks to above GitHub users for their contributions and translators for their translations.
