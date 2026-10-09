# OpenProject

WeKan imports boards from [OpenProject](https://www.openproject.org/) and
exports a board in the same shape. It reads a work-packages collection from
OpenProject's API v3 (HAL+JSON): statuses become lists and work packages
become cards. Versions and sprints become Scrum releases and sprints.

## How to import

1. In OpenProject, create an API token in your account settings. API v3 takes
   it with basic authentication, with the user name `apikey`
   ([API introduction](https://www.openproject.org/docs/api/introduction/)).
2. Save the work packages of the project:

   ```bash
   curl -u apikey:TOKEN \
     "https://YOUR_OPENPROJECT/api/v3/projects/PROJECT/work_packages?pageSize=1000" > work_packages.json
   ```

   The collection is paged ([collections](https://www.openproject.org/docs/api/collections/)).
   The file must hold every page you want: WeKan imports what is in the file.
   Comments, relations, watchers, attachments, versions and sprints are read
   only when they are embedded in the file (see Format details).
3. In WeKan, go to **All Boards → New → Import → OpenProject**.
4. Paste the JSON into the text box. Tick the parts to import. **Scrum
   settings** decides whether versions, sprints, position and story points are
   imported.
5. Click **Import**. OpenProject has no member-mapping step in WeKan, so the
   people in the file do not become card members; the author is kept as
   **Requested by**.
6. Read the loss report on the import page. It is also kept in **Admin Panel →
   Problems → Recovery**.

## How to import many boards at once

- On the import page, under **Import many boards**, choose several OpenProject
  JSON files, or one `.zip` that holds them. Each file becomes its own board,
  imported without member mapping. Members can be mapped later. Click **Import**
  to import them.
- The checkbox **One board per project** makes no difference for OpenProject:
  every work package is imported into one swimlane, **Default**. To get one
  board per OpenProject project, save one collection per project and import
  the files together.
- From a script:
  `python3 api.py importboardsfrom openproject FILE_OR_DIR ...` takes files,
  directories of files, or `.zip` files.

## How to export

1. In WeKan, open the board, then **Board Settings → Export**.
2. Under **Select what to include:**, tick the parts to export. Tick **Scrum
   settings** to write sprints, versions and backlog position.
3. Under **JSON**, choose **OpenProject**. The board downloads as a `.json`
   file.
4. OpenProject has no import for a work-packages collection. To create the
   work packages, send them through its API v3 (see the
   [API documentation](https://www.openproject.org/docs/api/introduction/)).
   The file is also what WeKan's own OpenProject import reads.

## How to export all boards at once

1. **All Boards → sidebar → Export all boards**, then choose **OpenProject**.
   This downloads one `.zip` with one OpenProject file per board you can
   export: boards you are a member of, that are not archived and are not
   templates. A board you may not export is left out and named in
   `skipped.txt` in the `.zip`.
2. To export only some boards, use **Multi-Selection** in the All Boards
   sidebar, select the boards, then **Export**.

From a script: `python3 api.py exportallboards openproject boards.zip`.

## Format details

From the [format coverage](../Format-Coverage.md) audit:

- **Current authoritative shape:**
  [API v3 HAL+JSON](https://www.openproject.org/docs/api/introduction/),
  the work-package collection and its embedded per-project/type
  [schemas](https://www.openproject.org/docs/development/concepts/resource-schemas/).
- **Required import coverage:** HAL links, status/type/priority,
  assignee/responsible, dates/duration, hierarchy/relations, watchers,
  comments, attachments, schema-described custom fields, and versions,
  sprints, position and story points as Scrum planning.
- OpenProject is one of the external adapters that map the listed fields that
  have a WeKan equivalent: comments (posted by the mapped user, otherwise by
  the importer with the source author's name leading the text), parent
  hierarchy and dependencies between work packages of the same import,
  custom-field values as typed board custom fields, start and creation dates,
  several assignees and source order. Creation dates survive the schema's
  `createdAt` autoValue through `writeImportedEntity`. File contents (the JSON
  carries attachment metadata only) are reported. OpenProject watchers become
  card watchers when they are mapped to a member of the new board; watching
  grants no access, but a non-member watching a private board would receive
  its notifications, so any other watcher is counted in the loss report
  instead.

Scrum planning (`models/lib/externalScrumPlanning.js`), written through the
same journaled Scrum import stage as Jira and WeKan JSON
(`server/lib/scrumTransferImport.js`), so an interrupted import is recovered
like theirs ([Scrum import recovery](../Scrum-Import-Recovery.md)):

- **Sprints:** a work package's `sprint` link
  ([Sprint](https://www.openproject.org/docs/api/endpoints/sprints/): `name`,
  `startDate`, `finishDate`, status URN `in_planning` is planned).
- **Releases:** a work package's `version` link
  ([Version](https://www.openproject.org/docs/api/endpoints/versions/):
  `name`, `description`, `startDate`, `endDate`; `open` and `locked` are
  planned, `closed` is released).
- **Also:** `position` as the backlog rank; `storyPoints` as a numeric
  **Story points** field that becomes the board's Scrum estimate.
- **Reported, not imported:** the collection only links versions and sprints.
  Their dates and status are read when embedded (on the work package, or as
  `_embedded.versions` / `_embedded.sprints` beside the elements); a link alone
  keeps its title and is reported. An `active` sprint is imported as planned
  (the export has no commitment snapshot), and a `completed` one is not
  imported at all (no commitment or close snapshot).
- Two records with the same name stay two records and are reported; one
  source id listed on many work packages is one record. A card in a sprint
  that is not imported stays in the backlog.
- The OpenProject export writes each card's sprint and release back as
  `sprint` and `version` links with `_embedded.sprints` /
  `_embedded.versions` and `position`, when Scrum settings are selected. A
  cancelled sprint or release has no equivalent there and is left out. The
  format carries no commitment snapshot, so an exported active or closed
  sprint comes back as described above.

What the current code does (`parseOpenProject` in
`models/lib/externalParsers.js`):

- The collection is read from `_embedded.elements`, `elements` or a bare
  array.
- Custom fields `customFieldN` are named from embedded schemas
  (`_embedded.schemas`, or a work package's `_embedded.schema`); without a
  schema the field keeps the name `customFieldN`. Values are read from the
  work package (`raw` for formatted text) and from `_links` (the title).
- `estimatedTime` (ISO 8601 duration) becomes the custom field **Estimated
  time (hours)**, and `percentageDone` the custom field **Progress (%)**.
  `spentTime` becomes the card's spent hours.
- Relations embedded on a work package are kept from their `from` side:
  `blocks`, `blocked` (is blocked by), `duplicates`, `duplicated`; any other
  type is kept as related-to.
- Comments are the `Activity::Comment` entries of an embedded `activities`
  list.
- Type, category, priority (`priority:<name>`) and version (`version:<name>`)
  become labels.
- The work package's `duration` is not read.

## What is kept

| OpenProject | WeKan |
| --- | --- |
| Collection `_links.self.title`, else the first work package's project | Board title |
| `_links.status` (title) | List |
| `id` | Source reference, for parent and relation links |
| `subject`, `description.raw` (or `.html`) | Card title, description |
| `startDate`, `dueDate`, `createdAt` | Start, due and creation dates |
| `spentTime` | Spent time (hours) |
| `_links.assignee`, `_links.responsible` | Card members, when mapped |
| `_links.author` | Requested by |
| `_links.parent` | Parent card |
| Embedded `relations` | Dependencies |
| Embedded `watchers` | Card watchers, when mapped to a board member |
| Type, priority, category, version | Labels |
| `customFieldN`, `estimatedTime`, `percentageDone` | Custom fields |
| `storyPoints` | Number field **Story points**, the Scrum estimate |
| `version`, `sprint`, `position` | Scrum release, sprint, backlog rank |
| Embedded comment activities | Comments |

The export writes `_embedded.elements` with a numeric `id` per card,
`subject`, `description.raw`, `dueDate`, `startDate`, `createdAt`, the custom
fields as `customFieldN` with a schema naming them, and `_links` for status
(the list), assignee (the owner), responsible (the first further person),
author (the creator) and parent. Comments go out as `Activity::Comment`
activities. With Scrum selected, it adds `position`, `version` and `sprint`
links, and `_embedded.versions` and `_embedded.sprints`.

## What is not kept

The import reports these on the loss report:

- attachments (the API export carries metadata, not file contents);
- watchers who are not members of the new board;
- version and sprint links whose records are not embedded, active sprints
  (imported as planned) and completed sprints;
- more than 50 custom fields, duplicate work package ids, and parents or
  relations that point outside the file.

OpenProject has no member mapping in WeKan, so assignees do not become card
members.

The export leaves out archived cards, lists and swimlanes, labels, end dates,
watchers, relations, checklists and attachments.

## REST API

```bash
python3 api.py importboardfrom openproject wp.json                  # POST /api/boards/import/openproject
python3 api.py importboardsfrom openproject a.json b.json dir/      # one board per file
python3 api.py exportboardformat BOARDID openproject wp.json        # GET /api/boards/BOARDID/export/openproject?authToken=TOKEN
python3 api.py exportallboards openproject boards.zip               # GET /api/export-all-boards/openproject?authToken=TOKEN
```

`GET /api/export-all-boards/openproject?authToken=TOKEN&boardIds=ID1,ID2`
exports only the boards listed.

## How it is built and tested

- `models/lib/externalParsers.js` (`parseOpenProject`) reads the file.
  `models/lib/externalScrumPlanning.js` reads versions and sprints.
  `models/kanboardCreator.js` creates the board, and
  `models/lib/importedTaskPlan.js` decides what each work package becomes.
- `models/lib/externalExportFormatters.js` (`openproject`) writes the export,
  from what `models/lib/externalExporters.js` collects.
- Unit tests: `tests/openProjectImport.test.cjs`,
  `tests/externalScrumPlanning.test.cjs`, `tests/importedTaskPlan.test.cjs`
  and `tests/externalExportRoundTrip.test.cjs`. The fixture is
  `tests/fixtures/import-formats/openproject.json`.
- Playwright: `tests/playwright/specs/import-export-format-audit.e2e.js`
  (importing the fixture through the page, refusing malformed JSON, and parent
  hierarchy and relations linking the imported cards).

## Sources

- [API v3 introduction](https://www.openproject.org/docs/api/introduction/):
  HAL+JSON and the `apikey` basic authentication
- [Collections](https://www.openproject.org/docs/api/collections/): paging
  with `pageSize` and `offset`
- [Resource schemas](https://www.openproject.org/docs/development/concepts/resource-schemas/):
  custom-field names
- [Work packages](https://www.openproject.org/docs/api/endpoints/work-packages/),
  [Versions](https://www.openproject.org/docs/api/endpoints/versions/) and
  [Sprints](https://www.openproject.org/docs/api/endpoints/sprints/): the
  Scrum planning objects

See also: [format coverage](../Format-Coverage.md),
[all formats](../External-Tools.md).
