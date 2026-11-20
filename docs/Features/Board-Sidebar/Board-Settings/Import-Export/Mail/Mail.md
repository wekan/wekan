# Mail

WeKan imports mail as a board for **Board View → Email**, and exports a
board as an `.mbox` file. The import reads an **mbox** (RFC 4155) - the file
Thunderbird, Apple Mail, mutt and Gmail through Google Takeout write - or a
single **.eml** message (RFC 5322 / MIME). Each conversation becomes one card
in the list **Inbox**, with its sender, recipients and subject, so it is mail in
the Email view; the replies become the card's comments.

## How to import

1. Get the file: in Thunderbird, save the folder with an add-on such as
   ImportExportTools NG as `.mbox`, or save one message as `.eml`; in Apple
   Mail, **Mailbox → Export Mailbox**; from Gmail, use
   [Google Takeout](../Google-Takeout/Google-Takeout.md) (**Mail**) and take the
   `.mbox` from the zip; mutt and other Unix mail programs keep mbox files
   already.
2. In WeKan, go to **All Boards → New → Import → Mail (mbox, .eml)**.
3. Choose the `.mbox` or `.eml` file, or paste its text.
4. Map the senders to WeKan members, or leave them as they are: a sender who
   is not mapped is named at the start of the comment.
5. Click **Import**, and read the loss report.

## How to import many boards at once

1. On the import page, choose **Mail (mbox, .eml)**, then under **Import many boards**
   choose several files, or one `.zip` that holds them.
2. Each file becomes its own board. The boards are imported without member
   mapping; members can be mapped later.

Mail is imported through the generalized importer
(`models/kanboardCreator.js`), so the page also has the checkbox **One board
per project**: each swimlane the import would create becomes its own board.

From a script:

```bash
python3 api.py importboardsfrom mail FILE_OR_DIR ...
```

## How to export

1. Open the board, then **Board Settings → Export**.
2. Under the tools, choose **Mail (mbox)**. The board downloads as
   `<board>.mbox`.
3. Open it in Thunderbird (ImportExportTools NG), Apple Mail (**File → Import
   Mailboxes**) or mutt.

Each card is a message from its creator, with the title as the subject and the
description as the text; its comments follow as replies (`In-Reply-To`). A card
that came from mail keeps its sender, recipients and Message-ID - unless Admin
Panel anonymizes exports, which leaves them out because they name people.

## How to export all boards at once

1. In WeKan, go to **All Boards**, open the sidebar and choose **Export all
   boards**, then **Mail (mbox)**.
2. One `.zip` downloads, with one `.mbox` file per board you can export.

From a script:

```bash
python3 api.py exportallboards mbox boards.zip
```

## Format details

- **mbox**: messages separated by a `From ` line; a body line starting `From `
  is escaped as `>From ` (mboxrd) and unescaped when read
  (`models/lib/mboxSplit.js`).
- **MIME** is decoded on the server with mailparser
  (`server/lib/mailImport.js`): encoded words, quoted-printable, base64,
  multipart. An HTML-only message is read as its text with htmlparser2;
  scripts and styles are dropped and no markup is kept.
- **Threads** join by `Message-ID`, `In-Reply-To` and `References`
  (`models/lib/mailFormat.js`). The first message is the card, the later ones
  its comments, oldest first.
- **Gmail labels** (`X-Gmail-Labels`) become labels; Inbox, Unread, Opened,
  Important, Starred, Sent, Spam, Trash and the categories are mail state, not
  labels. A conversation labelled **Sent** is outgoing mail, in the Email view's
  Sent folder.

## What is kept

Subject, text, sender, To and Cc, date (the received date), Message-IDs of the thread (so a later reply sent to the board joins it), Gmail labels, replies as comments by their sender.

## What is not kept

Attachments (counted in the loss report), Bcc, HTML formatting, and mail headers other than the ones above. At most 20,000 messages are read from one file. What was left out is listed in the import's loss report, also in
**Admin Panel → Problems → Recovery**.

## REST API

- Import: `POST /api/boards/import/mail` with the file's text, or a
  `.zip` as `{ "zipBase64": "..." }`, as for every source of the import page.
- Export: `GET /api/boards/:boardId/export/mbox`.

## How it is built and tested

`tests/mailFormat.test.cjs` decodes an mbox with a thread, an encoded subject, Gmail labels and an HTML-only message with mailparser, checks that a malformed sender or a header injection does not become mail, sends the result through the import sanitizer, and exports a board to `.mbox` and reads it back.

## Sources

- [RFC 4155 - the application/mbox media type](https://www.rfc-editor.org/rfc/rfc4155)
- [RFC 5322 - Internet Message Format](https://www.rfc-editor.org/rfc/rfc5322)
- [mailparser](https://nodemailer.com/extras/mailparser/)
