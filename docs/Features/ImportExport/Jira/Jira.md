# Jira

WeKan imports boards from [Jira](https://www.atlassian.com/software/jira) and
exports a board in the same shape. It reads the JSON of Jira's REST API issue
search, `{ "issues": [...] }`: statuses become lists and issues become cards.
Comments, sub-tasks, custom fields, time tracking, estimates, issue types,
status categories, sprints, fix versions, rank, epics and issue links are
mapped as described below.

## How to import

1. In Jira, save the issues of the project from the REST API issue search.
   On Jira Cloud this is
   [`GET /rest/api/3/search/jql`](https://developer.atlassian.com/cloud/jira/platform/rest/v3/api-group-issue-search/).
   Ask for every field and for the field names and schema, for example
   `?jql=project=KEY&fields=*all&expand=names,schema`: without `fields` the
   search returns only issue ids, and the schema is what lets WeKan find the
   Sprint, Rank, Epic Link and story points fields.
2. The search is paged with `nextPageToken`. Put every page's `issues` into
   one `issues` array: WeKan imports what is in the file, and reports when the
   file says more pages exist.
3. In WeKan, go to **All Boards → New → Import → Jira**.
4. Paste the JSON into the text box. Tick the parts to import. Optionally
   enter the Scrum estimate field and its unit (see
   [Explicit Scrum estimate mapping](#explicit-scrum-estimate-mapping)).
5. Click **Import**. WeKan then asks you to map the Jira assignees to WeKan
   users. Map them and click **Done**, or click **Import without mapping
   members (map later)**.
6. Read the loss report on the import page. It is also kept in **Admin Panel →
   Problems → Recovery**.

The import page's instruction text names the current search,
`GET /rest/api/3/search/jql` with `fields=*all&expand=names,schema`; without
`fields` it returns only issue ids. A large project comes in pages, each with a
`nextPageToken` for the next: join the pages' `issues` into one array, or
import each page as its own board with **Import many boards**. The older
`/rest/api/2/search` answer, `{ "issues": [...] }` with `startAt` and `total`,
is read too. The file may also carry an `automationRules` array, which is
imported as rules (see Format details).

## How to import many boards at once

- On the import page, under **Import many boards**, choose several Jira JSON
  files, or one `.zip` that holds them. Each file becomes its own board,
  imported without member mapping. Members can be mapped later. Click **Import**
  to import them.
- The checkbox **One board per project** is not offered for Jira: Jira is
  imported by its own importer, and a Jira file is always one board, in one
  swimlane. To get one board per Jira project, search each project into its
  own file and import the files together.
- From a script:
  `python3 api.py importboardsfrom jira FILE_OR_DIR ...` takes files,
  directories of files, or `.zip` files.

## How to export

1. In WeKan, open the board, then **Board Settings → Export**.
2. Under **Select what to include:**, tick the parts to export. **Dates**
   controls spent time, **Custom Fields** the estimates, and **Scrum
   settings** the issue types, status categories and fix versions.
3. Under **JSON**, choose **Jira**. The board downloads as a `.json` file in
   the issue search shape.
4. Jira does not import this file. Jira Cloud's External System Import reads
   CSV and a JSON layout of its own, not search results
   ([Import and export your data](https://support.atlassian.com/jira-cloud-administration/docs/import-and-export-your-data-to-and-from-jira-cloud/)).
   The file is what WeKan's own Jira import reads, so a board round-trips
   through it.

## How to export all boards at once

1. **All Boards → sidebar → Export all boards**, then choose **Jira**.
   This downloads one `.zip` with one Jira file per board you can
   export: boards you are a member of, that are not archived and are not
   templates. A board you may not export is left out and named in
   `skipped.txt` in the `.zip`.
2. To export only some boards, use **Multi-Selection** in the All Boards
   sidebar, select the boards, then **Export**.

From a script: `python3 api.py exportallboards jira boards.zip`.

## Format details

From the [format coverage](../Format-Coverage.md) audit:

- **Current authoritative shape:**
  [REST API v3 issue search](https://developer.atlassian.com/cloud/jira/platform/rest/v3/api-group-issue-search/)
  and per-project/type schemas.
- **Required import coverage:** ADF or string descriptions, status, type,
  priority, reporter/assignee, labels, components, versions, sprint/epic/parent
  links, subtasks, dates, estimates, comments, attachments and
  schema-described custom fields.
- Jira is one of the external adapters that map the listed fields that have a
  WeKan equivalent: comments (posted by the mapped user, otherwise by the
  importer with the source author's name leading the text), sub-tasks as child
  cards when they are imported too and as a checklist otherwise, parent
  hierarchy and dependencies between issues of the same import, custom-field
  values as typed board custom fields, and source order. File contents (the
  search carries attachment metadata only) are reported.

What the current code does (`models/jiraCreator.js`,
`models/lib/jiraIssueExtras.js`):

- The board is named after `board.name`, else the first issue's project.
- A card's title is `[KEY] summary`. Atlassian Document Format descriptions
  and comments become plain text, keeping paragraph breaks.
- Labels, the priority (`priority:<name>`), components and fix versions
  (`version:<name>`) become black board labels.
- Sub-tasks that are not in the file become a checklist **Sub-tasks**; a
  sub-task whose status category is `done` is a finished item. A sub-task or
  child issue that is in the file keeps its parent.
- `customfield_NNNNN` values become custom fields, named from the search
  response's `names` map when it is there.
- The reporter is kept as **Requested by**, as text, so it survives an import
  from a Jira nobody on the board has an account on.
- Issues are kept in search order, which is the JQL's `ORDER BY`.
- `automationRules`: rules that already use, or closely resemble, WeKan's
  `{ title, trigger, action }` shape are imported. Jira's native automation
  export is proprietary; rules that cannot be mapped are skipped.

### Native JSON time-tracking import

The native Jira JSON import reuses WeKan's spent-time field (hours) and
numeric custom fields for original and remaining estimates (hours). It creates
only fields supplied by the export, hides them from minicards by
default, and allows selecting the original estimate through existing Scrum
estimate settings.
It accepts numeric second values from `fields.timetracking`, or the equivalent
flat issue fields when the nested value is absent. Explicit zeroes are preserved.
Validation runs before creating the board. Localized duration strings are not
parsed, partial worklog pages are not summed, and no historical sessions are
fabricated. Native WeKan export retains these values. Jira sprint mapping and
synchronization remain separate implementation work.

The numeric fields follow [Atlassian's issue API](https://developer.atlassian.com/cloud/jira/software/rest/api-group-issue/).
The two numeric custom fields are named `Jira original estimate (hours)` and
`Jira remaining estimate (hours)`. Native WeKan custom-field settings control
their visibility; no new permission or external service is introduced.

On the import page, Dates selects spent time and Custom Fields selects
original/remaining estimates. Both nested and flat source values are removed
when their section is excluded, so fallback values cannot restore them.

Jira JSON export converts these hours back to integer seconds. Dates selection
controls spent time; Custom Fields controls original/remaining estimates.
Imported estimate fields carry `settings.jiraTimeField` markers, so renaming
one does not break export. Export does not infer meaning from matching names.
Older fields without markers, duplicate mappings and invalid values are omitted.
Native WeKan export/import and whole-board duplication retain the markers,
remap custom-field IDs and preserve Scrum's selected estimate field. Browser
regression coverage exports the resulting boards back to Jira and verifies
the original numeric seconds. This preserves time totals, not
individual worklog entries or all Jira Scrum data.

### Explicit Scrum estimate mapping

On the Jira import page, optionally enter the numeric estimate field ID
(for example `customfield_10016`) and its unit (for example `points`). Both
Scrum and Custom Fields must be selected. The importer uses this exact field,
never a guessed field name or a fixed installation-specific field number.
It creates one hidden numeric custom field and selects it as the board's Scrum
estimate source. Scrum remains disabled and its optional fields remain hidden.

The JSON equivalent is `wekanScrumMapping: { estimateFieldId:
"customfield_10016", estimateUnit: "points" }` at the document root.
Missing/null estimates stay unknown and explicit zero is preserved. Non-numeric,
negative or excessive values fail before board creation. The selected field must
occur in the issues or have a numeric entry in the root `schema`; an included
schema entry must declare it numeric. Jira export retains the original field ID
and mapping. Native export and board duplication retain the custom-field markers
and remap the local estimate field. Duplicate export mappings are omitted.
This mapping does not reconstruct historical sprint estimates or enable Sync.

When the export includes its field schema (search with `expand=names,schema`),
the field box offers the numeric fields it declares, story points first. If
exactly one field has Jira Software's story points type
(`com.pyxis.greenhopper.jira:jsw-story-points`) and no field is entered, that
field is used, in points - it is identified by its type, not by its name. With
two such fields, or none, nothing is chosen for you.

### Scrum issue types and workflow categories

The Jira importer maps `fields.issuetype.name` to the existing hidden Scrum
issue-type field. It maps stable `status.statusCategory.key` values `new`,
`indeterminate` and `done` to list categories `todo`, `doing` and `done`.
It never infers completion from translated status names. Board administrators
can select the existing done-list completion policy in Scrum settings; import
does not enable Scrum or change the default completion policy or visibility.

The Scrum import selection controls both mappings. Invalid issue-type values
and conflicting known categories for statuses merged into the same named list
are rejected before creating the board. Unknown category keys remain unmapped.
Jira export includes the same fields when Scrum is selected. A WeKan `backlog`
list category has no distinct Jira status category and is omitted.

Status names are treated as literal text, including names such as `constructor`
or `__proto__`. Dependency references resolve only to issue keys present in
the imported file; missing keys cannot resolve to JavaScript object properties.

These mappings follow the [Jira issue field representation](https://developer.atlassian.com/cloud/jira/platform/rest/v3/api-group-issues/)
and [stable status category keys](https://docs.atlassian.com/DAC/javadoc/jira/reference/com/atlassian/jira/issue/status/category/StatusCategory.html).
Sprint snapshots, multiple fix versions, epic relationships and
automatic schema mapping remain separate implementation work. In particular,
an external sprint's current membership cannot reconstruct its original
commitment snapshot. Native WeKan export retains imported issue types and list
categories through the existing Scrum transfer format.

### Sprints, fix versions, rank and epics

Search with `expand=names,schema` so the export says which custom fields are
the Sprint, Rank and Epic Link fields. WeKan finds them by their schema type
(`gh-sprint`, `gh-lexo-rank`, `gh-epic-link`) or, without a schema, by those
names; it never guesses a `customfield_*` number. Then:

| Jira | WeKan |
| --- | --- |
| Future sprint | Planned sprint with its goal and dates; the card's sprint |
| Active sprint | Planned sprint, reported in Admin Panel → Problems → Recovery: issue search has no commitment snapshot, so start it in WeKan to begin measuring |
| Closed sprint | Not imported, reported: WeKan does not invent a commitment or close snapshot |
| Fix version | Release, released with its date or planned. Every fix version is one of the card's releases (a card can be in several since 2026-10-08). Versions still also become `version:` labels |
| Rank | Backlog order: backlog rank 1, 2, ... in Jira's rank order |
| Epic Link | The card's parent when the epic is imported too; otherwise reported. Newer Jira's `parent` was already followed |

Both of Jira's sprint forms are read: sprint objects, and the older
`com.atlassian.greenhopper.service.sprint.Sprint@...[id=...,state=...]`
strings. The board's Scrum settings are turned on when sprints or releases are
imported. These fields are not also imported as text custom fields.

Jira export writes each of a card's releases as one of its `fixVersions` when
Scrum is selected: the original Jira version id when the release came from
Jira (the WeKan release id otherwise), whether it is released, its planned end
as `releaseDate` and its notes as `description`. Importing that file gives the
card the same releases again.

### Duplicate issue links

Standard Jira `Duplicate` issue links now import as `duplicates` for
`outwardIssue` and `is-duplicated-by` for `inwardIssue`, following the
[Atlassian issue-link model](https://developer.atlassian.com/cloud/jira/platform/issue-linking-model/)
and [Data Center link types](https://developer.atlassian.com/server/jira/platform/rest/v11000/api-group-issuelink/).
Both endpoints must be included in the imported board. Self-links and missing
targets are skipped; the existing one-relation-per-target rule still applies.
The names `Duplicate` and `Duplicates` are recognized case-insensitively.
Custom/localized link names retain the existing generic relation fallback.

The relation is editable in card details and survives native WeKan board
export/import and History restoration. It does not merge duplicate cards or
change blocker analytics. The separate Jira JSON exporter currently omits
issue links; native WeKan export is the supported transfer path for these links.

Other issue links: a link type whose name contains `block` becomes blocks
(outward) or is-blocked-by (inward); any other type becomes related-to.

## What is kept

| Jira | WeKan |
| --- | --- |
| `board.name`, else the project name | Board title |
| `status.name` | List |
| `status.statusCategory.key` | List category (with Scrum) |
| `key`, `summary` | Card title `[KEY] summary` |
| `description` (ADF or text) | Description |
| `labels`, `priority`, `components`, `fixVersions` | Labels |
| `assignee` | Card member, when mapped |
| `reporter` | Requested by |
| `created`, `duedate`, `updated` | Creation date, due date, modified date |
| `timetracking` (or flat time fields) | Spent time; original and remaining estimate fields |
| Chosen estimate field | Hidden number field, the Scrum estimate |
| `issuetype.name` | Scrum issue type (with Scrum) |
| `parent`, Epic Link | Parent card |
| `subtasks` not in the file | Checklist **Sub-tasks** |
| `issuelinks` | Dependencies |
| `comment.comments` | Comments |
| `customfield_NNNNN` | Custom fields |
| Sprint, fix version, Rank | Scrum sprint, release, backlog rank |
| `automationRules` | Rules |

The export writes `board.name`, and per card an issue `WEKAN-1`, `WEKAN-2`...
with `summary`, `description`, `status` (the list, with its category when
Scrum is selected), `issuetype` and `fixVersions` (with Scrum), `labels`,
`duedate`, `timetracking`, `created`, the owner as `assignee`, Requested by
(else the creator) as `reporter`, `parent`, every checklist item as a
`subtasks` entry, the comments and the custom fields as `customfield_90001`, `customfield_90002`...
with a `names` map. With an estimate mapping it also writes
`wekanScrumMapping` and `schema`.

## What is not kept

The import reports these on the loss report:

- attachments (the search API carries metadata, not file contents);
- a parent or Epic Link to an issue that is not in the file;
- more result pages than the file holds (`nextPageToken`, or a `total`
  larger than the issues in the file);
- active sprints (imported as planned) and closed sprints;
- more than 50 custom fields.

Invalid estimate values, invalid issue types and conflicting status categories
stop the import before the board is created.

Assignees who are not mapped do not become card members. Only the first
assignee is read.

The export leaves out archived cards and lists, swimlanes, issue links,
attachments and checklists other than as sub-task entries. Several checklists
are flattened into one sub-task list.

## REST API

```bash
python3 api.py importboardfrom jira issues.json               # POST /api/boards/import/jira
python3 api.py importboardsfrom jira a.json b.json dir/       # one board per file
python3 api.py exportboardformat BOARDID jira issues.json     # GET /api/boards/BOARDID/export/jira?authToken=TOKEN
python3 api.py exportallboards jira boards.zip                # GET /api/export-all-boards/jira?authToken=TOKEN
```

`GET /api/export-all-boards/jira?authToken=TOKEN&boardIds=ID1,ID2` exports
only the boards listed.

Jira is also a source for list Sync, which re-fetches issues into an existing
list; see [Sync](../Sync.md).

## How it is built and tested

- `models/jiraCreator.js` creates the board. `models/lib/jiraIssueExtras.js`,
  `models/lib/jiraTimeTracking.js`, `models/lib/jiraEstimateMapping.js`,
  `models/lib/jiraScrumMetadata.js` and `models/lib/jiraScrumPlanning.js`
  read the parts of an issue. `client/components/import/jiraMembersMapper.js`
  lists the assignees to map.
- `models/lib/externalExportFormatters.js` (`jira`) writes the export, from
  what `models/lib/externalExporters.js` collects.
- Unit tests: `tests/jiraIssueExtras.test.cjs`,
  `tests/jiraTimeTracking.test.cjs`, `tests/jiraEstimateMapping.test.cjs`,
  `tests/jiraScrumMetadata.test.cjs`, `tests/jiraScrumPlanning.test.cjs`,
  `tests/kanboardJiraCreator.import.test.cjs` and
  `tests/externalExportRoundTrip.test.cjs`. The fixture is
  `tests/fixtures/import-formats/jira.json`.
- Playwright: `tests/playwright/specs/import-export-format-audit.e2e.js`
  (importing the fixture through the page, refusing malformed JSON),
  `jira-time-import.e2e.js`, `jira-estimate-import.e2e.js`,
  `jira-scrum-import.e2e.js`, `duplicate-dependencies.e2e.js` (Jira duplicate
  links through native board transfer), and the `list-sync-*.e2e.js` cases
  for Sync, all in `tests/playwright/specs/`.

## Sources

- [Issue search](https://developer.atlassian.com/cloud/jira/platform/rest/v3/api-group-issue-search/):
  `GET /rest/api/3/search/jql`, its `fields`, `expand` and `nextPageToken`
- [Issues](https://developer.atlassian.com/cloud/jira/platform/rest/v3/api-group-issues/)
  and [Jira Software issue API](https://developer.atlassian.com/cloud/jira/software/rest/api-group-issue/):
  the issue fields and estimates
- [StatusCategory](https://docs.atlassian.com/DAC/javadoc/jira/reference/com/atlassian/jira/issue/status/category/StatusCategory.html):
  the stable status category keys
- [Issue-linking model](https://developer.atlassian.com/cloud/jira/platform/issue-linking-model/)
  and [Data Center link types](https://developer.atlassian.com/server/jira/platform/rest/v11000/api-group-issuelink/):
  link directions
- [Import and export your data](https://support.atlassian.com/jira-cloud-administration/docs/import-and-export-your-data-to-and-from-jira-cloud/):
  what Jira Cloud imports

## More

### Migrate from Jira Server (Atlassian) to Wekan

Originally from @webenefits at https://github.com/wekan/wekan/discussions/3504

Hello all,

I wanted to share here my experience with migrating data from Jira (Server) to Wekan. It took me 1 - 2 days to find a solution and I think it makes sense to record it here so that successors have it easier.

In order to not transfer everything manually and still keep all comments and (at least) links to attachments from Jira, my plan was to first migrate everything from **Jira → Trello** and then from **Trello → Wekan**, since importing from Trello works very well. :ok_hand:

Unfortunately there is no "easy" variant to transfer data from Jira to Tello.
First of all, I found "TaskAdpater" through various threads, which allows you to transfer data between different tools (including Jira and Trello). This would have been a nice way to do it, since the data would not have gone through a third party. Unfortunately, this didn't work because of the newer API token authentication in combination with Jira server. Also other suggested things like "Zapier" were not really functional.

When I had almost given up, I had the idea to look for "Power Ups" (Addons) in Trello. And indeed, I found what I was looking for! The power up is called "Unito Sync". It allows you to synchronize individual projects in both directions between tools like Jira and Trello. And the best: There is a 14-day trial version.

That's how it worked in the end. You have to migrate each project separately and make some fine adjustments afterwards. However, all data including comments and attachments (as links) are integrated!

Here again briefly the way:

1. Create a Trello dummy account
2. Create a new board there
3. Install and register Power Up Unito Sync
4. Create a new "flow" for the current project in Unito Sync
5. Synchronize
6. Export data from Trello again afterwards
7. Import JSON into Wekan


I hope I could save you some work with this. Good luck! :four_leaf_clover:
Greetings
Alexander

### Related

- https://www.theregister.com/2023/10/16/atlassian_cloud_migration_server_deprecation/
- https://news.ycombinator.com/item?id=37897351

See also: [format coverage](../Format-Coverage.md),
[all formats](../External-Tools.md), [Trello](../Trello/Trello.md).
