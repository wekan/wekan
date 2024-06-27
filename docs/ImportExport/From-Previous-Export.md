## Paste big JSON in Linux

1. Copy WeKan board JSON to clipboard

```
sudo apt install xclip

cat board.json | xclip -se c
```
2. At some Chromium-based browser, click right top your username / All Boards / New Board / From Previous Export.

3. At input field, right click / Paste as Text.

4. Click Import.

## JSON to SQLite3

```
sqlite3 wekan.db

.mode json

.load wekan-export-board.json board
```

To be continued