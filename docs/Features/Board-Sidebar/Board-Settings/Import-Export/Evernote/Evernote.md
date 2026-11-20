# Evernote

WeKan imports Evernote's `.enex` export as a board, and exports a board as
an `.enex` file that Evernote, Joplin and other note apps import. A note is a
card: its text the description, its to-do checkboxes a checklist, its tags
labels and its reminder the due date.

## How to import

1. In Evernote, select the notes or a notebook, choose **Export**, and save
   as `.enex`.
2. In WeKan, go to **All Boards → New → Import → Evernote (.enex)**.
3. Choose the `.enex` file, or paste its text.
4. Click **Import**.

## How to import many boards at once

1. On the import page, choose **Evernote (.enex)**, then under **Import many boards**
   choose several files, or one `.zip` that holds them.
2. Each file becomes its own board. The boards are imported without member
   mapping; members can be mapped later.

Evernote is imported through the generalized importer
(`models/kanboardCreator.js`), so the page also has the checkbox **One board
per project**: each swimlane the import would create becomes its own board.

From a script:

```bash
python3 api.py importboardsfrom evernote FILE_OR_DIR ...
```

## How to export

1. Open the board, then **Board Settings → Export**, and choose **Evernote
   (.enex)**. The board downloads as `<board>.enex`.
2. Import it in Evernote (**File → Import → ENEX**) or Joplin (**File →
   Import → ENEX**).

Each card is a note: the description as text, each checklist as a heading and
to-do lines, the comments after a line, the labels and the list as tags, the
due date as the reminder (done when the due date is complete) and the creator
as the author.

## How to export all boards at once

1. In WeKan, go to **All Boards**, open the sidebar and choose **Export all
   boards**, then **Evernote (.enex)**.
2. One `.zip` downloads, with one `.enex` file per board you can export.

From a script:

```bash
python3 api.py exportallboards enex boards.zip
```

## Format details

ENEX is XML: `<en-export>` with `<note>`s, each with `title`, `content` (ENML,
XHTML in a CDATA section), `created`, `updated`, `tag`s, `note-attributes`
(`reminder-time`, `reminder-done-time`, `author`, `source-url`) and `resource`s.
The server parses it with htmlparser2 (`server/lib/enexImport.js`) and reads
the content's text, a line per block, each `<en-todo>` marked as a checklist
item; scripts, styles, media and encrypted parts are dropped. A note whose
reminder is done goes to **Done**, the others to **Notes**
(`models/lib/enexFormat.js`).

## What is kept

Title, text, to-dos and whether each is done, tags, created date, reminder and its done time, author, source URL.

## What is not kept

Images and attached files (counted), formatting, encrypted text, notebook stacks. What was left out is listed in the import's loss report, also in
**Admin Panel → Problems → Recovery**.

## REST API

- Import: `POST /api/boards/import/evernote` with the file's text, or a
  `.zip` as `{ "zipBase64": "..." }`, as for every source of the import page.
- Export: `GET /api/boards/:boardId/export/enex`.

## How it is built and tested

`tests/enexFormat.test.cjs` reads notes with to-dos, tags, reminders, a script and a resource, refuses a file that is not ENEX, and exports a board - with a `]]>` in its text - and reads it back.

## Sources

- [How Evernote's XML export format works](https://evernote.com/blog/how-evernotes-xml-export-format-works)
- [Evernote export DTD](http://xml.evernote.com/pub/evernote-export4.dtd)
