# Design: complete, current and restart-safe import/export

Status: **Implementation in progress** · Last specification audit: 2026-09-05

This document is the contract for every format shown in WeKan's Import or Export
menus. "Import all possible data" means every source field with an equivalent in
WeKan is mapped, relationships are resolved after their objects exist, binary
content is streamed, and unsupported source data is reported rather than silently
dropped. It cannot mean inventing a destination feature that does not exist.

Long operations follow the [durable operations](../Admin-Panel/Problems/Durable-Operations.md)
contract: persisted checkpoints, idempotent units, expiring leases, restart
reclaim, bounded external requests and rate-limit-aware retries.

## Canonical WeKan format

`wekan-board-1.0.0` JSON is the lossless canonical board format. Its ZIP form
contains the same JSON plus attachment bytes and a manifest. The schema version
is explicit; readers accept older additive documents, reject unknown incompatible
major formats, preserve IDs only as source references, and validate every object,
array, date, URL, filename and size before writing.

The canonical field inventory is board metadata and settings; swimlanes and
lists with order, archive and color state; cards with text, order, archive,
dates, people, labels, custom fields, votes, poker, locations and dependencies;
checklists/items; subtasks/linked cards; comments and activities; rules; and
attachments with metadata and bytes. Positive round-trip tests compare this
inventory, while negative tests prove unknown executable input and unsafe paths,
URLs, formulas and markup are refused or neutralized.

## Current external specifications

The audit uses provider documentation and, for open-source formats, their current
code/API schema rather than old sample files:

| Format | Current authoritative shape | Required import coverage |
| --- | --- | --- |
| Trello | [Boards API](https://developer.atlassian.com/cloud/trello/rest/api-group-boards/), [Cards API](https://developer.atlassian.com/cloud/trello/rest/api-group-cards/), and [automated exports](https://developer.atlassian.com/cloud/trello/guides/rest-api/automating-exports/) | Board preferences, lists, cards, archive/order, members, labels, dates, checklists/items, comments/actions, custom fields, stickers, coordinates, covers/backgrounds and attachment metadata/bytes |
| Jira Cloud | [REST API v3 issue search](https://developer.atlassian.com/cloud/jira/platform/rest/v3/api-group-issue-search/) and per-project/type schemas | ADF or string descriptions, status, type, priority, reporter/assignee, labels, components, versions, sprint/epic/parent links, subtasks, dates, estimates, comments, attachments and schema-described custom fields |
| Kanboard | [JSON-RPC API](https://docs.kanboard.org/v1/api/) and current project export | Project, columns, swimlanes, tasks, order/color/category, assignee/creator, dates/time estimates, subtasks, links, comments, tags, metadata and files |
| Nextcloud Deck | Current Deck server API/code objects | Board, ACL, labels, stacks, cards, order/type, assignees, dates, comments and attachments |
| OpenProject | [API v3 HAL+JSON](https://www.openproject.org/docs/api/introduction/), work-package collection and embedded per-project/type [schemas](https://www.openproject.org/docs/development/concepts/resource-schemas/) | HAL links, status/type/priority, assignee/responsible, dates/duration, hierarchy/relations, watchers, comments, attachments, schema-described custom fields, and versions, sprints, position and story points as Scrum planning |
| GitHub | Versioned [Issues REST API](https://docs.github.com/en/rest/issues/issues), comments, events and attachments referenced from Markdown | Issues excluding pull requests, open/closed state, state reason, labels with colors, assignees, reporter, milestone, dates, comments, relationships and URLs; pagination must be completed by API clients |
| GitLab | Current [Issues API v4](https://docs.gitlab.com/api/issues/) | State, labels with details, assignees, author, milestone (as a Scrum release), iteration (as a Scrum sprint), weight, due date, time stats, task completion, links, discussions and attachments |
| Gitea / Forgejo | Current issue API and release schema of the selected server | GitHub-like fields plus milestone, deadline, assignees, comments and server-specific labels/state metadata |
| Asana | Current [Tasks API](https://developers.asana.com/reference/tasks) with opt-in fields | Sections/memberships, completion, assignee/followers, start/due dates, dependencies, subtasks, tags, stories, attachments, all supported custom-field value kinds, and milestone tasks as Scrum releases |
| Zenkit | Current documented export accepted by the selected Zenkit product | Collections/lists, stages, items, hierarchy, members, dates, labels and exported custom fields; retain unknown fields in the loss report because products differ |
| iCalendar | RFC 5545 plus RFC 7986 additive properties | Unfolded/escaped UTF-8 content lines, UID identity, recurrence, exclusions, timezone, start/end/duration, status, summary, description, URL, attendees and categories |
| CSV / TSV | RFC 4180 CSV and tab-delimited UTF-8 with a header row | Quoted separators/newlines/quotes, BOM, CRLF/LF, locale-independent ISO dates and every documented WeKan column/custom field |
| XLSX | ECMA-376 workbook data consumed through the maintained ExcelJS fork | Multiple worksheets when documented, typed cells/dates, formulas as displayed values, custom-field columns and size/row/column bounds |
| PDF / HTML / SVG | Export-only rendered views | Every selected visible section, Unicode, safe links/images, pagination and deterministic filenames; these are presentations, not lossless re-import formats |
| Markdown task list | The convention markdown-kanban tools (e.g. Obsidian Kanban) use: `## List` headings, `- [ ]`/`- [x]` items | Headings as lists, checkbox state as a `done` tag, indented lines as description; a plain bulleted list with no checkboxes still imports as open cards |
| todo.txt | The [todo.txt format](https://github.com/todotxt/todo.txt): one task per line | Completion (`x`), priority, creation and completion dates, `+project` and `@context` as labels, `due:` and `t:` as due and start dates; WeKan's `list:` extension keeps list names across a round trip, other `key:value` pairs stay in the title, and a malformed date is reported; descriptions, comments and members have no place in the format |
| Focalboard | A [Focalboard](https://github.com/mattermost/focalboard) (Mattermost Boards) board archive as text: a board's `board.jsonl` from the `.boardarchive` zip, optionally after its `{"version":1}` header line - the same text Focalboard's importer reads | The board view's group-by select property as lists, other select and multi-select properties as `<property>:<option>` labels, the first date property as due (or start and due), text/number/email/url/phone/checkbox and further date properties as custom fields, text and heading blocks as the description, checkbox blocks as a checklist, comment blocks as comments; members, person properties, images and attachments and card templates are reported. Export writes the same text, with a Status property for the lists, Labels and Due |
| Todoist | A [Todoist project template](https://todoist.com/help/articles/360000748525) (CSV): the TYPE, CONTENT, DESCRIPTION, PRIORITY, INDENT, AUTHOR, RESPONSIBLE, DATE ... DEADLINE_LANG columns that Export as a template writes and Import from template reads | Sections as lists (tasks before the first section in No section), tasks as cards, INDENT 2 and deeper as a Sub-tasks checklist, notes as comments on the task above, `@label` words as labels, PRIORITY 1-3 as labels p1-p3 (4 is Todoist's no priority), RESPONSIBLE as the owner, DATE as due date (or start, with DEADLINE as due); dates in words such as `every monday`, DURATION, orphan notes and sub-tasks and unknown row types are reported. Export writes the same columns with a `view_style=board` meta row; Todoist exports no completed tasks, so finished checklist items are left out |
| Taskwarrior | The [Taskwarrior task format](https://taskwarrior.org/docs/design/task/) that `task export` writes and `task import` reads: a JSON array, or one object per line from older versions | Description, status (completed to Done, waiting to Waiting, started to In Progress), `project` and `priority` as labels, tags, entry/due/scheduled/end dates, annotations as comments and `depends` as blocked-by dependencies by uuid; WeKan's `wekanlist` and `wekandescription` attributes keep lists and descriptions across a round trip; deleted tasks, recurring templates and unmapped attributes are reported; Taskwarrior has no members |
| Org mode (`.org`) | An [Org mode](https://orgmode.org/manual/) outline as Emacs, Orgzly, Beorg and organice write it: headlines with TODO keywords (including those a `#+TODO` line declares), `[#A]` priorities, `:tags:`, SCHEDULED/DEADLINE/CLOSED planning lines, property drawers and `- [ ]` checkboxes | Level-1 headings as lists, level-2 as cards (a done keyword as the `done` tag), priorities as `priority:A` labels, tags as labels, SCHEDULED/DEADLINE/CLOSED as start/due/end, `:CREATED:` as the creation date, body text as the description, checkboxes and level-3 headings without children as the card's checklist, level-3 headings with children as checklists of their own, `#+TITLE` as the board title. Timestamps have no zone in Org and are read and written as UTC; repeaters and warning delays, text under a list heading and text before the first heading are reported. Comments have no place in Org and are not exported |
| OPML outline (`.opml`) | An [OPML 2.0](http://opml.org/spec2.opml) outline as Workflowy, Dynalist, OmniOutliner, Logseq and most outliners export it, with their `_note` and `_complete` (or Dynalist's `complete`) attributes | Top-level outlines as lists, their children as cards (`_note` as description, a completed item as the `done` tag), deeper outlines as checklists with their descendants as items (completed = finished), the head title as the board title; a list's note and `url`/`htmlUrl`/`xmlUrl` links are reported. Export writes the same with Workflowy's attribute names; line breaks in notes survive as `&#10;`. Parsed on the server only; DTDs and external entities are never resolved |
| Leo outline (`.leo`) | The [Leo](https://leo-editor.github.io/leo-editor/) literate editor's XML outline: nested `<v>` nodes with `<vh>` headlines, bodies in `<t>` joined by the node id | Top-level nodes as lists, their children as cards (body as description, a marked node as `done`), deeper nodes as checklists with their descendants as items; clones keep their headline and children; list bodies are reported as a loss; the board title travels in a `wekan_board` attribute Leo ignores |

## Current external adapter checkpoint

Kanboard, Nextcloud Deck, OpenProject, Asana, Zenkit and Jira now map the
fields listed above that have a WeKan equivalent: comments (posted by the
mapped user, otherwise by the importer with the source author's name leading
the text), subtasks as child cards when they are imported too and as a
checklist otherwise, parent hierarchy and dependencies between items of the
same import, custom-field values as typed board custom fields, start, end
and creation dates, archive state, colors, several assignees and source
order. Creation dates survive the schema's `createdAt` autoValue through
`writeImportedEntity`. What has no equivalent is listed per parser in
`unsupported`: file contents (these JSON sources carry attachment metadata
only), sharing rules (an import never grants board access), cross-list
references and formula results. OpenProject watchers and Asana followers
become card watchers when they are mapped to a member of the new board;
watching grants no access, but a non-member watching a private board would
receive its notifications, so any other watcher is counted in the loss
report instead. Nextcloud Deck sharing rules stay a reported loss by design. Zenkit's API entries
are read with the value keys its API client documents; its single-file export
remains unverified because no schema is published.

GitLab ([#2698](https://github.com/wekan/wekan/issues/2698)) now meets the
same contract as GitHub: every assignee, the author, creation and close dates,
time spent, labels with details, milestone, iteration, issue type and
confidentiality as tags (milestones and iterations are also Scrum releases and
sprints, below), weight, time estimate and task completion as custom
fields, embedded `notes` as comments (system notes skipped), embedded `links`
as dependencies, and the `group/project#iid` reference and web URL at the end
of the description. A confidential issue is warned about, because on the board
the board's visibility decides who reads it. Epics, which are group-level, and
comments that exist upstream but were not embedded are reported in
`unsupported`. List Sync still writes only title, description and time fields
on existing cards; the others apply when a card is created.

### Scrum planning from importers other than Jira

GitLab, OpenProject and Asana imports now create Scrum sprints and releases
from what their exports really carry (`models/lib/externalScrumPlanning.js`),
written through the same journaled Scrum import stage as Jira and WeKan JSON
(`server/lib/scrumTransferImport.js`), so an interrupted import is recovered
like theirs ([Scrum import recovery](./Scrum-Import-Recovery.md)). The import
page's **Scrum settings** part decides whether any of it is imported.

| Source | Sprints | Releases | Also | Reported, not imported |
| --- | --- | --- | --- | --- |
| GitLab ([Issues API v4](https://docs.gitlab.com/api/issues/)) | An issue's `iteration`: `title` (an untitled cadence iteration is named by its dates, as GitLab shows it), `description` as the goal, `start_date`, `due_date`; `state` 1/`upcoming` planned | An issue's `milestone`: `title`, `description`, `start_date`, `due_date`; `state` `active` planned, `closed` released | The `milestone:` and `iteration:` labels stay, because List Sync writes labels and not Scrum planning, and earlier boards filter by them | A current (2) iteration is imported as planned: no commitment snapshot. A closed (3) iteration is not imported: no commitment or close snapshot. A closed milestone has no close date. Malformed dates, unknown states, untitled milestones, iterations with neither id nor title |
| OpenProject ([API v3](https://www.openproject.org/docs/api/endpoints/work-packages/)) | A work package's `sprint` link ([Sprint](https://www.openproject.org/docs/api/endpoints/sprints/): `name`, `startDate`, `finishDate`, status URN `in_planning` planned) | A work package's `version` link ([Version](https://www.openproject.org/docs/api/endpoints/versions/): `name`, `description`, `startDate`, `endDate`; `open`/`locked` planned, `closed` released) | `position` as the backlog rank; `storyPoints` as a numeric **Story points** field that becomes the board's Scrum estimate | The collection only links versions and sprints: their dates and status are read when embedded (on the work package, or as `_embedded.versions` / `_embedded.sprints` beside the elements); a link alone keeps its title and is reported. An `active` sprint is imported as planned, a `completed` one not at all, for the same snapshot reasons |
| Asana ([Tasks API](https://developers.asana.com/reference/tasks)) | None: Asana has no sprint record, and sections stay lists | A milestone task (`resource_subtype: "milestone"`): `name`, `notes`, `start_on`, `due_on`; completed is released at `completed_at`. The milestone's own card and the tasks it waits for (its `dependencies`, or tasks listing it in `dependents`) carry it | | A second milestone of one task (a card has one release), a dependency outside the import, a completed milestone without a valid completion date |
| Trello | None | None | | Trello has no sprints or releases. Power-Up data (`pluginData`), where Scrum Power-Ups keep their state, has no published schema and is counted in the report |

Two records with the same name stay two records and are reported; one source id
listed on many issues is one record. A card in an iteration or sprint that is
not imported stays in the backlog. The GitLab export writes each card's sprint
and release back as `iteration` and `milestone`, and the OpenProject export as
`sprint` and `version` links with `_embedded.sprints` / `_embedded.versions` and
`position`, when Scrum settings are selected; a cancelled sprint or release has
no equivalent there and is left out. Neither format carries a commitment
snapshot, so an exported active or closed sprint comes back as the import
above describes. GitHub, Gitea and Forgejo milestones remain labels.

An import with losses records one `import-completed-with-warnings` row in
Admin Panel → Problems → Recovery, with the board, the importing user and a
bounded list of paths and reasons (`models/lib/importLossReport.js`). A
complete import records nothing. The import page itself does not yet show the
report: that needs a new translated string in every locale.

## Loss accounting and extensions

Every parser returns `{ normalized, warnings, unsupported }`. `unsupported`
contains bounded JSON-pointer-like paths and reasons, never secret values. The
import result and Problems → Recovery show counts and paths. A success with
unsupported fields is `completed-with-warnings`, not silently `completed`.

External export follows that provider's creation/request schema, not a copied
response object full of read-only fields. When a provider has no equivalent for
a WeKan field, the formatter emits a documented `x-wekan` extension block where
JSON permits it and reports the field in `_wekan.losses`. Consumers may ignore
extensions; a later WeKan import uses them to recover a lossless round trip.

### Current Sync preview checkpoint

The list Sync popup now previews the saved source using the actual merge and
write plan. Counts exclude ignored status-only changes and include comparison
baseline writes. It reports normalized fields excluded by selection or lacking
a Sync mapping, plus counts of existing parser diagnostics. The preview reads
under the usual per-list reservation and leaves cards and Sync status unchanged.

The fetched issue data is also inspected for unmapped paths, unused fallbacks,
excluded fields/items and representation conversions before normalization.
Unknown subtrees are reported as a whole without values; occurrence counts and
output limits keep the inventory bounded. Rules follow the current parsers;
pagination envelopes discarded during fetching are not inventoried.
The complete loss-accounting contract still requires a full provider schema,
mapping choices beyond the current field switches, binary and history
transport. These remain in TODO Later. Full-list Sync runs now persist bounded
coverage and terminal status privately; the popup reads the latest 20 reports
from the last 30 days. Unfinished records explicitly leave the outcome unknown.
Problems → Recovery now exposes the same bounded diagnostics to instance
administrators with status filters and pagination. These reports do not yet
implement the replay/recovery checkpoints required by the full contract.
See [Sync](./Sync.md#preview-saved-sync-changes) for access and output limits.

## Compatibility and limits

Parsers accept documented additive fields and both current and known legacy
spellings. They never infer that the first API page is the complete export:
live connectors follow provider pagination links/tokens under the shared rate
limiter. Uploaded JSON must already contain the desired pages, and the UI says
so. Input depth, objects, rows, strings, decoded bytes and compression ratios are
bounded before expensive work.

Dates retain timezone/offset semantics. Rich text retains a safe plain/Markdown
form and, where needed for round-trip, its bounded structured source. Usernames
are source identities until explicitly mapped; imports never grant board access
merely because a source file names a user.

## One validation and sanitization boundary

All upload, DDP and REST imports pass through one shared boundary before a
format parser or creator sees them. It walks own enumerable data only, rejects
prototypes, accessors, cycles and dangerous keys such as `__proto__`, bounds
depth, nodes, arrays, strings and binary declarations, validates finite numbers
and dates, and returns a new null-prototype-safe value. Format adapters may
tighten this schema but may not bypass it.

Text is classified by destination. Titles, names, identifiers and plain text
remain text. Permitted rich HTML is sanitized with WeKan's existing DOMPurify
configuration and an explicit tag/attribute allowlist; scripts, event handlers,
active SVG/MathML, CSS, forms, embeds and unsafe protocols are removed. Markdown
is stored as Markdown and rendered through the existing sanitized renderer, not
pre-rendered as trusted HTML. URLs use the shared scheme and SSRF validators;
file paths and names use the existing traversal and filename guards.

Formula-capable exports neutralize cells beginning with `=`, `+`, `-`, `@`, tab,
carriage return or line feed when user text is written to CSV, TSV or XLSX. JSON
serialization drops prototype keys and never serializes credentials, filesystem
paths, login tokens or server-only metadata. HTML/PDF/SVG output goes through
the same safe rich-text and URL decisions before rendering.

Every exporter passes its finished value through the shared outbound validator.
This catches non-finite numbers, invalid dates, unsafe URLs, accidental secrets,
cycles and adapter mistakes even when the stored database row predates current
import validation. Sanitization returns warnings with bounded field paths for
Problems → Security/Recovery; raw rejected values and secrets are never logged.

## Verification matrix

Each format has fixtures from its newest documented shape plus legacy fixtures.
Tests cover every mapped field, missing optional fields, unknown additive fields,
malformed types, duplicate source IDs, reordered arrays, pagination, restart at
every checkpoint and export→import round trips. A field-inventory test fails when
a new canonical WeKan field is exported but not imported, or when documentation
claims a mapping absent from code.
