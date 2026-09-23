# Menu implementation audit

Audit run on 2026-09-23 against local macOS ARM64 bundles and FerretDB.
The full baseline had 405 passes and 55 failures; see the
[detailed run results](Menu-Audit-Results.md) for every failing test.
This is an implementation and test inventory, **not a declaration that every
menu feature works**. A handler, a translated label or a documentation page
alone does not establish working behavior.

## Evidence and regression checks

`node tests/helpers/menuAuditInventory.cjs` generates a JSON inventory of every
`.js-*` link/button in menu, popup, header and sidebar Jade templates. It lists
source locations, matching event handlers and literal browser-spec references.
The initial audit found 418 selectors; 270 have no literal browser-spec reference.
Dynamic helpers can cover some of those; conversely a reference is not proof
that a test exercises an action. These numbers are not a coverage percentage.
Templates outside these families and dynamically generated menus require the
separate feature suites below.

`node tests/menuActionInventory.test.cjs` rejects new disconnected actions. The
15 selector occurrences without direct click handlers are reviewed form-submit
buttons, native links, drag handles or a styling class beside an action class.
Its negative control proves an unknown disconnected action is rejected.

The audit found and repaired these implementation defects:

- Trello HTTP imports bypassed the global import-disable switch and the
  shared transfer validator. The route now enforces both, for JSON and ZIP,
  and rejects malformed board shapes before creating records.
- Organizations table select-all/unselect-all links had no event handler.
  Browser tests now click all three feature columns, check database state,
  reject invalid fields and refuse non-admin bulk writes. Rapid clicks queue
  instead of losing the later selection while a save is pending.
- Jira Cloud v3 ADF descriptions became empty strings. Both Jira import paths
  now preserve text and paragraph boundaries without rendering trusted HTML.
- CSV trailing empty rows created blank cards. The CSV/Excel creator now
  ignores wholly empty rows while retaining zero and rows with other content.
- Wrong-shaped JSON could report success after creating an empty board.
  Source-specific shape checks now reject it before board creation.
- WeKan JSON re-import dropped attachments without an `addAttachment` activity.
  Attachment records now supply the card association; older activity-only
  associations still work, without duplicating files.

## Browser suites by menu area

These suites contain behavior checks, not just menu screenshots. Run the full
suite to establish the result for a particular build; some existing tests failed
in the baseline run and are not certified by this inventory.

| Menu area | Browser spec family |
| --- | --- |
| Boards, members, lists, swimlanes | `01-boards-users`, `02-*`, `13-swimlanes`, creation options |
| Cards, custom fields, descriptions, members | `03-cards-operations`, `16-card-members-description`, `22-card-features` |
| Search, filters, sorting | `04-search`, `09-my-cards-filter`, `39-allboards-sort-search-pagination` |
| Views, layouts, dates | `06-views-layout`, `44-calendar-date-display` |
| Attachments and links | `07-attachments-links`, `42-board-comments-attachments` |
| Labels, dates, voting, watching | `11-labels-duedates`, `14-voting-watchers` |
| Board settings and actions | `15-board-actions`, `33-board-domains` |
| Admin Panel | [pane validation inventory](Admin-Panel/Validation.md) |
| Organizations and Teams | `30-ldap-orgs-teams`, `32-org-team-feature-toggles`, `menu-action-audit` |
| Import and export | `25-excel-pdf`, existing transfer suites, `import-export-format-audit` |

The broad baseline found failures involving membership display, card fields,
remote updates, filters, table/swimlane views, voting and other controls. Some
assertions target old layouts; others involve direct database changes or real
behavior. They require individual reproduction. Do not interpret that run as a
successful all-features validation.

## Import/export findings

[Fixture provenance](../../tests/fixtures/import-formats/README.md) distinguishes
current documented API shapes from native exports and unverified adapter samples.
Fixtures use dummy Unicode and multiline text, comments, checklist entries,
dates and file metadata. The binary sample contains non-text bytes.

The new browser suite checks supported adapter text, malformed JSON, invalid
source shapes, CSV/Markdown/Excel text, rendered cards, all twelve external
export links, and rejection of unrelated users' export tokens. The Trello ZIP →
WeKan JSON → WeKan import round trip compares comments, checklist items and exact
attachment bytes. This does not prove preservation of every board field.

Confirmed limitations requiring further implementation:

- General external import adapters do not preserve all comments, files, custom
  fields, relationships and history. API attachment metadata alone is not file
  content; no test downloads private provider files or calls vendor services.
- General external exports collect titles, descriptions, labels, dates and
  selected structure. They omit comments, checklists and attachment bytes.
  They are **not full backups** or verified native restore archives.
- Root WeKan import advertises ZIP but its file reader rejects ZIP; the separate
  scoped ZIP endpoint requires an existing target board. Whole-board ZIP import
  must be repaired and tested independently.
- Asana bulk JSONL.gz export is not supported; the adapter accepts task API JSON.
- Zenkit's current native JSON export compatibility is unverified because the
  vendor documentation does not provide its concrete schema. The fixture is
  explicitly adapter-shaped.
- Paginated issue/task API responses require all pages and related resources.
  A one-page file cannot prove that an entire project was transferred.

[Format-Coverage.md](ImportExport/Format-Coverage.md) describes the broader target
contract, including loss accounting; it is not evidence that those promises are
already implemented. For disaster recovery use the
[full backup documentation](../Backup/Backup.md).
