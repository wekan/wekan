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
| OpenProject | [API v3 HAL+JSON](https://www.openproject.org/docs/api/introduction/), work-package collection and embedded per-project/type [schemas](https://www.openproject.org/docs/development/concepts/resource-schemas/) | HAL links, status/type/priority, assignee/responsible, dates/duration, hierarchy/relations, watchers, comments, attachments and schema-described custom fields |
| GitHub | Versioned [Issues REST API](https://docs.github.com/en/rest/issues/issues), comments, events and attachments referenced from Markdown | Issues excluding pull requests, open/closed state, state reason, labels with colors, assignees, reporter, milestone, dates, comments, relationships and URLs; pagination must be completed by API clients |
| GitLab | Current [Issues API v4](https://docs.gitlab.com/api/issues/) | State, labels with details, assignees, author, milestone, iteration, weight, due date, time stats, task completion, links, discussions and attachments |
| Gitea / Forgejo | Current issue API and release schema of the selected server | GitHub-like fields plus milestone, deadline, assignees, comments and server-specific labels/state metadata |
| Asana | Current [Tasks API](https://developers.asana.com/reference/tasks) with opt-in fields | Sections/memberships, completion, assignee/followers, start/due dates, dependencies, subtasks, tags, stories, attachments and all supported custom-field value kinds |
| Zenkit | Current documented export accepted by the selected Zenkit product | Collections/lists, stages, items, hierarchy, members, dates, labels and exported custom fields; retain unknown fields in the loss report because products differ |
| iCalendar | RFC 5545 plus RFC 7986 additive properties | Unfolded/escaped UTF-8 content lines, UID identity, recurrence, exclusions, timezone, start/end/duration, status, summary, description, URL, attendees and categories |
| CSV / TSV | RFC 4180 CSV and tab-delimited UTF-8 with a header row | Quoted separators/newlines/quotes, BOM, CRLF/LF, locale-independent ISO dates and every documented WeKan column/custom field |
| XLSX | ECMA-376 workbook data consumed through the maintained ExcelJS fork | Multiple worksheets when documented, typed cells/dates, formulas as displayed values, custom-field columns and size/row/column bounds |
| PDF / HTML / SVG | Export-only rendered views | Every selected visible section, Unicode, safe links/images, pagination and deterministic filenames; these are presentations, not lossless re-import formats |

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

## Verification matrix

Each format has fixtures from its newest documented shape plus legacy fixtures.
Tests cover every mapped field, missing optional fields, unknown additive fields,
malformed types, duplicate source IDs, reordered arrays, pagination, restart at
every checkpoint and export→import round trips. A field-inventory test fails when
a new canonical WeKan field is exported but not imported, or when documentation
claims a mapping absent from code.
