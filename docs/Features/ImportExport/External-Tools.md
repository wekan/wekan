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
| [Trello](./Trello/Trello.md) | Board JSON (Menu → More → Print and Export → Export JSON) | Trello board JSON |
| [Jira](./Jira/Jira.md) | Issue-search JSON (`GET /rest/api/3/search/jql?fields=*all`) | Jira issues JSON |
| [Asana](./Asana/Asana.md) | Tasks export JSON | Asana tasks JSON |
| [Zenkit](./ZenKit/ZenKit.md) | List export JSON | Zenkit list JSON |
| [Microsoft Planner](./Microsoft-Planner/Microsoft-Planner.md) | The Excel workbook from *Export as Excel* (classic: *Export plan to Excel*) | Planner Excel workbook (`.xlsx`) |
| [monday.com](./monday-com/monday-com.md) | The workbook from *Export board to Excel* | monday.com Excel import table (`.xlsx`) |
| [Wrike](./Wrike/Wrike.md) | Excel export, or Wrike's Excel import template; *Workflow* and *Custom Status* columns are read | Wrike Excel import template (`.xlsx`) with its *Workflow* / *Status* / *Custom Status* columns |
| [Wrike workflow](./Wrike/Wrike.md) | Paste the JSON of Wrike's `GET /workflows` in Rules → Import / Export: statuses become lists, and status groups become rules | The board's lists as a Wrike workflow JSON (Export menu, or Rules → Import / Export) |
| [Teamwork.com](./Teamwork/Teamwork.md) | The Excel template of its task import | Teamwork.com task import template (`.xlsx`) |
| [Businessmap (Kanbanize)](./Businessmap/Businessmap.md) | Advanced Search Excel export, or its import tool's workbook | Businessmap Excel workbook (`.xlsx`) |
| [ClickUp](./ClickUp/ClickUp.md) | Workspace export CSV, or its Spreadsheets importer CSV | ClickUp CSV |
| [Linear](./Linear/Linear.md) | Issues CSV export | Linear CSV |
| [Notion](./Notion/Notion.md) | *Markdown & CSV* export `.zip`, or one database CSV | Notion database CSV |
| [Redmine](./Redmine/Redmine.md) | Issues list *Also available in: CSV* | Redmine issues CSV |
| [Plane](./Plane/Plane.md) | Workspace Settings → Exports `.zip` (CSV, JSON or XLSX inside), or one file from it | — (Plane has no file import) |
| [Taiga](./Taiga/Taiga.md) | Project export (dump) JSON | Taiga project dump JSON, with sprints |
| [Pivotal Tracker](./Pivotal-Tracker/Pivotal-Tracker.md) | Stories CSV | Pivotal Tracker CSV |
| [MeisterTask](./MeisterTask/MeisterTask.md) | Project CSV | MeisterTask CSV |
| [Quire](./Quire/Quire.md) | Export CSV, or its Import CSV shape | Quire Import CSV |
| [Todoist](./Todoist/Todoist.md) | Project template CSV | Todoist CSV |
| [TickTick](./TickTick/TickTick.md) | Backup CSV | TickTick backup CSV |
| [Tasks.org](./Tasks-org/Tasks-org.md) | Backup JSON | Tasks.org backup JSON |
| [Super Productivity](./Super-Productivity/Super-Productivity.md) | Backup JSON | Super Productivity backup JSON |
| [Vikunja](./Vikunja/Vikunja.md) | Data export `.zip` | Vikunja data export `.zip` |
| [Kanboard](./Kanboard/Kanboard.md) | Project JSON | Kanboard JSON |
| [Nextcloud Deck](./Nextcloud-Deck/Nextcloud-Deck.md) | Board with `stacks` | Deck board JSON |
| [Focalboard](./Focalboard/Focalboard.md) | `board.jsonl` | Focalboard `.jsonl` |
| [Kanri](./Kanri/Kanri.md) | Board or all-data JSON export | Kanri board JSON |
| [Nullboard](./Nullboard/Nullboard.md) | `.nbx` board file | Nullboard `.nbx` |
| [Obsidian Kanban](./Obsidian-Kanban/Obsidian-Kanban.md) | The plugin's board Markdown file | Obsidian Kanban `.md` |
| [OpenProject](./OpenProject/OpenProject.md) | Work packages (`GET /api/v3/work_packages`) | OpenProject work packages JSON, with versions |

## Issue trackers and source code hosting

| Tool | Import | Export |
| --- | --- | --- |
| [GitHub](./GitHub/GitHub.md) | Issues array (`GET /repos/OWNER/REPO/issues`) | GitHub issues JSON |
| [GitLab](./GitLab/GitLab.md) | Issues array (`GET /projects/ID/issues`) | GitLab issues JSON, with milestones |
| [Gitea](./Gitea/Gitea.md) | Issues array (`GET /repos/OWNER/REPO/issues`) | Gitea issues JSON |
| [Forgejo](./Forgejo/Forgejo.md) | Issues array (the same API as Gitea) | Forgejo issues JSON |

GitHub, GitLab, Gitea and Forgejo import their issues JSON only through their
own API, so the exported file is for a script that calls it.

## Plain text, outlines and personal task files

| Format | Import | Export |
| --- | --- | --- |
| [Markdown](./Markdown/Markdown.md) | Task list | Markdown (`.md`) |
| [todo.txt](./Todo-txt/Todo-txt.md) | `todo.txt` lines | `todo.txt` |
| [Taskwarrior](./Taskwarrior/Taskwarrior.md) | `task export` JSON | Taskwarrior JSON |
| [Org mode](./Org-mode/Org-mode.md) | `.org` file | Org mode (`.org`) |
| [OPML](./OPML/OPML.md) | Outline from Workflowy, Dynalist, OmniOutliner, Logseq and others | OPML (`.opml`) |
| [Leo](./Leo/Leo.md) | Leo outline (`.leo`) | Leo outline |

## WeKan's own formats and documents

| Format | Import | Export |
| --- | --- | --- |
| [WeKan JSON](./WeKan/WeKan.md) | Board export, with attachments, rules and everything else | JSON, with or without attachments, or `.zip` with attachment files |
| [CSV / TSV](./CSV/CSV.md) | Comma, semicolon or tab separated | CSV `,` / CSV `;` / TSV |
| [Excel](./Excel/Excel.md) | WeKan-style `.xlsx` | Excel (`.xlsx`) |
| [PDF](./PDF/PDF.md), [HTML](./HTML/HTML.md) | — | PDF and an HTML archive of the board |
| [iCalendar](./iCalendar/iCalendar.md) | — | Calendar feed of the board's dates |
| [Dependencies](./Dependencies/Dependencies.md) | — | Dependency graph as JSON or SVG |
| [Rules](./Rules/Rules.md) | WeKan rules JSON or CSV, Trello Butler text, n8n and Node-RED workflows, Wrike workflows | WeKan rules JSON or CSV, Wrike workflow |

## People in the file

Every import asks once, under **People in the file**, what the people named in
the file become (`models/lib/importMembersMode.js`):

- **Choose an existing user for each of them**: the next step lists them, and
  you pick a WeKan user for each. Anyone you leave out becomes a placeholder.
- **Keep them as placeholder users**: each becomes an account that cannot log
  in, carrying the original username and name, so the board keeps who did
  what. A board admin maps it to a real user later. **Import without mapping
  members** does the same.
- **Make them all me**: every person becomes you.

**Import many boards** offers placeholders or you, since one person at a time
cannot be chosen across many files.

## Attachments

Attachments in an imported `.zip` are streamed into the attachment storage one
at a time, never held whole in memory, and held to the upload limit set in
**Admin Panel → Attachments → Limits**, if one is set
(`server/lib/importAttachmentStream.js`).

## Many boards at once

- **Import many boards**: on the import page of any tool, choose several of
  its export files, or one `.zip` that holds them, under **Import many
  boards**. Each file becomes its own board, and the page lists what each file
  became. A `.zip` that is itself one export (Vikunja, Notion, Plane, WeKan
  with attachments) is one board.
- **One board per project**: for the tools imported through the generalized
  importer (every tool but WeKan, Trello, CSV/TSV, Excel and Jira), this
  checkbox makes each swimlane the import would create its own board. Which
  swimlanes a tool makes - its projects, folders or lists - is on its page.
  An export that holds a whole app (Vikunja, Plane, Kanri's all data, ...)
  then imports as many boards, as a Trello `.zip` does.
- **Export all boards**: **All Boards → sidebar → Export all boards**, then a
  format, downloads every board you can export. Excel is one workbook with a
  sheet per board, named after it; every other format is a `.zip` with one
  file per board. **Multi-Selection → Export selected boards** does the same
  for the boards you selected.
- From a script: `python3 api.py importboardsfrom SOURCE [--split] FILES...`
  and `python3 api.py exportallboards FORMAT OUTPUT [--boards ID1,ID2]`.

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
# trello, jira, kanboard, planner, wrike, wrikeworkflow, notion, redmine, ...;
# also wekan, csv, scsv, tsv, excel and pdf)
python3 api.py exportboardformat BOARDID deck deck-board.json
#   → GET  /api/boards/:boardId/export/deck?authToken=:token

# Many boards: each file, or each file of a directory or .zip, as its own
# board (--split: one board per project); and every board in one download
python3 api.py importboardsfrom vikunja --split export1.zip export2.zip
python3 api.py exportallboards excel all-boards.xlsx
#   → GET  /api/export-all-boards/excel?authToken=:token[&boardIds=ID1,ID2]
```

## Related

- [Format coverage: every field of every format](./Format-Coverage.md)
- [Rules import and export, Wrike workflows](../Automation/Rules/Rules.md#import--export)
- [Kanboard](./Kanboard/Kanboard.md), [Jira](./Jira/Jira.md),
  [Trello](./Trello/trello/Migrating-from-Trello.md), [CSV/TSV](./CSV/CSV.md),
  [Excel](./Excel/Excel-and-VBA.md)
- [Migrate all boards from another WeKan](./Sync.md)
