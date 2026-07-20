# Board Background Images

Board background images can be **stored in WeKan** itself.

## How it works

- A `backgrounds` file-storage directory is created alongside `attachments` and
  `avatars`, using the current default storage backend.
- **Board menu → Board backgrounds** lets a board admin:
  - upload background images,
  - set one as the active board background,
  - download images,
  - and delete them.
- The active background image is also shown as the board's tile background on the
  **All Boards** list page (a dark overlay keeps the board title readable).

## Import and export

- **Board export** includes the board's background images, and re-imports them.
- A **Trello** board's background image is downloaded and stored on import, so it
  keeps working even if the original Trello URL later changes.

## REST API

Board background images can be uploaded and downloaded over the REST API — the
background counterpart of the card-attachment upload/download API. Uploads use the
current **Admin Panel / Attachments / Default Storage** backend (the same storage as
card attachments) and set the uploaded image as the board's active background.
Uploading requires board admin; downloading requires board membership.

| Method | Path | Purpose |
| --- | --- | --- |
| `POST` | `/api/attachment/upload-background` | Upload an image and set it as the board background. JSON body: `{ boardId, fileData (base64), fileName, fileType? }` |
| `GET` | `/api/attachment/download-background/:boardId` | Download the board's current background image (returns `base64Data` + metadata) |

```bash
python3 api.py uploadbackground BOARDID /path/to/background.png
python3 api.py downloadbackground BOARDID /path/to/saved-background.png
```

There is also a DDP method pair (`api.board.uploadBackground` /
`api.board.downloadBackground`) for SDK/DDP clients.

## Related

- [Boards](../Boards/Boards.md)
- [Attachments and File Storage](../../Cards/Attachments/Attachments.md)
- [Themes / Custom CSS](../../../Theme/Custom-CSS-themes.md)
- [Migrating from Trello](../../../ImportExport/trello/Migrating-from-Trello.md)
