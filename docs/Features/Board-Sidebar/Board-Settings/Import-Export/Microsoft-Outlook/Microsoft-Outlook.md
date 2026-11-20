# Microsoft Outlook

WeKan imports mail saved from [Microsoft Outlook](https://www.microsoft.com/microsoft-365/outlook)
as `.msg` files, and exports a board as `.eml` messages Outlook opens. The mail
shows in **Board View → Email**.

## How to import

1. In Outlook (classic), drag a message to a folder on your computer, or choose
   **File → Save As** with the type **Outlook Message Format (\*.msg)**. Put
   several in a `.zip` to import them together; `.eml` files may be in the same
   `.zip`.
2. In WeKan, go to **All Boards → New → Import → Microsoft Outlook (.msg)**.
3. Choose the `.msg` or the `.zip` file.
4. Map the people to WeKan members, or leave them as they are.
5. Click **Import**.

## How to import many boards at once

1. On the import page, choose **Microsoft Outlook**, then under **Import many boards**
   choose several files.
2. Each file becomes its own board. The boards are imported without member
   mapping; members can be mapped later.

Microsoft Outlook is imported through the generalized importer
(`models/kanboardCreator.js`), so the page also has the checkbox **One board
per project**.

From a script:

```bash
python3 api.py importboardsfrom outlook FILE_OR_DIR ...
```

## How to export

1. Open the board, then **Board Settings → Export**, and choose **Microsoft
   Outlook (.eml)**. The board downloads as `<board>.zip`.
2. Unpack it and open an `.eml` in Outlook, or drag the files into an Outlook
   folder.

A card is a message, and each of its comments a reply to it - the messages of
the **Mail (mbox)** export, one per file. A card that came from mail keeps its
sender, recipients and Message-ID.

## How to export all boards at once

1. In WeKan, go to **All Boards**, open the sidebar and choose **Export all
   boards**, then **Microsoft Outlook (.eml)**.
2. One `.zip` downloads, with one `.zip` per board you can export.

From a script:

```bash
python3 api.py exportallboards outlook boards.zip
```

## Format details

A `.msg` is a Compound File Binary file (\[MS-CFB\]): storages and streams in
512- or 4096-byte sectors chained by a FAT, with small streams in a mini stream.
The message (\[MS-OXMSG\]) is its root storage: a stream per property
(`__substg1.0_PPPPTTTT`), the fixed-size properties with the send time, a
storage per recipient and per attachment. WeKan reads it without any library
(`models/lib/outlookMsgFormat.js`): subject, sender (its SMTP address), To and
Cc, the time it was sent, the Message-ID, In-Reply-To and References, the plain
body (or the HTML body as text) and the attachments. The messages then go
through the same mail import as an `.mbox` (`models/lib/mailFormat.js`), so a
reply joins its thread.

## What is kept

Each thread as a card in the list **Inbox**: the first message's subject,
sender, recipients, time and body, the replies as comments, and the messages'
attachments as the card's files.

## What is not kept

An attachment that is itself a message (an embedded `.msg`) and an attachment
larger than 32 MB (counted); the RTF body, categories, flags and reminders.
On export: labels, checklists and attachments. What was left out is listed in the import's loss report, also in
**Admin Panel → Problems → Recovery**.

## REST API

- Import: `POST /api/boards/import/outlook` with `{ "binaryBase64": "..." }` for a `.msg`, or `{ "zipBase64": "..." }` for a `.zip`.
- Export: `GET /api/boards/:boardId/export/outlook`.

## How it is built and tested

`tests/outlookMsg.test.cjs` writes `.msg` files with a small Compound File
writer - small streams in the mini stream, a large attachment in FAT sectors -
reads them, threads a reply, reads a `.zip` of `.msg` and `.eml` files, writes
a board as `.eml` files and reads them back, and refuses a file that is not a
Compound File and one whose sector chain loops. The reader was also checked
against `.msg` files saved by Outlook.

## Sources

- [\[MS-CFB\]: Compound File Binary File Format](https://learn.microsoft.com/openspecs/windows_protocols/ms-cfb/53989ce4-7b05-4f8d-829b-d08d6148375b)
- [\[MS-OXMSG\]: Outlook Item (.msg) File Format](https://learn.microsoft.com/openspecs/exchange_server_protocols/ms-oxmsg/b046868c-9fbf-41ae-9ffb-8de2bd4eec82)
- [\[MS-OXPROPS\]: Exchange Server Protocols Master Property List](https://learn.microsoft.com/openspecs/exchange_server_protocols/ms-oxprops/f6ab1613-aefe-447d-a49c-18217230b148)
