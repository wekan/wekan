## Paste big JSON in Linux

1. Copy WeKan board JSON to clipboard

```
sudo apt install xclip

cat board.json | xclip -se c
```
2. At some Chromium-based browser, click right top your username / All Boards / New Board / From Previous Export.

3. At input field, right click / Paste as Text.

4. Click Import.

## Exporting very large boards (without attachments)

By default a board's JSON export includes its attachments as base64 data. For very
large boards this can overflow the JSON serializer, so there is an option to export
the board's **structure without the base64 attachment data**:

```
GET /api/boards/:boardId/export?attachments=false
```

The board export menu has a matching **Export / JSON (without attachments)** entry.
The default export (no `attachments=false`) still includes the attachments.

## JSON to SQLite3

```
sqlite3 wekan.db

.mode json

.load wekan-export-board.json board
```

To be continued