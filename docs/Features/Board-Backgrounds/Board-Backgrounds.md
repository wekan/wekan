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

## Import and export

- **Board export** includes the board's background images, and re-imports them.
- A **Trello** board's background image is downloaded and stored on import, so it
  keeps working even if the original Trello URL later changes.

## Related

- [Boards](../Boards/Boards.md)
- [Themes / Custom CSS](../../Theme/Custom-CSS-themes.md)
- [Migrating from Trello](../../ImportExport/trello/Migrating-from-Trello.md)
