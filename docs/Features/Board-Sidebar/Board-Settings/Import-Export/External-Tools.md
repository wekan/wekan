# Import / Export with other tools

## What it is

WeKan imports boards from some eighty sources and exports boards to some sixty formats
and tools. This page lists every tool and file WeKan reads and writes, with
a page of its own for each.

## Read more

- [Wikipedia: Data portability](https://en.wikipedia.org/wiki/Data_portability)
- [Wikipedia: Kanban board](https://en.wikipedia.org/wiki/Kanban_board)
- [Format coverage: every field of every format](./Format-Coverage.md)
- [Rules import and export, Wrike workflows](../../../Rules/Rules/README.md#import--export)
- [Kanboard](./Kanboard/README.md), [Jira](./Jira/README.md),
  [Trello](./Trello/trello/Migrating-from-Trello.md), [CSV/TSV](./CSV/README.md),
  [Excel](./Excel/Excel-and-VBA.md)
- [Migrate all boards from another WeKan](./Sync.md)

## How to use it

You use them from the existing menus:

- **Import**: **All Boards → Add Board → Import → Import board**, then pick
  the tool. The import page says where in that tool to get the file. Choose the file, or paste its
  text where the format is text.
- **Export**: **Board Settings → Export**. Choose the scope and the fields to
  include, then the format.
- Both list the tools under the same headings - WeKan, Kanban and project
  tools, Issue trackers and version control, Task and to-do apps,
  Spreadsheets and tables, Text and outlines, Mail, calendars, chats and
  notes, and Fetched from a service - from one table,
  `models/lib/toolGroups.js`, so a tool is in the same group on both.
- A company with more than one product there has a heading of its own, right
  after WeKan, and its products are listed under it without the company's
  name in front: **37signals** (Basecamp, Fizzy), **Atlassian** (Trello,
  Jira), **Google** (Takeout, Tasks, Keep) and **Microsoft** (Planner, To Do,
  Azure DevOps Boards, Lists, Project, Outlook, Teams, OneNote, Excel,
  GitHub). A company with one product stays under the heading of its kind.
- **Sandstorm** is a heading of the same kind, after Microsoft: the apps whose
  grain backups WeKan reads and writes (see [Sandstorm](./Sandstorm/README.md)).
- **Rules and workflows**: **Board Settings → Rules → Import / Export rules**
  (see [Rules](../../../Rules/Rules/README.md#import--export)).
Every import follows the tool's documented or source-verified file format.
After an import, a **loss report** lists what WeKan has no place for. It is
shown on the import page and in **Admin Panel → Problems → Recovery**. Most
exports are a **round trip**: the tool can read the file back, and so can
WeKan. The [format coverage table](./Format-Coverage.md) is the contract for
every field of every format: what maps where, what is reported, and the
sources of the format.

### Project and task tools

| Tool | Import (the file you give WeKan) | Export (the file WeKan writes) |
| --- | --- | --- |
| [Trello](./Trello/README.md) | Board JSON (Menu → More → Print and Export → Export JSON) | Trello board JSON |
| [Jira](./Jira/README.md) | Issue-search JSON (`GET /rest/api/3/search/jql?fields=*all`) | Jira issues JSON |
| [Asana](./Asana/README.md) | Tasks export JSON | Asana tasks JSON |
| [Zenkit](./ZenKit/README.md) | List export JSON | Zenkit list JSON |
| [Microsoft Planner](./Microsoft-Planner/README.md) | The Excel workbook from *Export as Excel* (classic: *Export plan to Excel*) | Planner Excel workbook (`.xlsx`) |
| [monday.com](./monday-com/README.md) | The workbook from *Export board to Excel* | monday.com Excel import table (`.xlsx`) |
| [Wrike](./Wrike/README.md) | Excel export, or Wrike's Excel import template; *Workflow* and *Custom Status* columns are read | Wrike Excel import template (`.xlsx`) with its *Workflow* / *Status* / *Custom Status* columns |
| [Wrike workflow](./Wrike/README.md) | Paste the JSON of Wrike's `GET /workflows` in Rules → Import / Export: statuses become lists, and status groups become rules | The board's lists as a Wrike workflow JSON (Export menu, or Rules → Import / Export) |
| [Teamwork.com](./Teamwork/README.md) | The Excel template of its task import | Teamwork.com task import template (`.xlsx`) |
| [Businessmap (Kanbanize)](./Businessmap/README.md) | Advanced Search Excel export, or its import tool's workbook | Businessmap Excel workbook (`.xlsx`) |
| [ClickUp](./ClickUp/README.md) | Workspace export CSV, or its Spreadsheets importer CSV | ClickUp CSV |
| [Linear](./Linear/README.md) | Issues CSV export | Linear CSV |
| [Notion](./Notion/README.md) | *Markdown & CSV* export `.zip`, or one database CSV | Notion database CSV |
| [Redmine](./Redmine/README.md) | Issues list *Also available in: CSV* | Redmine issues CSV |
| [Fizzy](./Fizzy/README.md) | Account export or personal data export `.zip`, or one card's `.json` | Fizzy account export `.zip` (its account import reads it) |
| [Plane](./Plane/README.md) | Workspace Settings → Exports `.zip` (CSV, JSON or XLSX inside), or one file from it | — (Plane has no file import) |
| [Taiga](./Taiga/README.md) | Project export (dump) JSON | Taiga project dump JSON, with sprints |
| [Pivotal Tracker](./Pivotal-Tracker/README.md) | Stories CSV | Pivotal Tracker CSV |
| [MeisterTask](./MeisterTask/README.md) | Project CSV | MeisterTask CSV |
| [Quire](./Quire/README.md) | Export CSV, or its Import CSV shape | Quire Import CSV |
| [Todoist](./Todoist/README.md) | Project template CSV | Todoist CSV |
| [TickTick](./TickTick/README.md) | Backup CSV | TickTick backup CSV |
| [Tasks.org](./Tasks-org/README.md) | Backup JSON | Tasks.org backup JSON |
| [Super Productivity](./Super-Productivity/README.md) | Backup JSON | Super Productivity backup JSON |
| [Vikunja](./Vikunja/README.md) | Data export `.zip` | Vikunja data export `.zip` |
| [Kanboard](./Kanboard/README.md) | Project JSON | Kanboard JSON |
| [Nextcloud Deck](./Nextcloud-Deck/README.md) | Board with `stacks` | Deck board JSON |
| [Focalboard](./Focalboard/README.md) | `board.jsonl` | Focalboard `.jsonl` |
| [Kanri](./Kanri/README.md) | Board or all-data JSON export | Kanri board JSON |
| [Nullboard](./Nullboard/README.md) | `.nbx` board file | Nullboard `.nbx` |
| [Obsidian Kanban](./Obsidian-Kanban/README.md) | The plugin's board Markdown file | Obsidian Kanban `.md` |
| [OpenProject](./OpenProject/README.md) | Work packages (`GET /api/v3/work_packages`) | OpenProject work packages JSON, with versions |
| [Planka](./Planka/README.md) | Fetched from its API with your address, username and password | — |
| [Microsoft To Do](./Microsoft-To-Do/README.md) | Fetched from Microsoft Graph with your access token | — |
| [Azure DevOps Boards](./Azure-DevOps/README.md) | A query's *Export to CSV* (a tree query keeps parents) | The CSV *Import from CSV* reads |
| [Microsoft Lists](./Microsoft-Lists/README.md) | A list's *Export to CSV* | The CSV *New list → From CSV* reads |
| [Microsoft Project (XML)](./Microsoft-Project/README.md) | *Save As → XML Format* (MSPDI) | Project XML that *File → Open* reads |
| [Microsoft OneNote](./Microsoft-OneNote/README.md) | Fetched from Microsoft Graph with your access token | OneNote pages `.zip` (Graph's create-page XHTML) |
| [KanbanFlow](./KanbanFlow/README.md) | Fetched from its API with the board's API token | — |
| [Basecamp](./Basecamp/README.md) | Fetched from its API with your account ID and access token: card tables and to-do lists | — |
| [Google Tasks](./Google-Tasks/README.md) | Fetched from its API with your access token | — |
| [Google Keep](./Google-Keep/README.md) | Fetched from its API with your access token (Google Workspace) | — |

### Issue trackers and source code hosting

| Tool | Import | Export |
| --- | --- | --- |
| [GitHub](./GitHub/README.md) | Issues array (`GET /repos/OWNER/REPO/issues`) | GitHub issues JSON |
| [GitLab](./GitLab/README.md) | Issues array (`GET /projects/ID/issues`) | GitLab issues JSON, with milestones |
| [Gitea](./Gitea/README.md) | Issues array (`GET /repos/OWNER/REPO/issues`) | Gitea issues JSON |
| [Forgejo](./Forgejo/README.md) | Issues array (the same API as Gitea) | Forgejo issues JSON |

GitHub, GitLab, Gitea and Forgejo import their issues JSON only through their
own API, so the exported file is for a script that calls it.

### Plain text, outlines and personal task files

| Format | Import | Export |
| --- | --- | --- |
| [Markdown](./Markdown/README.md) | Task list | Markdown (`.md`) |
| [todo.txt](./Todo-txt/README.md) | `todo.txt` lines | `todo.txt` |
| [Taskwarrior](./Taskwarrior/README.md) | `task export` JSON | Taskwarrior JSON |
| [Org mode](./Org-mode/README.md) | `.org` file | Org mode (`.org`) |
| [OPML](./OPML/README.md) | Outline from Workflowy, Dynalist, OmniOutliner, Logseq and others | OPML (`.opml`) |
| [Leo](./Leo/README.md) | Leo outline (`.leo`) | Leo outline |

### Mail, calendars, chats and notes

Mail shows in Board View → Email, chats in Board View → Chat (a channel is a
card, its messages the comments), and dated items in Calendar and Gantt.

| Tool | Import (the file you give WeKan) | Export (the file WeKan writes) |
| --- | --- | --- |
| [Mail (mbox, .eml)](./Mail/README.md) | An `.mbox` (Thunderbird, Apple Mail, mutt, Gmail) or one `.eml` message | Mail (mbox) |
| [iCalendar (.ics)](./iCalendar/README.md) | An `.ics` file: tasks (VTODO) by status, and events | Calendar feed of the board's dates |
| [Google Takeout](./Google-Takeout/README.md) | The Takeout `.zip`: Tasks, Keep, Mail, Calendar and Google Chat | — (Takeout is not imported back into Google) |
| [Slack](./Slack/README.md) | The workspace export `.zip` | — |
| [Mattermost](./Mattermost/README.md) | Bulk export `.jsonl` (`mmctl export create`) | Mattermost bulk import `.jsonl` |
| [Telegram](./Telegram/README.md) | Telegram Desktop's JSON export `result.json` | — |
| [WhatsApp](./WhatsApp/README.md) | *Export chat* `.txt` | — |
| [Discord (DiscordChatExporter)](./Discord/README.md) | DiscordChatExporter JSON | — |
| [Rocket.Chat](./Rocket-Chat/README.md) | "Download my data" as JSON `.zip`, one room's `.json`, or a CSV importer `.zip` | Rocket.Chat CSV importer `.zip` |
| [Microsoft Outlook (.msg)](./Microsoft-Outlook/README.md) | `.msg` files, or a `.zip` of `.msg` and `.eml` files | Microsoft Outlook (.eml) `.zip` |
| [Microsoft Teams](./Microsoft-Teams/README.md) | Fetched from Microsoft Graph, the personal export `.tar`, or Graph chat messages `.json` | Teams chats as Graph chat messages `.json` |
| [Evernote (.enex)](./Evernote/README.md) | Notes export `.enex` | Evernote (.enex) |

### Website

| Tool | Import | Export |
| --- | --- | --- |
| [WordPress (.xml)](./Website/README.md) | Tools → Export (WXR) `.xml` | WordPress (.xml) |
| [WordPress REST API (.json)](./Website/README.md) | `/wp-json/wp/v2/posts` and `/pages` `.json` | WordPress REST API (.json) |
| [Ghost](./Website/README.md) | Settings → Labs → Export `.json` | Ghost |
| [Blogger (.xml)](./Website/README.md) | Settings → Back up content `.xml` | Blogger (.xml) |
| [Hugo, Jekyll, Eleventy, Astro (.zip)](./Website/README.md) | The site's Markdown sources `.zip` | Hugo, Jekyll, Eleventy, Astro (.zip) |
| [HTML website, Medium (.zip)](./Website/README.md) | The site's `.html` files `.zip`, or Medium's export | HTML website (.zip) |
| [Substack (.zip)](./Website/README.md) | Settings → Exports `.zip` | — |

### Sandstorm

[Sandstorm](https://sandstorm.org) apps' grain backups: under the heading
**Sandstorm** on both the import page and the export menu. Rocket.Chat, Text
Editor, SandForms and Piwik keep their data in MongoDB's or MySQL's own files
and are not read.

| App | Import | Export |
| --- | --- | --- |
| [Sandstorm WeKan](./Sandstorm/README.md) | The grain backup `.zip` (Download backup) | — (import only) |
| [Sandstorm Prioritize](./Sandstorm/README.md) | The grain backup `.zip` (Download backup) | Sandstorm Prioritize grain backup `.zip` |
| [Sandstorm Yet Another TODO list](./Sandstorm/README.md) | The grain backup `.zip` (Download backup) | Sandstorm Yet Another TODO list grain backup `.zip` |
| [Sandstorm μTodo](./Sandstorm/README.md) | The grain backup `.zip` (Download backup) | Sandstorm μTodo grain backup `.zip` |
| [Sandstorm SandChat](./Sandstorm/README.md) | The grain backup `.zip` (Download backup) | Sandstorm SandChat grain backup `.zip` |
| [Sandstorm EtherCalc](./Sandstorm/README.md) | The grain backup `.zip` (Download backup) | Sandstorm EtherCalc grain backup `.zip` |
| [Sandstorm Radicale calendar](./Sandstorm/README.md) | The grain backup `.zip` (Download backup) | Sandstorm Radicale calendar grain backup `.zip` |
| [Sandstorm Radicale address book](./Sandstorm/README.md) | The grain backup `.zip` (Download backup) | Sandstorm Radicale address book grain backup `.zip` |
| [Sandstorm Davros](./Sandstorm/README.md) | The grain backup `.zip` (Download backup) | Sandstorm Davros grain backup `.zip` |
| [Sandstorm Hacker CMS](./Sandstorm/README.md) | The grain backup `.zip` (Download backup) | Sandstorm Hacker CMS grain backup `.zip` |
| [Sandstorm Gogs](./Sandstorm/README.md) | The grain backup `.zip` (Download backup) | — (import only) |
| [Sandstorm WordPress](./Sandstorm/README.md) | The grain backup `.zip` (Download backup) | — (import only) |

### WeKan's own formats and documents

| Format | Import | Export |
| --- | --- | --- |
| [WeKan JSON](./WeKan/README.md) | Board export, with attachments, rules and everything else | JSON, with or without attachments, or `.zip` with attachment files |
| [CSV / TSV](./CSV/README.md) | Comma, semicolon or tab separated | CSV `,` / CSV `;` / TSV |
| [Excel](./Excel/README.md) | WeKan-style `.xlsx` | Excel (`.xlsx`) |
| [PDF](./PDF/README.md), [HTML](./HTML/README.md) | — | PDF and an HTML archive of the board |
| [Dependencies](./Dependencies/README.md) | — | Dependency graph as JSON or SVG |
| [Rules](./Rules/README.md) | WeKan rules JSON or CSV, Trello Butler text, n8n and Node-RED workflows, Wrike workflows | WeKan rules JSON or CSV, Wrike workflow |

### People in the file

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

### Attachments

Attachments in an imported `.zip` are streamed into the attachment storage one
at a time, never held whole in memory, and held to the upload limit set in
**Admin Panel → Attachments → Limits**, if one is set
(`server/lib/importAttachmentStream.js`).

### Large files

A file chosen on the Import page for any tool of the generalized importer is
sent to the server a part at a time (`POST /api/import/upload/:source`,
`server/routes/importUpload.js`) and written to `WRITABLE_PATH/import-uploads`,
never held whole in the browser or in the server's memory on the way:

- before the first byte, the size the browser announces is checked against
  the largest import the administrator set (Admin Panel → Settings → Security)
  and against the free space of that disk, less a reserve
  (`IMPORT_DISK_RESERVE_MB`, default 512 MB); while it is written, the space is
  checked again every 64 MB. An import that would fill the disk is refused with
  that reason, and its partial file is removed;
- with no limit set, an import may be as large as the free disk space lets it
  finish;
- a `.zip` export (Slack, Google Takeout, Vikunja, Notion, Plane, Rocket.Chat,
  Fizzy) is opened from the disk, its entries read as they are needed, and what they inflate to is
  counted against the limit or the free space; a mailbox is read a message at
  a time, also inside a Takeout zip;
- JSON is built from the file a chunk at a time (`server/lib/streamJson.js`),
  so an export larger than one JavaScript string - about 512 MB - can still be
  read; a Mattermost export is read a line at a time;
- a Jira file is uploaded too, and the people of its map-members step are read
  from it on the server; a CSV / TSV file's header, sample rows and people come
  from the server for its column mapping step;
- the file is removed once it has been read, or after an hour.

`tests/importUpload.test.cjs` covers the limit, the full disk before and during
the upload, an interrupted upload and how each source reads its file.

### Many boards at once

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

### Not supported yet

These tools have no export file to read: only an API, which needs live
credentials to build and verify against. Planka, Microsoft To Do, KanbanFlow,
Basecamp, Google Tasks and Google Keep are imported now by reading their API
(**Fetched from a service** on the import page); Taskcafe is not. Restyaboard's CSV export is a closed paid
app with undocumented columns. YouTrack, Airtable and Leantime write CSV
headers that are undocumented or in the user's language. Things 3 exports only
its SQLite database. Wrike's automation rules have no export, import or API.
[TODO.md](../../../../../TODO.md) keeps the reason for each (it was the TODO
Later section of the changelog).

### REST API and `api.py`

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

## How the numbers are calculated

- **Import sources**: the entries of `IMPORT_SOURCES` in
  [models/lib/importSources.js](../../../../../models/lib/importSources.js),
  85 today, WeKan's own included; some are several products of one tool, such
  as the Sandstorm grain apps and the website platforms.
- **Export formats**: the entries of `EXPORT_FORMAT_GROUPS` in
  [client/components/boards/exportScope.js](../../../../../client/components/boards/exportScope.js),
  some sixty.
- The size limits of large files and of many boards at once are given above
  and on each format's page.

## How it works in WeKan

The import page reads its sources from one list,
[models/lib/importSources.js](../../../../../models/lib/importSources.js), and
the export menu its formats from
[client/components/boards/exportScope.js](../../../../../client/components/boards/exportScope.js);
both group them by [models/lib/toolGroups.js](../../../../../models/lib/toolGroups.js).
[tests/importExportDocsCoverage.test.cjs](../../../../../tests/importExportDocsCoverage.test.cjs)
checks that every source and format is named on this page and has its own
page, so the page cannot go stale again.

## Commits

 - [Docs: Import / Export formats Super-Productivity to monday-com: what each feature is, how to use it, how its numbers ](https://github.com/wekan/wekan/commit/f4264cf7a9de67e84b1b38ad9ee5c3f0ccea4598)
 - [Website: import and export WordPress, Ghost, Blogger, static and HTML sites, and the board as a website at a public ](https://github.com/wekan/wekan/commit/2e8549032ea4b44e90a96eb53a4e1941f53a5261)
 - [Import and export Sandstorm grain backups](https://github.com/wekan/wekan/commit/6f3f6cc5a83df1b91a40d6afae261a74cf5b6507)
 - [Import and export Azure DevOps Boards, Microsoft Lists, Project, Outlook, Teams and OneNote](https://github.com/wekan/wekan/commit/01e88410cd7440b26c5f845d98ae058f93c16a85)
 - [Import and Export: a company's products under the company's name](https://github.com/wekan/wekan/commit/fa28e3fba81f3f5eafc8cb7044133cc330e12b80)
 - [Import and export Rocket.Chat and Fizzy](https://github.com/wekan/wekan/commit/dffbafd30fd16978dbae49a4e0d576bb1ff017ec)
 - [Telegram and Discord imports bring their message files: a zipped export folder's photos and files are attachments](https://github.com/wekan/wekan/commit/828ca63713b0a034c9e1c436341cd60435c01443)
 - [Trello .zip export: the Trello board JSON with the cards' attachment files, imported back with them](https://github.com/wekan/wekan/commit/e8330fb090c885c9d8ea015ed896c34a9b6cf251)
 - [Import page uploads stream to the server's disk, checked against the free space and an Admin Panel limit](https://github.com/wekan/wekan/commit/32c24ed84e9d6c8080e89bdd4097f87a3b0b4b04)
 - [Board View menu and the Import and Export lists are grouped under headings](https://github.com/wekan/wekan/commit/257835733b0ec5d950fac6feb2e13c589219bb9d)
 - [Import and export mail, calendars, chats and notes: mbox/.eml, iCalendar, Google Takeout, Slack, Mattermost, Telegram ](https://github.com/wekan/wekan/commit/ccfa6cf362e9b1eb812804d38e4d85653c5b0b0a)
 - [Import: Planka, Microsoft To Do, KanbanFlow, Basecamp, Google Tasks and Google Keep from their APIs](https://github.com/wekan/wekan/commit/46e30f01e48f2676a47c0052007f5c4ea951a923)
 - [Export boards to Trello, keep swimlanes as labels, and reach Trello from Sandstorm](https://github.com/wekan/wekan/commit/88d00e02f1251716e345b7bbd32185417b08842d)
 - [Read every import source through one path and one file chooser, from one description of the sources](https://github.com/wekan/wekan/commit/c80a656901103bfd29b41843c7e255b4ed3bfa17)
 - [Choose who an import's people become, for every import, and stream imported attachments](https://github.com/wekan/wekan/commit/73db241bd4628070ea95f10a83ace8d4c7cd2497)
 - [Import and export many boards at once for every format, and document each format in its own directory](https://github.com/wekan/wekan/commit/7858d84e127c2c6cd92134166352b9a4245d4ec2)
 - [Document every import and export format WeKan supports](https://github.com/wekan/wekan/commit/2ea4d09678df52b9a7d06f7064ff3ad6b3a8024b)
 - [Add shared HTML4 import source picker](https://github.com/wekan/wekan/commit/ca008534fae653d57617bd1513609401ec93fbd5)
 - [Design complete restart-safe import and export](https://github.com/wekan/wekan/commit/5154939a412c2e344392a07d339ced0d7132be16)
 - [More Import Export and Rules features](https://github.com/wekan/wekan/commit/f0bce67a3bf301c21ded3eb97e84a3be0010290f)
