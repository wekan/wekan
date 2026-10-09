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

## Formats

Each format has a directory of its own here, with the steps to import and
export it, the steps for many boards at once, and its details: the shape the
tool documents and the sources it was read from, what is kept, what the loss
report lists, the REST API, and the code and tests. A test
(`tests/importExportDocsCoverage.test.cjs`) fails when a source on the import
page or a format in the export menu has no page here.

| Format | Import | Export |
| --- | --- | --- |
| [WeKan JSON and .zip](./WeKan/WeKan.md) | yes | yes |
| [CSV / TSV](./CSV/CSV.md) | yes | yes |
| [Excel](./Excel/Excel.md) | yes | yes (a sheet per board when many) |
| [PDF](./PDF/PDF.md) | — | yes |
| [HTML](./HTML/HTML.md) | — | yes |
| [iCalendar](./iCalendar/iCalendar.md) | yes (REST) | yes |
| [Dependencies JSON / SVG](./Dependencies/Dependencies.md) | yes | yes |
| [Rules and workflows](./Rules/Rules.md) | yes | yes |
| [Trello](./Trello/Trello.md) | yes | yes |
| [Jira](./Jira/Jira.md) | yes | yes |
| [Asana](./Asana/Asana.md) | yes | yes |
| [Zenkit](./ZenKit/ZenKit.md) | yes | yes |
| [Kanboard](./Kanboard/Kanboard.md) | yes | yes |
| [Nextcloud Deck](./Nextcloud-Deck/Nextcloud-Deck.md) | yes | yes |
| [OpenProject](./OpenProject/OpenProject.md) | yes | yes |
| [GitHub](./GitHub/GitHub.md) | yes | yes |
| [GitLab](./GitLab/GitLab.md) | yes | yes |
| [Gitea](./Gitea/Gitea.md) | yes | yes |
| [Forgejo](./Forgejo/Forgejo.md) | yes | yes |
| [Microsoft Planner](./Microsoft-Planner/Microsoft-Planner.md) | yes | yes |
| [monday.com](./monday-com/monday-com.md) | yes | yes |
| [Wrike and Wrike workflow](./Wrike/Wrike.md) | yes | yes |
| [Teamwork.com](./Teamwork/Teamwork.md) | yes | yes |
| [Businessmap (Kanbanize)](./Businessmap/Businessmap.md) | yes | yes |
| [ClickUp](./ClickUp/ClickUp.md) | yes | yes |
| [Linear](./Linear/Linear.md) | yes | yes |
| [Notion](./Notion/Notion.md) | yes | yes |
| [Redmine](./Redmine/Redmine.md) | yes | yes |
| [Plane](./Plane/Plane.md) | yes | — |
| [Taiga](./Taiga/Taiga.md) | yes | yes |
| [Pivotal Tracker](./Pivotal-Tracker/Pivotal-Tracker.md) | yes | yes |
| [MeisterTask](./MeisterTask/MeisterTask.md) | yes | yes |
| [Quire](./Quire/Quire.md) | yes | yes |
| [Todoist](./Todoist/Todoist.md) | yes | yes |
| [TickTick](./TickTick/TickTick.md) | yes | yes |
| [Tasks.org](./Tasks-org/Tasks-org.md) | yes | yes |
| [Super Productivity](./Super-Productivity/Super-Productivity.md) | yes | yes |
| [Vikunja](./Vikunja/Vikunja.md) | yes | yes |
| [Focalboard](./Focalboard/Focalboard.md) | yes | yes |
| [Kanri](./Kanri/Kanri.md) | yes | yes |
| [Nullboard](./Nullboard/Nullboard.md) | yes | yes |
| [Obsidian Kanban](./Obsidian-Kanban/Obsidian-Kanban.md) | yes | yes |
| [Markdown](./Markdown/Markdown.md) | yes | yes |
| [todo.txt](./Todo-txt/Todo-txt.md) | yes | yes |
| [Taskwarrior](./Taskwarrior/Taskwarrior.md) | yes | yes |
| [Org mode](./Org-mode/Org-mode.md) | yes | yes |
| [OPML](./OPML/OPML.md) | yes | yes |
| [Leo](./Leo/Leo.md) | yes | yes |

The [overview](./External-Tools.md) groups them by kind.

## Many boards at once

Every import source takes many files at once (**Import many boards** on the
import page, `python3 api.py importboardsfrom`), each becoming its own board,
and a `.zip` of export files is opened into its files
(`models/lib/importManyFiles.js`). For the sources of the generalized importer,
**One board per project** makes each swimlane the import would create - a
project, folder or list of the tool - its own board
(`models/lib/importSplit.js`), so an export that holds a whole app imports as
many boards, as a Trello `.zip` does. Every export format of the tool list,
WeKan JSON, CSV/TSV and Excel can be written for every board at once (**All
Boards → Export all boards**, or selected boards with Multi-Selection,
`python3 api.py exportallboards`): Excel as one workbook with a sheet per board
named after it, the others as a `.zip` with one file per board
(`server/routes/exportAllBoards.js`).

## Scrum planning from importers other than Jira

GitLab, OpenProject, Asana, Pivotal Tracker and Taiga imports create Scrum
sprints and releases from what their exports carry
(`models/lib/externalScrumPlanning.js`), through the same journaled Scrum
import stage as Jira and WeKan JSON (`server/lib/scrumTransferImport.js`), so
an interrupted import is recovered like theirs
([Scrum import recovery](./Scrum-Import-Recovery.md)). The import page's
**Scrum settings** part decides whether any of it is imported. What each
source's sprints and releases are made from is on its page.

An import with losses records one `import-completed-with-warnings` row in
Admin Panel → Problems → Recovery, with the board, the importing user and a
bounded list of paths and reasons (`models/lib/importLossReport.js`), and the
import page shows the same report before it opens the board
(`server/methods/importReport.js`). A complete import records nothing.

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
