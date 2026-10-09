# Import / Export with other tools

WeKan imports boards from, and exports boards to, more than fifty formats and
tools. You use them from the existing menus:

- **Import**: **All Boards → New → Import**, then pick the tool. The import
  page says where in that tool to get the file. Choose the file, or paste its
  text where the format is text.
- **Export**: **Board Settings → Export**. Choose the scope and the fields to
  include, then the format.
- **Rules and workflows**: **Board Settings → Rules → Import / Export rules**
  (see [Rules](../Automation/Rules/Rules.md#import--export)).

Every import follows the tool's documented or source-verified file format.
After an import, a **loss report** lists what WeKan has no place for. It is
shown on the import page and in **Admin Panel → Problems → Recovery**. Most
exports are a **round trip**: the tool can read the file back, and so can
WeKan. The [format coverage table](./Format-Coverage.md) is the contract for
every field of every format: what maps where, what is reported, and the
sources of the format.

## Project and task tools

| Tool | Import (the file you give WeKan) | Export (the file WeKan writes) |
| --- | --- | --- |
| Trello | Board JSON (Menu → More → Print and Export → Export JSON) | Trello board JSON |
| Jira | Issue-search JSON (`GET /rest/api/2/search`) | Jira issues JSON |
| Asana | Tasks export JSON | Asana tasks JSON |
| Zenkit | List export JSON | Zenkit list JSON |
| Microsoft Planner | The Excel workbook from *Export plan to Excel* | Planner Excel workbook (`.xlsx`) |
| monday.com | The workbook from *Export board to Excel* | monday.com Excel import table (`.xlsx`) |
| Wrike | Excel export, or Wrike's Excel import template; *Workflow* and *Custom Status* columns are read | Wrike Excel import template (`.xlsx`) with its *Workflow* / *Status* / *Custom Status* columns |
| Wrike workflow | Paste the JSON of Wrike's `GET /workflows` in Rules → Import / Export: statuses become lists, and status groups become rules | The board's lists as a Wrike workflow JSON (Export menu, or Rules → Import / Export) |
| Teamwork.com | The Excel template of its task import | Teamwork.com task import template (`.xlsx`) |
| Businessmap (Kanbanize) | Advanced Search Excel export, or its import tool's workbook | Businessmap Excel workbook (`.xlsx`) |
| ClickUp | Workspace export CSV, or its Spreadsheets importer CSV | ClickUp CSV |
| Linear | Issues CSV export | Linear CSV |
| Notion | *Markdown & CSV* export `.zip`, or one database CSV | Notion database CSV |
| Redmine | Issues list *Also available in: CSV* | Redmine issues CSV |
| Plane | Workspace Settings → Exports `.zip` (CSV, JSON or XLSX inside), or one file from it | — (Plane has no file import) |
| Taiga | Project export (dump) JSON | Taiga project dump JSON, with sprints |
| Pivotal Tracker | Stories CSV | Pivotal Tracker CSV |
| MeisterTask | Project CSV | MeisterTask CSV |
| Quire | Export CSV, or its Import CSV shape | Quire Import CSV |
| Todoist | Project template CSV | Todoist CSV |
| TickTick | Backup CSV | TickTick backup CSV |
| Tasks.org | Backup JSON | Tasks.org backup JSON |
| Super Productivity | Backup JSON | Super Productivity backup JSON |
| Vikunja | Data export `.zip` | Vikunja data export `.zip` |
| Kanboard | Project JSON | Kanboard JSON |
| Nextcloud Deck | Board with `stacks` | Deck board JSON |
| Focalboard | `board.jsonl` | Focalboard `.jsonl` |
| Kanri | Board or all-data JSON export | Kanri board JSON |
| Nullboard | `.nbx` board file | Nullboard `.nbx` |
| Obsidian Kanban | The plugin's board Markdown file | Obsidian Kanban `.md` |
| OpenProject | Work packages (`GET /api/v3/work_packages`) | OpenProject work packages JSON, with versions |

## Issue trackers and source code hosting

| Tool | Import | Export |
| --- | --- | --- |
| GitHub | Issues array (`GET /repos/OWNER/REPO/issues`) | GitHub issues JSON |
| GitLab | Issues array (`GET /projects/ID/issues`) | GitLab issues JSON, with milestones |
| Gitea | Issues array (`GET /repos/OWNER/REPO/issues`) | Gitea issues JSON |
| Forgejo | Issues array (the same API as Gitea) | Forgejo issues JSON |

GitHub, GitLab, Gitea and Forgejo import their issues JSON only through their
own API, so the exported file is for a script that calls it.

## Plain text, outlines and personal task files

| Format | Import | Export |
| --- | --- | --- |
| Markdown | Task list | Markdown (`.md`) |
| todo.txt | `todo.txt` lines | `todo.txt` |
| Taskwarrior | `task export` JSON | Taskwarrior JSON |
| Org mode | `.org` file | Org mode (`.org`) |
| OPML | Outline from Workflowy, Dynalist, OmniOutliner, Logseq and others | OPML (`.opml`) |
| Leo | Leo outline (`.leo`) | Leo outline |

## WeKan's own formats and documents

| Format | Import | Export |
| --- | --- | --- |
| WeKan JSON | Board export, with attachments, rules and everything else | JSON, with or without attachments, or `.zip` with attachment files |
| CSV / TSV | Comma, semicolon or tab separated | CSV `,` / CSV `;` / TSV |
| Excel | WeKan-style `.xlsx` | Excel (`.xlsx`) |
| PDF, HTML | — | PDF and an HTML archive of the board |
| iCalendar | — | Calendar feed of the board's dates |
| Dependencies | — | Dependency graph as JSON or SVG |
| Rules | WeKan rules JSON or CSV, Trello Butler text, n8n and Node-RED workflows, Wrike workflows | WeKan rules JSON or CSV, Wrike workflow |

## Not supported yet

These tools have no export file to read: only an API, which needs live
credentials to build and verify against. They are Planka, Microsoft To Do,
KanbanFlow, Basecamp and Taskcafe. Restyaboard's CSV export is a closed paid
app with undocumented columns. YouTrack, Airtable and Leantime write CSV
headers that are undocumented or in the user's language. Things 3 exports only
its SQLite database. Wrike's automation rules have no export, import or API.
The **TODO Later** section of [CHANGELOG.md](../../../CHANGELOG.md) keeps the
reason for each.

## REST API and `api.py`

Both directions are scriptable, so all boards can be migrated in bulk:

```bash
# Import from a tool's export (SOURCE is a key from the import page:
# trello, jira, planner, monday, wrike, notion, redmine, plane, ...)
python3 api.py importboardfrom github issues.json
#   → POST /api/boards/import/github   (body: the tool's export)

# Export a board in a tool's format (FORMAT is a key from the export menu:
# trello, jira, kanboard, planner, wrike, wrikeworkflow, notion, redmine, ...)
python3 api.py exportboardformat BOARDID deck deck-board.json
#   → GET  /api/boards/:boardId/export/deck?authToken=:token
```

## Related

- [Format coverage: every field of every format](./Format-Coverage.md)
- [Rules import and export, Wrike workflows](../Automation/Rules/Rules.md#import--export)
- [Kanboard](./Kanboard/Kanboard.md), [Jira](./Jira/Jira.md),
  [Trello](./Trello/trello/Migrating-from-Trello.md), [CSV/TSV](./CSV/CSV.md),
  [Excel](./Excel/Excel-and-VBA.md)
- [Migrate all boards from another WeKan](./Sync.md)
