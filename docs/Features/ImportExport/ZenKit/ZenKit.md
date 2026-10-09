# Zenkit

WeKan imports boards from [Zenkit](https://zenkit.com/) and exports a board in
the same shape. It reads two shapes of JSON: a list as Zenkit's API returns it
(the list, its elements and its entries), and a simpler adapter shape
`{ title, stages, items }`. Stages become lists and items become cards. In
WeKan's menus the tool is named **Zenkit**.

Zenkit does not publish a schema for its single-file JSON export, so WeKan
does not claim to read that file; see Format details.

## How to import

1. Get the list as JSON. Two ways work:
   - From Zenkit's [API](https://public.zenkit.com/documentation): the list,
     its elements (the fields) and its entries in one object, as
     `{ "list": {...}, "elements": [...], "entries": [...] }`.
   - In the adapter shape, written by hand or by a script of your own:
     `{ "title", "stages": [...], "items": [...] }`. An earlier converter,
     [very-rough-wekan-from-zk](https://github.com/wekan/very-rough-wekan-from-zk),
     is described in [discussion #4487](https://github.com/wekan/wekan/discussions/4487).
   Zenkit also offers **Generate JSON** in a list's settings
   ([list actions](https://help.zenkit.com/en/support/solutions/articles/43000585496-list-actions)).
   Its layout is not documented, so check the loss report after importing it.
2. In WeKan, go to **All Boards → New → Import → Zenkit**.
3. Paste the JSON into the text box. Tick the parts to import.
4. Click **Import**. Zenkit has no member-mapping step in WeKan, so the people
   in the file do not become card members.
5. Read the loss report on the import page. It is also kept in **Admin Panel →
   Problems → Recovery**.

## How to import many boards at once

- On the import page, under **Import many boards**, choose several Zenkit JSON
  files, or one `.zip` that holds them. Each file becomes its own board,
  imported without member mapping. Members can be mapped later. Click **Import**
  to import them.
- The checkbox **One board per project** makes no difference for Zenkit: a
  list is imported into one swimlane, **Default**, so each file is always one
  board.
- From a script:
  `python3 api.py importboardsfrom zenkit FILE_OR_DIR ...` takes files,
  directories of files, or `.zip` files.

## How to export

1. In WeKan, open the board, then **Board Settings → Export**.
2. Under **Select what to include:**, tick the parts to export.
3. Under **JSON**, choose **Zenkit**. The board downloads as a `.json` file in
   the adapter shape.
4. Zenkit does not document a JSON import, so it cannot be said to read this
   file; see [Zenkit's help](https://help.zenkit.com/). The file is what
   WeKan's own Zenkit import reads.

## How to export all boards at once

1. **All Boards → sidebar → Export all boards**, then choose **Zenkit**.
   This downloads one `.zip` with one Zenkit file per board you can
   export: boards you are a member of, that are not archived and are not
   templates. A board you may not export is left out and named in
   `skipped.txt` in the `.zip`.
2. To export only some boards, use **Multi-Selection** in the All Boards
   sidebar, select the boards, then **Export**.

From a script: `python3 api.py exportallboards zenkit boards.zip`.

## Format details

From the [format coverage](../Format-Coverage.md) audit:

- **Current authoritative shape:** the current documented export accepted by
  the selected Zenkit product.
- **Required import coverage:** collections/lists, stages, items, hierarchy,
  members, dates, labels and exported custom fields; unknown fields are kept
  in the loss report because Zenkit products differ.
- Zenkit is one of the external adapters that map the listed fields that have
  a WeKan equivalent: parent hierarchy and dependencies between items of the
  same import, custom-field values as typed board custom fields, start and
  creation dates, several assignees and source order. Creation dates survive
  the schema's `createdAt` autoValue through `writeImportedEntity`. Files,
  cross-list references and formula results are reported. Zenkit's API
  entries are read with the value keys its API client documents; its
  single-file export remains unverified because no schema is published.

What the current code does (`parseZenkit` in `models/lib/externalParsers.js`):

**API shape.** An entry's field values are keys named after the element:
`<uuid>_text`, `_number`, `_date`, `_categories_sort`, `_persons_sort` and
`_references_sort`.

- The stage is the first categories field whose name says stage, status,
  state or column, else the first categories field. Its predefined categories
  give the list order; an entry without a stage goes to **Inbox**.
- The description is a text field named description, notes or details. The
  due and start dates are date fields named due, deadline or end, and start or
  begin.
- Other text, URL, number and date fields become custom fields. Other
  categories fields become labels.
- Person fields give the owner and assignees, a hierarchy field the parent,
  and dependency fields related-to links.
- Entries with `deprecated_at` (deleted) are skipped, with a warning. Entries
  are sorted by `sortOrder`.

**Adapter shape.** Each item may have `title` (or `name`), `description` (or
`notes`), `stage_name` (or `stageName`, `list`), `due` (or `dueDate`,
`due_date`), `start`, `created_at`, `tags`, `assignee` or `assignees`, `id`
(or `uuid`), `parent_id` (or `parentId`), `fields`, `comments` and
`checklists`. Any other key is reported.

## What is kept

| Zenkit | WeKan |
| --- | --- |
| `list.name` (API), `title` (adapter) | Board title |
| Stage | List |
| `displayString` (API), `title` (adapter) | Card title |
| Description field, `description` | Card description |
| Due date and start date fields, `due`, `start` | Due date, start date |
| `created_at` | Creation date |
| Person fields, `assignees` | Card members, when mapped |
| `created_by_displayname` (API) | Requested by |
| Categories fields, `tags` | Labels |
| Text, URL, number and date fields, `fields` | Custom fields |
| `uuid`, `id` | Source reference, for parent and dependency links |
| Hierarchy field, `parent_id` | Parent card |
| Dependency fields (API) | Related-to dependencies |
| `checklists` (`name`, `items` with `text` and `checked`) | Checklists |
| `comments` (adapter) | Comments |

The export writes the adapter shape: `title`, a stage per list, and per card
`id`, `title`, `description`, `stage_name`, `due`, `tags`, `start`,
`created_at`, `parent_id`, the owner and further people as `assignees`, the
custom fields as `fields`, the checklists and the comments.

## What is not kept

The import reports these on the loss report:

- file fields (files are not part of the export);
- reference fields to other lists;
- formula fields (results are computed by Zenkit);
- field types with no documented value format;
- comments of API entries (`comment_count`: they are fetched separately from
  Zenkit);
- unrecognized keys of adapter items;
- deleted entries, as a warning;
- more than 50 custom fields, duplicate ids, and parents or dependencies that
  point outside the file.

Zenkit has no member mapping in WeKan, so assignees do not become card
members.

The export leaves out swimlanes, archived cards and lists, end dates,
dependencies and attachments.

## REST API

```bash
python3 api.py importboardfrom zenkit list.json               # POST /api/boards/import/zenkit
python3 api.py importboardsfrom zenkit a.json b.json dir/     # one board per file
python3 api.py exportboardformat BOARDID zenkit list.json     # GET /api/boards/BOARDID/export/zenkit?authToken=TOKEN
python3 api.py exportallboards zenkit boards.zip              # GET /api/export-all-boards/zenkit?authToken=TOKEN
```

`GET /api/export-all-boards/zenkit?authToken=TOKEN&boardIds=ID1,ID2` exports
only the boards listed.

## How it is built and tested

- `models/lib/externalParsers.js` (`parseZenkit`) reads both shapes.
  `models/kanboardCreator.js` creates the board, and
  `models/lib/importedTaskPlan.js` decides what each item becomes.
- `models/lib/externalExportFormatters.js` (`zenkit`) writes the export, from
  what `models/lib/externalExporters.js` collects.
- Unit tests: `tests/zenkitImport.test.cjs`, `tests/importedTaskPlan.test.cjs`
  and `tests/externalExportRoundTrip.test.cjs`. The fixtures are
  `tests/fixtures/import-formats/zenkit-adapter.json` and `zenkit-api.json`.
- Playwright: `tests/playwright/specs/import-export-format-audit.e2e.js`
  (importing the adapter fixture through the page, refusing malformed JSON,
  and API entries importing stages, checklists, fields and hierarchy).

## Sources

- [Zenkit API documentation](https://public.zenkit.com/documentation): lists,
  elements and entries
- [Zenkit list actions](https://help.zenkit.com/en/support/solutions/articles/43000585496-list-actions):
  Generate JSON
- [WeKan discussion #4487](https://github.com/wekan/wekan/discussions/4487),
  [kjgcoop/very-rough-wekan-from-zk](https://github.com/kjgcoop/very-rough-wekan-from-zk)
  and its fork [wekan/very-rough-wekan-from-zk](https://github.com/wekan/very-rough-wekan-from-zk):
  an earlier Zenkit to WeKan converter

See also: [format coverage](../Format-Coverage.md),
[all formats](../External-Tools.md).
