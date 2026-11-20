# Microsoft Lists

WeKan imports a list from [Microsoft Lists](https://www.microsoft.com/microsoft-365/microsoft-lists)
(and SharePoint lists), and exports a board as a CSV file Lists makes a new list
from.

## How to import

1. In Microsoft Lists, open the list, choose the view whose columns you want,
   and choose **Export → Export to CSV** (or **Export to CSV with schema**).
2. In WeKan, go to **All Boards → New → Import → Microsoft Lists**.
3. Choose the `.csv` file, or paste its text.
4. Map the people to WeKan members, or leave them as they are.
5. Click **Import**.

## How to import many boards at once

1. On the import page, choose **Microsoft Lists**, then under **Import many boards**
   choose several files.
2. Each file becomes its own board. The boards are imported without member
   mapping; members can be mapped later.

Microsoft Lists is imported through the generalized importer
(`models/kanboardCreator.js`), so the page also has the checkbox **One board
per project**.

From a script:

```bash
python3 api.py importboardsfrom mslists FILE_OR_DIR ...
```

## How to export

1. Open the board, then **Board Settings → Export**, and choose **Microsoft
   Lists**. The board downloads as `<board>.csv`.
2. In Microsoft Lists, choose **New list → From CSV** and choose the file.
   Make **Status** a Choice column, and the list's board view groups the items
   by it - as the board's lists.

The columns are Title, Status (the card's list), Assigned to (the owner and
assignees), Start date and Due date (YYYY-MM-DD), Tags (the labels), Description
and a column per custom field of the board, its name without the characters
Lists does not allow in a column name.

## How to export all boards at once

1. In WeKan, go to **All Boards**, open the sidebar and choose **Export all
   boards**, then **Microsoft Lists**.
2. One `.zip` downloads, with one `.csv` per board you can export.

From a script:

```bash
python3 api.py exportallboards mslists boards.zip
```

## Format details

Export to CSV writes the view's columns by their display names, Title first in
most lists; a Person column is the display name (with schema: the address),
several people or choices are joined with `;` (older SharePoint `;#`), a Yes/No
column is TRUE or FALSE, and dates are in the user's regional format or, with
schema, ISO 8601 (`models/lib/msListsCsvFormat.js`,
`models/lib/microsoftCsvDates.js`). The board view of a list groups its items
by a Choice column; WeKan takes the first of Status, Progress, Stage, State,
Bucket or Board column as the lists.

## What is kept

Items as cards in the lists of their Status (or Progress, ...) column, Title,
Description (or Notes, Details, Comments), Assigned to (or Owner, Assignee) as
the owner and assignees, Created By as "requested by", the start, due, created
and completed dates, Tags (or Category, Labels) as labels, ID as the card's
reference, and every other column as a custom field (Yes/No as true or false).

## What is not kept

SharePoint's own columns - Modified, Modified By, Item Type, Path, Content
Type, Version, Attachments, Compliance Asset Id and the retention labels - are
reported. Attachments, comments and the list's formatting are not in the CSV.
On export: comments, checklists and attachments. What was left out is listed in the import's loss report, also in
**Admin Panel → Problems → Recovery**.

## REST API

- Import: `POST /api/boards/import/mslists` with the CSV text.
- Export: `GET /api/boards/:boardId/export/mslists`.

## How it is built and tested

`tests/msListsCsv.test.cjs` reads the Issue tracker template's export with
several people and dates, the Work progress tracker's Progress column with
`;#` people and a Yes/No column, writes a board with custom fields and reads it
back, and refuses a file without items.

## Sources

- [Export to Excel from SharePoint or Lists](https://support.microsoft.com/office/export-to-excel-from-sharepoint-or-lists-bfb2ea48-6118-4fa9-abb6-cced9424e5d9)
- [Create a list based on a spreadsheet](https://support.microsoft.com/sharepoint/lists/data-and-lists/create-a-list-based-on-a-spreadsheet)
- [Create a list from CSV and export to CSV with schema](https://supersimple365.com/new-in-microsoft-lists-create-a-list-from-csv-and-export-to-csv/)
