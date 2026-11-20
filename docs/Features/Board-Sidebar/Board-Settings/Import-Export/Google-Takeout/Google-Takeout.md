# Google Takeout

WeKan imports a [Google Takeout](https://takeout.google.com) `.zip` as one
board with a swimlane per Google product: **Mail** for Board View → Email,
**Tasks** and **Keep** as cards with their checklists, **Calendar** events and
tasks with their dates for Calendar and Gantt, and **Google Chat** spaces whose
messages are comments for Board View → Chat.

## How to import

1. At [takeout.google.com](https://takeout.google.com), choose **Tasks**,
   **Keep**, **Mail**, **Calendar** and **Google Chat** (any of them), choose
   the `.zip` file type, create the export and download it.
2. In WeKan, go to **All Boards → New → Import → Google Takeout**.
3. Choose the `.zip` file.
4. Map the people to WeKan members, or leave them as they are.
5. Click **Import**, and read the loss report: it lists the products in the
   zip that have no place on a board.

## How to import many boards at once

1. On the import page, choose **Google Takeout**, then under **Import many boards**
   choose several files, or one `.zip` that holds them.
2. Each file becomes its own board. The boards are imported without member
   mapping; members can be mapped later.

Google Takeout is imported through the generalized importer
(`models/kanboardCreator.js`), so the page also has the checkbox **One board
per project**: each swimlane the import would create becomes its own board.

From a script:

```bash
python3 api.py importboardsfrom googletakeout FILE_OR_DIR ...
```

## How to export

Google Takeout has no import of its own for a file WeKan could write, so WeKan does not export to it. Export the board in another format, for example [WeKan JSON](../WeKan/WeKan.md).

## How to export all boards at once

Google Takeout has no import of its own for a file WeKan could write, so WeKan does not export to it. Export the board in another format, for example [WeKan JSON](../WeKan/WeKan.md).

## Format details

The products are recognised by what a file is, not by its folder name,
which Takeout writes in the account's language (`server/lib/chatArchives.js`):

- a JSON file of `"kind": "tasks#taskLists"` - **Tasks**: task lists become
  lists, tasks cards, with notes, links, due date, completion (tagged `done`)
  and the parent of a subtask;
- a JSON file with `textContent` or `listContent` - a **Keep** note: in the
  list **Notes** or **Archived**, its checklist, labels, color, *pinned* as a
  label; notes in the trash are left out;
- `.mbox` - **Mail**, as [Mail](../Mail/Mail.md) reads it, in **Inbox**, the
  board's first list, which the Email view reads;
- `.ics` - **Calendar**, as [iCalendar](../iCalendar/iCalendar.md) reads it;
- `messages.json` and `group_info.json` of a folder - a **Google Chat** space
  or direct message (`models/lib/chatExportFormats.js`).

The mapping is `models/lib/googleTakeoutFormat.js`.

## What is kept

Everything the products above carry that a card has: titles, text, dates, checklists, labels, colors, the mail fields of the Email view and the messages of the Chat view.

## What is not kept

Other Google products (YouTube, Drive, Photos and the rest, listed in the loss report), attachments and images, Keep notes in the trash. The zip is read within bounds: at most 128 MB, 50,000 files and 256 MB unpacked. What was left out is listed in the import's loss report, also in
**Admin Panel → Problems → Recovery**.

## REST API

- Import: `POST /api/boards/import/googletakeout` with the file's text, or a
  `.zip` as `{ "zipBase64": "..." }`, as for every source of the import page.

## How it is built and tested

`tests/googleTakeoutFormat.test.cjs` builds a Takeout zip with Finnish folder names and every product, reads it with the server's zip reader and checks each swimlane, the Inbox being first, the trash and the skipped products; and refuses a zip with nothing for a board and a file that is not a zip.

## Sources

- [Google Takeout](https://takeout.google.com)
- [Google Tasks API task resource](https://developers.google.com/tasks/reference/rest/v1/tasks)
