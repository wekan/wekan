# Board Background Images

## What it is

A picture behind a board's lists. Board background images can be **stored in
WeKan** itself, uploaded by a board admin, or given as the address of an image
on the web. The active background image is also shown as the board's tile
background on the **All Boards** list page (a dark overlay keeps the board title
readable).

## Read more

- [Wikipedia: Wallpaper (computing)](https://en.wikipedia.org/wiki/Wallpaper_(computing))
- [Boards](../../All-Boards/Boards.md)
- [Attachments and File Storage](../../Cards/Attachments/Attachments.md)
- [Themes / Custom CSS](../../General/Theme/Custom-CSS-themes.md)
- [Migrating from Trello](Import-Export/Trello/trello/Migrating-from-Trello.md)

## How to use it

1. Open the board, its right sidebar, then **Board Settings → Change Background
   Image** (board admins).
2. To use an image on the web, write its address in **Background Image URL** and
   click **Save**; **Remove Background Image** beside it clears it.
3. To store an image in WeKan, click **Upload background image** below the rule
   and choose the file. The board's uploaded backgrounds are listed under it.
4. In that list, click an image (**Set as board background**) to make it the
   active one, the download icon to download it, or the bin to delete it (it
   asks **Are you sure you want to delete this background image?**).

The list of uploaded backgrounds used to be a menu entry of its own, **Board
backgrounds**; it is inside **Change Background Image** now, under the upload
that adds to it.

### Import and export

- **Board export** includes the board's background images, and re-imports them.
- A **Trello** board's background image is downloaded and stored on import, so it
  keeps working even if the original Trello URL later changes.

### REST API

Board background images can be uploaded and downloaded over the REST API — the
background counterpart of the card-attachment upload/download API. Uploads use the
current **Admin Panel / Attachments / Default Storage** backend (the same storage as
card attachments) and set the uploaded image as the board's active background.
Uploading requires board admin; downloading requires board membership.

| Method | Path | Purpose |
| --- | --- | --- |
| `POST` | `/api/attachment/upload-background?boardId=&fileName=&fileType=` | Upload an image and set it as the board background: the request body is the image itself (any Content-Type but JSON), streamed into storage. A JSON body `{ boardId, fileData (base64), fileName, fileType? }` works too, for small images |
| `GET` | `/api/attachment/download-background/:boardId?raw=1` | Download the board's current background image itself, streamed. Without `raw=1` it answers JSON with `base64Data` + metadata |

```bash
python3 api.py uploadbackground BOARDID /path/to/background.png
python3 api.py downloadbackground BOARDID /path/to/saved-background.png
```

There is also a DDP method pair (`api.board.uploadBackground` /
`api.board.downloadBackground`) for SDK/DDP clients.

## How the numbers are calculated

- **Upload size**: an upload is limited by the Admin Panel's API upload limit
  for attachments; a JSON body is also refused above 96 MB
  (`HARD_MAX_API_UPLOAD_BODY_BYTES` in
  [server/routes/attachmentApi.js](../../../../server/routes/attachmentApi.js)),
  and a download above the API download limit is refused.
- There are no other numbers: a board has one active background, and any
  number of uploaded ones.

## How it works in WeKan

Uploaded backgrounds are stored as board-level Attachments (`meta.boardId`
set, no `meta.cardId`, `meta.source` `board-background`) in the current
**Admin Panel / Attachments / Default Storage** backend, the same storage as
card attachments. The popup is `boardChangeBackgroundImagePopup`, with
`boardBackgroundUpload` and `boardBackgroundList`, in
[client/components/sidebar/sidebar.jade](../../../../client/components/sidebar/sidebar.jade).
The list is published by `boardBackgrounds` in
[server/publications/backgrounds.js](../../../../server/publications/backgrounds.js)
to members and to readers of a board they may read. **Background Image URL**
calls `setBackgroundImageURL` in [models/boards.js](../../../../models/boards.js)
(board admins and site admins). Deleting calls `removeBoardBackground` in
[server/boardBackgrounds.js](../../../../server/boardBackgrounds.js): a board
admin or site admin only, it clears the board's active background when it was
that one, and soft-deletes the attachment, so the board's history can restore
it. The REST routes are in
[server/routes/attachmentApi.js](../../../../server/routes/attachmentApi.js)
and the DDP methods in
[server/attachmentApi.js](../../../../server/attachmentApi.js); a refused
download is recorded in Admin Panel → Problems. Which background a board shows
is decided by [models/lib/boardBackground.js](../../../../models/lib/boardBackground.js).

## Commits

 - [SVG is uploaded and shown as an image, a board background included](https://github.com/wekan/wekan/commit/0afb1336db10843ff3704a735274ceb3ef073b42)
 - [Stream attachment and background uploads and downloads over the REST API](https://github.com/wekan/wekan/commit/85a226433c16364b6c1dd6056273db2109cb6944)
 - [Restore models/lib/boardBackground.js, which the BackgroundBleed fix overwrote](https://github.com/wekan/wekan/commit/f9d9596e2a358a9ed62af87f3661ee0dc5f0a229)
 - [Fix BackgroundBleed: a board's background can only be one of its own attachments](https://github.com/wekan/wekan/commit/146d58df276a666c47cb70046ccedf37d1d0ec84)
 - [Attachments: soft delete on the card, restore from the card history, hard delete only with the archived board](https://github.com/wekan/wekan/commit/dce28983820f99927b2cb3626e586488c962e084)
 - [Board backgrounds: one entry, and the picture is the button](https://github.com/wekan/wekan/commit/2a50e7104c8c40c177f5403f39a3e06483f46199)
 - [Board background: the uploaded picture is listed, named and applied](https://github.com/wekan/wekan/commit/4b3a37b5a24f5bc62546df5308dc879187c2500f)
 - [Fix #4978: Board background now updates when switching boards via favorites bar](https://github.com/wekan/wekan/commit/8a8470772627aa4b315bdd01712d31051be87a74)
 - [Board background images stored in WeKan, with a much improved Trello import](https://github.com/wekan/wekan/commit/899617bd4d83905df05fd8aab1d26630e676fee5)
