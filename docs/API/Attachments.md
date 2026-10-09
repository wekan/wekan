# Attachments over the REST API

Card attachments and board backgrounds can be uploaded and downloaded over the
REST API in two forms:

- **Raw** - the request or response body is the file itself, streamed into or
  out of storage as it travels. Nothing is held whole in memory or turned into
  base64, so this is the form for large files. The only size limits are the
  API upload and download limits in **Admin Panel → Attachments → Limits**.
- **JSON** - the file travels as base64 inside a JSON document. It is kept for
  existing scripts and small files; the whole file and its base64 copy are held
  in memory on both ends.

Every request needs a login token: `Authorization: Bearer TOKEN`.

## Upload a file to a card

Raw: the body is the file, any Content-Type but `application/json`, and the
card is named in the query.

```bash
curl -X POST -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/octet-stream" \
  --data-binary @report.pdf \
  "https://WEKAN/api/attachment/upload?boardId=B&swimlaneId=S&listId=L&cardId=C&fileName=report.pdf&fileType=application/pdf"
```

JSON: `POST /api/attachment/upload` with
`{ boardId, swimlaneId, listId, cardId, fileName, fileType, fileData }`, where
`fileData` is the file in base64.

Both check the same things before anything is stored: the card is on that
board, swimlane and list, you may write to the board, and the board takes
attachments. A file larger than the API upload limit is refused with 413 -
from its `Content-Length` before it is read, and again while it streams. The
file goes to the default storage set in the Admin Panel. The answer is
`{ success, attachmentId, fileName, fileSize, storageBackend }`.

## Download a card's file

```bash
curl -H "Authorization: Bearer $TOKEN" -o report.pdf \
  "https://WEKAN/api/attachment/download/ATTACHMENT_ID?raw=1"
```

With `raw=1` the answer is the file itself, served as a download (it cannot
run in WeKan's origin). Without it the answer is JSON with `base64Data`. Board
members may download; the API download limit applies to both.

## Board background

The same two forms, board admins only for upload:

- `POST /api/attachment/upload-background?boardId=B&fileName=bg.png` with the
  image as the body (or the JSON `{ boardId, fileData, fileName, fileType }`)
  stores it and makes it the board's background.
- `GET /api/attachment/download-background/BOARD_ID?raw=1` downloads it.

## From a script

`api.py` uses the raw form for all four:

```bash
python3 api.py uploadattachment BOARDID SWIMLANEID LISTID CARDID ./report.pdf
python3 api.py downloadattachment ATTACHMENTID ./report.pdf
python3 api.py uploadbackground BOARDID ./background.png
python3 api.py downloadbackground BOARDID ./background.png
```

The DDP methods `api.attachment.upload`, `api.attachment.download`,
`api.board.uploadBackground` and `api.board.downloadBackground` carry base64 by
their nature (a Meteor method's arguments and answer are one message); use the
raw REST routes above for large files.

Range requests (resuming, seeking in video) are served by the attachment links
the board itself uses, `/cdn/storage/attachments/...`; see
[Large boards](../Features/Admin-Panel/Problems/Large-Boards.md).
