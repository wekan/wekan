# Microsoft OneNote

WeKan imports a notebook of [Microsoft OneNote](https://www.microsoft.com/microsoft-365/onenote),
fetched from Microsoft Graph, and exports a board as OneNote pages.

## How to import

1. In Microsoft Graph Explorer (developer.microsoft.com/graph/graph-explorer),
   sign in, consent to the **Notes.Read** permission and copy the token from the
   **Access token** tab.
2. In WeKan, go to **All Boards → New → Import → Microsoft OneNote**, paste the
   token and click **List**. The token is used for this fetch only and is not
   stored.
3. Choose a notebook and click **Fetch**, then **Import**.

The `.zip` WeKan exports for OneNote, or the JSON a fetch returns, can be
chosen as a file instead.

## How to import many boards at once

1. On the import page, choose **Microsoft OneNote**, then under **Import many boards**
   choose several files.
2. Each file becomes its own board. The boards are imported without member
   mapping; members can be mapped later.

Microsoft OneNote is imported through the generalized importer
(`models/kanboardCreator.js`), so the page also has the checkbox **One board
per project**.

From a script:

```bash
python3 api.py importboardsfrom onenote FILE_OR_DIR ...
```

## How to export

1. Open the board, then **Board Settings → Export**, and choose **Microsoft
   OneNote**. The board downloads as `<board>.zip`.
2. The `.zip` has a page per card under `<notebook>/<section>/`, each in the
   XHTML Graph's **create page** takes (`POST /me/onenote/sections/{id}/pages`),
   so a script can send them to a section; `onenote.json` beside them is the
   same notebook in the shape WeKan reads back.

A list is a section, a card a page: its title, created time, description as
paragraphs and checklist items as to-do boxes, ticked when done; a subtask is a
subpage of its parent.

## How to export all boards at once

1. In WeKan, go to **All Boards**, open the sidebar and choose **Export all
   boards**, then **Microsoft OneNote**.
2. One `.zip` downloads, with one `.zip` per board you can export.

From a script:

```bash
python3 api.py exportallboards onenote boards.zip
```

## Format details

Graph lists the notebooks (`/me/onenote/notebooks`), their sections and each
section's pages (title, level, order, createdDateTime); a page's content is its
HTML (`/me/onenote/pages/{id}/content`): a `<title>`, `<meta name="created">`,
then outlines of paragraphs, lists and tables, `<img>` and `<object>` for
files, and a note tag as `data-tag` on an element - `to-do` an open to-do box,
`to-do:completed` a ticked one (`models/lib/onenoteApiFormat.js`,
`models/lib/apiImport/onenote.js`).

## What is kept

Sections as lists, pages as cards in their order, the page's text as the
description, its to-do boxes as the checklist **To-do**, a subpage (level 1 or
2) as a subtask of the page above it, and the page's created time. A board with
several notebooks would have one swimlane per notebook.

## What is not kept

Images and files on a page (counted), note tags other than to-do, ink,
formatting and the page's layout. On export: comments, labels, dates other than
the created time and attachments. What was left out is listed in the import's loss report, also in
**Admin Panel → Problems → Recovery**.

## REST API

- Import: `POST /api/boards/import/onenote` with the JSON, or `{ "zipBase64": "..." }` for the `.zip`.
- Export: `GET /api/boards/:boardId/export/onenote`.

## How it is built and tested

`tests/onenoteApiImport.test.cjs` reads a page as Graph answers it - with
to-do boxes, another note tag, an image and a file - with a subpage and an
empty page; writes a board as pages and reads `onenote.json` back; reads the
exported `.zip`; fetches through the API client from a fake Graph; and refuses
data that is not a fetch, a next link to another host and a path the export
does not write.

## Sources

- [OneNote API overview](https://learn.microsoft.com/graph/integrate-with-onenote)
- [Get OneNote content and structure](https://learn.microsoft.com/graph/onenote-get-content)
- [Create OneNote pages](https://learn.microsoft.com/graph/onenote-create-page)
- [Use note tags in OneNote pages](https://learn.microsoft.com/graph/onenote-note-tags)
