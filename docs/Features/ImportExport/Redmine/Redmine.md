# Redmine

WeKan imports boards from [Redmine](https://www.redmine.org)'s issues CSV
export and exports boards to a CSV file that Redmine's own issue import reads.
Each issue status becomes a list and each issue a card. The tracker becomes a
label, the project a swimlane, and the parent task and related issues become a
parent card and dependencies. Priority, category, target version, estimated
time, % Done and Redmine's custom fields become custom fields.

## How to import

1. In Redmine, set your language to English in **My account**. Redmine writes
   the CSV column names in the language of the user who exports, and WeKan
   reads the English names.
2. Open the project's **Issues**. At the bottom of the list, under **Also
   available in:**, click **CSV**.
3. In the **CSV export options** dialog choose **All Columns**, tick
   **Description** (and **Last notes** if you want the newest note as a
   comment), choose **UTF-8** as the encoding (English's default is
   ISO-8859-1), and click **Export**.
4. In WeKan, go to **All Boards → New → Import → Redmine**.
5. Open the CSV file in a text editor, copy all of it and paste it into the
   text box. This source is read from the text box only; there is no file
   chooser for it.
6. Click **Import**, or **Import without mapping members (map later)**.
7. Read the loss report on the import page. It is also kept in **Admin Panel →
   Problems → Recovery**.

The import page says the same: *"In Redmine, open the project's Issues, choose
Also available in: CSV at the bottom of the list, pick the columns (All
columns, with Description) and export, then paste the CSV."*

A file with no English Redmine column name at all is refused, with a message
that asks you to export again in English or to rename the headers to English
(`#`, `Subject`, `Status`, ...).

## How to import many boards at once

- On the import page, under **Import many boards**, choose several Redmine CSV
  files, or one `.zip` that holds them. Each file becomes its own board,
  imported without member mapping (members can be mapped later).
- Redmine is imported through the generalized importer, so there is also a
  checkbox **One board per project**. Each swimlane the import would create
  becomes its own board, named after that swimlane. For Redmine the swimlanes
  are the values of the **Project** column, so an export of several projects
  (for example a cross-project issue list) becomes one board per Redmine
  project. Rows without a Project go to the swimlane `Default`. Links (parent
  cards, dependencies) between cards that end up on different boards are
  reported in the loss report rather than kept.
- From a script: `python3 api.py importboardsfrom redmine FILE_OR_DIR ...`
  (files, directories of files, or `.zip` files).

## How to export

1. In WeKan, open the board and go to **Board Settings → Export**.
2. Choose what to include, then choose **Redmine** in the JSON group of the
   export menu. It downloads `<board>.csv`.
3. In Redmine, open the project's **Issues**, open the **...** actions menu at
   the top right and choose **Import**. You need the *Import issues* and *Add
   issues* permissions.
4. Under **Select the file to import (CSV)** choose the file and click
   **Next**.
5. Under **Options** set **Field separator** to comma, **Field wrapper** to
   double quote, **Encoding** to UTF-8 and **Date format** to `YYYY-MM-DD`,
   then click **Next**.
6. In **Fields mapping** choose the target project. The English columns are
   mapped automatically; map the remaining custom-field columns to Redmine
   custom fields if you have them. Click **Import**.

Redmine imports an issue with a status other than *New* only when the
workflow allows that status for new issues (**Administration → Workflow**).
The assignee must be a Redmine user name. See Redmine's
[HowTo import issues](https://www.redmine.org/projects/redmine/wiki/HowTo_import_issues).

## How to export all boards at once

**All Boards → sidebar → Export all boards**, choose **Redmine**. It downloads
one `.zip` with one CSV file per board you can export: boards you are a member
of, that are not archived and are not templates.

To export only some boards: **Multi-Selection** in the All Boards sidebar,
select the boards, then **Export**.

From a script: `python3 api.py exportallboards redmine boards.zip`.

## Format details

### What WeKan reads

Redmine's issues CSV (**Issues > Also available in: CSV**), as
[query_to_csv](https://github.com/redmine/redmine/blob/master/app/helpers/queries_helper.rb)
writes it:

- a UTF-8 byte order mark;
- `,` or `;` as the separator: the one chosen in the export dialog or the
  locale's (`;` in locales whose decimal separator is a comma). WeKan guesses
  it the way Redmine's importer does, by counting `,` and `;` on the header
  line outside quotes;
- `#` (the issue id) first, then the chosen columns.

Columns are matched case-insensitively by Redmine's **English** labels from
[en.yml](https://github.com/redmine/redmine/blob/master/config/locales/en.yml):
Subject, Status, Tracker, Priority, Assignee, Author, Category, Target
version, Start date, Due date, Estimated time, % Done, Created, Closed,
Parent task, Related issues, Description, Project, Watchers, Spent time, Last
notes, Unique ID and the others below. WeKan also matches the field keys and
the per-type relation columns that Redmine's
[issue importer](https://github.com/redmine/redmine/blob/master/app/models/issue_import.rb)
maps (`subject`, `assigned_to`, `fixed_version`, `parent_issue_id`,
`unique_id`, `relation_blocks`, ...).

Redmine writes the headers in the exporting user's language. A header in
another language cannot be told apart from custom fields, so a file with no
English label is refused with a message saying so. A file without a Subject
column is refused too.

Every column WeKan does not know becomes a custom field named after the
column, because Redmine's custom fields are columns named after the field.

### Relations

- **Related issues** holds every relation in one cell, as Redmine writes it:
  `Blocked by #12, Related to #7, Precedes (3 days) #9`.
- The importer's shape has one column per relation type (Blocks, Blocked by,
  Related to, ...), each holding `#12`, `12` or a Unique ID, optionally with a
  delay `12 3d`, comma separated.
- Blocks, Blocked by, Is duplicate of, Has duplicate and Related to become
  dependencies of the same kind. Precedes, Follows, Copied to and Copied from
  have no WeKan type: they are imported as related-to and reported.
- Redmine lists a relation on both of its issues (`Blocks #42` on #41,
  `Blocked by #41` on #42). WeKan keeps it once, on the first card seen: one
  dependency per pair of issues.
- **Parent task** holds the parent's id alone (`#12` or `12`, or a Unique ID).

### Dates and numbers

- Dates may be ISO (`%Y-%m-%d`), `%Y/%m/%d`, `%d.%m.%Y`, `%d-%m-%Y`, or
  `%m/%d/%Y` or `%d/%m/%Y`. Which slash order applies is decided for the whole
  file: day first when some `a/b/YYYY` date has `a` above 12 and none has `b`
  above 12, otherwise month first (English's default).
- A time may follow, in 24-hour form or as `%I:%M %p` (`09:15 AM`). Redmine
  writes times in the user's time zone and the file does not name it, so they
  are read as UTC. A full ISO 8601 timestamp with its zone is read as written.
- Estimated time, % Done and Spent time are numbers such as `3.00`, or `3,00`
  where the locale's decimal separator is a comma.

### What WeKan writes

- The English columns Redmine's importer auto-maps, with `,` as separator,
  `\r\n` line ends and a UTF-8 byte order mark, as Redmine writes UTF-8:
  `Unique ID, Project, Tracker, Status, Priority, Subject, Description,
  Author, Assignee, Category, Target version, Start date, Due date, Estimated
  time, % Done, Spent time, Created, Closed, Parent task, Related to, Blocks,
  Blocked by, Is duplicate of, Has duplicate`, then the board's other custom
  fields.
- **Unique ID** is the card id. **Parent task** and the relation columns
  refer to it, so Redmine's importer links issues of the same file. Parents
  and relations pointing at cards outside the export are left out.
- Start and due dates are `%Y-%m-%d`, the importer's first date format.
  Created and Closed are written as `%Y-%m-%d %H:%M` in UTC.
- **Project** is the swimlane, empty for the swimlane `Default`.
- **Status** is the list, `New` when the card has no list title. **Subject**
  is `Untitled` when the card has no title.
- Redmine has no labels, so the first label is the **Tracker**.
- **Author** is the card's Requested by, else its creator. **Assignee** is the
  card's owner (its first member).
- Priority, Category, Target version, Estimated time and % Done come from
  custom fields of those names. Estimated time and Spent time are written with
  two decimals; % Done is rounded to a whole number.
- A Fixes or Is fixed by dependency has no Redmine relation and is written as
  Related to.

Redmine's importer does not map the Project (you choose the project in the
mapping step), Author, Spent time, Created or Closed columns. WeKan writes them
so that the file imports back into WeKan with them.

## What is kept

| Redmine | WeKan |
| --- | --- |
| Status | List, in the order statuses first appear (`New` when empty) |
| Project | Swimlane (`Default` when empty) |
| Tracker | Label |
| `#`, else Unique ID | The card's source reference |
| Subject, Description | Card title, description |
| Parent task | Parent card |
| Related issues, per-type relation columns | Dependencies (blocks, blocked by, duplicates, duplicated by, related to) |
| Assignee | Owner (card member, when mapped) |
| Author | Requested by |
| Watchers (one per line in the cell) | Watchers (when mapped to a board member) |
| Start date, Due date | Start date, due date |
| Created, Closed | Created date, end date |
| Spent time | Spent time (when above 0) |
| Last notes | A comment |
| Priority, Category, Target version | Custom fields |
| Estimated time, % Done | Number custom fields |
| Any other column (Redmine custom fields) | Custom field named after the column |

## What is not kept

The import reports these on the loss report, rather than dropping them
silently:

- the columns Updated, Last updated by, Files, Private, Estimated remaining
  time, Total estimated time and Total spent time (including the `is_private`
  field key);
- Parent task subject, when the file has no Parent task column (it names the
  parent without its id);
- rows without a Subject;
- dates in other formats, and Estimated time, % Done or Spent time values that
  are not numbers;
- entries of Related issues whose type is not one of Redmine's English
  relation names;
- relation delays (`Precedes (3 days) #9`, `12 3d`);
- Precedes, Follows, Copied to and Copied from, which are imported as
  related-to;
- parents and dependencies pointing at issues that are not in the file;
- watchers that are not members of the new board;
- custom fields after the first 50.

The Redmine export does not write labels after the first, further assignees,
watchers, comments, checklists, attachments, card colors or the swimlane
`Default`.

## REST API

```bash
python3 api.py importboardfrom redmine issues.csv              # POST /api/boards/import/redmine
python3 api.py importboardsfrom redmine a.csv b.csv exports/   # several boards
python3 api.py exportboardformat BOARDID redmine board.csv     # GET /api/boards/BOARDID/export/redmine?authToken=...
python3 api.py exportallboards redmine boards.zip              # GET /api/export-all-boards/redmine?authToken=...
```

The routes:

- `POST /api/boards/import/redmine`
- `GET /api/boards/:boardId/export/redmine?authToken=…`
- `GET /api/export-all-boards/redmine?authToken=…`, with an optional
  `&boardIds=ID1,ID2` for selected boards.

## How it is built and tested

- `models/lib/redmineCsvFormat.js` reads (`parseRedmineCsv`) and writes
  (`formatRedmineCsv`) the CSV. It is registered as `redmine` in
  `models/lib/externalParsers.js` and `models/lib/externalExportFormatters.js`.
  `models/import.js` runs the parser and `models/kanboardCreator.js` creates
  the board.
- `tests/redmineCsv.test.cjs` is the unit test: a Redmine export with
  statuses, trackers, people, dates, custom fields and one dependency per
  pair; a `;` file with a byte order mark, `d.m.Y` dates and comma decimals;
  the importer's per-type relation columns and field keys; refused localized
  headers and reported bad dates, numbers and relations; day-first files; and
  the export and its round trip.
- The Playwright cases are in
  `tests/playwright/specs/import-export-format-audit.e2e.js`: *Redmine: an
  issues CSV imports with its statuses, tracker, parent task and relations*
  pastes a `;` CSV with a byte order mark and checks the lists, label, due
  date, parent card, one blocked-by dependency and custom fields; the export
  audit downloads **Redmine** from the export menu and checks that another
  user is refused.

## Sources

- [HowTo import issues](https://www.redmine.org/projects/redmine/wiki/HowTo_import_issues):
  the import link, its options, the parent task references, statuses and
  assignees
- [app/views/issues/index.html.erb](https://github.com/redmine/redmine/blob/master/app/views/issues/index.html.erb):
  the CSV link, the CSV export options dialog and the Import menu entry
- [app/views/imports](https://github.com/redmine/redmine/tree/master/app/views/imports):
  the import steps (file, options, fields mapping)
- [query_to_csv in queries_helper.rb](https://github.com/redmine/redmine/blob/master/app/helpers/queries_helper.rb):
  how Redmine writes the CSV
- [lib/redmine/export/csv.rb](https://github.com/redmine/redmine/blob/master/lib/redmine/export/csv.rb):
  the byte order mark, separator and decimal separator
- [issue_import.rb](https://github.com/redmine/redmine/blob/master/app/models/issue_import.rb):
  the importer's auto-mapped fields, Unique ID and relation columns
- [en.yml](https://github.com/redmine/redmine/blob/master/config/locales/en.yml):
  the English column labels

See also the [format coverage table](../Format-Coverage.md) and
[all formats](../External-Tools.md).
